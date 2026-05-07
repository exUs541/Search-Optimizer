(function() {
  'use strict';

  function injectImageButtons() {
    // Target the expanded image view in Google Images
    // Google uses different classes, but 'role="region"' or specific containers are common
    const expandedContainer = document.querySelector('.Q4iAWc, .p7SThc, .e677ob');
    if (!expandedContainer || expandedContainer.dataset.sbfDone) return;
    expandedContainer.dataset.sbfDone = '1';

    // Find the actual image element
    const img = expandedContainer.querySelector('img[src^="http"]');
    if (!img) return;

    const src = img.src;
    
    // Create button container
    const btnGroup = document.createElement('div');
    btnGroup.id = 'sbf-image-tools';
    btnGroup.style.cssText = `
      display: flex; gap: 8px; margin-top: 12px; padding: 0 16px;
      font-family: Google Sans, Roboto, Arial, sans-serif;
    `;

    const createBtn = (text, onClick, primary = false) => {
      const btn = document.createElement('button');
      btn.innerText = text;
      btn.style.cssText = `
        padding: 8px 16px; border-radius: 8px; border: 1px solid #334155;
        background: ${primary ? '#38bdf8' : '#1e293b'};
        color: ${primary ? '#0f172a' : '#94a3b8'};
        font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
      `;
      btn.onmouseenter = () => { btn.style.transform = 'scale(1.05)'; };
      btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; };
      btn.onclick = onClick;
      return btn;
    };

    const viewBtn = createBtn('View Image', () => {
      window.open(src, '_blank');
    }, true);

    const downloadBtn = createBtn('Download', () => {
      chrome.runtime.sendMessage({ action: 'download_image', url: src });
    });

    const copyBtn = createBtn('Copy Link', () => {
      navigator.clipboard.writeText(src);
      copyBtn.innerText = 'Copied!';
      setTimeout(() => { copyBtn.innerText = 'Copy Link'; }, 2000);
    });

    btnGroup.appendChild(viewBtn);
    btnGroup.appendChild(downloadBtn);
    btnGroup.appendChild(copyBtn);

    // Find a place to inject (e.g., near the 'Visit' button)
    const actionPanel = expandedContainer.querySelector('.O8U60e, .XNo29b');
    if (actionPanel) actionPanel.after(btnGroup);
    else expandedContainer.appendChild(btnGroup);
  }

  // Observe for expanded image
  const observer = new MutationObserver(() => {
    if (window.location.href.includes('tbm=isch') || window.location.href.includes('udm=2')) {
      injectImageButtons();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

})();
