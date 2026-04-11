const statusMessageElement = document.getElementById("status-message");
const snapshotIntervalSelectElement = document.getElementById("snapshot-interval-select");
const snapshotTimestampElement = document.getElementById("snapshot-timestamp");
const entryCountElement = document.getElementById("entry-count");
const refreshButton = document.getElementById("refresh-snapshots");
const resetButton = document.getElementById("reset-snapshots");
const versionLabelElement = document.getElementById("version-label");
const testPriceJitterToggleElement = document.getElementById("test-price-jitter-toggle");
const testPriceJitterPercentInputElement = document.getElementById("test-price-jitter-percent-input");
const SNAPSHOT_INTERVAL_SETTING_KEY = "snapshotMinAgeMs";
const DEFAULT_SNAPSHOT_MIN_AGE_MS = 2 * 60 * 60 * 1000;
const DEBUG_PRICE_JITTER_SETTING_KEY = "debugPriceJitterEnabled";
const DEBUG_PRICE_JITTER_PERCENT_SETTING_KEY = "debugPriceJitterPercent";

function formatSnapshotIntervalLabel(intervalMs) {
  const totalMinutes = intervalMs / (60 * 1000);
  if (totalMinutes < 60) {
    return `${totalMinutes} Minuten`;
  }

  const totalHours = totalMinutes / 60;
  if (totalHours >= 24) {
    const totalDays = totalHours / 24;
    return totalDays === 1 ? "1 Tag" : `${totalDays} Tage`;
  }

  if (totalHours === 1) {
    return "1 Stunde";
  }

  return `${totalHours} Stunden`;
}

