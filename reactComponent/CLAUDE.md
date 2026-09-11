# CLAUDE.md — Technical Documentation

**Project:** AIUI Assistant
**Description:** Framework-agnostic visual widget (Preact bundled inside) to assist AI-driven coding — mounted via `mountIaFrontRefAssistant()`
**Version:** 0.1.14
**Status:** Complete (Phases 0-10)

---

## 📋 Quick Guide

### Structure

```
reactComponent/
├── src/              # Source code (TypeScript/React)
│   ├── lib/         # Pure utilities (types, constants, logic)
│   ├── config/      # Configuration and user types
│   ├── context/     # React Context + Provider
│   ├── hooks/       # Custom hooks (state, DOM tracking)
│   ├── components/  # React components
│   ├── styles/      # Modular CSS (tokens + partials)
│   └── index.ts     # Public exports
├── example/         # Example React app (consumes the library locally)
├── plan/            # Phase 0-10 documentation
├── package.json     # Metadata and scripts
├── tsconfig.json    # TypeScript configuration
├── vite.config.ts   # Vite config — one build, Preact bundled in (see "Build")
├── scripts/         # smoke*.mjs — post-build runtime checks
└── vitest.config.ts # Vitest configuration (tests)
```

### Main scripts

```bash
npm run build           # Build the library (single bundle, see "Build")
npm run smoke            # Runtime check of the built dist/ output
npm test               # Run tests (Vitest)
npm run dev            # Watch mode for development
npm run typecheck      # Check types (tsc --noEmit)
npm run example:dev    # Start the example app
```

---

## 🏗️ Architecture

### Main components

#### 1. **FloatingButton** (entry point)
- Fixed button in the bottom-right corner
- Badge shows the number of prompts
- Opens the menu on click
- Full control: Ctrl+click (capture), Ctrl+Alt+click (overlays)

#### 2. **Menu System** (navigation)
- Main menu with actions: Capture, Show, Clear, Exit
- SubMenu for contextual actions
- ToggleRow for switches (e.g. capture mode on/off)
- Automatic positioning (clamps to the viewport)

#### 3. **Overlay System** (visualization)
- **CaptureOverlay**: Interactive, allows clicking to capture
- **ShowOverlay**: Shows every detected element, non-interactive
- **FrameLabel**: Label with element name + automatic flip
- Efficient: RAF throttling in `useHoveredTarget` + `useRect`

#### 4. **PromptModal** (output)
- Editable textarea with captured prompts
- Integrations: VariantSizePicker + ThemePicker (if definitions exist)
- Copies to clipboard via a "Save" button

#### 5. **DOM Tracking** (`useTrackedTargets`)
- MutationObserver that detects changes
- Debouncing (120ms) for efficiency
- Supports 3 independent flags: sections, components, elements
- Leaf-node heuristic: identifies "atomic" elements vs. containers

#### 6. **Context** (global state)
- AssistantProvider manages config, prompts, flags
- Automatic localStorage persistence
- Field-by-field merge to tolerate old versions

---

## 🔑 Key Concepts

### Data attributes

The component identifies elements using 4 optional attributes:

```html
<!-- Section identified as "hero" -->
<section data-section-id="hero">
  <!-- Reusable component instance "card" -->
  <div data-component-id="featured-card" data-component-kind="card">
    <!-- Individual leaf element -->
    <button>Click me</button>
  </div>
</section>
```

**`data-section-id`**: Identifies a contextual wrapper around an independent page/view region (hero, footer, sidebar, etc.)
**`data-wrapper-id`**: Identifies any element that contains other elements/content and is not the root of a reusable component; wrappers may be nested
**`data-component-id`**: Identifies reusable instances
**`data-component-kind`**: Links to a config definition (e.g. "card", "button-primary")

### Automatic tagging

The `useTrackedTargets` hook scans the DOM:

1. Looks for elements with `data-section-id` → generates contextual section IDs
2. Looks for elements with `data-wrapper-id` → generates wrapper IDs
3. Looks for elements with `data-component-id` → generates relative IDs
4. Looks for "leaf" elements (elements with no text container) → generates IDs by selector

Every element is stored as a `TrackedTarget`:
```typescript
interface TrackedTarget {
  id: string;                    // Unique ID (e.g. "hero/featured-card/button[0]")
  type: TargetType;              // 'wrapper' | 'component' | 'element'
  element: HTMLElement;
  kind?: string;                 // Value of data-component-kind
  level: number;                 // Depth in the DOM
}
```

