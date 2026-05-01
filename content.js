// HailMary Content Script v8.0 — floating button + context capture + enhanced injection
(function () {
  if (window.__hm) return;
  window.__hm = true;

  // ── FLOATING BUTTON ──────────────────────────────────────────────
  var btn = document.createElement('div');
  btn.id = '__hm_btn';
  btn.textContent = '\u2604\uFE0F';
  btn.title = 'HailMary \u2014 enhance current input (Alt+H)';
  document.body.appendChild(btn);

  var style = document.createElement('style');
  style.textContent =
    '#__hm_btn{position:fixed;bottom:76px;right:16px;width:38px;height:38px;border-radius:50%;' +
    'background:linear-gradient(135deg,#7c3aed,#f97316);display:flex;align-items:center;' +
    'justify-content:center;font-size:17px;cursor:pointer;z-index:2147483647;' +
    'box-shadow:0 3px 16px rgba(124,58,237,.55);transition:transform .2s,box-shadow .2s;' +
    'user-select:none;opacity:.9}' +
    '#__hm_btn:hover{transform:scale(1.15);box-shadow:0 5px 24px rgba(124,58,237,.8);opacity:1}' +
    '#__hm_menu{position:fixed;bottom:120px;right:16px;background:#111119;' +
    'border:1px solid #252535;border-radius:10px;padding:4px;z-index:2147483647;' +
    'box-shadow:0 8px 32px rgba(0,0,0,.6);display:none;min-width:140px}' +
    '#__hm_menu .hm-mi{display:flex;align-items:center;gap:6px;padding:6px 10px;' +
    'border-radius:6px;cursor:pointer;font:600 11px system-ui;color:#94a3b8;' +
    'transition:all .15s;white-space:nowrap}' +
    '#__hm_menu .hm-mi:hover{background:rgba(124,58,237,.15);color:#c084fc}';
  document.head.appendChild(style);

  // ── CONTEXT MENU ─────────────────────────────────────────────────
  var menu = document.createElement('div');
  menu.id = '__hm_menu';
  menu.innerHTML =
    '<div class="hm-mi" data-action="enhance">\uD83D\uDE80 Enhance Input</div>' +
    '<div class="hm-mi" data-action="capture">\uD83C\uDF10 Capture Context</div>' +
    '<div class="hm-mi" data-action="score">\uD83D\uDCCA Score Input</div>';
  document.body.appendChild(menu);

  var menuOpen = false;

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    menuOpen = !menuOpen;
    menu.style.display = menuOpen ? 'block' : 'none';
  });

  document.addEventListener('click', function () {
    if (menuOpen) { menu.style.display = 'none'; menuOpen = false; }
  });

  menu.addEventListener('click', function (e) {
    var mi = e.target.closest('.hm-mi');
    if (!mi) return;
    var action = mi.dataset.action;
    menu.style.display = 'none';
    menuOpen = false;

    if (action === 'enhance') {
      var inp = findInput();
      if (!inp) { showMsg('\u26A0\uFE0F No input found'); return; }
      var raw = (inp.value || inp.textContent || '').trim();
      if (!raw) { showMsg('\uD83D\uDCAC Type something first'); inp.focus(); return; }
      inp.style.outline = '2px solid #7c3aed';
      setTimeout(function () { inp.style.outline = ''; }, 600);
      showMsg('\u2604\uFE0F Open HailMary popup to enhance!');
    } else if (action === 'capture') {
      var sel = window.getSelection();
      var text = '';
      if (sel && sel.toString().trim().length > 10) {
        text = sel.toString().trim();
      } else {
        var main = document.querySelector('main, article, [role="main"], .content, #content');
        text = main ? main.textContent.trim().slice(0, 2000) : document.body.textContent.trim().slice(0, 1500);
      }
      if (text.length > 10) {
        try {
          chrome.runtime.sendMessage({ type: 'STORE_CONTEXT', context: text });
        } catch (ex) {}
        showMsg('\uD83C\uDF10 Context captured! (' + text.length + ' chars)');
      } else {
        showMsg('\u26A0\uFE0F No meaningful content found');
      }
    } else if (action === 'score') {
      var inp2 = findInput();
      if (!inp2) { showMsg('\u26A0\uFE0F No input found'); return; }
      var raw2 = (inp2.value || inp2.textContent || '').trim();
      if (!raw2) { showMsg('\uD83D\uDCAC Type something first'); return; }
      showMsg('\uD83D\uDCCA Open popup to see full score');
    }
  });

  // ── KEYBOARD SHORTCUT ────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.altKey && e.key.toLowerCase() === 'h') btn.click();
  });

  // ── FIND INPUT ───────────────────────────────────────────────────
  function findInput() {
    var sels = [
      '#prompt-textarea', '.ProseMirror', '[contenteditable="true"]',
      'textarea[placeholder*="message"]', 'textarea[placeholder*="Message"]',
      'textarea[placeholder*="Ask"]', 'textarea[placeholder*="Type"]',
      '[role="textbox"]', 'div[contenteditable][data-placeholder]', 'textarea'
    ];
    for (var i = 0; i < sels.length; i++) {
      try {
        var e = document.querySelector(sels[i]);
        if (e && e.offsetParent) return e;
      } catch (x) {}
    }
    return null;
  }

  // ── SHOW MESSAGE ─────────────────────────────────────────────────
  function showMsg(txt) {
    var old = document.getElementById('__hm_msg');
    if (old) old.remove();
    var d = document.createElement('div');
    d.id = '__hm_msg';
    d.textContent = txt;
    d.style.cssText = 'position:fixed;bottom:124px;right:16px;background:#7c3aed;color:#fff;' +
      'padding:6px 13px;border-radius:14px;font:600 11.5px system-ui;z-index:2147483647;' +
      'pointer-events:none;box-shadow:0 3px 14px rgba(124,58,237,.4)';
    document.body.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 2000);
  }
})();
