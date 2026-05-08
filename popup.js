document.addEventListener('DOMContentLoaded', async () => {
  // SVG Icons
  const EYE_OPEN = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const EYE_CLOSED = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

  // Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const content = document.getElementById(btn.dataset.tab);
      if (content) content.classList.add('active');
    });
  });

  // Load Data
  const data = await chrome.storage.local.get(['searchFilters', 'googleModules', 'infiniteScroll', 'hiddenTabs', 'preferredDomains', 'blockedKeywords', 'highlightEnabled', 'highlightColor', 'navBtnsEnabled', 'themeColors']);
  
  let searchFilters = data.searchFilters || [];
  let googleModules = data.googleModules || {};
  let hiddenTabs = data.hiddenTabs || {};
  let preferredDomains = data.preferredDomains || [];
  let blockedKeywords = data.blockedKeywords || [];

  // General Settings
  const infiniteToggle = document.getElementById('infinite-scroll');
  const advSearchToggle = document.getElementById('advanced-search');
  const navBtnsToggle = document.getElementById('nav-btns-enabled');
  
  infiniteToggle.checked = !!data.infiniteScroll;
  advSearchToggle.checked = data.advancedSearch !== false;
  navBtnsToggle.checked = data.navBtnsEnabled !== false;

  const saveToStorage = () => {
    chrome.storage.local.set({
      infiniteScroll: infiniteToggle.checked,
      advancedSearch: advSearchToggle.checked,
      navBtnsEnabled: navBtnsToggle.checked,
      googleModules,
      hiddenTabs,
      searchFilters,
      preferredDomains,
      blockedKeywords,
      highlightEnabled: document.getElementById('highlight-enabled').checked,
      highlightColor: document.getElementById('color-primary').value
    }, triggerLiveUpdate);
  };

  [infiniteToggle, advSearchToggle, navBtnsToggle].forEach(el => el.addEventListener('change', saveToStorage));

  // Collapsibles
  function setupCollapsible(headerId, contentId, arrowId) {
    const header = document.getElementById(headerId);
    const content = document.getElementById(contentId);
    const arrow = document.getElementById(arrowId);
    if (!header || !content) return;
    header.addEventListener('click', () => {
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? 'block' : 'none';
      if (arrow) arrow.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
    });
  }
  setupCollapsible('tabs-toggle', 'tabs-content', 'tabs-arrow');
  setupCollapsible('modules-toggle', 'modules-content', 'modules-arrow');
  setupCollapsible('block-domains-toggle', 'block-domains-content', 'block-domains-arrow');
  setupCollapsible('keywords-toggle', 'keywords-content', 'keywords-arrow');

  // Eye Buttons
  function updateEyeUI(btn, isHidden) {
    btn.innerHTML = isHidden ? EYE_CLOSED : EYE_OPEN;
    btn.classList.toggle('hidden', isHidden);
  }

  document.querySelectorAll('.eye-btn').forEach(btn => {
    const key = btn.dataset.hide;
    const isMod = key.startsWith('mod-');
    const actualKey = key.replace('mod-', '').replace('tab-', '');
    const stateObj = isMod ? googleModules : hiddenTabs;
    
    updateEyeUI(btn, !!stateObj[actualKey]);
    
    btn.addEventListener('click', () => {
      stateObj[actualKey] = !stateObj[actualKey];
      updateEyeUI(btn, !!stateObj[actualKey]);
      saveToStorage();
    });
  });

  // Theme System
  const colorPrimary = document.getElementById('color-primary');
  const colorBg = document.getElementById('color-bg');
  const colorSecondary = document.getElementById('color-secondary');
  const themePresets = document.querySelectorAll('.theme-preset');

  const themes = {
    midnight: { p: '#38bdf8', b: '#0f172a', s: '#1e293b' },
    ocean: { p: '#0ea5e9', b: '#082f49', s: '#0c4a6e' },
    forest: { p: '#10b981', b: '#064e3b', s: '#065f46' },
    sunset: { p: '#f43f5e', b: '#450a0a', s: '#881337' },
    cyber: { p: '#d946ef', b: '#2e1065', s: '#4c1d95' },
    classic: { p: '#6366f1', b: '#111111', s: '#1f2937' }
  };

  const applyTheme = (colors) => {
    const r = document.documentElement;
    r.style.setProperty('--primary', colors.p);
    r.style.setProperty('--bg-main', colors.b);
    r.style.setProperty('--bg-card', colors.s);
    r.style.setProperty('--border', colors.s);
    r.style.setProperty('--bg-input', colors.s);
    
    colorPrimary.value = colors.p;
    colorBg.value = colors.b;
    colorSecondary.value = colors.s;
  };

  if (data.themeColors) applyTheme(data.themeColors);
  else applyTheme(themes.midnight);

  themePresets.forEach(btn => {
    btn.addEventListener('click', () => {
      const colors = themes[btn.dataset.theme];
      if (colors) {
        applyTheme(colors);
        chrome.storage.local.set({ themeColors: colors });
      }
    });
  });

  [colorPrimary, colorBg, colorSecondary].forEach(el => {
    el.addEventListener('input', () => {
      const colors = { p: colorPrimary.value, b: colorBg.value, s: colorSecondary.value };
      applyTheme(colors);
      chrome.storage.local.set({ themeColors: colors });
    });
  });

  // List Rendering
  function renderList(list, elementId, storageKey) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = '';
    list.forEach((item, idx) => {
      const li = document.createElement('li');
      li.textContent = item;
      const del = document.createElement('button');
      del.textContent = '✕';
      del.className = 'delete-btn';
      del.onclick = () => {
        list.splice(idx, 1);
        saveToStorage();
        renderList(list, elementId, storageKey);
      };
      li.appendChild(del);
      el.appendChild(li);
    });
  }

  renderList(searchFilters, 'site-list', 'searchFilters');
  renderList(blockedKeywords, 'keyword-list', 'blockedKeywords');

  document.getElementById('add-btn').onclick = () => {
    const input = document.getElementById('site-input');
    const val = input.value.trim().toLowerCase();
    if (val && !searchFilters.includes(val)) {
      searchFilters.push(val);
      input.value = '';
      saveToStorage();
      renderList(searchFilters, 'site-list', 'searchFilters');
    }
  };

  document.getElementById('add-keyword-btn').onclick = () => {
    const input = document.getElementById('keyword-input');
    const val = input.value.trim().toLowerCase();
    if (val && !blockedKeywords.includes(val)) {
      blockedKeywords.push(val);
      input.value = '';
      saveToStorage();
      renderList(blockedKeywords, 'keyword-list', 'blockedKeywords');
    }
  };

  // Highlighting
  const highToggle = document.getElementById('highlight-enabled');
  highToggle.checked = !!data.highlightEnabled;
  highToggle.addEventListener('change', saveToStorage);

  // Global Save UI
  const mainSaveBtn = document.querySelector('.save-btn');
  mainSaveBtn.onclick = () => {
    saveToStorage();
    mainSaveBtn.textContent = '✓ Saved';
    mainSaveBtn.style.background = '#10b981';
    setTimeout(() => {
      mainSaveBtn.textContent = 'Save Settings';
      mainSaveBtn.style.background = 'var(--primary)';
    }, 2000);
  };

  async function triggerLiveUpdate() {
    const tabs = await chrome.tabs.query({ url: "*://*.google.*/search*" });
    for (let t of tabs) chrome.tabs.sendMessage(t.id, { action: "live_update" }).catch(() => {});
  }

  // Backup
  document.getElementById('export-btn').onclick = async () => {
    const d = await chrome.storage.local.get(null);
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `search-optimizer-v2.3.0.json`;
    a.click();
  };

  document.getElementById('import-btn').onclick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const reader = new FileReader();
      reader.onload = async re => {
        await chrome.storage.local.set(JSON.parse(re.target.result));
        window.location.reload();
      };
      reader.readAsText(e.target.files[0]);
    };
    input.click();
  };
});
