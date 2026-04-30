(function () {
  'use strict';
  
  let config = { advancedSearch: true };

  async function loadAndMount() {
    const data = await chrome.storage.local.get(['advancedSearch']);
    config.advancedSearch = data.advancedSearch !== false; // Default true
    
    console.log('[Search Optimizer] Panel Config:', config);
    
    if (config.advancedSearch) {
      if (!document.getElementById('sop-btn-search')) {
        mountOperatorsUI();
      }
    } else {
      const btn = document.getElementById('sop-btn-search');
      if (btn) btn.remove();
      const panel = document.getElementById('sop-panel');
      if (panel) panel.classList.remove('open');
      const overlay = document.getElementById('sop-overlay');
      if (overlay) overlay.classList.remove('open');
    }
  }

  function mountOperatorsUI() {
    if (document.getElementById('sop-btn-search')) return;
    if (!window.location.pathname.includes('/search')) return;

    // Styles (only once)
    if (!document.getElementById('sop-style')) {
      const style = document.createElement('style');
      style.id = 'sop-style';
      style.textContent = `
        #sop-overlay { position: fixed; inset: 0; z-index: 2147483638; display: none; background: rgba(0,0,0,0.4); }
        #sop-overlay.open { display: block; }
        #sop-panel {
          position: fixed; top: 0; right: -380px; width: 360px; height: 100dvh;
          background: #0f172a; border-left: 1px solid #334155; z-index: 2147483639;
          overflow-y: auto; transition: right .28s cubic-bezier(.4,0,.2,1);
          font-family: Google Sans, Roboto, Arial, sans-serif;
          box-shadow: -6px 0 24px rgba(0,0,0,.6);
        }
        #sop-panel.open { right: 0; }
        .sop-header {
          position: sticky; top: 0; background: #0f172a; border-bottom: 1px solid #1e293b;
          padding: 16px; display: flex; align-items: center; justify-content: space-between; z-index: 1;
        }
        .sop-header h2 { margin: 0; font-size: 15px; font-weight: 600; color: #38bdf8; }
        .sop-close { background: none; border: none; color: #64748b; font-size: 20px; cursor: pointer; }
        .sop-body { padding: 16px; }
        .sop-section { margin-bottom: 18px; }
        .sop-section-title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
        .sop-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .sop-chip { padding: 4px 11px; border-radius: 16px; border: 1px solid #334155; background: #1e293b; color: #94a3b8; font-size: 12px; cursor: pointer; }
        .sop-chip:hover { border-color: #38bdf8; color: #38bdf8; }
        .sop-hr { border: 0; border-top: 1px solid #1e293b; margin: 16px 0; }
      `;
      document.head.appendChild(style);
    }

    // Overlay
    let overlay = document.getElementById('sop-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sop-overlay';
      document.body.appendChild(overlay);
    }

    // Panel
    let panel = document.getElementById('sop-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'sop-panel';
      panel.innerHTML = `
        <div class="sop-header"><h2>Search Operators</h2><button class="sop-close">✕</button></div>
        <div class="sop-body">
          <div class="sop-section"><div class="sop-section-title">File Types</div><div class="sop-chips">
            <div class="sop-chip op-item" data-op="filetype:pdf">PDF</div>
            <div class="sop-chip op-item" data-op="filetype:doc">DOC</div>
            <div class="sop-chip op-item" data-op="filetype:xls">XLS</div>
            <div class="sop-chip op-item" data-op="filetype:ppt">PPT</div>
          </div></div>
          <div class="sop-section"><div class="sop-section-title">Time Filter</div><div class="sop-chips">
            <div class="sop-chip op-item" data-op="&tbs=qdr:h">Last Hour</div>
            <div class="sop-chip op-item" data-op="&tbs=qdr:d">Last 24h</div>
            <div class="sop-chip op-item" data-op="&tbs=qdr:w">Last Week</div>
            <div class="sop-chip op-item" data-op="&tbs=qdr:m">Last Month</div>
            <div class="sop-chip op-item" data-op="&tbs=qdr:y">Last Year</div>
          </div></div>
          <div class="sop-section"><div class="sop-section-title">Site Search</div><div class="sop-chips">
            <div class="sop-chip op-item" data-op="site:reddit.com">Reddit</div>
            <div class="sop-chip op-item" data-op="site:stackoverflow.com">StackOverflow</div>
            <div class="sop-chip op-item" data-op="site:wikipedia.org">Wikipedia</div>
          </div></div>
        </div>
      `;
      document.body.appendChild(panel);
    }

    const open = () => { panel.classList.add('open'); overlay.classList.add('open'); };
    const close = () => { panel.classList.remove('open'); overlay.classList.remove('open'); };
    panel.querySelector('.sop-close').onclick = close;
    overlay.onclick = close;

    panel.querySelectorAll('.op-item').forEach(chip => {
      chip.onclick = () => {
        const op = chip.dataset.op;
        const searchInput = document.querySelector('input[name="q"], textarea[name="q"]');
        if (searchInput) {
          if (op.startsWith('&tbs=')) {
            window.location.href = window.location.href + op;
          } else {
            searchInput.value = searchInput.value + ' ' + op;
            searchInput.form.submit();
          }
        }
        close();
      };
    });

    // Mount Gear Icon
    const micBtn = document.querySelector('div[aria-label="Search by voice"], div[aria-label="Sprachsuche"], .XNo29b');
    if (micBtn) {
      const btn = document.createElement('div');
      btn.id = 'sop-btn-search';
      btn.innerHTML = '<svg focusable="false" viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M13.85 22.25h-3.7c-.74 0-1.36-.54-1.45-1.27l-.27-1.89c-.27-.14-.53-.29-.79-.46l-1.8.72c-.7.26-1.47-.03-1.81-.65L2.2 15.53c-.35-.66-.2-1.44.36-1.88l1.53-1.19c-.01-.15-.02-.3-.02-.46s.01-.31.02-.46l-1.53-1.19c-.56-.44-.71-1.22-.36-1.88l1.83-3.17c.34-.62 1.11-.91 1.81-.65l1.8.72c.26-.17.52-.32.79-.46l.27-1.89c.09-.73.71-1.27 1.45-1.27h3.7c.74 0 1.36.54 1.45 1.27l.27 1.89c.27.14.53.29.79.46l1.8-.72c.71-.26 1.48.03 1.82.65l1.83 3.17c.35.66.21 1.44-.35 1.88l-1.53 1.19c.01.15.02.3.02.46s-.01.31-.02.46l1.53 1.19c.56.44.71 1.22.35 1.88l-1.83 3.17c-.34.62-1.11.91-1.82.65l-1.8-.72c-.26.17-.52.32-.79.46l-.27 1.89c-.09.73-.71 1.27-1.45 1.27zM11.08 20.25h1.84l.25-1.71.37-.15c.44-.18.86-.42 1.23-.7l.34-.26 1.63.65 1-1.73-1.38-1.07.06-.41c.02-.21.03-.42.03-.63s-.01-.42-.03-.63l-.06-.41 1.38-1.07-1-1.73-1.63.65-.34-.26c-.37-.28-.79-.52-1.23-.7l-.37-.15-.25-1.71h-1.84l-.25 1.71-.37.15c-.44.18-.86.42-1.23.7l-.34.26-1.63-.65-1 1.73 1.38 1.07-.06.41c-.02.21-.03.42-.03.63s.01.42.03.63l.06.41-1.38 1.07 1 1.73 1.63-.65.34.26c.37.28.79.52 1.23.7l.37.15.25 1.71zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>';
      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const baseColor = isDarkMode ? '#9aa0a6' : '#70757a';
      btn.style.cssText = `display:flex;align-items:center;justify-content:center;width:36px;height:36px;cursor:pointer;color:${baseColor};transition:all 0.2s;border-radius:50%;margin-right:4px;flex-shrink:0;`;
      btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); open(); };
      btn.onmouseenter = () => { btn.style.color = '#1a73e8'; btn.style.background = 'rgba(60,64,67,0.08)'; };
      btn.onmouseleave = () => { btn.style.color = baseColor; btn.style.background = 'none'; };
      micBtn.before(btn);
    }
  }

  // --- Boot ---
  loadAndMount();
  
  // Re-check for gear icon if DOM changes
  const obs = new MutationObserver(() => {
    if (config.advancedSearch && !document.getElementById('sop-btn-search')) mountOperatorsUI();
  });
  obs.observe(document.body, { childList: true, subtree: true });

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'live_update') {
      loadAndMount();
    }
  });
})();
