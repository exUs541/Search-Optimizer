function isGoogleSearchUrl(urlStr) {
  try {
    const url = new URL(urlStr);
    const isGoogle = /(^|\.)google\.(com|de|at|ch|co\.uk|fr|es|it|nl|be)$/.test(url.hostname);
    const isSearch = url.pathname === '/search';
    return isGoogle && isSearch;
  } catch (e) {
    return false;
  }
}

// 1. Navigation Redirection for Hidden AI Overviews
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  
  const urlStr = details.url;
  if (!isGoogleSearchUrl(urlStr)) return;

  const store = await chrome.storage.local.get(['googleModules']);
  if (!store.googleModules?.ai) return;

  try {
    const url = new URL(urlStr);
    const q = url.searchParams.get('q');
    if (q && !q.toLowerCase().includes('-noai')) {
      url.searchParams.set('q', q + ' -noai');
      
      // Redirect
      chrome.tabs.update(details.tabId, { url: url.toString() });
    }
  } catch (e) {
    console.error('[Search Optimizer] Error redirecting search:', e);
  }
});

// 2. Messaging Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'download_image') {
    chrome.downloads.download({
      url: request.url,
      saveAs: true
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('[Search Optimizer] Download failed:', chrome.runtime.lastError.message);
      } else {
        console.log('[Search Optimizer] Download started:', downloadId);
      }
    });
  }
});
