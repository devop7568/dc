# HailMary v3.0 — Intelligent Autonomous Prompt Enhancer

**Real-time learning. Live web search. Web-sourced techniques. Genuinely gets smarter over time.**

## What Makes v3.0 Different

### 🧠 **Real Intelligence**
- **Learning Memory**: Tracks which technique combinations work best for different prompt types
- **Pattern Recognition**: Analyzes prompt signatures (task + domain) and adapts based on past successes
- **Smart Routing**: Auto mode learns from your usage patterns and routes intelligently

### 🌐 **Web-Sourced Knowledge**
The extension automatically fetches prompting techniques from multiple sources:
- **Academic Papers**: Semantic Scholar API (free, no key needed) — pulls latest research on Chain-of-Thought, ReAct, Tree-of-Thoughts, etc.
- **Community Prompts**: awesome-chatgpt-prompts, Learn Prompting guides
- **Prompt Engineering Guides**: DAIR.AI and other curated sources
- **Live Search**: DuckDuckGo Instant Answer API for on-demand query expansion, source triangulation, and current prompt-engineering patterns.

**Auto-refresh**: Fetches new techniques every 4 hours. Stores up to 300 techniques locally plus cached live-search results.

### ⚡ **Clean, Copy-Paste Ready Output**
No more bureaucratic `## EXPERT IDENTITY` headers. The enhanced prompt reads like something a professional prompt engineer wrote by hand — natural, woven, ready to paste directly into ChatGPT/Claude/Gemini.

### 🎯 **Smart Enhancement Detection**
- Detects if your prompt is already well-formed (has context, constraints, format hints)
- Enhances lightly when appropriate instead of over-engineering
- Expands vague 3-word prompts into precise, complete requests

## How It Works

### Architecture

**background.js** — Knowledge Fetcher & Memory Manager
- Fetches from Semantic Scholar (academic papers), GitHub (community prompts), prompt engineering guides
- Parses and extracts technique names, instructions, applicable tasks
- Stores in `chrome.storage.local` with deduplication
- Records enhancement history for learning

**engine.js** — Intelligent Enhancement Engine
- Loads knowledge and memory from background
- Analyzes prompt: task type, domain, complexity, quality score
- Selects techniques based on analysis + learned patterns
- Weaves techniques into natural prose (no labeled sections)
- Records what worked for future learning

**popup.js** — UI Controller
- Handles user interaction
- Calls engine (now async/Promise-based)
- Displays enhanced prompt with stats
- Auto-inject to AI tabs

## Features

### 4 Modes
- **☄️ Hail Mary**: Balanced fusion — best for strategy, persuasion, general tasks
- **🧠 Manus**: Systematic, step-by-step — best for code, math, how-to guides
- **⚡ Juma**: Multi-perspective synthesis — best for research, analysis, creative writing
- **🤖 Auto**: Learns from your usage and routes intelligently

### 5 Depth Levels
1. **LITE**: Clean, focused enhancement
2. **STANDARD**: + examples, constraints
3. **ENHANCED**: + reasoning methods, depth escalation
4. **ULTRA**: + self-critique, Socratic decomposition, web-learned techniques
5. **GOD 🔥**: Full power — contrarian views, iterative refinement, academic techniques

### Live Search Enhancer
- Runs automatically at ULTRA/GOD depth or when the prompt asks for current, recent, sourced, or research-backed output.
- Expands the prompt into a targeted search query.
- Adds source-triangulation and evidence-grounding instructions when current facts matter.
- Falls back to built-in expert techniques if the live search API is unavailable, so enhancement still works offline.

### Auto-Inject & Auto-Submit
- Detects AI pages (ChatGPT, Claude, Gemini, Perplexity, Poe, Grok, You.com)
- One-click inject enhanced prompt
- Optional auto-submit

### History
- Stores last 20 enhancements
- Click to reload from history

## Installation

1. Open Chrome/Edge and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select this folder
5. The extension will auto-fetch knowledge on first install

## Usage

1. Click the HailMary icon in your toolbar
2. Type your raw prompt
3. Select mode (or use Auto) and depth
4. Click **FIRE HAIL MARY**
5. Copy the enhanced prompt or auto-inject to your AI tab

## What Gets Learned

The extension tracks:
- **Prompt Signatures**: task type + domains (e.g., "code:tech", "research:science")
- **Technique Effectiveness**: which techniques were used for each signature
- **Usage Patterns**: total enhancements, most common tasks

This data stays **100% local** in `chrome.storage.local`. Nothing is sent to external servers.

## Knowledge Sources

### Academic (via Semantic Scholar API)
- Chain-of-Thought prompting papers
- Prompt engineering research
- Reasoning and few-shot learning papers

### Community
- awesome-chatgpt-prompts (role-based prompts)
- Learn Prompting guides
- DAIR.AI Prompt Engineering Guide

### Refresh Schedule
- First fetch: 3 seconds after install
- Auto-refresh: every 6 hours
- Manual refresh: coming soon in UI

## Technical Details

### Storage Keys
- `hm_v3`: User settings (mode, depth, toggles)
- `hm_hist`: Enhancement history (last 20)
- `hm_knowledge`: Fetched techniques (up to 200)
- `hm_memory`: Learning data (prompt signatures, technique scores)

### Permissions
- `activeTab`, `scripting`: For auto-inject
- `storage`: For settings, history, knowledge, memory
- `clipboardWrite`, `clipboardRead`: For copy/paste
- Host permissions for AI sites (ChatGPT, Claude, etc.)

### Browser Compatibility
- Chrome 88+
- Edge 88+
- Any Chromium-based browser with Manifest V3 support

## Version History

### v3.0 (Current)
- Real-time web knowledge fetching
- Learning memory system
- Intelligent auto-routing
- Clean, natural prompt output (no labeled sections)
- Smart enhancement detection
- Async/Promise-based architecture

### v2.1 (Previous)
- 34 named techniques
- Manus × Juma fusion
- Labeled section output

## License

MIT — do whatever you want with it.

## Credits

Built with techniques from:
- Wei et al. (2022) — Chain-of-Thought
- Yao et al. (2023) — Tree-of-Thoughts
- Kojima et al. (2022) — Zero-Shot CoT
- Bai et al. (2022) — Constitutional AI
- And many more from the prompt engineering research community

---

**HailMary v3.0** — The prompt enhancer that actually gets smarter.
