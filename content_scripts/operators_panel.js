(function () {
  'use strict';
  
  let observer = null;
  let isAdvancedSearchEnabled = true;

  function isAllTab() {
    const urlParams = new URLSearchParams(window.location.search);
    const tbm = urlParams.get('tbm');
    const udm = urlParams.get('udm');
    return !tbm && !udm;
  }

  async function syncConfig() {
    const data = await chrome.storage.local.get(['advancedSearch']);
    isAdvancedSearchEnabled = data.advancedSearch !== false;
    updateUIState();
  }

  function removeUI() {
    const gear = document.getElementById('sop-btn-search');
    if (gear) gear.remove();
    const overlay = document.getElementById('sop-overlay');
    if (overlay) overlay.remove();
    const panel = document.getElementById('sop-panel');
    if (panel) panel.remove();
    document.documentElement.classList.remove('sop-adv-enabled');
  }

  function updateUIState() {
    if (!isAllTab()) {
      removeUI();
      return;
    }
    document.documentElement.classList.toggle('sop-adv-enabled', isAdvancedSearchEnabled);
    if (isAdvancedSearchEnabled) {
      mountUI();
    } else {
      removeUI();
    }
  }

  function mountUI() {
    injectStyles();
    injectOverlayAndPanel();
    injectGearIcon();
    startObserver();
  }

  function injectStyles() {
    if (document.getElementById('sop-style')) return;
    const style = document.createElement('style');
    style.id = 'sop-style';
    
    style.textContent = `
      .sop-gear-icon { display: none !important; }
      html.sop-adv-enabled .sop-gear-icon { 
        display: flex !important; align-items: center; justify-content: center; 
        width: 40px; height: 40px; cursor: pointer; color: #bfbfbf; 
        transition: background 0.2s, color 0.2s; border-radius: 50%; 
        margin-right: 2px; flex-shrink: 0; 
      }
      .sop-gear-icon:hover { color: #202124; background: rgba(60,64,67,.08); }
      @media (prefers-color-scheme: dark) {
        .sop-gear-icon:hover { color: #e8eaed; background: rgba(232,234,237,.08); }
      }

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
      .sop-header { position: sticky; top: 0; background: #0f172a; border-bottom: 1px solid #1e293b; padding: 16px; display: flex; align-items: center; justify-content: space-between; z-index: 1; }
      .sop-header h2 { margin: 0; font-size: 15px; font-weight: 600; color: #38bdf8; }
      .sop-close { background: none; border: none; color: #64748b; font-size: 20px; cursor: pointer; }
      .sop-body { padding: 16px; }
      .sop-section { margin-bottom: 18px; }
      .sop-section-title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
      .sop-chips { display: flex; flex-wrap: wrap; gap: 6px; }
      .sop-chip { padding: 4px 11px; border-radius: 16px; border: 1px solid #334155; background: #1e293b; color: #94a3b8; font-size: 12px; cursor: pointer; }
      .sop-chip:hover { border-color: #38bdf8; color: #38bdf8; }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function injectOverlayAndPanel() {
    if (document.getElementById('sop-panel')) return;

    const overlay = document.createElement('div');
    overlay.id = 'sop-overlay';
    document.documentElement.appendChild(overlay);

    const panel = document.createElement('div');
    panel.id = 'sop-panel';
    panel.innerHTML = `
      <div class="sop-header"><h2>Advanced Tools</h2><button class="sop-close">✕</button></div>
      <div class="sop-body">
        
        <div class="sop-section"><div class="sop-section-title">Text Matching</div><div class="sop-chips">
          <div class="sop-chip op-item" data-op='"' data-type="wrap">"Exact"</div>
          <div class="sop-chip op-item" data-op="-" data-type="append">-Exclude</div>
          <div class="sop-chip op-item" data-op="*" data-type="append">* Wildcard</div>
          <div class="sop-chip op-item" data-op="OR" data-type="append">OR</div>
          <div class="sop-chip op-item" data-op="AND" data-type="append">AND</div>
          <div class="sop-chip op-item" data-op="()" data-type="group">(Group)</div>
        </div></div>

        <div class="sop-section"><div class="sop-section-title">Site & Content</div><div class="sop-chips">
          <div class="sop-chip op-item" data-op="site:" data-type="append">site:</div>
          <div class="sop-chip op-item" data-op="related:" data-type="append">related:</div>
          <div class="sop-chip op-item" data-op="cache:" data-type="append">cache:</div>
          <div class="sop-chip op-item" data-op="source:" data-type="append">source:</div>
        </div></div>

        <div class="sop-section"><div class="sop-section-title">File Types</div><div class="sop-chips">
          <div class="sop-chip op-item" data-op="filetype:pdf" data-type="append">PDF (.pdf)</div>
          <div class="sop-chip op-item" data-op="filetype:xls" data-type="append">Excel (.xls)</div>
          <div class="sop-chip op-item" data-op="filetype:csv" data-type="append">CSV (.csv)</div>
          <div class="sop-chip op-item" data-op="filetype:doc" data-type="append">Word (.doc)</div>
        </div></div>

        <div class="sop-section"><div class="sop-section-title">Targeted Search</div><div class="sop-chips">
          <div class="sop-chip op-item" data-op="intitle:" data-type="append">intitle:</div>
          <div class="sop-chip op-item" data-op="inurl:" data-type="append">inurl:</div>
          <div class="sop-chip op-item" data-op="intext:" data-type="append">intext:</div>
          <div class="sop-chip op-item" data-op="allintitle:" data-type="append">allintitle:</div>
          <div class="sop-chip op-item" data-op="allinurl:" data-type="append">allinurl:</div>
          <div class="sop-chip op-item" data-op="allintext:" data-type="append">allintext:</div>
        </div></div>

        <div class="sop-section"><div class="sop-section-title">Time Filter</div><div class="sop-chips">
          <div class="sop-chip op-item" data-op="before:" data-type="append">before:</div>
          <div class="sop-chip op-item" data-op="after:" data-type="append">after:</div>
          <div class="sop-chip op-item" data-op="&tbs=qdr:h">Past Hour</div>
          <div class="sop-chip op-item" data-op="&tbs=qdr:d">Past 24h</div>
          <div class="sop-chip op-item" data-op="&tbs=qdr:w">Past Week</div>
          <div class="sop-chip op-item" data-op="&tbs=qdr:y">Past Year</div>
        </div></div>

        <div class="sop-section"><div class="sop-section-title">Utilities</div><div class="sop-chips">
          <div class="sop-chip op-item" data-op="define:" data-type="append">define:</div>
          <div class="sop-chip op-item" data-op="weather:" data-type="append">weather:</div>
          <div class="sop-chip op-item" data-op="stocks:" data-type="append">stocks:</div>
          <div class="sop-chip op-item" data-op="map:" data-type="append">map:</div>
          <div class="sop-chip op-item" data-op="movie:" data-type="append">movie:</div>
        </div></div>

      </div>
    `;
    document.documentElement.appendChild(panel);

    const togglePanel = (forceState) => {
      panel.classList.toggle('open', forceState);
      overlay.classList.toggle('open', forceState);
    };

    panel.querySelector('.sop-close').onclick = () => togglePanel(false);
    overlay.onclick = () => togglePanel(false);

    panel.addEventListener('click', (e) => {
      const chip = e.target.closest('.op-item');
      if (!chip) return;

      const op = chip.dataset.op;
      const type = chip.dataset.type;
      const searchInput = document.querySelector('input[name="q"], textarea[name="q"]');
      
      if (searchInput) {
        if (op.startsWith('&tbs=')) {
          const url = new URL(window.location.href);
          url.searchParams.delete('tbs');
          window.location.href = url.href + op;
        } else {
          let val = searchInput.value.trim();
          
          if (type === 'wrap') {
            searchInput.value = val ? `"${val}"` : '""';
          } else if (type === 'group') {
            searchInput.value = val ? `(${val})` : '()';
          } else {
            searchInput.value = val ? `${val} ${op}` : op;
          }
          
          searchInput.focus();
          
          const len = searchInput.value.length;
          searchInput.setSelectionRange(len, len);

          if (!type) searchInput.form.submit();
        }
      }
      togglePanel(false);
    });
  }

  function injectGearIcon() {
    if (!isAllTab()) {
      const gear = document.getElementById('sop-btn-search');
      if (gear) gear.remove();
      const overlay = document.getElementById('sop-overlay');
      if (overlay) overlay.remove();
      const panel = document.getElementById('sop-panel');
      if (panel) panel.remove();
      document.documentElement.classList.remove('sop-adv-enabled');
      return;
    }

    if (document.getElementById('sop-btn-search')) return;

    const anchor = document.querySelector('div[aria-label="Search by voice"], div[aria-label="Sprachsuche"], .XNo29b, .M2vUub, button[type="submit"], .Tg7LZd');
    if (!anchor) return;

    const btn = document.createElement('div');
    btn.id = 'sop-btn-search';
    btn.className = 'sop-gear-icon';
    btn.innerHTML = `
      <svg focusable="false" viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49-.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"></path>
      </svg>
    `;
    
    btn.onclick = (e) => { 
      e.preventDefault(); e.stopPropagation(); 
      document.getElementById('sop-panel').classList.add('open');
      document.getElementById('sop-overlay').classList.add('open');
    };
    
    anchor.tagName === 'DIV' ? anchor.before(btn) : anchor.after(btn);
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(() => updateUIState());
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  updateUIState();
  syncConfig();

  chrome.storage.onChanged.addListener(() => syncConfig());
  chrome.runtime.onMessage.addListener((req) => { if (req.action === 'live_update') syncConfig(); });
})();