/**
 * HailMary Popup Controller v3.0
 * Assumes engine.js is loaded first (window.HailMaryEngine available).
 */

(function () {
  'use strict';

  // ── DEPTH LABELS ──────────────────────────────────────────────────
  var DEPTH_LABELS = ['LITE', 'STANDARD', 'ENHANCED', 'ULTRA', 'GOD 🔥'];
  var FIRE_LABELS  = {
    hailmary: '☄️ FIRE HAIL MARY',
    manus:    '🧠 RUN MANUS',
    juma:     '⚡ UNLEASH JUMA',
    auto:     '🤖 AUTO-ENHANCE',
    turns:    '🔄 GENERATE TURNS'
  };

  // ── STATE ──────────────────────────────────────────────────────────
  var currentMode  = 'hailmary';
  var currentTurns = 8;
  var lastResult   = null;
  var lastTurns    = null;
  var MAX_HIST     = 20;

  // ── DOM HELPERS ────────────────────────────────────────────────────
  function el(id) { return document.getElementById(id); }
  function show(id) { var e = el(id); if (e) e.style.display = ''; }
  function hide(id) { var e = el(id); if (e) e.style.display = 'none'; }

  // ── INIT ──────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    if (window.__HAILMARY_POPUP_BOUND) return;
    window.__HAILMARY_POPUP_BOUND = true;

    if (typeof window.HailMaryEngine === 'undefined') {
      el('errBox').textContent = '❌ Engine failed to load. Try reloading the extension.';
      show('errBox');
      el('fireBtn').disabled = true;
      return;
    }

    loadSettings();
    refreshHistory();
    checkTab();

    // Mode tabs
    document.querySelectorAll('.tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        if (currentMode === 'turns') {
          hide('standardPanel');
          show('turnsPanel');
          hide('outWrap');
        } else {
          show('standardPanel');
          hide('turnsPanel');
          hide('turnsOutWrap');
          el('fireLbl').textContent = (FIRE_LABELS[currentMode] || 'ENHANCE').replace(/^[^\s]+\s/, '');
          el('fireBtn').querySelector('.fire-ico').textContent = btn.textContent.trim().slice(0, 2);
        }
        saveSettings();
      });
    });

    // Turns count buttons
    document.querySelectorAll('.turns-count-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.turns-count-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentTurns = parseInt(btn.dataset.turns, 10);
        saveSettings();
      });
    });

    // Depth slider
    el('depthSlider').addEventListener('input', function () {
      el('depthLbl').textContent = DEPTH_LABELS[parseInt(this.value, 10) - 1];
      saveSettings();
    });

    // Fire button (standard modes)
    el('fireBtn').addEventListener('click', handleEnhance);

    // Turns button
    el('turnsBtn').addEventListener('click', handleTurns);

    // Keyboard shortcuts
    el('rawInput').addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleEnhance();
    });
    el('turnsInput').addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleTurns();
    });

    // Output buttons (standard)
    el('copyBtn').addEventListener('click', handleCopy);
    el('injectBtn').addEventListener('click', function () { handleInject(false); });
    el('clearBtn').addEventListener('click', handleClear);

    // Turns output buttons
    el('turnsCopyAllBtn').addEventListener('click', handleCopyAllTurns);
    el('turnsClearBtn').addEventListener('click', function () {
      hide('turnsOutWrap');
      lastTurns = null;
    });

    // History toggle
    el('histHdr').addEventListener('click', function () {
      var list = el('histList');
      list.style.display = list.style.display === 'none' ? 'block' : 'none';
    });

    ['tgInject', 'tgSubmit', 'tgLiveSearch'].forEach(function (id) {
      el(id).addEventListener('change', saveSettings);
    });
  });

  // ── TURNS HANDLER ─────────────────────────────────────────────────
  function handleTurns() {
    hide('errBox');
    var raw = el('turnsInput').value.trim();
    if (!raw) { showErr('Enter a topic or goal first.'); el('turnsInput').focus(); return; }

    el('turnsBtn').disabled = true;
    el('turnsLbl').textContent = 'GENERATING...';

    setTimeout(function () {
      window.HailMaryEngine.generateTurns(raw, currentTurns).then(function (result) {
        lastTurns = result;
        renderTurns(result);
        show('turnsOutWrap');
        el('turnsOutWrap').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        toast('🔄 ' + result.count + ' turns generated!');
        el('turnsBtn').disabled = false;
        el('turnsLbl').textContent = 'GENERATE TURNS';
      }).catch(function (err) {
        showErr('Error: ' + err.message);
        el('turnsBtn').disabled = false;
        el('turnsLbl').textContent = 'GENERATE TURNS';
      });
    }, 0);
  }

  // ── RENDER TURNS ──────────────────────────────────────────────────
  function renderTurns(result) {
    el('turnsOutTitle').textContent = result.count + ' Turns · ' + result.topic.slice(0, 30) + (result.topic.length > 30 ? '…' : '');
    var list = el('turnsList');
    list.innerHTML = '';

    result.turns.forEach(function (turn) {
      var item = document.createElement('div');
      item.className = 'turn-item';

      var header = document.createElement('div');
      header.className = 'turn-header';
      header.innerHTML =
        '<span class="turn-num">Turn ' + turn.number + '</span>' +
        '<span class="turn-phase">' + esc(turn.phase) + '</span>' +
        '<button class="turn-copy-btn" data-turn="' + turn.number + '">📋</button>';

      var preview = document.createElement('div');
      preview.className = 'turn-preview';
      preview.textContent = turn.text.slice(0, 90) + '…';

      var body = document.createElement('div');
      body.className = 'turn-body';
      body.textContent = turn.text;

      // Toggle expand on header click
      header.addEventListener('click', function (e) {
        if (e.target.classList.contains('turn-copy-btn')) return;
        var isOpen = body.classList.contains('open');
        body.classList.toggle('open', !isOpen);
        preview.style.display = isOpen ? '' : 'none';
      });

      // Copy individual turn
      header.querySelector('.turn-copy-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        copyText(turn.text);
        var btn = e.target;
        btn.textContent = '✅';
        setTimeout(function () { btn.textContent = '📋'; }, 1500);
        toast('📋 Turn ' + turn.number + ' copied!');
      });

      item.appendChild(header);
      item.appendChild(preview);
      item.appendChild(body);
      list.appendChild(item);
    });
  }

  // ── COPY ALL TURNS ────────────────────────────────────────────────
  function handleCopyAllTurns() {
    if (!lastTurns) return;
    var all = lastTurns.turns.map(function (t) {
      return '── TURN ' + t.number + ' (' + t.phase.toUpperCase() + ') ──\n\n' + t.text;
    }).join('\n\n' + '─'.repeat(50) + '\n\n');
    copyText(all);
    el('turnsCopyAllBtn').textContent = '✅ All';
    setTimeout(function () { el('turnsCopyAllBtn').textContent = '📋 All'; }, 1500);
    toast('📋 All ' + lastTurns.count + ' turns copied!');
  }

  // ── CORE: ENHANCE ─────────────────────────────────────────────────
  function handleEnhance() {
    hide('errBox');
    var raw = el('rawInput').value.trim();
    if (!raw) { showErr('Please type a prompt first.'); el('rawInput').focus(); return; }

    setLoading(true);

    setTimeout(function () {
      try {
        var depth = parseInt(el('depthSlider').value, 10) || 4;
        var opts  = { depth: depth, liveSearch: el('tgLiveSearch').checked };

        window.HailMaryEngine.enhance(raw, currentMode, 'auto', opts).then(function(result) {
          lastResult = result;
          renderOutput(result);
          show('outWrap');
          el('outWrap').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          saveHistory(result);
          refreshHistory();

          if (el('tgInject').checked) {
            injectToTab(result.enhanced, el('tgSubmit').checked).then(function (ok) {
              if (ok) toast(el('tgSubmit').checked ? '🚀 Injected & Submitted!' : '🚀 Injected!');
              else    toast('✅ Enhanced! Click 🚀 to inject');
            });
          } else {
            var knowledgeNote = result.stats.liveTechniques > 0 ? ' · ' + result.stats.liveTechniques + ' live techniques' : (result.stats.knowledgeUsed > 0 ? ' · ' + result.stats.knowledgeUsed + ' web techniques' : '');
            toast('Enhanced: ' + result.stats.powerMultiplier + 'x boost · ' + result.techniques.length + ' techniques' + knowledgeNote);
          }
          setLoading(false);
        }).catch(function(err) {
          showErr('Error: ' + err.message);
          setLoading(false);
        });
      } catch (err) {
        showErr('Error: ' + err.message);
        setLoading(false);
      }
    }, 0);
  }

  // ── RENDER OUTPUT ─────────────────────────────────────────────────
  function renderOutput(r) {
    var tags = '';
    tags += '<span class="tag task">📌 ' + (r.analysis.task || '?') + '</span>';
    (r.analysis.domains || []).slice(0, 2).forEach(function (d) {
      tags += '<span class="tag domain">' + d + '</span>';
    });
    var cx = r.analysis.complexity;
    tags += '<span class="tag ' + (cx === 'high' ? 'cplx-h' : cx === 'low' ? 'cplx-l' : 'cplx-m') + '">' + cx + '</span>';
    if (r.autoRouted) tags += '<span class="tag">auto→' + r.mode + '</span>';
    (r.techniques || []).slice(0, 10).forEach(function (t) {
      tags += '<span class="tag">' + t + '</span>';
    });
    el('tagRow').innerHTML = tags;
    el('outBox').textContent = r.enhanced;
    var liveStat = r.stats.liveTechniques > 0 ? '  ·  🌐 ' + r.stats.liveTechniques + ' live' : '';
    el('statsBar').textContent = '🔢 ' + r.stats.originalTokens + '→' + r.stats.enhancedTokens + ' tok  ·  ⚡ ' + r.stats.powerMultiplier + 'x  ·  🧱 ' + r.stats.techniqueCount + ' techniques' + liveStat + '  ·  ⏱ ' + r.stats.duration + 'ms';
  }

  // ── COPY ──────────────────────────────────────────────────────────
  function handleCopy() {
    if (!lastResult) return;
    copyText(lastResult.enhanced);
    el('copyBtn').textContent = '✅';
    setTimeout(function () { el('copyBtn').textContent = '📋'; }, 1500);
    toast('📋 Copied!');
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text); });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  // ── INJECT ────────────────────────────────────────────────────────
  function handleInject() {
    if (!lastResult) return;
    injectToTab(lastResult.enhanced, el('tgSubmit').checked).then(function (ok) {
      if (ok) toast('🚀 Injected' + (el('tgSubmit').checked ? ' & Submitted!' : '!'));
      else    toast('⚠️ Not on a supported AI page');
    });
  }

  function injectToTab(text, autoSubmit) {
    return new Promise(function (resolve) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || !tabs[0]) { resolve(false); return; }
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: injectFn,
          args: [text, !!autoSubmit]
        }, function (results) {
          resolve(!chrome.runtime.lastError && results && results[0] && results[0].result === true);
        });
      });
    });
  }

  function injectFn(text, autoSubmit) {
    var selectors = ['#prompt-textarea','.ProseMirror','[contenteditable="true"]',
      'textarea[placeholder*="message"]','textarea[placeholder*="Ask"]',
      'textarea[placeholder*="prompt"]','[role="textbox"]','textarea'];
    var input = null;
    for (var i = 0; i < selectors.length; i++) {
      try { var found = document.querySelector(selectors[i]);
        if (found && found.offsetParent !== null) { input = found; break; }
      } catch (e) {}
    }
    if (!input) return false;
    var isEditable = input.getAttribute('contenteditable') === 'true' ||
                     input.classList.contains('ProseMirror') || input.tagName !== 'TEXTAREA';
    if (isEditable) {
      input.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, text);
      if (!input.textContent.includes(text.slice(0, 15))) {
        input.textContent = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else {
      var setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
      if (setter && setter.set) setter.set.call(input, text);
      else input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    input.focus();
    if (autoSubmit) {
      setTimeout(function () {
        var btnSels = ['[data-testid="send-button"]','button[aria-label="Send message"]',
          'button[aria-label="Send"]','[data-testid="sendButton"]','.send-button','button[type="submit"]'];
        for (var j = 0; j < btnSels.length; j++) {
          try { var btn = document.querySelector(btnSels[j]);
            if (btn && !btn.disabled) { btn.click(); return; }
          } catch (e) {}
        }
        input.dispatchEvent(new KeyboardEvent('keydown', { key:'Enter',code:'Enter',keyCode:13,bubbles:true }));
      }, 200);
    }
    return true;
  }

  // ── CLEAR ─────────────────────────────────────────────────────────
  function handleClear() {
    hide('outWrap');
    el('rawInput').value = '';
    el('rawInput').focus();
    lastResult = null;
    hide('errBox');
  }

  // ── SETTINGS ──────────────────────────────────────────────────────
  function saveSettings() {
    try {
      chrome.storage.local.set({
        hm_v3: {
          mode:    currentMode,
          depth:   el('depthSlider').value,
          inject:  el('tgInject').checked,
          submit:  el('tgSubmit').checked,
          liveSearch: el('tgLiveSearch').checked,
          turns:   currentTurns
        }
      });
    } catch (e) {}
  }

  function loadSettings() {
    try {
      chrome.storage.local.get('hm_v3', function (data) {
        var s = data && data.hm_v3;
        if (!s) return;
        if (s.mode) {
          currentMode = s.mode;
          document.querySelectorAll('.tab').forEach(function (b) {
            b.classList.toggle('active', b.dataset.mode === s.mode);
          });
          if (s.mode === 'turns') {
            hide('standardPanel'); show('turnsPanel');
          } else {
            updateFireBtn();
          }
        }
        if (s.depth) {
          el('depthSlider').value = s.depth;
          el('depthLbl').textContent = DEPTH_LABELS[parseInt(s.depth, 10) - 1];
        }
        if (s.inject !== undefined) el('tgInject').checked = s.inject;
        if (s.submit !== undefined) el('tgSubmit').checked = s.submit;
        if (s.liveSearch !== undefined && el('tgLiveSearch')) el('tgLiveSearch').checked = s.liveSearch;
        if (s.turns) {
          currentTurns = s.turns;
          document.querySelectorAll('.turns-count-btn').forEach(function (b) {
            b.classList.toggle('active', parseInt(b.dataset.turns, 10) === s.turns);
          });
        }
      });
    } catch (e) {}
  }

  function updateFireBtn() {
    var label = FIRE_LABELS[currentMode] || '⚡ ENHANCE';
    var parts = label.split(' ');
    el('fireBtn').querySelector('.fire-ico').textContent = parts[0];
    el('fireLbl').textContent = parts.slice(1).join(' ');
  }

  // ── HISTORY ──────────────────────────────────────────────────────
  function saveHistory(result) {
    try {
      chrome.storage.local.get('hm_hist', function (data) {
        var hist = (data && data.hm_hist) || [];
        hist.unshift({ raw: result.original, enhanced: result.enhanced, mode: result.mode, task: result.analysis.task, ts: new Date().toLocaleTimeString() });
        if (hist.length > MAX_HIST) hist = hist.slice(0, MAX_HIST);
        chrome.storage.local.set({ hm_hist: hist });
      });
    } catch (e) {}
  }

  function refreshHistory() {
    try {
      chrome.storage.local.get('hm_hist', function (data) {
        var hist = (data && data.hm_hist) || [];
        el('histCount').textContent = hist.length;
        var list = el('histList');
        list.innerHTML = '';
        if (hist.length === 0) {
          list.innerHTML = '<div style="padding:10px;color:#64748b;font-size:11px;text-align:center">No history yet</div>';
          return;
        }
        hist.forEach(function (item) {
          var div = document.createElement('div');
          div.className = 'hist-item';
          div.innerHTML = '<div class="hi-raw">' + esc(item.raw) + '</div>' +
            '<div class="hi-meta"><span class="hi-mode">' + esc(item.mode || '') + '</span>' +
            '<span>' + esc(item.task || '') + '</span><span>' + esc(item.ts || '') + '</span></div>';
          div.addEventListener('click', function () {
            el('rawInput').value = item.raw;
            el('outBox').textContent = item.enhanced;
            show('outWrap');
            lastResult = { enhanced: item.enhanced, original: item.raw };
            list.style.display = 'none';
            toast('📜 Loaded from history');
          });
          list.appendChild(div);
        });
      });
    } catch (e) {}
  }

  // ── TAB STATUS ────────────────────────────────────────────────────
  function checkTab() {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || !tabs[0]) return;
        var url = tabs[0].url || '';
        var supported = ['chatgpt.com','openai.com','claude.ai','gemini.google','perplexity.ai','poe.com','grok.com','you.com'];
        var on = supported.some(function (s) { return url.includes(s); });
        var dot = el('statusDot');
        dot.classList.toggle('on', on);
        dot.classList.toggle('warn', !on);
        dot.title = on ? '✅ Connected — will inject directly' : '⚠️ Not on a supported AI page';
      });
    } catch (e) {}
  }

  // ── UTILS ─────────────────────────────────────────────────────────
  function setLoading(on) {
    el('fireBtn').disabled = on;
    el('fireLbl').textContent = on ? (el('tgLiveSearch').checked ? 'SEARCHING + ENHANCING...' : 'ENHANCING...') : (FIRE_LABELS[currentMode] || 'ENHANCE').replace(/^[^\s]+\s/, '');
  }

  function showErr(msg) {
    el('errBox').textContent = msg;
    show('errBox');
  }

  function toast(msg) {
    var existing = document.querySelector('.hm-toast');
    if (existing) existing.remove();
    var t = document.createElement('div');
    t.className = 'hm-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2200);
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

}());

