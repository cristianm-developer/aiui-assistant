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