function formatSnapshotTimestamp(timestamp) {
  if (!timestamp) {
    return "kein Snapshot";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "ungueltig";
  }

  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function setStatus(message, isError) {
  statusMessageElement.textContent = message;
  statusMessageElement.classList.toggle("is-error", Boolean(isError));
}

function setButtonsDisabled(isDisabled) {
  refreshButton.disabled = isDisabled;
  resetButton.disabled = isDisabled;
  snapshotIntervalSelectElement.disabled = isDisabled;
  testPriceJitterToggleElement.disabled = isDisabled;
  testPriceJitterPercentInputElement.disabled = isDisabled;
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

async function sendMessageToActiveTab(message) {
  const activeTab = await getActiveTab();
  if (!activeTab?.id) {
    throw new Error("Keine aktive Browser-Registerkarte gefunden.");
  }

  return chrome.tabs.sendMessage(activeTab.id, message);
}

async function loadSnapshotIntervalSetting() {
  const settings = await chrome.storage.local.get({ [SNAPSHOT_INTERVAL_SETTING_KEY]: DEFAULT_SNAPSHOT_MIN_AGE_MS });
  return Number(settings[SNAPSHOT_INTERVAL_SETTING_KEY]) || DEFAULT_SNAPSHOT_MIN_AGE_MS;
}

async function saveSnapshotIntervalSetting(intervalMs) {
  await chrome.storage.local.set({ [SNAPSHOT_INTERVAL_SETTING_KEY]: intervalMs });
}

async function loadTestPriceJitterSetting() {
  const settings = await chrome.storage.local.get({ [DEBUG_PRICE_JITTER_SETTING_KEY]: false });
  return Boolean(settings[DEBUG_PRICE_JITTER_SETTING_KEY]);
}

async function saveTestPriceJitterSetting(isEnabled) {
  await chrome.storage.local.set({ [DEBUG_PRICE_JITTER_SETTING_KEY]: Boolean(isEnabled) });
}

async function loadTestPriceJitterPercentSetting() {
  const settings = await chrome.storage.local.get({ [DEBUG_PRICE_JITTER_PERCENT_SETTING_KEY]: 5 });
  return Number(settings[DEBUG_PRICE_JITTER_PERCENT_SETTING_KEY]) || 5;
}

async function saveTestPriceJitterPercentSetting(percent) {
  await chrome.storage.local.set({ [DEBUG_PRICE_JITTER_PERCENT_SETTING_KEY]: Number(percent) || 5 });
}

function renderStatus(status) {
  snapshotTimestampElement.textContent = formatSnapshotTimestamp(status.lastSnapshotTimestamp);
  entryCountElement.textContent = String(status.entryCount ?? 0);
  versionLabelElement.textContent = `Extension v${status.version || chrome.runtime.getManifest().version}`;

  if (status.testPriceJitterEnabled) {
    setStatus(`Testmodus aktiv. Sichtbare Kurse werden abwechselnd um ±${status.testPriceJitterPercent} % simuliert.`, false);
  } else if (status.hasSnapshot) {
    setStatus("Snapshot-Status geladen. Aktionen gelten fuer das aktuell geoeffnete Depot.", false);
  } else {
    setStatus("Noch kein Snapshot vorhanden. Nach dem ersten Speichern stehen Vergleichswerte bereit.", false);
  }
}

async function refreshStatus() {
  setButtonsDisabled(true);
  setStatus("Lese Snapshot-Status...", false);

  try {
    const intervalMs = await loadSnapshotIntervalSetting();
    const testPriceJitterEnabled = await loadTestPriceJitterSetting();
    const testPriceJitterPercent = await loadTestPriceJitterPercentSetting();
    snapshotIntervalSelectElement.value = String(intervalMs);
    snapshotIntervalSelectElement.title = `Aktuell: ${formatSnapshotIntervalLabel(intervalMs)}`;
    testPriceJitterToggleElement.checked = testPriceJitterEnabled;
    testPriceJitterPercentInputElement.value = String(testPriceJitterPercent);
    const response = await sendMessageToActiveTab({ type: "popup:getSnapshotStatus" });
    if (!response?.ok || !response.status) {
      throw new Error("Keine gueltige Antwort von der Depotseite.");
    }

    renderStatus(response.status);
    setButtonsDisabled(false);
  } catch (error) {
    const intervalMs = await loadSnapshotIntervalSetting();
    const testPriceJitterEnabled = await loadTestPriceJitterSetting();
    const testPriceJitterPercent = await loadTestPriceJitterPercentSetting();
    snapshotIntervalSelectElement.value = String(intervalMs);
    snapshotIntervalSelectElement.title = `Aktuell: ${formatSnapshotIntervalLabel(intervalMs)}`;
    testPriceJitterToggleElement.checked = testPriceJitterEnabled;
    testPriceJitterPercentInputElement.value = String(testPriceJitterPercent);
    snapshotTimestampElement.textContent = "-";
    entryCountElement.textContent = "-";
    versionLabelElement.textContent = `Extension v${chrome.runtime.getManifest().version}`;
    setStatus("Die aktive Seite ist keine geladene finanzen.net-Depotseite oder die Extension wurde dort noch nicht injiziert.", true);
  }
}

async function runAction(message, pendingText) {
  setButtonsDisabled(true);
  setStatus(pendingText, false);

  try {
    const response = await sendMessageToActiveTab(message);
    if (!response?.ok) {
      throw new Error("Aktion konnte nicht ausgefuehrt werden.");
    }

    setStatus("Aktion ausgefuehrt. Die Depotseite wird neu geladen.", false);
    window.close();
  } catch (error) {
    setStatus("Aktion fehlgeschlagen. Pruefe, ob eine passende Depotseite aktiv ist.", true);
    setButtonsDisabled(false);
  }
}

snapshotIntervalSelectElement.addEventListener("change", async function(event) {
  const intervalMs = Number(event.target.value) || DEFAULT_SNAPSHOT_MIN_AGE_MS;
  setButtonsDisabled(true);
  setStatus("Speichere Snapshot-Intervall...", false);

  try {
    await saveSnapshotIntervalSetting(intervalMs);
    snapshotIntervalSelectElement.title = `Aktuell: ${formatSnapshotIntervalLabel(intervalMs)}`;

    try {
      await sendMessageToActiveTab({ type: "popup:updateSnapshotInterval", intervalMs: intervalMs });
      setStatus("Snapshot-Intervall gespeichert. Die Depotseite wird neu geladen.", false);
      window.close();
      return;
    } catch (error) {
      setStatus("Snapshot-Intervall gespeichert. Wirksam auf der naechsten Depotseite.", false);
    }

    setButtonsDisabled(false);
  } catch (error) {
    setStatus("Snapshot-Intervall konnte nicht gespeichert werden.", true);
    setButtonsDisabled(false);
  }
});

testPriceJitterPercentInputElement.addEventListener("change", async function(event) {
  const percent = Math.max(0, Number(event.target.value) || 5);
  testPriceJitterPercentInputElement.value = String(percent);
  setButtonsDisabled(true);
  setStatus("Speichere Testmodus-Prozentsatz...", false);

  try {
    await saveTestPriceJitterPercentSetting(percent);

    try {
      await sendMessageToActiveTab({ type: "popup:updateTestPriceJitterPercent", percent: percent });
      setStatus("Testmodus-Prozentsatz gespeichert. Die Depotseite wird neu geladen.", false);
      window.close();
      return;
    } catch (error) {
      setStatus("Testmodus-Prozentsatz gespeichert. Wirksam auf der naechsten Depotseite.", false);
    }

    setButtonsDisabled(false);
  } catch (error) {
    setStatus("Testmodus-Prozentsatz konnte nicht gespeichert werden.", true);
    setButtonsDisabled(false);
  }
});

testPriceJitterToggleElement.addEventListener("change", async function(event) {
  const isEnabled = Boolean(event.target.checked);
  setButtonsDisabled(true);
  setStatus("Speichere Testmodus...", false);

  try {
    await saveTestPriceJitterSetting(isEnabled);
    const percent = Math.max(0, Number(testPriceJitterPercentInputElement.value) || 5);
    await saveTestPriceJitterPercentSetting(percent);

    try {
      await sendMessageToActiveTab({ type: "popup:updateTestPriceJitter", enabled: isEnabled, percent: percent });
      setStatus("Testmodus gespeichert. Die Depotseite wird neu geladen.", false);
      window.close();
      return;
    } catch (error) {
      setStatus("Testmodus gespeichert. Wirksam auf der naechsten Depotseite.", false);
    }

    setButtonsDisabled(false);
  } catch (error) {
    setStatus("Testmodus konnte nicht gespeichert werden.", true);
    setButtonsDisabled(false);
  }
});

refreshButton.addEventListener("click", function() {
  runAction({ type: "popup:refreshSnapshotsNow" }, "Speichere aktuellen Stand als Snapshot...");
});

resetButton.addEventListener("click", function() {
  runAction({ type: "popup:resetSnapshots" }, "Setze Snapshots zurueck...");
});

refreshStatus();
