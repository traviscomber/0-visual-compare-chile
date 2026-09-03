# VIDENTIA DESIGN MASTER LOCK

Status: ACTIVE — MUST FOLLOW
Version: 3.1 — complete public system
Owner: Frida UI/UX Director

This file is the canonical implementation contract for all public VIDENTIA surfaces. If legacy CSS, old components, generated concepts, screenshots, or page-specific styling conflict with this document, this document wins unless the user explicitly changes direction.

## 1. Product design intent

VIDENTIA is an intelligence platform for trademarks, patents, technologies and enterprise integrations. The public experience must communicate intelligence, evidence, traceability and premium technical craft with calm confidence.

Design character:

`quiet intelligence × editorial precision × evidence-led systems × cinematic restraint`

Advanced must mean precise, composed and useful — never decorative futurism.

## 2. Canonical public information architecture

The public system includes five first-class surfaces:

1. Umbrella Home
2. Trademarks
3. Patents
4. Technologies
5. Resources / Enterprise API documentation

Primary routes:
- `/`
- `/trademarks`
- `/patents`
- `/technologies`
- `/en/docs`
- `/es/docs`

All five surfaces must use the same navigation, palette, typography, spacing logic, focus system and visual DNA. Resources is not a separate microsite.

## 3. Canonical navigation

`PublicPlatformNav` is the only public navigation system.

Requirements:
- one shared component across Home, verticals and Resources;
- desktop height approximately 72–80px;
- `resources` is a first-class active state;
- one clear primary action;
- locale switch preserves the equivalent page where available;
- deliberate mobile menu;
- visible keyboard focus and skip-to-content;
- no second legacy navbar inside any page.

## 4. Locked palette

- Obsidian Teal: `#0F2A33`
- Deep Background: `#091A20`
- Deepest Stage: `#071119`
- Graphite Teal: `#172F34`
- Brand Green: `#4A7F74`
- Soft Sage: `#96B5A6`
- Pale Mineral: `#B7D3D1`
- Muted Mineral Blue: `#456E8E`
- Warm Editorial Cream: `#E7DFCE`
- Soft Neutral: `#BDBEBD`
- Primary White: `#FFFFFF`

Public VIDENTIA pages must not introduce a separate light SaaS palette. Light surfaces are allowed only as small evidence/code-paper accents when they have a specific functional reason.

## 5. Typography

Current public implementation uses Montserrat. Preserve it until a deliberate migration is approved.

Rules:
- H1/H2 weight 300–400;
- body/UI weight 400–500;
- major headings use warm cream rather than pure white;
- uppercase micro-labels and indexes are encouraged;
- fluid `clamp()` scales;
- body copy remains concise and lower contrast than display text.

Hero headlines:
- 2–4 desktop lines maximum;
- approximately `3rem–4.85rem` depending on viewport;
- line-height around `0.94–0.98`;
- measure around `12–15ch`;
- rewrite long copy rather than shrinking it until it fits.

## 6. Brand mark and cube-once rule

The geometric cube/mark is a brand identifier, not a repeating decorative motif.

Locked rule:
- the cube/mark appears in the VIDENTIA brand identity/navigation;
- do not repeat a large cube as the hero centerpiece on the same viewport;
- do not place secondary decorative cubes at section boundaries or lower corners;
- if a supplied artwork contains the cube, it may be used only when the user explicitly approves that composition for that surface;
- Home hero should communicate intelligence through evidence, paths, relationships, signals, product logic or operational proof rather than duplicating the logo mark.

## 7. Source-of-truth vertical artwork

Approved vertical assets:
- `/public/images/VidentiaTrademarks.svg`
- `/public/images/VidentiaPatents.svg`
- `/public/images/VidentiaTechnologies.svg`

Rules:
- preserve original paths, proportions and colors;
- technical viewBox cleanup is allowed when required;
- do not redraw supplied artwork with CSS shapes;
- no cards, frames, glass panels or decorative containers around hero objects;
- use intrinsic geometry and `object-contain`;
- artwork must read as a primary object, not an icon.

`VidentiaLanding.svg` remains a brand/reference asset, but is no longer mandatory as the Home hero because of the cube-once rule.

## 8. Umbrella Home hero

Purpose: establish the platform and route visitors toward the three intelligence verticals.

Composition:
- deep stage using `#071119 / #091A20`;
- strong negative space for copy;
- one dominant proposition;
- right side should visualize evidence, relationships, search/compare/watch logic or product intelligence without repeating the brand cube;
- no artificial frame;
- no generic feature-card cluster inside the hero;
- restrained atmospheric depth only when it improves hierarchy.

The visual may use code-native lines, nodes, evidence rails, interface fragments or a future 3D intelligence object, provided it is original to VIDENTIA and does not duplicate the logo mark.

## 9. Shared vertical hero system

`VerticalPublicHero` is the canonical starting point.

Desktop target:
- approximately 44–48% copy / 52–56% artwork;
- max width approximately 1480px;
- artwork frameless and visually dominant;
- copy and object vertically balanced;
- first viewport should feel composed, not oversized.

Structure:
1. eyebrow / vertical label
2. short editorial H1
3. concise body
4. one primary CTA
5. supplied SVG object

Do not add proof chips, mini dashboards, decorative cards or unrelated panels inside vertical heroes.

