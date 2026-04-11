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

function createPlaceholderDiffCell(sourceCell, title) {
    const diffCell = sourceCell.cloneNode(true);
    const diffCellSpans = diffCell.querySelectorAll("span");

    if (diffCellSpans.length >= 3) {
        diffCellSpans[0].textContent = "n/a";
        diffCellSpans[1].textContent = "n/a";
        diffCellSpans[2].textContent = "n/a";
    } else {
        diffCell.innerHTML = "n/a<br>n/a<br>n/a<br>";
    }

    diffCell.setAttribute("title", title);
    diffCell.classList.add("fndd-plugin-column");
    return diffCell;
}

function createUnavailableDiffCell(sourceCell) {
    return createPlaceholderDiffCell(sourceCell, "Keine Kursdaten verfuegbar");
}

function createPendingDiffCell(sourceCell) {
    return createPlaceholderDiffCell(sourceCell, "Noch kein vorheriger Snapshot vorhanden");
}

function renderDiffCell(parsedRow, lastShareEntry, diffValues, positionIdentity) {
    const diffCell = parsedRow.performanceCell.cloneNode(true);
    diffCell.classList.add("fndd-plugin-column");

    const diffCellSpans = diffCell.querySelectorAll("span");
    if (diffCellSpans.length < 3) {
        logWarn(`Skipping row '${parsedRow.shareName}' because cloned diff cell is incomplete`);
        return null;
    }

    diffCellSpans[0].innerHTML = formatEuro(diffValues.currentValueDiff);
    diffCellSpans[1].innerHTML = formatPercent(diffValues.percentageDiff);
    diffCellSpans[2].innerHTML = formatEuro(diffValues.sinceBuyDiff);
    updateDiffSpanColor(diffCellSpans[0], diffValues.currentValueDiff);
    updateDiffSpanColor(diffCellSpans[1], diffValues.percentageDiff);
    updateDiffSpanColor(diffCellSpans[2], diffValues.sinceBuyDiff);

    const previousCurrentValue = formatEuro(getEntryCurrentValue(lastShareEntry));
    const tooltipLines = [
        `Kursdifferenz: ${formatEuro(parsedRow.currentValue)} - ${previousCurrentValue} = ${formatEuro(diffValues.currentValueDiff)}`,
        `Prozentdifferenz: (${formatEuro(parsedRow.currentValue)} - ${previousCurrentValue}) / ${previousCurrentValue} = ${formatPercent(diffValues.percentageDiff)}`,
        `Gesamtdifferenz: ${formatEuro(parsedRow.sinceBuyValue)} - ${formatEuro(getEntryValueSinceBuy(lastShareEntry))} = ${formatEuro(diffValues.sinceBuyDiff)}`,
        `Snapshot: ${formatSnapshotTimestamp(lastShareEntry?.timestamp)}`
    ];

    if (positionIdentity.mode !== "stable") {
        tooltipLines.push(`Matching: degradiert via ${positionIdentity.reason}`);
    }

    if (testPriceJitterEnabled) {
        tooltipLines.push(`Testmodus: simulierte Kursbewegung ±${testPriceJitterPercent} %`);
    }

    diffCell.setAttribute("title", tooltipLines.join("\n"));
    return diffCell;
}

function ensurePluginColumnStyles() {
    if (document.getElementById("fndd-plugin-column-styles")) {
        return;
    }

    const styleElement = document.createElement("style");
    styleElement.id = "fndd-plugin-column-styles";
    styleElement.textContent = `
        .fndd-plugin-column {
            background: rgba(113, 169, 253, 0.06);
            border-left: 1px solid rgba(113, 169, 253, 0.18);
            border-right: 1px solid rgba(113, 169, 253, 0.18);
        }

        .fndd-plugin-column-header {
            background: rgba(113, 169, 253, 0.10);
            border-left: 1px solid rgba(113, 169, 253, 0.18);
            border-right: 1px solid rgba(113, 169, 253, 0.18);
            box-shadow: inset 0 -2px 0 rgba(113, 169, 253, 0.35);
        }

        .fndd-plugin-column-header a {
            font-weight: 600;
        }

    `;

    document.head.appendChild(styleElement);
}

function updateDiffSpanColor(spanElement, value) {
    if (!spanElement) {
        return;
    }

    spanElement.classList.remove("font-color-green", "font-color-red");

    if (value > 0) {
        spanElement.classList.add("font-color-green");
    } else if (value < 0) {
        spanElement.classList.add("font-color-red");
    }
}