(function () {
  'use strict';

  // ── DEPTH LABELS ──────────────────────────────────────────────────
  var DEPTH_LABELS = ['LITE', 'STANDARD', 'ENHANCED', 'ULTRA', 'GOD 🔥'];
  var FIRE_LABELS  = {
    hailmary: '☄️ FIRE HAIL MARY',
    manus:    '🧠 RUN MANUS',
    juma:     '⚡ UNLEASH JUMA',
    auto:     '🤖 AUTO-ENHANCE'
  };

  // ── STATE ──────────────────────────────────────────────────────────
  var currentMode = 'hailmary';
  var lastResult  = null;
  var MAX_HIST    = 20;

  // ── DOM HELPERS ────────────────────────────────────────────────────
  function el(id) { return document.getElementById(id); }
  function show(id) { el(id).style.display = ''; }
  function hide(id) { el(id).style.display = 'none'; }

  // ── INIT ──────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    if (window.__HAILMARY_POPUP_BOUND) return;
    window.__HAILMARY_POPUP_BOUND = true;

    // Guard: make sure engine loaded
    if (typeof window.HailMaryEngine === 'undefined') {
      el('errBox').textContent = '❌ Engine failed to load. Try reloading the extension.';
      show('errBox');
      el('fireBtn').disabled = true;
      return;
    }

    loadSettings();
    refreshHistory();
    checkTab();

    // Mode tabs
    document.querySelectorAll('.tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        el('fireLbl').textContent = (FIRE_LABELS[currentMode] || 'ENHANCE').replace(/^[^\s]+\s/, '');
        el('fireBtn').querySelector('.fire-ico').textContent = btn.textContent.trim().slice(0, 2);
        saveSettings();
      });
    });

    // Depth slider
    el('depthSlider').addEventListener('input', function () {
      el('depthLbl').textContent = DEPTH_LABELS[parseInt(this.value, 10) - 1];
      saveSettings();
    });

    // Fire button
    el('fireBtn').addEventListener('click', handleEnhance);

    // Keyboard shortcut: Ctrl/Cmd+Enter in textarea
    el('rawInput').addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleEnhance();
    });

    // Output buttons
    el('copyBtn').addEventListener('click', handleCopy);
    el('injectBtn').addEventListener('click', function () { handleInject(false); });
    el('clearBtn').addEventListener('click', handleClear);

    // History toggle
    el('histHdr').addEventListener('click', function () {
      var list = el('histList');
      list.style.display = list.style.display === 'none' ? 'block' : 'none';
    });

    // Toggle settings persist
    ['tgInject', 'tgSubmit', 'tgLiveSearch'].forEach(function (id) {
      el(id).addEventListener('change', saveSettings);
    });
  });

  // ── CORE: ENHANCE ─────────────────────────────────────────────────
  function handleEnhance() {
    hide('errBox');
    var raw = el('rawInput').value.trim();
    if (!raw) { showErr('Please type a prompt first.'); el('rawInput').focus(); return; }

    setLoading(true);

    // Use setTimeout(0) so UI updates before the engine runs
    setTimeout(function () {
      try {
        var depth = parseInt(el('depthSlider').value, 10) || 4;
        var opts  = { depth: depth, liveSearch: el('tgLiveSearch').checked };

        window.HailMaryEngine.enhance(raw, currentMode, 'auto', opts).then(function(result) {
          lastResult = result;

          // Render output
          renderOutput(result);
          show('outWrap');
          el('outWrap').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

          // History
          saveHistory(result);
          refreshHistory();

          // Auto-inject
          if (el('tgInject').checked) {
            injectToTab(result.enhanced, el('tgSubmit').checked).then(function (ok) {
              if (ok) toast(el('tgSubmit').checked ? '🚀 Injected & Submitted!' : '🚀 Injected!');
              else    toast('✅ Enhanced! Click 🚀 to inject');
            });
          } else {
            var knowledgeNote = result.stats.liveTechniques > 0 ? ' · ' + result.stats.liveTechniques + ' live techniques' : (result.stats.knowledgeUsed > 0 ? ' · ' + result.stats.knowledgeUsed + ' web techniques' : '');
            toast('Enhanced: ' + result.stats.powerMultiplier + 'x boost · ' + result.techniques.length + ' techniques' + knowledgeNote);
          }
          setLoading(false);
        }).catch(function(err) {
          showErr('Error: ' + err.message);
          console.error('[HailMary]', err);
          setLoading(false);
        });
      } catch (err) {
        showErr('Error: ' + err.message);
        console.error('[HailMary]', err);
        setLoading(false);
      }
    }, 0);
  }

  // ── RENDER OUTPUT ─────────────────────────────────────────────────
  function renderOutput(r) {
    // Tags
    var tags = '';
    tags += '<span class="tag task">📌 ' + (r.analysis.task || '?') + '</span>';
    (r.analysis.domains || []).slice(0, 2).forEach(function (d) {
      tags += '<span class="tag domain">' + d + '</span>';
    });
    var cx = r.analysis.complexity;
    tags += '<span class="tag ' + (cx === 'high' ? 'cplx-h' : cx === 'low' ? 'cplx-l' : 'cplx-m') + '">' + cx + '</span>';
    if (r.autoRouted) tags += '<span class="tag">auto→' + r.mode + '</span>';
    (r.techniques || []).slice(0, 10).forEach(function (t) {
      tags += '<span class="tag">' + t + '</span>';
    });
    el('tagRow').innerHTML = tags;

    // Text
    el('outBox').textContent = r.enhanced;

    // Stats
    var liveStat = r.stats.liveTechniques > 0 ? '  ·  🌐 ' + r.stats.liveTechniques + ' live' : '';
    el('statsBar').textContent = '🔢 ' + r.stats.originalTokens + '→' + r.stats.enhancedTokens + ' tok  ·  ⚡ ' + r.stats.powerMultiplier + 'x  ·  🧱 ' + r.stats.techniqueCount + ' techniques' + liveStat + '  ·  ⏱ ' + r.stats.duration + 'ms';
  }

  // ── COPY ──────────────────────────────────────────────────────────
  function handleCopy() {
    if (!lastResult) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lastResult.enhanced).then(function () {
        el('copyBtn').textContent = '✅';
        setTimeout(function () { el('copyBtn').textContent = '📋'; }, 1500);
        toast('📋 Copied!');
      }).catch(function () { fallbackCopy(lastResult.enhanced); });
    } else {
      fallbackCopy(lastResult.enhanced);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    toast('📋 Copied!');
  }

  // ── INJECT ────────────────────────────────────────────────────────
  function handleInject() {
    if (!lastResult) return;
    injectToTab(lastResult.enhanced, el('tgSubmit').checked).then(function (ok) {
      if (ok) toast('🚀 Injected' + (el('tgSubmit').checked ? ' & Submitted!' : '!'));
      else    toast('⚠️ Not on a supported AI page');
    });
  }

  function injectToTab(text, autoSubmit) {
    return new Promise(function (resolve) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || !tabs[0]) { resolve(false); return; }
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: injectFn,
          args: [text, !!autoSubmit]
        }, function (results) {
          resolve(!chrome.runtime.lastError && results && results[0] && results[0].result === true);
        });
      });
    });
  }

  // This function runs INSIDE the target page
  function injectFn(text, autoSubmit) {
    var selectors = [
      '#prompt-textarea',
      '.ProseMirror',
      '[contenteditable="true"]',
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="prompt"]',
      '[role="textbox"]',
      'textarea'
    ];
    var input = null;
    for (var i = 0; i < selectors.length; i++) {
      try {
        var found = document.querySelector(selectors[i]);
        if (found && found.offsetParent !== null) { input = found; break; }
      } catch (e) {}
    }
    if (!input) return false;

    var isEditable = input.getAttribute('contenteditable') === 'true' ||
                     input.classList.contains('ProseMirror') ||
                     input.tagName !== 'TEXTAREA';

    if (isEditable) {
      input.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, text);
      if (!input.textContent.includes(text.slice(0, 15))) {
        input.textContent = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else {
      var setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
      if (setter && setter.set) setter.set.call(input, text);
      else input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    input.focus();

    if (autoSubmit) {
      setTimeout(function () {
        var btnSels = [
          '[data-testid="send-button"]',
          'button[aria-label="Send message"]',
          'button[aria-label="Send"]',
          '[data-testid="sendButton"]',
          '.send-button',
          'button[type="submit"]'
        ];
        for (var j = 0; j < btnSels.length; j++) {
          try {
            var btn = document.querySelector(btnSels[j]);
            if (btn && !btn.disabled) { btn.click(); return; }
          } catch (e) {}
        }
        input.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true
        }));
      }, 200);
    }
    return true;
  }

  // ── CLEAR ─────────────────────────────────────────────────────────
  function handleClear() {
    hide('outWrap');
    el('rawInput').value = '';
    el('rawInput').focus();
    lastResult = null;
    hide('errBox');
  }

  // ── SETTINGS PERSIST ──────────────────────────────────────────────
  function saveSettings() {
    try {
      chrome.storage.local.set({
        hm_v3: {
          mode:    currentMode,
          depth:   el('depthSlider').value,
          inject:  el('tgInject').checked,
          submit:  el('tgSubmit').checked,
          liveSearch: el('tgLiveSearch').checked
        }
      });
    } catch (e) {}
  }

  function loadSettings() {
    try {
      chrome.storage.local.get('hm_v3', function (data) {
        var s = data && data.hm_v3;
        if (!s) return;
        if (s.mode) {
          currentMode = s.mode;
          document.querySelectorAll('.tab').forEach(function (b) {
            b.classList.toggle('active', b.dataset.mode === s.mode);
          });
          updateFireBtn();
        }
        if (s.depth) {
          el('depthSlider').value = s.depth;
          el('depthLbl').textContent = DEPTH_LABELS[parseInt(s.depth, 10) - 1];
        }
        if (s.inject !== undefined) el('tgInject').checked = s.inject;
        if (s.submit !== undefined) el('tgSubmit').checked = s.submit;
        if (s.liveSearch !== undefined && el('tgLiveSearch')) el('tgLiveSearch').checked = s.liveSearch;
      });
    } catch (e) {}
  }

  function updateFireBtn() {
    var label = FIRE_LABELS[currentMode] || '⚡ ENHANCE';
    var parts = label.split(' ');
    el('fireBtn').querySelector('.fire-ico').textContent = parts[0];
    el('fireLbl').textContent = parts.slice(1).join(' ');
  }

  // ── HISTORY ──────────────────────────────────────────────────────
  function saveHistory(result) {
    try {
      chrome.storage.local.get('hm_hist', function (data) {
        var hist = (data && data.hm_hist) || [];
        hist.unshift({
          raw:      result.original,
          enhanced: result.enhanced,
          mode:     result.mode,
          task:     result.analysis.task,
          ts:       new Date().toLocaleTimeString()
        });
        if (hist.length > MAX_HIST) hist = hist.slice(0, MAX_HIST);
        chrome.storage.local.set({ hm_hist: hist });
      });
    } catch (e) {}
  }

  function refreshHistory() {
    try {
      chrome.storage.local.get('hm_hist', function (data) {
        var hist = (data && data.hm_hist) || [];
        el('histCount').textContent = hist.length;
        var list = el('histList');
        list.innerHTML = '';
        if (hist.length === 0) {
          list.innerHTML = '<div style="padding:10px;color:#64748b;font-size:11px;text-align:center">No history yet</div>';
          return;
        }
        hist.forEach(function (item) {
          var div = document.createElement('div');
          div.className = 'hist-item';
          div.innerHTML = '<div class="hi-raw">' + esc(item.raw) + '</div>' +
            '<div class="hi-meta"><span class="hi-mode">' + esc(item.mode || '') + '</span>' +
            '<span>' + esc(item.task || '') + '</span><span>' + esc(item.ts || '') + '</span></div>';
          div.addEventListener('click', function () {
            el('rawInput').value = item.raw;
            el('outBox').textContent = item.enhanced;
            show('outWrap');
            lastResult = { enhanced: item.enhanced, original: item.raw };
            list.style.display = 'none';
            toast('📜 Loaded from history');
          });
          list.appendChild(div);
        });
      });
    } catch (e) {}
  }

  // ── TAB STATUS CHECK ─────────────────────────────────────────────
  function checkTab() {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || !tabs[0]) return;
        var url = tabs[0].url || '';
        var supported = ['chatgpt.com','openai.com','claude.ai','gemini.google','perplexity.ai','poe.com','grok.com','you.com'];
        var on = supported.some(function (s) { return url.includes(s); });
        var dot = el('statusDot');
        dot.classList.toggle('on', on);
        dot.classList.toggle('warn', !on);
        dot.title = on ? '✅ Connected — will inject directly' : '⚠️ Not on a supported AI page';
      });
    } catch (e) {}
  }

  // ── UTILS ─────────────────────────────────────────────────────────
  function setLoading(on) {
    el('fireBtn').disabled = on;
    el('fireLbl').textContent = on ? (el('tgLiveSearch').checked ? 'SEARCHING + ENHANCING...' : 'ENHANCING...') : (FIRE_LABELS[currentMode] || 'ENHANCE').replace(/^[^\s]+\s/, '');
  }

  function showErr(msg) {
    el('errBox').textContent = msg;
    show('errBox');
  }

  function toast(msg) {
    var existing = document.querySelector('.hm-toast');
    if (existing) existing.remove();
    var t = document.createElement('div');
    t.className = 'hm-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2200);
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

}());
