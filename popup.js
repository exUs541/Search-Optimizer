document.addEventListener('DOMContentLoaded', async () => {
  // SVG Icons
  const EYE_OPEN = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const EYE_CLOSED = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

  // State
  let store = await chrome.storage.local.get(null);
  let googleModules = store.googleModules || {};
  let hiddenTabs = store.hiddenTabs || {};
  let searchFilters = store.searchFilters || [];
  let blockedKeywords = store.blockedKeywords || [];

  // Elements
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const colorPrimary = document.getElementById('color-primary');
  const colorBg = document.getElementById('color-bg');
  const colorSecondary = document.getElementById('color-secondary');
  const colorNav = document.getElementById('color-nav');
  const saveBtn = document.querySelector('.save-btn');

  const themes = {
    midnight: { p: '#38bdf8', b: '#0f172a', s: '#1e293b' },
    ocean: { p: '#0ea5e9', b: '#082f49', s: '#0c4a6e' },
    forest: { p: '#10b981', b: '#064e3b', s: '#065f46' },
    sunset: { p: '#f43f5e', b: '#450a0a', s: '#881337' },
    cyber: { p: '#d946ef', b: '#2e1065', s: '#4c1d95' },
    classic: { p: '#6366f1', b: '#111111', s: '#1f2937' }
  };

  // ─── Core Functions ────────────────────────────────────────────────────────
  async function triggerLiveUpdate() {
    const tabs = await chrome.tabs.query({ url: "*://*.google.*/search*" });
    for (let t of tabs) chrome.tabs.sendMessage(t.id, { action: "live_update" }).catch(() => {});
  }

  const applyThemeToUI = (colors, navColor) => {
    const r = document.documentElement;
    r.style.setProperty('--primary', colors.p);
    r.style.setProperty('--bg-main', colors.b);
    r.style.setProperty('--bg-card', colors.s);
    r.style.setProperty('--border', colors.s);
    r.style.setProperty('--bg-input', colors.s);
    
    colorPrimary.value = colors.p;
    colorBg.value = colors.b;
    colorSecondary.value = colors.s;
    if (navColor) colorNav.value = navColor;
  };

  const saveAll = async () => {
    const themeColors = { p: colorPrimary.value, b: colorBg.value, s: colorSecondary.value };
    const navBtnColor = colorNav.value;
    
    await chrome.storage.local.set({
      infiniteScroll: document.getElementById('infinite-scroll').checked,
      advancedSearch: document.getElementById('advanced-search').checked,
      navBtnsEnabled: document.getElementById('nav-btns-enabled').checked,
      highlightEnabled: document.getElementById('highlight-enabled').checked,
      highlightColor: colorPrimary.value,
      googleModules,
      hiddenTabs,
      searchFilters,
      blockedKeywords,
      themeColors,
      navBtnColor
    });
    triggerLiveUpdate();
  };

  // ─── Init ──────────────────────────────────────────────────────────────────
  if (store.themeColors) applyThemeToUI(store.themeColors, store.navBtnColor);
  else applyThemeToUI(themes.midnight, themes.midnight.p);

  document.getElementById('infinite-scroll').checked = !!store.infiniteScroll;
  document.getElementById('advanced-search').checked = store.advancedSearch !== false;
  document.getElementById('nav-btns-enabled').checked = store.navBtnsEnabled !== false;
  document.getElementById('highlight-enabled').checked = !!store.highlightEnabled;

  // Tabs
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Collapsibles
  const setupColl = (hId, cId) => {
    const h = document.getElementById(hId);
    const c = document.getElementById(cId);
    if (h && c) h.onclick = () => { c.style.display = c.style.display === 'none' ? 'block' : 'none'; };
  };
  setupColl('tabs-toggle', 'tabs-content');
  setupColl('modules-toggle', 'modules-content');
  setupColl('block-domains-toggle', 'block-domains-content');
  setupColl('keywords-toggle', 'keywords-content');

  // Eyes
  const updateEye = (btn, hide) => { btn.innerHTML = hide ? EYE_CLOSED : EYE_OPEN; btn.classList.toggle('hidden', hide); };
  document.querySelectorAll('.eye-btn').forEach(btn => {
    const key = btn.dataset.hide;
    const isMod = key.startsWith('mod-');
    const actualKey = key.replace('mod-', '').replace('tab-', '');
    const obj = isMod ? googleModules : hiddenTabs;
    updateEye(btn, !!obj[actualKey]);
    btn.onclick = () => { obj[actualKey] = !obj[actualKey]; updateEye(btn, !!obj[actualKey]); saveAll(); };
  });

  // Theme Logic
  document.querySelectorAll('.theme-preset').forEach(btn => {
    btn.onclick = () => {
      const c = themes[btn.dataset.theme];
      applyThemeToUI(c, c.p);
      saveAll();
    };
  });

  [colorPrimary, colorBg, colorSecondary, colorNav].forEach(el => {
    el.oninput = () => {
      applyThemeToUI({ p: colorPrimary.value, b: colorBg.value, s: colorSecondary.value }, colorNav.value);
      saveAll();
    };
  });

  // Select Alls
  document.getElementById('mod-select-all').onclick = () => {
    const state = !Object.values(googleModules).every(v => v);
    Object.keys(googleModules).forEach(k => googleModules[k] = state);
    document.querySelectorAll('[data-hide^="mod-"]').forEach(b => updateEye(b, state));
    saveAll();
  };
  document.getElementById('tabs-select-all').onclick = () => {
    const state = !Object.values(hiddenTabs).every(v => v);
    Object.keys(hiddenTabs).forEach(k => hiddenTabs[k] = state);
    document.querySelectorAll('[data-hide^="tab-"]').forEach(b => updateEye(b, state));
    saveAll();
  };

  // Lists
  const render = (list, elId, key) => {
    const el = document.getElementById(elId); if (!el) return;
    el.innerHTML = '';
    list.forEach((it, i) => {
      const li = document.createElement('li'); li.textContent = it;
      const d = document.createElement('button'); d.textContent = '✕'; d.className = 'delete-btn';
      d.onclick = () => { list.splice(i, 1); saveAll(); render(list, elId, key); };
      li.appendChild(d); el.appendChild(li);
    });
  };
  render(searchFilters, 'site-list', 'searchFilters');
  render(blockedKeywords, 'keyword-list', 'blockedKeywords');

  document.getElementById('add-btn').onclick = () => {
    const i = document.getElementById('site-input');
    if (i.value && !searchFilters.includes(i.value)) { searchFilters.push(i.value.toLowerCase()); i.value = ''; saveAll(); render(searchFilters, 'site-list'); }
  };
  document.getElementById('add-keyword-btn').onclick = () => {
    const i = document.getElementById('keyword-input');
    if (i.value && !blockedKeywords.includes(i.value)) { blockedKeywords.push(i.value.toLowerCase()); i.value = ''; saveAll(); render(blockedKeywords, 'keyword-list'); }
  };

  // Switches
  document.querySelectorAll('.switch input').forEach(s => s.onchange = saveAll);

  // Global Save
  saveBtn.onclick = () => {
    saveAll();
    saveBtn.textContent = '✓ Saved';
    saveBtn.style.background = '#10b981';
    setTimeout(() => { saveBtn.textContent = 'Save Settings'; saveBtn.style.background = 'var(--primary)'; }, 2000);
  };

  // Backup
  document.getElementById('export-btn').onclick = async () => {
    const d = await chrome.storage.local.get(null);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }));
    a.download = `search-optimizer-v2.3.2.json`; a.click();
  };
  document.getElementById('import-btn').onclick = () => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = '.json';
    i.onchange = e => {
      const r = new FileReader(); r.onload = async re => { await chrome.storage.local.set(JSON.parse(re.target.result)); window.location.reload(); };
      r.readAsText(e.target.files[0]);
    };
    i.click();
  };
});
