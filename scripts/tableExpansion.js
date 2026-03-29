function extractDepotEntryId(positionRow) {
    const sellLink = positionRow.querySelector('a[href*="pkdepdatennr="]');
    if (!sellLink) {
        return null;
    }

    try {
        const sellUrl = new URL(sellLink.href, window.location.origin);
        return sellUrl.searchParams.get('pkdepdatennr');
    } catch (error) {
        logWarn(`Failed to parse depot entry id: ${error}`);
        return null;
    }
}

function extractInstrumentIsin(positionRow) {
    const isinInput = positionRow.querySelector('input[name="stISIN"]');
    return isinInput?.value || null;
}

function resolvePositionIdentity(positionRow, shareName, productIndex) {
    const depotEntryId = extractDepotEntryId(positionRow);
    if (depotEntryId) {
        return {
            storageKey: `depot-entry:${depotEntryId}`,
            mode: "stable",
            reason: "pkdepdatennr"
        };
    }

    const isin = extractInstrumentIsin(positionRow);
    if (isin) {
        return {
            storageKey: `isin:${isin}#${productIndex}`,
            mode: "degraded",
            reason: "isin"
        };
    }

    return {
        storageKey: `name:${shareName}#${productIndex}`,
        mode: "degraded",
        reason: "name-index"
    };
}

