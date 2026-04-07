const extensionVersion = chrome.runtime?.getManifest?.().version || "unknown";
logInfo(`start finanzen.net extension v${extensionVersion}`)
// lösche werbung

setTimeout(() => {
    let webpushModal = document.getElementById("finWebpushNotificationModal");
    if (webpushModal) {
        webpushModal.remove();
        logDebug("WebPush commercial removed successfully");
    } else {
        logDebug("WebPush commercial modal not found");
    }
}, 1000);




// dazu prüft das script, ob in "article .grid .grid__item-3" (CSS) "<div>Perf. gesamt</div>" enthalten ist.
// Falls ja, soll auf selber höhe das Diff .span-1 span-2  Inhalt gelesen werden, und gespeichert

// Depotnummer mit DATABASE_KEY verbinden:
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const pkdepnr = urlParams.get('pkdepnr') || 'default';
let DATABASE_KEY = "finanzen_net_extension_" + pkdepnr;
let snapshotMinAgeMs = DEFAULT_SNAPSHOT_MIN_AGE_MS;
let testPriceJitterEnabled = false;
let testPriceJitterPercent = 5;

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

function normalizeSummaryValueText(text) {
  if (!text || !/\d/.test(text)) {
    return text;
  }

  return text
    .replace(/\s*EUR\b/g, " €")
    .replace(/\s*%\b/g, " %")
    .replace(/\s+€/g, " €");
}

function normalizeSummaryDisplay(summaryContainer) {
  if (!summaryContainer) {
    return;
  }

  const valueElements = summaryContainer.querySelectorAll("div, span");
  valueElements.forEach(function(element) {
    if (element.children.length > 0) {
      return;
    }

    const normalizedText = normalizeSummaryValueText(element.textContent);
    if (normalizedText !== element.textContent) {
      element.textContent = normalizedText;
    }
  });
}

