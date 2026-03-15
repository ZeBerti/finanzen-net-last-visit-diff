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
                const lastShareEntry = sharesZuletzt.get(shareName);

                if(positionRow.getElementsByClassName("message--warning").length === 0) {

                    customLog("gesamtEur/%/wertentwSeitKaufAbs: " + gesamtEuro + " " + gesamtProzent + " " + gesamtDomSeitKauf);

                    saveToDatabase(DATABASE_KEY, shareName, numberOfProduct, aktuellerKurs, gesamtEuro, gesamtProzent, gesamtDomSeitKauf);
                    customLog(shareName + " saved to " + DATABASE_KEY);

                    // Diff anzeigen von zuletzt und aktuell
                    if(lastShareEntry) {
                        customLog(shareName + " sharesZuletzt.get(shareName).share_price) - extractNumber(gesamtEuro)");
                        customLog(lastShareEntry.share_price + " - " + gesamtEuro + " = ") ;
                        customLog(extractNumber(lastShareEntry.share_price) - extractNumber(gesamtEuro));
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

                let aktuellerKursZuletzt = extractNumber(lastShareEntry.aktuellerKurs) - aktuellerKurs;
                tdCopySpans[0].innerHTML = formatEuro(aktuellerKursZuletzt);
                tdCopySpans[1].innerHTML = formatPercent(extractNumber(lastShareEntry.percentage) - gesamtProzent);
                tdCopySpans[2].innerHTML = formatEuro(extractNumber(lastShareEntry.wertentwSeitKaufAbs) - gesamtDomSeitKauf);

                tdCopy.setAttribute("title", "Aktueller Kurs: " + extractNumber(lastShareEntry.aktuellerKurs) + " - " + aktuellerKurs +
                 "\nProzent: " + formatPercent(extractNumber(lastShareEntry.percentage) - gesamtProzent) +
                 "\nSeit Kauf: " + formatEuro(extractNumber(lastShareEntry.wertentwSeitKaufAbs) - gesamtDomSeitKauf) +
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
