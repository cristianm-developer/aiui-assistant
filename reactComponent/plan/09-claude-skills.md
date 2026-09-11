# Fase 9 — Skills y comando de Claude Code (`/init-ia-front-assistent`)

No es código de la librería (no toca `src/`, no corre en el navegador, no
tiene tests con Vitest). Es tooling de **Claude Code** que se distribuye
junto al paquete para que, al codar en un proyecto que usa
`ia-front-ref-assistant`, el propio asistente de IA (Claude) sepa: (1)
taguear siempre los componentes/wrappers con los `data-*` del contrato,
(2) mantener `iafrontrefassistant.config.ts` sincronizado con los
componentes/theme reales del proyecto, y (3) auditar/retro-taguear código
ya existente que todavía no cumple el contrato.

Corresponde a los 3 puntos pedidos:

1. Skill que se aplica siempre que se construye/edita frontend → taguear.
2. Skill que mapea theme + componentes al config (crearlo si no existe).
3. Comando `init` que configura y revisa que vistas/componentes existentes
   cumplan el contrato (usa las dos skills de arriba).

## Dónde viven estos archivos

**A nivel raíz del repo** (no dentro de `reactComponent/`) — carpeta
`ia-skills/`, hermana de `reactComponent/`:

```
IaFrontRefAssistant/          (root del repo, contiene también reactComponent/)
  ia-skills/
    plugin.json
    skills/
      frontend-data-tagging/
        SKILL.md
      config-mapper/
        SKILL.md
    commands/
      init-ia-front-assistent.md
  reactComponent/
    ...
```

Va fuera de `reactComponent/` a propósito: no es parte del paquete npm que
se publica (no debe terminar en `dist/` ni en el tarball de `npm publish`),
es tooling de Claude Code que se distribuye/instala por separado. El
`README.md` de `reactComponent/` debe documentar dos formas de instalarlo
en el proyecto consumidor (apuntando a la carpeta `ia-skills/` del repo):

- Como plugin de Claude Code (`/plugin add` apuntando a este repo o a la
  carpeta `ia-skills/`, según el mecanismo vigente de instalación de
  plugins — **verificar contra la documentación oficial de Claude Code
  vigente al momento de implementar**, el formato exacto de `plugin.json`
  puede diferir de lo mostrado acá).
- Copiando manualmente `skills/*` a `.claude/skills/` y `commands/*` a
  `.claude/commands/` del proyecto consumidor, si no se quiere depender del
  mecanismo de plugins.

## `plugin.json`

```json
{
  "name": "ia-front-ref-assistant",
  "version": "0.1.0",
  "description": "Tagueo automático data-wrapper-id/data-component-id/data-component-kind y sincronización de iafrontrefassistant.config.ts."
}
```

(Manifest mínimo — no repetir acá campos de un schema que no se puede
verificar en este documento; si el schema real de `plugin.json` pide más
campos, agregarlos según la versión de Claude Code usada al implementar.)

## Skill 1 — `frontend-data-tagging`

Se activa (Claude la reconoce como relevante) cada vez que el usuario pide
crear o editar componentes/vistas de frontend en un proyecto que tiene
`ia-front-ref-assistant` como dependencia o ya tiene un
`iafrontrefassistant.config.ts` en el root — **no** en proyectos que no usan
el paquete.

`skills/frontend-data-tagging/SKILL.md`:

