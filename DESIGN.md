# VIDENTIA DESIGN MASTER LOCK

Status: ACTIVE — MUST FOLLOW
Version: 2.0 — full public landing

This file is the implementation contract for VIDENTIA visual work. It exists to prevent reinterpretation between design passes. The approved user-supplied VIDENTIA graphics, the current production hero illustration, and the user's latest instruction to make the full landing richer and more atmospheric are the source of truth. If existing CSS, components, previous mockups, generated concepts, or legacy UI conflict with this file, this file wins.

## 1. Working method

Implementation remains section-by-section, but the active scope is now the complete public landing.

Order:
1. Hero + navigation
2. Trust strip
3. How it works
4. Main capabilities
5. Audiences
6. Ongoing protection / portfolio value
7. Final CTA
8. Footer

For each section:
- preserve the information architecture and truthful product claims;
- keep all real copy, navigation, forms and controls code-native;
- reuse the approved two-person comparison illustration already versioned in `/public`;
- use CSS/SVG for atmosphere, geometry, dividers and lighting; do not create new raster concept images;
- verify desktop and mobile before moving on;
- do not merge while a material visual or responsive mismatch remains.

## 2. Canonical visual direction

VIDENTIA must feel like:

`premium trademark intelligence × restrained Bauhaus geometry × dark evidence terminal`

The page is dark, calm and precise, but no longer visually flat. It may use controlled atmospheric depth that stays inside the locked brand palette.

Core characteristics:
- deep obsidian/teal environment;
- cream editorial typography;
- restrained green as the primary signal;
- mineral blue as secondary atmospheric light;
- Bauhaus circles, squares, arcs, grids and diagonals used as structural background geometry;
- thin one-color iconography;
- strong negative space;
- luminous accents only where they improve hierarchy or focus.

## 3. Locked palette

- Obsidian Teal Black: `#0F2A33`
- Deep Background: `#091A20`
- Brand Green: `#4A7F74`
- Soft Sage: `#96B5A6`
- Pale Mineral: `#B7D3D1`
- Muted Mineral Blue: `#456E8E`
- Warm Editorial Cream: `#E7DFCE`
- Body White: `#FFFFFF`
- Soft Neutral: `#BDBEBD`
- Graphite Teal: `#172F34`

No purple, magenta, bright cyan, electric blue or unrelated accent colors.

## 4. Typography

- Montserrat only.
- H1/H2 weight 300 or 400, never heavy bold.
- Major headings use Warm Editorial Cream, not pure white.
- One short phrase or keyword may use Brand Green.
- Body copy uses white or soft neutral according to hierarchy.
- Navigation and metadata remain small, thin and quiet.

## 5. Atmospheric effects — explicit user-approved exception

The previous blanket prohibition on gradients/glow is superseded by the user's latest instruction for a richer hero and full-page treatment.

Allowed:
- dark-to-darker linear gradients using only `#091A20` / `#0F2A33` / `#172F34`;
- restrained radial green and mineral-blue light fields at low opacity;
- very soft glow around primary signals, icons or the hero scene;
- 1px luminous borders using transparent brand-green/pale-mineral values;
- subtle geometric line grids and Bauhaus fields;
- soft edge fades that blend the illustration into the dark page;
- CSS masks/pseudo-elements for visual depth;
- modest hover illumination and translate effects.

Limits:
- no rainbow gradients;
- no neon cyan/green;
- no glassmorphism/frosted panels;
- no glossy 3D;
- no heavy drop shadows;
- no glow that reduces text or evidence legibility;
- no moving gradients;
- no cyberpunk visual language.

## 6. Hero + navigation

Hero copy remains exactly:
- `FUENTES OFICIALES · EVIDENCIA TRAZABLE`
- `Protege tu marca`
- `desde antes de`
- `registrarla.`
- `Investiga antecedentes, registra, vigila y administra tus marcas desde un solo lugar.`
- search placeholder `Buscar una marca, nombre o logo`
- action `BUSCAR`

Navigation remains:
- `BUSCAR`
- `REGISTRAR`
- `VIGILAR`
- `GESTIONAR`
- `PRECIOS`
- `RECURSOS`
- `INICIAR SESIÓN`
- `BUSCAR UNA MARCA`

