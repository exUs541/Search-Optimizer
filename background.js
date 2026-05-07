chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'download_image') {
    chrome.downloads.download({
      url: request.url,
      saveAs: true // Allow user to choose folder as requested
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('[Search Optimizer] Download failed:', chrome.runtime.lastError.message);
      } else {
        console.log('[Search Optimizer] Download started:', downloadId);
      }
    });
  }
});