## 10. Resources / Enterprise API design

`/en/docs` and `/es/docs` are first-class VIDENTIA public surfaces.

They must:
- use `PublicPlatformNav` with `active="resources"`;
- stay on the dark VIDENTIA palette;
- use the same max-width, typography and spacing system as Home/verticals;
- use a compact 2–4 line headline;
- expose one primary CTA and at most one quieter secondary CTA;
- present API capabilities as indexed rails or architectural rows, not rounded SaaS cards;
- present endpoint contracts as dark graphite code/evidence surfaces with strong readability;
- use mono type only for methods, endpoints and code;
- preserve technical truth: authentication, quotas, routes and usage must match the real implementation;
- preserve locale-specific metadata and OpenGraph content.

The page should feel like technical documentation belonging to the same intelligence platform, not a third-party developer portal.

## 11. Layout and rhythm

Use a disciplined 12-column mental model.

Principles:
- one dominant idea per viewport;
- strong alignment and deliberate asymmetry;
- generous but controlled vertical rhythm;
- thin rules and indexed structures for evidence-led content;
- avoid repetitive equal-height card grids.

Public max width: approximately 1480px.
Typical horizontal padding:
- mobile: 20px;
- desktop: 40px.

## 12. Cards, frames and surfaces

Default to flat architectural surfaces.

Allowed cards only when they express a real grouping, state, workflow or actionable object.

Avoid:
- generic feature-card mosaics;
- excessive rounded corners;
- decorative shadows;
- framed hero artwork;
- card-on-card stacking.

Prefer:
- open editorial layouts;
- thin dividers;
- indexed rows;
- bands and rails;
- restrained shifts among `#071119`, `#091A20`, `#0F2A33` and `#172F34`.

## 13. Motion

Motion must explain hierarchy, causality, state or material presence.

Allowed:
- restrained reveal transitions;
- subtle parallax;
- line/node construction;
- small pointer-responsive movement;
- state-linked progress transitions.

Rules:
- hover/focus: roughly 120–220ms;
- section reveal: roughly 350–600ms;
- no elastic/bouncy motion;
- no constant distracting ambient motion;
- respect `prefers-reduced-motion`;
- no animation dependency unless it provides measurable value.

## 14. Voice and product truth

Copy is direct, compact and evidence-led.

Prefer verbs such as:
- search
- compare
- trace
- monitor
- review
- detect
- verify
- protect

Avoid vague futurism, generic AI superlatives, unsupported accuracy claims and legal certainty claims.

Public pages must distinguish source availability, observed evidence, analysis and legal/strategic conclusion.

Never invent live counts, customer logos, official outcomes or unsupported performance claims.

## 15. Responsive behavior

Mobile is intentionally composed, not scaled-down desktop.

Required checks:
- 360px
- 390px
- 768px
- 1024px
- 1440px
- 1728px or wider

Requirements:
- no horizontal overflow;
- compact readable headings;
- intentional navigation collapse;
- artwork never clips essential geometry;
- minimum practical hit area approximately 44px.

## 16. Accessibility

Target WCAG 2.2 AA.

Required:
- semantic landmarks;
- one logical H1;
- visible focus;
- correct focus order;
- meaningful alt text for informative artwork;
- decorative geometry `aria-hidden`;
- compliant contrast;
- no information conveyed by color alone;
- reduced-motion support.

## 17. Performance

- prefer SVG/code-native visuals over unnecessary rasters;
- priority-load only true first-viewport/LCP assets;
- no hidden hero preloads;
- keep client boundaries minimal;
- reserve media space to avoid layout shift;
- verify production bundles and runtime after major changes.

## 18. Implementation discipline

Preferred order:
1. reusable primitive;
2. explicit variant/prop;
3. local scoped style;
4. temporary override only as a last resort.

Do not maintain permanent CSS piles that style legacy hero DOM from the outside.

## 19. Quality gate — Frida + Ciclope + Qalito

Do not call a public surface complete until:

Hierarchy:
- proposition understood within seconds;
- hero headline 2–4 lines on desktop;
- one obvious primary CTA;
- nav does not compete with content.

Visual system:
- colors remain inside the VIDENTIA palette;
- no unnecessary frames;
- no duplicate cube/brand motif in the hero;
- related pages feel like one product family.

Responsive:
- required breakpoints checked;
- no overflow or clipped essential content.

Accessibility:
- keyboard navigation and visible focus verified;
- semantic headings and contrast checked;
- reduced motion respected.

Product truth:
- no fake metrics, logos, records or legal outcomes;
- CTA destinations correct.

Technical:
- one canonical public nav;
- no hidden legacy assets unnecessarily loaded;
- no relevant console/preload errors;
- production build green;
- runtime scan clean for the affected surfaces;
- final visual verification performed on the rendered deployment.

## 20. Design score

Score major public reviews across:
- Brand / UI
- UX clarity
- Cross-page consistency
- Premium quality / craft
- Responsive quality
- Accessibility
- Performance hygiene

Targets:
- 80+ acceptable release quality
- 90+ premium target
- below 80 continue iteration

## 21. Change control

When direction changes:
1. update `DESIGN.md` first;
2. update reusable primitives;
3. update pages;
4. verify production visually;
5. only then lock the new direction.
