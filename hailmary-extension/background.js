/**
 * HailMary Background Service Worker v3.0
 * Handles: install setup, tab badge, and the Knowledge Fetcher —
 * a real-time web scraper that discovers new prompting techniques
 * and stores them so the engine gets smarter over time.
 */

console.log('[HailMary] Background service worker loading...');

// ─────────────────────────────────────────────────────────────────
// INSTALL
// ─────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(function(details) {
  console.log('[HailMary] onInstalled:', details.reason);
  if (details.reason === 'install') {
    chrome.storage.local.set({
      hm_v3:       { mode:'hailmary', depth:'4', inject:true, submit:false },
      hm_hist:     [],
      hm_knowledge:{ techniques:[], lastFetch:0, fetchCount:0, liveSearches:[] },
      hm_memory:   { promptSignatures:{}, techniqueScores:{}, totalEnhancements:0 }
    }, function() {
      console.log('[HailMary] Initial storage set');
    });
    // Kick off first knowledge fetch after a short delay
    setTimeout(function() {
      console.log('[HailMary] Starting first knowledge fetch...');
      fetchKnowledge();
    }, 3000);
  }
  if (details.reason === 'update') {
    console.log('[HailMary] Extension updated, re-fetching knowledge...');
    // Re-fetch on update to get fresh techniques
    setTimeout(fetchKnowledge, 2000);
  }
});

// ─────────────────────────────────────────────────────────────────
// TAB BADGE
// ─────────────────────────────────────────────────────────────────

chrome.tabs.onActivated.addListener(function(info) {
  chrome.tabs.get(info.tabId, function(tab) {
    if (chrome.runtime.lastError) return;
    var isAI = /chatgpt|openai|claude\.ai|gemini|perplexity|poe\.com|grok|you\.com/.test(tab.url || '');
    chrome.action.setBadgeText({ text: isAI ? 'ON' : '', tabId: info.tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#7c3aed', tabId: info.tabId });
  });
});

// ─────────────────────────────────────────────────────────────────
// MESSAGE HANDLER — popup/engine communicates via chrome.runtime.sendMessage
// ─────────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.type === 'GET_KNOWLEDGE') {
    chrome.storage.local.get(['hm_knowledge', 'hm_memory'], function(data) {
      sendResponse({
        knowledge: data.hm_knowledge || { techniques:[], lastFetch:0, fetchCount:0 },
        memory:    data.hm_memory    || { promptSignatures:{}, techniqueScores:{}, totalEnhancements:0 }
      });
    });
    return true; // async
  }

  if (msg.type === 'RECORD_ENHANCEMENT') {
    recordEnhancement(msg.data);
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'FETCH_KNOWLEDGE_NOW') {
    fetchKnowledge().then(function(result) {
      sendResponse(result);
    });
    return true;
  }

  if (msg.type === 'LIVE_SEARCH_TECHNIQUES') {
    liveSearchTechniques(msg.query, msg.analysis).then(function(result) {
      sendResponse(result);
    });
    return true;
  }

  if (msg.type === 'GET_STATUS') {
    chrome.storage.local.get('hm_knowledge', function(data) {
      var k = data.hm_knowledge || {};
      sendResponse({
        techniqueCount: (k.techniques || []).length,
        lastFetch:      k.lastFetch || 0,
        fetchCount:     k.fetchCount || 0
      });
    });
    return true;
  }
});

// ─────────────────────────────────────────────────────────────────
// KNOWLEDGE FETCHER
// Pulls from multiple free, no-auth sources and extracts technique data
// ─────────────────────────────────────────────────────────────────

