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
    if (targetColumnIndex !== -1) {

        // die erste Row ist der Header der Tabelle
        var rows = table.querySelectorAll('thead .table__tr');
        var tbodyRows = table.querySelectorAll('tbody .table__tr');

        let row = rows[0];

        var thNew = thGesamt.cloneNode(true);
        thNew.querySelectorAll('th a')[0].innerHTML = "± zuletzt";
        thNew.querySelectorAll('th a')[0].title = "Wertentwicklung dieser Position in Euro seit letztem Abruf";
        thNew.querySelectorAll('th a')[0].removeAttribute("href");

        thNew.querySelectorAll('th a')[1].innerHTML = "% zuletzt";
        thNew.querySelectorAll('th a')[1].title = "Wertentwicklung dieser Position in % seit letztem Abruf";
        thNew.querySelectorAll('th a')[1].removeAttribute("href");

        thNew.querySelectorAll('th a')[2].innerHTML = "W.-entw. seit letz. Bes.";
        thNew.querySelectorAll('th a')[2].title = "Gesamte Wertentwicklung aller Positionen in Euro seit letztem Abruf";
        thNew.querySelectorAll('th a')[2].removeAttribute("href");


        row.insertBefore(thNew, thGesamt);

        sharesZuletzt = createMap(loadFromDatabase(DATABASE_KEY));

        // ____________________________
        // alle positionen loopen und Tabelle je Zeile erweitern
        tbodyRows.forEach(function(positionRow) {

            // ignore "info-elements"
            if(positionRow.querySelectorAll("td").length > 2) {

                // index 1: name der aktie
                let shareNameElement = positionRow.querySelectorAll("td")[1]?.querySelectorAll("a")[0];
                let shareName = shareNameElement ? shareNameElement.innerHTML : "N/A";
                productNameList.push(shareName);
                let numberOfProduct = productNameList.filter(product => product === "shareName").length;

                //index 2: Aktueller Kurs / Wert
                let aktuellerKurs = extractNumber(positionRow.querySelectorAll("td")[2].querySelectorAll("strong")[0]?.innerHTML);
                //aktuellerKurs = aktuellerKurs === undefined ? 0 : aktuellerKurs;

                // index 4: gesamt-Wert. hier muss ein before hin
                let gesamtEuro = extractNumber(positionRow.querySelectorAll("td")[4].querySelectorAll("span")[0].innerHTML);
                let gesamtProzent = extractNumber(positionRow.querySelectorAll("td")[4].querySelectorAll("span")[1].innerHTML);
                let gesamtDomSeitKauf = extractNumber(positionRow.querySelectorAll("td")[4].querySelectorAll("span")[2].innerHTML);

                if(positionRow.getElementsByClassName("message--warning").length === 0) {

                    customLog("gesamtEur/%/wertentwSeitKaufAbs: " + gesamtEuro + " " + gesamtProzent + " " + gesamtDomSeitKauf);

                    saveToDatabase(DATABASE_KEY, shareName, numberOfProduct, aktuellerKurs, gesamtEuro, gesamtProzent, gesamtDomSeitKauf);
                    customLog(shareName + " saved to " + DATABASE_KEY);

                    // Diff anzeigen von zuletzt und aktuell
                    if(sharesZuletzt != undefined) {
                        customLog(shareName + " sharesZuletzt.get(shareName).share_price) - extractNumber(gesamtEuro)");
                        customLog(sharesZuletzt.get(shareName).share_price + " - " + gesamtEuro + " = ") ;
                        customLog(extractNumber(sharesZuletzt.get(shareName).share_price) - extractNumber(gesamtEuro));
                    }
                }

                let tdCopy = positionRow.querySelectorAll("td")[4].cloneNode(true);

    if(sharesZuletzt != undefined && shareName != undefined) {
        customLog("lllll. sharesZuletzt ist undefined. Dumping im folgenden");
        customLog("ShareZuletzt/ShareZuletzt.get.aktuellerKurs/Mit extractNum:");

        customLog("share Name: " + (sharesZuletzt.get(shareName)?.name ?? "nicht gefunden"));

        customLog(sharesZuletzt.get(shareName));
        customLog(sharesZuletzt.get(shareName)?.aktuellerKurs)|| customLog("Err abgefangen") ;
        customLog(extractNumber(sharesZuletzt.get(shareName).aktuellerKurs)) || customLog("Err abgefangen") ;
        customLog(aktuellerKurs);
    }

                let aktuellerKurs_zuletzt = sharesZuletzt.get(shareName).aktuellerKurs - aktuellerKurs;
                tdCopy.querySelectorAll('span')[0].innerHTML = formatEuro(aktuellerKurs_zuletzt);
                tdCopy.querySelectorAll('span')[1].innerHTML = formatPercent(sharesZuletzt.get(shareName).percentage - gesamtProzent);
                tdCopy.querySelectorAll('span')[2].innerHTML = formatEuro(sharesZuletzt.get(shareName).seitKauf - gesamtDomSeitKauf);

                tdCopy.setAttribute("title", "Aktueller Kurs: " + sharesZuletzt.get(shareName).aktuellerKurs + " - " + aktuellerKurs +
                 "\nProzent: " + formatPercent(sharesZuletzt.get(shareName).percentage + " - " + gesamtProzent) +
                 "\nSeit Kauf: " + formatPercent(sharesZuletzt.get(shareName).seitKauf + " - " + gesamtDomSeitKauf) +
                 "\nZuletzt aktualisiert: " + sharesZuletzt.get(shareName).timestamp);
                positionRow.insertBefore(tdCopy, positionRow.querySelectorAll("td")[4]);

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

