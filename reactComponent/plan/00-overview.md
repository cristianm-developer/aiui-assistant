# Ia Front Ref Assistant — Índice de fases

Cada fase es incremental: compila y testea sola antes de pasar a la siguiente.
Prefijo de clases CSS: `ia-fra-`. Todo el estado vive en `AssistantProvider`
(React Context) y se persiste en `localStorage`.

| Fase | Archivo | Qué entrega |
|---|---|---|
| 1 | [01-foundations.md](01-foundations.md) | Tipos, constantes, storage, `AssistantProvider` (sin UI) |
| 2 | [02-floating-button-menu.md](02-floating-button-menu.md) | Botón flotante + menú principal (shell), toggle "Activo", timer 2s |
| 3 | [03-submenus.md](03-submenus.md) | Submenús "Capturar" y "Modo prompt" (toggles y acciones) |
| 4 | [04-dom-detection.md](04-dom-detection.md) | Escaneo del DOM: wrappers, componentes, elementos individuales (heurística) |
| 5 | [05-overlays.md](05-overlays.md) | Frames + labels: `CaptureOverlay` (hover) y `ShowOverlay` (persistente) |
| 6 | [06-prompt-modal-queue.md](06-prompt-modal-queue.md) | Modal de prompt, fila en localStorage, badge, copiar/vaciar, atajos ctrl/ctrl+alt |
| 7 | [07-integration-example.md](07-integration-example.md) | Composición final, `config.active` apaga todo, ejemplo de prueba, QA manual |
| 8 | [08-component-config.md](08-component-config.md) | `data-component-kind` + config de variantes/sizes/theme (`definitions` prop, `defineConfig`) |
| 9 | [09-claude-skills.md](09-claude-skills.md) | Skills + comando `/init-ia-front-assistent` de Claude Code (carpeta `ia-skills/` en la raíz del repo) — tagueo automático y sync del config |
| — | [10-parallel-execution-plan.md](10-parallel-execution-plan.md) | No es una fase nueva: reorganiza el trabajo de las fases 1-9 en oleadas paralelizables para despacho multi-agente |

## Decisiones ya cerradas (no volver a preguntar)

- **Elementos individuales**: sin atributo propio. Heurística de nodo hoja
  interactivo/con texto directo; id generado en runtime (path relativo al
  wrapper/componente padre), no se escribe en el DOM.
- **Submenús**: se abren con click (no hover), solo uno abierto a la vez.
- **Copiar fila**: bloques de texto plano `About {id} in {url}: {texto}`,
  separados por línea en blanco.
- **Ctrl+Click** en el botón: toggle de `config.active`, no abre el menú.
- **Ctrl+Alt+Click** en el botón: copia la fila + la vacía (= acción "Copiar"
  del submenú "Modo prompt").
- **Config de variantes/sizes/theme** (fase 8): llega como prop
  `definitions` (no `config`, ese nombre ya está tomado por el estado
  interno de fase 1), autoreada por el consumidor vía el helper
  `defineConfig` exportado por el paquete — no se "lee" ningún archivo en
  runtime, es el mismo patrón que `ThemeProvider` en Chakra/MUI.
- **`IaFrontRefAssistant` es un componente envolvente** (fase 7): recibe
  `children` (requerido) y envuelve el site/layout raíz del consumidor —
  `<IaFrontRefAssistant definitions={config}><App /></IaFrontRefAssistant>` —
  en vez de colocarse como un elemento suelto al final del árbol.
  `children` se renderiza sin wrapper propio; el helper visual (botón/menú/
  overlays/modal) va aparte, sin afectar el layout.
- **UI flotante vía Portal a `document.body`** (fase 7): evita que
  `position: fixed` se rompa si el wrapper queda anidado bajo un ancestro
  con `transform`/`filter`/`overflow`/`contain` en el árbol del consumidor.
- **SSR-safe** (fase 7): la UI flotante se monta recién en un `useEffect`
  ("mounted on client"); `children` sí se renderiza igual en servidor y
  cliente desde el primer render (SSR normal para el site).
- **Instancias anidadas de `<IaFrontRefAssistant>`**: la segunda instancia
  detecta el `AssistantContext` ya existente y solo renderiza `children`
  (no duplica provider/UI); `console.warn` en dev.

## Convenciones globales (leer antes de implementar cualquier fase)

Estas reglas aplican a **todas** las fases y no se repiten en cada archivo
salvo para recordar el punto puntual. Están acá para que no haya que
"decidir" nada suelto durante la implementación.