```markdown
---
name: frontend-data-tagging
description: Usar SIEMPRE que se cree, genere o edite código de frontend (componentes, vistas, secciones, layouts) en un proyecto que tenga `ia-front-ref-assistant` como dependencia en package.json o un archivo `iafrontrefassistant.config.ts` en el root. Asegura que los wrappers, las secciones contextuales y los componentes raíz lleven los atributos data-wrapper-id / data-section-id / data-component-id / data-component-kind.
---

# Tagueo de frontend para Ia Front Ref Assistant

Este proyecto usa `ia-front-ref-assistant`. Todo código de frontend que
generes o edites debe respetar este contrato de atributos `data-*`:

| Atributo | Va en | Valor |
|---|---|---|
| `data-section-id` | Wrapper contextual que envuelve una región independiente de una página/view (hero, footer, sidebar, etc.) | kebab-case, descriptivo del rol de esa región en ESA página (ej. `hero`, `pricing-table`, `footer`) |
| `data-wrapper-id` | Cualquier elemento que contiene otros elementos o contenido y funciona como agrupador, sin importar si es `<div>`, `<span>` u otro tag | kebab-case, descriptivo del contenido/rol del agrupador (ej. `hero-content`, `title-group`) |
| `data-component-id` | El elemento raíz de un componente reutilizable (no cada wrapper interno del componente, solo el nodo más externo) | kebab-case, único dentro de la página. Si hay más de una instancia del mismo componente en la misma vista, sufijo numérico: `cta-card-1`, `cta-card-2` |
| `data-component-kind` | El mismo elemento raíz que lleva `data-component-id` | El **tipo** del componente, estable entre instancias — PascalCase igual al nombre del componente fuente (ej. `Button`, `CtaCard`, `Modal`). Dos instancias del mismo componente comparten `kind` pero no `id`. |

Reglas:

- Solo el nodo **raíz** de un componente lleva `data-component-id`/
  `data-component-kind` — nunca los hijos internos del mismo componente
  (evita "capturar" ruido: el usuario de la herramienta quiere clickear el
  componente completo, no cada `<div>` interno).
- Un wrapper es cualquier elemento que contiene otros elementos o contenido y
  no es la raíz de un componente reutilizable. Incluye agrupadores pequeños
  como un `<span>` con icono y texto, además de grupos de botones, bloques de
  contenido y containers de layout. La etiqueta HTML no cambia la
  clasificación y los wrappers pueden anidarse.
- Una sección es un wrapper contextual: un agrupador que envuelve una región
  completa e independiente de la página/view. Se identifica con
  `data-section-id`, no con `data-wrapper-id`; puede contener wrappers y
  componentes. Una sección también es conceptualmente un wrapper, pero se
  conserva como tipo `section` para mantener su contexto regional.
- La prioridad de clasificación es: raíz de componente (`data-component-id`),
  sección contextual (`data-section-id`), wrapper genérico (`data-wrapper-id`)
  y, por último, elemento individual.
- No re-tagear elementos que ya tienen `data-section-id`/`data-wrapper-id`/`data-component-id`
  al editarlos — preservar el id existente salvo que el usuario pida
  explícitamente renombrar el componente/sección (un id estable es lo que
  permite que las conversaciones sobre "el cta-card" sigan siendo válidas
  entre sesiones).
- Si el componente ya tiene el atributo `id`/`data-testid`/similar del
  proyecto, **no** reemplazarlo — `data-wrapper-id`/`data-component-id`/
  `data-component-kind` son atributos adicionales, no sustituyen otros que
  el proyecto ya use para otros fines (testing, analytics, etc.).
- Componentes de terceros (una librería de UI externa que el proyecto solo
  consume, sin código fuente propio) no se tagean — el contrato aplica a
  componentes **del proyecto**, escritos por el equipo (o por la propia
  IA).
- Si el proyecto tiene `iafrontrefassistant.config.ts` con `components`
  definidos, el `kind` que se use al taguear un componente nuevo debería
  coincidir con una entrada existente si el componente es del mismo tipo
  (ej. si ya existe `{ kind: 'Button', ... }`, un nuevo botón usa
  `data-component-kind="Button"`, no inventa `"Btn"` o `"ButtonPrimary"`).
  Si es un componente genuinamente nuevo sin entrada en el config, taguear
  igual con el `kind` que corresponda — la skill `config-mapper` (u
  `/init-ia-front-assistent`) se encarga de agregar la entrada al config después, no
  hace falta bloquear el tagueo por eso.
```

## Skill 2 — `config-mapper`

