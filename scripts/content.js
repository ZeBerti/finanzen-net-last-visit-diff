

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
const pkdepnr = urlParams.get('pkdepnr') || 'default';
let DATABASE_KEY = "finanzen_net_extension_" + pkdepnr;

// functions ######
// findDivWithText(text)
// findElementWithText(parentElement, domType, text)

// Ändere die CSS-Klassen aller Child-Elemente eines DOM-Elements
function changeClassOfChildren(parentDom, cssBefore, cssAfter) {
  if (!parentDom) {
    return;
  }
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
  return normalizeStorageEntries(readFromStorage(databaseKey, []));
}


let performanceEuroLast = 0;
let performancePercentageLast = 0;
let lastTimestamp = "Never";

function initPortfolioDiff() {
  const perfGesamtDiv = findDivWithText("Perf. gesamt");
  if (!perfGesamtDiv?.parentNode) {
    console.warn("Perf. gesamt section not found. Skipping extension rendering.");
    return;
  }

  const parentDiv = perfGesamtDiv.parentNode;
  const performanceEuroElement = findElementWithText(parentDiv, "span", "EUR");
  const performancePercentageElement = findElementWithText(parentDiv, "span", "%");
  const gesamtwertLabel = findDivWithText("Gesamtwert");
  const gesamtwertElement = gesamtwertLabel?.parentNode?.children?.[1];

  if (!performanceEuroElement || !performancePercentageElement || !gesamtwertElement) {
    console.warn("Required portfolio summary elements not found. Skipping extension rendering.");
    return;
  }

  const performanceEuro = extractNumber(performanceEuroElement.innerHTML);
  const performancePercentage = extractNumber(performancePercentageElement.innerHTML);
  const gesamtwert = extractNumber(gesamtwertElement.innerHTML);

  const tupelPerformanceLast = loadFromDatabase(DATABASE_KEY);
  console.log("Tupel perf.: " + tupelPerformanceLast);
  console.log(tupelPerformanceLast);
  console.log("tupel length: " + tupelPerformanceLast.length);

  const lastEntry = tupelPerformanceLast.find((entry) => entry?.key === "portfolio:gesamt")
    || tupelPerformanceLast[0];
  if (lastEntry) {
    performanceEuroLast = getEntryAbsolutePerformance(lastEntry);
    performancePercentageLast = getEntryPercentagePerformance(lastEntry);
    lastTimestamp = lastEntry.timestamp ?? "Never";
  }

  saveToDatabase(DATABASE_KEY, "Gesamt", 0, gesamtwert, performanceEuro, performancePercentage, 0, "portfolio:gesamt");

  const headerTable = parentDiv.parentNode;
  if (headerTable) {
    changeClassOfChildren(headerTable, "grid__item-3", "grid__item-2");
    headerTable.appendChild(createNewHeaderDiv());
  }

  addNewColumnHeader();

  console.log("finanzen.net extension DEBUG");
  console.log("performanceEuro: " + performanceEuro + " (" + performanceEuroLast + ")");
  console.log("performance%: " + performancePercentage + " (" + performancePercentageLast + ")");
  console.log("");
}

initPortfolioDiff();