### User configuration

```typescript
interface IaFraConfig {
  active: boolean;               // Turn the component on/off globally
  components?: ComponentDefinition[]; // Component definitions
  theme?: ThemeTokenDefinition[];     // Theme token definitions
  prePrompt?: string;             // Fixed prompt guidance
  referenceAttributes?: readonly AIUIReferenceAttribute[];
  includeSemanticState?: boolean;
}
```

`referenceAttributes` defaults to the complete supported allowlist. Set
`includeSemanticState` to `false` only when boolean UI state should be omitted.
References include logical target type, route/source metadata, semantic
information, immediate parent context, visible content, and declared visual
styles rather than browser-computed defaults.

---

## 🧪 Tests

### Strategy

- **Unit tests**: For pure functions (`lib/`, hooks)
- **Component tests**: For React components (RTL)
- **Integration tests**: Full flows (Modal, Overlays, etc.)

### Coverage

```
src/lib/types.ts              → (types, untested)
src/lib/constants.ts          → (constants, untested)
src/lib/position.ts           → Tested
src/lib/dom.ts                → 7 tests
src/lib/storage.ts            → 9 tests
src/lib/promptFormat.ts       → (pure formatting, tested in Modal)

src/context/AssistantProvider → 8 tests
src/hooks/useTrackedTargets   → 13 tests
src/hooks/useHoverCloseTimer  → 5 tests

src/components/BugIcon        → 3 tests
src/components/FloatingButton → 9 tests
src/components/Menu/*         → 35 tests (Menu, MenuItem, SubMenu, etc.)
src/components/Overlay/*      → 33 tests (overlays + hooks)
src/components/PromptModal/*  → 27 tests (Modal, pickers)

src/IaFrontRefAssistant       → 3 tests (composition, Portal SSR)
src/mount                     → 5 tests (mountIaFrontRefAssistant: mount/unmount/idempotency/CSS injection)
src/index.ts                  → (exports, no tests)
```

**Total: 160 passing tests**

### Running them

```bash
# All tests
npm test

# Watch mode (development)
npm test:watch

# Specific tests
npm test -- src/lib/dom.ts

# With coverage (if Vitest supports it)
npm test -- --coverage
```

### Testing notes

- RTL (React Testing Library) is the foundation
- Snapshots are used minimally (only for SVG)
- `localStorage` is mocked in every test
- SSR-safety verified in AssistantProvider (mount guard)

---

## 🎨 Styling

### Modular CSS

Styles are split into partials to avoid conflicts during multi-agent compilation:

```
src/styles/
├── tokens.css         # Variables (:root, .ia-fra-root)
├── button-menu.css    # .ia-fra-button, .ia-fra-menu, .ia-fra-toggle
├── overlays.css       # .ia-fra-overlay, .ia-fra-frame
├── modal.css          # .ia-fra-modal, .ia-fra-textarea
├── pickers.css        # .ia-fra-picker, .ia-fra-pill
└── index.css          # @import of all partials (tokens first)
```

### CSS Variables

All defined in `tokens.css`, `--ia-fra-*` namespace:

```css
.ia-fra-root {
  /* Color palette */
  --ia-fra-bg: #ffffff;
  --ia-fra-fg: #1f2937;
  --ia-fra-border: #e5e7eb;
  --ia-fra-accent: #3b82f6;
  --ia-fra-danger: #ef4444;

  /* Layout */
  --ia-fra-radius: 6px;
  --ia-fra-spacing-xs: 4px;
  --ia-fra-spacing-sm: 8px;
  --ia-fra-spacing-md: 12px;

  /* Effects */
  --ia-fra-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --ia-fra-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Z-index (1000-wide gap to insert new layers)*/
  --ia-fra-z-overlay: 2147482999;
  --ia-fra-z-menu: 2147483000;
}
```

### Conventions

- **Prefix**: Every element uses `.ia-fra-*` to avoid collisions
- **Light BEM**: `.ia-fra-button`, `.ia-fra-button--active`, `.ia-fra-button__icon`
- **Responsive**: Mobile-first, media queries for desktop
- **Accessibility**: Focus outlines, contrast ratios, semantic HTML