Se activa cuando el usuario pide explícitamente crear/actualizar/sincronizar
`iafrontrefassistant.config.ts`, o cuando la invoca el comando
`/init-ia-front-assistent`.

`skills/config-mapper/SKILL.md`:

```markdown
---
name: config-mapper
description: Usar cuando el usuario pida crear, actualizar o sincronizar iafrontrefassistant.config.ts con los componentes y el theme reales del proyecto (variantes, sizes, tokens de color/radios/etc. usados en el CSS), o cuando el comando /init-ia-front-assistent la invoque.
---

# Mapeo de componentes/theme a iafrontrefassistant.config.ts

Objetivo: que `iafrontrefassistant.config.ts` (root del proyecto
consumidor) refleje los componentes reales del proyecto (con sus variantes
y tamaños, si el componente los soporta como prop) y los tokens de theme
reales (colores, radios, etc. usados en el CSS/design system del
proyecto), usando el helper `defineConfig` que exporta
`ia-front-ref-assistant`.

## Si el archivo no existe

Crearlo con esta forma base (ver
[08-component-config.md](08-component-config.md) del plan de la librería
para el tipo exacto de `IaFraConfig`):

\`\`\`ts
import { defineConfig } from '@cristianmpx/aiui-assistant';

export default defineConfig({
  components: [],
  theme: [],
});
\`\`\`

## Mapear componentes

Para cada componente del proyecto que tenga `data-component-kind` (ver
skill `frontend-data-tagging`) o que sea candidato a tenerlo:

1. Buscar su definición de props (interface/type de TS, o PropTypes).
2. Si tiene una prop tipo `variant` (o similar: `type`, `appearance`) con
   un union de strings literales, o una prop `size` con union de strings —
   esos son los candidatos a `variants`/`sizes` del config.
3. Agregar/actualizar la entrada correspondiente en `components`:

\`\`\`ts
{
  kind: 'Button', // debe matchear el data-component-kind real
  variants: [
    { value: 'primary', label: 'Primario' },
    { value: 'ghost', label: 'Fantasma' },
  ],
  sizes: [
    { value: 'sm', label: 'Chico' },
    { value: 'md', label: 'Mediano' },
  ],
}
\`\`\`

   `label` en español, legible para un humano eligiendo en un selector;
   `value` es el valor técnico real de la prop (debe poder usarse tal cual
   en el código, no traducir el `value`).

4. **Nunca borrar** una entrada de `components` que ya esté en el archivo
   solo porque no se la detectó en este pase — puede haber sido escrita a
   mano por el usuario con variantes que no vienen de una prop TS literal
   (ej. vienen de una librería externa de estilos). Si una entrada parece
   corresponder a un componente que ya no existe en el código fuente, no
   borrarla tampoco: dejar un comentario `// TODO: revisar, no se encontró
   el componente "X" en el código fuente` arriba de esa entrada, y avisar
   al usuario en el resumen final.
5. Para una entrada que sí existe y sí se pudo mapear de nuevo, actualizar
   sus `variants`/`sizes` para que reflejen el estado actual del código
   (agregar valores nuevos, no borrar valores existentes que ya no se
   detecten — mismo criterio conservador que con componentes enteros, un
   valor pudo agregarse a mano por una razón que el escaneo no ve).

## Mapear theme

Buscar tokens de theme reales del proyecto (variables CSS custom
properties `--algo` en hojas de estilo globales, o el archivo de config de
Tailwind si el proyecto lo usa, u otro design system detectable) y
agregarlos a `theme` como `ThemeTokenDefinition`:

\`\`\`ts
{ key: 'border-radius', label: 'Border radius' }
{ key: 'bg-color', label: 'Color de fondo', values: [
  { value: '#0d0d0d', label: 'Fondo oscuro' },
  { value: '#ffffff', label: 'Fondo claro' },
] }
\`\`\`

`values` solo se completa si se pueden extraer valores concretos y
nombrables del proyecto (ej. una paleta de colores con nombres definidos);
si no hay forma clara de nombrarlos, dejar el token sin `values` (el
usuario completa el valor a mano en el modal, ver
[08-component-config.md](08-component-config.md)) — no inventar nombres
para colores que no tienen uno claro en el código fuente.

## Al terminar

Mostrar al usuario un resumen: cuántas entradas de `components` se
agregaron/actualizaron, cuántos tokens de `theme` se agregaron, y qué
entradas quedaron marcadas con el `TODO` de revisión manual.
```