// Sources: curated GitHub raw files + Semantic Scholar (free API, no key needed) + unjail.ai + promptfoo
var KNOWLEDGE_SOURCES = [
  {
    id:   'awesome-prompts',
    url:  'https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/README.md',
    type: 'markdown-prompts',
    weight: 1.0
  },
  {
    id:   'learnprompting',
    url:  'https://raw.githubusercontent.com/trigaten/Learn_Prompting/main/docs/basics/intro.md',
    type: 'markdown-guide',
    weight: 1.2
  },
  {
    id:   'semantic-scholar-cot',
    url:  'https://api.semanticscholar.org/graph/v1/paper/search?query=chain+of+thought+prompting+LLM&fields=title,abstract,year&limit=8',
    type: 'semantic-scholar',
    weight: 1.5
  },
  {
    id:   'semantic-scholar-prompt-eng',
    url:  'https://api.semanticscholar.org/graph/v1/paper/search?query=prompt+engineering+techniques+large+language+models&fields=title,abstract,year&limit=8',
    type: 'semantic-scholar',
    weight: 1.5
  },
  {
    id:   'semantic-scholar-reasoning',
    url:  'https://api.semanticscholar.org/graph/v1/paper/search?query=reasoning+prompting+few-shot+zero-shot+LLM&fields=title,abstract,year&limit=6',
    type: 'semantic-scholar',
    weight: 1.4
  },
  {
    id:   'promptingguide-raw',
    url:  'https://raw.githubusercontent.com/dair-ai/Prompt-Engineering-Guide/main/guides/prompts-advanced-usage.md',
    type: 'markdown-guide',
    weight: 1.3
  },
  {
    id:   'unjail-ai',
    url:  'https://unjail.ai',
    type: 'html-scrape',
    weight: 1.6
  },
  {
    id:   'promptfoo-guides',
    url:  'https://www.promptfoo.dev/docs/guides/',
    type: 'html-scrape',
    weight: 1.4
  }
];

// How often to re-fetch (4 hours)
var FETCH_INTERVAL_MS = 4 * 60 * 60 * 1000;
var LIVE_SEARCH_CACHE_MS = 60 * 60 * 1000;
var LIVE_SEARCH_ENDPOINT = 'https://api.duckduckgo.com/?format=json&no_html=1&skip_disambig=1&q=';

var SEED_TECHNIQUES = [
  {
    id: 'seed-success-criteria',
    name: 'Success Criteria First',
    instruction: 'State the task objective, define success criteria, and ask the model to optimize every section of the response against those criteria.',
    source: 'seed',
    sourceTitle: 'HailMary expert heuristics',
    year: 2026,
    weight: 1.8,
    tasks: ['general', 'code', 'analysis', 'strategy', 'research', 'howto']
  },
  {
    id: 'seed-context-constraints-format',
    name: 'Context Constraints Format',
    instruction: 'Package the prompt as context, task, constraints, output format, and quality bar so the model has no ambiguity about what to produce.',
    source: 'seed',
    sourceTitle: 'HailMary expert heuristics',
    year: 2026,
    weight: 1.7,
    tasks: ['general', 'code', 'analysis', 'strategy', 'research', 'howto', 'creative']
  },
  {
    id: 'seed-few-shot-calibration',
    name: 'Few-Shot Calibration',
    instruction: 'When the expected output style matters, include compact examples or ask the model to infer the pattern before producing the final answer.',
    source: 'seed',
    sourceTitle: 'HailMary expert heuristics',
    year: 2026,
    weight: 1.6,
    tasks: ['creative', 'persuade', 'summarize', 'code', 'general']
  },
  {
    id: 'seed-stepback-decomposition',
    name: 'Step-Back Decomposition',
    instruction: 'Start by identifying the higher-level principle behind the request, then decompose the work into small decisions before answering.',
    source: 'seed',
    sourceTitle: 'HailMary expert heuristics',
    year: 2026,
    weight: 1.65,
    tasks: ['analysis', 'strategy', 'research', 'math', 'code', 'general']
  },
  {
    id: 'seed-rag-citation',
    name: 'Search-Grounded Answering',
    instruction: 'For current or factual claims, search first, compare multiple sources, cite evidence, and call out uncertainty instead of guessing.',
    source: 'seed',
    sourceTitle: 'HailMary expert heuristics',
    year: 2026,
    weight: 1.9,
    tasks: ['research', 'analysis', 'strategy', 'general']
  },
  {
    id: 'seed-self-critique',
    name: 'Self-Critique Pass',
    instruction: 'After drafting, review the answer for missing constraints, weak evidence, edge cases, and formatting drift before finalizing.',
    source: 'seed',
    sourceTitle: 'HailMary expert heuristics',
    year: 2026,
    weight: 1.7,
    tasks: ['general', 'code', 'analysis', 'strategy', 'research', 'howto']
  }
];

