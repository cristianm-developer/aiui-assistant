---
name: init-ia-front-assistant
description: Usar cuando el usuario pida inicializar, instalar, auditar o sincronizar `ia-front-ref-assistant` en este proyecto (frases tipo "instalá ia-front-ref-assistant", "inicializá el asistente de IA", "sincronizá el tagueo de componentes"). Instala el paquete si falta, crea/sincroniza `iafrontrefassistant.config.ts`, crea o sincroniza una regla persistente del agente sobre el contrato de metadata, retagea vistas/componentes existentes con `data-section-id`/`data-wrapper-id`/`data-component-id`/`data-component-kind`, y agrega la llamada a `mountIaFrontRefAssistant()` si todavía no está.
---

# Inicialización de ia-front-ref-assistant

> Esta skill es la versión portable (formato [Agent Skills](https://agents.md))
> del comando `/init-ia-front-assistent` de Claude Code — mismo contenido,
> pensada para invocarse desde cualquier agente que lea `.agents/skills/`
> (Codex CLI vía `$init-ia-front-assistant`, Cursor, etc.), no solo desde
> Claude Code.

> El paquete ya está publicado en npm (`npm install ia-front-ref-assistant`);
> usá esa forma por default. Solo recurrí a la URL de git
> (`git+https://github.com/cristianm-developer/IaFrontRefAssistant.git`,
> subdirectorio `reactComponent`) si el usuario pide explícitamente
> instalar desde el repo (ej. para probar un cambio sin publicar).
> Si esta skill se corre desde una copia local
> del monorepo (herMANO de `reactComponent/` en el mismo checkout, típico
> mientras se desarrolla el propio paquete), usá esa ruta local
> (`file:../ruta/a/reactComponent`) en vez de la URL de git.

> El paquete trae [Preact](https://preactjs.com) embebido en su propio JS
> en vez de depender de `react`/`react-dom` — no hay que instalar nada más
> allá de `ia-front-ref-assistant` mismo, en ningún stack (React, Astro,
> Vue, Angular, Svelte, HTML plano). La única API pública es
> `mountIaFrontRefAssistant()`: crea su propia raíz de render y porta el
> widget a `document.body`, así que nunca hace falta envolver el árbol de
> la app — solo llamarla una vez, desde donde sea que la app arranque.

Ejecutá estos pasos en orden:

1. Detectá el gestor de paquetes del proyecto consumidor (`npm`, `pnpm` o
   `yarn`, por el lockfile presente: `package-lock.json`, `pnpm-lock.yaml`,
   `yarn.lock`; si no hay ninguno, asumí `npm`).
2. Verificá que `ia-front-ref-assistant` esté en las dependencias de
   `package.json`. **Si no está, instalalo vos mismo** (no le preguntes al
   usuario si quiere instalarlo — el paquete aplica a cualquier proyecto,
   no hay stack donde "no corresponda"):
   - `npm`: `npm install ia-front-ref-assistant`
   - `pnpm`: `pnpm add ia-front-ref-assistant`
   - `yarn`: `yarn add ia-front-ref-assistant`

   No instales `react`, `react-dom`, ni ninguna integración de framework
   como parte de este paso — no hacen falta.

   `dist/` ya viene compilado en el tarball publicado en npm, no hace falta
   ningún paso extra. (Si en cambio se instala desde la URL de git citada
   arriba, el script `prepare` del paquete corre `npm run build` automáticamente
   al instalar.) Si el install falla, mostrá el error tal cual y no sigas
   (no tagees ni montes nada sobre un paquete que no quedó instalado).
3. Si `ia-front-ref-assistant` ya estaba en las dependencias (paso 2 no
   tuvo que instalar nada), preguntale al usuario si quiere que igual se
   actualice a la última versión (`npm update ia-front-ref-assistant`
   o equivalente) antes de seguir — no lo hagas sin preguntar, puede tener
   una versión fijada a propósito.
4. Antes de escribir nada, **interrogá al usuario** sobre lo que sea
   ambiguo para generar un buen `prePrompt` (ver sección "Mapear
   prePrompt" de la skill `config-mapper`) — no lo inventes ni lo dejes en
   blanco solo porque el proyecto no deja algo 100% claro por sí solo. En
   concreto, preguntá (adaptá las preguntas si algo ya es evidente del
   código, no repreguntes lo obvio):
   - Qué skills/comandos propios del proyecto (si hay varios candidatos
     detectados en `.agents/skills/`, `ia-skills/` o el directorio
     equivalente) deberían citarse siempre en el prompt final, y con qué
     nombre exacto.
   - Si hay convenciones de implementación obligatorias (carpeta de
     componentes, patrón de nombrado, linter/formatter, librería de
     estilos) que la IA que reciba el prompt siempre deba tener en cuenta.
   - Si el usuario ya tiene una frase/texto que quiere usar tal cual como
     `prePrompt`, en vez de que se lo redacte esta skill.
   No sigas con el paso 5 hasta tener esto resuelto (con las respuestas
   del usuario, o con su confirmación explícita de que no hace falta
   `prePrompt` para este proyecto).
5. Creá o sincronizá una **regla persistente para el agente que ejecuta el
   init**, para que los futuros cambios de frontend mantengan el contrato de
   metadata que AIUI necesita para detectar, agrupar y referenciar targets.
   Detectá el archivo de instrucciones activo en este orden: `AGENTS.md` para
   agentes compatibles con Agent Skills/Codex, `CLAUDE.md` para Claude Code,
   o `.cursor/rules/aiui-assistant.mdc` para Cursor. Si no existe ninguno,
   creá `AGENTS.md` en la raíz del proyecto consumidor.

   Insertá o actualizá únicamente el bloque delimitado por estos marcadores,
   sin reemplazar instrucciones existentes:

   ```md
   <!-- aiui-assistant:frontend-data-contract:start -->
   ## AIUI frontend metadata contract

   Cuando crees o edites frontend en este proyecto, agrega y conserva los
   atributos `data-*` que permiten que `@cristianmpx/aiui-assistant` detecte
   y referencie correctamente cada target:

   - **Section contextual:** `data-section-id` identifica un wrapper que
     envuelve una región completa e independiente de la página/view, como
     hero, footer, sidebar o pricing. Una section es conceptualmente un
     wrapper, pero se conserva como tipo `section` para mantener el contexto
     regional.
   - **Wrapper:** `data-wrapper-id` identifica cualquier elemento que
     contiene otros elementos o contenido y no es la raíz de un componente
     reutilizable. Aplica a cualquier tag (`div`, `span`, etc.), incluidos
     agrupadores pequeños como icono + texto, grupos de botones y containers
     de layout. Los wrappers pueden anidarse.
   - **Component root:** `data-component-id` identifica únicamente el nodo
     raíz de un componente reutilizable; `data-component-kind` contiene su
     tipo estable (`PascalCase`). Nunca agregues esos atributos a los hijos
     internos del componente.
   - **Individual element:** un elemento hoja o contenido individual no
     necesita metadata de agrupador si no es section, wrapper o component.

   La prioridad de clasificación es: component root, section contextual,
   wrapper genérico y, por último, elemento individual. Usa ids descriptivos
   en kebab-case, únicos y estables dentro de la página. Conserva ids ya
   existentes; no reemplaces `id`, `data-testid` ni atributos del proyecto.
   No tagees componentes de terceros sin código fuente propio. Asegúrate de
   que la metadata exista en el DOM renderizado, incluso en vistas dinámicas.
   Sin esta metadata, AIUI no puede ofrecer una referencia precisa ni
   agrupar correctamente sections, wrappers y componentes en el prompt.
   <!-- aiui-assistant:frontend-data-contract:end -->
   ```

   La operación debe ser idempotente: si el bloque ya existe, actualizá su
   contenido sin duplicarlo y reportá el archivo modificado.
6. Usá la skill `config-mapper` para crear (si no existe) o sincronizar
   `iafrontrefassistant.config.ts` con los componentes, el theme y el
   `prePrompt` (con lo relevado en el paso 4) actuales del proyecto.
7. Recorré el código fuente de frontend del proyecto (vistas, componentes)
   y, usando las reglas de la skill `frontend-data-tagging`, agregá los
   atributos `data-section-id` / `data-wrapper-id` / `data-component-id` /
   `data-component-kind`
   donde falten. No re-tagear lo que ya está tagueado. Priorizá los
   directorios típicos de componentes/vistas del proyecto (detectalos por
   convención: `src/components`, `src/views`, `src/pages`, `app/`, etc. —
   los que existan).
8. **Agregá la llamada a `mountIaFrontRefAssistant()` si todavía no está.**
   Buscá si ya existe (grep de `mountIaFrontRefAssistant` o de
   `from 'ia-front-ref-assistant'`) — si ya está, no toques nada de este
   paso, solo confirmalo en el resumen. Si no está:
   1. Encontrá el **punto de arranque** del proyecto — no un componente
      raíz para envolver, solo dónde correr una línea de código una vez.
      Según el stack:
      - Next.js (App Router): un componente cliente chico montado desde
        `app/layout.tsx` (Server Component — no puede llamar
        `mountIaFrontRefAssistant()` directamente, pero puede renderizar un
        hijo `'use client'` que sí):
        ```tsx
        // app/components/AssistantMount.tsx
        'use client';
        import { useEffect } from 'react';
        import { mountIaFrontRefAssistant } from 'ia-front-ref-assistant';
        import config from '../../iafrontrefassistant.config';

        export function AssistantMount() {
          useEffect(() => {
            const handle = mountIaFrontRefAssistant(config);
            return () => handle.unmount();
          }, []);
          return null;
        }
        ```
        y montalo una vez en `app/layout.tsx`: `<AssistantMount />` dentro
        de `<body>`, junto a `{children}` (no hace falta envolverlo).
      - Next.js (Pages Router) / Remix: mismo patrón — un componente chico
        con `useEffect` + `mountIaFrontRefAssistant()`, montado una vez en
        `pages/_app.tsx` / `app/root.tsx`.
      - Vite/CRA/SPA de React genérica: llamalo directamente en
        `src/main.tsx`/`src/index.tsx`, junto a
        `ReactDOM.createRoot(...).render(...)` (no hace falta un
        componente aparte ni `useEffect` — no está dentro del árbol de
        React ahí).
      - Astro: un `<script>` (módulo ES normal, sin `@astrojs/react`) en el
        layout que comparten todas las páginas (el `.astro` con
        `<html>`/`<body>` y `<slot />` — normalmente
        `src/layouts/Layout.astro`).
      - Angular/Vue/Svelte/cualquier otro: en el entry point que arranca la
        app (`main.ts` en Angular/Vue/Svelte).
      - Sin bundler (HTML servido tal cual): dos `<script>` cerca de
        `</body>` — `<script src="ruta/a/node_modules/ia-front-ref-assistant/dist/ia-front-ref-assistant.global.js"></script>`
        seguido de `<script>window.IaFrontRefAssistant.mountIaFrontRefAssistant(config)</script>`.
      - Si no reconocés ninguno de estos, preguntale al usuario cuál es el
        punto de arranque de su app en vez de adivinar.
   2. Importá `mountIaFrontRefAssistant` desde `ia-front-ref-assistant` y
      `config` desde `iafrontrefassistant.config.ts` (creado/sincronizado
       en el paso 6), y llamá `mountIaFrontRefAssistant(config)` una sola
      vez en el punto encontrado. No hace falta importar ningún CSS —
      `mountIaFrontRefAssistant()` inyecta sus propios estilos.
   3. Es un cambio quirúrgico: agregá solo el/los import(s) y la línea de
      la llamada (o el componente chico + su uso, en los casos que lo
      necesitan), sin reordenar ni reformatear el resto del archivo.
9. Al terminar, mostrá un resumen: si se instaló el paquete (y con qué
   comando), cuántos wrappers/componentes se tagearon (y en qué archivos),
   cuántos ya estaban tagueados y se dejaron igual, el resumen que dejó
    `config-mapper` sobre el config (incluido el `prePrompt` final), en qué
    archivo se agregó o actualizó la regla del agente, y en qué archivo se
    agregó la llamada a `mountIaFrontRefAssistant()` (o si ya estaba).
10. Sugerí correr `npm run build`/`npm run dev` del proyecto consumidor para
   confirmar que todo compila con los cambios (instalación de dependencia,
   atributos `data-*`, y la nueva llamada de montaje).

Esta skill es **idempotente**: correrla dos veces seguidas no debe
reinstalar el paquete si ya está (paso 2), no debe duplicar ni cambiar una
regla existente fuera del bloque marcado, no debe duplicar ids ni volver a
taguear lo ya tagueado (paso 7 explícitamente dice "no re-tagear lo que ya
está tagueado"), no debe duplicar entradas en el config (paso 6 delega en
`config-mapper`, que actualiza entradas existentes en vez de agregarlas de
nuevo — y sobre el `prePrompt` puntualmente, si ya existe y el usuario no
pidió cambiarlo en el paso 4, `config-mapper` lo deja tal cual, no lo
regenera), y no debe agregar una segunda llamada a
`mountIaFrontRefAssistant()` (paso 8 explícitamente chequea si ya está
antes de tocar nada — y aunque no lo chequeara, la función misma es
idempotente en tiempo de ejecución, ver su doc-comment).

## Casos borde

- Proyecto sin ningún componente/vista detectable (recién creado, vacío) →
  esta skill crea igual el `iafrontrefassistant.config.ts` base (con
  `components: []`, `theme: []`) y reporta "0 componentes tagueados" sin
  error.
- Proyecto muy grande (cientos de componentes) → recorrer por directorios
  conocidos primero (paso 7) en vez de todo el repo, para no perder tiempo
  en `node_modules`, `dist`, `.next`, etc. (excluir siempre esas carpetas).
- El usuario no tiene skills/comandos propios detectables ni convenciones
  fijas que valga la pena citar siempre (proyecto chico, sin
  `.agents/skills/`/`ia-skills/` propio) → tras preguntar en el paso 4, si
  el usuario confirma que no hace falta, seguir sin `prePrompt` (no es
  obligatorio, ver nota en `config-mapper`).
- Un componente con `variant`/`size` tipado como `string` genérico (no
  union de literales) → no se puede derivar una lista cerrada de opciones;
  `config-mapper` no agrega `variants`/`sizes` para ese componente en ese
  caso (deja el array vacío/ausente), no inventa valores.
- No hay ningún caso de "el paquete no aplica a este proyecto" — el paso 8
  cubre React, cualquier stack con bundler, y HTML sin build alguno. No
  bloquees el paso 2 preguntando o negándote a instalar por el framework
  detectado.
- El install del paso 2 falla (sin acceso a la URL de git, red caída,
  permisos) → mostrar el error del gestor de paquetes tal cual y frenar
  ahí, sin seguir con el resto de los pasos.
- No se encuentra un punto de arranque reconocible en el paso 8
  (estructura de carpetas no estándar, monorepo con múltiples apps) →
  preguntarle al usuario cuál es el archivo correcto en vez de adivinar o
  modificar el primer archivo que aparezca.
