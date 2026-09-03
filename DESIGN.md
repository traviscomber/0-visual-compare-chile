# VIDENTIA DESIGN MASTER LOCK

Status: ACTIVE — MUST FOLLOW
Version: 3.0 — platform + public verticals
Owner: Frida UI/UX Director

This file is the canonical implementation contract for VIDENTIA public-product design. It supersedes older trademark-only landing directions, legacy hero compositions, and one-off page overrides.

If existing CSS, components, generated concepts, legacy UI, screenshots, or older mockups conflict with this document, this document wins unless the user explicitly approves a new direction.

## 1. Product design intent

VIDENTIA is an intelligence platform for trademarks, patents, and technologies. The public experience must communicate intelligence, evidence, traceability, and premium technical craft without becoming decorative, futuristic, or visually noisy.

The design must feel:

`quiet intelligence × editorial precision × evidence-led systems × cinematic restraint`

The emotional target is calm confidence. The interface should feel advanced because it is precise, composed, and useful—not because it is overloaded with effects.

## 2. Public information architecture

The public product is a four-part system:

1. Umbrella Home
2. Trademarks
3. Patents
4. Technologies

These surfaces must feel related but not duplicated. The umbrella home explains the platform and routes users into the verticals. Each vertical then has its own editorial proposition, visual object, proof, and workflow.

Primary public routes:
- `/`
- `/trademarks`
- `/patents`
- `/technologies`

Spanish equivalents must preserve the same hierarchy and interaction model.

## 3. Source-of-truth artwork

The following supplied SVG files are approved brand assets and must be used directly where specified:

- `/public/images/VidentiaLanding.svg` — umbrella-home hero artwork
- `/public/images/VidentiaTrademarks.svg` — Trademarks hero object
- `/public/images/VidentiaPatents.svg` — Patents hero object
- `/public/images/VidentiaTechnologies.svg` — Technologies hero object

Rules:
- preserve the original paths, proportions, colors, and visual character;
- technical viewBox/canvas cleanup is allowed only when needed to remove empty canvas or unintended framing;
- do not redraw or reinterpret these assets with CSS shapes when the approved SVG exists;
- do not place the vertical SVGs inside cards, bordered panels, glass surfaces, or decorative frames;
- hero artwork must read as a primary object, not as a small icon;
- use `next/image` or direct semantic SVG integration where appropriate;
- use `object-contain` / intrinsic proportions; never stretch the artwork;
- no background-image hacks when a clean image/component implementation is possible.

## 4. Canonical visual character

VIDENTIA uses:
- near-black / deep navy-teal foundations;
- warm cream editorial typography;
- restrained teal and sage signals;
- mineral blue only as a supporting atmospheric accent;
- fine rules, indexed labels, grids, and technical microcopy;
- strong negative space;
- mostly flat, architectural surfaces;
- atmospheric depth only where it improves hierarchy.

Avoid:
- generic SaaS card grids;
- glassmorphism;
- cyberpunk styling;
- rainbow or electric gradients;
- excessive glow;
- ornamental dashboards in marketing sections;
- decorative 3D that has no product meaning;
- fake metrics, fake customer logos, or unsupported claims.

## 5. Locked palette

Core tokens:
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

No unapproved purple, magenta, bright cyan, neon green, saturated orange, or unrelated accent colors on the public VIDENTIA experience.

## 6. Typography

Current public implementation uses Montserrat. Preserve it until a deliberate type-system migration is approved.

Rules:
- H1/H2: weight 300–400;
- body/UI: weight 400–500 where needed;
- major headings use Warm Editorial Cream rather than pure white;
- body text is quieter than display text;
- uppercase micro-labels and section indices are encouraged;
- avoid tiny low-contrast text;
- use fluid `clamp()` scales;
- test line length at desktop, tablet, and mobile.

### Hero headline rules

Hero headlines must be compact editorial statements, not paragraphs.

Desktop target:
- 2–4 lines maximum;
- approximately `3.0rem–4.85rem` depending on viewport;
- line-height around `0.94–0.98`;
- text measure approximately `12–15ch`;
- no single headline should visually dominate more than roughly half the hero height.

Do not solve long copy only by shrinking type. Rewrite the message when necessary.

## 7. Global public navigation

`PublicPlatformNav` is the canonical public navigation system.

Requirements:
- one shared navigation component across the umbrella home and verticals;
- desktop nav height approximately 76–80px;
- VIDENTIA mark has clear but restrained presence;
- active vertical must be obvious without oversized styling;
- one unmistakable primary action;
- mobile uses a deliberate menu, not a compressed desktop nav;
- language switching preserves the equivalent vertical route;
- visible keyboard focus is mandatory;
- skip-to-content remains available.

