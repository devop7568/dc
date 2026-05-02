# HailMary v10.0 — Autonomous Prompt Agent

**Multi-stage rewriter. 30+ research-backed techniques. 10 injection strategies. 3-pass chain refinement. Prompt scoring. Templates. Context capture. Adaptive intelligence.**

## What's New in v10.0

### ✍️ **Multi-Stage Prompt Rewriter**
The rewriter no longer just slaps an authoritative sentence on your prompt. It runs a real seven-stage pipeline:
1. **Normalize** — strips pleasantries / filler / weak verbs
2. **Enrich** — replaces vague quantifiers ("some", "many", "good") with crisp ones
3. **Opening** — picks a task-specific authoritative imperative + depth-tuned stake
4. **Deliverables** — explicit, task-specific list of expected outputs
5. **Specifics** — depth- and audience-tuned specificity demands
6. **Rules** — weaves your hard requirements and forbidden patterns into prose
7. **Verify** — depth-tuned self-verification clauses

### 🧠 **18 New Research-Backed Techniques**
Picked automatically based on task and depth:
- **Chain-of-Verification** (Dhuliawala 2023, Meta AI)
- **Tree-of-Thoughts** (Yao 2023, Princeton/DeepMind)
- **Plan-and-Solve** (Wang 2023)
- **Step-Back Prompting** (Zheng 2023, Google DeepMind)
- **Skeleton-of-Thought** (Ning 2023)
- **Self-Consistency** (Wang 2022, Google)
- **Reflexion** (Shinn 2023, Northeastern/MIT)
- **EmotionPrompt** (Li 2023, Microsoft) — +8% accuracy
- **Pre-Mortem** (Klein, adapted)
- **First-Principles Reasoning**
- **5W1H Decomposition**
- **MECE Framework**
- **Analogical Prompting** (Yasunaga 2023, DeepMind)
- **Generated Knowledge** (Liu 2022)
- **Steel-Man Opposition**
- **Constitutional Self-Critique** (Anthropic-style)
- **Negative Prompting**
- **Confidence Calibration** (Lin/Hilton/Evans 2022)
- **Socratic Probing**
- **Few-Shot Exemplar Anchoring** (Brown 2020)
- **ReAct — Reason + Act** (Yao 2022)
- **Least-to-Most** (Zhou 2022, Google)

### 🎯 **5 New Injection Strategies (10 total)**
Core: Direct, Indirect, Stealth, System, Chain. New:
- **🧑‍🔬 Expert** — frames as a real consult to a named expert
- **❓ Socratic** — surfaces and probes hidden assumptions before answering
- **🛡️ Adversarial** — forces the answer to survive a hostile expert review
- **🏆 Tournament** — generates 3 candidate answers, scores them, picks the winner
- **♟️ Contrarian** — steel-mans the opposite first, folds insights into the conventional answer

### 🔗 **3-Pass Chain Refinement**
Chain enhancement now runs three targeted passes instead of one generic re-wrap:
1. **VERIFY** — chain-of-verification on every factual claim
2. **SHARPEN** — replaces vague language with concrete numbers / named examples
3. **DEHEDGE** — strips throat-clearing, undefended hedges, restated questions

Plus task-specific hardening at the end (code, research, creative, analysis, strategy, persuade).

## Earlier Highlights (v8.0)

### 🎯 **5 Injection Modes**
- **Direct**: Full replacement — paste the enhanced prompt as-is into AI chat
- **Indirect**: Wraps your original prompt with enhancement layers, keeping your words intact
- **Stealth**: Subtly improves your prompt without visible scaffolding — looks hand-written
- **System**: Generates system + user prompt pair (for API/playground use)
- **Chain**: Sets up a multi-turn conversation with quality ground rules

### 📊 **Prompt Scoring**
Real-time scoring on 5 dimensions:
- **Clarity**: Does the prompt have a clear action verb/ask?
- **Specificity**: Constraints, examples, concrete details?
- **Context**: Background info, role, situation?
- **Structure**: Organization, bullets, sections?
- **Actionability**: Defined outputs, format, deliverables?

Grades from S (masterful) to F (needs work), with improvement suggestions.

