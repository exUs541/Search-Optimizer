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

function incrementBlockedCount() {
  chrome.storage.local.get(['noAiBlockedCountLocal'], (result) => {
    const current = result.noAiBlockedCountLocal || 0;
    chrome.storage.local.set({ noAiBlockedCountLocal: current + 1 });
  });
}

async function syncCountToChromeSync() {
  const store = await chrome.storage.local.get(['noAiBlockedCountLocal', 'noAiSyncEnabled']);
  if (store.noAiSyncEnabled) {
    try {
      await chrome.storage.sync.set({ noAiBlockedCountSync: store.noAiBlockedCountLocal || 0 });
      console.log('[Search Optimizer] Blocked count synced to cloud:', store.noAiBlockedCountLocal);
    } catch (e) {
      console.error('[Search Optimizer] Cloud sync failed:', e);
    }
  }
}

// 1. Navigation Redirection for Blocked Mode
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  
  const urlStr = details.url;
  if (!isGoogleSearchUrl(urlStr)) return;

  const store = await chrome.storage.local.get(['noAiMode']);
  if (store.noAiMode !== 'blocked') return;

  try {
    const url = new URL(urlStr);
    const q = url.searchParams.get('q');
    if (q && !q.toLowerCase().includes('-noai')) {
      url.searchParams.set('q', q + ' -noai');
      
      // Redirect
      chrome.tabs.update(details.tabId, { url: url.toString() });
      
      // Increment blocked count since we redirected/appended -noai
      incrementBlockedCount();
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
  } else if (request.action === 'increment_noai_count') {
    incrementBlockedCount();
  }
});

// 3. Alarms and Cloud Syncing
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('noAiSyncAlarm', { periodInMinutes: 5 });
});
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('noAiSyncAlarm', { periodInMinutes: 5 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'noAiSyncAlarm') {
    syncCountToChromeSync();
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && (changes.noAiSyncEnabled || changes.noAiBlockedCountLocal)) {
    syncCountToChromeSync();
  }
});
