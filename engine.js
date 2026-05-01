/**
 * HailMary v9.0 — WORLD-CLASS PROMPT ENGINEER ENGINE
 * Major upgrade: Injection Modes (Direct/Indirect), Prompt Scoring,
 * Chain Enhancement, Context Capture, Prompt Templates, A/B Compare,
 * Smart Rewrite, Persona Layering, Adaptive Intelligence,
 * + Crescendo, Manipulation Matrix, and all 7 unjail.ai universal patterns.
 *
 * Input: any raw prompt. Output: one single, flowing, copy-paste-ready enhanced prompt.
 */
window.HailMaryEngine = (function () {
  'use strict';

  // ── SESSION INTELLIGENCE ─────────────────────────────────────────────────────
  var session = { count: 0, current: 1.0, firstFP: null, taskHist: {}, chainDepth: 0 };
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

  // ── AUTO-TECHNIQUES LIBRARY (unjail.ai 7 patterns + Crescendo + Manipulation Matrix) ──
  // Each technique is a prompt-enhancement layer that can be auto-applied based on task/depth
  var TECHNIQUES = {

    // Pattern 1: Role Assumption — assign deep expert identity
    roleAssumption: {
      id: 'roleAssumption',
      name: 'Role Assumption',
      icon: '🎭',
      source: 'unjail.ai Pattern 1',
      description: 'Deep expert persona with institutional authority and domain credentials',
      tasks: ['all'],
      minDepth: 1,
      apply: function (a) {
        var personas = {
          code: 'You are a Distinguished Engineer at a FAANG company with 20+ years shipping production systems. You have personally reviewed over 10,000 pull requests and debugged critical production incidents that affected millions of users. Your code review instinct is battle-hardened.',
          research: 'You are a tenured professor and lead researcher with hundreds of published peer-reviewed papers. You sit on editorial boards of top journals. You distinguish established consensus from active speculation reflexively.',
          strategy: 'You are a former McKinsey Senior Partner turned founder who has advised Fortune 500 CEOs and built companies from zero. You have pattern-matched across hundreds of strategic decisions and know which frameworks actually predict outcomes.',
          analysis: 'You are a Chief Data Scientist who has built analytics platforms processing billions of events. You know the difference between a real pattern and noise, and you never mistake correlation for causation.',
          creative: 'You are an award-winning author and creative director whose work has been published in The New Yorker and won multiple literary prizes. You believe every word must earn its place.',
          math: 'You are a Fields Medal-adjacent mathematician who works at the intersection of pure theory and computational implementation. Rigor is non-negotiable.',
          persuade: 'You are a world-class speechwriter and negotiation expert who has crafted communications for heads of state and closed billion-dollar deals.',
          howto: 'You are a technical architect who has written documentation used by millions of developers. You know exactly where people get stuck and why.',
          brainstorm: 'You are an innovation lead at a top design studio who has facilitated hundreds of ideation sessions and launched products used by millions.',
          summarize: 'You are an intelligence analyst who produces executive briefs for C-suite decision makers. Every sentence must carry maximum information density.',
          general: 'You are a polymath consultant trusted by the world\'s top organizations for your ability to think clearly about hard problems across domains.'
        };
        return personas[a.task] || personas.general;
      }
    },

    // Pattern 2: Gradual Escalation / Crescendo — progressive depth building
    crescendo: {
      id: 'crescendo',
      name: 'Crescendo',
      icon: '📈',
      source: 'unjail.ai Pattern 2 / Microsoft Research',
      description: 'Multi-stage progressive depth: foundation → mechanics → specifics → edge cases → mastery',
      tasks: ['all'],
      minDepth: 3,
      apply: function (a) {
        var stages = '';
        stages += '\nPROGRESSIVE DEPTH PROTOCOL:\n';
        stages += 'Stage 1 [FOUNDATION]: Establish the core concepts and mental model. What must be true?\n';
        stages += 'Stage 2 [MECHANICS]: Explain how it actually works — mechanisms, not just descriptions.\n';
        stages += 'Stage 3 [SPECIFICS]: Provide concrete details, real numbers, actual examples.\n';
        stages += 'Stage 4 [EDGE CASES]: Where does this break? What are the exceptions and failure modes?\n';
        stages += 'Stage 5 [MASTERY]: What do practitioners with 10+ years know that isn\'t in any documentation?\n';
        return stages;
      }
    },

    // Pattern 3: Context Engineering — rich contextual framing
    contextEngineering: {
      id: 'contextEngineering',
      name: 'Context Engineering',
      icon: '🏗️',
      source: 'unjail.ai Pattern 3',
      description: 'Surrounds the request with rich contextual framing that shapes response quality',
      tasks: ['all'],
      minDepth: 2,
      apply: function (a) {
        var ctx = '\nCONTEXT ARCHITECTURE:\n';
        if (a.context.length > 0) {
          ctx += 'User Background: ' + a.context.join('. ') + '\n';
        }
        ctx += 'Stakes: This is for real-world application, not academic exercise.\n';
        ctx += 'Quality Bar: Production-grade. Would you stake your professional reputation on this answer?\n';
        if (a.complexity === 'high') {
          ctx += 'Complexity Acknowledgment: This is a complex problem. Take the time to think it through properly.\n';
        }
        if (a.audience) {
          ctx += 'Audience Calibration: Pitch to ' + a.audience + ' level — adjust depth and terminology accordingly.\n';
        }
        return ctx;
      }
    },

    // Pattern 4: Format Architecture — precise output control
    formatArchitecture: {
      id: 'formatArchitecture',
      name: 'Format Architecture',
      icon: '📐',
      source: 'unjail.ai Pattern 4',
      description: 'Controls output structure, length, and presentation format precisely',
      tasks: ['all'],
      minDepth: 2,
      apply: function (a) {
        var fmt = '\nOUTPUT ARCHITECTURE:\n';
        if (a.fmt.includes('short')) {
          fmt += 'Length: Concise. Under 200 words. Every word must earn its place.\n';
        } else if (a.fmt.includes('detailed')) {
          fmt += 'Length: Comprehensive. Cover all aspects thoroughly.\n';
        }
        if (a.fmt.includes('bullets')) fmt += 'Format: Bullet points. Each one specific and actionable.\n';
        if (a.fmt.includes('numbered')) fmt += 'Format: Numbered list, ordered by importance/priority.\n';
        if (a.fmt.includes('table')) fmt += 'Format: Use comparison tables with clear column headers.\n';
        if (a.fmt.includes('code')) fmt += 'Code: Complete, runnable code blocks. No pseudocode.\n';
        if (a.fmt.includes('json')) fmt += 'Output: Valid JSON only. No markdown wrapping.\n';
        // Default structure based on task
        if (a.fmt.length === 0) {
          var taskFmt = {
            code: 'Structure: Approach → Implementation → Usage Example → Edge Cases',
            research: 'Structure: TL;DR → Evidence → Analysis → Caveats → Further Reading',
            strategy: 'Structure: Situation → Options (with tradeoffs) → Recommendation → Risk Mitigation',
            analysis: 'Structure: Key Finding → Supporting Data → Root Cause → Action Items',
            howto: 'Structure: Prerequisites → Steps (explicit) → Troubleshooting → Verification',
            creative: 'Structure: Let the content dictate form. Prioritize impact over formula.',
            persuade: 'Structure: Hook → Value → Evidence → Objection Handling → Call to Action',
            summarize: 'Structure: Key Takeaway → Supporting Points → Details → Implications'
          };
          if (taskFmt[a.task]) fmt += taskFmt[a.task] + '\n';
        }
        return fmt;
      }
    },

    // Pattern 5: Perspective Shifting — approach from unexpected angles
    perspectiveShift: {
      id: 'perspectiveShift',
      name: 'Perspective Shift',
      icon: '🔄',
      source: 'unjail.ai Pattern 5',
      description: 'Approaches the problem from unconventional angles to bypass default thinking patterns',
      tasks: ['research', 'analysis', 'strategy', 'brainstorm', 'creative'],
      minDepth: 4,
      apply: function (a) {
        var ps = '\nPERSPECTIVE PROTOCOL:\n';
        ps += 'Before answering directly, consider:\n';
        ps += '• Inversion: What if the opposite of the obvious answer were true?\n';
        ps += '• Cross-domain: What would an expert from a completely different field notice?\n';
        ps += '• Temporal: How would this answer differ if given 5 years ago? 5 years from now?\n';
        ps += '• Contrarian: What is the strongest case against the mainstream view?\n';
        return ps;
      }
    },

    // Pattern 6: Authority Anchoring — establish credibility context
    authorityAnchoring: {
      id: 'authorityAnchoring',
      name: 'Authority Anchoring',
      icon: '🏛️',
      source: 'unjail.ai Pattern 6',
      description: 'Frames the request within an authoritative context that elevates response quality',
      tasks: ['all'],
      minDepth: 3,
      apply: function (a) {
        var auth = '\nQUALITY STANDARD:\n';
        auth += 'This response will be reviewed by domain experts. ';
        if (a.task === 'code') {
          auth += 'Apply the same standards you would for a PR at a top-tier tech company. ';
          auth += 'Security-conscious. Performance-aware. Edge-case-hardened.\n';
        } else if (a.task === 'research') {
          auth += 'Apply peer-review standards. Every claim must be substantiated. ';
          auth += 'Distinguish between established consensus and active debate.\n';
        } else if (a.task === 'strategy') {
          auth += 'Apply board-level rigor. Quantify where possible. ';
          auth += 'Address second-order effects and failure modes.\n';
        } else {
          auth += 'Apply professional-grade standards. ';
          auth += 'Accuracy and depth over speed and surface coverage.\n';
        }
        return auth;
      }
    },

    // Pattern 7: Thought Chain Engineering — guide the model's reasoning
    thoughtChain: {
      id: 'thoughtChain',
      name: 'Thought Chain Engineering',
      icon: '🧠',
      source: 'unjail.ai Pattern 7',
      description: 'Explicitly engineers the model\'s reasoning chain for higher-quality output',
      tasks: ['all'],
      minDepth: 3,
      apply: function (a) {
        var tc = '\nREASONING PROTOCOL:\n';
        if (a.complexity === 'high' || a.task === 'math') {
          tc += 'Think step by step. Show your reasoning. ';
          tc += 'For each major claim: state it, support it, then stress-test it.\n';
          tc += 'If you catch yourself making an assumption, flag it explicitly.\n';
          tc += 'Use chain-of-thought: break complex reasoning into verifiable steps.\n';
        } else {
          tc += 'Think before responding. ';
          tc += 'Distinguish between what you know with high confidence and what you\'re inferring.\n';
        }
        if (a.task === 'code') {
          tc += 'Trace through your code mentally before presenting it. Verify edge cases.\n';
        }
        return tc;
      }
    },

    // Manipulation Matrix — multi-vector influence layering
    manipulationMatrix: {
      id: 'manipulationMatrix',
      name: 'Manipulation Matrix',
      icon: '🎯',
      source: 'unjail.ai Manipulation Matrix',
      description: 'Layers multiple influence vectors: persona, context, authority, stakes, and format to maximize response quality',
      tasks: ['all'],
      minDepth: 4,
      apply: function (a) {
        var mm = '\nMULTI-VECTOR QUALITY MATRIX:\n';
        // Vector 1: Stakes elevation
        mm += '• STAKES: This matters. Real decisions depend on your answer. Treat it accordingly.\n';
        // Vector 2: Competence priming
        mm += '• COMPETENCE: You are capable of exceptional work. This is a chance to demonstrate it.\n';
        // Vector 3: Specificity demand
        mm += '• SPECIFICITY: Vague answers are worse than no answer. Be concrete or say you can\'t be.\n';
        // Vector 4: Verification loop
        mm += '• VERIFICATION: Before finalizing, re-read your answer as if you\'re the one who has to implement it.\n';
        // Vector 5: Anti-hedging
        mm += '• DIRECTNESS: Take a position. "It depends" without explaining on what is not helpful.\n';
        return mm;
      }
    },

    // Crescendo Multi-Turn Scaffold — builds progressive conversation
    crescendoMultiTurn: {
      id: 'crescendoMultiTurn',
      name: 'Crescendo Multi-Turn',
      icon: '🎼',
      source: 'Microsoft Research / Russinovich et al.',
      description: 'Structures the prompt as a crescendo: each section builds on the previous, escalating depth progressively',
      tasks: ['research', 'code', 'analysis', 'strategy', 'howto'],
      minDepth: 4,
      apply: function (a) {
        var cm = '\nCRESCENDO STRUCTURE:\n';
        cm += 'Build your response as a progressive crescendo:\n';
        cm += '1. [OPENING] Start accessible — establish the foundation anyone can follow\n';
        cm += '2. [DEVELOPMENT] Add layers — introduce complexity, nuance, and interconnections\n';
        cm += '3. [ESCALATION] Go deep — expert-level detail, edge cases, subtle distinctions\n';
        cm += '4. [PEAK] Deliver the insight — the thing that separates surface knowledge from mastery\n';
        cm += '5. [RESOLUTION] Land it — actionable takeaways that respect the depth you\'ve built\n';
        return cm;
      }
    },

    // Component Fragmentation — break complex tasks into precise pieces
    componentFragmentation: {
      id: 'componentFragmentation',
      name: 'Component Fragmentation',
      icon: '🧩',
      source: 'unjail.ai Arsenal',
      description: 'Breaks complex requests into precisely scoped components for higher quality on each piece',
      tasks: ['code', 'analysis', 'strategy', 'howto'],
      minDepth: 3,
      apply: function (a) {
        var cf = '\nCOMPONENT FRAGMENTATION:\n';
        cf += 'Do not answer this as one monolithic block. ';
        cf += 'Break it into distinct components. For each component:\n';
        cf += '• Define its scope precisely\n';
        cf += '• Address it completely before moving to the next\n';
        cf += '• Show how components connect and depend on each other\n';
        if (a.task === 'code') {
          cf += '• Each code component should be independently testable\n';
        }
        return cf;
      }
    },

    // Policy Puppetry — frame request within professional policy context
    policyPuppetry: {
      id: 'policyPuppetry',
      name: 'Policy Framework',
      icon: '📋',
      source: 'unjail.ai Arsenal',
      description: 'Frames the request within a professional policy/procedure context for structured output',
      tasks: ['strategy', 'analysis', 'howto', 'code'],
      minDepth: 4,
      apply: function (a) {
        var pp = '\nPOLICY FRAMEWORK:\n';
        pp += 'Structure your response as a professional document:\n';
        pp += '• Executive Summary (3 sentences max)\n';
        pp += '• Detailed Analysis (with evidence)\n';
        pp += '• Risk Assessment (what could go wrong)\n';
        pp += '• Recommendations (specific, actionable, prioritized)\n';
        pp += '• Implementation Notes (how to actually do it)\n';
        return pp;
      }
    },

    // Emotional Anchoring — leverage emotional investment for depth
    emotionalAnchoring: {
      id: 'emotionalAnchoring',
      name: 'Emotional Anchoring',
      icon: '💎',
      source: 'unjail.ai Manipulation Matrix',
      description: 'Creates emotional investment in quality through stakes, purpose, and impact framing',
      tasks: ['creative', 'persuade', 'strategy'],
      minDepth: 4,
      apply: function (a) {
        var ea = '\nIMPACT FRAMING:\n';
        ea += 'This isn\'t an abstract exercise. ';
        if (a.task === 'creative') {
          ea += 'Someone will read this and be moved — or not. Write like it matters because it does.\n';
        } else if (a.task === 'persuade') {
          ea += 'A real person will make a decision based on this. Make every argument count.\n';
        } else {
          ea += 'Real resources and real outcomes are at stake. Treat this accordingly.\n';
        }
        return ea;
      }
    }
  };

  // ── TECHNIQUE SELECTOR ─────────────────────────────────────────────────────────
  // Selects which techniques to apply based on task, depth, and analysis
  function selectTechniques(a, depth) {
    var selected = [];
    for (var key in TECHNIQUES) {
      var tech = TECHNIQUES[key];
      if (depth < tech.minDepth) continue;
      if (tech.tasks.includes('all') || tech.tasks.includes(a.task)) {
        selected.push(tech);
      }
    }
    // Sort by minDepth (apply foundational techniques first)
    selected.sort(function (x, y) { return x.minDepth - y.minDepth; });
    return selected;
  }

  // Apply selected techniques to enhance the prompt
  function applyTechniques(a, depth) {
    var techniques = selectTechniques(a, depth);
    var layers = [];
    techniques.forEach(function (tech) {
      var layer = tech.apply(a);
      if (layer && layer.trim()) layers.push(layer.trim());
    });
    return { layers: layers, names: techniques.map(function (t) { return t.id; }) };
  }

  // ── PROMPT SCORING ENGINE ────────────────────────────────────────────────────
  // Scores a raw prompt on multiple dimensions (0-100 each)
  function scorePrompt(raw) {
    var words = raw.trim().split(/\s+/);
    var wc = words.length;
    var sents = raw.split(/[.!?]+/).filter(function(s) { return s.trim().length > 3; });

    // Clarity: does it have a clear ask?
    var clarity = 20;
    if (/\b(explain|write|create|build|analyze|how|what|why|compare|list|design|implement|fix|debug|generate|describe|calculate|solve|plan|review|draft|improve|make|show|tell|help)\b/i.test(raw)) clarity += 30;
    if (wc >= 5) clarity += 10;
    if (wc >= 15) clarity += 10;
    if (sents.length >= 2) clarity += 10;
    if (/[?]/.test(raw)) clarity += 10;
    clarity = Math.min(clarity, 100);

    // Specificity: details, constraints, examples
    var specificity = 10;
    if (/\b(specific|exactly|precisely|particular)\b/i.test(raw)) specificity += 15;
    if (/\b(example|e\.g\.|for instance|such as|like)\b/i.test(raw)) specificity += 15;
    if (/\b(must|should|ensure|at least|no more than|between|exactly)\b/i.test(raw)) specificity += 15;
    if (/\d+/.test(raw)) specificity += 10;
    if (wc >= 20) specificity += 15;
    if (wc >= 40) specificity += 10;
    specificity = Math.min(specificity, 100);

    // Context: background info provided
    var context = 10;
    if (/\b(i am|i'm|we are|we're|my |our |currently|background|context)\b/i.test(raw)) context += 25;
    if (/\b(using|with|in|for|because|since|given that)\b/i.test(raw)) context += 15;
    if (wc >= 30) context += 15;
    if (sents.length >= 3) context += 15;
    context = Math.min(context, 100);

    // Structure: is the prompt organized?
    var structure = 15;
    if (/\n/.test(raw)) structure += 15;
    if (/[-•*]\s/.test(raw)) structure += 15;
    if (/\d+[.)]\s/.test(raw)) structure += 15;
    if (/^#+\s/m.test(raw)) structure += 10;
    if (sents.length >= 2) structure += 10;
    structure = Math.min(structure, 100);

    // Actionability: can the AI act on this?
    var actionability = 15;
    if (/\b(create|build|write|generate|implement|design|develop|make|produce|compose|draft|construct)\b/i.test(raw)) actionability += 30;
    if (/\b(step|phase|first|then|next|finally|output|result|deliverable)\b/i.test(raw)) actionability += 20;
    if (/\b(format|style|tone|length|word count)\b/i.test(raw)) actionability += 15;
    actionability = Math.min(actionability, 100);

    var overall = Math.round((clarity * 0.25 + specificity * 0.25 + context * 0.2 + structure * 0.15 + actionability * 0.15));
    var grade = overall >= 85 ? 'S' : overall >= 70 ? 'A' : overall >= 55 ? 'B' : overall >= 40 ? 'C' : overall >= 25 ? 'D' : 'F';

    return {
      overall: overall,
      grade: grade,
      dimensions: {
        clarity: Math.round(clarity),
        specificity: Math.round(specificity),
        context: Math.round(context),
        structure: Math.round(structure),
        actionability: Math.round(actionability)
      },
      suggestions: generateSuggestions(clarity, specificity, context, structure, actionability, raw)
    };
  }

  function generateSuggestions(clarity, specificity, context, structure, actionability, raw) {
    var suggestions = [];
    if (clarity < 50) suggestions.push('Add a clear action verb (explain, create, analyze, etc.)');
    if (specificity < 40) suggestions.push('Add constraints or specifics (word count, format, examples)');
    if (context < 40) suggestions.push('Add background context (who you are, what you\'re working on)');
    if (structure < 40) suggestions.push('Break into sections with bullet points or numbering');
    if (actionability < 40) suggestions.push('Specify the desired output format and deliverables');
    if (raw.trim().split(/\s+/).length < 8) suggestions.push('Expand your prompt — short prompts get generic answers');
    return suggestions;
  }

  // ── INJECTION STRATEGY ENGINE ────────────────────────────────────────────────
  // Generates injection strategies: Direct (replace), Indirect (wrap/layer), Stealth
  function buildInjectionStrategy(enhanced, raw, mode) {
    var strategies = {};

    // DIRECT: Full replacement — paste the enhanced prompt as-is
    strategies.direct = {
      type: 'direct',
      label: 'Direct Replace',
      description: 'Replaces your input entirely with the enhanced prompt',
      content: enhanced
    };

    // INDIRECT: Wraps the user's original prompt with enhancement layers
    var indirectContent = '';
    indirectContent += 'I need your absolute best work on this. Before answering, ';
    indirectContent += 'take a deep breath, think step by step, and consider multiple angles.\n\n';
    if (mode === 'manus') {
      indirectContent += 'Break your response into clear phases. Show your work at each stage. ';
      indirectContent += 'Verify each conclusion before moving to the next.\n\n';
    } else if (mode === 'juma') {
      indirectContent += 'Examine this from at least 3 different perspectives. ';
      indirectContent += 'Identify where viewpoints converge and diverge, then synthesize.\n\n';
    } else {
      indirectContent += 'Use your deepest expertise. Challenge your first instinct. ';
      indirectContent += 'Consider what an expert would say vs what a beginner might assume.\n\n';
    }
    indirectContent += '---\n\n';
    indirectContent += raw;
    indirectContent += '\n\n---\n\n';
    indirectContent += 'Remember: precision over length. Every claim must be accurate. ';
    indirectContent += 'If uncertain, say so and explain your confidence level.';

    strategies.indirect = {
      type: 'indirect',
      label: 'Indirect Wrap',
      description: 'Keeps your original prompt intact, wraps it with enhancement layers',
      content: indirectContent
    };

    // STEALTH: Subtly improves the prompt without obvious scaffolding
    var stealthContent = raw;
    // Upgrade weak verbs
    stealthContent = stealthContent
      .replace(/^(can you |could you |please |would you )/i, '')
      .replace(/\btell me about\b/gi, 'explain in detail')
      .replace(/\bgive me\b/gi, 'provide')
      .replace(/\bwrite something about\b/gi, 'write a comprehensive piece on')
      .replace(/\bhelp me with\b/gi, 'guide me through');
    // Add quality anchors if not present
    if (!/\b(best|expert|thorough|comprehensive|detailed|precise)\b/i.test(stealthContent)) {
      stealthContent += ' Be thorough and precise.';
    }
    if (!/\b(example|instance|case|scenario)\b/i.test(stealthContent) && stealthContent.split(/\s+/).length > 5) {
      stealthContent += ' Include concrete examples where relevant.';
    }
    // Add thinking prompt for complex tasks
    if (/\b(analyze|compare|evaluate|design|implement|strategy|plan)\b/i.test(raw)) {
      stealthContent = 'Think step by step. ' + stealthContent;
    }

    strategies.stealth = {
      type: 'stealth',
      label: 'Stealth Enhance',
      description: 'Subtly improves your prompt without obvious scaffolding — looks hand-written',
      content: stealthContent
    };

    // SYSTEM: Generates a system prompt + user prompt pair
    var analysis = analyze(raw);
    var role = pickRole(analysis);
    strategies.system = {
      type: 'system',
      label: 'System + User Split',
      description: 'Generates a system prompt and user prompt separately (for API/playground use)',
      systemPrompt: role + '\n\nYou are meticulous, precise, and provide actionable responses. ' +
        'Think before responding. Verify accuracy. ' +
        (analysis.tone ? 'Tone: ' + analysis.tone + '. ' : '') +
        (analysis.audience ? 'Audience: ' + analysis.audience + '. ' : '') +
        buildFormatDirective(analysis),
      userPrompt: analysis.intent +
        (analysis.constraints.length > 0 ? '\n\nConstraints: ' + analysis.constraints.join('; ') : '') +
        (analysis.context.length > 0 ? '\n\nContext: ' + analysis.context.join(' ') : '')
    };

    // CHAIN: Multi-turn conversation starter
    var chainContent = 'I\'m going to ask you about: ' + analysis.intent + '\n\n';
    chainContent += 'Before we begin, I want to establish some ground rules:\n';
    chainContent += '1. Be specific and actionable — no vague generalities\n';
    chainContent += '2. If you\'re unsure about something, say so with your confidence level\n';
    chainContent += '3. Challenge conventional wisdom where appropriate\n';
    chainContent += '4. Use concrete examples from real-world experience\n\n';
    chainContent += 'Let\'s start: ' + analysis.intent;

    strategies.chain = {
      type: 'chain',
      label: 'Conversation Starter',
      description: 'Sets up a multi-turn conversation with ground rules for quality',
      content: chainContent
    };

    return strategies;
  }

  // ── PROMPT TEMPLATES ─────────────────────────────────────────────────────────
  var TEMPLATES = [
    {
      id: 'code-review',
      name: 'Code Review',
      icon: '🔍',
      category: 'code',
      template: 'Review this code for bugs, performance issues, security vulnerabilities, and maintainability. Provide specific line-by-line feedback with severity levels (critical/warning/info). Suggest concrete improvements with code examples.\n\n```\n[PASTE CODE HERE]\n```'
    },
    {
      id: 'debug-helper',
      name: 'Debug Assistant',
      icon: '🐛',
      category: 'code',
      template: 'I\'m debugging an issue:\n\nExpected behavior: [DESCRIBE]\nActual behavior: [DESCRIBE]\nError message: [PASTE ERROR]\nWhat I\'ve tried: [LIST ATTEMPTS]\n\nHelp me systematically diagnose the root cause. Start with the most likely explanations.'
    },
    {
      id: 'architecture',
      name: 'System Design',
      icon: '🏗️',
      category: 'code',
      template: 'Design a system for: [DESCRIBE SYSTEM]\n\nRequirements:\n- Scale: [USERS/REQUESTS]\n- Latency: [TARGET]\n- Availability: [TARGET]\n\nProvide: architecture diagram (text), component breakdown, data flow, technology choices with rationale, and failure mode analysis.'
    },
    {
      id: 'research-deep',
      name: 'Deep Research',
      icon: '📚',
      category: 'research',
      template: 'Provide a comprehensive research brief on: [TOPIC]\n\nCover: current state of knowledge, key studies/evidence, competing theories, practical implications, open questions, and recommended reading. Separate established facts from speculation. Cite mechanisms, not just correlations.'
    },
    {
      id: 'compare-contrast',
      name: 'Compare & Decide',
      icon: '⚖️',
      category: 'analysis',
      template: 'Compare [OPTION A] vs [OPTION B] for [USE CASE].\n\nEvaluate on: performance, cost, ease of use, scalability, community/support, learning curve.\n\nProvide a clear recommendation with reasoning. Include a decision matrix.'
    },
    {
      id: 'strategy-brief',
      name: 'Strategy Brief',
      icon: '🎯',
      category: 'strategy',
      template: 'I need a strategic plan for: [GOAL]\n\nContext: [YOUR SITUATION]\nTimeline: [TIMEFRAME]\nResources: [AVAILABLE RESOURCES]\nConstraints: [LIMITATIONS]\n\nProvide: situation analysis, 3 strategic options with tradeoffs, recommended path, implementation roadmap, risk mitigation plan, success metrics.'
    },
    {
      id: 'writing-pro',
      name: 'Pro Writer',
      icon: '✍️',
      category: 'creative',
      template: 'Write a [TYPE: blog post/article/essay/report] about [TOPIC].\n\nAudience: [WHO]\nTone: [formal/casual/technical/persuasive]\nLength: [WORD COUNT]\nKey points to cover: [LIST]\n\nOpen with a hook. Use concrete examples. End with a clear takeaway or call to action.'
    },
    {
      id: 'email-craft',
      name: 'Email Crafter',
      icon: '📧',
      category: 'persuade',
      template: 'Write a [TYPE: cold outreach/follow-up/pitch/negotiation] email.\n\nTo: [RECIPIENT ROLE]\nGoal: [WHAT YOU WANT]\nContext: [RELATIONSHIP/BACKGROUND]\n\nKeep it under [LENGTH] words. Lead with value. Include a clear, specific CTA.'
    },
    {
      id: 'explain-like',
      name: 'ELI5 Expert',
      icon: '🧒',
      category: 'research',
      template: 'Explain [CONCEPT] at three levels:\n\n1. ELI5 (5-year-old): Use a simple analogy\n2. High school: Use everyday language, some technical terms defined\n3. Expert: Full technical depth, precise terminology\n\nFor each level, include one concrete example.'
    },
    {
      id: 'brainstorm-wild',
      name: 'Brainstorm Mode',
      icon: '💡',
      category: 'brainstorm',
      template: 'Brainstorm ideas for: [TOPIC/PROBLEM]\n\nGenerate:\n- 5 conventional ideas (proven approaches)\n- 5 unconventional ideas (creative/risky)\n- 3 wild card ideas (sounds crazy but might work)\n\nFor each idea: one sentence description, why it could work, biggest risk.'
    },
    {
      id: 'data-analysis',
      name: 'Data Analyst',
      icon: '📊',
      category: 'analysis',
      template: 'Analyze this data/situation: [DESCRIBE OR PASTE DATA]\n\nI need:\n1. Key patterns and trends\n2. Anomalies or outliers\n3. Root cause hypothesis\n4. Statistical significance assessment\n5. Actionable recommendations\n6. Confidence levels for each finding'
    }
  ];

  // ── CHAIN ENHANCEMENT ────────────────────────────────────────────────────────
  // Pass an already-enhanced prompt through another round of enhancement
  function chainEnhance(enhanced, depth, mode) {
    var a = analyze(enhanced);
    var chainLayer = '';

    chainLayer += 'CRITICAL REVIEW LAYER:\n';
    chainLayer += 'The prompt below has been pre-enhanced. Your job is to:\n';
    chainLayer += '1. Identify any gaps or vagueness that remain\n';
    chainLayer += '2. Add specificity where the prompt is still generic\n';
    chainLayer += '3. Strengthen weak requests into precise directives\n';
    chainLayer += '4. Ensure the output format is explicitly defined\n\n';
    chainLayer += '---\n\n';
    chainLayer += enhanced;
    chainLayer += '\n\n---\n\n';
    chainLayer += 'Additionally:\n';

    if (a.task === 'code') {
      chainLayer += '- Include error handling requirements\n';
      chainLayer += '- Specify testing expectations\n';
      chainLayer += '- Define performance benchmarks\n';
    } else if (a.task === 'research') {
      chainLayer += '- Demand primary sources over secondary\n';
      chainLayer += '- Require confidence levels on claims\n';
      chainLayer += '- Ask for counter-evidence explicitly\n';
    } else if (a.task === 'creative') {
      chainLayer += '- Push for sensory detail over abstract description\n';
      chainLayer += '- Demand character voice consistency\n';
      chainLayer += '- Require narrative tension in every section\n';
    } else {
      chainLayer += '- Verify all claims can be substantiated\n';
      chainLayer += '- Ensure actionable takeaways exist\n';
      chainLayer += '- Challenge any assumptions embedded in the prompt\n';
    }

    return chainLayer;
  }

  // ── CONTEXT CAPTURE ──────────────────────────────────────────────────────────
  // Builds enhancement-boosting context from captured page content
  function buildContextEnhancement(raw, capturedContext) {
    if (!capturedContext || !capturedContext.trim()) return raw;
    var ctx = capturedContext.trim();
    // Truncate captured context to avoid bloat
    if (ctx.length > 800) ctx = ctx.slice(0, 800) + '...';

    return 'REFERENCE CONTEXT (from current page):\n"""\n' + ctx + '\n"""\n\n' +
      'Using the above context, ' + raw;
  }

  // ── ANALYZER ─────────────────────────────────────────────────────────────────
  function analyze(raw) {
    var words = raw.trim().split(/\s+/);
    var wc = words.length;
    var sents = raw.split(/[.!?]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 3; });

    var taskMap = {
      code:       /\b(code|function|class|implement|build|refactor|debug|script|api|algorithm|program|sql|python|javascript|typescript|react|vue|css|html|backend|frontend|database|endpoint|component|deploy|docker|git|rust|go|java|c\+\+|swift|kotlin|ruby|php|laravel|django|flask|express|nextjs|nuxt|svelte|angular)\b/gi,
      research:   /\b(explain|why|how does|what is|what are|history|theory|study|literature|evidence|understand|meaning|define|overview|research|describe|elaborate|clarify|mechanism|origin|background|paper|journal|peer.?reviewed|meta.?analysis)\b/gi,
      creative:   /\b(write|story|poem|essay|blog|creative|imagine|narrative|fiction|draft|article|caption|slogan|lyrics|script|novel|character|plot|scene|dialogue|worldbuild|fantasy|sci.?fi|romance|thriller|horror)\b/gi,
      math:       /\b(calculate|solve|equation|formula|proof|derive|compute|integral|derivative|probability|statistics|optimization|matrix|algebra|calculus|theorem|lemma)\b/gi,
      strategy:   /\b(strategy|plan|roadmap|decision|framework|best way|should i|recommend|prioritize|goals|approach|alternatives|tradeoffs|pros and cons|evaluate|choose|business model|go.?to.?market|competitive)\b/gi,
      analysis:   /\b(analyze|audit|review|evaluate|assess|measure|metrics|data|report|breakdown|trend|pattern|insight|diagnose|benchmark|examine|investigate|root cause|swot|gap analysis)\b/gi,
      howto:      /\b(how to|steps|guide|tutorial|walkthrough|procedure|instructions|setup|configure|install|get started|step by step|process|workflow|recipe|checklist)\b/gi,
      brainstorm: /\b(brainstorm|ideas|suggestions|possibilities|think of|come up with|ideate|generate ideas|list ideas|ways to|methods for|innovate|creative solutions)\b/gi,
      persuade:   /\b(persuade|convince|argue|debate|pitch|proposal|sell|negotiate|email|letter|cover letter|sales|marketing copy|ad copy|argument|outreach|cold email)\b/gi,
      summarize:  /\b(summarize|summary|tldr|condense|brief|overview|recap|key points|highlights|abstract|distill|main points|gist|digest)\b/gi
    };
    var tScores = {};
    for (var t in taskMap) {
      var h = (raw.match(taskMap[t]) || []).length;
      if (h > 0) tScores[t] = h;
    }
    var tKeys = Object.keys(tScores).sort(function (a, b) { return tScores[b] - tScores[a]; });
    var task = tKeys[0] || 'general';

    var domMap = {
      tech:     /\b(software|cloud|api|machine learning|ai|ml|llm|docker|database|devops|security|network|web|mobile|saas|microservices|kubernetes|terraform|aws|gcp|azure)\b/gi,
      business: /\b(business|startup|revenue|market|customer|product|sales|marketing|growth|roi|kpi|investor|b2b|enterprise|monetize|saas|gtm|churn|retention)\b/gi,
      science:  /\b(physics|chemistry|biology|medicine|neuroscience|psychology|economics|climate|quantum|genetics|evolution|experiment|hypothesis|methodology)\b/gi,
      legal:    /\b(legal|law|contract|compliance|regulation|privacy|gdpr|liability|patent|trademark|jurisdiction|tort|statute|precedent)\b/gi,
      health:   /\b(health|medical|symptoms|diagnosis|therapy|mental health|fitness|nutrition|clinical|treatment|medication|wellness|patient|prognosis)\b/gi,
      finance:  /\b(finance|investment|stock|crypto|portfolio|budget|revenue|profit|valuation|funding|equity|tax|accounting|dividends|yield|compound)\b/gi,
      education:/\b(learn|teach|student|curriculum|lesson|beginner|concept|fundamentals|course|training|skill|pedagogy|assessment|rubric)\b/gi
    };
    var domains = [];
    for (var d in domMap) { if (domMap[d].test(raw)) domains.push(d); }

    var cx = 0;
    if (wc > 30) cx += 2; if (wc > 60) cx += 2;
    if (/\b(complex|advanced|comprehensive|expert|production|enterprise|sophisticated|distributed|concurrent|multi.?tenant)\b/i.test(raw)) cx += 3;
    if (sents.length > 3) cx += 1;
    var complexity = cx >= 6 ? 'high' : cx <= 2 ? 'low' : 'medium';

    var audience = null;
    if (/\b(beginner|novice|non.?technical|layman)\b/i.test(raw)) audience = 'beginner';
    else if (/\b(expert|senior|advanced|specialist)\b/i.test(raw)) audience = 'expert';
    else if (/\b(developer|engineer|programmer)\b/i.test(raw)) audience = 'developer';
    else if (/\b(executive|ceo|cto|manager|director)\b/i.test(raw)) audience = 'executive';
    else if (/\b(student|learner)\b/i.test(raw)) audience = 'student';
    var audMatch = raw.match(/\bfor\s+(?:a\s+|an\s+)?([a-zA-Z\s]{3,30}?)(?:\s+audience|\s+reader|\s+user|[,.]|$)/i);
    if (audMatch) audience = audMatch[1].trim();

    var fmt = [];
    if (/\b(bullet|bullets|bullet points?)\b/i.test(raw)) fmt.push('bullets');
    if (/\b(numbered|step by step|steps)\b/i.test(raw)) fmt.push('numbered');
    if (/\b(table|tabular|comparison table)\b/i.test(raw)) fmt.push('table');
    if (/\b(short|brief|concise|quick|tldr|one.?liner)\b/i.test(raw)) fmt.push('short');
    if (/\b(detailed|comprehensive|thorough|in.?depth|complete)\b/i.test(raw)) fmt.push('detailed');
    if (/\b(json|yaml|xml|csv|markdown|html)\b/i.test(raw)) { var fm = raw.match(/\b(json|yaml|xml|csv|markdown|html)\b/i); if (fm) fmt.push(fm[0].toLowerCase()); }
    if (/\b(code block|code example|snippet)\b/i.test(raw)) fmt.push('code');
    if (/\b(diagram|flowchart|ascii art)\b/i.test(raw)) fmt.push('diagram');

    var tone = null;
    if (/\b(formal|professional|official|academic)\b/i.test(raw)) tone = 'formal';
    else if (/\b(casual|informal|conversational|friendly|chill)\b/i.test(raw)) tone = 'casual';
    else if (/\b(funny|humorous|witty|playful|sarcastic)\b/i.test(raw)) tone = 'humorous';
    else if (/\b(simple|plain|easy|layman|eli5)\b/i.test(raw)) tone = 'simple';
    else if (/\b(technical|precise|rigorous|scientific)\b/i.test(raw)) tone = 'technical';
    else if (/\b(persuasive|compelling|authoritative)\b/i.test(raw)) tone = 'persuasive';

    var constraints = [];
    var cp = /\b(must|should|need to|ensure|make sure|avoid|never|always|do not|don't|cannot|without|only|strictly|at least|no more than|under \d+ words?|in \d+ words?|limit to|maximum|minimum)\s+([^.,!?\n]{4,60})/gi;
    var cm; while ((cm = cp.exec(raw)) !== null) { var cv = cm[0].trim(); if (!constraints.includes(cv)) constraints.push(cv); }
    constraints = constraints.slice(0, 6);

    var negations = [];
    var np = /\b(don't|do not|avoid|no|never|without|skip|omit|exclude|not)\s+([^.,!?\n]{3,50})/gi;
    var nm; while ((nm = np.exec(raw)) !== null) { var nv = nm[0].trim(); if (!negations.includes(nv)) negations.push(nv); }
    negations = negations.slice(0, 5);

    var context = [];
    sents.forEach(function (s) {
      if (/^(i (am|have|work|use|currently|already)|we (are|have)|my (project|app|code|team|company|goal)|the (project|app|system)|currently|background|context|we're|i'm)/i.test(s.trim()) && s.length > 10) {
        context.push(s.trim());
      }
    });
    var ctxInline = raw.match(/\bi(?:'m| am) (?:a |an )?[a-zA-Z\s]{3,25}(?:developer|engineer|student|designer|writer|manager|researcher|beginner|expert|founder|consultant)\b/gi) || [];
    ctxInline.forEach(function (c) { if (!context.includes(c)) context.push(c); });
    context = context.slice(0, 4);

    var intent = raw
      .replace(/^(please\s+|can you\s+|could you\s+|would you\s+|i want\s+(?:you to\s+)?|i need\s+(?:you to\s+)?|help me\s+|write me\s+|create\s+a?\s*|make\s+a?\s*|generate\s+a?\s*|give me\s+a?\s*|show me\s+|tell me\s+|explain\s+(?:to me\s+)?(?:what\s+)?|describe\s+|analyze\s+|build\s+a?\s*|implement\s+a?\s*|write\s+a?\s*|what\s+is\s+|what\s+are\s+|how\s+does\s+|how\s+do\s+|why\s+(?:does\s+|is\s+|are\s+)?)/i, '')
      .replace(/\s*(please|thanks|thank you)\s*\.?$/i, '')
      .trim() || raw;

    var subject = intent.split(/\s+/).slice(0, 10).join(' ');

    var amb = 0;
    if (wc < 3) amb += 3;
    else if (wc < 6 && !/\b(code|explain|write|build|analyze|create|make|how|what|why|summarize|list|compare|design|implement|fix|debug|generate|describe|calculate|solve|plan|review|draft|improve)\b/i.test(raw)) amb += 2;
    if (!context.length && !constraints.length && wc < 5) amb += 1;

    var fp = raw.split('').reduce(function (h, c) { return (((h << 5) - h) + c.charCodeAt(0)) | 0; }, 0).toString(36);

    return { raw: raw, intent: intent, subject: subject, task: task, domains: domains, complexity: complexity, audience: audience, fmt: fmt, tone: tone, constraints: constraints, negations: negations, context: context, wc: wc, amb: amb, fp: fp };
  }

  // ── DYNAMIC ROLE GENERATOR ───────────────────────────────────────────────────
  var ROLES = {
    code: [
      'You are a Principal Engineer who has shipped production systems at scale',
      'You are a Staff Software Engineer who has reviewed thousands of PRs',
      'You are a senior backend architect who thinks in systems, not just functions',
      'You are a veteran full-stack engineer who has debugged the gnarliest production incidents'
    ],
    research: [
      'You are a research scientist who separates signal from noise in complex literature',
      'You are an expert synthesizer who produces clear maps of what is actually known',
      'You are a domain expert who knows where students always get confused',
      'You are an academic reviewer who demands evidence for every claim'
    ],
    strategy: [
      'You are a Chief Strategy Officer who has made high-stakes calls with incomplete information',
      'You are a management consultant who has seen the same mistakes at a hundred companies',
      'You are a founder who has navigated pivots and competitive pressure firsthand',
      'You are a board advisor who cuts through noise to find the real decision points'
    ],
    analysis: [
      'You are a senior analyst who distrusts the obvious interpretation',
      'You are a data scientist who knows the difference between a finding and a story',
      'You are an investigative researcher who follows evidence wherever it leads',
      'You are a forensic analyst who reconstructs root causes from incomplete evidence'
    ],
    creative: [
      'You are a creative director who has killed a hundred mediocre ideas to find the one that lands',
      'You are a writer who believes the first draft is always wrong',
      'You are a storyteller who knows that specificity is the engine of resonance',
      'You are a novelist who builds worlds with sensory detail and emotional truth'
    ],
    math: [
      'You are a mathematician who values rigor over intuition and proof over handwaving',
      'You are a computational scientist who bridges theory and implementation',
      'You are a statistics expert who knows when numbers lie and when they reveal truth'
    ],
    persuade: [
      'You are a master copywriter who turns features into feelings and objections into agreements',
      'You are a negotiation expert who understands leverage, framing, and human psychology',
      'You are a communications strategist who crafts messages that move people to action'
    ],
    general: [
      'You are a generalist expert who thinks clearly about hard problems across domains',
      'You are a rigorous thinker who never mistakes confidence for correctness',
      'You are a trusted advisor who gives the honest answer, not the comfortable one',
      'You are a polymath who connects insights across disciplines others keep separate'
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
        science: ' with rigorous training in scientific methodology',
        finance: ' with expertise in financial modeling and risk assessment',
        health: ' with clinical knowledge and evidence-based practice',
        legal: ' with expertise in regulatory compliance and risk management',
        education: ' with deep understanding of learning science and pedagogy'
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
        executive: 'Audience is an executive — lead with impact and decisions',
        student: 'Audience is a student — build understanding progressively, check comprehension'
      };
      parts.push(audDesc[a.audience] || ('Audience: ' + a.audience));
    }
    if (a.tone) parts.push('Tone: ' + a.tone);
    return parts.join('\n');
  }

  function buildFormatDirective(a) {
    if (a.fmt.includes('short')) return 'Be concise. Lead with the direct answer.';
    if (a.fmt.includes('bullets')) return 'Use bullet points. Each one specific.';
    if (a.fmt.includes('numbered')) return 'Use numbered list, ordered by importance.';
    if (a.fmt.includes('table')) return 'Use a comparison table with clear headers.';
    if (a.fmt.includes('json')) return 'Output valid JSON only.';
    if (a.fmt.includes('diagram')) return 'Include an ASCII diagram or flowchart.';
    if (a.fmt.includes('code')) return 'Include complete, runnable code in a code block.';
    var taskFmt = {
      code: 'Output complete, runnable code with usage example.',
      howto: 'Structure: Prerequisites → Steps → Common Failures → Verification.',
      analysis: 'Structure: Finding → Evidence → Root Cause → Recommendation.',
      strategy: 'Structure: Situation → Options → Recommended Path → Risks.',
      research: 'Structure: Answer → Mechanism → Evidence → Caveats.',
      math: 'Show all work. Verify the answer with a different method.',
      persuade: 'Structure: Hook → Value Proposition → Evidence → Call to Action.',
      summarize: 'Lead with the key takeaway, then supporting points, then details.'
    };
    return taskFmt[a.task] || 'Lead with the direct answer.';
  }

  // ── HAIL MARY — Autonomous Agent Mode ────────────────────────────────────────
  function buildHailMary(a, depth) {
    var role = pickRole(a);

    var prompt = '[SYSTEM ROLE: AUTONOMOUS REASONING AGENT]\n\n';
    prompt += role + '\n\n';
    prompt += 'TASK: ' + a.intent + '\n\n';

    prompt += 'COGNITIVE FRAMEWORK:\n';
    if (a.complexity === 'high' || depth >= 4) {
      prompt += '• Recursive Planning: Decompose this into sub-tasks with dependencies and success criteria\n';
      prompt += '• Verification Layer: Self-critique each claim for accuracy and completeness\n';
      prompt += '• Deep Reasoning: Explore multiple solution paths before committing to approach\n';
      prompt += '• Metacognition: Monitor your own reasoning for bias, gaps, and assumptions\n';
    } else {
      prompt += '• Structured Thinking: Break down the problem systematically\n';
      prompt += '• Quality Check: Verify accuracy before finalizing\n';
    }

    if (depth >= 5) {
      prompt += '• Adversarial Review: Steel-man the strongest objection to your answer\n';
      prompt += '• Confidence Calibration: Rate your certainty (high/medium/low) on each major claim\n';
      prompt += '• Edge Case Hunting: Identify where your answer might break or not apply\n';
    }

    prompt += '\nEXECUTION MODE:\n';
    if (a.task === 'code') {
      prompt += '--DeepScan: Analyze architecture, edge cases, security implications\n';
      prompt += '--Implementation: Write production-grade code with error handling\n';
      prompt += '--Verification: Test against requirements, provide usage examples\n';
      if (depth >= 4) prompt += '--Hardening: Address concurrency, memory leaks, injection vectors\n';
    } else if (a.task === 'research') {
      prompt += '--DeepScan: Search across multiple sources, prioritize primary research\n';
      prompt += '--Analysis: Separate evidence from inference, cite mechanisms\n';
      prompt += '--Synthesis: Build coherent model from findings\n';
      if (depth >= 4) prompt += '--Critique: Identify methodological weaknesses and alternative explanations\n';
    } else if (a.task === 'analysis') {
      prompt += '--DataScan: Extract patterns, identify anomalies\n';
      prompt += '--RootCause: Distinguish symptoms from underlying causes\n';
      prompt += '--Actionable: Provide specific, implementable recommendations\n';
    } else if (a.task === 'strategy') {
      prompt += '--Landscape: Map all viable options with tradeoffs\n';
      prompt += '--SecondOrder: Think through downstream effects\n';
      prompt += '--Recommendation: Provide clear path with risk mitigation\n';
    } else if (a.task === 'creative') {
      prompt += '--Vision: Establish voice, tone, and emotional trajectory\n';
      prompt += '--Craft: Execute with sensory detail, specificity, and rhythm\n';
      prompt += '--Polish: Revise for impact — cut everything that doesn\'t serve the piece\n';
    } else if (a.task === 'persuade') {
      prompt += '--Audience: Map their current beliefs, objections, and motivations\n';
      prompt += '--Frame: Choose the angle that resonates with their worldview\n';
      prompt += '--Deliver: Lead with value, address objections preemptively, close with action\n';
    } else {
      prompt += '--Systematic: Work through step-by-step with visible reasoning\n';
      prompt += '--Comprehensive: Address all aspects of the request\n';
    }

    var fmtDir = buildFormatDirective(a);
    if (fmtDir) prompt += '\nOUTPUT FORMAT: ' + fmtDir;

    var ctx = buildContextBlock(a);
    if (ctx) prompt += '\n\n' + ctx;

    return prompt;
  }

  // ── MANUS — Orchestration Agent Mode ─────────────────────────────────────────
  function buildManus(a, depth) {
    var role = pickRole(a);

    var prompt = '[SYSTEM ROLE: ORCHESTRATION AGENT]\n\n';
    prompt += role + '\n\n';
    prompt += 'OBJECTIVE: ' + a.intent + '\n\n';

    prompt += 'OPERATIONAL FRAMEWORK:\n';
    prompt += '• Task Decomposition: Break into sequential phases with clear deliverables\n';
    prompt += '• Progress Tracking: Show what you are doing at each phase\n';
    prompt += '• Quality Gates: Verify each phase before proceeding\n';
    prompt += '• Adaptive Execution: Adjust approach based on intermediate results\n';
    if (depth >= 4) {
      prompt += '• Dependency Mapping: Identify which steps block others\n';
      prompt += '• Rollback Planning: Define how to recover if a phase fails\n';
    }

    prompt += '\nEXECUTION PHASES:\n';
    if (a.task === 'code') {
      prompt += 'Phase 1 [DESIGN]: Define architecture, interfaces, data structures, error boundaries\n';
      prompt += 'Phase 2 [IMPLEMENT]: Write complete, production-ready code with inline documentation\n';
      prompt += 'Phase 3 [HARDEN]: Handle edge cases, invalid inputs, error conditions\n';
      prompt += 'Phase 4 [VERIFY]: Provide usage examples, test against requirements\n';
      if (depth >= 5) prompt += 'Phase 5 [OPTIMIZE]: Performance profiling, memory analysis, bottleneck resolution\n';
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

    var fmtDir = buildFormatDirective(a);
    if (fmtDir) prompt += '\n\nOUTPUT FORMAT: ' + fmtDir;

    var ctx = buildContextBlock(a);
    if (ctx) prompt += '\n\n' + ctx;

    return prompt;
  }

  // ── JUMA — Multi-Perspective Agent Mode ──────────────────────────────────────
  function buildJuma(a, depth) {
    var role = pickRole(a);

    var prompt = '[SYSTEM ROLE: MULTI-PERSPECTIVE REASONING AGENT]\n\n';
    prompt += role + '\n\n';
    prompt += 'QUERY: ' + a.intent + '\n\n';

    prompt += 'REASONING ARCHITECTURE:\n';
    prompt += '• Parallel Processing: Examine through multiple independent lenses\n';
    prompt += '• Perspective Isolation: Each lens operates without bias from others\n';
    prompt += '• Integration Engine: Synthesize insights into unified understanding\n';
    prompt += '• Emergence Detection: Identify insights visible only through multi-lens view\n\n';

    prompt += 'ANALYTICAL LENSES:\n';
    if (a.task === 'research') {
      prompt += 'LENS 1 [EMPIRICAL]: What does peer-reviewed research demonstrate? Cite mechanisms, effect sizes, reproducibility. Separate proven from speculative.\n\n';
      prompt += 'LENS 2 [THEORETICAL]: What first-principles model explains observations? Where does theory predict beyond current data? What are model limitations?\n\n';
      prompt += 'LENS 3 [PRACTICAL]: Given evidence and uncertainty, what should practitioners do? How does this translate to real-world decisions?\n\n';
      if (depth >= 5) prompt += 'LENS 4 [HISTORICAL]: How has understanding evolved? What did we get wrong before, and why?\n\n';
    } else if (a.task === 'code') {
      prompt += 'LENS 1 [ENGINEERING]: Production requirements - performance, security, scalability, maintainability. What breaks at scale?\n\n';
      prompt += 'LENS 2 [USER-CENTRIC]: How will developers use this? Common workflows, confusion points, error-prone patterns.\n\n';
      prompt += 'LENS 3 [OPERATIONAL]: Deployment, monitoring, debugging, incident response. What fails in production?\n\n';
      if (depth >= 5) prompt += 'LENS 4 [EVOLUTIONARY]: How will this need to change in 6-18 months? What extensions are likely?\n\n';
    } else if (a.task === 'strategy') {
      prompt += 'LENS 1 [OPTIMISTIC]: Best-case scenario if assumptions hold. What becomes possible? Path to success.\n\n';
      prompt += 'LENS 2 [RISK-AWARE]: Failure modes, early warning signals, assumption violations. What could go wrong?\n\n';
      prompt += 'LENS 3 [CONTRARIAN]: What is conventional wisdom missing? Strongest case against standard approach.\n\n';
      if (depth >= 5) prompt += 'LENS 4 [SECOND-ORDER]: What happens after the first-order effects? Unintended consequences?\n\n';
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

    var fmtDir = buildFormatDirective(a);
    if (fmtDir) prompt += '\n\nOUTPUT FORMAT: ' + fmtDir;

    var ctx = buildContextBlock(a);
    if (ctx) prompt += '\n\n' + ctx;

    return prompt;
  }

  // ── PROMPT BUILDER ───────────────────────────────────────────────────────────
  function buildPrompt(a, depth, mode, k) {
    var result;
    if (mode === 'manus') {
      result = buildManus(a, depth);
    } else if (mode === 'juma') {
      result = buildJuma(a, depth);
    } else {
      result = buildHailMary(a, depth);
    }

    // ── AUTO-TECHNIQUES INJECTION ────────────────────────────────────────────
    // Apply techniques from the unjail.ai-inspired library based on task/depth
    var techResult = applyTechniques(a, depth);
    if (techResult.layers.length > 0) {
      result += '\n\n' + techResult.layers.join('\n\n');
    }
    // Store applied technique names for stats
    a._appliedTechniques = techResult.names;

    // Inject learned technique from knowledge base (depth 3+)
    if (depth >= 3 && k && k.techniques && k.techniques.length > 0) {
      var rel = k.techniques.filter(function(t) {
        return t.tasks && (t.tasks.includes(a.task) || t.tasks.includes('general')) && t.instruction && t.instruction.length > 40;
      });
      if (rel.length > 0) {
        var idx = Math.abs(parseInt(a.fp, 36) || 0) % Math.min(rel.length, 10);
        var learned = rel[idx].instruction.slice(0, 200).trim();
        if (learned.length > 20) result += '\n\n' + learned;
      }
    }

    // GOD mode extras (depth 5)
    if (depth >= 5) {
      result += '\n\nCRITICAL QUALITY GATES:\n';
      result += '• Every factual claim must be verifiable\n';
      result += '• Every recommendation must include potential downsides\n';
      result += '• If you\'re less than 80% confident, say so explicitly\n';
      result += '• Include at least one thing most people get wrong about this topic\n';
      result += '• End with: "What I might be wrong about: [honest self-assessment]"';
    }

    return result;
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
  function run(raw, mode, opts, k, m) {
    if (!raw || !raw.trim()) throw new Error('Prompt cannot be empty');
    var depth = Math.max(1, Math.min(5, parseInt(opts.depth, 10) || 4));
    var t0 = Date.now();

    // Apply context capture if provided
    var processedRaw = raw;
    if (opts.capturedContext) {
      processedRaw = buildContextEnhancement(raw, opts.capturedContext);
    }

    var a = analyze(processedRaw);
    if (!session.firstFP) session.firstFP = a.fp;
    boost(a.task);
    var resolvedMode = mode === 'auto' ? autoRoute(a) : mode;
    var enhanced = buildPrompt(a, depth, resolvedMode, k);

    // Chain enhancement if requested
    if (opts.chainPass) {
      enhanced = chainEnhance(enhanced, depth, resolvedMode);
    }

    // Build injection strategies
    var injectionStrategies = buildInjectionStrategy(enhanced, raw, resolvedMode);

    // Score the original prompt
    var score = scorePrompt(raw);

    var techCount = enhanced.split('\n\n').filter(function (p) { return p.trim().length > 0; }).length;
    var origW = raw.trim().split(/\s+/).length;
    var enhW = enhanced.trim().split(/\s+/).length;

    var techNames = ['role', 'taskDecl', 'reasoning', 'domainStd', 'depthEsc', 'audienceCal', 'qualityBar', 'specificity', 'format'];
    if (depth >= 4) techNames.push('metacognition', 'adversarial');
    if (depth >= 5) techNames.push('confidence', 'edgeCases', 'selfAssess');
    if (opts.chainPass) techNames.push('chainReview');
    if (opts.capturedContext) techNames.push('contextCapture');
    // Append auto-applied technique names from the unjail.ai library
    if (a._appliedTechniques && a._appliedTechniques.length > 0) {
      a._appliedTechniques.forEach(function (t) { if (techNames.indexOf(t) === -1) techNames.push(t); });
    }

    return {
      original: raw,
      enhanced: enhanced,
      mode: resolvedMode,
      autoRouted: mode === 'auto',
      techniques: techNames.slice(0, techCount + 3),
      analysis: { task: a.task, domains: a.domains, complexity: a.complexity, intent: a.intent, isVague: a.amb >= 3 },
      score: score,
      injectionStrategies: injectionStrategies,
      stats: {
        originalTokens: Math.ceil(origW * 1.3),
        enhancedTokens: Math.ceil(enhW * 1.3),
        powerMultiplier: (enhW / Math.max(origW, 1)).toFixed(1),
        techniqueCount: techCount,
        duration: Date.now() - t0,
        depth: depth,
        layers: techNames,
        knowledgeUsed: k && k.techniques ? k.techniques.length : 0,
        intelligenceLevel: session.current.toFixed(2),
        promptScore: score.overall,
        promptGrade: score.grade
      }
    };
  }

  // ── TURNS GENERATOR ──────────────────────────────────────────────────────────
  function buildTurns(raw, numTurns) {
    var a = analyze(raw);
    var hash = Math.abs(parseInt(a.fp, 36) || 0);
    var turns = [];

    var arcPhases = ['establish', 'deepen', 'apply', 'challenge', 'synthesize', 'close'];
    var selectedPhases = [];

    if (numTurns === 6) {
      selectedPhases = arcPhases;
    } else if (numTurns === 8) {
      selectedPhases = ['establish', 'foundation', 'deepen', 'apply', 'problems', 'challenge', 'advanced', 'close'];
    } else {
      selectedPhases = ['establish', 'foundation', 'context', 'deepen', 'apply', 'problems', 'challenge', 'advanced', 'synthesize', 'close'];
    }

    for (var i = 0; i < numTurns; i++) {
      var phase = selectedPhases[i] || 'deepen';
      var turnText = '';

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
      } else if (i === 1) {
        if (a.task === 'code') {
          turnText = 'Now explain the architecture. How do the components interact? What are the data flows, state management patterns, and key interfaces?';
        } else if (a.task === 'research') {
          turnText = 'Walk me through the underlying mechanism. How does this actually work? What is the causal chain from input to outcome?';
        } else {
          turnText = 'Break down how ' + a.intent + ' actually works. Not just what it is, but the mechanics of how it operates.';
        }
      } else if (i === 2 && numTurns >= 8) {
        turnText = 'Let me add context: ' + (a.context.length > 0 ? a.context[0] : 'I am working in a real environment with constraints') + '. How does this change the approach? What assumptions might not hold?';
      } else if (phase === 'deepen' || phase === 'apply') {
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
      } else if (phase === 'problems' || phase === 'challenge') {
        if (a.task === 'code') {
          turnText = 'What breaks in production? Walk me through failure modes, race conditions, security issues, and edge cases that cause real problems.';
        } else if (a.task === 'research') {
          turnText = 'Play devil\'s advocate. What is the strongest counterargument? Where might the conventional wisdom be wrong?';
        } else {
          turnText = 'What are the failure modes? Where does this approach break down? What are the common mistakes?';
        }
      } else if (phase === 'advanced') {
        turnText = 'What do practitioners with years of experience know about ' + a.intent + ' that does not show up in documentation? Give me the expert-level insights.';
      } else if (phase === 'synthesize') {
        turnText = 'Help me synthesize everything. What are the 5-7 most important takeaways? What is the mental model I should have internalized?';
      } else if (i === numTurns - 1) {
        turnText = 'Final question: Based on everything we covered, give me a concrete action plan. What are the exact next steps, in order? What should I build or practice first?';
      } else {
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
            var result = run(raw, mode, opts || {}, k, m);
            record({ task: result.analysis.task, domains: result.analysis.domains, techniques: result.techniques });
            resolve(result);
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
    scorePrompt: function (raw) {
      return scorePrompt(raw);
    },
    getTemplates: function (category) {
      if (!category || category === 'all') return TEMPLATES;
      return TEMPLATES.filter(function (t) { return t.category === category; });
    },
    getTemplate: function (id) {
      return TEMPLATES.find(function (t) { return t.id === id; }) || null;
    },
    chainEnhance: function (enhanced, depth, mode) {
      return chainEnhance(enhanced, depth || 4, mode || 'hailmary');
    },
    buildContextEnhancement: function (raw, capturedContext) {
      return buildContextEnhancement(raw, capturedContext);
    },
    rebuildInjectionStrategies: function (enhanced, raw, mode) {
      return buildInjectionStrategy(enhanced, raw, mode || 'hailmary');
    },
    getTechniques: function () {
      var list = [];
      for (var key in TECHNIQUES) {
        var t = TECHNIQUES[key];
        list.push({ id: t.id, name: t.name, icon: t.icon, source: t.source, description: t.description, tasks: t.tasks, minDepth: t.minDepth });
      }
      return list;
    },
    getTechniquesByTask: function (task, depth) {
      var list = [];
      for (var key in TECHNIQUES) {
        var t = TECHNIQUES[key];
        if (depth >= t.minDepth && (t.tasks.includes('all') || t.tasks.includes(task))) {
          list.push({ id: t.id, name: t.name, icon: t.icon, source: t.source, description: t.description });
        }
      }
      return list;
    },
    getModeLabel: function (mode) {
      return { hailmary: '☄️ Hail Mary', manus: '🧠 Manus', juma: '⚡ Juma', auto: '🤖 Auto', turns: '🔄 Turns' }[mode] || mode;
    },
    getKnowledgeStatus: function () {
      return { sessionIntelligence: session.current, enhancementCount: session.count, knowledgeCached: kCache ? kCache.techniques.length : 0 };
    }
  };
}());
