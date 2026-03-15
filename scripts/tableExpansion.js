LOGLEVEL = "DEBUG";

function customLog(content, level) {
    const effectiveLevel = level || LOGLEVEL;

    switch (effectiveLevel) {
        case "DEBUG":
            console.log(content);
            break;
        case "INFO":
            console.info(content);
            break;
        case "WARN":
            console.warn(content);
            break;
        case "ERROR":
            console.error(content);
            break;
    }
}

function extractDepotEntryId(positionRow) {
    const sellLink = positionRow.querySelector('a[href*="pkdepdatennr="]');
    if (!sellLink) {
        return null;
    }

    try {
        const sellUrl = new URL(sellLink.href, window.location.origin);
        return sellUrl.searchParams.get('pkdepdatennr');
    } catch (error) {
        customLog(`Failed to parse depot entry id: ${error}`, "WARN");
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


function addNewColumnHeader() {
    // Find the table element
    var table = document.querySelector('.table--content-right');
    if (!table) {
        customLog("Portfolio table not found", "WARN");
        return;
    }
    let productNameList=[];

    // Find the header cell containing "± gesamt"
    var headerCells = table.querySelectorAll('.table__th');
    customLog("header cells");
    customLog(headerCells);
    var targetColumnIndex = -1;
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
    customLog("targetColumnIndex: " + targetColumnIndex)

    // If the target column with "± gesamt" is found, add a new column
    if (targetColumnIndex !== -1 && thGesamt) {

        // die erste Row ist der Header der Tabelle
        var rows = table.querySelectorAll('thead .table__tr');
        var tbodyRows = table.querySelectorAll('tbody .table__tr');

        let row = rows[0];
        if (!row) {
            customLog("Table header row not found", "WARN");
            return;
        }

        var thNew = thGesamt.cloneNode(true);
        const headerLinks = thNew.querySelectorAll('th a');
        if (headerLinks.length < 3) {
            customLog("Expected header links for duplicated column not found", "WARN");
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
                if (cells.length <= 4) {
                    customLog("Skipping row with unexpected cell count", "WARN");
                    return;
                }

                // index 1: name der aktie
                let shareNameElement = cells[1]?.querySelectorAll("a")[0];
                let shareName = shareNameElement ? shareNameElement.innerHTML : "N/A";
                productNameList.push(shareName);
                let numberOfProduct = productNameList.filter(product => product === shareName).length;
                const positionIdentity = resolvePositionIdentity(positionRow, shareName, numberOfProduct);
                const positionStorageKey = positionIdentity.storageKey;
                if (positionIdentity.mode === "degraded") {
                    customLog(`Degraded matching for '${shareName}' via ${positionIdentity.reason}`, "WARN");
                }

                //index 2: Aktueller Kurs / Wert
                let aktuellerKurs = extractNumber(cells[2].querySelectorAll("strong")[0]?.innerHTML);

                // index 4: gesamt-Wert. hier muss ein before hin
                const gesamtCell = cells[4];
                const gesamtSpans = gesamtCell.querySelectorAll("span");
                if (gesamtSpans.length < 3) {
                    customLog(`Skipping row '${shareName}' because summary spans are missing`, "WARN");
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

                    customLog("gesamtEur/%/wertentwSeitKaufAbs: " + gesamtEuro + " " + gesamtProzent + " " + gesamtDomSeitKauf);

                    saveToDatabase(DATABASE_KEY, shareName, numberOfProduct, aktuellerKurs, gesamtEuro, gesamtProzent, gesamtDomSeitKauf, positionStorageKey);
                    customLog(shareName + " saved to " + DATABASE_KEY);

                    // Diff anzeigen von zuletzt und aktuell
                    if(lastShareEntry) {
                        customLog(shareName + " previous absolute performance - current absolute performance");
                        customLog(getEntryAbsolutePerformance(lastShareEntry) + " - " + gesamtEuro + " = ") ;
                        customLog(diffValues?.absolutePerformanceDiff);
                    }
                }

                let tdCopy = gesamtCell.cloneNode(true);

                if (!lastShareEntry) {
                    customLog(`No previous entry found for '${shareName}', skipping diff column`, "INFO");
                    return;
                }

                const tdCopySpans = tdCopy.querySelectorAll('span');
                if (tdCopySpans.length < 3) {
                    customLog(`Skipping row '${shareName}' because cloned diff cell is incomplete`, "WARN");
                    return;
                }

                tdCopySpans[0].innerHTML = formatEuro(diffValues.currentValueDiff);
                tdCopySpans[1].innerHTML = formatPercent(diffValues.percentageDiff);
                tdCopySpans[2].innerHTML = formatEuro(diffValues.sinceBuyDiff);

                tdCopy.setAttribute("title", "Aktueller Kurs: " + getEntryCurrentValue(lastShareEntry) + " - " + aktuellerKurs +
                 "\nProzent: " + formatPercent(diffValues.percentageDiff) +
                 "\nSeit Kauf: " + formatEuro(diffValues.sinceBuyDiff) +
                 "\nMatching: " + (positionIdentity.mode === "stable" ? "stabil via pkdepdatennr" : `degradiert via ${positionIdentity.reason}`) +
                 "\nZuletzt aktualisiert: " + (lastShareEntry.timestamp || "unbekannt"));
                positionRow.insertBefore(tdCopy, gesamtCell);

            }

        });

        // jetzt muss die tabelle neben dem header eine weitere spalte erhalten!
        // document.querySelectorAll("table tbody tr") -> darüber loopen und an pos td=5 before einfügen
        let tbody = row.parentNode.parentNode.parentNode.querySelectorAll("tbody");

            customLog("1 Tbody n:");
            customLog(tbody);
        // Alle Positionen durchgehen und den "zuletzt" -Wert einfügen

        customLog("row");
        customLog(row);
        customLog("tbody");
        customLog(tbody);

    }
}