---

## 📦 Build

### Vite (builder) — one bundle, Preact inside

`react`/`react-dom`/`react/jsx-runtime` are **aliased to `preact/compat`**
(see `resolve.alias` in `vite.config.ts`) instead of externalized, so Preact
ends up bundled inside the output instead of resolved from the consumer's
`node_modules`. This is the standard "alias React to Preact" technique
([preactjs.com/guide/v10/switching-to-preact](https://preactjs.com/guide/v10/switching-to-preact/#aliasing-react-to-preact))
— no code in `src/` needs to know or care that it ends up bundled with
Preact rather than React. The alias is skipped when `process.env.VITEST` is
set, so tests keep running against real `react`/`react-dom` (via
`@testing-library/react`) — see "Testing notes".

```typescript
// vite.config.ts (simplified)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: process.env.VITEST ? undefined : [
      { find: 'react-dom/client', replacement: 'preact/compat/client' },
      { find: 'react/jsx-runtime', replacement: 'preact/compat/jsx-runtime' },
      { find: 'react-dom', replacement: 'preact/compat' },
      { find: 'react', replacement: 'preact/compat' },
    ],
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AIUIAssistant',
      formats: ['es', 'cjs', 'iife'],
      fileName: (format) => /* ia-front-ref-assistant.{js,cjs,global.js} */,
    },
    // no `external` — preact (= react/react-dom aliased) ships bundled in
  },
});
```

**Outputs:**
- `dist/aiui-assistant.js` (ESM)
- `dist/aiui-assistant.cjs` (CommonJS)
- `dist/aiui-assistant.global.js` (IIFE, classic `<script>` — exposes `window.AIUIAssistant`)
- `dist/index.d.ts` (TypeScript definitions)
- `dist/style.css` (compiled styles — optional; `mountIaFrontRefAssistant()` already self-injects this same CSS at runtime)

Verify a build didn't regress with `npm run smoke` — it imports the
compiled `dist/aiui-assistant.js` (and loads
`dist/aiui-assistant.global.js` into a `<script>`) inside a real
jsdom document, outside Vite/Vitest, to confirm the widget actually mounts
with zero `react`/`react-dom` installed (`scripts/smoke*.mjs`). This is a
manual/CI smoke check, not part of `npm test` — it needs the `dist/` build
to exist first.

### Why no `<IaFrontRefAssistant>` export

`src/IaFrontRefAssistant.tsx` still exists and `mount.tsx` still renders it
— but it's not exported from `src/index.ts`. Once react/react-dom are
aliased to `preact/compat` for the build, this component's hooks are
Preact's hook implementation; a real React host reconciling it as a JSX
child of its own tree would call it without Preact's reconciler ever
setting the "current component" Preact's hooks read from, and it would
throw. `mountIaFrontRefAssistant()` sidesteps this entirely by creating its
own isolated render root via `preact/compat/client`'s `createRoot` — it's
never reconciled by the host, so it works the same regardless of what UI
runtime (if any) the host page uses. Don't re-export `IaFrontRefAssistant`
from `index.ts` without re-solving this.

### Size

- **JS (ESM)**: ~63 kB minified / ~18 kB gzip · **CJS**: ~46 kB minified / ~16 kB gzip · **IIFE global**: ~46 kB minified / ~16 kB gzip · **CSS**: ~6 kB minified / ~1.6 kB gzip (Preact bundled in, zero peer deps)

---

## 🔧 Development Workflow

### Initial setup

```bash
# Clone/install
git clone https://github.com/cristianm-developer/aiui-assistant.git
cd aiui-assistant/reactComponent
npm install

# Tests/verification
npm test
npm run typecheck

# Dev server (watch mode)
npm run dev
```

### Creating a new file

1. Place it in the right folder (`lib/`, `hooks/`, `components/`)
2. Create an adjacent `.test.ts(x)`
3. Export it from `src/index.ts` if it's public
4. Make sure it types correctly

### Editing styles

1. Edit the right CSS partial (e.g. `button-menu.css`)
2. Use `--ia-fra-*` variables from `tokens.css`
3. Never edit `index.css` directly (imports only)
4. Verify other sections aren't broken

---

## 🚀 Release / Publishing

### Pre-release checklist

- [ ] `npm run build` with no errors
- [ ] `npm test` — 100% passing
- [ ] `npm run typecheck` — no errors
- [ ] `npm run example:dev` — works well
- [ ] README updated
- [ ] CHANGELOG.md added
- [ ] Version bumped in `package.json`
- [ ] Git tag created

### Publishing to npm

```bash
# Bump version
npm version patch|minor|major

# Final build
npm run build

# Publish
npm publish

# Verify
npm info @cristianmpx/aiui-assistant
```

---

## 🐛 Debugging

### Useful logs

You can add these to AssistantProvider:

```typescript
// See current state
console.log('Config:', config);
console.log('Active targets:', targets);

// See capture events
console.log('Prompt captured:', promptEntry);
```

### React DevTools

- Inspect `<AssistantProvider>` to see global state
- Profiler to measure unnecessary renders

### Interactive overlay

```typescript
// In the browser console
const targets = document.querySelectorAll('[data-component-id]');
console.table(Array.from(targets).map(el => ({
  id: el.getAttribute('data-component-id'),
  kind: el.getAttribute('data-component-kind'),
  html: el.outerHTML.substring(0, 80)
})));
```

---

## 📚 Internal References

### Project phases (in `plan/`)

```
00-overview.md           → Overview and contract
01-data-types.md         → Base types
02-positioning.md        → Positioning
03-ui-shell.md          → Floating button
04-dom-tracking.md      → Detection engine
05-overlay-capture.md   → Capture mode
06-prompt-clipboard.md  → Prompt modal
07-component-assembly.md → Integration (IaFrontRefAssistant.tsx)
08-component-config.md  → User configuration
09-claude-code-integration.md → Skills for Claude Code
10-parallel-execution-plan.md → How it was executed (multi-agent)
```

### Critical files

- **`src/index.ts`** — Public entry point
- **`src/mount.tsx`** — `mountIaFrontRefAssistant()`, the only public way to mount the widget
- **`src/IaFrontRefAssistant.tsx`** — Internal root component (not exported — see "Why no `<IaFrontRefAssistant>` export")
- **`src/context/AssistantProvider.tsx`** — Global state
- **`src/hooks/useTrackedTargets.ts`** — Core DOM detection
- **`src/styles/tokens.css`** — Design system (source of truth)

---

## 🤝 Collaboration (Multi-agent)

If working with multiple agents (as in phase 10):

### Rules

1. **One file = one owner per wave** — Don't modify the same file at the same time
2. **Checkpoints between waves** — Verify each phase compiles/tests before the next
3. **Respect dependencies** — If your file imports something, wait for it to be complete first

### Phases (sequential)

1. **Wave 0** (1 agent) → types, constants, base CSS
2. **Wave 1** (8 agents in parallel) → components, hooks, context
3. **Wave 2** (1 agent) → CSS integration
4. **Wave 3** (1 agent) → final composition
5. **Wave 4** (1 agent) → patches and refinements

See `plan/10-parallel-execution-plan.md` for full details.

---

## 📝 Implementation Notes

### Why `useTrackedTargets` uses MutationObserver

- Detects DOM changes without polling
- Debouncing (120ms) avoids listener spam
- TreeWalker with a custom filter for the leaf-node heuristic

### Why localStorage + Context

- Context: reactive, real-time state (React)
- localStorage: persistence across reloads
- Field-by-field merge tolerates config upgrades

### Why a Portal for the UI

- Doesn't interfere with the user's layout (`display: none` or Portal)
- SSR-safe: checks `typeof window === 'undefined'`
- Z-index managed via CSS variables

### Why modular CSS in partials

- Enables parallel compilation (multi-agent)
- No merge conflicts in `styles/index.css`
- Each partial is independent until the final import

---

## 🎓 Lessons Learned

- **React 18/19 compat**: Watch out for hooks that depend on the version
- **LocalStorage + React**: Needs initialization in an effect, not during render
- **MutationObserver**: Can be expensive, needs debouncing
- **TreeWalker**: More efficient than querySelectorAll for traversal
- **Portal + SSR**: Always check that `document` exists

---

## 📞 Contact / Questions

If you need something clarified:

1. Check the corresponding phase file in `plan/`
2. Look for comments in the code (especially TODO/heuristic notes)
3. Check the tests to see the expected behavior

---

**Last updated:** 2026-08-22
**Built by:** Multi-agent system (waves 0-4)