function normalizeHeaderText(headerCell) {
    return headerCell.textContent
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function buildColumnMap(headerCells) {
    const columnMap = {
        name: -1,
        currentValue: -1,
        absolutePerformance: -1
    };

    headerCells.forEach(function(headerCell, index) {
        const headerText = normalizeHeaderText(headerCell);

        if (columnMap.name === -1 && headerText.includes("stück") && headerText.includes("name")) {
            columnMap.name = index;
        }

        if (columnMap.currentValue === -1 && headerText.includes("akt. kurs")) {
            columnMap.currentValue = index;
        }

        if (columnMap.absolutePerformance === -1 && headerText.includes("± gesamt")) {
            columnMap.absolutePerformance = index;
        }
    });

    return columnMap;
}


function addNewColumnHeader() {
    // Find the table element
    var table = document.querySelector('.table--content-right');
    if (!table) {
        logWarn("Portfolio table not found");
        return;
    }
    let productNameList=[];

    // Find the header cell containing "± gesamt"
    var headerCells = table.querySelectorAll('.table__th');
    const columnMap = buildColumnMap(headerCells);
    var targetColumnIndex = columnMap.absolutePerformance;
    let thGesamt = null;
    headerCells.forEach(function(headerCell, index) {
        var linksInHeaderCell = headerCell.querySelectorAll('a');
        linksInHeaderCell.forEach(function(headerCell2, index2) {
            if (headerCell2.innerHTML.trim() === '± gesamt') {
                targetColumnIndex = index;
                thGesamt = headerCell2.parentNode;
            }
        });
    });

    // If the target column with "± gesamt" is found, add a new column
    if (targetColumnIndex !== -1 && thGesamt && columnMap.name !== -1 && columnMap.currentValue !== -1) {

        // die erste Row ist der Header der Tabelle
        var rows = table.querySelectorAll('thead .table__tr');
        var tbodyRows = table.querySelectorAll('tbody .table__tr');

        let row = rows[0];
        if (!row) {
            logWarn("Table header row not found");
            return;
        }

        var thNew = thGesamt.cloneNode(true);
        const headerLinks = thNew.querySelectorAll('th a');
        if (headerLinks.length < 3) {
            logWarn("Expected header links for duplicated column not found");
            return;
        }
        headerLinks[0].innerHTML = "± zuletzt";
        headerLinks[0].title = "Wertentwicklung dieser Position in Euro seit letztem Abruf";
        headerLinks[0].removeAttribute("href");

        headerLinks[1].innerHTML = "% zuletzt";
        headerLinks[1].title = "Wertentwicklung dieser Position in % seit letztem Abruf";
        headerLinks[1].removeAttribute("href");

        headerLinks[2].innerHTML = "W.-entw. seit letz. Bes.";
        headerLinks[2].title = "Gesamte Wertentwicklung aller Positionen in Euro seit letztem Abruf";
        headerLinks[2].removeAttribute("href");


        row.insertBefore(thNew, thGesamt);

        const sharesZuletzt = createMap(loadFromDatabase(DATABASE_KEY));

        // ____________________________
        // alle positionen loopen und Tabelle je Zeile erweitern
        tbodyRows.forEach(function(positionRow) {

            // ignore "info-elements"
            if(positionRow.querySelectorAll("td").length > 2) {
                const cells = positionRow.querySelectorAll("td");
                if (cells.length <= targetColumnIndex || cells.length <= columnMap.currentValue || cells.length <= columnMap.name) {
                    logWarn("Skipping row with unexpected cell count");
                    return;
                }

                let shareNameElement = cells[columnMap.name]?.querySelectorAll("a")[0];
                let shareName = shareNameElement ? shareNameElement.innerHTML : "N/A";
                productNameList.push(shareName);
                let numberOfProduct = productNameList.filter(product => product === shareName).length;
                const positionIdentity = resolvePositionIdentity(positionRow, shareName, numberOfProduct);
                const positionStorageKey = positionIdentity.storageKey;
                if (positionIdentity.mode === "degraded") {
                    logWarn(`Degraded matching for '${shareName}' via ${positionIdentity.reason}`);
                }

                let aktuellerKurs = extractNumber(cells[columnMap.currentValue].querySelectorAll("strong")[0]?.innerHTML);

                const gesamtCell = cells[targetColumnIndex];
                const gesamtSpans = gesamtCell.querySelectorAll("span");
                if (gesamtSpans.length < 3) {
                    logWarn(`Skipping row '${shareName}' because summary spans are missing`);
                    return;
                }
                let gesamtEuro = extractNumber(gesamtSpans[0].innerHTML);
                let gesamtProzent = extractNumber(gesamtSpans[1].innerHTML);
                let gesamtDomSeitKauf = extractNumber(gesamtSpans[2].innerHTML);
                const lastShareEntry = sharesZuletzt.get(positionStorageKey);
                const diffValues = calculateDiffValues(lastShareEntry, {
                    currentValue: aktuellerKurs,
                    absolutePerformance: gesamtEuro,
                    percentagePerformance: gesamtProzent,
                    sinceBuyValue: gesamtDomSeitKauf
                });

                if(positionRow.getElementsByClassName("message--warning").length === 0) {
                    if (shouldRefreshSnapshot(lastShareEntry, SNAPSHOT_MIN_AGE_MS)) {
                        saveToDatabase(DATABASE_KEY, shareName, numberOfProduct, aktuellerKurs, gesamtEuro, gesamtProzent, gesamtDomSeitKauf, positionStorageKey);
                    } else {
                        logInfo(`Skipping snapshot refresh for '${shareName}' because the last snapshot is younger than 2 hours.`);
                    }
                }

                let tdCopy = gesamtCell.cloneNode(true);

                if (!lastShareEntry) {
                    logInfo(`No previous entry found for '${shareName}', skipping diff column`);
                    return;
                }

                const tdCopySpans = tdCopy.querySelectorAll('span');
                if (tdCopySpans.length < 3) {
                    logWarn(`Skipping row '${shareName}' because cloned diff cell is incomplete`);
                    return;
                }

                tdCopySpans[0].innerHTML = formatEuro(diffValues.currentValueDiff);
                tdCopySpans[1].innerHTML = formatPercent(diffValues.percentageDiff);
                tdCopySpans[2].innerHTML = formatEuro(diffValues.sinceBuyDiff);

                tdCopy.setAttribute("title", "Aktueller Kurs: " + getEntryCurrentValue(lastShareEntry) + " - " + aktuellerKurs +
                 "\nProzent: " + formatPercent(diffValues.percentageDiff) +
                 "\nSeit Kauf: " + formatEuro(diffValues.sinceBuyDiff) +
                 "\nMatching: " + (positionIdentity.mode === "stable" ? "stabil via pkdepdatennr" : `degradiert via ${positionIdentity.reason}`) +
                 "\nSnapshot-Alter: " + formatSnapshotAge(lastShareEntry));
                positionRow.insertBefore(tdCopy, gesamtCell);

            }

        });

        // jetzt muss die tabelle neben dem header eine weitere spalte erhalten!
        // document.querySelectorAll("table tbody tr") -> darüber loopen und an pos td=5 before einfügen
        row.parentNode.parentNode.parentNode.querySelectorAll("tbody");
    }
}