- **`'use client'`**: este paquete se consume potencialmente desde Next.js
  (App Router) u otros frameworks con RSC. La regla exacta: la directiva
  `'use client';` (primerísima línea del archivo, antes que cualquier
  `import`) va **solo** en archivos que exportan un **componente React**
  (función que devuelve JSX) o un **hook** (función `useXxx`) — es decir,
  los archivos que un consumidor puede terminar importando como "punto de
  entrada" a la parte interactiva del árbol. Aplica a: `AssistantContext.tsx`
  (exporta el hook `useAssistant`), `AssistantProvider.tsx`, todos los
  hooks (`useHoverCloseTimer`, `useTrackedTargets`, `useHoveredTarget`,
  `useRect`), todos los componentes de UI (`BugIcon`, `FloatingButton`,
  `Menu`, `MenuItem`, `SubMenu`, `ToggleRow`, `ActionRow`, `VariantSizePicker`,
  `ThemePicker`, overlays, `PromptModal`, `IaFrontRefAssistant`).
  Los módulos de **funciones utilitarias puras** que no exportan
  componentes/hooks **no** llevan la directiva, aunque internamente toquen
  `document`/`window`/`localStorage`/`navigator` — no son un boundary de
  RSC, son código plano que ya vive dentro del árbol cliente por la cadena
  de imports de quien los use. No lleva `'use client'`: `lib/types.ts`,
  `lib/constants.ts`, `lib/storage.ts`, `lib/dom.ts`, `lib/promptFormat.ts`,
  `lib/clipboard.ts`, `config/types.ts`, `config/defineConfig.ts`.
- **Nombres de archivos de test**: siempre colocados junto al archivo que
  testean, sufijo `.test.ts` (lógica pura) o `.test.tsx` (componentes/hooks
  con JSX/render) — nunca `.spec.ts` ni carpeta `__tests__` separada. Ej.:
  `src/lib/storage.ts` → `src/lib/storage.test.ts`.
- **Paleta y tokens visuales** (única fuente de verdad — no inventar otros
  valores en ninguna fase): definidos como variables CSS en `.ia-fra-root`
  dentro de `src/styles/index.css` (fase 2 crea el archivo, fases
  siguientes solo agregan reglas nuevas, nunca redefinen estas variables):

  ```css
  .ia-fra-root {
    --ia-fra-bg: #0d0d0d;
    --ia-fra-fg: #ffffff;
    --ia-fra-border: #2a2a2a;
    --ia-fra-accent: #3b82f6;
    --ia-fra-danger: #ef4444;
    --ia-fra-radius: 10px;
    --ia-fra-radius-sm: 6px;
    --ia-fra-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
    --ia-fra-gap: 8px;
    --ia-fra-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --ia-fra-font-size: 13px;
    --ia-fra-z: 2147483000; /* casi el máximo de un entero de 32 bits: por encima de casi cualquier z-index de un site real */
    --ia-fra-button-size: 52px;
  }
  ```

  Uso: `--ia-fra-accent` es el color de los frames/labels de captura y
  mostrar (fase 5), y del switch en estado "on" (fase 2). `--ia-fra-danger`
  es el badge de prompts pendientes (fase 6) y cualquier estado de error.
  `--ia-fra-z` va en el `z-index` del contenedor `.ia-fra-root` (el que se
  monta vía Portal, fase 7) para garantizar que quede por encima de
  cualquier contenido del site.

- **Ícono bug (SVG inline, sin dependencias)** — usarlo tal cual, no
  redibujar: un `<svg>` de trazos (stroke), controlado por `color` del
  padre vía `currentColor`, así hereda `--ia-fra-fg` automáticamente:

  ```tsx
  function BugIcon() {
    return (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <ellipse cx="12" cy="13" rx="5" ry="6" />
        <path d="M9 8 A3 3 0 0 1 15 8" />
        <path d="M9 8 L7 5" />
        <path d="M15 8 L17 5" />
        <path d="M7 10 L3 9" />
        <path d="M7 13 L3 13" />
        <path d="M7 16 L3 17" />
        <path d="M17 10 L21 9" />
        <path d="M17 13 L21 13" />
        <path d="M17 16 L21 17" />
      </svg>
    );
  }
  ```

  Vive en `src/components/BugIcon.tsx`, se importa desde `FloatingButton`.

- **Mensajes de error/texto de UI en español**: todo el texto visible para
  el usuario final del site (labels del menú, placeholder del textarea,
  mensajes de error) va en español, como en el resto de este plan. Los
  nombres de funciones/variables/componentes van en inglés (estándar de
  código).
- **Cada fase termina corriendo `npm test` y `npm run build` sin errores**
  antes de pasar a la siguiente — no es solo el criterio de fase 7, aplica
  a cada fase individualmente.

## Contrato de datos (DOM)

| Atributo | Para qué |
|---|---|
| `data-section-id` | wrapper contextual que envuelve una región independiente |
| `data-wrapper-id` | cualquier elemento con contenido/descendientes que agrupa y no es raíz de componente |
| `data-component-id` | componentes raíz |
| `data-component-kind` | tipo del componente raíz (ej. `Button`, `Card`) — opcional, ver fase 8 |
| (ninguno) | elementos individuales — ver fase 4 |
