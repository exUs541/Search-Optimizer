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
  let highlightFilters = store.highlightFilters || [];
  let highlightKeywords = store.highlightKeywords || [];

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

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const applyThemeToUI = (colors, navColor, navBg) => {
    const r = document.documentElement;
    r.style.setProperty('--primary', colors.p);
    r.style.setProperty('--primary-hover', hexToRgba(colors.p, 0.8));
    r.style.setProperty('--bg-main', colors.b);
    r.style.setProperty('--bg-card', colors.s);
    r.style.setProperty('--border', colors.s);
    r.style.setProperty('--bg-input', colors.s);
    r.style.setProperty('--accent-glow', hexToRgba(colors.p, 0.15));
    
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
      googleModules, 
      hiddenTabs, 
      searchFilters, 
      blockedKeywords,
      highlightFilters,
      highlightKeywords,
      themeColors: { p: colorPrimary.value, b: colorBg.value, s: colorSecondary.value },
      navBtnColor: colorNav.value,
      navBtnBgColor: colorNavBg.value
    });
    await triggerLiveUpdate();
  };

  // Init UI from Storage
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
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    };
  });

  // Collapsibles
  const setupColl = (hId, cId, aId) => {
    const h = document.getElementById(hId);
    const c = document.getElementById(cId);
    const a = document.getElementById(aId);
    if (h && c) {
        c.style.display = 'none'; // Default hidden
        h.onclick = () => {
          const isHidden = c.style.display === 'none';
          c.style.display = isHidden ? 'block' : 'none';
          if (a) a.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
        };
    }
  };
  setupColl('tabs-toggle', 'tabs-content', 'tabs-arrow');
  setupColl('modules-toggle', 'modules-content', 'modules-arrow');
  setupColl('block-domains-toggle', 'block-domains-content', 'block-domains-arrow');
  setupColl('keywords-toggle', 'keywords-content', 'keywords-arrow');
  setupColl('highlight-domains-toggle', 'highlight-domains-content', 'highlight-domains-arrow');
  setupColl('highlight-keywords-toggle', 'highlight-keywords-content', 'highlight-keywords-arrow');

  // Unpack More Logic
  const unpackMoreSwitch = document.getElementById('tab-unpack-more');
  if (unpackMoreSwitch) {
    unpackMoreSwitch.checked = !!hiddenTabs['unpack-more'];
    unpackMoreSwitch.onchange = async () => {
      hiddenTabs['unpack-more'] = unpackMoreSwitch.checked;
      await saveAll();
    };
  }

  // Dynamic Eye Buttons
  const updateEye = (btn, hide) => { 
    btn.innerHTML = hide ? EYE_CLOSED : EYE_OPEN; 
    btn.classList.toggle('hidden', hide); 
  };
  
  document.querySelectorAll('.eye-btn').forEach(btn => {
    const key = btn.dataset.hide;
    if (!key) return;
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
    btn.onclick = async () => { 
      const c = themes[btn.dataset.theme]; 
      applyThemeToUI(c, c.p, c.s); 
      await saveAll(); 
    };
  });

  const setupColorPair = (picker, hex) => {
    picker.oninput = async () => { 
      syncHex(picker, hex); 
      applyThemeToUI({ p: colorPrimary.value, b: colorBg.value, s: colorSecondary.value }, colorNav.value, colorNavBg.value); 
      await saveAll(); 
    };
    hex.oninput = async () => { 
      if (/^#[0-9A-F]{6}$/i.test(hex.value)) { 
        picker.value = hex.value; 
        applyThemeToUI({ p: colorPrimary.value, b: colorBg.value, s: colorSecondary.value }, colorNav.value, colorNavBg.value); 
        await saveAll(); 
      } 
    };
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
    const el = document.getElementById(elId); 
    if (!el) return;
    el.innerHTML = '';

    // Wir erstellen eine Kopie der Liste, um sicher zu rendern
    [...list].forEach((it) => {
      const li = document.createElement('li'); 
      li.textContent = it;

      const d = document.createElement('button'); 
      d.textContent = '✕'; 
      d.className = 'delete-btn';
      
      d.onclick = async (e) => {
        e.preventDefault();
        
        // Direkte Löschung über den Wert (robuster als Index)
        if (elId === 'site-list') {
            searchFilters = searchFilters.filter(domain => domain !== it);
            await saveAll();
            render(searchFilters, 'site-list');
        } else if (elId === 'keyword-list') {
            blockedKeywords = blockedKeywords.filter(kw => kw !== it);
            await saveAll();
            render(blockedKeywords, 'keyword-list');
        } else if (elId === 'highlight-site-list') {
            highlightFilters = highlightFilters.filter(domain => domain !== it);
            await saveAll();
            render(highlightFilters, 'highlight-site-list');
        } else if (elId === 'highlight-keyword-list') {
            highlightKeywords = highlightKeywords.filter(kw => kw !== it);
            await saveAll();
            render(highlightKeywords, 'highlight-keyword-list');
        }
      };

      li.appendChild(d); 
      el.appendChild(li);
    });
  };

  // Initialer Render beim Laden
  render(searchFilters, 'site-list'); 
  render(blockedKeywords, 'keyword-list');
  render(highlightFilters, 'highlight-site-list');
  render(highlightKeywords, 'highlight-keyword-list');
  
  document.getElementById('add-btn').onclick = async () => {
    const i = document.getElementById('site-input');
    const val = i.value.trim().toLowerCase();
    if (val && !searchFilters.includes(val)) { 
      searchFilters.push(val); 
      i.value = ''; 
      await saveAll(); 
      render(searchFilters, 'site-list'); 
    }
  };
  document.getElementById('add-keyword-btn').onclick = async () => {
    const i = document.getElementById('keyword-input');
    const val = i.value.trim().toLowerCase();
    if (val && !blockedKeywords.includes(val)) { 
      blockedKeywords.push(val); 
      i.value = ''; 
      await saveAll(); 
      render(blockedKeywords, 'keyword-list'); 
    }
  };

  document.getElementById('add-highlight-btn').onclick = async () => {
    const i = document.getElementById('highlight-site-input');
    const val = i.value.trim().toLowerCase();
    if (val && !highlightFilters.includes(val)) { 
      highlightFilters.push(val); 
      i.value = ''; 
      await saveAll(); 
      render(highlightFilters, 'highlight-site-list'); 
    }
  };

  document.getElementById('add-highlight-keyword-btn').onclick = async () => {
    const i = document.getElementById('highlight-keyword-input');
    const val = i.value.trim().toLowerCase();
    if (val && !highlightKeywords.includes(val)) { 
      highlightKeywords.push(val); 
      i.value = ''; 
      await saveAll(); 
      render(highlightKeywords, 'highlight-keyword-list'); 
    }
  };

  // General Switches
  document.querySelectorAll('.switch input').forEach(s => {
    s.onchange = async () => { await saveAll(); };
  });

  // Backup & Restore
  document.getElementById('export-btn').onclick = async () => {
    const d = await chrome.storage.local.get(null);
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = `search-optimizer-export.json`; 
    a.click();
    URL.revokeObjectURL(url);
  };
  
  document.getElementById('import-btn').onclick = () => {
    const i = document.createElement('input'); 
    i.type = 'file'; 
    i.accept = '.json';
    i.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const r = new FileReader(); 
      r.onload = async re => { 
        try {
          const config = JSON.parse(re.target.result);
          await chrome.storage.local.clear();
          await chrome.storage.local.set(config); 
          window.location.reload(); 
        } catch (err) {
          alert('Error parsing JSON file.');
        }
      };
      r.readAsText(file);
    };
    i.click();
  };
});