function getPositionQuantity(positionRow, columnMap) {
    const quantityText = positionRow.querySelectorAll("td")[columnMap.name]?.querySelector("strong")?.textContent;
    return extractNumber(quantityText) || 0;
}

function applyTestPriceJitter(parsedRow) {
    if (!testPriceJitterEnabled) {
        return parsedRow;
    }

    const direction = getDeterministicTestPriceDirection(parsedRow.positionIdentity.storageKey);
    const multiplier = 1 + ((testPriceJitterPercent / 100) * direction);
    const adjustedCurrentValue = parsedRow.currentValue * multiplier;
    const offset = adjustedCurrentValue - parsedRow.currentValue;
    const adjustedAbsolutePerformance = parsedRow.absolutePerformance + offset;
    const buyPrice = parsedRow.currentValue - parsedRow.absolutePerformance;
    const adjustedPercentagePerformance = buyPrice !== 0
        ? (adjustedAbsolutePerformance / buyPrice) * 100
        : parsedRow.percentagePerformance;
    const adjustedSinceBuyValue = parsedRow.sinceBuyValue + (offset * parsedRow.quantity);

    return {
        ...parsedRow,
        currentValue: adjustedCurrentValue,
        absolutePerformance: adjustedAbsolutePerformance,
        percentagePerformance: adjustedPercentagePerformance,
        sinceBuyValue: adjustedSinceBuyValue
    };
}

function updatePositionRowDisplay(positionRow, columnMap, targetColumnIndex, effectiveRow) {
    const cells = positionRow.querySelectorAll("td");
    const currentValueCell = cells[columnMap.currentValue];
    const currentValueStrongElements = currentValueCell?.querySelectorAll("strong") || [];
    if (currentValueStrongElements.length >= 2) {
        currentValueStrongElements[0].innerHTML = formatEuro(effectiveRow.currentValue);
        currentValueStrongElements[1].innerHTML = formatEuro(effectiveRow.currentValue * effectiveRow.quantity);
    }

    const performanceCell = cells[targetColumnIndex];
    const performanceSpans = performanceCell?.querySelectorAll("span") || [];
    if (performanceSpans.length >= 3) {
        performanceSpans[0].innerHTML = formatEuro(effectiveRow.absolutePerformance);
        performanceSpans[1].innerHTML = formatPercent(effectiveRow.percentagePerformance);
        performanceSpans[2].innerHTML = formatEuro(effectiveRow.sinceBuyValue);
    }
}

function updatePortfolioSummaryDisplay(totalValueDelta) {
    if (!testPriceJitterEnabled || totalValueDelta === 0) {
        return;
    }

    const perfGesamtDiv = findDivWithText("Perf. gesamt");
    if (!perfGesamtDiv?.parentNode) {
        return;
    }

    const parentDiv = perfGesamtDiv.parentNode;
    const performanceEuroElement = findElementWithText(parentDiv, "span", "EUR") || findElementWithText(parentDiv, "span", "€");
    const performancePercentageElement = findElementWithText(parentDiv, "span", "%");
    const gesamtwertLabel = findDivWithText("Gesamtwert");
    const gesamtwertElement = gesamtwertLabel?.parentNode?.children?.[1];

    if (!performanceEuroElement || !performancePercentageElement || !gesamtwertElement) {
        return;
    }

    const currentTotalValue = extractNumber(gesamtwertElement.innerHTML);
    const currentAbsolutePerformance = extractNumber(performanceEuroElement.innerHTML);
    const buyPrice = currentTotalValue - currentAbsolutePerformance;
    const adjustedTotalValue = currentTotalValue + totalValueDelta;
    const adjustedAbsolutePerformance = currentAbsolutePerformance + totalValueDelta;
    const adjustedPercentagePerformance = buyPrice !== 0
        ? (adjustedAbsolutePerformance / buyPrice) * 100
        : extractNumber(performancePercentageElement.innerHTML);

    gesamtwertElement.innerHTML = formatEuro(adjustedTotalValue);
    performanceEuroElement.innerHTML = formatEuro(adjustedAbsolutePerformance);
    performancePercentageElement.innerHTML = formatPercent(adjustedPercentagePerformance);
}

