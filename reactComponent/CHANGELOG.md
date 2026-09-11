# CHANGELOG

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.20] — 2026-09-11

### Added

- Save visual captures as local PNG downloads and include their relative paths in prompts.
- Group copied prompts by origin, route, and viewport with Markdown formatting.
- Separate pasted references from prompt content and support Markdown separators between prompts.

### Changed

- Improve prompt modal proportions, spacing, focus states, and visual hierarchy.
- Preserve origin metadata once per grouped context while avoiding repeated route metadata.

## [0.1.19] — 2026-08-31

### Fixed

- Preserve visual captures in `Ctrl+Alt+click` prompt copying and avoid silently falling back to text-only clipboard data.

## [0.1.18] — 2026-08-31

### Fixed

- Preserve visual captures when copying the prompt queue by writing both plain-text and HTML clipboard formats.

## [0.1.17] — 2026-08-31

### Documentation

- Clarified that any logical visual container is a wrapper, regardless of its HTML tag.

## [0.1.16] — 2026-08-31

### Added

- Added multimodal prompt attachments for optional visual captures.
- Added viewport width, height, and device pixel ratio to generated prompts.
- Prompt routes now omit the local host and repeated requests group by target and route.
- Expanded automatic wrapper detection to generic visual aggregators such as icon-and-text spans.

## [0.1.15] — 2026-08-27

### Added

- Count individual saved requests in the widget badge while preserving grouped prompt entries for the clipboard queue.
- Added the Codex plugin manifest and aligned the Claude Code plugin with the `aiui-assistant` identity.
- Renamed the canonical skills and initialization command to the `aiui-*` namespace.
- Translated the package description to English.

## [0.1.14] — 2026-08-27

### Added

- Renamed the published package to `@cristianmpx/aiui-assistant` and aligned the repository documentation and skill installation paths with the new project identity.
- Added AI-ready target references for sections, wrappers, components, and elements, including route, source location, component name, semantic state, visible content, immediate parent context, and declared visual styles.
- Added readable-text and JSON copy formats, plus grouping of repeated requests for the same target.
- Added configurable `referenceAttributes` and `includeSemanticState` options.
- Added production metadata cleanup for Vite/Astro and Next.js, including the `keepAttributes` allowlist.

### Documentation

- Updated the user guide, integration guide, documentation index, and skill guidance in English to describe the current API and production workflow.

## [0.1.3] — 2026-08-25

- Published the framework-agnostic `mountIaFrontRefAssistant()` integration for React, Astro, Vue, Angular, Svelte, and plain HTML.
- Bundled Preact at build time so consumers do not need React runtime peer dependencies.
- Added the global browser build and runtime smoke tests.

## [Unreleased]

### ⚠️ Breaking

