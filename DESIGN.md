# VIDENTIA DESIGN MASTER LOCK

Status: ACTIVE — MUST FOLLOW

This file is the implementation contract for VIDENTIA visual work. It exists to prevent reinterpretation between design passes. The approved user-supplied reference graphics and `VIDENTIA_FINAL_BRAND_BIBLE_CODEX.md` are the source of truth. If existing CSS, components, previous mockups, generated concepts, or legacy UI conflict with this file, this file wins.

## 1. Working method

Implementation is section-by-section. Do not redesign the whole page at once.

Order:
1. Hero + navigation
2. Trust strip
3. How it works
4. Main capabilities
5. Audiences
6. Trust / logos
7. Final CTA
8. Footer
9. Authenticated product surfaces

For each section:
- use the supplied reference image as the visual target;
- keep copy and information architecture code-native;
- reuse or recreate the approved visual asset at production resolution;
- implement only that section;
- verify desktop and mobile;
- compare browser render against the reference before moving to the next section;
- do not advance while a material fidelity mismatch remains.

## 2. Canonical reference set

The approved reference set is the four graphics supplied by the user:

- Full VIDENTIA landing reference: dark premium Bauhaus homepage with header, hero, trust strip, process, feature/audience blocks, trust logos, CTA and footer.
- Geometric icon sheet: thin black geometric/Bauhaus symbols used as the icon-language reference.
- Bauhaus field: muted dark teal/sage/cream/mineral-blue modular geometry.
- Comparison illustration: two faceless people holding large magnifying glasses over the Bauhaus field.

Generated HD versions are production assets only. They must preserve the reference composition, silhouette, palette and geometry; they are not permission to invent a new art direction.

## 3. Locked visual system

Palette:
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

Typography:
- Montserrat only.
- Hero/H1: weight 300, editorial cream, architectural line-height, selected short phrase in Brand Green only.
- Body: weight 400, white.
- Metadata/navigation: muted neutral or restrained green.

Prohibited:
- gradients;
- glow;
- glassmorphism;
- neon cyan/green;
- glossy or 3D illustration;
- generic AI visual language;
- heavy shadows;
- excessive cards;
- outlined default buttons;
- pure-white H1/H2;
- decorative pills/badges not present in the reference;
- visual re-interpretation of the two-person comparison illustration.

## 4. HERO — CURRENT IMPLEMENTATION TARGET

This is the active section. Do not change downstream landing sections until the hero is signed off.

### 4.1 Desktop composition

The reference composition is approximately 46% content / 54% illustration.

Header:
- deep dark background integrated with hero;
- VIDENTIA wordmark left with tagline beneath;
- navigation centered/right: `BUSCAR`, `REGISTRAR`, `VIGILAR`, `GESTIONAR`, `PRECIOS`, `RECURSOS`;
- `INICIAR SESIÓN` near the right;
- final CTA `BUSCAR UNA MARCA` as a restrained green-accent action;
- thin typography, generous spacing, no floating glass container.

Hero left:
- eyebrow exactly: `FUENTES OFICIALES · EVIDENCIA TRAZABLE`;
- H1 exactly:
  - `Protege tu marca`
  - `desde antes de`
  - `registrarla.`
- first two lines cream `#E7DFCE`;
- `registrarla.` Brand Green `#4A7F74`;
- body exactly: `Investiga antecedentes, registra, vigila y administra tus marcas desde un solo lugar.`;
- integrated search control below with placeholder `Buscar una marca, nombre o logo`;
- search action is inside the same rectangular control;
- no trust-point chips below the search in the hero.

Hero right:
- use the approved two-person magnifying-glass comparison asset;
- preserve relative pose, faceless treatment, cream line work, green left pants, mineral-blue right pants and large paired magnifying glasses;
- background must be the muted Bauhaus geometric field;
- no tint overlay over the illustration;
- image fills the right hero region naturally and blends into the hero dark background by crop/edge placement, not by a gradient wash.

### 4.2 Hero dimensions and rhythm

Desktop target:
- content max width near 1480px;
- nav height approximately 80–88px;
- hero viewport below nav approximately 600–680px at 1440px wide;
- headline target scale approximately 58–72px depending on viewport;
- headline line-height about 1.06;
- search width roughly 500–560px;
- illustration should be visually dominant on the right without crossing into headline readability.

Mobile target:
- brand/header first;
- eyebrow;
- H1;
- body;
- search;
- illustration;
- no horizontal overflow;
- illustration remains recognizable and is not reduced to a decorative thumbnail;
- CTA and search remain at least 44px touch height.

### 4.3 Allowed hero copy

No additional visible copy above the fold beyond:
- `VIDENTIA`
- `INTELIGENCIA Y PROTECCIÓN DE MARCAS`
- nav labels listed above
- `INICIAR SESIÓN`
- `BUSCAR UNA MARCA`
- `FUENTES OFICIALES · EVIDENCIA TRAZABLE`
- H1 text listed above
- body text listed above
- search placeholder
- `BUSCAR`

Any current hero-only proof chips such as `Chile primero`, `INAPI identificable`, `Niza + Viena`, or `Sin veredictos automáticos` must be removed from the hero. Those concepts may reappear only in a later approved section.

## 5. Assets

Production hero asset names:
- `/images/videntia-hero-comparison-hd.webp` — approved two-person comparison illustration, preserving the supplied reference geometry at production resolution.
- future `/images/videntia-bauhaus-field-hd.png` — standalone Bauhaus background for later sections if required.
- future `/images/videntia-geometric-icons-hd.png` — reference sheet; do not use the raster sheet itself as clickable UI icons.

For functional UI icons use thin production SVG/Lucide only when the metaphor and stroke match the reference. The raster icon sheet is an art-direction reference, not a substitute for semantic controls.

## 6. Fidelity gate

Before this hero can be considered complete, verify at minimum:
1. wordmark/nav placement against reference;
2. exact above-the-fold copy;
3. H1 line breaks, weight and cream/green split;
4. search rectangle proportions and integrated action;
5. two-person illustration placement/scale;
6. palette/background fidelity;
7. absence of gradients/glow/glass;
8. desktop first viewport;
9. mobile first viewport;
10. no runtime/console errors and search still routes to `/demo?marca=...`.

Do not proceed to section 2 until these checks pass.
