# HailMary v8.0 — Autonomous Prompt Agent

**Direct/Indirect/Stealth injection. Prompt scoring. Templates. Context capture. Chain enhancement. Adaptive intelligence.**

## What's New in v8.0

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
- Choose injection mode (Direct/Indirect/Stealth) before or after enhancing
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