- **The package now bundles [Preact](https://preactjs.com) instead of depending on `react`/`react-dom` as peer dependencies.** `react`/`react-dom` are no longer declared as `peerDependencies` at all — nothing to install alongside this package anymore, in any project.
- **Removed the public `<IaFrontRefAssistant>` JSX component.** It's still used internally, but no longer exported from `ia-front-ref-assistant` — a real React reconciler cannot correctly render a component built against a different, bundled UI runtime (Preact) as a child of its own tree, so the old `<IaFrontRefAssistant>{children}</IaFrontRefAssistant>` wrapping pattern is unsafe under the new build and has been dropped rather than left as a footgun. Use `mountIaFrontRefAssistant()` instead (see below) — it doesn't have this problem, since it manages its own isolated render root instead of being reconciled by the host framework, and already worked this way for every framework, React included.
- There is only one build/entry point now — the short-lived `ia-front-ref-assistant/standalone` subpath from the previous unreleased draft of this entry is gone; `ia-front-ref-assistant`'s main entry *is* the standalone build.

### ✨ Added

- **`mountIaFrontRefAssistant(definitions?, options?)`** — the package's only public way to mount the widget now. Creates its own isolated render root and portals the widget into `document.body`, works identically in React, Next.js, Astro, Angular, Vue, Svelte, or plain HTML (see `INTEGRATION.md`), with zero peer dependencies (Preact is bundled into the JS at build time — see "Breaking" above). Also injects its own CSS (a `<style>` tag), so there's no separate `ia-front-ref-assistant/style.css` import needed. Idempotent (a second call anywhere on the page is a no-op with a dev warning) and returns `{ unmount }` for cleanup.
- A classic IIFE build, `dist/ia-front-ref-assistant.global.js`, for zero-bundler setups — exposes `window.IaFrontRefAssistant.mountIaFrontRefAssistant(...)`.

### 📝 Documentation

- `INTEGRATION.md` and both `README.md` files rewritten around the single `mountIaFrontRefAssistant()` call site, with per-framework examples for React, Next.js, Remix, Astro, Angular, Vue, Svelte, and plain HTML.

## [0.1.2] — 2026-08-22

### 📝 Documentation
- `README.md` rewritten in English (was Spanish)
- Documented installation for the 3 most common tools — Claude Code, OpenAI Codex CLI, and Cursor — with each one's actual path and mechanism (verified against their official docs), instead of assuming Claude Code only
- Note: v0.1.1 was published to npm with the old Spanish `README.md` (it got published before the translation was finished); this bump carries no other code changes

## [0.1.1] — 2026-08-22

### 🐛 Fixed
- **`useRect`** — the first render never updated the rect (it waited for a 100ms throttle window even on the very first tick), breaking overlays until the second frame
- **`FrameLabel`** — the whole frame (not just the label) captured `pointer-events`, blocking clicks on underlying content when `interactive`
- **`process.env.NODE_ENV`** accessed without a guard — could throw `ReferenceError: process is not defined` in consumer bundlers that don't polyfill `process` in the browser
- Stale `ThemePicker` tests (assumed a pill/toggle UI that no longer exists; the component uses `<select>`) — rewritten to match the current UI
- Packaging: `README.md`/`LICENSE` were missing from inside `reactComponent/`, so they weren't published with the npm package

## [0.1.0] — 2025-08-21 — Initial Release

### ✨ Added

#### Core
- **`IaFrontRefAssistant` component** — App root with SSR-safety
  - Renders via Portal to `document.body`
  - Detects nested instances with a warning
  - Supports a `definitions` prop for user configuration

#### UI/UX
- **FloatingButton** — Fixed button in the bottom-right corner
  - Badge showing the number of captured prompts
  - Interactions: click (menu), Ctrl+click (capture), Ctrl+Alt+click (overlays)
  - Dynamic opacity when inactive

- **Menu System** — Hierarchical navigation
  - Menu.tsx — Main menu, dynamically positioned
  - MenuItem.tsx — Generic rows with chevron and slots
  - SubMenu.tsx — Side submenus with automatic positioning
  - ToggleRow.tsx — Switches with an animated slider
  - ActionRow.tsx — Action buttons

- **Overlay System** — Element visualization
  - CaptureOverlay.tsx — Interactive mode to capture elements
  - ShowOverlay.tsx — Persistent mode showing all elements
  - FrameLabel.tsx — Element labels with automatic flip
  - useHoveredTarget.ts — Hook to track the element under the mouse (RAF throttling)
  - useRect.ts — Hook to track a DOMRect via an RAF loop

- **PromptModal** — Prompt generator
  - Editable modal with a textarea
  - VariantSizePicker.tsx — Variant and size picker
  - ThemePicker.tsx — Theme token picker (collapsible)
  - Copy to clipboard via a "Save" button

#### Functionality
- **DOM Tracking** (`useTrackedTargets`)
  - Automatic element detection via MutationObserver
  - Debouncing (120ms) for efficiency
  - Supports 3 independent flags: sections, components, elements
  - "Leaf" (atomic) element heuristic

- **State Management** (AssistantProvider + Context)
  - Global context with useState
  - Automatic localStorage persistence
  - Field-by-field merge to tolerate upgrades

- **Storage** (SSR-safe)
  - Wrapper around localStorage with a fallback
  - JSON serialization/deserialization
  - Silent error handling (never crashes the app)

- **Positioning** (clampMenuPosition)
  - Automatic calculation to avoid overflow
  - Configurable margin
  - Respects viewport bounds

#### Configuration
- **IaFraConfig** — Configuration interface
  - `active` — Turn the component on/off globally
  - `currentVariant` — Current variant
  - `currentTheme` — Current theme
  - `components` — Reusable component definitions
  - `themeTokens` — Theme definitions

- **defineConfig()** — Helper for compile-time type inference

#### Styling
- **CSS design system** — 14 base variables
  - Color palette (bg, fg, border, accent, danger)
  - Spacing and typography
  - Shadows and border-radius
  - Configurable z-index

- **Modular CSS** — 5 files + 1 index
  - tokens.css — Variables and base
  - button-menu.css — Floating button and menu
  - overlays.css — Overlays and frames
  - modal.css — Prompt modal
  - pickers.css — Variant/theme pickers
  - index.css — Final imports

#### Documentation
- **README.md** — Full user guide
  - Installation
  - Basic usage
  - Advanced configuration
  - API reference
  - Compatibility

- **CLAUDE.md** — Technical documentation for developers
  - Architecture and components
  - Key concepts
  - Tests and coverage
  - Development workflow
  - Debugging

- **INTEGRATION.md** — Integration guides
  - Examples for: React+Vite, Next.js, CRA, Remix, Astro
  - Advanced use cases
  - Troubleshooting
  - Performance tips

- **CHANGELOG.md** — This file

#### Testing
- **152 passing tests** (21 files)
  - Unit tests for libraries (`lib/`, `hooks/`)
  - Component tests for React (RTL)
  - Integration tests for full flows

- **Coverage:**
  - storage.ts → 9 tests
  - AssistantProvider.tsx → 8 tests
  - useTrackedTargets.ts → 13 tests
  - useHoverCloseTimer.ts → 5 tests
  - FloatingButton.tsx → 9 tests
  - Menu system → 35 tests
  - Overlay system → 33 tests
  - PromptModal system → 27 tests
  - BugIcon.tsx → 3 tests
  - IaFrontRefAssistant.tsx → 2 tests

#### Build & Distribution
- **Vite lib mode build**
  - ESM: dist/ia-front-ref-assistant.js (~26.5 kB)
  - CJS: dist/ia-front-ref-assistant.cjs (~18 kB)
  - TypeScript definitions: dist/index.d.ts
  - Compiled styles: dist/style.css (~3 kB)

- **Package exports**
  - Main entry: IaFrontRefAssistant
  - Subexport: `ia-front-ref-assistant/style.css`
  - Public types exported

#### Claude Code Skills
- **plugin.json** — Plugin manifest
- **frontend-data-tagging SKILL** — Automatic element tagging
- **config-mapper SKILL** — Configuration mapping
- **init-ia-front-assistent command** — Project initialization

### 🏗️ Architecture
- **Pure components** — No side effects except where necessary
- **Custom hooks** — useTrackedTargets, useHoverCloseTimer, useAssistant
- **React Context** — Global state via a Provider
- **Portal rendering** — Floating UI that doesn't affect layout
- **SSR-safe** — Detects `typeof window` in AssistantProvider

### 🎨 Design
- **Mobile-first CSS** — Responsive at every size
- **Light BEM** — `.ia-fra-*` prefix to avoid collisions
- **CSS variables** — Customizable token system
- **Accessibility** — ARIA labels, focus management, semantic HTML

### 📦 Dependencies
- **Peer Dependencies:** React 18+/19+, ReactDOM 18+/19+
- **Dev Dependencies:** TypeScript, Vite, Vitest, React Testing Library, JSdom

### 🔧 Configuration
- `vite.config.ts` — Builder and lib mode
- `vitest.config.ts` — Test runner
- `tsconfig.json` — TypeScript strict mode
- `package.json` — Scripts and metadata

### 📋 Execution
Built in **5 parallel waves**:

1. **Wave 0** (1 agent) — Pure foundations
   - 6 base files (types, constants, positioning, DOM, CSS tokens)
   - Checkpoint: typecheck ✓

2. **Wave 1** (8 agents in parallel) — The bulk of the work
   - A: Storage/Context (3 files, 13 tests)
   - B: UI shell (7 files, 47 tests)
   - C: Submenu (2 files, 13 tests)
   - D: DOM engine (1 file, 20 tests)
   - E: Overlays (6 files, 33 tests)
   - F: Prompt/clipboard (4 files)
   - G: Config + pickers (4 files, 19 tests)
   - H: Skills (4 files, in parallel with everything)
   - Checkpoint: 145 tests ✓

3. **Wave 2** (1 agent) — CSS integration
   - 1 file (final imports)
   - Checkpoint: build ✓

4. **Wave 3** (1 agent) — Full integration
   - 3 files (IaFrontRefAssistant, index.ts, App.tsx)
   - Checkpoint: 152 tests, build ✓

5. **Wave 4** (1 agent) — Phase 8 patches
   - 6 sequential patches (advanced configuration)
   - Checkpoint: tests + build ✓

**Total:** ~70 files, 152 tests, zero merge conflicts

### ✅ Checks
- ✓ TypeScript typecheck (with pre-existing warnings)
- ✓ npm test — 152 passing tests
- ✓ npm run build — Build succeeds
- ✓ npm run example:dev — Example app works
- ✓ SSR-safe — Supports Next.js, Astro
- ✓ React 18/19 compatible

---

## Notes for this release

### Technical debt
- Some tests have `act()` warnings (don't fail the tests)
- typecheck reports pre-existing errors in certain test files (not in the main code)
- Vulnerabilities in transitive dependencies (audit fix pending)

### Future roadmap
- [ ] Theme builder UI
- [ ] Cloud sync for prompts
- [ ] Real-time collaboration
- [ ] Export prompts to different formats
- [ ] Integration with more AI assistants
- [ ] "Screenshot" mode to save overlays
- [ ] Customizable keyboard shortcuts
- [ ] Anonymous analytics

### Breaking changes
N/A — First release

---

## How to contribute

1. Read [CLAUDE.md](CLAUDE.md) to understand the architecture
2. Read [plan/10-parallel-execution-plan.md](plan/10-parallel-execution-plan.md) for the workflow
3. Make sure tests pass: `npm test`
4. Check types: `npm run typecheck`
5. Update CHANGELOG.md for any notable change

---

**Release date:** August 21, 2025
**Built by:** Multi-agent system (Haiku + Sonnet)
**Development time:** ~8 hours (parallel)
**Tests:** 152/152 ✓
**Build:** ✓ Successful