Do not render a second legacy navigation inside page content. If a legacy component includes its own nav, remove or suppress it at the component level rather than maintaining two competing systems long-term.

## 8. Umbrella Home hero

Purpose: establish VIDENTIA as the intelligence platform and direct users into the three verticals.

Artwork:
- use `/images/VidentiaLanding.svg` as the canonical visual source;
- preserve the geometric block/cube and ivory path language;
- artwork should own the right side of the composition and remain legible at wide desktop sizes;
- avoid raster replacement unless explicitly approved.

Composition:
- strong negative space for copy;
- text and visual should feel like one composition, not a text column next to a detached image;
- no artificial frame around the hero object;
- navigation, headline, and artwork must share a common baseline/rhythm.

Motion may be added only when it enhances physicality or hierarchy. If a 3D version is pursued, it must preserve VIDENTIA's own form language rather than copy another brand's hero object.

## 9. Shared vertical hero system

The three verticals use the shared `VerticalPublicHero` pattern as the canonical starting point.

Desktop composition target:
- approximately 44–48% copy / 52–56% artwork;
- max content width approximately 1480px;
- artwork is frameless and visually dominant on the right;
- copy and artwork are vertically balanced;
- hero should generally occupy the first viewport below navigation without feeling oversized.

Common structure:
1. eyebrow / vertical label
2. short editorial H1
3. concise explanatory body
4. one primary CTA
5. large supplied SVG object

Do not add proof chips, mini dashboards, decorative cards, or unrelated supporting panels inside the hero unless they are explicitly required by the product story.

### Trademarks

Approved artwork:
- `/images/VidentiaTrademarks.svg`

Current editorial direction:
- compact proposition about understanding the brand landscape before filing/protecting;
- object must feel substantial, not icon-sized.

### Patents

Approved artwork:
- `/images/VidentiaPatents.svg`

Current editorial direction:
- compact proposition about understanding what already exists before investing;
- no embedded beige/cream outer frame around the object;
- object remains centered and isolated against the dark field.

### Technologies

Approved artwork:
- `/images/VidentiaTechnologies.svg`

Current editorial direction:
- compact proposition about seeing where technology is moving;
- because this SVG is vertically elongated, size it by height rather than forcing it into the same width logic as the other two assets;
- preserve visual weight without clipping the top or bottom.

## 10. Hero image behavior

Hero artwork must obey intrinsic geometry.

Rules:
- use `object-contain`;
- never use `object-cover` on the supplied vertical SVGs;
- no crop on desktop unless explicitly approved;
- responsive scaling must be asset-specific;
- vertical artwork may use a lower max-height on mobile to protect rhythm;
- never hide approved SVG artwork behind CSS pseudo-elements or legacy images;
- avoid loading hidden hero images in the DOM.

Any old hero image or CSS symbol no longer shown visually should also be removed from the rendered component when practical, not merely hidden with opacity.

## 11. Layout and rhythm

Use a disciplined 12-column mental model even when implementation uses CSS grid.

Principles:
- one dominant idea per viewport;
- strong left/right alignment;
- deliberate asymmetry;
- generous but controlled vertical rhythm;
- section spacing should decrease slightly as information density increases;
- avoid repetitive equal-height card rows;
- use lines, rails, labels, and indexed structures for evidence-led content.

Public max width: approximately 1480px.

Typical horizontal padding:
- mobile: 20px;
- desktop: 40px.

## 12. Cards and surfaces

Default to flat architectural surfaces.

Cards are allowed only when they express a real grouping, state, workflow, or actionable object.

Avoid:
- generic feature-card mosaics;
- excessive rounded corners;
- box shadows used only for decoration;
- framed artwork;
- card-on-card stacking.

Preferred:
- open editorial layouts;
- thin dividers;
- indexed rows;
- bands and rails;
- restrained surface shifts between `#091A20`, `#0F2A33`, and `#172F34`.

## 13. Motion and physicality

Motion must explain hierarchy, causality, state, or material presence.

Allowed:
- restrained reveal transitions;
- subtle parallax;
- slow object rotation when the object is genuinely 3D;
- small pointer-responsive movement;
- light movement across a surface;
- state-linked progress transitions.

Rules:
- hover/focus motion: roughly 120–220ms;
- section reveal: roughly 350–600ms;
- no elastic/bouncy motion;
- no constant distracting ambient motion;
- no animation that delays task completion;
- respect `prefers-reduced-motion`;
- mobile fallback may use the static SVG.

