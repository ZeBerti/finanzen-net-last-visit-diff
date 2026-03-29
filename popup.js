const statusMessageElement = document.getElementById("status-message");
const snapshotIntervalElement = document.getElementById("snapshot-interval");
const snapshotAgeElement = document.getElementById("snapshot-age");
const entryCountElement = document.getElementById("entry-count");
const refreshButton = document.getElementById("refresh-snapshots");
const resetButton = document.getElementById("reset-snapshots");
const versionLabelElement = document.getElementById("version-label");

function setStatus(message, isError) {
  statusMessageElement.textContent = message;
  statusMessageElement.classList.toggle("is-error", Boolean(isError));
}

function setButtonsDisabled(isDisabled) {
  refreshButton.disabled = isDisabled;
  resetButton.disabled = isDisabled;
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

function renderStatus(status) {
  snapshotIntervalElement.textContent = status.snapshotIntervalLabel || "-";
  snapshotAgeElement.textContent = status.lastSnapshotAge || "kein Snapshot";
  entryCountElement.textContent = String(status.entryCount ?? 0);
  versionLabelElement.textContent = `Extension v${status.version || chrome.runtime.getManifest().version}`;

  if (status.hasSnapshot) {
    setStatus("Snapshot-Status geladen. Aktionen gelten fuer das aktuell geoeffnete Depot.", false);
  } else {
    setStatus("Noch kein Snapshot vorhanden. Nach dem ersten Speichern stehen Vergleichswerte bereit.", false);
  }
}

async function refreshStatus() {
  setButtonsDisabled(true);
  setStatus("Lese Snapshot-Status...", false);

  try {
    const response = await sendMessageToActiveTab({ type: "popup:getSnapshotStatus" });
    if (!response?.ok || !response.status) {
      throw new Error("Keine gueltige Antwort von der Depotseite.");
    }

    renderStatus(response.status);
    setButtonsDisabled(false);
  } catch (error) {
    snapshotIntervalElement.textContent = "-";
    snapshotAgeElement.textContent = "-";
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

refreshButton.addEventListener("click", function() {
  runAction({ type: "popup:refreshSnapshotsNow" }, "Speichere aktuellen Stand als Snapshot...");
});

resetButton.addEventListener("click", function() {
  runAction({ type: "popup:resetSnapshots" }, "Setze Snapshots zurueck...");
});

refreshStatus();
