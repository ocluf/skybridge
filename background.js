// Import the Bluesky API
importScripts('https://unpkg.com/@atproto/api@0.6.23/dist/bundle.js');

const { BskyAgent } = atproto;

// Create Bluesky agent
const agent = new BskyAgent({
  service: 'https://bsky.social'
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'POST_TO_BLUESKY') {
    handleBluskyPost(message.content)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async response
  }
});

async function handleBluskyPost(content) {
  try {
    // Get credentials from storage
    const { bskyIdentifier, bskyPassword } = await new Promise((resolve) => {
      chrome.storage.sync.get(['bskyIdentifier'], (result) => {
        chrome.storage.local.get(['bskyPassword'], (local) => {
          resolve({
            bskyIdentifier: result.bskyIdentifier,
            bskyPassword: local.bskyPassword
          });
        });
      });
    });

    if (!bskyIdentifier || !bskyPassword) {
      throw new Error('Bluesky credentials not found');
    }

    // Login to Bluesky
    await agent.login({
      identifier: bskyIdentifier,
      password: bskyPassword
    });

    // Create the post
    const response = await agent.post({
      text: content
    });

    return response;
  } catch (error) {
    console.error('Error posting to Bluesky:', error);
    throw error;
  }
}