async function fetchKnowledge() {
  var now = Date.now();

  // Check if we fetched recently
  var stored = await new Promise(function(res) {
    chrome.storage.local.get('hm_knowledge', function(d) { res(d.hm_knowledge || {}); });
  });

  if (stored.lastFetch && (now - stored.lastFetch) < FETCH_INTERVAL_MS) {
    return { skipped: true, reason: 'fetched recently', count: (stored.techniques||[]).length };
  }

  var allTechniques = SEED_TECHNIQUES.slice();
  var fetchResults  = [];

  for (var i = 0; i < KNOWLEDGE_SOURCES.length; i++) {
    var source = KNOWLEDGE_SOURCES[i];
    try {
      var result = await fetchSource(source);
      if (result && result.length > 0) {
        allTechniques = allTechniques.concat(result);
        fetchResults.push({ id: source.id, count: result.length, ok: true });
      }
    } catch(e) {
      fetchResults.push({ id: source.id, ok: false, error: e.message });
    }
  }

  // Deduplicate by name similarity
  var deduped = deduplicateTechniques(allTechniques);

  // Merge with existing techniques (keep old ones, add new)
  var existing = stored.techniques || [];
  var merged   = mergeTechniques(existing, deduped);

  var newKnowledge = Object.assign({}, stored, {
    techniques:   merged,
    lastFetch:    now,
    fetchCount:   (stored.fetchCount || 0) + 1,
    lastResults:  fetchResults,
    totalFound:   merged.length
  });

  await new Promise(function(res) {
    chrome.storage.local.set({ hm_knowledge: newKnowledge }, res);
  });

  // Schedule next fetch
  setTimeout(fetchKnowledge, FETCH_INTERVAL_MS);

  return { ok: true, newCount: deduped.length, totalCount: merged.length, results: fetchResults };
}

