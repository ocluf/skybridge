// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Make sure chrome.storage is available
  if (!chrome.storage) {
    console.error("Chrome storage API not available");
    showStatus("Error: Storage API not available", false);
    return;
  }

  const passwordInputSection = document.getElementById("passwordInputSection");
  const passwordStatus = document.getElementById("passwordStatus");
  const changePasswordBtn = document.getElementById("changePasswordBtn");

  // Handle change password button click
  changePasswordBtn.addEventListener("click", function() {
    passwordInputSection.style.display = "block";
    passwordStatus.style.display = "none";
    changePasswordBtn.style.display = "none";
    document.getElementById("password").value = "";
    document.getElementById("password").focus();
  });

  // Load saved settings
  Promise.all([
    new Promise(resolve => chrome.storage.sync.get(["bskyIdentifier"], resolve)),
    new Promise(resolve => chrome.storage.local.get(["bskyPassword"], resolve))
  ]).then(([syncData, localData]) => {
    if (chrome.runtime.lastError) {
      console.error("Error loading settings:", chrome.runtime.lastError);
      return;
    }
    
    if (syncData.bskyIdentifier) {
      document.getElementById("identifier").value = syncData.bskyIdentifier;
    }
    
    if (localData.bskyPassword) {
      passwordInputSection.style.display = "none";
      passwordStatus.style.display = "inline-block";
      changePasswordBtn.style.display = "inline-block";
    } else {
      passwordInputSection.style.display = "block";
      passwordStatus.style.display = "none";
      changePasswordBtn.style.display = "none";
    }
  });

  // Add save button click handler
  document.getElementById("save").addEventListener("click", saveSettings);
});

function saveSettings() {
  const identifier = document.getElementById("identifier").value;
  const password = document.getElementById("password").value;
  const passwordInputSection = document.getElementById("passwordInputSection");
  const passwordStatus = document.getElementById("passwordStatus");
  const changePasswordBtn = document.getElementById("changePasswordBtn");

  if (!identifier) {
    showStatus("Please fill in the identifier", false);
    return;
  }

  // If password field is visible, it must be filled
  if (passwordInputSection.style.display !== "none" && !password) {
    showStatus("Please enter an app password", false);
    return;
  }

  // Save the identifier in sync storage (non-sensitive)
  chrome.storage.sync.set(
    {
      bskyIdentifier: identifier,
    },
    function () {
      if (chrome.runtime.lastError) {
        console.error("Error saving identifier:", chrome.runtime.lastError);
        showStatus("Error saving settings", false);
        return;
      }

      // Only save password if one was entered
      if (password) {
        // Save the password in local storage (more secure)
        chrome.storage.local.set(
          {
            bskyPassword: password,
          },
          function () {
            if (chrome.runtime.lastError) {
              console.error("Error saving password:", chrome.runtime.lastError);
              showStatus("Error saving settings", false);
              return;
            }
            passwordInputSection.style.display = "none";
            passwordStatus.style.display = "inline-block";
            changePasswordBtn.style.display = "inline-block";
            showStatus("Settings saved successfully!", true);
          }
        );
      } else {
        showStatus("Settings saved successfully!", true);
      }
    }
  );
}

function showStatus(message, success) {
  console.log("Status:", message, success);
  const statusDiv = document.getElementById("status");
  statusDiv.textContent = message;
  statusDiv.className = "status " + (success ? "success" : "error");
  statusDiv.style.display = "block";

  // Hide the status message after 3 seconds
  setTimeout(function () {
    statusDiv.style.display = "none";
  }, 3000);
}
