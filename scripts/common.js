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
  if (entry?.key) {
    return entry.key;
  }

  if (entry?.name) {
    return `legacy:${entry.name}`;
  }

  return null;
}

function getEntryAbsolutePerformance(entry) {
  return extractNumber(entry?.share_price);
}

function getEntryPercentagePerformance(entry) {
  return extractNumber(entry?.percentage);
}

function getEntryCurrentValue(entry) {
  return extractNumber(entry?.aktuellerKurs);
}

function getEntryValueSinceBuy(entry) {
  return extractNumber(entry?.wertentwSeitKaufAbs);
}

function calculateDiffValues(previousEntry, currentValues) {
  if (!previousEntry) {
    return null;
  }

  return {
    currentValueDiff: getEntryCurrentValue(previousEntry) - extractNumber(currentValues?.aktuellerKurs),
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
function saveToDatabase(databaseKey, productName, productIndex, aktuellerKurs, sharePrice, percentage, wertentwSeitKaufAbs, entryKey) {

  //const name = document.getElementById('name').value;
  const timestamp = getCurrentTimestamp();
  //const sharePrice = document.getElementById('sharePrice').value;
  let database = readFromStorage(databaseKey, []);
  const resolvedEntryKey = entryKey || `legacy:${productName}`;

  console.log(`Saving to database '${databaseKey}'`);

  // Check if productName already exists in database
  const existingEntryIndex = database.findIndex(entry => getStorageEntryKey(entry) === resolvedEntryKey);
  if (existingEntryIndex !== -1) {
    // Update existing entry
    database[existingEntryIndex].key = resolvedEntryKey;
    database[existingEntryIndex].aktuellerKurs = aktuellerKurs;
    database[existingEntryIndex].share_price = sharePrice;
    database[existingEntryIndex].percentage = percentage;
    database[existingEntryIndex].timestamp = timestamp;
    database[existingEntryIndex].wertentwSeitKaufAbs = wertentwSeitKaufAbs;
    database[existingEntryIndex].productIndex = productIndex;
    console.log(`Entry '${productName}' updated in database.`);
  } else {
    // Create a new entry
    const entry = {
      key: resolvedEntryKey,
      name: productName,
      productIndex: productIndex,
      aktuellerKurs: aktuellerKurs,
      timestamp: timestamp,
      share_price: sharePrice,
      percentage: percentage,
      wertentwSeitKaufAbs: wertentwSeitKaufAbs
    };
    database.push(entry);
    console.log(`New entry '${productName}' added to database.`);
  }

    // Save database to localStorage
    writeToStorage(databaseKey, database);

}
