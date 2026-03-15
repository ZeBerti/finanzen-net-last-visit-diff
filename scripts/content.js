

console.log("start finanzen.net extension v0.0.3")
// lösche werbung

setTimeout(() => {
    let webpushModal = document.getElementById("finWebpushNotificationModal");
    if (webpushModal) {
        webpushModal.remove();
        console.log("WebPush commercial removed successfully");
    } else {
        console.log("WebPush commercial modal not found");
    }
}, 1000);




// dazu prüft das script, ob in "article .grid .grid__item-3" (CSS) "<div>Perf. gesamt</div>" enthalten ist.
// Falls ja, soll auf selber höhe das Diff .span-1 span-2  Inhalt gelesen werden, und gespeichert

// Depotnummer mit DATABASE_KEY verbinden:
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const pkdepnr = urlParams.get('pkdepnr')
let DATABASE_KEY = "finanzen_net_extension_" + pkdepnr;

// functions ######
// findDivWithText(text)
// findElementWithText(parentElement, domType, text)

// Ändere die CSS-Klassen aller Child-Elemente eines DOM-Elements
function changeClassOfChildren(parentDom, cssBefore, cssAfter) {
  // Finde alle untergeordneten Elemente des parentDom
  const children = parentDom.children;

  // Iteriere über alle untergeordneten Elemente
  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    // Ändere die CSS-Klassen des aktuellen Child-Elements
    child.classList.remove(cssBefore);
    child.classList.add(cssAfter);

    // Wenn das aktuelle Child-Element selbst untergeordnete Elemente hat, rufe die Funktion rekursiv auf
    if (child.children.length > 0) {
      changeClassOfChildren(child, cssBefore, cssAfter);
    }
  }
}

function createNewHeaderDiv() {
    // Erstelle ein neues div-Element für das Child
    const newChildDiv = document.createElement('div');
    newChildDiv.className = 'grid__item-3 grid__item-12--sm';

    // Erstelle ein inneres div-Element für den ersten Text
    const innerDiv1 = document.createElement('div');
    innerDiv1.textContent = 'Perf. seit letztem Besuch';
    innerDiv1.setAttribute("title", lastTimestamp);

    // Erstelle ein inneres div-Element für den zweiten Text und den Prozentsatz
    const innerDiv2 = document.createElement('div');
    innerDiv2.className = 'font-size-x1.250 font-weight-bold margin-top-0.75 margin-top-0.50-sm margin-bottom-1.00-sm';

    // Erstelle ein span-Element für den WERT-A
    const spanA = document.createElement('span');
    spanA.className = 'sensitive-value margin-end-2.00 margin-end-2.00-sm';
    const spanA2 = document.createElement('span');

    // check balance pos or neg
    if (performanceEuroLast < 0) {
        spanA2.className = 'font-color-red';
    } else {
        spanA2.className = 'font-color-green';
    }
    spanA2.innerHTML = performanceEuroLast;

    // Erstelle ein span-Element für den WERT-B und den Prozentsatz
    const spanB = document.createElement('span');
    spanB.className = spanA2.className;
    spanB.innerHTML = performancePercentageLast;

    // Füge die erstellten Elemente in die Struktur ein
    innerDiv2.appendChild(spanA);
    spanA.appendChild(spanA2);
    innerDiv2.appendChild(spanB);
    newChildDiv.appendChild(innerDiv1);
    newChildDiv.appendChild(innerDiv2);

    // Füge das neue Child-Element zum headerTable hinzu
    //headerTable.appendChild(newChildDiv);
    return newChildDiv;
}

function loadFromDatabase(databaseKey) {
  console.log(`Loading from database '${databaseKey}'...`);
  // Load database from localStorage
  entries = JSON.parse(localStorage.getItem(databaseKey)) || [];
  return entries;
}


// 1. Suche nach dem div-Element mit dem Text "Perf. gesamt"
const perfGesamtDiv = findDivWithText("Perf. gesamt");

// 2. Lade das parent div-Element
const parentDiv = perfGesamtDiv.parentNode;

// 3. Hole die aktuellen Portfolio Werte absolut und in prozent
const performanceEuro = extractNumber(findElementWithText(parentDiv, "span", "EUR").innerHTML);
const performancePercentage = extractNumber(findElementWithText(parentDiv, "span", "%").innerHTML);
const gesamtwert = extractNumber(findDivWithText("Gesamtwert").parentNode.children[1].innerHTML);

// 4. lade die letzten Gesamt-Portfolio-Werte absolut und in prozent
const tupelPerformanceLast = loadFromDatabase(DATABASE_KEY);
console.log("Tupel perf.: " + tupelPerformanceLast);
console.log(tupelPerformanceLast);
let performanceEuroLast = 0;
let performancePercentageLast = 0;
let lastTimestamp = "Never"
console.log("tupel length: " + tupelPerformanceLast.length);
if (tupelPerformanceLast && tupelPerformanceLast.length > 0) {
  performanceEuroLast = tupelPerformanceLast[0].share_price;
  performancePercentageLast = tupelPerformanceLast[0].percentage;
  lastTimestamp = tupelPerformanceLast[0].timestamp;
}

// 5. Den aktuellen Stand speichern
saveToDatabase(DATABASE_KEY, "Gesamt", 0, gesamtwert, performanceEuro, performancePercentage, 0);

// 6. Die Tabelle unter "Depotwert" enger machen
const headerTable = parentDiv.parentNode;
changeClassOfChildren(headerTable, "grid__item-3", "grid__item-2");

// 7. Füge einen weiteren Bereich in die Header Tabelle ein
// Erstelle ein neues div-Element für das Child und füge das neue Child-Element zum headerTable hinzu
headerTable.appendChild(createNewHeaderDiv());

// 8. Die Tabelle mit den Einzelwerten erweitern um eine Spalte
addNewColumnHeader();

//DEBUG
console.log("finanzen.net extension DEBUG");
console.log("performanceEuro: " + performanceEuro + " (" + performanceEuroLast + ")");
console.log("performance%: " + performancePercentage + " (" + performancePercentageLast + ")");
console.log("");