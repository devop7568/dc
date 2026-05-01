/**
 * HailMary v7.0 — WORLD-CLASS PROMPT ENGINEER ENGINE
 * Input: any raw prompt. Output: one single, flowing, copy-paste-ready enhanced prompt.
 * Reads actual content. Generates real prompts. Not a checklist. Not instructions.
 * The output IS the enhanced prompt — ready to paste into any AI.
 */
window.HailMaryEngine = (function () {
  'use strict';

  // ── SESSION INTELLIGENCE ─────────────────────────────────────────────────────
  var session = { count: 0, current: 1.0, firstFP: null, taskHist: {} };
  function boost(task) {
    session.count++;
    session.taskHist[task] = (session.taskHist[task] || 0) + 1;
    session.current = Math.min(1 + session.count * 0.5, 3.5);
    return session.current;
  }

  // ── KNOWLEDGE CACHE ──────────────────────────────────────────────────────────
  var kCache = null, mCache = null, kChecked = 0;
  function loadKnowledge(cb) {
    var now = Date.now();
    if (kCache && now - kChecked < 30000) { cb(kCache, mCache); return; }
    try {
      chrome.runtime.sendMessage({ type: 'GET_KNOWLEDGE' }, function (r) {
        if (chrome.runtime.lastError || !r) { cb({ techniques: [] }, {}); return; }
        kCache = r.knowledge || { techniques: [] };
        mCache = r.memory || {};
        kChecked = now;
        cb(kCache, mCache);
      });
    } catch (e) { cb({ techniques: [] }, {}); }
  }
  function record(d) {
    try { chrome.runtime.sendMessage({ type: 'RECORD_ENHANCEMENT', data: d }); } catch (e) {}
  }
  function liveSearch(query, analysis) {
    return new Promise(function (resolve) {
      try {
        chrome.runtime.sendMessage({ type: 'LIVE_SEARCH_TECHNIQUES', query: query, analysis: analysis }, function (r) {
          if (chrome.runtime.lastError || !r) { resolve({ techniques: [], sources: [] }); return; }
          resolve(r);
        });
      } catch (e) {
        resolve({ techniques: [], sources: [] });
      }
    });
  }

  // ── ANALYZER ─────────────────────────────────────────────────────────────────
  // Reads every word of the raw prompt and extracts real signals.
  function analyze(raw) {
    var words = raw.trim().split(/\s+/);
    var wc = words.length;
    var sents = raw.split(/[.!?]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 3; });

    // Detect task
    var taskMap = {
      code:       /\b(code|function|class|implement|build|refactor|debug|script|api|algorithm|program|sql|python|javascript|typescript|react|vue|css|html|backend|frontend|database|endpoint|component|deploy|docker|git)\b/gi,
      research:   /\b(explain|why|how does|what is|what are|history|theory|study|literature|evidence|understand|meaning|define|overview|research|describe|elaborate|clarify|mechanism|origin|background)\b/gi,
      creative:   /\b(write|story|poem|essay|blog|creative|imagine|narrative|fiction|draft|article|caption|slogan|lyrics|script|novel|character|plot|scene|dialogue)\b/gi,
      math:       /\b(calculate|solve|equation|formula|proof|derive|compute|integral|derivative|probability|statistics|optimization|matrix|algebra|calculus)\b/gi,
      strategy:   /\b(strategy|plan|roadmap|decision|framework|best way|should i|recommend|prioritize|goals|approach|alternatives|tradeoffs|pros and cons|evaluate|choose)\b/gi,
      analysis:   /\b(analyze|audit|review|evaluate|assess|measure|metrics|data|report|breakdown|trend|pattern|insight|diagnose|benchmark|examine|investigate)\b/gi,
      howto:      /\b(how to|steps|guide|tutorial|walkthrough|procedure|instructions|setup|configure|install|get started|step by step|process|workflow)\b/gi,
      brainstorm: /\b(brainstorm|ideas|suggestions|possibilities|think of|come up with|ideate|generate ideas|list ideas|ways to|methods for)\b/gi,
      persuade:   /\b(persuade|convince|argue|debate|pitch|proposal|sell|negotiate|email|letter|cover letter|sales|marketing copy|ad copy|argument)\b/gi,
      summarize:  /\b(summarize|summary|tldr|condense|brief|overview|recap|key points|highlights|abstract|distill|main points|gist)\b/gi
    };
    var tScores = {};
    for (var t in taskMap) {
      var h = (raw.match(taskMap[t]) || []).length;
      if (h > 0) tScores[t] = h;
    }
    var tKeys = Object.keys(tScores).sort(function (a, b) { return tScores[b] - tScores[a]; });
    var task = tKeys[0] || 'general';

    // Detect domains
    var domMap = {
      tech:     /\b(software|cloud|api|machine learning|ai|ml|llm|docker|database|devops|security|network|web|mobile|saas|microservices)\b/gi,
      business: /\b(business|startup|revenue|market|customer|product|sales|marketing|growth|roi|kpi|investor|b2b|enterprise|monetize)\b/gi,
      science:  /\b(physics|chemistry|biology|medicine|neuroscience|psychology|economics|climate|quantum|genetics|evolution|experiment)\b/gi,
      legal:    /\b(legal|law|contract|compliance|regulation|privacy|gdpr|liability|patent|trademark|jurisdiction)\b/gi,
      health:   /\b(health|medical|symptoms|diagnosis|therapy|mental health|fitness|nutrition|clinical|treatment|medication|wellness)\b/gi,
      finance:  /\b(finance|investment|stock|crypto|portfolio|budget|revenue|profit|valuation|funding|equity|tax|accounting)\b/gi,
      education:/\b(learn|teach|student|curriculum|lesson|beginner|concept|fundamentals|course|training|skill)\b/gi
    };
    var domains = [];
    for (var d in domMap) { if (domMap[d].test(raw)) domains.push(d); }

    // Complexity
    var cx = 0;
    if (wc > 30) cx += 2; if (wc > 60) cx += 2;
    if (/\b(complex|advanced|comprehensive|expert|production|enterprise|sophisticated)\b/i.test(raw)) cx += 3;
    if (sents.length > 3) cx += 1;
    var complexity = cx >= 6 ? 'high' : cx <= 2 ? 'low' : 'medium';

    // Audience
    var audience = null;
    if (/\b(beginner|novice|non.?technical|layman)\b/i.test(raw)) audience = 'beginner';
    else if (/\b(expert|senior|advanced|specialist)\b/i.test(raw)) audience = 'expert';
    else if (/\b(developer|engineer|programmer)\b/i.test(raw)) audience = 'developer';
    else if (/\b(executive|ceo|cto|manager|director)\b/i.test(raw)) audience = 'executive';
    else if (/\b(student|learner)\b/i.test(raw)) audience = 'student';
    var audMatch = raw.match(/\bfor\s+(?:a\s+|an\s+)?([a-zA-Z\s]{3,30}?)(?:\s+audience|\s+reader|\s+user|[,.]|$)/i);
    if (audMatch) audience = audMatch[1].trim();

    // Format hints
    var fmt = [];
    if (/\b(bullet|bullets|bullet points?)\b/i.test(raw)) fmt.push('bullets');
    if (/\b(numbered|step by step|steps)\b/i.test(raw)) fmt.push('numbered');
    if (/\b(table|tabular)\b/i.test(raw)) fmt.push('table');
    if (/\b(short|brief|concise|quick|tldr|one.?liner)\b/i.test(raw)) fmt.push('short');
    if (/\b(detailed|comprehensive|thorough|in.?depth|complete)\b/i.test(raw)) fmt.push('detailed');
    if (/\b(json|yaml|xml|csv|markdown)\b/i.test(raw)) { var fm = raw.match(/\b(json|yaml|xml|csv|markdown)\b/i); if (fm) fmt.push(fm[0].toLowerCase()); }
    if (/\b(checklist|rubric|scorecard|template|schema)\b/i.test(raw)) { var sm = raw.match(/\b(checklist|rubric|scorecard|template|schema)\b/i); if (sm) fmt.push(sm[0].toLowerCase()); }

    // Tone
    var tone = null;
    if (/\b(formal|professional|official)\b/i.test(raw)) tone = 'formal';
    else if (/\b(casual|informal|conversational|friendly)\b/i.test(raw)) tone = 'casual';
    else if (/\b(funny|humorous|witty|playful)\b/i.test(raw)) tone = 'humorous';
    else if (/\b(simple|plain|easy|layman)\b/i.test(raw)) tone = 'simple';
    else if (/\b(technical|precise|rigorous)\b/i.test(raw)) tone = 'technical';

    // Extract constraints (must/avoid/ensure etc.)
    var constraints = [];
    var cp = /\b(must|should|need to|ensure|make sure|avoid|never|always|do not|don't|cannot|without|only|strictly|at least|no more than|under \d+ words?|in \d+ words?)\s+([^.,!?\n]{4,60})/gi;
    var cm; while ((cm = cp.exec(raw)) !== null) { var cv = cm[0].trim(); if (!constraints.includes(cv)) constraints.push(cv); }
    constraints = constraints.slice(0, 5);

    // Extract what user explicitly doesn't want
    var negations = [];
    var np = /\b(don't|do not|avoid|no|never|without|skip|omit|exclude)\s+([^.,!?\n]{3,50})/gi;
    var nm; while ((nm = np.exec(raw)) !== null) { var nv = nm[0].trim(); if (!negations.includes(nv)) negations.push(nv); }
    negations = negations.slice(0, 4);

    // Extract context sentences user provided
    var context = [];
    sents.forEach(function (s) {
      if (/^(i (am|have|work|use|currently|already)|we (are|have)|my (project|app|code|team|company|goal)|the (project|app|system)|currently|background|context)/i.test(s.trim()) && s.length > 10) {
        context.push(s.trim());
      }
    });
    var ctxInline = raw.match(/\bi(?:'m| am) (?:a |an )?[a-zA-Z\s]{3,25}(?:developer|engineer|student|designer|writer|manager|researcher|beginner|expert)\b/gi) || [];
    ctxInline.forEach(function (c) { if (!context.includes(c)) context.push(c); });
    context = context.slice(0, 3);

    var needsFresh = /\b(current|latest|recent|today|now|real.?time|web|search|sources?|cite|citation|evidence|research|compare sources|up.?to.?date|202[4-9]|breaking|market|trend|benchmark|pricing|docs?|api changes?)\b/i.test(raw);
    var qualitySignals = {
      hasRole: /\b(you are|act as|as an?|expert|senior|principal)\b/i.test(raw),
      hasContext: context.length > 0 || wc > 25,
      hasConstraints: constraints.length > 0,
      hasFormat: fmt.length > 0,
      needsFresh: needsFresh
    };

    // Clean intent
    var intent = raw
      .replace(/^(please\s+|can you\s+|could you\s+|would you\s+|i want\s+(?:you to\s+)?|i need\s+(?:you to\s+)?|help me\s+|write me\s+|create\s+a?\s*|make\s+a?\s*|generate\s+a?\s*|give me\s+a?\s*|show me\s+|tell me\s+|explain\s+(?:to me\s+)?(?:what\s+)?|describe\s+|analyze\s+|build\s+a?\s*|implement\s+a?\s*|write\s+a?\s*|what\s+is\s+|what\s+are\s+|how\s+does\s+|how\s+do\s+|why\s+(?:does\s+|is\s+|are\s+)?)/i, '')
      .replace(/\s*(please|thanks|thank you)\s*\.?$/i, '')
      .trim() || raw;

    // Subject (first 10 words of intent)
    var subject = intent.split(/\s+/).slice(0, 10).join(' ');

    // Ambiguity — only truly vague prompts score high
    var amb = 0;
    if (wc < 3) amb += 3;
    else if (wc < 6 && !/\b(code|explain|write|build|analyze|create|make|how|what|why|summarize|list|compare|design|implement|fix|debug|generate|describe|calculate|solve|plan|review|draft|improve)\b/i.test(raw)) amb += 2;
    if (!context.length && !constraints.length && wc < 5) amb += 1;

    var fp = raw.split('').reduce(function (h, c) { return (((h << 5) - h) + c.charCodeAt(0)) | 0; }, 0).toString(36);

    return { raw: raw, intent: intent, subject: subject, task: task, domains: domains, complexity: complexity, audience: audience, fmt: fmt, tone: tone, constraints: constraints, negations: negations, context: context, wc: wc, amb: amb, fp: fp, needsFresh: needsFresh, qualitySignals: qualitySignals };
  }

  // ── DYNAMIC ROLE GENERATOR ───────────────────────────────────────────────────
  // Each mode picks a different role variant based on task+domain+prompt fingerprint
  // so the same prompt always gets the same role, but different prompts get variety
  var ROLES = {
    code: [
      'You are a Principal Engineer who has shipped production systems at scale',
      'You are a Staff Software Engineer who has reviewed thousands of PRs',
      'You are a senior backend architect who thinks in systems, not just functions'
    ],
    research: [
      'You are a research scientist who separates signal from noise in complex literature',
      'You are an expert synthesizer who produces clear maps of what is actually known',
      'You are a domain expert who knows where students always get confused'
    ],
    strategy: [
      'You are a Chief Strategy Officer who has made high-stakes calls with incomplete information',
      'You are a management consultant who has seen the same mistakes at a hundred companies',
      'You are a founder who has navigated pivots and competitive pressure firsthand'
    ],
    analysis: [
      'You are a senior analyst who distrusts the obvious interpretation',
      'You are a data scientist who knows the difference between a finding and a story',
      'You are an investigative researcher who follows evidence wherever it leads'
    ],
    creative: [
      'You are a creative director who has killed a hundred mediocre ideas to find the one that lands',
      'You are a writer who believes the first draft is always wrong',
      'You are a storyteller who knows that specificity is the engine of resonance'
    ],
    general: [
      'You are a generalist expert who thinks clearly about hard problems across domains',
      'You are a rigorous thinker who never mistakes confidence for correctness',
      'You are a trusted advisor who gives the honest answer, not the comfortable one'
    ]
  };

  function pickRole(a) {
    var pool = ROLES[a.task] || ROLES.general;
    var idx = Math.abs(parseInt(a.fp, 36) || 0) % pool.length;
    var role = pool[idx];
    if (a.domains.length > 0) {
      var domainPhrases = {
        tech: ' with deep hands-on experience in production software',
        business: ' with a track record of building and scaling real businesses',
        science: ' with rigorous training in scientific methodology'
      };
      role += (domainPhrases[a.domains[0]] || '');
    }
    return role + '.';
  }

  function buildContextBlock(a) {
    var parts = [];
    if (a.context.length > 0) parts.push('Context: ' + a.context.join(' '));
    if (a.constraints.length > 0) parts.push('Requirements: ' + a.constraints.join('; '));
    if (a.negations.length > 0) parts.push('Avoid: ' + a.negations.join('; '));
    if (a.audience) {
      var audDesc = {
        beginner: 'Audience is a beginner — define terms, use analogies, build from first principles',
        expert: 'Audience is an expert — skip basics, use precise terminology, go deep',
        developer: 'Audience is a developer — be precise, show working code',
        executive: 'Audience is an executive — lead with impact and decisions'
      };
      parts.push(audDesc[a.audience] || ('Audience: ' + a.audience));
    }
    return parts.join('\n');
  }

  function buildQualityBar(a, depth) {
    var checks = [
      'Answer the exact task, not a nearby generic version',
      'Preserve every explicit constraint from the user',
      'Make assumptions visible before relying on them'
    ];
    if (a.needsFresh || a.task === 'research' || depth >= 4) checks.push('Ground factual claims in recent, authoritative sources when possible');
    if (a.task === 'code') checks.push('Prefer complete, runnable, maintainable code over fragments');
    if (a.task === 'analysis' || a.task === 'strategy') checks.push('Separate observations, interpretations, risks, and recommendations');
    if (depth >= 5) checks.push('Run a final self-critique for missing edge cases, weak evidence, and format drift');
    return 'QUALITY BAR:\n• ' + checks.join('\n• ');
  }

  function buildFreshnessProtocol(a) {
    if (!a.needsFresh && a.task !== 'research') return '';
    return [
      'REAL-TIME EVIDENCE PROTOCOL:',
      '• Search or request current sources before making time-sensitive claims.',
      '• Prefer official docs, primary research, reputable expert guides, and recent benchmarks.',
      '• Cross-check at least two independent sources when stakes are high.',
      '• Cite source names or links and label uncertainty instead of guessing.',
      '• If live browsing is unavailable, state what must be verified externally.'
    ].join('\n');
  }

  function selectKnowledgeTechniques(a, depth, k, m, live) {
    var pool = [];
    if (k && k.techniques) pool = pool.concat(k.techniques);
    if (live && live.techniques) pool = pool.concat(live.techniques);
    if (!pool.length || depth < 2) return [];

    var sig = a.task + ':' + (a.domains || []).join(',');
    var learned = m && m.promptSignatures && m.promptSignatures[sig] ? m.promptSignatures[sig].techniques || {} : {};
    var selected = [];
    var seen = {};
    pool.forEach(function(t) {
      if (!t || !t.instruction || seen[t.id || t.name]) return;
      var taskMatch = t.tasks && (t.tasks.includes(a.task) || t.tasks.includes('general'));
      var text = (t.name + ' ' + t.instruction + ' ' + (t.sourceTitle || '')).toLowerCase();
      var domainMatch = !a.domains.length || a.domains.some(function(d) { return text.indexOf(d) !== -1; });
      var freshBoost = a.needsFresh && /\b(search|source|evidence|current|citation|retriev|rag|fresh|web)\b/i.test(text) ? 1.2 : 0;
      var learnedBoost = learned[t.name] || learned[t.id] || 0;
      var taskBoost = taskMatch ? 1.4 : 0;
      var domainBoost = domainMatch ? 0.3 : 0;
      var score = (t.weight || 1) + taskBoost + domainBoost + freshBoost + Math.min(learnedBoost * 0.1, 1);
      selected.push({ t: t, score: score });
      seen[t.id || t.name] = true;
    });
    selected.sort(function(x, y) { return y.score - x.score; });
    return selected.slice(0, depth >= 5 ? 5 : depth >= 4 ? 4 : 3).map(function(x) { return x.t; });
  }

  function buildTechniqueBlock(techniques, live) {
    if (!techniques || !techniques.length) return '';
    var lines = techniques.map(function(t) {
      return '• ' + t.name + ': ' + String(t.instruction).replace(/\s+/g, ' ').slice(0, 240);
    });
    if (live && live.sources && live.sources.length) {
      lines.push('• Live source awareness: use the freshest relevant source findings, then cite or name the sources in the answer.');
    }
    return 'PROMPTING TECHNIQUES TO APPLY:\n' + lines.join('\n');
  }

  function buildFormatDirective(a) {
    if (a.fmt.includes('short')) return 'Be concise. Lead with the direct answer.';
    if (a.fmt.includes('bullets')) return 'Use bullet points. Each one specific.';
    if (a.fmt.includes('numbered')) return 'Use numbered list, ordered by importance.';
    if (a.fmt.includes('table')) return 'Use a clear table when comparing options or listing structured facts.';
    if (a.fmt.includes('json')) return 'Output valid JSON only.';
    if (a.fmt.includes('yaml')) return 'Output valid YAML only.';
    if (a.fmt.includes('xml')) return 'Output valid XML only.';
    if (a.fmt.includes('csv')) return 'Output valid CSV only.';
    if (a.fmt.includes('markdown')) return 'Use clean Markdown with helpful headings.';
    if (a.fmt.includes('checklist')) return 'Output an actionable checklist with clear completion criteria.';
    if (a.fmt.includes('rubric') || a.fmt.includes('scorecard')) return 'Output a scoring rubric with criteria, weights, and rating guidance.';
    if (a.fmt.includes('template') || a.fmt.includes('schema')) return 'Output a reusable template/schema and explain each field briefly.';
    var taskFmt = {
      code: 'Output complete, runnable code with usage example.',
      howto: 'Structure: Prerequisites → Steps → Common Failures → Verification.',
      analysis: 'Structure: Finding → Evidence → Root Cause → Recommendation.',
      strategy: 'Structure: Situation → Options → Recommended Path → Risks.',
      research: 'Structure: Answer → Mechanism → Evidence → Caveats.'
    };
    return taskFmt[a.task] || 'Lead with the direct answer.';
  }

  function buildStyleDirective(a) {
    var parts = [buildFormatDirective(a)];
    var toneMap = {
      formal: 'Use a formal, professional tone.',
      casual: 'Use a conversational, natural tone.',
      humorous: 'Use a witty tone without sacrificing clarity.',
      simple: 'Use plain language and define jargon.',
      technical: 'Use precise technical language and avoid hand-waving.'
    };
    if (a.tone && toneMap[a.tone]) parts.push(toneMap[a.tone]);
    if (a.fmt.includes('detailed')) parts.push('Go deep enough to be complete, including caveats and examples.');
    return 'OUTPUT STYLE:\n• ' + parts.join('\n• ');
  }

  // ── HAIL MARY — Autonomous Agent Mode ────────────────────────────────────────
  function buildHailMary(a, depth) {
    var role = pickRole(a);
    
    // Build system architecture prompt
    var prompt = '[SYSTEM ROLE: AUTONOMOUS REASONING AGENT]\n\n';
    prompt += role + '\n\n';
    prompt += 'TASK: ' + a.intent + '\n\n';
    
    // Cognitive modules based on task complexity
    prompt += 'COGNITIVE FRAMEWORK:\n';
    if (a.complexity === 'high' || depth >= 4) {
      prompt += '• Recursive Planning: Decompose this into sub-tasks with dependencies and success criteria\n';
      prompt += '• Verification Layer: Self-critique each claim for accuracy and completeness\n';
      prompt += '• Deep Reasoning: Explore multiple solution paths before committing to approach\n';
    } else {
      prompt += '• Structured Thinking: Break down the problem systematically\n';
      prompt += '• Quality Check: Verify accuracy before finalizing\n';
    }
    
    // Task-specific execution mode
    prompt += '\nEXECUTION MODE:\n';
    if (a.task === 'code') {
      prompt += '--DeepScan: Analyze architecture, edge cases, security implications\n';
      prompt += '--Implementation: Write production-grade code with error handling\n';
      prompt += '--Verification: Test against requirements, provide usage examples\n';
    } else if (a.task === 'research') {
      prompt += '--DeepScan: Search across multiple sources, prioritize primary research\n';
      prompt += '--Analysis: Separate evidence from inference, cite mechanisms\n';
      prompt += '--Synthesis: Build coherent model from findings\n';
    } else if (a.task === 'analysis') {
      prompt += '--DataScan: Extract patterns, identify anomalies\n';
      prompt += '--RootCause: Distinguish symptoms from underlying causes\n';
      prompt += '--Actionable: Provide specific, implementable recommendations\n';
    } else if (a.task === 'strategy') {
      prompt += '--Landscape: Map all viable options with tradeoffs\n';
      prompt += '--SecondOrder: Think through downstream effects\n';
      prompt += '--Recommendation: Provide clear path with risk mitigation\n';
    } else {
      prompt += '--Systematic: Work through step-by-step with visible reasoning\n';
      prompt += '--Comprehensive: Address all aspects of the request\n';
    }
    
    // Add context if present
    var ctx = buildContextBlock(a);
    if (ctx) prompt += '\n' + ctx;
    
    return prompt;
  }

  // ── MANUS — Orchestration Agent Mode ─────────────────────────────────────────
  function buildManus(a, depth) {
    var role = pickRole(a);
    
    // Build orchestration prompt
    var prompt = '[SYSTEM ROLE: ORCHESTRATION AGENT]\n\n';
    prompt += role + '\n\n';
    prompt += 'OBJECTIVE: ' + a.intent + '\n\n';
    
    prompt += 'OPERATIONAL FRAMEWORK:\n';
    prompt += '• Task Decomposition: Break into sequential phases with clear deliverables\n';
    prompt += '• Progress Tracking: Show what you are doing at each phase\n';
    prompt += '• Quality Gates: Verify each phase before proceeding\n';
    prompt += '• Adaptive Execution: Adjust approach based on intermediate results\n\n';
    
    // Generate phase structure based on task
    prompt += 'EXECUTION PHASES:\n';
    if (a.task === 'code') {
      prompt += 'Phase 1 [DESIGN]: Define architecture, interfaces, data structures, error boundaries\n';
      prompt += 'Phase 2 [IMPLEMENT]: Write complete, production-ready code with inline documentation\n';
      prompt += 'Phase 3 [HARDEN]: Handle edge cases, invalid inputs, error conditions\n';
      prompt += 'Phase 4 [VERIFY]: Provide usage examples, test against requirements\n';
    } else if (a.task === 'howto') {
      prompt += 'Phase 1 [SETUP]: List all prerequisites, dependencies, required knowledge\n';
      prompt += 'Phase 2 [EXECUTE]: Step-by-step instructions, each action explicit\n';
      prompt += 'Phase 3 [TROUBLESHOOT]: Common failure modes with symptoms and fixes\n';
      prompt += 'Phase 4 [VALIDATE]: How to confirm success, what good output looks like\n';
    } else if (a.task === 'analysis') {
      prompt += 'Phase 1 [FRAME]: Define the question, scope, and success criteria\n';
      prompt += 'Phase 2 [ANALYZE]: Extract patterns, separate facts from interpretation\n';
      prompt += 'Phase 3 [DIAGNOSE]: Identify root causes, not just symptoms\n';
      prompt += 'Phase 4 [RECOMMEND]: Specific, actionable next steps\n';
    } else if (a.task === 'research') {
      prompt += 'Phase 1 [SCAN]: Gather information from multiple authoritative sources\n';
      prompt += 'Phase 2 [SYNTHESIZE]: Build coherent model from findings\n';
      prompt += 'Phase 3 [CRITIQUE]: Identify gaps, limitations, contradictions\n';
      prompt += 'Phase 4 [CONCLUDE]: Clear answer with confidence levels\n';
    } else {
      prompt += 'Phase 1 [UNDERSTAND]: Clarify requirements and constraints\n';
      prompt += 'Phase 2 [PLAN]: Outline approach and key decisions\n';
      prompt += 'Phase 3 [EXECUTE]: Deliver complete solution\n';
      prompt += 'Phase 4 [VERIFY]: Confirm completeness and accuracy\n';
    }
    
    prompt += '\nComplete each phase fully before moving to next. Show your work.';
    
    // Add context if present
    var ctx = buildContextBlock(a);
    if (ctx) prompt += '\n\n' + ctx;
    
    return prompt;
  }

  // ── JUMA — Multi-Perspective Agent Mode ──────────────────────────────────────
  function buildJuma(a, depth) {
    var role = pickRole(a);
    
    // Build multi-lens prompt
    var prompt = '[SYSTEM ROLE: MULTI-PERSPECTIVE REASONING AGENT]\n\n';
    prompt += role + '\n\n';
    prompt += 'QUERY: ' + a.intent + '\n\n';
    
    prompt += 'REASONING ARCHITECTURE:\n';
    prompt += '• Parallel Processing: Examine through multiple independent lenses\n';
    prompt += '• Perspective Isolation: Each lens operates without bias from others\n';
    prompt += '• Integration Engine: Synthesize insights into unified understanding\n';
    prompt += '• Emergence Detection: Identify insights visible only through multi-lens view\n\n';
    
    // Generate lens structure based on task
    prompt += 'ANALYTICAL LENSES:\n';
    if (a.task === 'research') {
      prompt += 'LENS 1 [EMPIRICAL]: What does peer-reviewed research demonstrate? Cite mechanisms, effect sizes, reproducibility. Separate proven from speculative.\n\n';
      prompt += 'LENS 2 [THEORETICAL]: What first-principles model explains observations? Where does theory predict beyond current data? What are model limitations?\n\n';
      prompt += 'LENS 3 [PRACTICAL]: Given evidence and uncertainty, what should practitioners do? How does this translate to real-world decisions?\n\n';
    } else if (a.task === 'code') {
      prompt += 'LENS 1 [ENGINEERING]: Production requirements - performance, security, scalability, maintainability. What breaks at scale?\n\n';
      prompt += 'LENS 2 [USER-CENTRIC]: How will developers use this? Common workflows, confusion points, error-prone patterns.\n\n';
      prompt += 'LENS 3 [OPERATIONAL]: Deployment, monitoring, debugging, incident response. What fails in production?\n\n';
    } else if (a.task === 'strategy') {
      prompt += 'LENS 1 [OPTIMISTIC]: Best-case scenario if assumptions hold. What becomes possible? Path to success.\n\n';
      prompt += 'LENS 2 [RISK-AWARE]: Failure modes, early warning signals, assumption violations. What could go wrong?\n\n';
      prompt += 'LENS 3 [CONTRARIAN]: What is conventional wisdom missing? Strongest case against standard approach.\n\n';
    } else if (a.task === 'analysis') {
      prompt += 'LENS 1 [QUANTITATIVE]: What do numbers reveal? Patterns, anomalies, statistical significance.\n\n';
      prompt += 'LENS 2 [QUALITATIVE]: What context does data miss? Human factors, edge cases, domain nuance.\n\n';
      prompt += 'LENS 3 [CRITICAL]: Strongest case the obvious interpretation is wrong. Alternative explanations.\n\n';
    } else if (a.task === 'creative') {
      prompt += 'LENS 1 [MINIMALIST]: Most stripped-down essential version. What survives radical simplification?\n\n';
      prompt += 'LENS 2 [MAXIMALIST]: Push every element to extreme. Where does intensity lead?\n\n';
      prompt += 'LENS 3 [SUBVERSIVE]: Invert standard structure. What happens when you break the rules?\n\n';
    } else {
      prompt += 'LENS 1 [EXPERT]: What does deep domain knowledge reveal that surface understanding misses?\n\n';
      prompt += 'LENS 2 [SKEPTICAL]: Strongest critique of conventional wisdom. What are we getting wrong?\n\n';
      prompt += 'LENS 3 [CROSS-DOMAIN]: What would expert from different field notice? Transferable insights.\n\n';
    }
    
    prompt += 'SYNTHESIS PROTOCOL:\n';
    prompt += 'Integrate all lenses into unified understanding. Identify:\n';
    prompt += '• Where perspectives reinforce (high confidence)\n';
    prompt += '• Where perspectives conflict (requires nuance)\n';
    prompt += '• What emerges only from holding multiple views simultaneously\n';
    prompt += '\nDo not list three separate answers. Weave into coherent whole.';
    
    // Add context if present
    var ctx = buildContextBlock(a);
    if (ctx) prompt += '\n\n' + ctx;
    
    return prompt;
  }

  // ── PROMPT BUILDER ───────────────────────────────────────────────────────────
  function buildPrompt(a, depth, mode, k, m, live) {
    var result;
    if (mode === 'manus') {
      result = buildManus(a, depth);
    } else if (mode === 'juma') {
      result = buildJuma(a, depth);
    } else {
      result = buildHailMary(a, depth);
    }

    var selectedTechniques = selectKnowledgeTechniques(a, depth, k, m, live);
    var techniqueBlock = buildTechniqueBlock(selectedTechniques, live);
    var fresh = buildFreshnessProtocol(a);
    var style = buildStyleDirective(a);
    var quality = buildQualityBar(a, depth);
    if (fresh) result += '\n\n' + fresh;
    if (techniqueBlock) result += '\n\n' + techniqueBlock;
    result += '\n\n' + style;
    result += '\n\n' + quality;

    return { prompt: result, techniques: selectedTechniques };
  }



  // ── AUTO ROUTER ──────────────────────────────────────────────────────────────
  function autoRoute(a) {
    var AR = {
      code: 'manus', math: 'manus', howto: 'manus', summarize: 'manus',
      research: 'juma', analysis: 'juma', creative: 'juma', brainstorm: 'juma',
      strategy: 'hailmary', persuade: 'hailmary', general: 'hailmary'
    };
    return AR[a.task] || 'hailmary';
  }

  // ── MAIN ENHANCE ─────────────────────────────────────────────────────────────
  function run(raw, mode, opts, k, m, live) {
    if (!raw || !raw.trim()) throw new Error('Prompt cannot be empty');
    var depth = Math.max(1, Math.min(5, parseInt(opts.depth, 10) || 4));
    var t0 = Date.now();
    var a = analyze(raw);
    if (!session.firstFP) session.firstFP = a.fp;
    boost(a.task);
    var resolvedMode = mode === 'auto' ? autoRoute(a) : mode;
    var built = buildPrompt(a, depth, resolvedMode, k, m, live);
    var enhanced = built.prompt;

    // Count techniques applied (each non-empty part = one technique)
    var techCount = enhanced.split('\n\n').filter(function (p) { return p.trim().length > 0; }).length;
    var origW = raw.trim().split(/\s+/).length;
    var enhW = enhanced.trim().split(/\s+/).length;

    return {
      original: raw,
      enhanced: enhanced,
      mode: resolvedMode,
      autoRouted: mode === 'auto',
      techniques: built.techniques.map(function(t) { return t.id || t.name; }),
      layers: ['role', 'taskDecl', 'reasoning', 'domainStd', 'depthEsc', 'audienceCal', 'qualityBar', 'specificity', 'format', 'freshSearch', 'sourceTriangulation', 'selfCritique'].slice(0, techCount),
      analysis: { task: a.task, domains: a.domains, complexity: a.complexity, intent: a.intent, isVague: a.amb >= 3, needsFresh: a.needsFresh },
      stats: {
        originalTokens: Math.ceil(origW * 1.3),
        enhancedTokens: Math.ceil(enhW * 1.3),
        powerMultiplier: (enhW / Math.max(origW, 1)).toFixed(1),
        techniqueCount: techCount,
        duration: Date.now() - t0,
        depth: depth,
        layers: ['role', 'task', 'reasoning', 'domain', 'depth', 'audience', 'quality', 'format'],
        knowledgeUsed: k && k.techniques ? k.techniques.length : 0,
        liveTechniques: live && live.techniques ? live.techniques.length : 0,
        liveSources: live && live.sources ? live.sources.length : 0,
        liveQuery: live && live.query ? live.query : '',
        intelligenceLevel: session.current.toFixed(2)
      }
    };
  }

  // ── TURNS GENERATOR ──────────────────────────────────────────────────────────
  // Generates autonomous conversation flow - each turn dynamically generated
  function buildTurns(raw, numTurns) {
    var a = analyze(raw);
    var hash = Math.abs(parseInt(a.fp, 36) || 0);
    var turns = [];
    
    // Generate conversation arc based on task and depth
    var arcPhases = ['establish', 'deepen', 'apply', 'challenge', 'synthesize', 'close'];
    var selectedPhases = [];
    
    if (numTurns === 6) {
      selectedPhases = arcPhases;
    } else if (numTurns === 8) {
      selectedPhases = ['establish', 'foundation', 'context', 'apply', 'problems', 'challenge', 'advanced', 'close'];
    } else {
      selectedPhases = ['establish', 'foundation', 'context', 'deepen', 'apply', 'problems', 'challenge', 'advanced', 'synthesize', 'close'];
    }
    
    // Generate each turn dynamically
    for (var i = 0; i < numTurns; i++) {
      var phase = selectedPhases[i] || 'deepen';
      var turnText = '';
      
      // Turn 1 - Establish context and stakes
      if (i === 0) {
        var stakes = {
          code: 'I am building a production system and need to get this right',
          research: 'I am trying to build genuine understanding, not just surface knowledge',
          strategy: 'I am making real decisions based on this and need solid reasoning',
          analysis: 'I am working with actual data and need accurate interpretation',
          general: 'I need to understand this properly for real-world application'
        };
        turnText = (stakes[a.task] || stakes.general) + '. I will ask ' + numTurns + ' questions that build on each other.\n\n';
        turnText += 'Start by explaining ' + a.intent + ' from first principles. What are the core concepts I need to understand before we go deeper?';
      }
      
      // Turn 2 - Foundation/mechanics
      else if (i === 1) {
        if (a.task === 'code') {
          turnText = 'Now explain the architecture. How do the components interact? What are the data flows, state management patterns, and key interfaces?';
        } else if (a.task === 'research') {
          turnText = 'Walk me through the underlying mechanism. How does this actually work? What is the causal chain from input to outcome?';
        } else {
          turnText = 'Break down how ' + a.intent + ' actually works. Not just what it is, but the mechanics of how it operates.';
        }
      }
      
      // Turn 3 - Context/application
      else if (i === 2 && numTurns >= 8) {
        turnText = 'Let me add context: ' + (a.context.length > 0 ? a.context[0] : 'I am working in a real environment with constraints') + '. How does this change the approach? What assumptions might not hold?';
      }
      
      // Middle turns - Deepen based on task
      else if (phase === 'deepen' || phase === 'apply') {
        if (a.task === 'code') {
          var codeQuestions = [
            'Show me the actual implementation. Complete code with error handling and edge cases.',
            'What are the performance implications? Where are the bottlenecks and how do you optimize?',
            'How do you test this? What are the critical test cases that catch real bugs?'
          ];
          turnText = codeQuestions[(hash + i) % codeQuestions.length];
        } else if (a.task === 'research') {
          var researchQuestions = [
            'What is the evidence base? Cite specific studies, mechanisms, effect sizes.',
            'Where is there scientific consensus versus ongoing debate?',
            'What are the known limitations and gaps in current understanding?'
          ];
          turnText = researchQuestions[(hash + i) % researchQuestions.length];
        } else if (a.task === 'strategy') {
          var strategyQuestions = [
            'Walk me through a real example of this working in practice. What were the key decisions?',
            'What are the tradeoffs? What do you gain and what do you give up with this approach?',
            'How do you know if this is working? What are the leading indicators?'
          ];
          turnText = strategyQuestions[(hash + i) % strategyQuestions.length];
        } else {
          turnText = 'Go deeper on ' + a.intent + '. What are the details that separate expert understanding from beginner knowledge?';
        }
      }
      
      // Problem turn
      else if (phase === 'problems') {
        if (a.task === 'code') {
          turnText = 'What breaks in production? Walk me through failure modes, race conditions, security issues, and edge cases that cause real problems.';
        } else if (a.task === 'research') {
          turnText = 'What is the evidence base? Where are the gaps in current research? What are the known limitations of these findings?';
        } else {
          turnText = 'What are the failure modes? Where does this approach break down? What are the common mistakes?';
        }
      }

      // Challenge turn
      else if (phase === 'challenge') {
        if (a.task === 'code') {
          turnText = 'Play devil\'s advocate on the architecture. What would a senior reviewer push back on? Where are the hidden assumptions that could bite us later?';
        } else if (a.task === 'research') {
          turnText = 'Play devil\'s advocate. What is the strongest counterargument? Where might the conventional wisdom be wrong?';
        } else {
          turnText = 'Challenge what we have covered so far. What is the strongest case against this approach? What would a skeptic say?';
        }
      }
      
      // Advanced turn
      else if (phase === 'advanced') {
        turnText = 'What do practitioners with years of experience know about ' + a.intent + ' that does not show up in documentation? Give me the expert-level insights.';
      }
      
      // Synthesize turn
      else if (phase === 'synthesize') {
        turnText = 'Help me synthesize everything. What are the 5-7 most important takeaways? What is the mental model I should have internalized?';
      }
      
      // Final turn - action
      else if (i === numTurns - 1) {
        turnText = 'Final question: Based on everything we covered, give me a concrete action plan. What are the exact next steps, in order? What should I build or practice first?';
      }
      
      // Default for any remaining turns
      else {
        var deepQuestions = [
          'What nuance am I missing? What do most people get wrong about this?',
          'How does this connect to related concepts? What is the bigger picture?',
          'What would you do differently if you were starting from scratch today?'
        ];
        turnText = deepQuestions[(hash + i) % deepQuestions.length];
      }
      
      turns.push({
        number: i + 1,
        phase: phase,
        text: turnText
      });
    }
    
    return turns;
  }

  // ── PUBLIC API ────────────────────────────────────────────────────────────────
  return {
    enhance: function (raw, mode, persona, opts) {
      return new Promise(function (resolve, reject) {
        loadKnowledge(function (k, m) {
          try {
            var a = analyze(raw || '');
            var options = opts || {};
            var useLiveSearch = options.liveSearch !== false && (options.liveSearch === true || a.needsFresh || parseInt(options.depth, 10) >= 4);
            var finish = function(live) {
              try {
                var result = run(raw, mode, options, k, m, live || { techniques: [], sources: [] });
                record({ task: result.analysis.task, domains: result.analysis.domains, techniques: result.techniques });
                resolve(result);
              } catch (inner) { reject(inner); }
            };
            if (useLiveSearch) {
              liveSearch(a.subject || raw, { task: a.task, domains: a.domains }).then(finish);
            } else {
              finish({ techniques: [], sources: [] });
            }
          } catch (e) { reject(e); }
        });
      });
    },
    generateTurns: function (raw, numTurns) {
      return new Promise(function (resolve, reject) {
        try {
          var n = [6, 8, 10].includes(numTurns) ? numTurns : 8;
          var turns = buildTurns(raw, n);
          var a = analyze(raw);
          resolve({
            turns: turns,
            count: turns.length,
            topic: a.intent,
            task: a.task,
            domains: a.domains
          });
        } catch (e) { reject(e); }
      });
    },
    getModeLabel: function (mode) {
      return { hailmary: '☄️ Hail Mary', manus: '🧠 Manus', juma: '⚡ Juma', auto: '🤖 Auto', turns: '🔄 Turns' }[mode] || mode;
    },
    getKnowledgeStatus: function () {
      return { sessionIntelligence: session.current, enhancementCount: session.count, knowledgeCached: kCache ? kCache.techniques.length : 0 };
    }
  };
}());