Hero composition:
- approximately 43–47% copy / 53–57% visual on desktop;
- two-person comparison illustration dominates the right side;
- background behind the illustration combines the approved Bauhaus field with code-native subtle light/grids;
- image remains readable, faceless and faithful to the supplied pose;
- the hero may have restrained green/blue atmospheric light around the scene and search control;
- no additional hero proof chips.

## 7. Trust strip

Four items:
1. Revisión inicial gratuita
2. Fuentes oficiales
3. Evidencia trazable
4. Alertas inteligentes

Treatment:
- continuous dark band rather than four floating cards;
- thin vertical separators on desktop;
- large thin-line icon left/top;
- subtle green/blue light behind the icon only;
- title cream/white; description muted;
- stacks cleanly on mobile.

## 8. How it works

Section heading:
- `02. CÓMO FUNCIONA`
- `Un proceso simple, inteligente y trazable.`

Use four steps:
1. Busca — encuentra la marca o nombre a investigar.
2. Analiza — recopila antecedentes desde fuentes identificables.
3. Evalúa — organiza señales, similitud y evidencia para revisión.
4. Protege — conecta registro, vigilancia y administración continua.

Treatment:
- horizontal process rail on desktop;
- large geometric step symbols built from CSS/SVG/Lucide, not screenshot crops;
- subtle connecting line;
- no boxed card grid.

## 9. Main capabilities

Section heading:
- `03. CAPACIDADES PRINCIPALES`
- `Todo lo que necesitas para proteger tu marca.`

Capabilities remain truthful and product-supported:
- Búsqueda profunda
- Vigilancia continua
- Gestión centralizada
- Reportes con evidencia

Treatment:
- open two-column editorial layout on desktop;
- geometric icon motifs with low-opacity atmospheric halos;
- one clear CTA to plans/contact;
- no invented metrics or legal certainty claims.

## 10. Audiences

Section heading:
- `04. PARA QUIÉN ES`
- `Diseñado para equipos que construyen marcas.`

Audiences:
- Emprendedores
- Estudios jurídicos
- Empresas
- Agencias
- Corporaciones / equipos legales

Treatment:
- compact icon/label constellation, not repetitive cards;
- Bauhaus arc/dot composition on the side as structural decoration;
- keep descriptive copy limited.

## 11. Ongoing protection value

Use the existing truthful product axis:
- Portfolio
- Watch
- Deadlines

This section answers what changes after the initial search: what you own, what changed, what requires attention and what deadline comes next.

Treatment:
- dark band with three high-contrast signal blocks;
- subtle luminous rails, not floating glass cards;
- no fake live counts.

## 12. Final CTA

Copy:
- `EMPIEZA HOY`
- `Empieza a proteger tu marca hoy.`
- `Revisión inicial gratuita. Sin tarjeta de crédito.`

Actions:
- `BUSCAR UNA MARCA`
- `CONOCER PLANES`

Treatment:
- strong negative space;
- code-native Bauhaus semicircle/arc composition;
- primary action has restrained green light/border treatment;
- no full-screen glow or oversized effects.

## 13. Footer

Footer keeps:
- VIDENTIA wordmark/tagline;
- product/legal disclaimer;
- privacy and terms links;
- N3uralia attribution.

Use dark deep background, thin dividers and muted text. No visual noise.

## 14. Accessibility and motion

- WCAG 2.2 AA contrast for body text and controls.
- Keyboard focus remains visible.
- Touch targets >= 44px where practical.
- `prefers-reduced-motion` disables reveal/translate effects.
- Motion: 120–220ms for hover/focus, 400–600ms for section reveal; no elastic motion.
- Decorative geometry is `aria-hidden` / CSS-only.

## 15. Fidelity and quality gate

Before merge verify:
1. exact hero copy and three-line H1;
2. navigation labels and primary CTA;
3. search still routes to `/demo?marca=...`;
4. illustration loads at desktop/mobile without clipping the key pose;
5. page-wide palette stays inside locked colors;
6. atmospheric effects are subtle and never neon/glass;
7. trust strip, process, capabilities, audiences, ongoing protection, CTA and footer all share one visual system;
8. no invented customer logos, metrics, official records or legal outcomes;
9. desktop first viewport and full-page rhythm;
10. mobile stacking and no horizontal overflow;
11. no framework overlay or relevant console errors;
12. CI, CodeQL and Vercel build are green.

This file is the single source of truth for the public landing until the user explicitly changes direction again.
