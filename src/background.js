import { BskyAgent } from '@atproto/api';

console.log('Background script loaded!');

// Create Bluesky agent
const agent = new BskyAgent({
  service: 'https://bsky.social'
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message in background script:', message);
  
  if (message.type === 'POST_TO_BLUESKY') {
    console.log('Processing POST_TO_BLUESKY request with content:', message.content);
    
    handleBluskyPost(message.content)
      .then(response => {
        console.log('Successfully posted to Bluesky:', response);
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        console.error('Error posting to Bluesky:', error);
        sendResponse({ success: false, error: error.message || 'Unknown error' });
      });
    return true; // Required for async response
  }
});

async function handleBluskyPost(content) {
  try {
    console.log('Getting credentials from storage...');
    // Get credentials from storage
    const { bskyIdentifier, bskyPassword } = await new Promise((resolve) => {
      chrome.storage.sync.get(['bskyIdentifier'], (result) => {
        chrome.storage.local.get(['bskyPassword'], (local) => {
          console.log('Retrieved identifier:', result.bskyIdentifier);
          console.log('Password exists:', !!local.bskyPassword);
          resolve({
            bskyIdentifier: result.bskyIdentifier,
            bskyPassword: local.bskyPassword
          });
        });
      });
    });

    if (!bskyIdentifier || !bskyPassword) {
      throw new Error('Bluesky credentials not found. Please check extension settings.');
    }

    console.log('Attempting to login to Bluesky as:', bskyIdentifier);
    // Login to Bluesky
    await agent.login({
      identifier: bskyIdentifier,
      password: bskyPassword
    });
    console.log('Successfully logged in to Bluesky');

    console.log('Creating Bluesky post with content:', content);
    // Create the post
    const response = await agent.post({
      text: content
    });
    console.log('Post created successfully:', response);

    return response;
  } catch (error) {
    console.error('Detailed error posting to Bluesky:', {
      message: error.message,
      stack: error.stack,
      error
    });
    throw error;
  }
}