function applyTestPriceSimulationToPortfolio() {
    if (!testPriceJitterEnabled) {
        return;
    }

    const tableState = getPortfolioTableState();
    if (!tableState) {
        return;
    }

    const productNameList = [];
    let totalValueDelta = 0;

    tableState.tbodyRows.forEach(function(positionRow) {
        if (positionRow.querySelectorAll("td").length <= 2 || positionRow.getElementsByClassName("message--warning").length > 0) {
            return;
        }

        const parsedRow = parsePositionRow(positionRow, tableState.columnMap, productNameList, tableState.targetColumnIndex);
        if (!parsedRow) {
            return;
        }

        const effectiveRow = applyTestPriceJitter(parsedRow);
        totalValueDelta += (effectiveRow.currentValue - parsedRow.currentValue) * parsedRow.quantity;
        updatePositionRowDisplay(positionRow, tableState.columnMap, tableState.targetColumnIndex, effectiveRow);
    });

    updatePortfolioSummaryDisplay(totalValueDelta);
}

function setRowDiffSortValues(positionRow, diffValues, isSortable) {
    positionRow.dataset.lastDiffSortable = isSortable ? "true" : "false";
    positionRow.dataset.lastDiffEuroValue = isSortable ? String(diffValues.currentValueDiff) : "";
    positionRow.dataset.lastDiffPercentValue = isSortable ? String(diffValues.percentageDiff) : "";
    positionRow.dataset.lastDiffSumValue = isSortable ? String(diffValues.sinceBuyDiff) : "";
}

function insertDiffCell(positionRow, diffCell, referenceCell, diffValues, isSortable) {
    setRowDiffSortValues(positionRow, diffValues, isSortable);
    positionRow.insertBefore(diffCell, referenceCell);
}

function sortRowsByLastDiff(tableState, direction, valueKey) {
    const tbody = tableState.table.querySelector("tbody");
    if (!tbody) {
        return;
    }

    const rows = Array.from(tableState.tbodyRows);
    rows.sort(function(a, b) {
        const aSortable = a.dataset.lastDiffSortable === "true";
        const bSortable = b.dataset.lastDiffSortable === "true";

        if (aSortable && !bSortable) {
            return -1;
        }

        if (!aSortable && bSortable) {
            return 1;
        }

        if (!aSortable && !bSortable) {
            return 0;
        }

        const aValue = Number(a.dataset[valueKey]);
        const bValue = Number(b.dataset[valueKey]);

        return direction === "desc" ? bValue - aValue : aValue - bValue;
    });

    rows.forEach(function(row) {
        tbody.appendChild(row);
    });
}

function clearCustomSortIndicators(tableState) {
    if (!tableState.sortLinks) {
        return;
    }

    tableState.sortLinks.forEach(function(sortLink) {
        sortLink.dataset.sortDirection = "";
        sortLink.textContent = sortLink.dataset.sortLabel;
    });
}

function clearNativeSortIndicators(tableState) {
    tableState.headerRow.querySelectorAll(".icon--sort-up, .icon--sort-down").forEach(function(sortIcon) {
        sortIcon.remove();
    });
}

function attachCustomSort(tableState, sortHeaderLink, config) {
    if (!sortHeaderLink) {
        return;
    }

    const updateHeaderLabel = function(direction) {
        if (!direction) {
            sortHeaderLink.textContent = config.label;
            return;
        }

        sortHeaderLink.textContent = direction === "desc"
            ? `${config.label} ▼`
            : `${config.label} ▲`;
    };

    sortHeaderLink.style.cursor = "pointer";
    sortHeaderLink.setAttribute("href", "#");
    sortHeaderLink.dataset.sortDirection = "";
    sortHeaderLink.dataset.sortLabel = config.label;
    updateHeaderLabel("");

    sortHeaderLink.addEventListener("click", function(event) {
        event.preventDefault();
        const currentDirection = sortHeaderLink.dataset.sortDirection === "desc"
            ? "desc"
            : sortHeaderLink.dataset.sortDirection === "asc"
                ? "asc"
                : "";
        const nextDirection = currentDirection === "desc" ? "asc" : "desc";

        clearCustomSortIndicators(tableState);
        clearNativeSortIndicators(tableState);
        sortRowsByLastDiff(tableState, nextDirection, config.valueKey);
        sortHeaderLink.dataset.sortDirection = nextDirection;
        updateHeaderLabel(nextDirection);
    });
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
        quantity: getPositionQuantity(positionRow, columnMap),
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

function saveParsedRowSnapshot(parsedRow, lastShareEntry, shouldPersistSnapshot) {
    const positionStorageKey = parsedRow.positionIdentity.storageKey;

    const shouldSaveMissingSnapshot = !lastShareEntry;

    if ((shouldPersistSnapshot || shouldSaveMissingSnapshot) && hasSnapshotValuesChanged(lastShareEntry, {
        currentValue: parsedRow.currentValue,
        absolutePerformance: parsedRow.absolutePerformance,
        sinceBuyValue: parsedRow.sinceBuyValue
    })) {
        saveToDatabase(
            DATABASE_KEY,
            parsedRow.shareName,
            parsedRow.currentValue,
            parsedRow.absolutePerformance,
            parsedRow.sinceBuyValue,
            positionStorageKey
        );
    }
}

function refreshPositionSnapshots(shouldPersistSnapshot) {
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

        const positionStorageKey = parsedRow.positionIdentity.storageKey;
        const sharesZuletzt = createMap(loadFromDatabase(DATABASE_KEY));
        const lastShareEntry = sharesZuletzt.get(positionStorageKey);

        saveParsedRowSnapshot(parsedRow, lastShareEntry, shouldPersistSnapshot);
        refreshedCount += 1;
    });

    return { refreshedCount: refreshedCount };
}

