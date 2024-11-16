document.addEventListener("DOMContentLoaded", function () {
  const statusDiv = document.getElementById("connectionStatus");
  const settingsButton = document.getElementById("settingsButton");

  // Make sure chrome.storage is available
  if (!chrome.storage) {
    console.error("Chrome storage API not available");
    showConnectionError("Storage API not available");
    return;
  }

  // Check if Bluesky credentials are set
  chrome.storage.sync.get(["bskyIdentifier"], function (result) {
    if (chrome.runtime.lastError) {
      console.error("Error loading identifier:", chrome.runtime.lastError);
      showConnectionError("Error loading settings");
      return;
    }

    chrome.storage.local.get(["bskyPassword"], function (local) {
      if (chrome.runtime.lastError) {
        console.error("Error loading password:", chrome.runtime.lastError);
        showConnectionError("Error loading settings");
        return;
      }

      if (result.bskyIdentifier && local.bskyPassword) {
        statusDiv.textContent = "Connected as: " + result.bskyIdentifier;
        statusDiv.className = "status connected";
      } else {
        statusDiv.textContent = "Not connected to Bluesky";
        statusDiv.className = "status disconnected";
      }
    });
  });

  // Open settings page when button is clicked
  settingsButton.addEventListener("click", function () {
    chrome.runtime.openOptionsPage();
  });
});

function showConnectionError(message) {
  const statusDiv = document.getElementById("connectionStatus");
  statusDiv.textContent = message;
  statusDiv.className = "status disconnected";
}