function formatSnapshotTimestampLabel(timestamp) {
  if (!timestamp || timestamp === "Never") {
    return "letztem Besuch";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "letztem Besuch";
  }

  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function createNewHeaderDiv() {
    // Erstelle ein neues div-Element für das Child
    const newChildDiv = document.createElement('div');
    newChildDiv.className = 'grid__item-3 grid__item-12--sm';

    // Erstelle ein inneres div-Element für den ersten Text
    const innerDiv1 = document.createElement('div');
    innerDiv1.textContent = `Perf. seit ${formatSnapshotTimestampLabel(lastTimestamp)}`;
    innerDiv1.setAttribute("title", lastTimestamp);

    // Erstelle ein inneres div-Element für den zweiten Text und den Prozentsatz
    const innerDiv2 = document.createElement('div');
    innerDiv2.className = 'font-size-x1.250 font-weight-bold margin-top-0.75 margin-top-0.50-sm margin-bottom-1.00-sm';

    // Erstelle ein span-Element für den WERT-A
    const spanA = document.createElement('span');
    spanA.className = 'sensitive-value margin-end-2.00 margin-end-2.00-sm';
    const spanA2 = document.createElement('span');

    // check balance pos or neg
    if (lastTimestamp === "Never") {
        spanA2.className = '';
        spanA2.innerHTML = "n/a";
    } else if (performanceEuroLast < 0) {
        spanA2.className = 'font-color-red';
        spanA2.innerHTML = formatEuro(performanceEuroLast);
    } else {
        spanA2.className = 'font-color-green';
        spanA2.innerHTML = formatEuro(performanceEuroLast);
    }

    // Erstelle ein span-Element für den WERT-B und den Prozentsatz
    const spanB = document.createElement('span');
    spanB.className = spanA2.className;
    spanB.innerHTML = lastTimestamp === "Never" ? "n/a" : formatPercent(performancePercentageLast);

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
  logDebug(`Loading from database '${databaseKey}'...`);
  return normalizeStorageEntries(readFromStorage(databaseKey, []));
}


let performanceEuroLast = 0;
let performancePercentageLast = 0;
let lastTimestamp = "Never";

function getPortfolioSummaryElements() {
  const perfGesamtDiv = findDivWithText("Perf. gesamt");
  if (!perfGesamtDiv?.parentNode) {
    logDebug("Portfolio summary not available on this page. Skipping extension rendering.");
    return null;
  }

  const parentDiv = perfGesamtDiv.parentNode;
  const performanceEuroElement = findElementWithText(parentDiv, "span", "EUR") || findElementWithText(parentDiv, "span", "€");
  const performancePercentageElement = findElementWithText(parentDiv, "span", "%");
  const gesamtwertLabel = findDivWithText("Gesamtwert");
  const gesamtwertElement = gesamtwertLabel?.parentNode?.children?.[1];

  if (!performanceEuroElement || !performancePercentageElement || !gesamtwertElement) {
    logDebug("Portfolio summary is incomplete on this page. Skipping extension rendering.");
    return null;
  }

  return {
    parentDiv: parentDiv,
    performanceEuroElement: performanceEuroElement,
    performancePercentageElement: performancePercentageElement,
    gesamtwertElement: gesamtwertElement
  };
}

function getCurrentPortfolioSummary() {
  const summaryElements = getPortfolioSummaryElements();
  if (!summaryElements) {
    return null;
  }

  return {
    parentDiv: summaryElements.parentDiv,
    performanceEuro: extractNumber(summaryElements.performanceEuroElement.innerHTML),
    performancePercentage: extractNumber(summaryElements.performancePercentageElement.innerHTML),
    gesamtwert: extractNumber(summaryElements.gesamtwertElement.innerHTML)
  };
}

function getLastPortfolioSnapshotEntry() {
  const entries = loadFromDatabase(DATABASE_KEY);
  return entries.find((entry) => entry?.key === "portfolio:gesamt") || null;
}

function shouldRefreshPortfolioSnapshots(forceRefreshSnapshot) {
  const lastEntry = getLastPortfolioSnapshotEntry();
  if (forceRefreshSnapshot || shouldRefreshSnapshot(lastEntry, snapshotMinAgeMs)) {
    return true;
  }

  logInfo(`Skipping portfolio snapshot refresh because the last snapshot is younger than ${formatSnapshotIntervalLabel(snapshotMinAgeMs)}.`);
  return false;
}

function refreshPortfolioSnapshot(forceRefreshSnapshot) {
  const portfolioSummary = getCurrentPortfolioSummary();
  if (!portfolioSummary) {
    return { refreshed: false, timestamp: null };
  }

  const lastEntry = getLastPortfolioSnapshotEntry();
  const shouldPersistSnapshot = shouldRefreshPortfolioSnapshots(forceRefreshSnapshot);
  const portfolioValues = {
    currentValue: portfolioSummary.gesamtwert,
    absolutePerformance: portfolioSummary.performanceEuro,
    percentagePerformance: portfolioSummary.performancePercentage,
    sinceBuyValue: 0
  };

  if (shouldPersistSnapshot && hasSnapshotValuesChanged(lastEntry, portfolioValues)) {
    saveToDatabase(DATABASE_KEY, "Gesamt", portfolioSummary.gesamtwert, portfolioSummary.performanceEuro, portfolioSummary.performancePercentage, 0, "portfolio:gesamt");
    return { refreshed: true, timestamp: getCurrentTimestamp() };
  }

  return { refreshed: false, timestamp: lastEntry?.timestamp ?? null };
}

function getPopupSnapshotStatus() {
  const entries = loadFromDatabase(DATABASE_KEY);
  const portfolioEntry = entries.find((entry) => entry?.key === "portfolio:gesamt") || null;

  return {
    databaseKey: DATABASE_KEY,
    entryCount: entries.length,
    snapshotIntervalLabel: formatSnapshotIntervalLabel(snapshotMinAgeMs),
    hasSnapshot: Boolean(portfolioEntry),
    lastSnapshotTimestamp: portfolioEntry?.timestamp ?? null,
    testPriceJitterEnabled: testPriceJitterEnabled,
    testPriceJitterPercent: testPriceJitterPercent,
    version: extensionVersion
  };
}

function resetPortfolioSnapshots() {
  localStorage.removeItem(DATABASE_KEY);
}

async function initPortfolioDiff() {
  try {
    snapshotMinAgeMs = await getSnapshotMinAgeMs();
    testPriceJitterEnabled = await getDebugPriceJitterEnabled();
    testPriceJitterPercent = await getDebugPriceJitterPercent();
  } catch (error) {
    logWarn(`Failed to load extension settings: ${error}`);
    snapshotMinAgeMs = DEFAULT_SNAPSHOT_MIN_AGE_MS;
    testPriceJitterEnabled = false;
    testPriceJitterPercent = 5;
  }

  applyTestPriceSimulationToPortfolio();

  const portfolioSummary = getCurrentPortfolioSummary();
  if (!portfolioSummary) {
    return;
  }

  const performanceEuro = portfolioSummary.performanceEuro;
  const performancePercentage = portfolioSummary.performancePercentage;
  const gesamtwert = portfolioSummary.gesamtwert;

  const tupelPerformanceLast = loadFromDatabase(DATABASE_KEY);

  const lastEntry = tupelPerformanceLast.find((entry) => entry?.key === "portfolio:gesamt")
    || tupelPerformanceLast[0];
  if (lastEntry) {
    const diffValues = calculateDiffValues(lastEntry, {
      currentValue: gesamtwert,
      absolutePerformance: performanceEuro,
      percentagePerformance: performancePercentage,
      sinceBuyValue: 0
    });

    performanceEuroLast = diffValues?.absolutePerformanceDiff ?? 0;
    performancePercentageLast = diffValues?.percentageDiff ?? 0;
    lastTimestamp = lastEntry.timestamp ?? "Never";
  }

  const shouldPersistSnapshot = shouldRefreshPortfolioSnapshots(false);
  if (shouldPersistSnapshot && hasSnapshotValuesChanged(lastEntry, {
    currentValue: gesamtwert,
    absolutePerformance: performanceEuro,
    percentagePerformance: performancePercentage,
    sinceBuyValue: 0
  })) {
    saveToDatabase(DATABASE_KEY, "Gesamt", gesamtwert, performanceEuro, performancePercentage, 0, "portfolio:gesamt");
  }

  const headerTable = portfolioSummary.parentDiv.parentNode;
  if (headerTable) {
    changeClassOfChildren(headerTable, "grid__item-3", "grid__item-2");
    normalizeSummaryDisplay(headerTable);
    headerTable.appendChild(createNewHeaderDiv());
  }

  addNewColumnHeader(shouldPersistSnapshot);
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (!message?.type) {
    return false;
  }

  if (message.type === "popup:getSnapshotStatus") {
    sendResponse({ ok: true, status: getPopupSnapshotStatus() });
    return false;
  }

  if (message.type === "popup:updateSnapshotInterval") {
    snapshotMinAgeMs = Number(message.intervalMs) || DEFAULT_SNAPSHOT_MIN_AGE_MS;
    sendResponse({ ok: true });

    setTimeout(function() {
      window.location.reload();
    }, 100);
    return false;
  }

  if (message.type === "popup:updateTestPriceJitter") {
    testPriceJitterEnabled = Boolean(message.enabled);
    testPriceJitterPercent = Number(message.percent) || 5;
    sendResponse({ ok: true });

    setTimeout(function() {
      window.location.reload();
    }, 100);
    return false;
  }

  if (message.type === "popup:updateTestPriceJitterPercent") {
    testPriceJitterPercent = Number(message.percent) || 5;
    sendResponse({ ok: true });

    setTimeout(function() {
      window.location.reload();
    }, 100);
    return false;
  }

  if (message.type === "popup:refreshSnapshotsNow") {
    const portfolioRefreshResult = refreshPortfolioSnapshot(true);
    const positionRefreshResult = refreshPositionSnapshots(portfolioRefreshResult.refreshed);

    sendResponse({
      ok: true,
      refreshedPortfolioSnapshot: portfolioRefreshResult.refreshed,
      refreshedPositions: positionRefreshResult.refreshedCount
    });

    setTimeout(function() {
      window.location.reload();
    }, 100);
    return false;
  }

  if (message.type === "popup:resetSnapshots") {
    resetPortfolioSnapshots();
    sendResponse({ ok: true });

    setTimeout(function() {
      window.location.reload();
    }, 100);
    return false;
  }

  return false;
});

initPortfolioDiff();