function addNewColumnHeader(shouldPersistSnapshot) {
    const tableState = getPortfolioTableState();
    if (!tableState) {
        return;
    }

    ensurePluginColumnStyles();

    // If the target column with "± gesamt" is found, add a new column
    if (tableState.targetColumnIndex !== -1 && tableState.thGesamt && tableState.columnMap.name !== -1 && tableState.columnMap.currentValue !== -1) {
        let productNameList=[];

        var thNew = tableState.thGesamt.cloneNode(true);
        thNew.classList.add("fndd-plugin-column", "fndd-plugin-column-header");
        thNew.querySelectorAll(".icon--sort-up, .icon--sort-down").forEach(function(sortIcon) {
            sortIcon.remove();
        });
        const headerLinks = thNew.querySelectorAll('th a');
        if (headerLinks.length < 3) {
            logWarn("Expected header links for duplicated column not found");
            return;
        }
        headerLinks[0].innerHTML = "± zuletzt";
        headerLinks[0].title = "Wertentwicklung dieser Position in Euro seit letztem Abruf";
        headerLinks[0].setAttribute("href", "#");

        headerLinks[1].innerHTML = "% zuletzt";
        headerLinks[1].title = "Wertentwicklung dieser Position in % seit letztem Abruf";
        headerLinks[1].setAttribute("href", "#");

        headerLinks[2].innerHTML = "∑ zuletzt";
        headerLinks[2].title = "Gesamte Wertentwicklung aller Positionen in Euro seit letztem Abruf";
        headerLinks[2].setAttribute("href", "#");
        tableState.headerRow.insertBefore(thNew, tableState.thGesamt);
        tableState.sortLinks = [headerLinks[0], headerLinks[1], headerLinks[2]];
        attachCustomSort(tableState, headerLinks[0], {
            label: "± zuletzt",
            valueKey: "lastDiffEuroValue"
        });
        attachCustomSort(tableState, headerLinks[1], {
            label: "% zuletzt",
            valueKey: "lastDiffPercentValue"
        });
        attachCustomSort(tableState, headerLinks[2], {
            label: "∑ zuletzt",
            valueKey: "lastDiffSumValue"
        });

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

                    insertDiffCell(positionRow, createUnavailableDiffCell(warningPerformanceCell), warningPerformanceCell, {
                        currentValueDiff: 0,
                        percentageDiff: 0,
                        sinceBuyDiff: 0
                    }, false);
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
                    sinceBuyValue: parsedRow.sinceBuyValue
                });

                saveParsedRowSnapshot(parsedRow, lastShareEntry, shouldPersistSnapshot);

                if (!lastShareEntry) {
                    logInfo(`No previous entry found for '${shareName}', rendering placeholder diff column`);
                    insertDiffCell(positionRow, createPendingDiffCell(parsedRow.performanceCell), parsedRow.performanceCell, {
                        currentValueDiff: 0,
                        percentageDiff: 0,
                        sinceBuyDiff: 0
                    }, false);
                    return;
                }

                const renderedDiffCell = renderDiffCell(parsedRow, lastShareEntry, diffValues, positionIdentity);
                if (!renderedDiffCell) {
                    return;
                }

                insertDiffCell(positionRow, renderedDiffCell, parsedRow.performanceCell, diffValues, true);

            }

        });
    }
}
