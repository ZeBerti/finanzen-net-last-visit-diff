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

function createUnavailableDiffCell(sourceCell) {
    const diffCell = sourceCell.cloneNode(true);
    const diffCellSpans = diffCell.querySelectorAll("span");

    if (diffCellSpans.length >= 3) {
        diffCellSpans[0].textContent = "n/a";
        diffCellSpans[1].textContent = "n/a";
        diffCellSpans[2].textContent = "n/a";
    } else {
        diffCell.innerHTML = "n/a<br>n/a<br>n/a<br>";
    }

    diffCell.setAttribute("title", "Keine Kursdaten verfuegbar");
    return diffCell;
}

function createPendingDiffCell(sourceCell) {
    const diffCell = sourceCell.cloneNode(true);
    const diffCellSpans = diffCell.querySelectorAll("span");

    if (diffCellSpans.length >= 3) {
        diffCellSpans[0].textContent = "n/a";
        diffCellSpans[1].textContent = "n/a";
        diffCellSpans[2].textContent = "n/a";
    } else {
        diffCell.innerHTML = "n/a<br>n/a<br>n/a<br>";
    }

    diffCell.setAttribute("title", "Noch kein vorheriger Snapshot vorhanden");
    return diffCell;
}

function parsePositionRow(positionRow, columnMap, productNameList, targetColumnIndex) {
    const cells = positionRow.querySelectorAll("td");
    if (cells.length <= targetColumnIndex || cells.length <= columnMap.currentValue || cells.length <= columnMap.name) {
        logWarn("Skipping row with unexpected cell count");
        return null;
    }

    const shareNameElement = cells[columnMap.name]?.querySelectorAll("a")[0];
    const shareName = shareNameElement ? shareNameElement.innerHTML : "N/A";
    productNameList.push(shareName);
    const productIndex = productNameList.filter(product => product === shareName).length;
    const positionIdentity = resolvePositionIdentity(positionRow, shareName, productIndex);

    if (positionIdentity.mode === "degraded") {
        logWarn(`Degraded matching for '${shareName}' via ${positionIdentity.reason}`);
    }

    const currentValue = extractNumber(cells[columnMap.currentValue].querySelectorAll("strong")[0]?.innerHTML);
    const performanceCell = cells[targetColumnIndex];
    const performanceSpans = performanceCell.querySelectorAll("span");
    if (performanceSpans.length < 3) {
        logWarn(`Skipping row '${shareName}' because summary spans are missing`);
        return null;
    }

    return {
        shareName: shareName,
        productIndex: productIndex,
        positionIdentity: positionIdentity,
        currentValue: currentValue,
        absolutePerformance: extractNumber(performanceSpans[0].innerHTML),
        percentagePerformance: extractNumber(performanceSpans[1].innerHTML),
        sinceBuyValue: extractNumber(performanceSpans[2].innerHTML),
        performanceCell: performanceCell
    };
}

function getPortfolioTableState() {
    const table = document.querySelector(".table--content-right");
    if (!table) {
        logWarn("Portfolio table not found");
        return null;
    }

    const headerCells = table.querySelectorAll(".table__th");
    const columnMap = buildColumnMap(headerCells);
    let targetColumnIndex = columnMap.absolutePerformance;
    let thGesamt = null;

    headerCells.forEach(function(headerCell, index) {
        const linksInHeaderCell = headerCell.querySelectorAll("a");
        linksInHeaderCell.forEach(function(headerLink) {
            if (headerLink.innerHTML.trim() === "± gesamt") {
                targetColumnIndex = index;
                thGesamt = headerLink.parentNode;
            }
        });
    });

    if (targetColumnIndex === -1 || !thGesamt || columnMap.name === -1 || columnMap.currentValue === -1) {
        logWarn("Required portfolio columns not found");
        return null;
    }

    const headerRows = table.querySelectorAll("thead .table__tr");
    const headerRow = headerRows[0];
    if (!headerRow) {
        logWarn("Table header row not found");
        return null;
    }

    return {
        table: table,
        columnMap: columnMap,
        targetColumnIndex: targetColumnIndex,
        thGesamt: thGesamt,
        headerRow: headerRow,
        tbodyRows: table.querySelectorAll("tbody .table__tr")
    };
}

