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
        <div class="sop-header"><h2>Advanced Tools</h2><button class="sop-close">✕</button></div>
        <div class="sop-body">
          <div class="sop-section"><div class="sop-section-title">Essential Operators</div><div class="sop-chips">
            <div class="sop-chip op-item" data-op='"' data-type="wrap" title="Exact Match">"Exact Match"</div>
            <div class="sop-chip op-item" data-op="-" data-type="prefix" title="Exclude Keyword">-Exclude</div>
            <div class="sop-chip op-item" data-op="site:" data-type="prefix" title="Search specific site">site:Domain</div>
            <div class="sop-chip op-item" data-op="filetype:" data-type="prefix" title="Search file type">filetype:Ext</div>
          </div></div>

          <div class="sop-section"><div class="sop-section-title">Popular Sites</div><div class="sop-chips">
            <div class="sop-chip op-item" data-op="site:reddit.com">Reddit</div>
            <div class="sop-chip op-item" data-op="site:stackoverflow.com">Stack Overflow</div>
            <div class="sop-chip op-item" data-op="site:wikipedia.org">Wikipedia</div>
            <div class="sop-chip op-item" data-op="site:github.com">GitHub</div>
          </div></div>

          <div class="sop-section"><div class="sop-section-title">File Types</div><div class="sop-chips">
            <div class="sop-chip op-item" data-op="filetype:pdf">PDF</div>
            <div class="sop-chip op-item" data-op="filetype:xls">Excel</div>
            <div class="sop-chip op-item" data-op="filetype:csv">CSV</div>
            <div class="sop-chip op-item" data-op="filetype:doc">Word</div>
          </div></div>

          <div class="sop-section"><div class="sop-section-title">Time Filter</div><div class="sop-chips">
            <div class="sop-chip op-item" data-op="&tbs=qdr:h">Past Hour</div>
            <div class="sop-chip op-item" data-op="&tbs=qdr:d">Past 24h</div>
            <div class="sop-chip op-item" data-op="&tbs=qdr:w">Past Week</div>
            <div class="sop-chip op-item" data-op="&tbs=qdr:m">Past Month</div>
            <div class="sop-chip op-item" data-op="&tbs=qdr:y">Past Year</div>
          </div></div>

          <div class="sop-section"><div class="sop-section-title">Date Operators</div><div class="sop-chips">
            <div class="sop-chip op-item" data-op="before:2024" data-type="prefix">before:YYYY</div>
            <div class="sop-chip op-item" data-op="after:2023" data-type="prefix">after:YYYY</div>
          </div></div>

          <hr class="sop-hr">
          <div class="sop-section">
            <a href="https://www.google.com/advanced_search" target="_blank" style="display:block; text-align:center; color:#38bdf8; text-decoration:none; font-size:13px; font-weight:600; padding:10px; border:1px solid #334155; border-radius:8px;">
              Go to Google Advanced Search ↗
            </a>
          </div>
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
        const type = chip.dataset.type;
        const searchInput = document.querySelector('input[name="q"], textarea[name="q"]');
        if (searchInput) {
          if (op.startsWith('&tbs=')) {
            const url = new URL(window.location.href);
            url.searchParams.delete('tbs'); // Remove old time filter if exists
            window.location.href = url.href + op;
          } else {
            let val = searchInput.value.trim();
            if (type === 'wrap') {
              searchInput.value = `"${val}"`;
            } else if (type === 'prefix') {
              searchInput.value = op + val;
            } else {
              searchInput.value = val + ' ' + op;
            }
            searchInput.focus();
            // Don't auto-submit for prefix/wrap as user needs to edit
            if (!type) searchInput.form.submit();
          }
        }
        close();
      };
    });

    // Mount Gear Icon - try multiple anchor points
    const micBtn = document.querySelector('div[aria-label="Search by voice"], div[aria-label="Sprachsuche"], .XNo29b, .M2vUub, .RNNXbe .BKZ7n');
    const searchBtn = document.querySelector('button[type="submit"], .Tg7LZd');
    const anchor = micBtn || searchBtn;

    if (anchor) {
      const btn = document.createElement('div');
      btn.id = 'sop-btn-search';
      // Native Google Settings Icon SVG
      btn.innerHTML = `
        <svg focusable="false" viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"></path>
        </svg>
      `;
      
      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const baseColor = '#bfbfbf';
      
      btn.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        cursor: pointer;
        color: ${baseColor};
        transition: background 0.2s, color 0.2s;
        border-radius: 50%;
        margin-right: 2px;
        flex-shrink: 0;
      `;
      
      btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); open(); };
      btn.onmouseenter = () => { 
        btn.style.background = isDarkMode ? 'rgba(232,234,237,.08)' : 'rgba(60,64,67,.08)';
        btn.style.color = isDarkMode ? '#e8eaed' : '#202124';
      };
      btn.onmouseleave = () => { 
        btn.style.background = 'none';
        btn.style.color = baseColor;
      };
      
      if (micBtn) micBtn.before(btn);
      else anchor.after(btn);
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
