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

  const store = await chrome.storage.local.get(['googleModules', 'extensionEnabled']);
  if (store.extensionEnabled === false) return;
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

// Master switch: while it is off the toolbar badge shows OFF.
function applyBadge(enabled) {
  chrome.action.setBadgeText({ text: enabled ? '' : 'OFF' });
  if (!enabled) chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
}
async function syncBadge() {
  const { extensionEnabled } = await chrome.storage.local.get('extensionEnabled');
  applyBadge(extensionEnabled !== false);
}
chrome.runtime.onInstalled.addListener(syncBadge);
chrome.runtime.onStartup.addListener(syncBadge);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.extensionEnabled) applyBadge(changes.extensionEnabled.newValue !== false);
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
