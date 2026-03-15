//# import { createNewHeaderDiv } from './tableExpansion.js';

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
        nameMap.set(obj.name, obj);
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
function saveToDatabase(databaseKey, productName, productIndex, aktuellerKurs, sharePrice, percentage, wertentwSeitKaufAbs) {

  //const name = document.getElementById('name').value;
  const timestamp = getCurrentTimestamp();
  //const sharePrice = document.getElementById('sharePrice').value;
  let database = JSON.parse(localStorage.getItem(databaseKey)) || [];

  console.log('Saving to database "${databaseKey}"');

  // Check if productName already exists in database
  const existingEntryIndex = database.findIndex(entry => entry.name === productName);
  if (existingEntryIndex !== -1) {
    // Update existing entry
    database[existingEntryIndex].aktuellerKurs = aktuellerKurs;
    database[existingEntryIndex].share_price = sharePrice;
    database[existingEntryIndex].percentage = percentage;
    database[existingEntryIndex].timestamp = timestamp;
    database[existingEntryIndex].wertentwSeitKaufAbs = wertentwSeitKaufAbs;
    console.log(`Entry '${productName}' updated in database.`);
  } else {
    // Create a new entry
    const entry = {
      name: productName,
      aktuellerKurs: aktuellerKurs,
      timestamp: timestamp,
      share_price: sharePrice,
      percentage: percentage,
      wertentwSeitKaufAbs: wertentwSeitKaufAbs
    };
    database.push(entry);
    console.log(`New entry '${name}${productName}' added to database.`);
  }

    // Save database to localStorage
    localStorage.setItem(databaseKey, JSON.stringify(database));

}