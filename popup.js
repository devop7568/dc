/**
 * HailMary Popup Controller v8.0
 * Wires up: injection modes, prompt scoring, templates, context capture,
 * chain enhancement, A/B compare, history search, and all existing features.
 */
(function () {
  'use strict';

  // ── CONSTANTS ──────────────────────────────────────────────────────
  var DEPTH_LABELS = ['LITE', 'STANDARD', 'ENHANCED', 'ULTRA', 'GOD \uD83D\uDD25'];
  var FIRE_LABELS  = {
    hailmary: '\u2604\uFE0F FIRE HAIL MARY',
    manus:    '\uD83E\uDDE0 RUN MANUS',
    juma:     '\u26A1 UNLEASH JUMA',
    auto:     '\uD83E\uDD16 AUTO-ENHANCE',
    turns:    '\uD83D\uDD04 GENERATE TURNS'
  };

  // ── STATE ──────────────────────────────────────────────────────────
  var currentMode       = 'hailmary';
  var currentTurns      = 8;
  var currentInjectMode = 'direct';
  var capturedContext    = null;
  var lastResult        = null;
  var lastTurns         = null;
  var MAX_HIST          = 30;

  // ── DOM HELPERS ────────────────────────────────────────────────────
  function el(id) { return document.getElementById(id); }
  function show(id) { var e = el(id); if (e) e.style.display = ''; }
  function hide(id) { var e = el(id); if (e) e.style.display = 'none'; }

  // ── INIT ───────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {

    if (typeof window.HailMaryEngine === 'undefined') {
      el('errBox').textContent = '\u274C Engine failed to load. Try reloading the extension.';
      show('errBox');
      el('fireBtn').disabled = true;
      return;
    }

    loadSettings();
    refreshHistory();
    checkTab();
    renderTemplates('all');

    // ── Mode tabs ────────────────────────────────────────────────────
    document.querySelectorAll('.tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        if (currentMode === 'turns') {
          hide('standardPanel'); show('turnsPanel'); hide('outWrap');
        } else {
          show('standardPanel'); hide('turnsPanel'); hide('turnsOutWrap');
          updateFireBtn();
        }
        saveSettings();
      });
    });

    // ── Turns count ──────────────────────────────────────────────────
    document.querySelectorAll('.turns-count-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.turns-count-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentTurns = parseInt(btn.dataset.turns, 10);
        saveSettings();
      });
    });

    // ── Depth slider ─────────────────────────────────────────────────
    el('depthSlider').addEventListener('input', function () {
      el('depthLbl').textContent = DEPTH_LABELS[parseInt(this.value, 10) - 1];
      saveSettings();
    });

    // ── Injection mode buttons ───────────────────────────────────────
    document.querySelectorAll('.inject-mode-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.inject-mode-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentInjectMode = btn.dataset.inject;
        saveSettings();
      });
    });

    // ── Injection strategy tabs in output ────────────────────────────
    document.querySelectorAll('.inject-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!lastResult || !lastResult.injectionStrategies) return;
        document.querySelectorAll('.inject-tab').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var strategy = btn.dataset.strategy;
        showInjectionStrategy(strategy);
      });
    });

    // ── Fire button ──────────────────────────────────────────────────
    el('fireBtn').addEventListener('click', handleEnhance);
    el('turnsBtn').addEventListener('click', handleTurns);

    // ── Keyboard shortcuts ───────────────────────────────────────────
    el('rawInput').addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleEnhance();
    });
    el('turnsInput').addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleTurns();
    });

    // ── Output buttons ───────────────────────────────────────────────
    el('copyBtn').addEventListener('click', handleCopy);
    el('injectBtn').addEventListener('click', function () { handleInject(); });
    el('clearBtn').addEventListener('click', handleClear);
    el('compareBtn').addEventListener('click', toggleCompare);
    el('rechainBtn').addEventListener('click', handleRechain);

    // ── Turns output buttons ─────────────────────────────────────────
    el('turnsCopyAllBtn').addEventListener('click', handleCopyAllTurns);
    el('turnsClearBtn').addEventListener('click', function () {
      hide('turnsOutWrap'); lastTurns = null;
    });

    // ── History ──────────────────────────────────────────────────────
    el('histHdr').addEventListener('click', function (e) {
      if (e.target.id === 'histSearchToggle' || e.target.id === 'histSearch') return;
      var list = el('histList');
      list.style.display = list.style.display === 'none' ? 'block' : 'none';
    });
    el('histSearchToggle').addEventListener('click', function (e) {
      e.stopPropagation();
      var searchInput = el('histSearch');
      searchInput.style.display = searchInput.style.display === 'none' ? '' : 'none';
      if (searchInput.style.display !== 'none') searchInput.focus();
    });
    el('histSearch').addEventListener('input', function () {
      refreshHistory(this.value.trim().toLowerCase());
    });
    el('histSearch').addEventListener('click', function (e) { e.stopPropagation(); });

    // ── Templates toggle ─────────────────────────────────────────────
    el('templatesToggle').addEventListener('click', function () {
      var panel = el('templatesPanel');
      panel.style.display = panel.style.display === 'none' ? '' : 'none';
    });
    document.querySelectorAll('.tpl-cat').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.tpl-cat').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderTemplates(btn.dataset.cat);
      });
    });

    // ── Prompt scoring ───────────────────────────────────────────────
    el('scorePrevBtn').addEventListener('click', function () {
      var raw = el('rawInput').value.trim();
      if (!raw) { showErr('Type a prompt first to score it.'); return; }
      var score = window.HailMaryEngine.scorePrompt(raw);
      renderScore(score);
      show('scorePanel');
    });

    // ── Context capture ──────────────────────────────────────────────
    el('captureCtxBtn').addEventListener('click', handleCaptureContext);
    el('clearCtxBtn').addEventListener('click', function () {
      capturedContext = null;
      hide('capturedCtxBar');
      toast('Context cleared');
    });

    // ── Techniques panel toggle ───────────────────────────────────────
    el('techToggle').addEventListener('click', function () {
      var panel = el('techPanel');
      if (panel.style.display === 'none') {
        renderTechPanel();
        panel.style.display = '';
      } else {
        panel.style.display = 'none';
      }
    });

    // ── Toggle settings persist ──────────────────────────────────────
    ['tgInject', 'tgSubmit', 'tgChain'].forEach(function (id) {
      el(id).addEventListener('change', saveSettings);
    });

    // ── Live scoring as user types (debounced) ───────────────────────
    var scoreTimeout = null;
    el('rawInput').addEventListener('input', function () {
      if (scoreTimeout) clearTimeout(scoreTimeout);
      scoreTimeout = setTimeout(function () {
        var raw = el('rawInput').value.trim();
        if (raw.length > 5 && el('scorePanel').style.display !== 'none') {
          var score = window.HailMaryEngine.scorePrompt(raw);
          renderScore(score);
        }
      }, 500);
    });
  });

  // ── TEMPLATES ──────────────────────────────────────────────────────
  function renderTemplates(category) {
    var templates = window.HailMaryEngine.getTemplates(category);
    var list = el('templatesList');
    list.innerHTML = '';
    templates.forEach(function (tpl) {
      var item = document.createElement('div');
      item.className = 'tpl-item';
      item.innerHTML = '<span class="tpl-ico">' + tpl.icon + '</span>' +
        '<span class="tpl-name">' + esc(tpl.name) + '</span>' +
        '<span class="tpl-cat-tag">' + esc(tpl.category) + '</span>';
      item.addEventListener('click', function () {
        el('rawInput').value = tpl.template;
        el('templatesPanel').style.display = 'none';
        el('rawInput').focus();
        toast('\uD83D\uDCDD Template loaded: ' + tpl.name);
      });
      list.appendChild(item);
    });
  }

  // ── PROMPT SCORE RENDER ────────────────────────────────────────────
  function renderScore(score) {
    var gradeEl = el('scoreGrade');
    gradeEl.textContent = score.grade;
    gradeEl.className = 'score-grade grade-' + score.grade;
    el('scoreNum').textContent = score.overall;

    var dims = score.dimensions;
    var barsHtml = '';
    var dimNames = { clarity: 'Clarity', specificity: 'Specificity', context: 'Context', structure: 'Structure', actionability: 'Action' };
    for (var k in dims) {
      var val = dims[k];
      var color = val >= 70 ? '#22c55e' : val >= 45 ? '#eab308' : '#ef4444';
      barsHtml += '<div class="score-bar-row">' +
        '<span class="score-bar-label">' + (dimNames[k] || k) + '</span>' +
        '<div class="score-bar-track"><div class="score-bar-fill" style="width:' + val + '%;background:' + color + '"></div></div>' +
        '<span class="score-bar-val">' + val + '</span></div>';
    }
    el('scoreBars').innerHTML = barsHtml;

    var tipsHtml = '';
    (score.suggestions || []).forEach(function (s) {
      tipsHtml += '<div class="score-tip">\u26A0\uFE0F ' + esc(s) + '</div>';
    });
    el('scoreTips').innerHTML = tipsHtml;
  }

  // ── TECHNIQUES PANEL ──────────────────────────────────────────────
  function renderTechPanel() {
    var allTechs = window.HailMaryEngine.getTechniques();
    var depth = parseInt(el('depthSlider').value, 10) || 4;
    var list = el('techList');
    list.innerHTML = '';
    var activeCount = 0;
    allTechs.forEach(function (tech) {
      var isActive = depth >= tech.minDepth;
      if (isActive) activeCount++;
      var item = document.createElement('div');
      item.className = 'tech-item';
      item.style.opacity = isActive ? '1' : '0.4';
      var depthLabel = 'Depth ' + tech.minDepth + '+';
      item.innerHTML =
        '<span class="tech-item-ico">' + tech.icon + '</span>' +
        '<div class="tech-item-info">' +
          '<div><span class="tech-item-name">' + esc(tech.name) + '</span>' +
          '<span class="tech-item-src">' + esc(tech.source) + '</span></div>' +
          '<div class="tech-item-desc">' + esc(tech.description) + '</div>' +
        '</div>' +
        '<span class="tech-item-depth">' + depthLabel + '</span>';
      list.appendChild(item);
    });
    el('techCount').textContent = activeCount + ' / ' + allTechs.length + ' active';
  }

  function renderTechTags(techniques) {
    var allTechs = window.HailMaryEngine.getTechniques();
    var techMap = {};
    allTechs.forEach(function (t) { techMap[t.id] = t; });
    var row = el('techRow');
    var html = '';
    (techniques || []).forEach(function (id) {
      var tech = techMap[id];
      if (tech) {
        html += '<span class="tech-tag tech-active"><span class="tech-tag-ico">' +
          tech.icon + '</span>' + esc(tech.name) + '</span>';
      }
    });
    if (html) {
      row.innerHTML = html;
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  }

  // ── CONTEXT CAPTURE ────────────────────────────────────────────────
  function handleCaptureContext() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs || !tabs[0]) { toast('\u26A0\uFE0F No active tab'); return; }
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: function () {
          var sel = window.getSelection();
          if (sel && sel.toString().trim().length > 10) return sel.toString().trim();
          var main = document.querySelector('main, article, [role="main"], .content, #content');
          if (main) return main.textContent.trim().slice(0, 2000);
          return document.body.textContent.trim().slice(0, 1500);
        }
      }, function (results) {
        if (chrome.runtime.lastError || !results || !results[0]) {
          toast('\u26A0\uFE0F Could not capture page context');
          return;
        }
        var text = results[0].result;
        if (!text || text.length < 10) {
          toast('\u26A0\uFE0F No meaningful content found');
          return;
        }
        capturedContext = text;
        el('capturedCtxLen').textContent = '(' + text.length + ' chars)';
        show('capturedCtxBar');
        toast('\uD83C\uDF10 Context captured! (' + text.length + ' chars)');
      });
    });
  }

  // ── INJECTION STRATEGY DISPLAY ─────────────────────────────────────
  function showInjectionStrategy(strategyKey) {
    if (!lastResult || !lastResult.injectionStrategies) return;
    var strategy = lastResult.injectionStrategies[strategyKey];
    if (!strategy) return;

    if (strategyKey === 'system') {
      el('outBox').textContent = '=== SYSTEM PROMPT ===\n\n' +
        strategy.systemPrompt + '\n\n=== USER PROMPT ===\n\n' + strategy.userPrompt;
    } else {
      el('outBox').textContent = strategy.content;
    }
  }

  // ── A/B COMPARE ────────────────────────────────────────────────────
  function toggleCompare() {
    if (!lastResult) return;
    var panel = el('comparePanel');
    var outBox = el('outBox');
    if (panel.style.display === 'none') {
      el('compareOriginal').textContent = lastResult.original;
      el('compareEnhanced').textContent = lastResult.enhanced;
      panel.style.display = '';
      outBox.style.display = 'none';
    } else {
      panel.style.display = 'none';
      outBox.style.display = '';
    }
  }

  // ── RE-CHAIN ───────────────────────────────────────────────────────
  function handleRechain() {
    if (!lastResult || !lastResult.enhanced) return;
    var depth = parseInt(el('depthSlider').value, 10) || 4;
    var mode = lastResult.mode || 'hailmary';
    var chained = window.HailMaryEngine.chainEnhance(lastResult.enhanced, depth, mode);
    lastResult.enhanced = chained;
    if (lastResult.stats) lastResult.stats.techniqueCount += 3;
    if (lastResult.techniques) lastResult.techniques.push('chainReview');
    // Rebuild injection strategies with the chained content
    lastResult.injectionStrategies = window.HailMaryEngine.rebuildInjectionStrategies(
      chained, lastResult.original || '', mode
    );
    el('outBox').textContent = chained;
    toast('\uD83D\uDD17 Chain pass applied!');
  }

  // ── TURNS HANDLER ──────────────────────────────────────────────────
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
        toast('\uD83D\uDD04 ' + result.count + ' turns generated!');
        el('turnsBtn').disabled = false;
        el('turnsLbl').textContent = 'GENERATE TURNS';
      }).catch(function (err) {
        showErr('Error: ' + err.message);
        el('turnsBtn').disabled = false;
        el('turnsLbl').textContent = 'GENERATE TURNS';
      });
    }, 0);
  }

  // ── RENDER TURNS ───────────────────────────────────────────────────
  function renderTurns(result) {
    el('turnsOutTitle').textContent = result.count + ' Turns \u00B7 ' + result.topic.slice(0, 30) + (result.topic.length > 30 ? '\u2026' : '');
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
        '<button class="turn-copy-btn" data-turn="' + turn.number + '">\uD83D\uDCCB</button>';

      var preview = document.createElement('div');
      preview.className = 'turn-preview';
      preview.textContent = turn.text.slice(0, 90) + '\u2026';

      var body = document.createElement('div');
      body.className = 'turn-body';
      body.textContent = turn.text;

      header.addEventListener('click', function (e) {
        if (e.target.classList.contains('turn-copy-btn')) return;
        body.classList.toggle('open');
        preview.style.display = body.classList.contains('open') ? 'none' : '';
      });

      header.querySelector('.turn-copy-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        copyText(turn.text);
        e.target.textContent = '\u2705';
        setTimeout(function () { e.target.textContent = '\uD83D\uDCCB'; }, 1500);
        toast('\uD83D\uDCCB Turn ' + turn.number + ' copied!');
      });

      item.appendChild(header);
      item.appendChild(preview);
      item.appendChild(body);
      list.appendChild(item);
    });
  }

  // ── COPY ALL TURNS ─────────────────────────────────────────────────
  function handleCopyAllTurns() {
    if (!lastTurns) return;
    var all = lastTurns.turns.map(function (t) {
      return '\u2500\u2500 TURN ' + t.number + ' (' + t.phase.toUpperCase() + ') \u2500\u2500\n\n' + t.text;
    }).join('\n\n' + '\u2500'.repeat(50) + '\n\n');
    copyText(all);
    el('turnsCopyAllBtn').textContent = '\u2705 All';
    setTimeout(function () { el('turnsCopyAllBtn').textContent = '\uD83D\uDCCB All'; }, 1500);
    toast('\uD83D\uDCCB All ' + lastTurns.count + ' turns copied!');
  }

  // ── CORE: ENHANCE ──────────────────────────────────────────────────
  function handleEnhance() {
    hide('errBox');
    var raw = el('rawInput').value.trim();
    if (!raw) { showErr('Please type a prompt first.'); el('rawInput').focus(); return; }

    setLoading(true);

    setTimeout(function () {
      try {
        var depth = parseInt(el('depthSlider').value, 10) || 4;
        var opts  = {
          depth: depth,
          chainPass: el('tgChain').checked,
          capturedContext: capturedContext
        };

        window.HailMaryEngine.enhance(raw, currentMode, 'auto', opts).then(function (result) {
          lastResult = result;
          renderOutput(result);
          renderTechTags(result.techniques);
          show('outWrap');
          el('outWrap').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          saveHistory(result);
          refreshHistory();

          // Select the active injection strategy content
          var activeStrategy = currentInjectMode;
          document.querySelectorAll('.inject-tab').forEach(function (b) {
            b.classList.toggle('active', b.dataset.strategy === activeStrategy);
          });
          showInjectionStrategy(activeStrategy);

          // Auto-inject
          if (el('tgInject').checked) {
            var injectContent = getInjectContent(activeStrategy);
            injectToTab(injectContent, el('tgSubmit').checked).then(function (ok) {
              if (ok) toast(el('tgSubmit').checked ? '\uD83D\uDE80 Injected & Submitted!' : '\uD83D\uDE80 Injected!');
              else    toast('\u2705 Enhanced! Click \uD83D\uDE80 to inject');
            });
          } else {
            var scoreNote = result.score ? ' \u00B7 Score: ' + result.score.grade : '';
            var knowledgeNote = result.stats.knowledgeUsed > 0 ? ' \u00B7 ' + result.stats.knowledgeUsed + ' web techniques' : '';
            toast('\u2705 ' + result.stats.powerMultiplier + 'x boost \u00B7 ' + result.techniques.length + ' techniques' + scoreNote + knowledgeNote);
          }
          setLoading(false);
        }).catch(function (err) {
          showErr('Error: ' + err.message);
          setLoading(false);
        });
      } catch (err) {
        showErr('Error: ' + err.message);
        setLoading(false);
      }
    }, 0);
  }

  // ── GET INJECT CONTENT ─────────────────────────────────────────────
  function getInjectContent(strategyKey) {
    if (!lastResult || !lastResult.injectionStrategies) return lastResult ? lastResult.enhanced : '';
    var strategy = lastResult.injectionStrategies[strategyKey];
    if (!strategy) return lastResult.enhanced;
    if (strategyKey === 'system') {
      return strategy.systemPrompt + '\n\n---\n\n' + strategy.userPrompt;
    }
    return strategy.content;
  }

  // ── RENDER OUTPUT ──────────────────────────────────────────────────
  function renderOutput(r) {
    var tags = '';
    tags += '<span class="tag task">\uD83D\uDCCC ' + (r.analysis.task || '?') + '</span>';
    (r.analysis.domains || []).slice(0, 2).forEach(function (d) {
      tags += '<span class="tag domain">' + d + '</span>';
    });
    var cx = r.analysis.complexity;
    tags += '<span class="tag ' + (cx === 'high' ? 'cplx-h' : cx === 'low' ? 'cplx-l' : 'cplx-m') + '">' + cx + '</span>';
    if (r.autoRouted) tags += '<span class="tag">auto\u2192' + r.mode + '</span>';
    if (r.score) tags += '<span class="tag score-tag">' + r.score.grade + ' ' + r.score.overall + '</span>';
    (r.techniques || []).slice(0, 10).forEach(function (t) {
      tags += '<span class="tag">' + t + '</span>';
    });
    el('tagRow').innerHTML = tags;
    el('outBox').textContent = r.enhanced;
    el('comparePanel').style.display = 'none';
    el('outBox').style.display = '';

    var statsText = '\uD83D\uDD22 ' + r.stats.originalTokens + '\u2192' + r.stats.enhancedTokens + ' tok';
    statsText += '  \u00B7  \u26A1 ' + r.stats.powerMultiplier + 'x';
    statsText += '  \u00B7  \uD83E\uDDF1 ' + r.stats.techniqueCount + ' techniques';
    statsText += '  \u00B7  \u23F1 ' + r.stats.duration + 'ms';
    if (r.score) statsText += '  \u00B7  \uD83D\uDCCA ' + r.score.grade + ' (' + r.score.overall + ')';
    el('statsBar').textContent = statsText;
  }

  // ── COPY ───────────────────────────────────────────────────────────
  function handleCopy() {
    if (!lastResult) return;
    var activeTab = document.querySelector('.inject-tab.active');
    var strategyKey = activeTab ? activeTab.dataset.strategy : 'direct';
    var content = getInjectContent(strategyKey);
    copyText(content);
    el('copyBtn').textContent = '\u2705';
    setTimeout(function () { el('copyBtn').textContent = '\uD83D\uDCCB'; }, 1500);
    toast('\uD83D\uDCCB Copied!');
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

  // ── INJECT ─────────────────────────────────────────────────────────
  function handleInject() {
    if (!lastResult) return;
    var activeTab = document.querySelector('.inject-tab.active');
    var strategyKey = activeTab ? activeTab.dataset.strategy : 'direct';
    var content = getInjectContent(strategyKey);
    injectToTab(content, el('tgSubmit').checked).then(function (ok) {
      if (ok) toast('\uD83D\uDE80 Injected' + (el('tgSubmit').checked ? ' & Submitted!' : '!'));
      else    toast('\u26A0\uFE0F Not on a supported AI page');
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
    var selectors = [
      '#prompt-textarea', '.ProseMirror', '[contenteditable="true"]',
      'textarea[placeholder*="message"]', 'textarea[placeholder*="Message"]',
      'textarea[placeholder*="Ask"]', 'textarea[placeholder*="prompt"]',
      'textarea[placeholder*="Type"]', '[role="textbox"]',
      'div[contenteditable][data-placeholder]', 'textarea'
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
        var btnSels = [
          '[data-testid="send-button"]', 'button[aria-label="Send message"]',
          'button[aria-label="Send"]', '[data-testid="sendButton"]',
          '.send-button', 'button[type="submit"]',
          'button[data-testid="send-button"]', '[aria-label="Send prompt"]'
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

  // ── CLEAR ──────────────────────────────────────────────────────────
  function handleClear() {
    hide('outWrap');
    el('rawInput').value = '';
    el('rawInput').focus();
    lastResult = null;
    hide('errBox');
    hide('scorePanel');
  }

  // ── SETTINGS ───────────────────────────────────────────────────────
  function saveSettings() {
    try {
      chrome.storage.local.set({
        hm_v3: {
          mode:       currentMode,
          depth:      el('depthSlider').value,
          inject:     el('tgInject').checked,
          submit:     el('tgSubmit').checked,
          chain:      el('tgChain').checked,
          turns:      currentTurns,
          injectMode: currentInjectMode
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
        if (s.chain !== undefined) el('tgChain').checked = s.chain;
        if (s.turns) {
          currentTurns = s.turns;
          document.querySelectorAll('.turns-count-btn').forEach(function (b) {
            b.classList.toggle('active', parseInt(b.dataset.turns, 10) === s.turns);
          });
        }
        if (s.injectMode) {
          currentInjectMode = s.injectMode;
          document.querySelectorAll('.inject-mode-btn').forEach(function (b) {
            b.classList.toggle('active', b.dataset.inject === s.injectMode);
          });
        }
      });
    } catch (e) {}
  }

  function updateFireBtn() {
    var label = FIRE_LABELS[currentMode] || '\u26A1 ENHANCE';
    var parts = label.split(' ');
    el('fireBtn').querySelector('.fire-ico').textContent = parts[0];
    el('fireLbl').textContent = parts.slice(1).join(' ');
  }

  // ── HISTORY ────────────────────────────────────────────────────────
  function saveHistory(result) {
    try {
      chrome.storage.local.get('hm_hist', function (data) {
        var hist = (data && data.hm_hist) || [];
        hist.unshift({
          raw:         result.original,
          enhanced:    result.enhanced,
          mode:        result.mode,
          task:        result.analysis.task,
          injectMode:  currentInjectMode,
          scoreGrade:  result.score ? result.score.grade : null,
          scoreVal:    result.score ? result.score.overall : null,
          ts:          new Date().toLocaleTimeString()
        });
        if (hist.length > MAX_HIST) hist = hist.slice(0, MAX_HIST);
        chrome.storage.local.set({ hm_hist: hist });
      });
    } catch (e) {}
  }

  function refreshHistory(searchFilter) {
    try {
      chrome.storage.local.get('hm_hist', function (data) {
        var hist = (data && data.hm_hist) || [];
        var filtered = hist;
        if (searchFilter) {
          filtered = hist.filter(function (item) {
            return (item.raw || '').toLowerCase().includes(searchFilter) ||
                   (item.task || '').toLowerCase().includes(searchFilter) ||
                   (item.mode || '').toLowerCase().includes(searchFilter);
          });
        }
        el('histCount').textContent = hist.length;
        var list = el('histList');
        list.innerHTML = '';
        if (filtered.length === 0) {
          list.innerHTML = '<div style="padding:10px;color:#64748b;font-size:11px;text-align:center">' +
            (searchFilter ? 'No results for "' + esc(searchFilter) + '"' : 'No history yet') + '</div>';
          return;
        }
        filtered.forEach(function (item) {
          var div = document.createElement('div');
          div.className = 'hist-item';
          var scoreHtml = item.scoreGrade ? '<span class="hi-score">' + esc(item.scoreGrade) + '</span>' : '';
          div.innerHTML = '<div class="hi-raw">' + esc(item.raw) + '</div>' +
            '<div class="hi-meta"><span class="hi-mode">' + esc(item.mode || '') + '</span>' +
            '<span>' + esc(item.task || '') + '</span>' + scoreHtml +
            '<span>' + esc(item.ts || '') + '</span></div>';
          div.addEventListener('click', function () {
            el('rawInput').value = item.raw;
            el('outBox').textContent = item.enhanced;
            show('outWrap');
            lastResult = {
              enhanced: item.enhanced,
              original: item.raw,
              mode: item.mode || 'hailmary',
              techniques: [],
              stats: { techniqueCount: 0, powerMultiplier: '1.0', duration: 0 },
              injectionStrategies: window.HailMaryEngine.rebuildInjectionStrategies(
                item.enhanced, item.raw, item.mode || 'hailmary'
              )
            };
            list.style.display = 'none';
            toast('\uD83D\uDCDC Loaded from history');
          });
          list.appendChild(div);
        });
      });
    } catch (e) {}
  }

  // ── TAB STATUS ─────────────────────────────────────────────────────
  function checkTab() {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || !tabs[0]) return;
        var url = tabs[0].url || '';
        var supported = ['chatgpt.com', 'openai.com', 'claude.ai', 'gemini.google',
          'perplexity.ai', 'poe.com', 'grok.com', 'you.com', 'deepseek.com',
          'copilot.microsoft.com', 'chat.mistral.ai', 'labs.google'];
        var on = supported.some(function (s) { return url.includes(s); });
        var dot = el('statusDot');
        dot.classList.toggle('on', on);
        dot.classList.toggle('warn', !on);
        dot.title = on ? '\u2705 Connected \u2014 will inject directly' : '\u26A0\uFE0F Not on a supported AI page';
      });
    } catch (e) {}
  }

  // ── UTILS ──────────────────────────────────────────────────────────
  function setLoading(on) {
    el('fireBtn').disabled = on;
    el('fireLbl').textContent = on ? 'ENHANCING...' : (FIRE_LABELS[currentMode] || 'ENHANCE').replace(/^[^\s]+\s/, '');
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
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

}());
