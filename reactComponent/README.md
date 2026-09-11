# AIUI Assistant

A framework-agnostic floating visual widget for working with AI coding assistants. It lets you capture, tag, and generate prompts for UI elements in real time — drop it into any web app to get started.

![Version](https://img.shields.io/badge/version-0.1.21-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## What is it?

**AIUI Assistant** mounts into your app and gives you:

- 🎯 **Visual capture** of HTML elements via an interactive overlay
- 📍 **Automatic tagging** of components and sections with data attributes
- 💬 **Prompt generation** with code, configuration, route, and viewport context
- 🖼️ **Optional visual captures** as clipboard attachments and local PNG files
- 🧩 **Agent skill pack** for repeatable project initialization and metadata tagging
- 🎨 **Customizable theming** via CSS tokens
- ⚙️ **Per-component configuration** for variants and sizes

It's especially useful when working with Claude, ChatGPT, or any AI coding assistant — it lets you capture visual references from your UI and turn them into detailed, in-context prompts.

## Framework support

The package is **framework-agnostic**. It ships [Preact](https://preactjs.com) bundled inside its own JavaScript and does not require `react`, `react-dom`, or a framework integration package. The same public API works in React, Astro, Vue, Angular, Svelte, and plain HTML.

Integration is intentionally DOM-based: call `mountIaFrontRefAssistant()` once from the browser entry point or a client-side script. The assistant mounts its own isolated root and does not wrap, render, or depend on your application's component tree.

## Installation

### The package

```bash
npm install @cristianmpx/aiui-assistant
```

No peer dependencies to install — the package's own build already bundles what it needs to render.

### Recommended: install the skill pack (automated setup)

Installing the package by itself only gets you the widget — you still have to hand-write `iafrontrefassistant.config.ts`, tag your existing components, and call `mountIaFrontRefAssistant()` yourself. This repository also ships a versioned **AIUI Assistant skill/plugin pack** that does all of that for you: adds the dependency, creates/syncs the config file, tags your existing components, and wires up the mount call — idempotently, safe to re-run any time.

The skills are plain Markdown (`SKILL.md` with YAML frontmatter), following the shared, multi-vendor [Agent Skills](https://agents.md) convention — so the same files work across tools. What differs per tool is only *where* Skills are discovered from and how you register them:

| Tool | Skills folder it reads | How to install this pack |
|---|---|---|
| **Claude Code** | `.claude/skills/` (project) or via a plugin | `/plugin marketplace add https://github.com/cristianm-developer/aiui-assistant.git` then `/plugin install aiui-assistant@aiui-assistant`. |
| **OpenAI Codex** | Native plugin | Add this repository as a Codex plugin source and install `aiui-assistant`; the manifest is at [`ia-skills/.codex-plugin/plugin.json`](../ia-skills/.codex-plugin/plugin.json). |
| **Cursor** | Native skill directory or plugin format | Use the canonical skills in [`ia-skills/skills/`](../ia-skills/skills/) through Cursor's skill installation flow. |
| **Claude.ai / Claude API** | Uploaded or API-configured skills | Upload the `ia-skills/skills/*/SKILL.md` folders or register them through the Skills API. |
| **Any other assistant** | Varies | Copy or register the canonical `SKILL.md` files under [`ia-skills/skills/`](../ia-skills/skills/) with that system's native skill format. |

([`degit`](https://github.com/Rich-Harris/degit) needs no install of its own — `npx degit ...` pulls just that subfolder without cloning the whole repo or leaving a `.git` behind.)

Once installed, invoke `init-aiui-assistant` (as `/init-aiui-assistant` in Claude Code or through the equivalent skill command in another compatible system).

#### Non-interactive / CI

The `/plugin` commands above are typed inside an interactive Claude Code session. To register and install the plugin from a script instead, add the marketplace to `.claude/settings.json` and install with the `--yes` CLI flag:

```json
// .claude/settings.json
{
  "extraKnownMarketplaces": [
    { "name": "aiui-assistant", "source": "https://github.com/cristianm-developer/aiui-assistant.git" }
  ],
  "enabledPlugins": { "ia-skills": true }
}
```
```bash
claude plugin install aiui-assistant@aiui-assistant --scope project --yes
```
`enabledPlugins` only toggles a plugin that's already installed — it doesn't install it by itself, so the `claude plugin install ... --yes` step is still required once per machine/CI runner.

## How to use

### Give this setup prompt to your AI coding agent

Copy this prompt into the coding agent you want to use inside your application repository:

```text
Read the AIUI Assistant repository at https://github.com/cristianm-developer/aiui-assistant and use it as the source of truth for this integration.

In this application repository, install the published npm package @cristianmpx/aiui-assistant with the existing package manager; inspect and use the compatible canonical skills and plugin manifests from ia-skills/; then run init-aiui-assistant (or the equivalent native skill command). The initialization must inspect the real frontend, style system, components, theme tokens, and conventions; create or synchronize iafrontrefassistant.config.ts and its confirmed prePrompt; persist the AIUI metadata contract in the active agent instructions; tag sections, logical wrappers, and reusable component roots without retagging existing elements or third-party components; add mountIaFrontRefAssistant(config) exactly once at the real browser entry point; and configure production metadata cleanup for the detected build system using AIUIReactAssistCleanup() for Vite/Astro or withAIUIReactAssistCleanup(nextConfig) for Next.js. Keep metadata in development/tests, remove it only from production HTML, preserve source files, keep the changes idempotent and narrowly scoped, ask only genuinely ambiguous decisions, and finish by running the relevant checks and reporting changed files and validation results. Do not install from Git unless I explicitly ask to test an unreleased change.
```

### Install and mount manually

Call `mountIaFrontRefAssistant()` once wherever your app boots — for example in `main.ts`, an Astro layout `<script>`, or a client-side lifecycle hook. It creates its own render root and portals the widget into `document.body`, so it doesn't need to wrap your app's JSX/template:

```tsx
// e.g. main.ts, main.tsx, an Astro client script, or any app entry point
import { mountIaFrontRefAssistant, defineConfig } from '@cristianmpx/aiui-assistant';

const config = defineConfig({
  active: true,
  components: [{
    kind: 'Button',
    variants: [{ value: 'primary', label: 'Primary' }],
    sizes: [{ value: 'md', label: 'Medium' }],
  }],
  theme: [{ key: 'color-primary', label: 'Primary color' }],
});

mountIaFrontRefAssistant(config);
```

No CSS import needed either — `mountIaFrontRefAssistant()` injects its own styles. See [INTEGRATION.md](INTEGRATION.md) for the exact call site in React, Next.js, Astro, Angular, Vue, Svelte, and plain HTML.

## Tagging Elements

For the widget to identify your elements, use explicit section, wrapper, and component attributes. They are plain HTML attributes, so they work the same in JSX, Astro/Vue/Angular templates, or raw HTML:

```html
<!-- Site section -->
<section data-section-id="hero">
  <div data-wrapper-id="hero-content">
  <h1>Welcome</h1>

  <!-- Individual component -->
  <div data-component-id="cta-button" data-component-kind="Button">
    <button>Sign Up</button>
  </div>
  </div>
</section>
```

> If you installed via the Claude Code skill pack above, this tagging is done for you automatically by `/init-aiui-assistant`.

### Supported attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-section-id` | Identifies an independent page/view section | `data-section-id="hero"` |
| `data-wrapper-id` | Identifies any logical visual container, regardless of HTML tag; wrappers may be nested | `data-wrapper-id="hero-content"` |
| `data-component-id` | Identifies a reusable component instance | `data-component-id="cta-button"` |
| `data-component-kind` | Identifies the source component type | `data-component-kind="Button"` |

## AI-ready frontend context

When a target is captured, AIUI Assistant can generate a framework-agnostic reference containing its logical type (`section`, `wrapper`, `component`, or `element`), route, component name, source file/line, visible text, classes, semantic attributes, declared visual styles, and immediate visual parent.

The prompt modal provides two formats:

- **Copy reference** — readable text for a normal coding prompt.
- **Copy JSON** — structured context for agents, scripts, and automation.
- **Include visual capture** — optionally captures the target, previews it, copies it as an image, and saves a local PNG path in the prompt.

Multiple requests for the same target are grouped into one prompt entry. Queue
copy groups entries by origin, route, and viewport and formats them as Markdown;
rich clipboard output preserves attached images when supported.

### Reference configuration

All supported attributes are included by default. Use the exported `AIUI_REFERENCE_ATTRIBUTES` constant as the canonical list, or select a subset through `referenceAttributes`. Set `includeSemanticState: false` to omit boolean states such as `disabled`, `checked`, and `expanded`.

The style context includes only declared visual properties from inline CSS and matching stylesheet rules: display/flex alignment, dimensions, spacing, overflow, colors, font size/weight/line height, border, and border radius. Browser-computed defaults are excluded.

## Advanced Configuration

### `defineConfig(options)`

Type-safe configuration helper:

```ts
import {
  AIUI_REFERENCE_ATTRIBUTES,
  defineConfig,
} from '@cristianmpx/aiui-assistant';

const config = defineConfig({
  // Turn the widget on/off globally
  active: true,

  // Reusable component definitions
  components: [
    {
      kind: 'Button',
      variants: [{ value: 'primary', label: 'Primary' }],
      sizes: [{ value: 'md', label: 'Medium' }],
    },
  ],
  theme: [{ key: 'color-primary', label: 'Primary color' }],
  referenceAttributes: AIUI_REFERENCE_ATTRIBUTES,
  includeSemanticState: true,
});
```

### `mountIaFrontRefAssistant(definitions?, options?)`

```ts
mountIaFrontRefAssistant(
  config,          // optional — the object from defineConfig()
  {
    container: myDiv, // optional — defaults to a <div> it creates and appends to document.body
  }
);
```

Returns `{ unmount() }` if you ever need to tear the widget down. Calling it more than once is a no-op (logs a dev warning) — safe to call from code that might run twice (e.g. React Strict Mode, HMR).

## Features

### Floating button

- Fixed in the bottom-right corner
- Badge showing the number of captured prompts
- Controls: click = open menu, Ctrl+click = toggle capture, Ctrl+Alt+click = toggle overlays

### Main menu

- **Capture** — enable capture mode (interactive overlay)
- **Show Overlays** — display all detected elements
- **Clear Prompts** — clear captured prompts
- **Exit** — close the menu

### Capture mode

- Hover over elements to see their DOM structure
- Click to capture a reference to the element
- Escape to cancel

### Show overlays mode

- Displays all detected elements (wrappers, components, elements)
- Hover elements to see details
- Stays active until turned off

### Prompt modal

- Holds all captured prompts
- Editable textarea for refinements
- If a config exists: variant and theme pickers
- Optional visual capture with preview, image clipboard copy, and local PNG download
- "Save" button copies a ready-to-use text/Markdown prompt; rich clipboard output preserves images when supported

## Styling and Theming

The widget uses CSS custom properties for theming:

```css
.ia-fra-root {
  /* Colors */
  --ia-fra-bg: #ffffff;
  --ia-fra-fg: #1f2937;
  --ia-fra-border: #e5e7eb;
  --ia-fra-accent: #3b82f6;
  --ia-fra-danger: #ef4444;

  /* Spacing */
  --ia-fra-radius: 6px;
  --ia-fra-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);

  /* Z-index */
  --ia-fra-z-overlay: 2147482999;
  --ia-fra-z-menu: 2147483000;
}
```

`mountIaFrontRefAssistant()` injects its own `<style>` tag, appended to `document.head` the first time it runs. To override tokens, add your own rule for `.ia-fra-root` **after** calling `mountIaFrontRefAssistant()` (so it wins the cascade), or target it with higher specificity/`!important` if your override needs to load earlier:

```css
/* your-theme.css — loaded/injected after mountIaFrontRefAssistant() */
.ia-fra-root {
  --ia-fra-accent: #your-brand-color;
  --ia-fra-bg: #your-bg;
}
```

## Development Scripts

Run these from `reactComponent/`:

```bash
# Build the library in watch mode
npm run dev

# One-off build (for release)
npm run build

# Run tests
npm test

# Tests in watch mode
npm run test:watch

# TypeScript typecheck
npm run typecheck

# Runtime smoke test of the built dist/ output (zero react/react-dom installed)
npm run smoke

# Example project
npm run example:install
npm run example:dev
```

## Full Example

See [reactComponent/example/](reactComponent/example/) for a working React app that uses the widget.

To run it:

```bash
npm run example:install
npm run example:dev
```

Then open http://localhost:5173 in your browser.

## Code Structure

```
reactComponent/src/
├── lib/                    # Utilities
│   ├── types.ts           # Base types (TargetType, AssistantConfig)
│   ├── constants.ts       # Constants (attributes, timeouts)
│   ├── position.ts        # Positioning math
│   ├── dom.ts             # Element detection and tagging
│   ├── storage.ts         # localStorage persistence
│   └── promptFormat.ts    # Prompt formatting
│
├── config/                # Configuration
│   ├── types.ts           # Config types (IaFraConfig)
│   └── defineConfig.ts    # Type-inference helper
│
├── context/               # React Context
│   ├── AssistantContext.tsx      # Context definition
│   └── AssistantProvider.tsx     # Provider with state
│
├── hooks/                 # Custom hooks
│   ├── useHoverCloseTimer.ts     # Auto-close timer
│   └── useTrackedTargets.ts      # MutationObserver-based detection
│
├── components/            # UI components (internal — not part of the public API, see "API Reference")
│   ├── FloatingButton.tsx        # Main floating button
│   ├── BugIcon.tsx               # Bug SVG icon
│   ├── Menu/                     # Dropdown menu
│   │   ├── Menu.tsx
│   │   ├── MenuItem.tsx
│   │   ├── SubMenu.tsx
│   │   ├── ToggleRow.tsx
│   │   └── ActionRow.tsx
│   ├── Overlay/                  # Visual overlays
│   │   ├── CaptureOverlay.tsx   # Interactive capture mode
│   │   ├── ShowOverlay.tsx      # Show-all-elements mode
│   │   ├── FrameLabel.tsx       # Frame labels
│   │   ├── useHoveredTarget.ts  # Hover-tracking hook
│   │   └── useRect.ts           # DOMRect hook
│   └── PromptModal/              # Prompt modal
│       ├── PromptModal.tsx       # Main modal
│       ├── VariantSizePicker.tsx # Variant picker
│       └── ThemePicker.tsx       # Theme picker
│
├── styles/                # CSS
│   ├── tokens.css         # Variables and base
│   ├── button-menu.css    # Button and menu
│   ├── overlays.css       # Overlays
│   ├── modal.css          # Modal
│   ├── pickers.css        # Pickers
│   └── index.css          # Imports all partials
│
├── IaFrontRefAssistant.tsx  # Internal root component (used by mount.tsx only — see "Why no <IaFrontRefAssistant> export")
└── mount.tsx                # mountIaFrontRefAssistant() — the public entry point

ia-skills/                  # Canonical skills plus Codex/Claude plugin manifests
├── .codex-plugin/
├── .claude-plugin/
│   └── plugin.json         # Plugin manifest
├── commands/
│   └── init-aiui-assistant.md       # /init-aiui-assistant
└── skills/
    ├── aiui-config-mapper/
    ├── aiui-frontend-data-tagging/
    └── init-aiui-assistant/
```

## API Reference

### Exported types

```typescript
// Configuration
export interface IaFraConfig {
  active?: boolean;
  components?: ComponentDefinition[];
  theme?: ThemeTokenDefinition[];
  prePrompt?: string;
  referenceAttributes?: readonly AIUIReferenceAttribute[];
  includeSemanticState?: boolean;
}

export interface ComponentDefinition {
  kind: string;
  variants?: ConfigOption[];
  sizes?: ConfigOption[];
}

export interface ThemeTokenDefinition {
  key: string;
  label: string;
  values?: ConfigOption[];
}

export interface ConfigOption {
  value: string;
  label: string;
}

export type AIUIReferenceAttribute = string;

export type TargetType = 'section' | 'wrapper' | 'component' | 'element';

export interface AssistantConfig {
  active: boolean;
  capture: { sections: boolean; wrappers: boolean; components: boolean; elements: boolean };
  show: { sections: boolean; wrappers: boolean; components: boolean };
}

export interface PromptImageAttachment {
  type: 'image';
  mimeType: 'image/png';
  dataUrl: string;
}

export interface ViewportInfo {
  width: number;
  height: number;
  devicePixelRatio: number;
}

export interface PromptEntry {
  id: string;
  targetId: string;
  targetType: TargetType;
  url: string;
  text: string;
  attachments?: PromptImageAttachment[];
  viewport?: ViewportInfo;
  createdAt: number;
  requestCount?: number;
}
```

### Exported functions

```typescript
// Type-safe configuration helper
export function defineConfig(config: IaFraConfig): IaFraConfig

// Mounts the widget in its own render root and injects its own CSS —
// see "Basic Usage" above.
export function mountIaFrontRefAssistant(
  definitions?: IaFraConfig,
  options?: { container?: HTMLElement }
): { unmount: () => void }
```

A classic `<script>` global build is also published at `dist/aiui-assistant.global.js` for zero-bundler setups — it exposes the same two functions under `window.AIUIAssistant`. See [INTEGRATION.md](INTEGRATION.md#plain-html-no-bundler).

### Why no `<IaFrontRefAssistant>` JSX component export

Earlier versions exported a `<IaFrontRefAssistant>{children}</IaFrontRefAssistant>` component meant to wrap your app's JSX. That pattern is now internal-only: this package bundles [Preact](https://preactjs.com) instead of depending on `react`/`react-dom` (see "Compatibility"), and a real React reconciler in a host app cannot correctly render a component built against a different, bundled UI runtime as a child of its own tree — Preact's hooks need Preact's own reconciler to track their state, which a foreign React tree never provides. `mountIaFrontRefAssistant()` doesn't have this problem because it creates and manages its own isolated render root, so it's the one supported way to mount the widget, in React apps included.

## Production metadata cleanup

The assistant's `data-*` attributes are useful while capturing references, but can be removed from production HTML. For Vite or Astro:

```ts
import { AIUIReactAssistCleanup } from '@cristianmpx/aiui-assistant';

export default defineConfig({
  plugins: [AIUIReactAssistCleanup()],
});
```

The plugin runs only during production builds, so it does not affect development or Vitest. For Next.js, wrap the config with `withAIUIReactAssistCleanup(nextConfig)`. The source files remain unchanged. If debugging metadata should remain available, pass `keepAttributes`:

```ts
AIUIReactAssistCleanup({
  keepAttributes: ['data-route', 'data-source-file', 'data-source-line'],
});
```

`referenceAttributes` controls what information is sent to the AI; `keepAttributes` controls which attributes remain in production HTML. They are independent settings. To exclude boolean semantic states from the reference:

```ts
includeSemanticState: false
```

Copied references include only declared visual styles from inline CSS and matching stylesheet rules: display/flex alignment, dimensions, spacing, overflow, colors, font size/weight/line height, border and border radius. Browser-computed defaults are excluded.

## Compatibility

- **Browsers**: Chrome/Edge 90+, Firefox 88+, Safari 14+
- **Frameworks**: none required — the package bundles [Preact](https://preactjs.com) internally (no `react`/`react-dom`/`@astrojs/react`/etc. to install), so `mountIaFrontRefAssistant()` works the same in React, Next.js, Astro, Angular, Vue, Svelte, or plain HTML with no build step at all (`dist/aiui-assistant.global.js` as a classic `<script>`). See [INTEGRATION.md](INTEGRATION.md) for per-framework call sites.
- **SSR**: Supported (detects `typeof document === 'undefined'` and no-ops)

## License

MIT © 2026

## Contributing

Contributions are welcome. Please:

1. Fork the repository
2. Create a branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -am 'Add amazing feature'`)
4. Push the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues, questions, or suggestions, open an issue on GitHub.