## Comando `/init-ia-front-assistent`

Es el punto de entrada único: configura el proyecto de punta a punta la
primera vez, y sirve para re-auditar después de cambios grandes.

`commands/init-ia-front-assistent.md`:

```markdown
---
description: Inicializa o audita ia-front-ref-assistant en este proyecto — crea/sincroniza iafrontrefassistant.config.ts y retagea vistas/componentes existentes con data-wrapper-id/data-component-id/data-component-kind.
---

Ejecutá estos pasos en orden:

1. Verificá que `ia-front-ref-assistant` esté en las dependencias de
   `package.json`. Si no está, avisá al usuario y no continúes (preguntá
   si quiere instalarlo antes de seguir).
2. Usá la skill `config-mapper` para crear (si no existe) o sincronizar
   `iafrontrefassistant.config.ts` con los componentes y el theme actuales
   del proyecto.
3. Recorré el código fuente de frontend del proyecto (vistas, componentes)
   y, usando las reglas de la skill `frontend-data-tagging`, agregá los
   atributos `data-wrapper-id` / `data-component-id` / `data-component-kind`
   donde falten. No re-tagear lo que ya está tagueado. Priorizá los
   directorios típicos de componentes/vistas del proyecto (detectalos por
   convención: `src/components`, `src/views`, `src/pages`, `app/`, etc. —
   los que existan).
4. Al terminar, mostrá un resumen: cuántos wrappers/componentes se
   tagearon (y en qué archivos), cuántos ya estaban tagueados y se dejaron
   igual, y el resumen que dejó `config-mapper` sobre el config.
5. Sugerí correr `npm run build`/`npm run dev` del proyecto consumidor para
   confirmar que nada se rompió con los cambios (agregar atributos `data-*`
   no debería romper nada, pero es una verificación barata).
```

Es **idempotente**: correrlo dos veces seguidas no debe duplicar ids ni
volver a taguear lo ya tagueado (paso 3 explícitamente dice "no re-tagear
lo que ya está tagueado"), ni duplicar entradas en el config (paso 2
delega en `config-mapper`, que actualiza entradas existentes en vez de
agregarlas de nuevo).

## Casos borde

- Proyecto sin ningún componente/vista detectable (recién creado, vacío) →
  `/init-ia-front-assistent` crea igual el `iafrontrefassistant.config.ts` base (con
  `components: []`, `theme: []`) y reporta "0 componentes tagueados" sin
  error.
- Proyecto muy grande (cientos de componentes) → recorrer por directorios
  conocidos primero (paso 3) en vez de todo el repo, para no perder tiempo
  en `node_modules`, `dist`, `.next`, etc. (excluir siempre esas carpetas).
- Un componente con `variant`/`size` tipado como `string` genérico (no
  union de literales) → no se puede derivar una lista cerrada de opciones;
  `config-mapper` no agrega `variants`/`sizes` para ese componente en ese
  caso (deja el array vacío/ausente), no inventa valores.
- El usuario corre `/init-ia-front-assistent` en un proyecto que **no** usa React (el
  paquete es React-only) → el comando debe detectar esto (ausencia de
  `react`/`react-dom` en dependencias) y avisar que el paquete no aplica,
  sin intentar taguear nada.

## Instalación (agregar al `README.md` del paquete)

Documentar ambas vías (plugin vs copia manual, ver sección "Dónde viven
estos archivos" arriba) con instrucciones paso a paso, y mencionar
`/init-ia-front-assistent` como el primer comando a correr después de instalar
`ia-front-ref-assistant` en un proyecto.
