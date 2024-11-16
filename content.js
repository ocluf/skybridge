console.log("Content script loaded for Skybridge!");

// Bluesky SVG icon as a string (scaled down and optimized)
const BLUESKY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 600 530" style="vertical-align: middle; margin-left: 4px;">
    <path d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z"/>
</svg>`;

// X (Twitter) SVG icon as a string
const X_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 300 300.251" style="vertical-align: middle;">
  <path d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66"/>
</svg>`;

// Function to observe DOM changes
function observePostButton() {
  console.log("Starting to observe for post button...");
  // Add selectors for both popup and main page buttons
  const postButtonSelectors = [
    '[data-testid="tweetButton"]',
    '[data-testid="tweetButtonInline"]',
  ];

  // Function to update button text and add icon
  function updateButton(button) {
    const spanElement = button.querySelector("span > span");
    if (
      spanElement &&
      spanElement.textContent.toLowerCase().includes("post") &&
      !button.hasAttribute("sky-icon-added")
    ) {
      // Create a container for text and icons
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.alignItems = "center";
      container.style.justifyContent = "center";
      container.style.gap = "2px";

      // Add the text and X icon
      const textSpan = document.createElement("span");
      textSpan.textContent = "Post to";
      textSpan.style.marginRight = "4px";
      container.appendChild(textSpan);

      // Add the X icon
      const xIconContainer = document.createElement("div");
      xIconContainer.innerHTML = X_ICON;
      xIconContainer.style.display = "inline-flex";
      const xSvgElement = xIconContainer.querySelector("svg path");
      if (xSvgElement) {
        xSvgElement.style.fill = "currentColor";
      }
      container.appendChild(xIconContainer);

      const andSpan = document.createElement("span");
      container.appendChild(andSpan);

      // Add the Bluesky icon
      const bskyIconContainer = document.createElement("div");
      bskyIconContainer.innerHTML = BLUESKY_ICON;
      bskyIconContainer.style.display = "inline-flex";
      const bskySvgElement = bskyIconContainer.querySelector("svg path");
      if (bskySvgElement) {
        bskySvgElement.style.fill = "currentColor";
      }
      container.appendChild(bskyIconContainer);

      // Replace the original content
      spanElement.textContent = "";
      spanElement.appendChild(container);
      button.setAttribute("sky-icon-added", "true");
    }
  }

  // Create a mutation observer to watch for DOM changes
  const observer = new MutationObserver((mutations) => {
    // Try each selector
    for (const selector of postButtonSelectors) {
      const postButton = document.querySelector(selector);
      if (postButton) {
        if (!postButton.hasAttribute("sky-monitored")) {
          console.log("Post button found!");
          // Add our custom event listener
          postButton.setAttribute("sky-monitored", "true");
          // Capture content before the click event
          postButton.addEventListener("mousedown", captureContent);
          postButton.addEventListener("click", handlePost);
        }
        // Always try to update the button
        updateButton(postButton);
      }
    }
  });

  // Start observing the document with the configured parameters
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  // Also check immediately in case the button is already there
  for (const selector of postButtonSelectors) {
    const postButton = document.querySelector(selector);
    if (postButton) {
      if (!postButton.hasAttribute("sky-monitored")) {
        console.log("Post button found immediately!");
        postButton.setAttribute("sky-monitored", "true");
        // Capture content before the click event
        postButton.addEventListener("mousedown", captureContent);
        postButton.addEventListener("click", handlePost);
      }
      // Always try to update the button
      updateButton(postButton);
    }
  }
}

// Store the captured content
let capturedTweetContent = null;

// Function to capture tweet content before the click
function captureContent(event) {
  console.log("Capturing tweet content before click...");
  const tweetInput = document.querySelector('[data-testid="tweetTextarea_0"]');
  if (tweetInput) {
    capturedTweetContent = tweetInput.textContent || tweetInput.value;
    console.log("Captured tweet content:", capturedTweetContent);
  } else {
    console.warn("Could not find tweet input element during capture");
  }
}

// Function to get tweet content
function getTweetContent() {
  console.log("Getting tweet content...");
  // First try to use captured content
  if (capturedTweetContent) {
    console.log("Using captured content:", capturedTweetContent);
    const content = capturedTweetContent;
    capturedTweetContent = null; // Clear it after use
    return content;
  }

  // Fallback to trying to get it directly
  console.log("Falling back to direct content retrieval...");
  const tweetInput = document.querySelector('[data-testid="tweetTextarea_0"]');
  if (tweetInput) {
    const content = tweetInput.textContent || tweetInput.value;
    console.log("Found tweet content directly:", content);
    return content;
  }
  console.warn("Could not find tweet input element");
  return null;
}

// Function to handle when a post is made
function handlePost() {
  console.log("Post button clicked, getting content...");
  const content = getTweetContent();
  if (content) {
    console.log("Sending tweet to Bluesky:", content);
    // Send the content to the background script
    chrome.runtime.sendMessage(
      { type: "POST_TO_BLUESKY", content: content },
      (response) => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError;
          console.error("Error sending message to background script:", error);
          alert("Error sending to background script: " + error.message);
          return;
        }

        if (response && response.success) {
          console.log("Successfully posted to Bluesky:", response.data);
          alert(
            "Successfully cross-posted to Bluesky! Post URI: " +
              response.data.uri
          );
        } else {
          const errorMsg = response ? response.error : "Unknown error";
          console.error("Failed to post to Bluesky:", errorMsg);
          alert("Failed to post to Bluesky: " + errorMsg);
        }
      }
    );
  } else {
    const error = "Could not find tweet content";
    console.error(error);
    alert(error);
  }
}

// Start observing when the content script loads
console.log("Starting observation...");
observePostButton();
