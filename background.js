chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Replay Extension installed');
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('youtube.com/watch')) {
    chrome.action.openPopup();
  } else {
    chrome.tabs.create({ url: 'https://www.youtube.com' });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com/watch')) {
    chrome.action.setIcon({
      tabId: tabId,
      path: {
        16: 'icons/icon16.png',
        32: 'icons/icon32.png',
        48: 'icons/icon48.png',
        128: 'icons/icon128.png'
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'stopReplay') {
    chrome.runtime.sendMessage({ action: 'stopReplay' });
  }
  return true;
});