If Spline, Three.js, React Three Fiber, or similar technology is introduced, it requires a measurable visual/product benefit and a static fallback.

## 14. Voice and copy

VIDENTIA copy is direct, compact, and evidence-led.

Use concrete verbs:
- search
- compare
- trace
- monitor
- review
- structure
- detect
- verify
- protect

Avoid:
- vague futurism;
- generic AI superlatives;
- unsupported accuracy claims;
- legal certainty claims;
- inflated headlines that require 5–7 lines.

A headline should communicate one idea. Supporting detail belongs in the body copy.

## 15. Evidence and product truth

Public pages must distinguish:
- source availability;
- observed evidence;
- analysis;
- legal or strategic conclusion.

Never convert missing coverage into zero activity.
Never imply legal certainty when the system only provides research or decision support.
Never invent live counts, company activity, customer usage, or official outcomes.

## 16. Responsive behavior

Mobile is intentionally composed, not merely scaled down.

Requirements:
- single-column hierarchy below the desktop breakpoint;
- headline remains compact and readable;
- artwork follows copy and retains strong visual presence;
- no horizontal overflow;
- no clipped SVG geometry;
- CTA hit areas approximately 44px minimum where practical;
- navigation collapses intentionally;
- supporting detail may collapse or move below primary content rather than squeezing beside it.

Test at minimum:
- 360px
- 390px
- 768px
- 1024px
- 1440px
- 1728px or wider.

## 17. Accessibility

Target WCAG 2.2 AA.

Required:
- semantic landmarks;
- one logical H1 per page;
- visible keyboard focus;
- correct focus order;
- meaningful image alt text for informative artwork;
- decorative geometry uses `aria-hidden`;
- contrast remains compliant;
- no essential information communicated by color alone;
- reduced-motion support;
- mobile controls remain comfortably tappable.

## 18. Performance

Public pages must remain fast despite premium visual treatment.

Rules:
- prefer SVG and code-native graphics to unnecessary raster assets;
- use `next/image` for raster/optimized image flows and appropriate SVG integration;
- provide accurate `sizes`;
- priority-load only true first-viewport/LCP artwork;
- do not preload images that are hidden or unused;
- avoid introducing large animation libraries for simple transitions;
- keep client boundaries minimal;
- prevent layout shift by reserving image space;
- verify production bundles and runtime behavior after visual changes.

## 19. Implementation discipline

Avoid page-specific CSS override piles.

Preferred order:
1. reusable component primitive;
2. explicit variant/prop;
3. local scoped style;
4. only then a temporary override.

Temporary overrides must not become the permanent design architecture.

The current direction is to move the three vertical heroes toward shared semantic components instead of styling old legacy hero DOM through selectors.

## 20. Quality gate — Frida

Do not call a public surface complete until all of the following pass:

### Hierarchy
- primary proposition is understood within seconds;
- hero headline is no more than roughly 2–4 lines on desktop;
- artwork and headline have comparable visual weight;
- navigation does not compete with the hero;
- one primary CTA is obvious.

### Visual system
- approved SVG is used for the correct vertical;
- no frames around vertical hero objects;
- colors stay inside the VIDENTIA palette;
- surfaces remain calm and architectural;
- no generic SaaS card noise;
- related pages feel like one product family.

### Responsive
- 360/390/768/1024/1440/wide layouts checked;
- no horizontal overflow;
- no cropped essential artwork;
- mobile hierarchy is intentional.

### Accessibility
- keyboard navigation verified;
- focus visible;
- semantic heading order correct;
- contrast checked;
- reduced motion respected.

### Product truth
- no fake metrics, logos, records, or legal outcomes;
- evidence/analysis/conclusion distinctions remain truthful;
- CTA destinations are correct.

### Technical
- no duplicate visible navigation systems;
- no hidden legacy hero assets unnecessarily loaded;
- no relevant console errors or warnings;
- no broken image/preload warnings;
- Vercel production build is green;
- runtime error scan is clean;
- visual verification is performed on the actual rendered deployment, not only source code.

## 21. Design score

For major public UI reviews, score the implementation from 0–100 across:
- Brand / UI
- UX clarity
- Cross-page consistency
- Premium quality / craft
- Responsive quality
- Accessibility
- Performance hygiene

A production design should target:
- 80+ = acceptable release quality;
- 90+ = premium target;
- below 80 = continue iteration before calling the surface finished.

## 22. Change control

This document is the single source of truth for VIDENTIA public design until the user explicitly changes direction.

When direction changes:
1. update `DESIGN.md` first;
2. update reusable primitives second;
3. update pages third;
4. verify production visually;
5. only then call the new direction locked.