function saveParsedRowSnapshot(parsedRow, forceRefreshSnapshot) {
    const positionStorageKey = parsedRow.positionIdentity.storageKey;
    const sharesZuletzt = createMap(loadFromDatabase(DATABASE_KEY));
    const lastShareEntry = sharesZuletzt.get(positionStorageKey);

    if (forceRefreshSnapshot || shouldRefreshSnapshot(lastShareEntry, SNAPSHOT_MIN_AGE_MS)) {
        saveToDatabase(
            DATABASE_KEY,
            parsedRow.shareName,
            parsedRow.productIndex,
            parsedRow.currentValue,
            parsedRow.absolutePerformance,
            parsedRow.percentagePerformance,
            parsedRow.sinceBuyValue,
            positionStorageKey
        );
    } else {
        logInfo(`Skipping snapshot refresh for '${parsedRow.shareName}' because the last snapshot is younger than 2 hours.`);
    }

    return lastShareEntry;
}

function refreshPositionSnapshots(forceRefreshSnapshot) {
    const tableState = getPortfolioTableState();
    if (!tableState) {
        return { refreshedCount: 0 };
    }

    const productNameList = [];
    let refreshedCount = 0;

    tableState.tbodyRows.forEach(function(positionRow) {
        if (positionRow.querySelectorAll("td").length <= 2 || positionRow.getElementsByClassName("message--warning").length > 0) {
            return;
        }

        const parsedRow = parsePositionRow(positionRow, tableState.columnMap, productNameList, tableState.targetColumnIndex);
        if (!parsedRow) {
            return;
        }

        saveParsedRowSnapshot(parsedRow, forceRefreshSnapshot);
        refreshedCount += 1;
    });

    return { refreshedCount: refreshedCount };
}

function addNewColumnHeader() {
    const tableState = getPortfolioTableState();
    if (!tableState) {
        return;
    }

    // If the target column with "± gesamt" is found, add a new column
    if (tableState.targetColumnIndex !== -1 && tableState.thGesamt && tableState.columnMap.name !== -1 && tableState.columnMap.currentValue !== -1) {
        let productNameList=[];

        var thNew = tableState.thGesamt.cloneNode(true);
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


        tableState.headerRow.insertBefore(thNew, tableState.thGesamt);

        const sharesZuletzt = createMap(loadFromDatabase(DATABASE_KEY));

        // ____________________________
        // alle positionen loopen und Tabelle je Zeile erweitern
        tableState.tbodyRows.forEach(function(positionRow) {

            // ignore "info-elements"
            if(positionRow.querySelectorAll("td").length > 2) {
                if (positionRow.getElementsByClassName("message--warning").length > 0) {
                    const warningPerformanceCell = positionRow.querySelectorAll("td")[tableState.targetColumnIndex];
                    if (!warningPerformanceCell) {
                        logWarn("Skipping warning row because performance cell is missing");
                        return;
                    }

                    positionRow.insertBefore(createUnavailableDiffCell(warningPerformanceCell), warningPerformanceCell);
                    return;
                }

                const parsedRow = parsePositionRow(positionRow, tableState.columnMap, productNameList, tableState.targetColumnIndex);
                if (!parsedRow) {
                    return;
                }

                const shareName = parsedRow.shareName;
                const positionIdentity = parsedRow.positionIdentity;
                const positionStorageKey = positionIdentity.storageKey;
                const lastShareEntry = sharesZuletzt.get(positionStorageKey);
                const diffValues = calculateDiffValues(lastShareEntry, {
                    currentValue: parsedRow.currentValue,
                    absolutePerformance: parsedRow.absolutePerformance,
                    percentagePerformance: parsedRow.percentagePerformance,
                    sinceBuyValue: parsedRow.sinceBuyValue
                });

                saveParsedRowSnapshot(parsedRow, false);

                let tdCopy = parsedRow.performanceCell.cloneNode(true);

                if (!lastShareEntry) {
                    logInfo(`No previous entry found for '${shareName}', rendering placeholder diff column`);
                    positionRow.insertBefore(createPendingDiffCell(parsedRow.performanceCell), parsedRow.performanceCell);
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

                tdCopy.setAttribute("title", "Aktueller Kurs: " + getEntryCurrentValue(lastShareEntry) + " - " + parsedRow.currentValue +
                 "\nProzent: " + formatPercent(diffValues.percentageDiff) +
                 "\nSeit Kauf: " + formatEuro(diffValues.sinceBuyDiff) +
                 "\nMatching: " + (positionIdentity.mode === "stable" ? "stabil via pkdepdatennr" : `degradiert via ${positionIdentity.reason}`) +
                 "\nSnapshot-Alter: " + formatSnapshotAge(lastShareEntry));
                positionRow.insertBefore(tdCopy, parsedRow.performanceCell);

            }

        });
    }
}