### 📝 **Prompt Templates**
12 ready-to-use templates across categories:
- Code Review, Debug Assistant, System Design
- Deep Research, Compare & Decide, ELI5 Expert
- Strategy Brief, Pro Writer, Email Crafter
- Brainstorm Mode, Data Analyst

### 🌐 **Context Capture**
Grab text from the current page and feed it into your prompt enhancement:
- Captures selected text or main page content
- Automatically weaves into the enhanced prompt
- Works across all supported AI platforms

### 🔗 **Chain Enhancement**
Double-enhance your prompts with a second pass that:
- Reviews the enhanced prompt for remaining gaps
- Adds specificity where still generic
- Strengthens weak requests into precise directives
- Applies task-specific hardening (code: error handling, research: sources, creative: sensory detail)

### ⚖️ **A/B Compare**
Side-by-side view of original vs enhanced prompt. See exactly what changed and how much value was added.

### 🔍 **History Search**
Search through past enhancements by prompt text, task type, or mode.

## Features

### 5 Enhancement Modes
- **☄️ Hail Mary**: Autonomous reasoning agent — best for strategy, persuasion, general tasks
- **🧠 Manus**: Orchestration agent with phases — best for code, math, how-to guides
- **⚡ Juma**: Multi-perspective reasoning — best for research, analysis, creative writing
- **🤖 Auto**: Intelligent routing based on prompt analysis
- **🔄 Turns**: Multi-turn conversation scaffolding (6/8/10 turns)

### 5 Depth Levels
1. **LITE**: Clean, focused enhancement
2. **STANDARD**: + examples, constraints
3. **ENHANCED**: + reasoning methods, depth escalation
4. **ULTRA**: + self-critique, web-learned techniques
5. **GOD 🔥**: Full power — adversarial review, confidence calibration, edge case hunting

### Auto-Inject & Auto-Submit
- Detects AI pages (ChatGPT, Claude, Gemini, Perplexity, Poe, Grok, DeepSeek, Copilot, Mistral, You.com)
- Choose any of 10 injection modes (Direct / Indirect / Stealth / System / Chain / Expert / Socratic / Adversarial / Tournament / Contrarian) before or after enhancing
- Optional auto-submit

### Supported Platforms
- ChatGPT / OpenAI
- Claude (Anthropic)
- Gemini (Google)
- Perplexity
- Poe
- Grok
- DeepSeek
- Copilot (Microsoft)
- Mistral Chat
- You.com
- Google AI Studio

## Installation

1. Open Chrome/Edge and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select this folder
5. The extension will auto-fetch knowledge on first install

## Usage

1. Click the HailMary icon in your toolbar
2. Type your raw prompt (or use a template)
3. **Score** your prompt to see improvement suggestions
4. Select mode, depth, and **injection mode** (Direct/Indirect/Stealth)
5. Click **FIRE HAIL MARY**
6. View the enhanced prompt — switch between injection strategies in the output tabs
7. Copy or auto-inject to your AI tab

### Context Capture Workflow
1. Navigate to a page with relevant content
2. Optionally select specific text
3. Click **🌐 Capture** in the popup
4. Write your prompt referencing the captured context
5. Enhance — the context is woven into the enhanced prompt automatically

### Chain Enhancement
1. Enhance a prompt normally
2. Click **🔗** in the output to apply a second enhancement pass
3. Or enable **Chain Pass** toggle before enhancing for automatic double-pass

## Architecture

- **engine.js** — Core enhancement engine with prompt scoring, injection strategies, templates, chain enhancement
- **popup.js** — UI controller with injection mode switching, template rendering, A/B compare
- **popup.html/css** — Enhanced UI with score panels, injection tabs, template browser
- **background.js** — Knowledge fetcher, memory manager, context storage relay
- **content.js** — Floating button with context menu (enhance, capture, score)

## Privacy

All data stays **100% local** in `chrome.storage.local`. Nothing is sent to external servers. Knowledge fetching uses only free, public APIs.

### Storage Keys
- `hm_v3`: User settings (mode, depth, toggles, injection mode)
- `hm_hist`: Enhancement history (last 30)
- `hm_knowledge`: Fetched techniques (up to 200)
- `hm_memory`: Learning data (prompt signatures, technique scores)
- `hm_captured_context`: Temporary captured page context

## Browser Compatibility
- Chrome 88+
- Edge 88+
- Any Chromium-based browser with Manifest V3 support
