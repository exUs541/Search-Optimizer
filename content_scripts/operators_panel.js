(function () {
  'use strict';
  if (document.getElementById('sop-btn-search') || document.getElementById('sop-panel')) return;
  if (!window.location.pathname.includes('/search')) return;

  // ─── Styles ─────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.id = 'sop-style';
  style.textContent = `
    #sop-overlay { position: fixed; inset: 0; z-index: 2147483638; display: none; }
    #sop-overlay.open { display: block; }

    #sop-panel {
      position: fixed; top: 0; right: -380px; width: 360px; height: 100dvh;
      background: #0f172a; border-left: 1px solid #334155;
      z-index: 2147483639; overflow-y: auto;
      transition: right .28s cubic-bezier(.4,0,.2,1);
      font-family: Google Sans, Roboto, Arial, sans-serif;
      box-shadow: -6px 0 24px rgba(0,0,0,.6);
      scrollbar-width: thin; scrollbar-color: #334155 #0f172a;
    }
    #sop-panel.open { right: 0; }

    .sop-header {
      position: sticky; top: 0; background: #0f172a;
      border-bottom: 1px solid #1e293b; padding: 16px 16px 12px;
      display: flex; align-items: center; justify-content: space-between; z-index: 1;
    }
    .sop-header h2 { margin: 0; font-size: 15px; font-weight: 600; color: #38bdf8; }
    .sop-close {
      background: none; border: none; color: #64748b; font-size: 20px;
      cursor: pointer; padding: 4px 8px; border-radius: 4px;
      transition: color .15s, background .15s; line-height: 1;
    }
    .sop-close:hover { color: #f8fafc; background: #1e293b; }

    .sop-body { padding: 14px 16px 28px; }
    .sop-section { margin-bottom: 18px; }
    .sop-section-title {
      font-size: 10px; font-weight: 700; color: #64748b;
      text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px;
    }

    .sop-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .sop-chip {
      padding: 4px 11px; border-radius: 16px; border: 1px solid #334155;
      background: #1e293b; color: #94a3b8; font-size: 12px; font-weight: 500;
      cursor: pointer; transition: all .15s; user-select: none;
    }
    .sop-chip:hover { border-color: #38bdf8; color: #38bdf8; }
    .sop-chip.selected { background: #0ea5e9; border-color: #0ea5e9; color: #fff; }

    .sop-row { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
    .sop-lbl { font-size: 12px; color: #64748b; white-space: nowrap; min-width: 76px; }
    .sop-input, .sop-select {
      flex: 1; background: #1e293b; border: 1px solid #334155; border-radius: 6px;
      color: #f8fafc; font-size: 13px; padding: 6px 10px; outline: none;
      transition: border-color .15s; font-family: inherit;
    }
    .sop-input:focus, .sop-select:focus { border-color: #38bdf8; }
    .sop-input::placeholder { color: #475569; }

    .sop-preview {
      background: #1e293b; border: 1px solid #334155; border-radius: 8px;
      padding: 10px 12px; font-size: 12px; color: #475569;
      font-family: monospace; word-break: break-all; min-height: 34px;
    }
    .sop-preview.has { color: #38bdf8; }

    .sop-hr { border: none; border-top: 1px solid #1e293b; margin: 14px 0; }

    .sop-apply {
      width: 100%; padding: 10px; background: #0ea5e9; color: #fff;
      border: none; border-radius: 8px; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: background .15s, transform .1s; font-family: inherit; margin-top: 4px;
    }
    .sop-apply:hover { background: #0284c7; }
    .sop-apply:active { transform: scale(.98); }

    .sop-clear {
      width: 100%; padding: 8px; background: transparent; color: #ef4444;
      border: 1px solid #334155; border-radius: 8px; font-size: 13px;
      cursor: pointer; transition: all .15s; font-family: inherit; margin-top: 6px;
    }
    .sop-clear:hover { background: #1e293b; border-color: #ef4444; }
  `;
  document.head.appendChild(style);

  // ─── Panel HTML ──────────────────────────────────────────────────────────────
  const FILE_TYPES = ['PDF','DOCX','PPTX','XLSX','TXT','CSV','ZIP','MP4','MP3','JSON','XML'];
  const curYear = new Date().getFullYear();
  const yearOpts = ['<option value="">— Any —</option>',
    ...Array.from({length: curYear - 1999}, (_, i) => curYear - i)
      .map(y => `<option value="${y}">${y}</option>`)
  ].join('');

  const panel = document.createElement('div');
  panel.id = 'sop-panel';
  panel.innerHTML = `
    <div class="sop-header">
      <h2>⚙ Search Operators</h2>
      <button class="sop-close" id="sop-close">✕</button>
    </div>
    <div class="sop-body">
      <div class="sop-section">
        <div class="sop-section-title">File Type</div>
        <div class="sop-chips" id="sop-types">
          ${FILE_TYPES.map(t => `<div class="sop-chip" data-ft="${t.toLowerCase()}">${t}</div>`).join('')}
        </div>
      </div>
      <hr class="sop-hr">
      <div class="sop-section">
        <div class="sop-section-title">Site</div>
        <div class="sop-row"><span class="sop-lbl">From site:</span><input class="sop-input" id="sop-site" placeholder="e.g. reddit.com"></div>
        <div class="sop-row"><span class="sop-lbl">Exclude site:</span><input class="sop-input" id="sop-exsite" placeholder="e.g. pinterest.com"></div>
      </div>
      <hr class="sop-hr">
      <div class="sop-section">
        <div class="sop-section-title">Content</div>
        <div class="sop-row"><span class="sop-lbl">In title:</span><input class="sop-input" id="sop-intitle" placeholder="word in title"></div>
        <div class="sop-row"><span class="sop-lbl">In URL:</span><input class="sop-input" id="sop-inurl" placeholder="word in URL"></div>
        <div class="sop-row"><span class="sop-lbl">Exact:</span><input class="sop-input" id="sop-exact" placeholder="exact phrase"></div>
        <div class="sop-row"><span class="sop-lbl">Exclude:</span><input class="sop-input" id="sop-excl" placeholder="word to exclude"></div>
      </div>
      <hr class="sop-hr">
      <div class="sop-section">
        <div class="sop-section-title">Date Range</div>
        <div class="sop-row"><span class="sop-lbl">After year:</span><select class="sop-select" id="sop-after">${yearOpts}</select></div>
        <div class="sop-row"><span class="sop-lbl">Before year:</span><select class="sop-select" id="sop-before">${yearOpts}</select></div>
      </div>
      <hr class="sop-hr">
      <div class="sop-section">
        <div class="sop-section-title">Preview</div>
        <div class="sop-preview" id="sop-preview">No operators selected</div>
      </div>
      <button class="sop-apply" id="sop-apply">🔍 Apply to Search</button>
      <button class="sop-clear" id="sop-clear">✕ Clear all operators</button>

      <div id="sop-fun-section" style="display: none;">
        <hr class="sop-hr">
        <div class="sop-section">
          <div class="sop-section-title">Google Fun & Games</div>
          <div class="sop-chips">
            <div class="sop-chip fun-item" data-q="minecraft">Minecraft</div>
            <div class="sop-chip fun-item" data-q="google pacman">Pac-man</div>
            <div class="sop-chip fun-item" data-q="google snake">Snake</div>
            <div class="sop-chip fun-item" data-q="tic tac toe">Tic Tac Toe</div>
            <div class="sop-chip fun-item" data-q="solitaire">Solitaire</div>
            <div class="sop-chip fun-item" data-q="minesweeper">Minesweeper</div>
            <div class="sop-chip fun-item" data-q="flip a coin">Flip Coin</div>
            <div class="sop-chip fun-item" data-q="roll a die">Roll Die</div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  const overlay = document.createElement('div');
  overlay.id = 'sop-overlay';
  document.body.appendChild(overlay);

  // ─── Inject as a gear button in the search bar icons ────────────────────────
  function mountOperatorsUI() {
    if (document.getElementById('sop-btn-search')) return;

    // Microphone button is the anchor
    const micBtn = document.querySelector('[aria-label*="Search by voice"], [aria-label*="Sprachsuche"], .QCzoEc');
    
    if (micBtn) {
      const btn = document.createElement('div');
      btn.id = 'sop-btn-search';
      btn.innerHTML = `<svg focusable="false" viewBox="0 0 24 24" style="width:20px;height:20px;fill:currentColor"><path d="M13.85 22.25h-3.7c-.74 0-1.36-.54-1.45-1.27l-.27-1.89c-.27-.14-.53-.29-.79-.46l-1.78.72c-.7.28-1.47-.01-1.81-.66l-1.86-3.22c-.35-.61-.22-1.39.33-1.84l1.52-1.19c-.01-.15-.02-.3-.02-.45s.01-.3.02-.45l-1.52-1.19c-.56-.45-.69-1.23-.33-1.84l1.86-3.22c.34-.65 1.11-.94 1.81-.66l1.78.72c.26-.17.52-.32.79-.46l.27-1.89c.09-.73.71-1.27 1.45-1.27h3.7c.74 0 1.36.54 1.45 1.27l.27 1.89c.27.14.53.29.79.46l1.78-.72c.7-.28 1.47.01 1.81.66l1.86 3.22c.35.61.22 1.39-.33 1.84l-1.52-1.19c.01.15.02.3.02.45s-.01.3-.02.45l1.52 1.19c.56.45.69 1.23.33 1.84l-1.86 3.22c-.34.65-1.11.94-1.81.66l-1.78-.72c-.26.17-.52.32-.79.46l-.27 1.89c-.09.73-.71 1.27-1.45 1.27zM12 15.5c1.93 0 3.5-1.57 3.5-3.5s-1.57-3.5-3.5-3.5-3.5 1.57-3.5 3.5 1.57 3.5 3.5 3.5z"></path></svg>`;
      btn.title = 'Search Operators';
      
      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const baseColor = isDarkMode ? '#9aa0a6' : '#70757a';

      btn.style.cssText = `
        display: flex; align-items: center; justify-content: center;
        width: 36px; height: 36px; cursor: pointer;
        color: ${baseColor}; transition: color 0.2s, background 0.2s;
        border-radius: 50%; margin-right: 4px; flex-shrink: 0;
      `;
      btn.onmouseenter = () => {
        btn.style.color = '#1a73e8';
        btn.style.background = 'rgba(60,64,67,0.08)';
      };
      btn.onmouseleave = () => {
        btn.style.color = panel.classList.contains('open') ? '#1a73e8' : baseColor;
        btn.style.background = 'none';
      };
      btn.onclick = (e) => {
        e.preventDefault(); e.stopPropagation();
        panel.classList.contains('open') ? close() : open();
      };
      
      // Insert BEFORE the microphone
      micBtn.before(btn);
    }
  }

  let config = { advancedSearch: true, googleFun: false };
  async function loadAndMount() {
    const data = await chrome.storage.local.get(['advancedSearch', 'googleFun']);
    if (data.advancedSearch !== undefined) config.advancedSearch = data.advancedSearch;
    else config.advancedSearch = true; // Default ON
    
    if (data.googleFun !== undefined) config.googleFun = data.googleFun;
    
    if (config.advancedSearch) mountOperatorsUI();
    if (config.googleFun) {
      const funSec = document.getElementById('sop-fun-section');
      if (funSec) funSec.style.display = 'block';
    }
  }

  function tryMount() {
    loadAndMount();
    const obs = new MutationObserver(() => {
      if (config.advancedSearch && !document.getElementById('sop-btn-search')) {
        mountOperatorsUI();
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }
  tryMount();

  // ─── Open / Close ────────────────────────────────────────────────────────────
  function open() {
    panel.classList.add('open');
    overlay.classList.add('open');
    const btn = document.getElementById('sop-btn-search');
    if (btn) btn.style.color = '#1a73e8';
    syncFromUrl();
  }
  function close() {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    const btn = document.getElementById('sop-btn-search');
    if (btn) {
      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      btn.style.color = isDarkMode ? '#9aa0a6' : '#70757a';
    }
  }
  overlay.addEventListener('click', close);
  document.getElementById('sop-close').addEventListener('click', close);

  // ─── Logic ───────────────────────────────────────────────────────────────────
  const selectedTypes = new Set();
  panel.querySelectorAll('.sop-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (chip.classList.contains('fun-item')) {
        const q = chip.dataset.q;
        const params = new URLSearchParams(window.location.search);
        params.set('q', q);
        params.delete('start');
        window.location.search = params.toString();
        return;
      }
      const ft = chip.dataset.ft;
      if (selectedTypes.has(ft)) { selectedTypes.delete(ft); chip.classList.remove('selected'); }
      else                        { selectedTypes.add(ft);    chip.classList.add('selected'); }
      updatePreview();
    });
  });

  const inputs = ['sop-site','sop-exsite','sop-intitle','sop-inurl','sop-exact','sop-excl'];
  const selects = ['sop-after','sop-before'];
  [...inputs, ...selects].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', updatePreview);
  });

  function g(id) { return (document.getElementById(id)?.value || '').trim(); }

  function buildOps() {
    const parts = [];
    if (selectedTypes.size === 1) parts.push(`filetype:${[...selectedTypes][0]}`);
    else if (selectedTypes.size > 1) parts.push('(' + [...selectedTypes].map(t => `filetype:${t}`).join(' OR ') + ')');
    if (g('sop-site'))    parts.push(`site:${g('sop-site')}`);
    if (g('sop-exsite'))  parts.push(`-site:${g('sop-exsite')}`);
    if (g('sop-intitle')) parts.push(`intitle:${g('sop-intitle')}`);
    if (g('sop-inurl'))   parts.push(`inurl:${g('sop-inurl')}`);
    if (g('sop-exact'))   parts.push(`"${g('sop-exact')}"`);
    if (g('sop-excl'))    parts.push(`-${g('sop-excl')}`);
    if (g('sop-after'))   parts.push(`after:${g('sop-after')}`);
    if (g('sop-before'))  parts.push(`before:${g('sop-before')}`);
    return parts.join(' ');
  }

  function updatePreview() {
    const ops = buildOps();
    const el = document.getElementById('sop-preview');
    el.textContent = ops || 'No operators selected';
    el.classList.toggle('has', !!ops);
  }

  function syncFromUrl() {
    const q = new URLSearchParams(window.location.search).get('q') || '';
    const ftm = q.match(/filetype:(\w+)/i);
    if (ftm) {
      const t = ftm[1].toLowerCase();
      selectedTypes.clear();
      panel.querySelectorAll('.sop-chip').forEach(c => c.classList.remove('selected'));
      selectedTypes.add(t);
      panel.querySelector(`.sop-chip[data-ft="${t}"]`)?.classList.add('selected');
    }
    const match = (rx) => { const m = q.match(rx); return m ? m[1] : ''; };
    document.getElementById('sop-site').value    = match(/(?<!-)site:(\S+)/i);
    document.getElementById('sop-exsite').value  = match(/-site:(\S+)/i);
    document.getElementById('sop-intitle').value = match(/intitle:(\S+)/i);
    document.getElementById('sop-inurl').value   = match(/inurl:(\S+)/i);
    const em = q.match(/"([^"]+)"/); document.getElementById('sop-exact').value = em ? em[1] : '';
    document.getElementById('sop-after').value   = match(/after:(\d{4})/i);
    document.getElementById('sop-before').value  = match(/before:(\d{4})/i);
    updatePreview();
  }

  const OPS_RX = [/\bfiletype:\S+/gi,/(?<!-)site:\S+/gi,/-site:\S+/gi,/\bintitle:\S+/gi,
                  /\binurl:\S+/gi,/"[^"]*"/g,/-\w+/g,/\bafter:\d{4}/gi,/\bbefore:\d{4}/gi];

  document.getElementById('sop-apply').addEventListener('click', () => {
    const params = new URLSearchParams(window.location.search);
    let base = params.get('q') || '';
    OPS_RX.forEach(rx => { base = base.replace(rx, ''); });
    const ops = buildOps();
    const finalQ = (base.trim() + ' ' + ops.trim()).trim();
    if (finalQ) {
      params.set('q', finalQ);
      params.delete('start');
      window.location.search = params.toString();
    }
  });

  document.getElementById('sop-clear').addEventListener('click', () => {
    const params = new URLSearchParams(window.location.search);
    let q = params.get('q') || '';
    OPS_RX.forEach(rx => { q = q.replace(rx, ''); });
    params.set('q', q.replace(/\s+/g, ' ').trim());
    params.delete('start');
    window.location.search = params.toString();
  });
})();
