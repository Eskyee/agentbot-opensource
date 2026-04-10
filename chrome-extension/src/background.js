// Agentbot Chrome Extension — Background Service Worker

chrome.action.onClicked.addListener((tab) => {
  // If no popup, open dashboard
  chrome.tabs.create({ url: 'https://agentbot.sh/dashboard' });
});

// Listen for notifications from agent
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'notification') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: 'Agentbot',
      message: message.text,
    });
  }
  sendResponse({ received: true });
});
