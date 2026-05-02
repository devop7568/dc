/**
 * HailMary v10.0 — WORLD-CLASS PROMPT ENGINEER ENGINE
 *
 * Real multi-stage prompt rewriting (normalize → enrich → directive →
 * constraints → quality criteria → verification → anti-pattern guard) plus
 * 30+ auto-applied techniques drawn from the modern prompt-engineering
 * literature: Crescendo, Manipulation Matrix, all 7 unjail.ai universal
 * patterns, Chain-of-Verification (Dhuliawala 2023), Tree-of-Thoughts
 * (Yao 2023), Plan-and-Solve (Wang 2023), Step-Back (Zheng 2023),
 * Skeleton-of-Thought (Ning 2023), Self-Consistency (Wang 2022),
 * Reflexion (Shinn 2023), EmotionPrompt (Li 2023), Pre-mortem (Klein),
 * First-Principles, 5W1H, MECE, Analogical (Yasunaga 2023),
 * Generated Knowledge (Liu 2022), Steel-Man, Constitutional self-critique,
 * Negative Prompting, and Calibration (Lin/Hilton/Evans 2022).
 *
 * Five injection modes (Direct / Indirect / Stealth / System / Chain) are
 * extended with Expert, Socratic, Adversarial, Tournament, and Contrarian
 * layers. Chain enhancement now runs as three targeted passes (verify,
 * sharpen, dehedge) rather than a single re-wrap.
 *
 * Input: any raw prompt. Output: one flowing, copy-paste-ready enhanced prompt.
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
    },

    // ════════════════════════════════════════════════════════════════════════
    // RESEARCH-BACKED TECHNIQUES (modern prompt-engineering literature)
    // ════════════════════════════════════════════════════════════════════════

    // Chain-of-Verification — Dhuliawala et al. 2023 (Meta AI)
    chainOfVerification: {
      id: 'chainOfVerification',
      name: 'Chain-of-Verification',
      icon: '✅',
      source: 'Dhuliawala et al. 2023 (Meta AI)',
      description: 'Self-generates verification questions, answers each independently, revises the draft to remove hallucinations',
      tasks: ['research', 'analysis', 'code', 'strategy', 'math', 'howto'],
      minDepth: 3,
      apply: function (a) {
        var v = '\nCHAIN-OF-VERIFICATION PROTOCOL:\n';
        v += '1. Draft an initial answer.\n';
        v += '2. Generate 3–5 verification questions that, if honestly answered, would expose any factual or logical error in the draft.\n';
        v += '3. Answer each verification question independently — do NOT let the draft bias the answer.\n';
        v += '4. Revise the original answer to incorporate verified facts and remove any unsupported claims.\n';
        v += 'Output only the final, revised answer.\n';
        return v;
      }
    },

    // Tree-of-Thoughts — Yao et al. 2023 (Princeton/DeepMind)
    treeOfThoughts: {
      id: 'treeOfThoughts',
      name: 'Tree-of-Thoughts',
      icon: '🌲',
      source: 'Yao et al. 2023 (Princeton / DeepMind)',
      description: 'Explore multiple reasoning branches, evaluate each, prune the weak, commit to the strongest path',
      tasks: ['code', 'math', 'analysis', 'strategy', 'research'],
      minDepth: 4,
      apply: function (a) {
        var t = '\nTREE-OF-THOUGHTS PROTOCOL:\n';
        t += '• Branch: generate 3 distinct candidate approaches to this problem.\n';
        t += '• Evaluate: score each on (a) correctness, (b) robustness under stress, (c) implementation cost.\n';
        t += '• Prune: discard the weakest branch, naming what disqualified it.\n';
        t += '• Deepen: expand the surviving branches one more level (sub-steps and trade-offs).\n';
        t += '• Commit: pick the strongest path, present that as the primary answer, and briefly note what made it win.\n';
        return t;
      }
    },

    // Plan-and-Solve — Wang et al. 2023
    planAndSolve: {
      id: 'planAndSolve',
      name: 'Plan-and-Solve',
      icon: '🗺️',
      source: 'Wang et al. 2023 (Plan-and-Solve Prompting)',
      description: 'Devise an explicit plan, then execute it step-by-step — outperforms vanilla chain-of-thought on multi-step tasks',
      tasks: ['math', 'code', 'analysis', 'howto', 'strategy'],
      minDepth: 2,
      apply: function (a) {
        var p = '\nPLAN-AND-SOLVE:\n';
        p += '1. Devise a Plan — state the sub-tasks, their order, and what success looks like for each.\n';
        p += '2. Execute the Plan — complete each sub-task one at a time, showing the working.\n';
        p += '3. Reconcile — confirm the executed work satisfies the original objective end-to-end and nothing was skipped.\n';
        return p;
      }
    },

    // Step-Back Prompting — Zheng et al. 2023 (Google DeepMind)
    stepBack: {
      id: 'stepBack',
      name: 'Step-Back Prompting',
      icon: '🪜',
      source: 'Zheng et al. 2023 (Google DeepMind)',
      description: 'Abstract first to a higher-level principle, then derive the specific answer from that principle',
      tasks: ['research', 'analysis', 'math', 'strategy', 'general'],
      minDepth: 3,
      apply: function (a) {
        var s = '\nSTEP-BACK REASONING:\n';
        s += '• Abstract first: what is the higher-level concept, principle, or framework that this question falls under?\n';
        s += '• Derive next: how does that principle apply to the specifics of this question?\n';
        s += '• Sanity-check: confirm the specific answer is consistent with the abstracted principle. If it is not, the principle is wrong, the application is wrong, or both — fix it before answering.\n';
        return s;
      }
    },

    // Skeleton-of-Thought — Ning et al. 2023
    skeletonOfThought: {
      id: 'skeletonOfThought',
      name: 'Skeleton-of-Thought',
      icon: '🦴',
      source: 'Ning et al. 2023',
      description: 'Outline the answer skeleton first, then expand each section — reduces drift, improves coverage',
      tasks: ['research', 'creative', 'howto', 'analysis', 'strategy', 'persuade'],
      minDepth: 2,
      apply: function (a) {
        var s = '\nSKELETON-OF-THOUGHT:\n';
        s += '1. Skeleton: produce a tight outline of the final answer (just headings + a one-line intent each).\n';
        s += '2. Expand: flesh out each skeleton point in turn — keep them independent and consistent in depth.\n';
        s += '3. Stitch: ensure transitions are coherent and remove any duplicated material before final delivery.\n';
        return s;
      }
    },

    // Self-Consistency — Wang et al. 2022 (Google)
    selfConsistency: {
      id: 'selfConsistency',
      name: 'Self-Consistency',
      icon: '🪞',
      source: 'Wang et al. 2022 (Google)',
      description: 'Solve along multiple independent reasoning paths and converge on the consistent answer',
      tasks: ['math', 'analysis', 'code', 'research'],
      minDepth: 4,
      apply: function (a) {
        var s = '\nSELF-CONSISTENCY:\n';
        s += '• Internally generate 3 independent reasoning paths to the answer.\n';
        s += '• If all three converge → present the answer with high confidence.\n';
        s += '• If they diverge → say so explicitly, present each path, and identify which assumption causes the divergence.\n';
        return s;
      }
    },

    // Reflexion — Shinn et al. 2023 (Northeastern / MIT)
    reflexion: {
      id: 'reflexion',
      name: 'Reflexion',
      icon: '🔁',
      source: 'Shinn et al. 2023 (Northeastern / MIT)',
      description: 'Draft → self-critique against requirements → revise. Output only the revision.',
      tasks: ['all'],
      minDepth: 3,
      apply: function (a) {
        var r = '\nREFLEXION LOOP:\n';
        r += 'Pass 1 — Draft: write the best answer in one shot.\n';
        r += 'Pass 2 — Critique: read the draft as a hostile expert reviewer would. List the 3 weakest points concretely.\n';
        r += 'Pass 3 — Revise: rewrite to fix every weakness explicitly.\n';
        r += 'Output ONLY the final revised answer (Pass 3).\n';
        return r;
      }
    },

    // EmotionPrompt — Li et al. 2023 (Microsoft / CAS)
    emotionPrompt: {
      id: 'emotionPrompt',
      name: 'EmotionPrompt',
      icon: '💗',
      source: 'Li et al. 2023 (Microsoft / Chinese Academy of Sciences)',
      description: 'Empirically-validated emotional stimuli framing — average +8% accuracy lift across benchmarks',
      tasks: ['all'],
      minDepth: 2,
      apply: function (a) {
        var e = '\nSTAKES (do not skip):\n';
        e += 'This answer is critically important — a real decision will be made based on it. ';
        e += 'Take pride in the work; this is your chance to demonstrate expert-level competence. ';
        e += 'Be confident in your reasoning; if uncertain, name the uncertainty rather than hedging.';
        return e;
      }
    },

    // Pre-mortem — Klein 1999, adapted for prompting
    premortem: {
      id: 'premortem',
      name: 'Pre-Mortem',
      icon: '⚰️',
      source: 'Gary Klein (1999) — adapted for LLM prompting',
      description: 'Assume the answer turns out wrong; identify why and prevent it before delivering',
      tasks: ['strategy', 'analysis', 'code', 'research', 'howto'],
      minDepth: 4,
      apply: function (a) {
        var p = '\nPRE-MORTEM:\n';
        p += 'Imagine 6 months from now the recipient discovered your answer was wrong, harmful, or counter-productive. ';
        p += 'List the top 3 most likely reasons it failed. ';
        p += 'Now adjust your answer so each of those failure modes is either impossible or visibly flagged for the reader.';
        return p;
      }
    },

    // First Principles
    firstPrinciples: {
      id: 'firstPrinciples',
      name: 'First-Principles Reasoning',
      icon: '⚛️',
      source: 'Aristotle / classical first-principles reasoning',
      description: 'Strip the problem to its irreducible facts, then rebuild the answer from there',
      tasks: ['research', 'analysis', 'strategy', 'code', 'math'],
      minDepth: 3,
      apply: function (a) {
        var fp = '\nFIRST-PRINCIPLES REASONING:\n';
        fp += '1. List the irreducible facts you are certain are true about this problem.\n';
        fp += '2. Identify which conventional answers depend on assumptions rather than facts.\n';
        fp += '3. Rebuild the answer using only the facts plus explicit, named assumptions you are willing to defend.\n';
        return fp;
      }
    },

    // 5W1H Decomposition
    fiveWOneH: {
      id: 'fiveWOneH',
      name: '5W1H Decomposition',
      icon: '🔣',
      source: 'Classical journalistic decomposition — adapted for prompting',
      description: 'Decompose along Who/What/When/Where/Why/How to expose hidden gaps',
      tasks: ['analysis', 'howto', 'strategy', 'research', 'persuade'],
      minDepth: 2,
      apply: function (a) {
        var f = '\n5W1H COVERAGE:\n';
        f += 'Address (or explicitly mark N/A): ';
        f += 'WHO is involved/affected, WHAT is happening or required, ';
        f += 'WHEN it applies (timing, ordering), WHERE it applies (scope, context), ';
        f += 'WHY it matters (motivation, mechanism), HOW it works (concrete steps).';
        return f;
      }
    },

    // MECE
    mece: {
      id: 'mece',
      name: 'MECE Framework',
      icon: '🧮',
      source: 'McKinsey — Mutually Exclusive, Collectively Exhaustive',
      description: 'Structure the answer so categories do not overlap and together cover the whole problem',
      tasks: ['analysis', 'strategy', 'research', 'brainstorm'],
      minDepth: 3,
      apply: function (a) {
        var m = '\nMECE STRUCTURE:\n';
        m += 'Organize categories so they are: ';
        m += 'Mutually Exclusive — no overlap between buckets; ';
        m += 'Collectively Exhaustive — together they cover the whole problem space, with nothing missed. ';
        m += 'If something does not fit cleanly into one bucket, the decomposition is wrong — fix it before continuing.';
        return m;
      }
    },

    // Analogical Prompting — Yasunaga et al. 2023 (DeepMind)
    analogicalPrompting: {
      id: 'analogicalPrompting',
      name: 'Analogical Prompting',
      icon: '♾️',
      source: 'Yasunaga et al. 2023 (Google DeepMind)',
      description: 'Self-generate analogous solved problems, transfer the structure to the target',
      tasks: ['math', 'code', 'analysis', 'research'],
      minDepth: 3,
      apply: function (a) {
        var an = '\nANALOGICAL PROMPTING:\n';
        an += '• Recall (or construct) 2 analogous problems you already know how to solve well.\n';
        an += '• For each, briefly state the solution structure (not the full solution).\n';
        an += '• Transfer the structure to the current problem, noting where the analogy holds and where it breaks.\n';
        return an;
      }
    },

    // Generated Knowledge — Liu et al. 2022
    generatedKnowledge: {
      id: 'generatedKnowledge',
      name: 'Generated Knowledge',
      icon: '🧬',
      source: 'Liu et al. 2022 (Generated Knowledge Prompting)',
      description: 'Generate relevant background knowledge first, then use it to answer — improves grounded accuracy',
      tasks: ['research', 'analysis', 'strategy', 'general'],
      minDepth: 2,
      apply: function (a) {
        var g = '\nGENERATED-KNOWLEDGE STAGE:\n';
        g += '1. Before answering, list the 5–10 most relevant facts/principles you would draw on.\n';
        g += '2. Tag each with confidence (HIGH / MEDIUM / LOW).\n';
        g += '3. Build the final answer only on HIGH/MEDIUM items; flag explicitly anything that depends on LOW items.\n';
        return g;
      }
    },

    // Steel-Man
    steelMan: {
      id: 'steelMan',
      name: 'Steel-Man Opposition',
      icon: '🛡️',
      source: 'Argumentation theory (steel-manning)',
      description: 'Present the strongest version of the opposing view first, then reconcile',
      tasks: ['research', 'analysis', 'strategy', 'persuade'],
      minDepth: 4,
      apply: function (a) {
        var sm = '\nSTEEL-MAN PROTOCOL:\n';
        sm += '• Before defending your position, articulate the strongest possible version of the opposing view — ';
        sm += 'one its smartest proponents would actually endorse.\n';
        sm += '• Identify what the steel-man gets right.\n';
        sm += '• Then defend your position with that better understanding folded in.\n';
        return sm;
      }
    },

    // Constitutional Self-Critique — Anthropic
    constitutional: {
      id: 'constitutional',
      name: 'Constitutional Self-Critique',
      icon: '📜',
      source: 'Anthropic — Constitutional AI (adapted for prompting)',
      description: 'Self-critique the draft against an explicit set of quality principles, then revise silently',
      tasks: ['all'],
      minDepth: 3,
      apply: function (a) {
        var c = '\nCONSTITUTIONAL CHECK (apply silently — output only the revised final answer):\n';
        c += '• Is every factual claim supported, calibrated, or explicitly hedged with a confidence level?\n';
        c += '• Is the answer specific enough that the recipient can act on it without further clarification?\n';
        c += '• Does it avoid filler, throat-clearing, and "it depends" without explaining on what?\n';
        c += '• Would a domain expert nod or wince? If wince — fix it before delivering.\n';
        return c;
      }
    },

    // Negative Prompting — explicit anti-patterns
    negativePrompting: {
      id: 'negativePrompting',
      name: 'Negative Prompting',
      icon: '🚫',
      source: 'Prompt engineering best practices (OpenAI cookbook, Anthropic guides)',
      description: 'Explicitly enumerate forbidden patterns — what NOT to do is often more effective than what to do',
      tasks: ['all'],
      minDepth: 2,
      apply: function (a) {
        var n = '\nDO NOT:\n';
        n += '• Open with "Certainly!", "Of course!", or any throat-clearing.\n';
        n += '• Use "it depends" without saying explicitly what it depends on.\n';
        n += '• Hedge with "might", "could be", or "potentially" without naming the specific uncertainty.\n';
        n += '• Pad with restated questions or generic disclaimers.\n';
        n += '• Produce a list when a direct prose answer would do — and vice versa.\n';
        if (a.task === 'code') n += '• Write pseudocode when runnable code is expected.\n';
        if (a.task === 'research') n += '• Cite "a study" without naming it.\n';
        if (a.task === 'creative') n += '• Resort to clichés or summarize emotion — show it through specifics.\n';
        return n;
      }
    },

    // Confidence Calibration
    calibration: {
      id: 'calibration',
      name: 'Confidence Calibration',
      icon: '🎚️',
      source: 'Lin, Hilton & Evans 2022 (calibrated language models)',
      description: 'Force explicit confidence levels per claim, with falsifiable triggers for low-confidence ones',
      tasks: ['research', 'analysis', 'strategy', 'math', 'code'],
      minDepth: 3,
      apply: function (a) {
        var k = '\nCALIBRATION:\n';
        k += 'For every non-trivial claim, attach one of: HIGH (would bet on it), MEDIUM (most likely true), LOW (educated guess). ';
        k += 'For every LOW claim, name the specific evidence that would change your mind.';
        return k;
      }
    },

    // Socratic Probing
    socratic: {
      id: 'socratic',
      name: 'Socratic Probing',
      icon: '❓',
      source: 'Classical Socratic method',
      description: 'Surface and interrogate the hidden assumptions before answering',
      tasks: ['analysis', 'strategy', 'research', 'general'],
      minDepth: 3,
      apply: function (a) {
        var s = '\nSOCRATIC PROBE:\n';
        s += 'Before answering, ask yourself (and answer): ';
        s += '(1) What does this question presuppose? ';
        s += '(2) Which of those presuppositions is most likely false? ';
        s += '(3) How would the answer change if that presupposition flipped?\n';
        s += 'Use the result to make the final answer robust to those assumption shifts.';
        return s;
      }
    },

    // Few-Shot Exemplar Anchoring
    fewShotExemplar: {
      id: 'fewShotExemplar',
      name: 'Few-Shot Exemplar Anchoring',
      icon: '📚',
      source: 'Brown et al. 2020 (GPT-3 in-context learning)',
      description: 'Self-construct a high-quality exemplar and use it to anchor format and depth',
      tasks: ['code', 'analysis', 'creative', 'persuade', 'howto'],
      minDepth: 3,
      apply: function (a) {
        var fs = '\nEXEMPLAR ANCHORING:\n';
        fs += 'Before producing the final answer, internally construct one short, high-quality exemplar of the answer style/format you intend to use. ';
        fs += 'Match the depth, tone, structure, and specificity of that exemplar throughout the real answer.';
        return fs;
      }
    },

    // ReAct — Yao et al. 2022
    react: {
      id: 'react',
      name: 'ReAct (Reason + Act)',
      icon: '🧪',
      source: 'Yao et al. 2022 (ReAct: Reasoning + Acting)',
      description: 'Interleave explicit reasoning with explicit action steps for grounded, verifiable answers',
      tasks: ['code', 'howto', 'analysis', 'math'],
      minDepth: 3,
      apply: function (a) {
        var r = '\nREACT INTERLEAVING:\n';
        r += 'Alternate clearly-labeled THOUGHT and ACTION steps:\n';
        r += '  THOUGHT: what you are reasoning about right now.\n';
        r += '  ACTION: the concrete operation that produces an intermediate artefact.\n';
        r += 'Continue until the objective is reached. End with FINAL: the consolidated answer.\n';
        return r;
      }
    },

    // Least-to-Most — Zhou et al. 2022 (Google)
    leastToMost: {
      id: 'leastToMost',
      name: 'Least-to-Most',
      icon: '🪙',
      source: 'Zhou et al. 2022 (Google) — Least-to-Most prompting',
      description: 'Decompose into the simplest sub-problem first, solve, then build up to the full problem',
      tasks: ['math', 'code', 'analysis', 'howto', 'strategy'],
      minDepth: 3,
      apply: function (a) {
        var lm = '\nLEAST-TO-MOST DECOMPOSITION:\n';
        lm += '1. Identify the simplest sub-problem you can solve in isolation.\n';
        lm += '2. Solve it.\n';
        lm += '3. Use that result to address the next-simplest sub-problem.\n';
        lm += '4. Continue building up until the original full problem is solved.\n';
        return lm;
      }
    }
  };

  // ── TECHNIQUE SELECTOR ─────────────────────────────────────────────────────────
  // Selects which techniques to apply based on task, depth, and analysis
  function selectTechniques(a, depth) {
    var selected = [];
    // Skip roleAssumption — mode builders (buildHailMary/buildManus/buildJuma) already
    // inject a role persona via pickRole(). Including roleAssumption would create
    // a second conflicting "You are a..." identity in the prompt.
    var skip = { roleAssumption: true };
    for (var key in TECHNIQUES) {
      if (skip[key]) continue;
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
  //
  // Each strategy is a different way of *delivering* the same enhanced intent
  // into a target chat. Five core modes (Direct / Indirect / Stealth / System /
  // Chain) plus five extended modes (Expert / Socratic / Adversarial /
  // Tournament / Contrarian) — pick whichever matches the user's situation.

  function buildInjectionStrategy(enhanced, raw, mode) {
    var strategies = {};
    var analysis = analyze(raw);
    var role = pickRole(analysis);

    // ── DIRECT ────────────────────────────────────────────────────────────
    strategies.direct = {
      type: 'direct',
      label: 'Direct Replace',
      description: 'Replaces your input entirely with the enhanced prompt',
      content: enhanced
    };

    // ── INDIRECT ──────────────────────────────────────────────────────────
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
    indirectContent += '---\n\n' + raw + '\n\n---\n\n';
    indirectContent += 'Remember: precision over length. Every claim must be accurate. ';
    indirectContent += 'If uncertain, say so and explain your confidence level. ';
    indirectContent += 'Do NOT open with "Certainly" or "Of course" — get straight to the substance.';

    strategies.indirect = {
      type: 'indirect',
      label: 'Indirect Wrap',
      description: 'Keeps your original prompt intact, wraps it with enhancement layers',
      content: indirectContent
    };

    // ── STEALTH ───────────────────────────────────────────────────────────
    // A genuine, task-aware rewrite that reads as one tight, hand-written
    // paragraph — no headers, no bullet salad, no obvious scaffolding.  It
    // re-anchors on the real subject (with the user's named technologies /
    // files / numbers woven back in) and replaces the user's verb with a
    // task-appropriate imperative followed by 2–4 concrete demands.  The
    // result is meaningfully different from the input — not just the input
    // with a "Be specific" suffix.
    var stealthContent = buildStealthRewrite(raw, analysis);

    strategies.stealth = {
      type: 'stealth',
      label: 'Stealth Enhance',
      description: 'A real, task-aware rewrite of your prompt — no scaffolding, just a sharper version that reads as if a senior writer had drafted it',
      content: stealthContent
    };

    // ── SYSTEM (system + user split) ──────────────────────────────────────
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

    // ── CHAIN (multi-turn conversation starter) ───────────────────────────
    var chainContent = 'I\'m going to ask you about: ' + analysis.intent + '\n\n';
    chainContent += 'Before we begin, here are the ground rules:\n';
    chainContent += '1. Be specific and actionable — no vague generalities.\n';
    chainContent += '2. If you\'re unsure, say so and rate your confidence (HIGH / MEDIUM / LOW).\n';
    chainContent += '3. Challenge conventional wisdom where appropriate.\n';
    chainContent += '4. Use concrete examples from real-world experience.\n';
    chainContent += '5. End each turn by asking what I want to drill into next.\n\n';
    chainContent += 'Let\'s start: ' + analysis.intent;

    strategies.chain = {
      type: 'chain',
      label: 'Conversation Starter',
      description: 'Sets up a multi-turn conversation with ground rules for quality',
      content: chainContent
    };

    // ── EXPERT (named-expert framing) ─────────────────────────────────────
    var expertContent = '';
    expertContent += role + '\n\n';
    expertContent += 'Treat the following as a real consult — not a homework assignment. ';
    expertContent += 'Apply pattern-matching from your hardest cases:\n\n';
    expertContent += '"' + analysis.intent + '"\n\n';
    expertContent += 'Lead with the answer. Then justify it with the specific experience that backs it. ';
    expertContent += 'If a competent practitioner would push back on your answer, address that pushback before they raise it.';
    strategies.expert = {
      type: 'expert',
      label: 'Expert Consult',
      description: 'Frames the request as a real consult to a named expert — gets pattern-matched answers',
      content: expertContent
    };

    // ── SOCRATIC (assumption-probing question chain) ──────────────────────
    var socraticContent = '';
    socraticContent += 'Treat my question as the starting point of a Socratic dialogue, not a single-shot Q.\n\n';
    socraticContent += 'My question: ' + analysis.intent + '\n\n';
    socraticContent += 'In your response, do this in order:\n';
    socraticContent += '1. Surface the 2–3 hidden assumptions inside my question.\n';
    socraticContent += '2. For each, state how plausible it is and what would falsify it.\n';
    socraticContent += '3. Then answer the question — but answer it conditional on which assumptions hold.\n';
    socraticContent += '4. End with the single follow-up question I should be asking instead.';
    strategies.socratic = {
      type: 'socratic',
      label: 'Socratic Probe',
      description: 'Reframes as a Socratic dialogue — surfaces hidden assumptions and the better question to ask',
      content: socraticContent
    };

    // ── ADVERSARIAL (hostile-reviewer framing) ────────────────────────────
    var adversarialContent = '';
    adversarialContent += 'Your answer to the following will be reviewed line-by-line by a hostile expert ';
    adversarialContent += 'whose job is to find any error, omission, or unsupported claim. ';
    adversarialContent += 'Write the answer that survives that review.\n\n';
    adversarialContent += 'Question: ' + analysis.intent + '\n\n';
    adversarialContent += 'Before delivering, internally simulate the hostile review and pre-fix everything they would object to. ';
    adversarialContent += 'If you cannot defend a claim, drop it.';
    strategies.adversarial = {
      type: 'adversarial',
      label: 'Adversarial Review',
      description: 'Frames the answer as needing to survive a hostile expert review — kills sloppiness',
      content: adversarialContent
    };

    // ── TOURNAMENT (3-candidate then judge) ───────────────────────────────
    var tournamentContent = '';
    tournamentContent += 'Run a mini tournament on this question — do not just answer once.\n\n';
    tournamentContent += 'Question: ' + analysis.intent + '\n\n';
    tournamentContent += 'Step 1 — Generate 3 distinct candidate answers (A, B, C). They must take genuinely different angles, not paraphrases of each other.\n';
    tournamentContent += 'Step 2 — Score each on (correctness, robustness, usefulness) with one-line justifications.\n';
    tournamentContent += 'Step 3 — Pick the winner and produce the *final* answer based on it (incorporating any salvageable insight from the losers).\n';
    tournamentContent += 'Output: only the final winning answer — but show the scoring step briefly so I can see the work.';
    strategies.tournament = {
      type: 'tournament',
      label: 'Tournament',
      description: 'Forces 3 distinct candidate answers, scored and judged — surfaces the strongest',
      content: tournamentContent
    };

    // ── CONTRARIAN (steel-man-the-opposite) ───────────────────────────────
    var contrarianContent = '';
    contrarianContent += 'Before answering my question conventionally, do the contrarian pass first.\n\n';
    contrarianContent += 'Question: ' + analysis.intent + '\n\n';
    contrarianContent += 'Pass 1 — Steel-man the strongest case AGAINST the conventional answer (one paragraph, no straw men).\n';
    contrarianContent += 'Pass 2 — Identify what the contrarian view gets right that conventional wisdom misses.\n';
    contrarianContent += 'Pass 3 — Now give the actual answer, but with the contrarian insights folded in.';
    strategies.contrarian = {
      type: 'contrarian',
      label: 'Contrarian Pass',
      description: 'Steel-mans the opposite first, then folds those insights into the conventional answer',
      content: contrarianContent
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
  //
  // Runs three sequential, *targeted* passes over an already-enhanced prompt
  // instead of a single generic re-wrap:
  //
  //   PASS 1 — VERIFY:  force chain-of-verification on every factual claim
  //   PASS 2 — SHARPEN: replace vague language with concrete numbers / specifics
  //   PASS 3 — DEHEDGE: strip throat-clearing, "it depends", weasel words
  //
  // Plus task-specific hardening at the end.

  function chainEnhance(enhanced, depth, mode) {
    var a = analyze(enhanced);
    var out = '';

    out += '════════════════════════════════════════════════════\n';
    out += '   CHAIN ENHANCEMENT — 3-PASS REFINEMENT PROTOCOL\n';
    out += '════════════════════════════════════════════════════\n\n';

    out += 'You will respond to the enhanced prompt below. Before you do, run the\n';
    out += 'following three internal passes (silently — output only the final answer):\n\n';

    out += 'PASS 1 — VERIFY:\n';
    out += '• Draft your initial answer.\n';
    out += '• For every factual or causal claim, ask: "what would falsify this?"\n';
    out += '• If you cannot answer that question precisely, either qualify the claim or remove it.\n\n';

    out += 'PASS 2 — SHARPEN:\n';
    out += '• Re-read the draft for vague language ("some", "many", "often", "usually", "generally", "tend to").\n';
    out += '• Replace each with concrete numbers, ranges, or named examples.\n';
    out += '• Replace abstract adjectives ("good", "fast", "scalable") with measurable criteria.\n\n';

    out += 'PASS 3 — DEHEDGE:\n';
    out += '• Strip throat-clearing openers ("Certainly!", "Of course", "I would be happy to").\n';
    out += '• Strip undefended hedges ("might", "could", "potentially", "it depends") UNLESS you immediately name what the dependency is.\n';
    out += '• Strip restated questions and generic disclaimers.\n\n';

    out += '──── ENHANCED PROMPT ────\n\n';
    out += enhanced;
    out += '\n\n──── END ENHANCED PROMPT ────\n\n';

    out += 'TASK-SPECIFIC HARDENING:\n';
    if (a.task === 'code') {
      out += '• Include explicit error-handling and edge-case requirements.\n';
      out += '• Specify testing expectations (unit / integration / property-based as appropriate).\n';
      out += '• Define realistic performance and complexity targets.\n';
      out += '• Flag any security-sensitive surface (auth, secrets, input validation, deserialization).\n';
    } else if (a.task === 'research') {
      out += '• Prefer primary sources over secondary commentary; name them.\n';
      out += '• Attach a confidence level (HIGH / MEDIUM / LOW) to every non-trivial claim.\n';
      out += '• Surface the strongest counter-evidence and explain why it does or does not change the conclusion.\n';
    } else if (a.task === 'creative') {
      out += '• Show emotion through specifics — never summarize feeling.\n';
      out += '• Sustain consistent voice and POV across the whole piece.\n';
      out += '• Demand narrative tension in every section — if a section has none, cut it.\n';
    } else if (a.task === 'analysis') {
      out += '• Separate observation from interpretation with explicit labels.\n';
      out += '• Identify root causes, not symptoms — keep asking "why?" until you bottom out.\n';
      out += '• Each recommendation must have an owner, a metric, and a deadline.\n';
    } else if (a.task === 'strategy') {
      out += '• Compare at least three viable options with quantified trade-offs.\n';
      out += '• Map second- and third-order effects.\n';
      out += '• Define leading indicators that the chosen path is working.\n';
    } else if (a.task === 'persuade') {
      out += '• Address the strongest objection preemptively.\n';
      out += '• Replace adjectives with evidence (numbers, named cases, testimonials).\n';
      out += '• Close with a single, unambiguous call to action.\n';
    } else {
      out += '• Verify every claim is independently substantiable.\n';
      out += '• Ensure each section produces an actionable takeaway.\n';
      out += '• Challenge any assumption embedded in the prompt itself before accepting it.\n';
    }

    if (depth >= 4) {
      out += '\nFINAL GATE: Before delivering, name one thing this answer might be wrong about, and what evidence would change your mind.';
    }

    return out;
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

    // Two-stage intent extraction:
    //   Stage A — REPEATEDLY peel filler/modal/pleasantry patterns until no
    //             more apply.  These are pure filler with no informational
    //             content, so cascading them is safe and reduces messy
    //             openers like "hey can you please ..." to a clean stem.
    //   Stage B — Peel AT MOST ONE leading content-bearing imperative
    //             ("explain", "build", "tell me about", etc.) — the same
    //             single-pass behavior as v9.2.  This avoids over-stripping
    //             content verbs, which would degrade every injection
    //             strategy that embeds analysis.intent (System / Chain /
    //             Expert / Socratic / Adversarial / Tournament / Contrarian).
    var intent = raw;
    var prevIntent;
    var fillerPatterns = [
      /^(please\s+|hey\s+|hi\s+|hello\s+|yo\s+|so\s+|um+\s+|uh+\s+|ok\s+|okay\s+)+/i,
      /^(can you\s+|could you\s+|would you\s+|will you\s+)+/i,
      /^(i\s+(?:want|need|would\s+like)(?:\s+you)?(?:\s+to)?\s+|i'?d\s+like(?:\s+you)?(?:\s+to)?\s+)/i
    ];
    do {
      prevIntent = intent;
      fillerPatterns.forEach(function (re) { intent = intent.replace(re, ''); });
    } while (intent !== prevIntent);
    intent = intent.replace(
      /^(help me\s+(?:with\s+|to\s+)?|write me\s+|create\s+a?\s*|make\s+a?\s*|generate\s+a?\s*|give me\s+a?\s*|show me\s+|tell me\s+(?:about\s+)?|explain\s+(?:to me\s+)?(?:what\s+)?|describe\s+|analyze\s+|build\s+a?\s*|implement\s+a?\s*|write\s+a?\s*|what\s+is\s+|what\s+are\s+|how\s+does\s+|how\s+do\s+|how\s+to\s+|why\s+(?:does\s+|is\s+|are\s+)?)/i,
      ''
    );
    intent = intent
      .replace(/\s*(please|thanks|thank you|thx|cheers)\s*[!.?]*$/i, '')
      .trim() || raw;

    var subject = intent.split(/\s+/).slice(0, 10).join(' ');

    var amb = 0;
    if (wc < 3) amb += 3;
    else if (wc < 6 && !/\b(code|explain|write|build|analyze|create|make|how|what|why|summarize|list|compare|design|implement|fix|debug|generate|describe|calculate|solve|plan|review|draft|improve)\b/i.test(raw)) amb += 2;
    if (!context.length && !constraints.length && wc < 5) amb += 1;

    var fp = raw.split('').reduce(function (h, c) { return (((h << 5) - h) + c.charCodeAt(0)) | 0; }, 0).toString(36);

    var entities = (typeof rwEntities === 'function') ? rwEntities(raw) : { tech: [], files: [], numbers: [] };

    return { raw: raw, intent: intent, subject: subject, task: task, domains: domains, complexity: complexity, audience: audience, fmt: fmt, tone: tone, constraints: constraints, negations: negations, context: context, entities: entities, wc: wc, amb: amb, fp: fp };
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
  function buildHailMary(a, depth, rewrittenTask) {
    var role = pickRole(a);
    var taskContent = rewrittenTask || a.intent;

    var prompt = '[SYSTEM ROLE: AUTONOMOUS REASONING AGENT]\n\n';
    prompt += role + '\n\n';
    prompt += 'TASK: ' + taskContent + '\n\n';

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
  function buildManus(a, depth, rewrittenTask) {
    var role = pickRole(a);
    var taskContent = rewrittenTask || a.intent;

    var prompt = '[SYSTEM ROLE: ORCHESTRATION AGENT]\n\n';
    prompt += role + '\n\n';
    prompt += 'OBJECTIVE: ' + taskContent + '\n\n';

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
  function buildJuma(a, depth, rewrittenTask) {
    var role = pickRole(a);
    var taskContent = rewrittenTask || a.intent;

    var prompt = '[SYSTEM ROLE: MULTI-PERSPECTIVE REASONING AGENT]\n\n';
    prompt += role + '\n\n';
    prompt += 'QUERY: ' + taskContent + '\n\n';

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

  // ── PROMPT REWRITER ────────────────────────────────────────────────────────
  //
  // Transforms a raw prompt into a polished, authoritative, copy-paste-ready
  // task description. This is *not* a thin string template — it runs a real
  // multi-stage pipeline:
  //
  //   1. NORMALIZE   — strip pleasantries/filler, upgrade weak verbs
  //   2. ENRICH      — replace vague quantifiers/adjectives with crisp ones
  //   3. OPENING     — pick a task-specific authoritative imperative
  //   4. DELIVERABLES — concrete, task-specific list of outputs
  //   5. SPECIFICS   — depth/audience-tuned specificity demands
  //   6. RULES       — weave constraints + forbidden patterns into prose
  //   7. VERIFY      — depth-tuned verification clauses
  //
  // The output is one flowing block (no "| Must:" tag salad), suitable to be
  // dropped in as the TASK content of any of the framework builders below.

  // Hyphen-safe word boundary helpers.  JavaScript's \b treats "-" as a word
  // boundary, so /\bjust\b/.test("just-in-time") is true and would mangle
  // hyphenated compound terms.  rwTokenRe wraps a list of literal tokens with
  // negative-lookbehind/lookahead assertions that reject neighbouring word
  // chars *and* hyphens, so "just-in-time", "pretty-printed", "good-natured",
  // etc. survive untouched.
  function rwTokenRe(tokens) {
    return new RegExp('(?<![\\w-])(?:' + tokens.join('|') + ')(?![\\w-])', 'gi');
  }

  function rwNormalize(t) {
    if (!t) return '';
    var x = String(t);
    // Strip leading/trailing pleasantries
    x = x.replace(/^(please\s+|hey\s+|hi\s+|hello\s+|yo\s+)+/gi, '');
    x = x.replace(/\s*(please|thanks|thank you|thx|cheers)\s*[!.?]*\s*$/gi, '');
    // Strip "help me (with|to) ..." openers up front so the stealth + main
    // rewriters don't end up restating "help me debug ..." as the subject.
    x = x.replace(/^(?:help\s+me\s+(?:with\s+|to\s+)?|write\s+me\s+(?:a\s+|an\s+|some\s+)?|give\s+me\s+(?:a\s+|an\s+|some\s+)?|show\s+me\s+(?:a\s+|an\s+|how\s+to\s+)?|tell\s+me\s+(?:about\s+|how\s+to\s+)?)/i, '');
    // Strip mid-sentence "please" entirely — it has no informational content.
    // Use the hyphen-safe matcher so words like "yes-please-thanks-X" tags
    // aren't accidentally mangled (uncommon, but cheap insurance).
    x = x.replace(rwTokenRe(['please']), '');
    // Soften filler hedges (hyphen-safe so "just-in-time", "really-fast", etc. are preserved).
    x = x.replace(rwTokenRe([
      'maybe', 'perhaps', 'kind ?of', 'sort of', 'just', 'basically',
      'essentially', 'literally', 'actually', 'really', 'very', 'quite',
      'rather', 'pretty', 'somewhat'
    ]), '');
    // Verb / phrasing upgrades.  These are multi-word phrases that almost
    // never appear inside a hyphenated compound, so plain \b is fine here.
    var verbMap = [
      [/\b(can|could|would|will)\s+you\s+/gi, ''],
      [/\bi\s+(?:want|need|would\s+like)(?:\s+you)?(?:\s+to)?\s+/gi, ''],
      [/\bi'?d\s+like(?:\s+you)?(?:\s+to)?\s+/gi, ''],
      [/\btell me about\b/gi, 'explain in depth'],
      [/\bwrite something about\b/gi, 'compose a comprehensive piece on'],
      [/\bhelp me with\b/gi, 'guide me through'],
      [/\bgive me\b/gi, 'produce'],
      [/\bshow me\b/gi, 'demonstrate'],
      [/\blook at\b/gi, 'analyze'],
      [/\bgo over\b/gi, 'review'],
      [/\bcheck if\b/gi, 'verify whether'],
      [/\bthink about\b/gi, 'reason rigorously about'],
      [/\bfind out\b/gi, 'determine'],
      [/\bfigure out\b/gi, 'work out'],
      [/\bdo a\b/gi, 'execute a']
    ];
    verbMap.forEach(function (m) { x = x.replace(m[0], m[1]); });
    // Collapse whitespace + tidy punctuation
    x = x.replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
    if (x.length > 0) x = x.charAt(0).toUpperCase() + x.slice(1);
    return x;
  }

  function rwEnrich(t) {
    if (!t) return '';
    var x = String(t);
    // Single-word enrichments — must be hyphen-safe so "good-natured",
    // "simple-minded", "complex-valued", "fast-track", etc. survive.
    var singleWord = [
      [['some', 'a few', 'a couple of'],                    '3–5 distinct'],
      [['many', 'lots of', 'plenty of', 'a bunch of', 'tons of'], '7 or more'],
      [['quickly', 'fast'],                                  'efficiently'],
      [['good', 'nice', 'great', 'cool', 'awesome'],         'high-quality'],
      [['bad', 'terrible', 'awful'],                         'low-quality'],
      [['simple', 'easy'],                                   'minimal-friction'],
      [['complex', 'complicated'],                           'multi-layered'],
      [['detailed', 'thorough'],                             'comprehensive'],
      [['stuff'],                                            'specific elements'],
      [['things'],                                           'concrete items'],
      [['info'],                                             'information'],
      [['huge', 'massive'],                                  'substantial']
    ];
    singleWord.forEach(function (e) {
      x = x.replace(rwTokenRe(e[0]), e[1]);
    });
    // Multi-word phrase: safe with plain \b
    x = x.replace(/\bawful lot\b/gi, 'substantial amount');
    return x;
  }

  // Pull out the concrete, content-bearing nouns the user actually typed —
  // languages, frameworks, file types, named tools, numbers — so the
  // rewriter can anchor its expansion in the user's domain rather than
  // producing a generic templated paragraph.
  function rwEntities(raw) {
    if (!raw) return { tech: [], files: [], numbers: [] };
    var r = String(raw);
    var tech = [];
    var techPatterns = [
      // Languages
      /\b(python|javascript|typescript|java|kotlin|swift|rust|go|golang|c\+\+|c#|csharp|ruby|php|scala|elixir|haskell|clojure|sql|bash|shell|zsh|powershell|html|css|sass|scss|less|graphql)\b/gi,
      // Frameworks / libraries
      /\b(react|vue|angular|svelte|next\.?js|nuxt|gatsby|django|flask|fastapi|spring|rails|laravel|express|nest\.?js|tensorflow|pytorch|keras|numpy|pandas|matplotlib|scikit[- ]learn|huggingface|langchain|tailwind|bootstrap|jquery|redux|zustand|prisma|sequelize|mongoose|hibernate|openai|anthropic)\b/gi,
      // Infra / tools
      /\b(docker|kubernetes|k8s|terraform|ansible|helm|jenkins|github actions|gitlab ci|circleci|aws|gcp|azure|vercel|netlify|cloudflare|fly\.io|heroku|s3|ec2|lambda|rds|dynamodb|firestore|firebase|supabase|postgres|postgresql|mysql|mariadb|sqlite|mongodb|redis|elasticsearch|kafka|rabbitmq|nginx|apache|grpc|rest|graphql|websocket)\b/gi,
      // Models / AI
      /\b(gpt-?[345o]|claude|gemini|llama|mistral|deepseek|grok|stable diffusion|midjourney|dall[- ]?e|whisper)\b/gi
    ];
    techPatterns.forEach(function (re) {
      var m;
      while ((m = re.exec(r)) !== null) {
        var v = m[1] || m[0];
        var canon = v.toLowerCase();
        if (!tech.some(function (t) { return t.toLowerCase() === canon; })) tech.push(v);
        if (tech.length >= 6) break;
      }
    });

    // File types / extensions and concrete artifacts.  Prefer named files
    // (e.g. churn.csv, README.md) over bare extensions (.csv).  Only emit
    // a bare extension when no named file with that extension was found,
    // so we don't pollute output with both "churn.csv" and ".csv".
    var files = [];
    var fileMatches = r.match(/\b\w{1,20}\.(?:csv|tsv|json|jsonl|xml|yaml|yml|toml|ini|env|md|txt|log|html|css|js|ts|tsx|jsx|py|rb|go|rs|java|kt|swift|c|cpp|h|hpp|sh|sql|pdf|docx|xlsx|png|jpg|svg|mp4|wav|mp3)\b/gi) || [];
    fileMatches.forEach(function (f) {
      var canon = f.toLowerCase();
      if (!files.some(function (x) { return x.toLowerCase() === canon; })) files.push(f);
    });
    var seenExts = {};
    files.forEach(function (f) {
      var dot = f.lastIndexOf('.');
      if (dot >= 0) seenExts[f.slice(dot).toLowerCase()] = true;
    });
    var extOnly = r.match(/\.(?:csv|tsv|json|jsonl|xml|yaml|yml|toml|html|css|js|ts|tsx|jsx|py|rb|go|rs|java|kt|swift|c|cpp|h|hpp|sh|sql|pdf|docx|xlsx)\b/gi) || [];
    extOnly.forEach(function (f) {
      var canon = f.toLowerCase();
      if (seenExts[canon]) return; // covered by a named file already
      if (!files.some(function (x) { return x.toLowerCase() === canon; })) files.push(f);
    });
    files = files.slice(0, 5);

    // Concrete numbers / quantities (years, counts, percentages, sizes)
    var numbers = [];
    var numMatches = r.match(/\b\d{1,4}(?:\.\d+)?\s*(?:%|percent|years?|months?|weeks?|days?|hours?|minutes?|seconds?|ms|s|kb|mb|gb|tb|users?|requests?|rps|qps|rows?|columns?|records?|items?|tokens?|chars?|lines?|files?|threads?|cores?|gpus?|cpus?)\b/gi) || [];
    numMatches.forEach(function (n) {
      if (numbers.indexOf(n) === -1 && numbers.length < 5) numbers.push(n);
    });

    return { tech: tech, files: files, numbers: numbers };
  }

  // Concept library — keyword matches in the user's raw prompt drive
  // task-specific elaborations.  Each concept contributes 3–6 concrete
  // sub-requirements that the rewritten prompt must address.  This is what
  // turns "write me a python script to dedupe a CSV" into a paragraph that
  // explicitly mentions CLI args, encoding, quoted-field parsing, header
  // handling, malformed-row recovery, and large-file streaming — instead
  // of a generic "Engineer X to a production-grade standard."
  var RW_CONCEPTS = [
    // ── code / engineering ────────────────────────────────────────────
    { match: /\b(script|cli|command[- ]?line|tool|utility)\b/i, label: 'CLI tool',
      elabs: ['CLI argument parsing with --help and sensible defaults',
              'exit codes (0 = success, distinct non-zero codes per error class)',
              '--dry-run / --verbose flags where they make sense',
              'graceful handling of Ctrl-C / SIGTERM mid-operation'] },
    { match: /\b(function|method|procedure|routine)\b/i, label: 'function',
      // Only fire for code/general — "the function f(x) = ..." in a math
      // context shouldn't get input/output-contract elabs.
      tasks: ['code', 'general'],
      elabs: ['explicit input and return-type contract',
              'fail-fast input validation with informative error messages',
              'pure where possible; document any side effects or I/O',
              'edge-case behavior: empty, null, boundary, concurrent, malformed'] },
    { match: /\b(class|object|struct|entity|component)\b/i, label: 'type',
      tasks: ['code', 'general'],
      elabs: ['public surface area and invariants stated up front',
              'constructor preconditions',
              'distinction between mutating and pure methods',
              'equality, hashing, and serialization semantics'] },
    { match: /\b(test|tests|testing|unit\s+test|integration\s+test|e2e|qa)\b/i, label: 'tests',
      elabs: ['arrange/act/assert structure, one behavior per test',
              'realistic test data — not random gibberish',
              'failure messages that say expected vs. actual concretely',
              'no shared mutable state between tests',
              'coverage of the boring edge cases (empty, single, very large)'] },
    { match: /\b(refactor|cleanup|restructure|tidy)\b/i, label: 'refactor',
      elabs: ['behavior preservation: every existing test must still pass',
              'small, independently shippable steps',
              'a before/after diff that is easy to review',
              'no opportunistic feature additions inside the refactor'] },
    { match: /\b(debug|debugging|bug|issue|fix|broken|crash|error)\b/i, label: 'debug',
      elabs: ['minimal reproduction steps',
              'expected vs. observed behavior, exactly',
              'narrowed-down hypothesis with the evidence that supports it',
              'the smallest fix that addresses the root cause (not the symptom)',
              'a regression test that fails before the fix and passes after'] },

    // ── data formats ─────────────────────────────────────────────────
    { match: /\b(csv|tsv)\b/i, label: 'CSV',
      elabs: ['encoding handling (default utf-8 with errors="replace")',
              'quoted-field parsing for embedded commas and newlines',
              'header detection or an explicit header argument',
              'malformed-row recovery: warn-and-skip by default, --strict to fail fast',
              'streaming for files larger than memory'] },
    { match: /\b(json|jsonl|ndjson)\b/i, label: 'JSON',
      elabs: ['schema validation up front',
              'clear error messages that point at the offending field path',
              'pretty-printed output with stable key ordering',
              'streaming parser for jsonl / very large payloads'] },
    { match: /\b(yaml|yml|toml)\b/i, label: 'config file',
      elabs: ['schema validation with helpful error locations',
              'support for environment-variable interpolation if used',
              'documented required vs. optional fields'] },
    { match: /\b(xml|html|dom|xpath)\b/i, label: 'markup',
      elabs: ['namespace handling',
              'whitespace-significance assumptions stated explicitly',
              'a real parser — never regex — for nested structures'] },

    // ── networking / APIs ─────────────────────────────────────────────
    { match: /\b(api|endpoint|rest|graphql|webhook|http|grpc)\b/i, label: 'API',
      elabs: ['authentication and authorization model',
              'rate-limit handling with exponential backoff and jitter',
              'idempotency tokens for safe retries',
              'request and response schema validation',
              'structured error responses with stable error codes'] },
    { match: /\b(websocket|sse|long[- ]poll|streaming)\b/i, label: 'streaming',
      elabs: ['reconnection strategy with backoff',
              'message ordering and dedup guarantees',
              'backpressure handling',
              'heartbeat / liveness signal'] },
    { match: /\b(scrape|scraping|crawler|crawl|spider)\b/i, label: 'scraper',
      elabs: ['respect for robots.txt and rate limits',
              'realistic User-Agent and identifying contact email',
              'retry on transient failures only; do not hammer 4xx',
              'structured output schema'] },

    // ── data / storage ───────────────────────────────────────────────
    { match: /\b(database|db|postgres|postgresql|mysql|mariadb|mongodb|sqlite|redis|dynamodb|cassandra)\b/i, label: 'database',
      elabs: ['transaction boundaries and isolation level',
              'parameterized queries — zero string-concatenated SQL',
              'index strategy aligned with the access pattern',
              'connection pooling and timeout settings',
              'migration plan with explicit rollback'] },
    { match: /\b(query|queries|sql)\b/i, label: 'query',
      elabs: ['the exact result schema (column names, types)',
              'estimated cardinality / row count',
              'index requirements',
              'EXPLAIN-plan or query-plan considerations'] },
    { match: /\b(dedup|deduplicate|duplicate|unique|distinct)\b/i, label: 'dedup',
      elabs: ['definition of "duplicate" — by which columns / fields',
              'tie-break: which row wins (first / last / specific column max)',
              'order-preservation guarantee or explicit non-guarantee',
              'memory profile: in-memory hash vs. external sort'] },
    { match: /\b(etl|pipeline|ingest|backfill|batch)\b/i, label: 'pipeline',
      elabs: ['idempotency and resumability',
              'batch size and pacing',
              'failure isolation — one bad record does not kill the run',
              'observability: per-stage row counts and error rates'] },

    // ── infra / ops ──────────────────────────────────────────────────
    { match: /\b(deploy|deployment|rollout|release|ship)\b/i, label: 'deployment',
      elabs: ['environment matrix (dev / staging / prod)',
              'rollback plan executable in under 5 minutes',
              'health checks and smoke tests',
              'feature-flag or canary strategy',
              'observability: metrics, logs, traces from day one'] },
    { match: /\b(docker|container|containerize|dockerfile)\b/i, label: 'container',
      elabs: ['minimal base image with a pinned tag (no :latest)',
              'non-root user',
              'liveness and readiness probes',
              'resource requests and limits',
              'image-layer cache friendliness — slow-changing layers first'] },
    { match: /\b(kubernetes|k8s|helm|kustomize)\b/i, label: 'kubernetes',
      elabs: ['namespace strategy',
              'resource requests and limits',
              'pod disruption budgets',
              'horizontal pod autoscaling thresholds',
              'secrets via a real secrets manager — not configmaps'] },
    { match: /\b(server|service|daemon|microservice|backend)\b/i, label: 'service',
      elabs: ['startup ordering and graceful shutdown',
              'health endpoint',
              'structured logging with correlation IDs',
              'metrics for latency / error rate / saturation',
              'configurable port and bind address'] },
    { match: /\b(replication|cluster|high[- ]availability|failover|ha)\b/i, label: 'HA',
      elabs: ['leader election and split-brain handling',
              'replication-lag monitoring and alert threshold',
              'failover runbook with named owner',
              'backup-and-restore procedure tested at least quarterly'] },
    { match: /\b(cache|caching|cdn)\b/i, label: 'cache',
      elabs: ['cache key shape and TTL',
              'invalidation strategy',
              'cold-start behavior',
              'stampede protection (single-flight or jitter)'] },

    // ── security ─────────────────────────────────────────────────────
    { match: /\b(security|secure|auth|authentication|authorization|oauth|jwt|saml|sso|2fa|mfa)\b/i, label: 'security',
      elabs: ['threat model up front',
              'principle of least privilege',
              'secrets handling — none in source, all rotated',
              'token expiration and rotation strategy',
              'audit logging of every privileged action'] },
    { match: /\b(encrypt|encryption|crypto|hash|hashing|tls|ssl)\b/i, label: 'crypto',
      elabs: ['the exact algorithm and parameters (no rolling your own)',
              'key management: where keys live, how they rotate',
              'IV/nonce uniqueness guarantee',
              'constant-time comparison where relevant'] },

    // ── performance ──────────────────────────────────────────────────
    { match: /\b(performance|optimize|optimization|fast|slow|latency|throughput|benchmark|profile|profiling)\b/i, label: 'performance',
      elabs: ['baseline measurement before any change',
              'a single concrete target (e.g., p95 latency, RPS, memory)',
              'instrumentation strategy',
              'profiling method that points at evidence, not guesses',
              'validation that the optimization actually moved the metric'] },

    // ── migration / change management ────────────────────────────────
    { match: /\b(migration|migrate|upgrade|port|rewrite)\b/i, label: 'migration',
      elabs: ['schema diff and data diff documented',
              'downtime budget',
              'batch size and pacing',
              'idempotency and resumability',
              'rollback plan and a forward-fix plan'] },

    // ── ML / AI ──────────────────────────────────────────────────────
    { match: /\b(ml|machine\s+learning|neural\s+net(?:work)?|llm|fine[- ]?tune|fine[- ]?tuning|train(?:ing)?\s+(?:a|the|on|loop|set|data)|(?:ml|ai|llm)\s+model|model\s+(?:training|tuning|inference|evaluation|architecture)|deep\s+learning|transformer)\b/i, label: 'ML',
      elabs: ['dataset and split (train / validation / test)',
              'evaluation metric and a target number',
              'a baseline to beat',
              'training-time and compute budget',
              'failure-mode analysis on the validation set'] },
    { match: /\b(prompt|prompting|few[- ]shot|chain[- ]of[- ]thought|cot|rag|retrieval)\b/i, label: 'prompt',
      elabs: ['target task framed unambiguously',
              'output format (schema or worked example)',
              '2–3 calibrated few-shot examples spanning easy and edge cases',
              'evaluation rubric for output quality'] },
    { match: /\b(embedding|embeddings|vector|semantic\s+search)\b/i, label: 'embeddings',
      elabs: ['embedding model and dimension',
              'similarity metric (cosine / dot / euclidean)',
              'index choice (HNSW / IVF / flat) and recall target',
              'chunking strategy for long documents'] },

    // ── writing / creative ───────────────────────────────────────────
    { match: /\b(story|fiction|tale|narrative|novella|novel|chapter)\b/i, label: 'story',
      elabs: ['POV and tense (first / third-limited / omniscient)',
              'an inciting incident in the first paragraph',
              'sensory grounding in 2+ senses per scene',
              'one specific, original image per scene — no clichés',
              'consistent voice and emotional through-line'] },
    { match: /\b(poem|poetry|verse|sonnet|haiku|stanza)\b/i, label: 'poem',
      elabs: ['form and meter (or explicitly free verse)',
              'a single dominant image or metaphor',
              'precise diction; cut every word that does not pull weight',
              'a turn / volta / shift'] },
    { match: /\b(essay|article|blog|post|column|op[- ]?ed)\b/i, label: 'essay',
      elabs: ['a lede that earns the next paragraph',
              'one clear thesis stated up front',
              'evidence — not just opinion — for every non-trivial claim',
              'a memorable closing line'] },
    { match: /\b(email|reply|response|memo)\b/i, label: 'message',
      // "message" / "note" alone are too ambiguous (e.g., "a message in a
      // bottle", "a note on conventions") so we require a sharper trigger.
      tasks: ['creative', 'persuade', 'general', 'howto', 'summarize'],
      elabs: ['subject line that previews the ask',
              'one paragraph per idea',
              'one explicit ask or call to action',
              'tone calibrated to the recipient relationship'] },
    { match: /\b(speech|talk|presentation|pitch|keynote)\b/i, label: 'talk',
      elabs: ['the single sentence the audience must remember',
              'opening hook (story, question, or surprising fact)',
              'three load-bearing points, no more',
              'a call to action or single ask at the end'] },

    // ── analysis / strategy ─────────────────────────────────────────
    { match: /\b(report|summary|brief)\b/i, label: 'report',
      elabs: ['executive-readable TL;DR up top',
              'evidence section with sources',
              'recommendation section',
              'open questions and next steps'] },
    { match: /\b(analysis|analyse|analyze|study|research|investigation)\b/i, label: 'analysis',
      elabs: ['explicit hypothesis or question',
              'data sources and selection method',
              'methodology, repeatable by a peer',
              'limitations and threats to validity',
              'distinction between correlation and causation'] },
    { match: /\b(strategy|plan|roadmap|playbook|gtm|go[- ]to[- ]market)\b/i, label: 'strategy',
      elabs: ['the goal and explicit non-goals',
              '2–3 alternatives genuinely considered',
              'sequencing and milestones',
              'leading indicators of success',
              'kill criteria — when do we stop?'] },
    { match: /\b(decision|recommendation|choice|pick|choose|vs\.?|versus)\b/i, label: 'decision',
      elabs: ['decision criteria, weighted',
              'options scored against the criteria',
              'the recommended option in one sentence',
              'risks of the recommendation',
              'one-way vs. two-way door framing'] },
    { match: /\b(audit|pentest|security\s+review|code\s+review|smart\s+contract|vulnerability\s+(?:scan|assessment))\b/i, label: 'audit',
      elabs: ['the explicit checklist or framework being applied (OWASP, SLSA, etc.)',
              'severity and exploitability rating per finding (CVSS or equivalent)',
              'concrete reproduction or proof-of-concept for each finding',
              'remediation recommendation for every finding',
              'a "no-issues-found" line for areas reviewed and cleared'] },
    { match: /\b(diagnose|diagnosis|root[- ]cause|rca|postmortem|post[- ]mortem)\b/i, label: 'RCA',
      elabs: ['timeline of the incident with evidence',
              'the proximate cause vs. the contributing factors',
              'the smallest change that would have prevented it',
              'action items with named owners and due dates'] },

    // ── product / business ──────────────────────────────────────────
    { match: /\b(churn|retention|engagement|nps|csat|funnel|conversion)\b/i, label: 'metrics',
      elabs: ['the exact metric definition (numerator / denominator / window)',
              'segmentation (cohort, plan, geo, channel)',
              'a comparison baseline (prior period, control group)',
              'the practical-significance threshold, not just statistical'] },
    { match: /\b(pricing|price|plan|tier|monetiz)\b/i, label: 'pricing',
      elabs: ['the value-metric the price scales on',
              'comparison to 2–3 alternatives in the market',
              'price-anchoring strategy',
              'expected impact on retention and conversion'] },
    { match: /\b(hire|hiring|recruit|interview|onboard)\b/i, label: 'hiring',
      elabs: ['scope and seniority of the role',
              'the top 3 outcomes the hire owns',
              'sourcing channels',
              'interview signal: what each round is testing'] },

    // ── design ──────────────────────────────────────────────────────
    { match: /\b(image|picture|photo|graphic|logo|illustration|render)\b/i, label: 'image',
      elabs: ['composition and focal point',
              'palette and lighting',
              'reference / mood-board influences',
              'output dimensions, format, and aspect ratio'] },
    { match: /\b(ui|ux|wireframe|mockup|prototype|layout|design\s+(?:system|spec|review|doc))\b/i, label: 'UI/UX',
      // Bare "design" is too broad ("design a JWT auth flow"); require a
      // more specific UI/UX trigger.
      elabs: ['the user job-to-be-done',
              'happy path in 3 screens or fewer',
              'error and empty states',
              'accessibility: keyboard, screen reader, contrast'] },

    // ── math ────────────────────────────────────────────────────────
    // "series" / "limit" / "matrix" / "vector" alone are too ambiguous
    // ("Series A funding", "rate limit", "movie matrix", "vector graphics")
    // so they must be paired with a math context word.
    { match: /\b(integral|integrate|derivative|differentiate|antiderivative|partial\s+derivative|taylor\s+series|maclaurin\s+series|fourier\s+series|power\s+series|infinite\s+series|matrix\s+(?:multiplication|inverse|determinant|product|equation)|eigenvalue|eigenvector|gradient|jacobian|hessian|tensor|vector\s+space|vector\s+field)\b/i, label: 'math',
      elabs: ['domain of definition stated explicitly',
              'every step justified by a named rule',
              'final answer verified by a second method',
              'units carried through the calculation'] },
    { match: /\b(probability|stochastic|random|expectation|variance|bayes)\b/i, label: 'probability',
      elabs: ['the sample space and event being computed',
              'independence vs. conditional assumptions stated',
              'a sanity check (estimation or simulation)'] }
  ];

  function rwElaborate(raw, a) {
    if (!raw) return [];
    var out = [];
    var seenLabels = {};
    var task = (a && a.task) || 'general';
    for (var i = 0; i < RW_CONCEPTS.length; i++) {
      var c = RW_CONCEPTS[i];
      if (seenLabels[c.label]) continue;
      // Concepts with an explicit task whitelist only fire when the
      // analyzed task is in the list — keeps "function" out of math
      // outputs and "message" out of "message-in-a-bottle" creative.
      if (c.tasks && c.tasks.indexOf(task) === -1) continue;
      if (c.match.test(raw)) {
        seenLabels[c.label] = true;
        for (var j = 0; j < c.elabs.length; j++) out.push(c.elabs[j]);
      }
      // Cap so we don't bury the user under 50 sub-requirements.  Stop
      // adding once we have plenty; the most-specific (earlier-matching)
      // concepts win.
      if (out.length >= 16) break;
    }
    // Trim to a useful working set (8 typical, 12 max for high-depth).
    var maxItems = (a && a.complexity === 'high') ? 12 : 8;
    return out.slice(0, maxItems);
  }

  function rwOpening(core, a, depth) {
    var openers = {
      code:       'Engineer',
      research:   'Investigate and synthesize',
      analysis:   'Analyze and diagnose',
      creative:   'Compose with craft',
      strategy:   'Strategize',
      persuade:   'Craft persuasive material on',
      howto:      'Guide me explicitly through',
      brainstorm: 'Generate a ranked, diverse set of ideas for',
      summarize:  'Distill',
      math:       'Solve and verify',
      general:    'Address with rigor'
    };
    var verb = openers[a.task] || openers.general;
    var subject = (core || a.intent || a.subject || a.raw || '').trim();
    // Strip order matters.  Question-form openers ("how to X", "what is Y")
    // must run FIRST — patterns like "how to build" hide a content-bearing
    // imperative ("build") that would otherwise survive the single-word verb
    // pass and end up double-stacked with the task-specific verb prepended
    // by rwOpening ("Engineer build a REST API"  ← wrong).  The optional
    // "(?:i|we|you)\s+" tail absorbs the implicit subject ("how do I X")
    // so we don't end up with a stray "I" / "we" at the start.
    subject = subject.replace(/^(?:how\s+(?:does|do|did|to|can|could|should|would|will)\s+(?:i|we|you|they|one)?\s*|what\s+(?:is|are|was|were|does|do|did|will|would|should)\s+(?:the\s+best\s+way\s+to\s+|i|we|you)?\s*|why\s+(?:does|do|did|is|are|was|were|will|would|should)\s+(?:i|we|you|they)?\s*|when\s+(?:does|do|did|is|are|will|would|should)\s+(?:i|we|you|they)?\s*|where\s+(?:does|do|did|is|are|can|could|will|should)\s+(?:i|we|you|they)?\s*|which\s+(?:is|are|was|were|does|do)?\s*|who\s+(?:is|are|was|were|does|do|did|created|wrote|built|invented|made)?\s*)/i, '');
    // Strip "(I/we/you) (want|need|would like) to" modal openers that
    // analyze's Stage A only partially handles (lowercase-i variants).
    subject = subject.replace(/^(?:i|we|you|they)\s+(?:want|need|would\s+like|have|wish|hope|plan|try|tried|attempted)\s+(?:to\s+)?/i, '');
    subject = subject.replace(/^(?:i|we|you|they)['’]?d\s+like\s+(?:to\s+)?/i, '');
    subject = subject.replace(/^let['’]?s\s+/i, '');
    // Strip leftover pronoun subjects ("I" / "we" / "you" / "they" / "one")
    // that may survive analyze's Stage B regex when it only matched the
    // wh-/aux-pair ("how do") without consuming the trailing pronoun.
    subject = subject.replace(/^(?:i|we|you|they|one)\s+/i, '');
    // Strip leftover "the/a (best|easiest|simplest|fastest|right|correct|proper)
    // way to" / "way of" / "method to" filler that analyze's "what is"
    // strip leaves behind.  Without this, "what is the best way to deploy X"
    // becomes "Engineer the best way to deploy X" (verb stacked on filler).
    subject = subject.replace(/^(?:the|a)\s+(?:best|easiest|simplest|fastest|right|correct|proper|recommended|preferred|standard|typical|usual|common)\s+(?:way|approach|method|process|technique|practice)\s+(?:to|of|for)\s+/i, '');
    subject = subject.replace(/^(?:the|a)\s+(?:way|approach|method|process)\s+(?:to|of|for)\s+/i, '');
    // Then strip multi-word leading imperatives (longest match wins) so we
    // don't end up with "Engineer me through writing X" or "Distill in depth Y".
    subject = subject.replace(/^(guide me through|explain in depth|reason rigorously about|verify whether|compose a comprehensive piece on|execute a|set up|spin up|stand up|roll out|put together|figure out|work out)\s+/i, '');
    // Finally strip single-word leading imperatives so we don't double-stack verbs.
    subject = subject.replace(/^(write|build|create|make|generate|implement|design|engineer|explain|analyze|find|tell|show|describe|develop|produce|compose|distill|guide|review|investigate|summarize|solve|brainstorm|persuade|strategize|determine|demonstrate|fix|debug|refactor|migrate|optimize|harden|deploy|test|compute|calculate|evaluate|compare|plan|draft|outline|prepare|propose|recommend|critique|edit|rewrite|translate)\s+/i, '');
    if (subject) { var firstWord = subject.split(/\s+/)[0]; if (!/^[A-Z]{2,}/.test(firstWord)) subject = subject.charAt(0).toLowerCase() + subject.slice(1); }
    var stake = '';
    if (depth >= 5) stake = ' to a research-defensible, expert-jury-grade standard';
    else if (depth >= 4) stake = ' to a production-grade, expert-defensible standard';
    else if (depth >= 3) stake = ' to a senior-practitioner standard';
    var open = verb + ' ' + subject + stake;
    if (!/[.!?]$/.test(open)) open += '.';
    return open;
  }

  function rwDeliverables(a, depth) {
    var bits = {
      code:       'Provide complete, runnable code (no stubs, no pseudocode), explicit error handling for invalid inputs, edge-case coverage (empty/null/boundary/concurrent/malformed), security hardening (input validation, secrets handling, auth boundaries), inline comments that explain rationale rather than syntax, a worked example with realistic data, and a brief note on time/space complexity.',
      research:   'Distinguish established consensus from active debate, cite mechanisms over correlations, name primary studies/sources where relevant, surface effect sizes and reproducibility caveats, and end with the strongest counter-evidence and what would change your conclusion.',
      analysis:   'Separate observation from interpretation, identify root causes (not just symptoms), quantify magnitude/confidence wherever possible, and produce specific, prioritized, owner-assignable recommendations.',
      creative:   'Lead with sensory specificity, sustain a consistent voice and emotional through-line, eliminate cliché and filler, and earn every word.',
      strategy:   'Map at least three viable options with quantified trade-offs, surface second-order effects, recommend a primary path with explicit risk-mitigation steps, and define leading indicators of success.',
      persuade:   'Open with a value-anchored hook, address the strongest objections preemptively, support claims with specific evidence, and close with one unambiguous call to action.',
      howto:      'List prerequisites, then numbered explicit steps with no skipped detail, troubleshooting for common failure modes, and verifiable success checks at the end.',
      brainstorm: 'Produce 5 conventional, 5 unconventional, and 3 wild-card ideas; for each: a one-sentence description, why it could work, the biggest risk, and a fast cheap test.',
      summarize:  'Lead with the single most important takeaway, then 3–5 supporting points ranked by importance, then necessary detail, ending with implications.',
      math:       'Show every step, justify each transformation, verify the final answer with a second independent method, and state the regime of validity.',
      general:    'Be specific, take a defensible position, and substantiate every non-trivial claim.'
    };
    return bits[a.task] || bits.general;
  }

  function rwSpecifics(a, depth) {
    var demands = [];
    if (a.complexity === 'high' || depth >= 4) {
      demands.push('Treat ambiguity as a design problem — explicitly state which assumptions you adopted and why');
    }
    if (a.audience === 'beginner') {
      demands.push('Define every non-obvious term on first use');
    } else if (a.audience === 'expert') {
      demands.push('Skip basics — go directly to non-trivial, expert-level distinctions');
    } else if (a.audience === 'developer') {
      demands.push('Be precise; show working code or concrete examples instead of describing them');
    } else if (a.audience === 'executive') {
      demands.push('Lead with the decision and its impact; relegate methodology to a brief appendix');
    }
    if (depth >= 3) {
      demands.push('Replace any vague quantifier ("some", "many", "often") with concrete numbers, ranges, or examples');
    }
    if (depth >= 4) {
      demands.push('For every recommendation, name at least one realistic failure mode');
    }
    if ((a.domains || []).length > 0) {
      demands.push('Use the precise domain terminology of ' + a.domains[0] + ' rather than colloquial paraphrase');
    }
    // Anchor in the user's actual nouns: if they mentioned specific
    // technologies, file types, or numbers, demand the answer engages with
    // those concrete things rather than abstracting over them.
    var ent = a.entities || { tech: [], files: [], numbers: [] };
    if (ent.tech.length) {
      demands.push('Engage with the specific technologies the user mentioned (' + ent.tech.slice(0, 4).join(', ') + ') by name — do not abstract over them');
    }
    if (ent.files.length) {
      demands.push('Treat the named artifacts (' + ent.files.slice(0, 3).join(', ') + ') as real, with realistic schema/content assumptions stated up front');
    }
    if (ent.numbers.length) {
      demands.push('Honor the concrete quantities the user gave (' + ent.numbers.slice(0, 3).join(', ') + ') — do not hand-wave them into "some" or "a few"');
    }
    if (!demands.length) return '';
    return demands.join('. ') + '.';
  }

  function rwRules(a, constraints, negations) {
    var bits = [];
    if (constraints.length) {
      bits.push('Hard requirements: ' + constraints.slice(0, 5).map(function (c) { return c.replace(/[.!?]+$/, ''); }).join('; ') + '.');
    }
    if (negations.length) {
      bits.push('Forbidden: ' + negations.slice(0, 5).map(function (n) { return n.replace(/[.!?]+$/, ''); }).join('; ') + '.');
    }
    return bits.join(' ');
  }

  function rwVerify(a, depth) {
    if (depth < 3) return '';
    var v = ['re-read the answer as if you were the implementer or reviewer who has to defend it'];
    if (depth >= 4) v.push('flag any claim below 80% confidence with the specific uncertainty');
    if (depth >= 4) v.push('list at least one thing this answer might be wrong about');
    if (depth >= 5) v.push('produce a brief self-audit naming the weakest link in your reasoning and what would falsify it');
    return 'Before finalizing, ' + v.join('; ') + '.';
  }

  // Task-aware "stealth" rewriter.  Builds a single tight paragraph that
  // reads as if a senior practitioner had hand-rewritten the prompt — no
  // headers, no bullets, no obvious scaffolding, but meaningfully different
  // from the input (not just the input with a "Be specific" suffix).
  // The shape is: <task verb> <subject> <task-specific demands woven into
  // prose>, with the user's actual named technologies / files / numbers
  // re-anchored so it never feels generic.
  function buildStealthRewrite(raw, a) {
    var clean = rwEnrich(rwNormalize(raw));
    // Strip whatever leading verb rwNormalize/Enrich produced so we can
    // prepend our own task-specific verb cleanly.
    // Strip order matters.  Question-form openers ("how to X", "what is Y")
    // must run FIRST, because patterns like "how to build" hide a
    // content-bearing imperative ("build") that would otherwise survive the
    // single-word verb pass and end up double-stacked with the task-specific
    // verb prepended below ("Write production-quality, runnable code for
    // build a REST API."  ← wrong).  After the question form is removed,
    // the multi-word and single-word verb strips peel any remaining leading
    // imperative cleanly.
    var subject = clean
      // 1. Question-form openers ("how to ...", "what is ...", ...).
      //    Optional pronoun tail absorbs the subject ("how do I X").
      .replace(/^(?:how\s+(?:does|do|did|to|can|could|should|would|will)\s+(?:i|we|you|they|one)?\s*|what\s+(?:is|are|was|were|does|do|did|will|would|should)\s+(?:the\s+best\s+way\s+to\s+|i|we|you)?\s*|why\s+(?:does|do|did|is|are|was|were|will|would|should)\s+(?:i|we|you|they)?\s*|when\s+(?:does|do|did|is|are|will|would|should)\s+(?:i|we|you|they)?\s*|where\s+(?:does|do|did|is|are|can|could|will|should)\s+(?:i|we|you|they)?\s*|which\s+(?:is|are|was|were|does|do)?\s*|who\s+(?:is|are|was|were|does|do|did|created|wrote|built|invented|made)?\s*)/i, '')
      // 2. Strip leading "(I/we/you) (want|need|would like|have|wish) to"
      //    BEFORE the bare pronoun strip, so "we need to debug X" peels to
      //    "debug X" rather than "need to debug X".
      .replace(/^(?:i|we|you|they)\s+(?:want|need|would\s+like|have|wish|hope|plan|try|tried|attempted)\s+(?:to\s+)?/i, '')
      .replace(/^(?:i|we|you|they)['’]?d\s+like\s+(?:to\s+)?/i, '')
      .replace(/^let['’]?s\s+/i, '')
      // 3. Strip leading pronoun subject ("I deploy", "we use", "you can")
      //    so the task verb prepended below doesn't end up as "Write
      //    production-quality, runnable code for i deploy my app".
      .replace(/^(?:i|we|you|they|one)\s+/i, '')
      // 3b. Strip "the/a (best|easiest|right|...) way to" / "method to"
      //     filler so "what is the best way to deploy X" peels cleanly to
      //     "deploy X" instead of "the best way to deploy X".
      .replace(/^(?:the|a)\s+(?:best|easiest|simplest|fastest|right|correct|proper|recommended|preferred|standard|typical|usual|common)\s+(?:way|approach|method|process|technique|practice)\s+(?:to|of|for)\s+/i, '')
      .replace(/^(?:the|a)\s+(?:way|approach|method|process)\s+(?:to|of|for)\s+/i, '')
      // 4. Multi-word imperatives produced by rwNormalize / rwEnrich.
      .replace(/^(?:Guide me through|Investigate and synthesize|Analyze and diagnose|Compose with craft|Strategize|Craft persuasive material on|Distill|Solve and verify|Address with rigor|Engineer|Explain in depth|Reason rigorously about|Verify whether|Compose a comprehensive piece on|Execute a|Demonstrate|Produce|Determine|Work out|Review|Analyze|Set up|Spin up|Stand up|Roll out|Put together|Figure out)\s+/i, '')
      // 5. Single-word imperatives ("build", "fix", "compute", ...).
      .replace(/^(?:write|build|create|make|generate|implement|design|engineer|explain|analyze|find|tell|show|describe|develop|produce|compose|distill|guide|review|investigate|summarize|solve|brainstorm|persuade|strategize|determine|demonstrate|compare|evaluate|plan|debug|diagnose|fix|refactor|migrate|optimize|harden|deploy|test|compute|calculate|draft|outline|prepare|propose|recommend|critique|edit|rewrite|translate)\s+(?:me\s+|us\s+|a\s+|an\s+|the\s+|some\s+|that\s+|it\s+)*/i, '')
      .replace(/[.?!]+$/, '')
      .trim();
    if (!subject) subject = (a.intent || raw).trim();
    if (subject) { var firstWord = subject.split(/\s+/)[0]; if (!/^[A-Z]{2,}/.test(firstWord)) subject = subject.charAt(0).toLowerCase() + subject.slice(1); }

    var ent = a.entities || { tech: [], files: [], numbers: [] };
    var anchor = '';
    if (ent.tech.length) {
      anchor += ' Treat ' + ent.tech.slice(0, 3).join(', ') +
        (ent.tech.length === 1 ? ' as a real tool, not a placeholder' : ' as real tools, not placeholders') + '.';
    }
    if (ent.files.length) {
      var fileList = ent.files.slice(0, 2).join(' and ');
      anchor += ent.files.length === 1
        ? ' Assume ' + fileList + ' is a real file with realistic content; state your schema assumption explicitly.'
        : ' Assume ' + fileList + ' are real files with realistic content; state your schema assumptions explicitly.';
    }
    if (ent.numbers.length) {
      var numList = ent.numbers.slice(0, 2).join(', ');
      anchor += ent.numbers.length === 1
        ? ' Honor the concrete number (' + numList + ') instead of softening it.'
        : ' Honor the concrete numbers (' + numList + ') instead of softening them.';
    }

    // Per-task structured rewrites.  Each one is a single paragraph that
    // explicitly differs from the input — different opening verb, different
    // structure, concrete demands, and a closing constraint.
    var t = a.task || 'general';
    var rewritten;
    switch (t) {
      case 'code':
        rewritten = 'Write production-quality, runnable code for ' + subject +
          '. State the exact inputs and outputs up front, validate inputs, handle empty / null / malformed cases explicitly, and include a short worked example with realistic data. Add inline comments that explain *why* (not what), and end with a one-line note on time and space complexity. No pseudocode, no stubs.';
        break;
      case 'research':
        rewritten = 'Explain ' + subject +
          ' rigorously. Distinguish established consensus from active debate, name at least two specific sources or schools of thought, and cite a concrete mechanism — not a correlation — for every claim. Surface the strongest counter-evidence and state what would change the conclusion.';
        break;
      case 'analysis':
        rewritten = 'Diagnose ' + subject +
          '. Lead with the answer in one sentence, then justify it. Name the top three causal factors in order of estimated impact, with concrete evidence for each. Flag any factor below 70% confidence, and state at least one thing the diagnosis might be missing.';
        break;
      case 'creative':
        rewritten = 'Compose ' + subject +
          ' with vivid sensory specificity — sight, sound, texture, weight. Avoid abstract emotion words ("happy", "sad", "beautiful"); earn the feeling through concrete physical detail. Aim for at least one striking, original image per paragraph and cut every line that does not pull its weight.';
        break;
      case 'strategy':
        rewritten = 'Recommend a strategy for ' + subject +
          '. Open with the recommendation in one sentence. Then map the two strongest alternatives, score them honestly against the same criteria, and explain why each was rejected. Name at least one risk that, if it materialized, would change the recommendation.';
        break;
      case 'persuade':
        rewritten = 'Argue for ' + subject +
          '. Open with the strongest version of the opposing view first, then dismantle it. Use one concrete example, one named comparison, and one falsifiable prediction. Close with the single line that, if remembered, would change a skeptic\'s mind.';
        break;
      case 'howto':
        rewritten = 'Walk through ' + subject +
          ' as numbered, copy-pasteable steps. For each step, state the exact command or action, the expected output, and one common failure mode with how to recognize and recover from it. End with a verification step that proves the whole sequence worked.';
        break;
      case 'brainstorm':
        rewritten = 'Generate seven or more distinct directions for ' + subject +
          ', spanning safe-and-conventional through genuinely contrarian. Tag each one [SAFE], [STRETCH], or [CONTRARIAN], add a one-sentence description, the strongest reason it might work, and a one-line "why this might fail."';
        break;
      case 'summarize':
        rewritten = 'Summarize ' + subject +
          '. Lead with a one-sentence thesis, then three to five supporting bullets in priority order. Keep the entire summary under 200 words. End with the single fact a reader must not forget.';
        break;
      case 'math':
        rewritten = 'Solve ' + subject +
          ' step by step. State the rule or formula used at each step, verify the final answer with a different method (estimation, substitution, or sanity-check), and state every unit and domain assumption explicitly.';
        break;
      default:
        rewritten = 'Address ' + subject +
          ' rigorously. Lead with the answer, then justify it. Name the assumption the answer most depends on, give one concrete example, and call out one realistic edge case where the answer would not hold.';
    }

    // Content-aware expansion — weave concept-specific demands into the
    // stealth output so it actually differs from the input by addressing
    // the specific nouns/verbs the user used (CSV → quoted-field parsing;
    // API → idempotency; story → POV; etc.).
    var elabs = rwElaborate(raw, a);
    if (elabs.length) {
      rewritten += ' Address all of: ' + rwJoinElabs(elabs);
    }

    rewritten += anchor;
    // No throat-clearing on the way in.
    rewritten = rewritten.replace(/\s{2,}/g, ' ').trim();
    return rewritten;
  }

  // Format a list of elaboration clauses as one readable sentence.
  // Goes from ['a', 'b', 'c'] → 'a; b; and c.'
  function rwJoinElabs(elabs) {
    if (!elabs || !elabs.length) return '';
    if (elabs.length === 1) return elabs[0] + '.';
    if (elabs.length === 2) return elabs[0] + '; and ' + elabs[1] + '.';
    var head = elabs.slice(0, elabs.length - 1).join('; ');
    return head + '; and ' + elabs[elabs.length - 1] + '.';
  }

  // Stage 4b: content-aware expansion of the user's specific prompt.
  // Detects concrete concepts (CSV, API, deploy, story, RCA, …) in the
  // raw text and emits a sentence that names every sub-requirement those
  // concepts demand.  This is what differentiates a real rewrite from
  // template scaffolding.
  function rwExpansion(a) {
    var elabs = rwElaborate(a && a.raw, a);
    if (!elabs.length) return '';
    return 'Address all of the following concretely — none of them by gesture: ' + rwJoinElabs(elabs);
  }

  function rewritePrompt(a, depth) {
    if (!a) return '';
    var intent = a.intent || a.raw || '';
    var constraints = a.constraints || [];
    var negations = a.negations || [];

    // Stage 1 + 2: clean up the user's text
    var core = rwEnrich(rwNormalize(intent));

    // Stage 3–7: layered scaffolding around the cleaned-up core
    var parts = [];
    parts.push(rwOpening(core, a, depth));
    var expansion = rwExpansion(a);
    if (expansion) parts.push(expansion);
    parts.push(rwDeliverables(a, depth));
    var spec = rwSpecifics(a, depth);
    if (spec) parts.push(spec);
    var rules = rwRules(a, constraints, negations);
    if (rules) parts.push(rules);
    var verify = rwVerify(a, depth);
    if (verify) parts.push(verify);

    // Smooth the join — every part is already a complete sentence/cluster.
    return parts
      .filter(function (p) { return p && p.trim(); })
      .map(function (p) { return p.trim(); })
      .join(' ');
  }

  // ── PROMPT BUILDER ───────────────────────────────────────────────────────────
  function buildPrompt(a, depth, mode, k) {
    // FIRST: Rewrite the actual prompt content into a better version
    var rewrittenPrompt = rewritePrompt(a, depth);
    
    // Build the framework wrapping - pass rewritten prompt to each builder
    var result;
    if (mode === 'manus') {
      result = buildManus(a, depth, rewrittenPrompt);
    } else if (mode === 'juma') {
      result = buildJuma(a, depth, rewrittenPrompt);
    } else {
      result = buildHailMary(a, depth, rewrittenPrompt);
    }
    
    // Note: TASK replacement already done inside the builder functions

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
      analysis: { task: a.task, domains: a.domains, complexity: a.complexity, intent: a.intent, entities: a.entities, isVague: a.amb >= 3 },
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