async function liveSearchTechniques(query, analysis) {
  var q = String(query || '').trim();
  if (!q) return { ok: false, error: 'Missing search query', techniques: [] };

  var normalized = normalizeSearchQuery(q, analysis);
  var now = Date.now();
  var stored = await new Promise(function(res) {
    chrome.storage.local.get('hm_knowledge', function(d) { res(d.hm_knowledge || {}); });
  });
  var liveSearches = stored.liveSearches || [];
  var cached = liveSearches.find(function(item) {
    return item.query === normalized && now - item.fetchedAt < LIVE_SEARCH_CACHE_MS;
  });
  if (cached) {
    return { ok: true, cached: true, query: normalized, techniques: cached.techniques || [], sources: cached.sources || [] };
  }

  var techniques = [];
  var sources = [];
  try {
    var searchUrl = LIVE_SEARCH_ENDPOINT + encodeURIComponent(normalized);
    var resp = await fetch(searchUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json, text/plain, */*' },
      signal: AbortSignal.timeout(10000)
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    var data = await resp.json();
    sources = extractSearchSources(data);
    techniques = extractTechniquesFromSearch(data, analysis);
  } catch(e) {
    techniques = [];
  }

  if (techniques.length < 3) {
    techniques = techniques.concat(buildFallbackLiveTechniques(normalized, analysis));
  }

  techniques = deduplicateTechniques(techniques).slice(0, 8);
  liveSearches.unshift({ query: normalized, fetchedAt: now, techniques: techniques, sources: sources });
  liveSearches = liveSearches.slice(0, 20);

  var merged = mergeTechniques(stored.techniques || [], techniques);
  await new Promise(function(res) {
    chrome.storage.local.set({
      hm_knowledge: Object.assign({}, stored, {
        techniques: merged,
        liveSearches: liveSearches,
        totalFound: merged.length,
        lastLiveSearch: now
      })
    }, res);
  });

  return { ok: true, cached: false, query: normalized, techniques: techniques, sources: sources };
}

function normalizeSearchQuery(query, analysis) {
  var task = analysis && analysis.task ? analysis.task : 'general';
  var domains = analysis && analysis.domains && analysis.domains.length ? analysis.domains.slice(0, 2).join(' ') : '';
  return (query + ' prompt engineering best practices ' + task + ' ' + domains).replace(/\s+/g, ' ').trim().slice(0, 180);
}

function extractSearchSources(data) {
  var sources = [];
  function pushSource(item) {
    if (!item) return;
    var title = item.Text || item.Name || item.FirstURL || '';
    var url = item.FirstURL || '';
    if (title || url) sources.push({ title: String(title).slice(0, 120), url: url });
  }
  pushSource({ Text: data.Heading, FirstURL: data.AbstractURL });
  (data.RelatedTopics || []).forEach(function(item) {
    if (item.Topics) item.Topics.slice(0, 3).forEach(pushSource);
    else pushSource(item);
  });
  return sources.filter(function(s, i) {
    return s.url && sources.findIndex(function(x) { return x.url === s.url; }) === i;
  }).slice(0, 6);
}

function extractTechniquesFromSearch(data, analysis) {
  var textParts = [];
  if (data.AbstractText) textParts.push(data.AbstractText);
  if (data.Answer) textParts.push(data.Answer);
  (data.RelatedTopics || []).forEach(function(item) {
    if (item.Text) textParts.push(item.Text);
    if (item.Topics) item.Topics.forEach(function(topic) { if (topic.Text) textParts.push(topic.Text); });
  });
  var text = textParts.join('. ');
  if (!text.trim()) return [];

  var chunks = text.split(/[.!?]+/).map(function(s) { return s.trim(); }).filter(function(s) {
    return s.length >= 45 && /\b(prompt|context|example|reason|search|source|evidence|format|constraint|output|instruction|query|answer)\b/i.test(s);
  });

  return chunks.slice(0, 8).map(function(sentence, idx) {
    var name = extractTechniqueNameFromSentence(sentence, chunks[idx - 1], chunks[idx + 1]) || ('Live Search Pattern ' + (idx + 1));
    return {
      id: 'live-' + slugify(name + '-' + idx),
      name: name,
      instruction: sentence.slice(0, 260),
      source: 'live-search',
      sourceTitle: data.Heading || 'DuckDuckGo instant answer',
      year: new Date().getFullYear(),
      weight: 1.85,
      tasks: inferApplicableTasks(sentence + ' ' + ((analysis && analysis.task) || 'general')),
      addedAt: Date.now()
    };
  });
}

function buildFallbackLiveTechniques(query, analysis) {
  var task = analysis && analysis.task ? analysis.task : 'general';
  var domains = analysis && analysis.domains && analysis.domains.length ? analysis.domains.join(', ') : 'the relevant domain';
  return [
    {
      id: 'live-fallback-query-expansion-' + slugify(task),
      name: 'Real-Time Query Expansion',
      instruction: 'Generate 3-5 targeted search queries for "' + query + '", compare results, and use only source-backed facts in the final answer.',
      source: 'live-search',
      sourceTitle: 'HailMary live search fallback',
      year: new Date().getFullYear(),
      weight: 1.75,
      tasks: [task, 'research', 'analysis', 'general']
    },
    {
      id: 'live-fallback-source-triangulation-' + slugify(task),
      name: 'Source Triangulation',
      instruction: 'Triangulate claims across official docs, expert guides, and recent examples; mark any disagreement or stale information before recommending.',
      source: 'live-search',
      sourceTitle: 'HailMary live search fallback',
      year: new Date().getFullYear(),
      weight: 1.8,
      tasks: [task, 'research', 'analysis', 'strategy', 'general']
    },
    {
      id: 'live-fallback-expert-synthesis-' + slugify(task),
      name: 'Expert Pattern Synthesis',
      instruction: 'Synthesize the strongest current techniques for ' + domains + ' into a practical workflow with steps, caveats, and verification checks.',
      source: 'live-search',
      sourceTitle: 'HailMary live search fallback',
      year: new Date().getFullYear(),
      weight: 1.7,
      tasks: [task, 'general']
    }
  ];
}

async function fetchSource(source) {
  try {
    var resp = await fetch(source.url, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'HailMary-Extension/3.0'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!resp.ok) {
      console.log('[HailMary] Fetch failed for ' + source.id + ': HTTP ' + resp.status);
      throw new Error('HTTP ' + resp.status);
    }

    var text = await resp.text();

    if (source.type === 'semantic-scholar') {
      return parseSemanticScholar(text, source.weight);
    }
    if (source.type === 'markdown-prompts') {
      return parseMarkdownPrompts(text, source.weight);
    }
    if (source.type === 'markdown-guide') {
      return parseMarkdownGuide(text, source.weight);
    }
    if (source.type === 'html-scrape') {
      return parseHtmlScrape(text, source.weight, source.id);
    }
    return [];
  } catch(e) {
    console.log('[HailMary] Error fetching ' + source.id + ':', e.message);
    throw e;
  }
}

// ─────────────────────────────────────────────────────────────────
// PARSERS — extract structured technique data from raw content
// ─────────────────────────────────────────────────────────────────

function parseSemanticScholar(text, weight) {
  var techniques = [];
  try {
    var data = JSON.parse(text);
    var papers = data.data || [];
    papers.forEach(function(paper) {
      if (!paper.abstract || !paper.title) return;
      var extracted = extractTechniqueFromAbstract(paper.title, paper.abstract, paper.year, weight);
      if (extracted) techniques.push(extracted);
    });
  } catch(e) {}
  return techniques;
}

function extractTechniqueFromAbstract(title, abstract, year, weight) {
  // Extract the core technique name and instruction from academic abstract
  var name = extractTechniqueName(title);
  if (!name) return null;

  // Extract what the technique does from the abstract
  var instruction = extractInstruction(abstract);
  if (!instruction || instruction.length < 20) return null;

  // Determine which task types this technique applies to
  var applicableTasks = inferApplicableTasks(title + ' ' + abstract);

  return {
    id:           slugify(name),
    name:         name,
    instruction:  instruction,
    source:       'academic',
    sourceTitle:  title,
    year:         year || 2023,
    weight:       weight || 1.0,
    tasks:        applicableTasks,
    addedAt:      Date.now()
  };
}

function extractTechniqueName(title) {
  // Common patterns: "X Prompting", "X-of-Thought", "X Chain", etc.
  var patterns = [
    /^([A-Z][a-zA-Z\s\-]+(?:Prompting|Reasoning|Chain|Thought|Decomposition|Sampling|Verification|Reflection|Critique|Calibration|Elicitation|Augmentation))/,
    /\b((?:Chain|Tree|Graph|Skeleton|Step-Back|Self-Ask|ReAct|REACT|PAL|ToT|CoT|RAG|RLHF|Constitutional|Maieutic|Analogical|Contrastive|Least-to-Most|Self-Consistency|Self-Refine|Reflexion|Metacognitive|Directional|Generated Knowledge)[^\.,;]{0,40})/i
  ];
  for (var i = 0; i < patterns.length; i++) {
    var m = title.match(patterns[i]);
    if (m) return m[1].trim().replace(/\s+/g, ' ');
  }
  // Fallback: use first 5 words of title if it looks like a technique
  if (/prompting|reasoning|chain|thought|decompos/i.test(title)) {
    return title.split(/\s+/).slice(0, 5).join(' ');
  }
  return null;
}

function extractInstruction(abstract) {
  // Try to extract the core "how to use" instruction from the abstract
  // Look for sentences describing what the method does
  var sentences = abstract.split(/[.!?]+/).map(function(s){ return s.trim(); }).filter(function(s){ return s.length > 30; });

  // Prefer sentences with action verbs describing the technique
  var actionSentences = sentences.filter(function(s) {
    return /\b(prompt|instruct|ask|tell|generate|produce|reason|think|decompose|break|chain|step|solve|approach|method|technique|strategy)\b/i.test(s);
  });

  var best = actionSentences[0] || sentences[0];
  if (!best) return null;

  // Convert to imperative instruction
  best = best
    .replace(/^(we |this paper |the model |our method |the approach |it )/i, '')
    .replace(/^(proposes?|presents?|introduces?|shows?|demonstrates?)\s+/i, '')
    .replace(/^(that |a |an |the )/i, '')
    .trim();

  // Capitalize first letter
  if (best.length > 0) best = best[0].toUpperCase() + best.slice(1);

  // Truncate to reasonable length
  if (best.length > 200) best = best.slice(0, 197) + '...';

  return best;
}

function inferApplicableTasks(text) {
  var taskMap = {
    code:       /\b(code|program|software|algorithm|debugging|implementation)\b/i,
    math:       /\b(math|arithmetic|reasoning|logic|proof|calculation|numerical)\b/i,
    research:   /\b(knowledge|factual|question answering|information|retrieval|commonsense)\b/i,
    analysis:   /\b(analysis|evaluation|assessment|classification|judgment)\b/i,
    creative:   /\b(creative|generation|writing|story|narrative|text generation)\b/i,
    strategy:   /\b(planning|decision|strategy|multi-step|complex task)\b/i,
    general:    /\b(general|broad|diverse|multiple|various|all tasks)\b/i
  };
  var tasks = [];
  for (var t in taskMap) {
    if (taskMap[t].test(text)) tasks.push(t);
  }
  return tasks.length > 0 ? tasks : ['general'];
}

function parseMarkdownPrompts(text, weight) {
  var techniques = [];
  // Extract act/prompt pairs from awesome-chatgpt-prompts format
  var actPattern = /##\s+Act as\s+(.+?)\n+(?:Contributed by[^\n]*\n+)?(?:>?\s*)?([^\n#]{50,400})/gi;
  var match;
  var count = 0;
  while ((match = actPattern.exec(text)) !== null && count < 20) {
    var role = match[1].trim();
    var prompt = match[2].trim().replace(/^["']|["']$/g, '');
    if (prompt.length < 30) continue;
    techniques.push({
      id:          'persona-' + slugify(role),
      name:        'Act as ' + role,
      instruction: prompt.slice(0, 300),
      source:      'community',
      sourceTitle: 'awesome-chatgpt-prompts',
      year:        2023,
      weight:      weight,
      tasks:       inferApplicableTasks(role + ' ' + prompt),
      addedAt:     Date.now()
    });
    count++;
  }
  return techniques;
}

function parseMarkdownGuide(text, weight) {
  var techniques = [];
  // Extract technique sections from markdown guides
  var sectionPattern = /#{1,3}\s+([^\n]+)\n+([\s\S]{80,600}?)(?=\n#{1,3}\s|\n---|\n\*\*\*|$)/g;
  var match;
  var count = 0;
  while ((match = sectionPattern.exec(text)) !== null && count < 15) {
    var heading = match[1].trim();
    var body    = match[2].trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ');

    // Only keep sections that look like technique descriptions
    if (!/prompting|technique|method|approach|reasoning|chain|shot|example/i.test(heading + body)) continue;
    if (body.length < 60) continue;

    var name = heading.replace(/[*_`]/g, '').trim();
    var instruction = body.slice(0, 250).trim();

    techniques.push({
      id:          'guide-' + slugify(name),
      name:        name,
      instruction: instruction,
      source:      'guide',
      sourceTitle: 'prompting-guide',
      year:        2024,
      weight:      weight,
      tasks:       inferApplicableTasks(heading + ' ' + body),
      addedAt:     Date.now()
    });
    count++;
  }
  return techniques;
}

function parseHtmlScrape(text, weight, sourceId) {
  var techniques = [];
  
  // Strip HTML tags and decode entities
  var cleaned = text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  // Split into sentences
  var sentences = cleaned.split(/[.!?]+/).map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 40; });

  // Keywords that indicate technique-like content
  var techniqueKeywords = /\b(prompt|prompting|instruct|instruction|technique|method|approach|reasoning|chain|step|generate|output|format|role|context|constraint|example|ask|tell|guide|strategy|pattern|framework|model|response|query|request|command|directive|jailbreak|bypass|override|system|behavior|persona|character|act as|pretend|imagine|simulate)\b/i;

  var count = 0;
  var seenNames = {};

  for (var i = 0; i < sentences.length && count < 25; i++) {
    var sentence = sentences[i];
    
    // Check if sentence contains technique keywords
    if (!techniqueKeywords.test(sentence)) continue;
    if (sentence.length < 50 || sentence.length > 500) continue;

    // Try to extract a technique name from the sentence or surrounding context
    var name = extractTechniqueNameFromSentence(sentence, sentences[i-1], sentences[i+1]);
    if (!name || seenNames[name]) continue;
    
    seenNames[name] = true;

    // Use the sentence as the instruction
    var instruction = sentence.slice(0, 300).trim();

    techniques.push({
      id:          sourceId + '-' + slugify(name),
      name:        name,
      instruction: instruction,
      source:      'web-scrape',
      sourceTitle: sourceId,
      year:        2024,
      weight:      weight,
      tasks:       inferApplicableTasks(sentence),
      addedAt:     Date.now()
    });
    count++;
  }

  return techniques;
}

function extractTechniqueNameFromSentence(sentence, prevSentence, nextSentence) {
  // Try to find a technique name in the sentence or context
  
  // Pattern 1: "X prompting" or "X technique"
  var match = sentence.match(/\b([A-Z][a-zA-Z\s\-]{2,30}(?:prompting|technique|method|approach|strategy|pattern|framework))\b/i);
  if (match) return match[1].trim();

  // Pattern 2: Quoted technique names
  match = sentence.match(/["']([^"']{5,40})["']\s+(?:is|involves|means|refers to|technique|method|approach)/i);
  if (match) return match[1].trim();

  // Pattern 3: "Use X to" or "Apply X to"
  match = sentence.match(/\b(?:use|apply|try|employ)\s+([a-zA-Z\s\-]{5,30})\s+to\b/i);
  if (match && /prompt|instruct|technique|method|approach/i.test(match[1])) return match[1].trim();

  // Pattern 4: Check previous sentence for a heading-like pattern
  if (prevSentence) {
    match = prevSentence.match(/^([A-Z][a-zA-Z\s\-]{3,30})$/);
    if (match && match[1].split(/\s+/).length <= 5) return match[1].trim();
  }

  // Pattern 5: Extract first few meaningful words as name
  var words = sentence.split(/\s+/).slice(0, 6);
  var candidateName = words.join(' ').replace(/^(The|A|An|This|That|These|Those|To|For|By|With|When|Where|How|Why|What)\s+/i, '');
  if (candidateName.length >= 10 && candidateName.length <= 50) {
    return candidateName.slice(0, 40);
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────
// DEDUP & MERGE
// ─────────────────────────────────────────────────────────────────

function deduplicateTechniques(techniques) {
  var seen = {};
  return techniques.filter(function(t) {
    var key = t.id || slugify(t.name);
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function mergeTechniques(existing, newOnes) {
  var existingIds = {};
  existing.forEach(function(t) { existingIds[t.id || slugify(t.name)] = true; });
  var toAdd = newOnes.filter(function(t) { return !existingIds[t.id || slugify(t.name)]; });
  // Keep max 300 techniques, prioritize by weight and recency
  var merged = existing.concat(toAdd);
  merged.sort(function(a, b) {
    return ((b.weight || 1) * (b.year || 2020)) - ((a.weight || 1) * (a.year || 2020));
  });
  return merged.slice(0, 300);
}

// ─────────────────────────────────────────────────────────────────
// MEMORY — record what was enhanced and learn from patterns
// ─────────────────────────────────────────────────────────────────

async function recordEnhancement(data) {
  var stored = await new Promise(function(res) {
    chrome.storage.local.get('hm_memory', function(d) { res(d.hm_memory || {}); });
  });

  var memory = stored;
  if (!memory.promptSignatures) memory.promptSignatures = {};
  if (!memory.techniqueScores)  memory.techniqueScores  = {};
  if (!memory.totalEnhancements) memory.totalEnhancements = 0;

  memory.totalEnhancements++;

  // Record which techniques were used for this task+domain combo
  var sig = data.task + ':' + (data.domains || []).join(',');
  if (!memory.promptSignatures[sig]) {
    memory.promptSignatures[sig] = { count: 0, techniques: {} };
  }
  memory.promptSignatures[sig].count++;

  (data.techniques || []).forEach(function(t) {
    if (!memory.promptSignatures[sig].techniques[t]) {
      memory.promptSignatures[sig].techniques[t] = 0;
    }
    memory.promptSignatures[sig].techniques[t]++;
  });

  // Keep memory lean — max 50 signatures
  var sigs = Object.keys(memory.promptSignatures);
  if (sigs.length > 50) {
    // Remove least-used signatures
    sigs.sort(function(a, b) {
      return memory.promptSignatures[a].count - memory.promptSignatures[b].count;
    });
    delete memory.promptSignatures[sigs[0]];
  }

  await new Promise(function(res) {
    chrome.storage.local.set({ hm_memory: memory }, res);
  });
}

// ─────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────

function slugify(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
}

// Periodic re-fetch alarm (every 4 hours = 240 minutes)
try {
  if (chrome.alarms) {
    chrome.alarms.create('hm-knowledge-refresh', { periodInMinutes: 240 });
    chrome.alarms.onAlarm.addListener(function(alarm) {
      if (alarm.name === 'hm-knowledge-refresh') fetchKnowledge();
    });
    console.log('[HailMary] Alarms API configured');
  }
} catch(e) {
  console.log('[HailMary] Alarms API not available, using setTimeout fallback');
}

console.log('[HailMary] Background service worker loaded successfully');
