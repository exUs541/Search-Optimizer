document.addEventListener('DOMContentLoaded', async () => {
  // Icons
  const EYE_OPEN = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const EYE_CLOSED = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

  // State
  let store = await chrome.storage.local.get(null);
  let googleModules = store.googleModules || {};
  let hiddenTabs = store.hiddenTabs || {};
  let searchFilters = store.searchFilters || [];
  let blockedKeywords = store.blockedKeywords || [];

  // Design Elements
  const colorPrimary = document.getElementById('color-primary');
  const hexPrimary = document.getElementById('hex-primary');
  const colorBg = document.getElementById('color-bg');
  const hexBg = document.getElementById('hex-bg');
  const colorSecondary = document.getElementById('color-secondary');
  const hexSecondary = document.getElementById('hex-secondary');
  const colorNav = document.getElementById('color-nav');
  const hexNav = document.getElementById('hex-nav');
  const colorNavBg = document.getElementById('color-nav-bg');
  const hexNavBg = document.getElementById('hex-nav-bg');

  const themes = {
    midnight: { p: '#38bdf8', b: '#0f172a', s: '#1e293b' },
    ocean: { p: '#0ea5e9', b: '#082f49', s: '#0c4a6e' },
    forest: { p: '#10b981', b: '#064e3b', s: '#065f46' },
    sunset: { p: '#f43f5e', b: '#450a0a', s: '#881337' },
    cyber: { p: '#d946ef', b: '#2e1065', s: '#4c1d95' },
    classic: { p: '#6366f1', b: '#111111', s: '#1f2937' }
  };

  const syncHex = (picker, hexInput) => { hexInput.value = picker.value.toUpperCase(); };

  const applyThemeToUI = (colors, navColor, navBg) => {
    const r = document.documentElement;
    r.style.setProperty('--primary', colors.p);
    r.style.setProperty('--bg-main', colors.b);
    r.style.setProperty('--bg-card', colors.s);
    r.style.setProperty('--border', colors.s);
    r.style.setProperty('--bg-input', colors.s);
    
    colorPrimary.value = colors.p; syncHex(colorPrimary, hexPrimary);
    colorBg.value = colors.b; syncHex(colorBg, hexBg);
    colorSecondary.value = colors.s; syncHex(colorSecondary, hexSecondary);
    if (navColor) { colorNav.value = navColor; syncHex(colorNav, hexNav); }
    if (navBg) { colorNavBg.value = navBg; syncHex(colorNavBg, hexNavBg); }
  };

  const triggerLiveUpdate = async () => {
    const tabs = await chrome.tabs.query({ url: "*://*.google.*/search*" });
    for (let t of tabs) {
      chrome.tabs.sendMessage(t.id, { action: "live_update" }).catch(() => {});
    }
  };

  const saveAll = async () => {
    await chrome.storage.local.set({
      infiniteScroll: document.getElementById('infinite-scroll').checked,
      advancedSearch: document.getElementById('advanced-search').checked,
      navBtnsEnabled: document.getElementById('nav-btns-enabled').checked,
      highlightEnabled: document.getElementById('highlight-enabled').checked,
      highlightColor: colorPrimary.value,
      googleModules, hiddenTabs, searchFilters, blockedKeywords,
      themeColors: { p: colorPrimary.value, b: colorBg.value, s: colorSecondary.value },
      navBtnColor: colorNav.value,
      navBtnBgColor: colorNavBg.value
    });
    await triggerLiveUpdate();
  };

  // Init
  applyThemeToUI(store.themeColors || themes.midnight, store.navBtnColor || themes.midnight.p, store.navBtnBgColor || themes.midnight.s);
  document.getElementById('infinite-scroll').checked = !!store.infiniteScroll;
  document.getElementById('advanced-search').checked = store.advancedSearch !== false;
  document.getElementById('nav-btns-enabled').checked = store.navBtnsEnabled !== false;
  document.getElementById('highlight-enabled').checked = !!store.highlightEnabled;

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    };
  });

  // Collapsibles
  const setupColl = (hId, cId, aId) => {
    const h = document.getElementById(hId);
    const c = document.getElementById(cId);
    const a = document.getElementById(aId);
    if (h && c) h.onclick = () => {
      const isHidden = c.style.display === 'none';
      c.style.display = isHidden ? 'block' : 'none';
      if (a) a.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
    };
  };
  setupColl('tabs-toggle', 'tabs-content', 'tabs-arrow');
  setupColl('modules-toggle', 'modules-content', 'modules-arrow');
  setupColl('block-domains-toggle', 'block-domains-content', 'block-domains-arrow');
  setupColl('keywords-toggle', 'keywords-content', 'keywords-arrow');

  // Unpack More Logic
  const unpackMoreSwitch = document.getElementById('tab-unpack-more');
  if (unpackMoreSwitch) {
    unpackMoreSwitch.checked = !!hiddenTabs['unpack-more'];
    unpackMoreSwitch.onchange = async () => {
      hiddenTabs['unpack-more'] = unpackMoreSwitch.checked;
      await saveAll();
    };
  }

  // Dynamic Eye Buttons (Handles shortvideos implicitly)
  const updateEye = (btn, hide) => { btn.innerHTML = hide ? EYE_CLOSED : EYE_OPEN; btn.classList.toggle('hidden', hide); };
  document.querySelectorAll('.eye-btn').forEach(btn => {
    const key = btn.dataset.hide;
    const actualKey = key.replace('mod-', '').replace('tab-', '');
    const obj = key.startsWith('mod-') ? googleModules : hiddenTabs;
    updateEye(btn, !!obj[actualKey]);
    
    btn.onclick = async () => {
      obj[actualKey] = !obj[actualKey];
      updateEye(btn, !!obj[actualKey]);
      await saveAll();
    };
  });

  // Design Logic
  document.querySelectorAll('.theme-preset').forEach(btn => {
    btn.onclick = async () => { const c = themes[btn.dataset.theme]; applyThemeToUI(c, c.p, c.s); await saveAll(); };
  });

  const setupColorPair = (picker, hex) => {
    picker.oninput = async () => { syncHex(picker, hex); applyThemeToUI({ p: colorPrimary.value, b: colorBg.value, s: colorSecondary.value }, colorNav.value, colorNavBg.value); await saveAll(); };
    hex.oninput = async () => { if (/^#[0-9A-F]{6}$/i.test(hex.value)) { picker.value = hex.value; applyThemeToUI({ p: colorPrimary.value, b: colorBg.value, s: colorSecondary.value }, colorNav.value, colorNavBg.value); await saveAll(); } };
  };
  setupColorPair(colorPrimary, hexPrimary); 
  setupColorPair(colorBg, hexBg); 
  setupColorPair(colorSecondary, hexSecondary);
  setupColorPair(colorNav, hexNav); 
  setupColorPair(colorNavBg, hexNavBg);

  // Fun Buttons
  document.querySelectorAll('.fun-btn').forEach(btn => {
    btn.onclick = () => {
      const ext = btn.dataset.ext;
      const query = btn.dataset.q;
      const url = ext ? ext : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      chrome.tabs.create({ url });
    };
  });

  // Lists Management
  const render = (list, elId) => {
    const el = document.getElementById(elId); if (!el) return;
    el.innerHTML = '';
    list.forEach((it, i) => {
      const li = document.createElement('li'); li.textContent = it;
      const d = document.createElement('button'); d.textContent = '✕'; d.className = 'delete-btn';
      d.onclick = async () => { list.splice(i, 1); await saveAll(); render(list, elId); };
      li.appendChild(d); el.appendChild(li);
    });
  };
  render(searchFilters, 'site-list'); 
  render(blockedKeywords, 'keyword-list');

  document.getElementById('add-btn').onclick = async () => {
    const i = document.getElementById('site-input');
    if (i.value && !searchFilters.includes(i.value.toLowerCase())) { searchFilters.push(i.value.toLowerCase()); i.value = ''; await saveAll(); render(searchFilters, 'site-list'); }
  };
  
  document.getElementById('add-keyword-btn').onclick = async () => {
    const i = document.getElementById('keyword-input');
    if (i.value && !blockedKeywords.includes(i.value.toLowerCase())) { blockedKeywords.push(i.value.toLowerCase()); i.value = ''; await saveAll(); render(blockedKeywords, 'keyword-list'); }
  };

  document.querySelectorAll('.switch input').forEach(s => s.onchange = saveAll);

  // Backup & Restore
  document.getElementById('export-btn').onclick = async () => {
    const d = await chrome.storage.local.get(null);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }));
    a.download = `search-optimizer-v2.3.8.json`; a.click();
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