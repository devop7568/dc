// HailMary Content Script — floating button on AI pages
(function(){
  if (window.__hm) return;
  window.__hm = true;

  var btn = document.createElement('div');
  btn.id = '__hm_btn';
  btn.textContent = '☄️';
  btn.title = 'HailMary — enhance current input (Alt+H)';
  document.body.appendChild(btn);

  var style = document.createElement('style');
  style.textContent = '#__hm_btn{position:fixed;bottom:76px;right:16px;width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#f97316);display:flex;align-items:center;justify-content:center;font-size:17px;cursor:pointer;z-index:2147483647;box-shadow:0 3px 16px rgba(124,58,237,.55);transition:transform .2s,box-shadow .2s;user-select:none;opacity:.9}#__hm_btn:hover{transform:scale(1.15);box-shadow:0 5px 24px rgba(124,58,237,.8);opacity:1}';
  document.head.appendChild(style);

  function findInput() {
    var sels = ['#prompt-textarea','.ProseMirror','[contenteditable="true"]','textarea[placeholder*="message"]','textarea[placeholder*="Ask"]','[role="textbox"]','textarea'];
    for (var i=0;i<sels.length;i++){try{var e=document.querySelector(sels[i]);if(e&&e.offsetParent)return e;}catch(x){}}
    return null;
  }

  btn.addEventListener('click', function(){
    var inp = findInput();
    if (!inp) { showMsg('⚠️ No input found'); return; }
    var raw = (inp.value || inp.textContent || '').trim();
    if (!raw) { showMsg('💬 Type something first'); inp.focus(); return; }
    // Highlight input briefly
    inp.style.outline = '2px solid #7c3aed';
    setTimeout(function(){ inp.style.outline = ''; }, 600);
    showMsg('☄️ Open HailMary popup to enhance!');
  });

  document.addEventListener('keydown', function(e){
    if (e.altKey && e.key.toLowerCase() === 'h') btn.click();
  });

  function showMsg(txt) {
    var old = document.getElementById('__hm_msg');
    if (old) old.remove();
    var d = document.createElement('div');
    d.id = '__hm_msg';
    d.textContent = txt;
    d.style.cssText = 'position:fixed;bottom:124px;right:16px;background:#7c3aed;color:#fff;padding:6px 13px;border-radius:14px;font:600 11.5px system-ui;z-index:2147483647;pointer-events:none;box-shadow:0 3px 14px rgba(124,58,237,.4)';
    document.body.appendChild(d);
    setTimeout(function(){ if(d.parentNode) d.parentNode.removeChild(d); }, 2000);
  }
})();
