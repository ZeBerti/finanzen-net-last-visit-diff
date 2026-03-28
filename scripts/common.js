//# import { createNewHeaderDiv } from './tableExpansion.js';

function readFromStorage(key, fallbackValue) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallbackValue;
  } catch (error) {
    console.error(`Failed to read localStorage key '${key}'`, error);
    return fallbackValue;
  }
}

function writeToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to write localStorage key '${key}'`, error);
    return false;
  }
}

function getStorageEntryKey(entry) {
  return entry?.key || null;
}

const SNAPSHOT_MIN_AGE_MS = 2 * 60 * 60 * 1000;

function normalizeStorageEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const normalizedEntry = {
    key: getStorageEntryKey(entry),
    name: entry.name || "Unbekannt",
    productIndex: entry.productIndex ?? 0,
    currentValue: extractNumber(entry.currentValue),
    absolutePerformance: extractNumber(entry.absolutePerformance),
    percentagePerformance: extractNumber(entry.percentagePerformance),
    sinceBuyValue: extractNumber(entry.sinceBuyValue),
    timestamp: entry.timestamp || null
  };

  return normalizedEntry.key ? normalizedEntry : null;
}

function normalizeStorageEntries(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map(normalizeStorageEntry)
    .filter(Boolean);
}

function getEntryAbsolutePerformance(entry) {
  return extractNumber(entry?.absolutePerformance);
}

function getEntryPercentagePerformance(entry) {
  return extractNumber(entry?.percentagePerformance);
}

function getEntryCurrentValue(entry) {
  return extractNumber(entry?.currentValue);
}

function getEntryValueSinceBuy(entry) {
  return extractNumber(entry?.sinceBuyValue);
}

function getEntryTimestampMs(entry) {
  if (!entry?.timestamp) {
    return null;
  }

  const timestampMs = Date.parse(entry.timestamp);
  return Number.isNaN(timestampMs) ? null : timestampMs;
}

function shouldRefreshSnapshot(entry, minAgeMs) {
  if (!entry) {
    return true;
  }

  const lastTimestampMs = getEntryTimestampMs(entry);
  if (lastTimestampMs === null) {
    return true;
  }

  return (Date.now() - lastTimestampMs) >= minAgeMs;
}

function formatSnapshotAge(entry) {
  const lastTimestampMs = getEntryTimestampMs(entry);
  if (lastTimestampMs === null) {
    return "unbekannt";
  }

  const ageMs = Math.max(0, Date.now() - lastTimestampMs);
  const totalMinutes = Math.floor(ageMs / (60 * 1000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `vor ${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `vor ${hours}h ${minutes}m`;
  }

  return `vor ${minutes}m`;
}

function calculateDiffValues(previousEntry, currentValues) {
  if (!previousEntry) {
    return null;
  }

  return {
    currentValueDiff: getEntryCurrentValue(previousEntry) - extractNumber(currentValues?.currentValue),
    absolutePerformanceDiff: getEntryAbsolutePerformance(previousEntry) - extractNumber(currentValues?.absolutePerformance),
    percentageDiff: getEntryPercentagePerformance(previousEntry) - extractNumber(currentValues?.percentagePerformance),
    sinceBuyDiff: getEntryValueSinceBuy(previousEntry) - extractNumber(currentValues?.sinceBuyValue)
  };
}

function getCurrentTimestamp() {
  const now = new Date();
  return now.toISOString();
}

function findDivWithText(text) {
  const divElements = document.getElementsByTagName('div');
  for (let i = 0; i < divElements.length; i++) {
    if (divElements[i].textContent.trim() === text) {
      return divElements[i];
    }
  }
  return null;
}

// damit wir schnell die geladenen Datensätze durchsuchen können, legen wir eine Map an
function createMap (data) {
    let nameMap = new Map();
    data.forEach(obj => {
        const key = getStorageEntryKey(obj);
        if (key) {
          nameMap.set(key, obj);
        }
    });
    return nameMap;
}

// hier wollen wir die reine Zahl aus den formatierten ausgaben (zB "123.456,78 EUR")
function extractNumber(text) {
    if(text === undefined)
        return 0;
    if(typeof text === 'number')
        return  text;
    // Entferne das Währungssymbol und Tausendertrennzeichen, ersetze das Komma durch einen Punkt
    const cleanText = text.replace(/[^\d,-]/g, '').replace(',', '.');
    // Parse die gereinigte Zeichenkette zu einer Fließkommazahl
    const number = parseFloat(cleanText);
    console.log("Number to extract:");
        console.log(text + " -> " + number);
    return number;
}

function formatEuro (num) {
    if (typeof num !== "number" || isNaN(num))
        return num;
    return num.toLocaleString('de-DE', {
      style: 'currency',
      currency: 'EUR',
    })
}

function formatPercent (num) {
    if (isNaN(num))
        return num;
    return num.toFixed(2) + "%";
}


// Suche nach dem Element mit einem Text, der im Text des Elements enthalten ist und keine untergeordneten Elemente hat
function findElementWithText(parentElement, domType, text) {
  if (!parentElement) {
    return null;
  }
  const elements = parentElement.getElementsByTagName(domType);
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (element.textContent.includes(text) && element.children.length === 0) {
      return element;
    }
  }
  return null;
}

/**
 databaseKey: name of the browser interna database
 productName: produkt name, e.g. alphabet
 productIndex: there may be several <productName> entries. This variable counts it (e.g. 'alphabet' -> 2)
**/
 function saveToDatabase(databaseKey, productName, productIndex, currentValue, absolutePerformance, percentagePerformance, sinceBuyValue, entryKey) {

  //const name = document.getElementById('name').value;
  const timestamp = getCurrentTimestamp();
  let database = normalizeStorageEntries(readFromStorage(databaseKey, []));
  const resolvedEntryKey = entryKey;

  if (!resolvedEntryKey) {
    console.error(`Missing storage key for database '${databaseKey}' and product '${productName}'`);
    return;
  }

  console.log(`Saving to database '${databaseKey}'`);

  // Check if productName already exists in database
  const existingEntryIndex = database.findIndex(entry => getStorageEntryKey(entry) === resolvedEntryKey);
  if (existingEntryIndex !== -1) {
    // Update existing entry
    database[existingEntryIndex].key = resolvedEntryKey;
    database[existingEntryIndex].name = productName;
    database[existingEntryIndex].currentValue = extractNumber(currentValue);
    database[existingEntryIndex].absolutePerformance = extractNumber(absolutePerformance);
    database[existingEntryIndex].percentagePerformance = extractNumber(percentagePerformance);
    database[existingEntryIndex].timestamp = timestamp;
    database[existingEntryIndex].sinceBuyValue = extractNumber(sinceBuyValue);
    database[existingEntryIndex].productIndex = productIndex;
    console.log(`Entry '${productName}' updated in database.`);
  } else {
    // Create a new entry
    const entry = {
      key: resolvedEntryKey,
      name: productName,
      productIndex: productIndex,
      currentValue: extractNumber(currentValue),
      timestamp: timestamp,
      absolutePerformance: extractNumber(absolutePerformance),
      percentagePerformance: extractNumber(percentagePerformance),
      sinceBuyValue: extractNumber(sinceBuyValue)
    };
    database.push(entry);
    console.log(`New entry '${productName}' added to database.`);
  }

    // Save database to localStorage
    writeToStorage(databaseKey, database);

}
