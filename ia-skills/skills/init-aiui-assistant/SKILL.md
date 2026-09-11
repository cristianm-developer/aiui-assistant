---
name: init-aiui-assistant
description: Inicializa @cristianmpx/aiui-assistant en un proyecto, sincroniza metadata de frontend y configura opcionalmente el cleanup de producción para Vite, Astro o Next.js.
---

# Inicialización de AIUI Assistant

Usá el comando `/init-aiui-assistant` como procedimiento canónico. La
skill debe:

- Instalar `@cristianmpx/aiui-assistant` si falta.
- Crear o sincronizar `iafrontrefassistant.config.ts` y preguntar por el
  `prePrompt`, incluyendo las convenciones reales de estilos del proyecto.
- Preguntar si la referencia debe incluir todos los atributos disponibles
  (default) o una selección, y guardar la selección como `referenceAttributes`.
- Preguntar si debe incluir estados semánticos booleanos; por defecto usar
  `includeSemanticState: true` y guardar `false` solo si el usuario lo pide.
- Taguear secciones, wrappers lógicos y componentes raíz con
  `data-section-id`, `data-wrapper-id`, `data-component-id` y
  `data-component-kind`, sin retagear ids existentes.
- Crear o sincronizar una regla persistente en las instrucciones del agente
  que ejecuta el init (`AGENTS.md`, `CLAUDE.md` o regla de Cursor), explicando
  el contrato `data-*`, la diferencia entre section contextual y wrapper, la
  prioridad de clasificación y que esta metadata es necesaria para que AIUI
  detecte, agrupe y referencie targets correctamente.
- Agregar `mountIaFrontRefAssistant()` una sola vez en el entry point adecuado.
- Preguntar si se desea limpiar metadata en producción. Si se confirma:
  - Vite/Astro: usar `AIUIReactAssistCleanup()` en la configuración Vite.
  - Next.js: envolver `nextConfig` con
    `withAIUIReactAssistCleanup(nextConfig)`.
  - Vitest: no agregar plugin; el cleanup declara `apply: 'build'` y no corre
    durante tests ni desarrollo.

El cleanup remueve solamente los atributos `data-*` generados por AIUI del
HTML emitido; nunca modifica los archivos fuente. La captura genera una
referencia por elemento con tipo lógico, ruta, componente, clases, atributos,
estilos y origen disponible. Pedidos sucesivos sobre el mismo elemento se
agrupan en una sola entrada.

Para el detalle operativo y las preguntas interactivas, leer
`../../commands/init-aiui-assistant.md`.
