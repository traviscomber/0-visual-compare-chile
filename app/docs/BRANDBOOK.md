# VISUAL COMPARE CHILE - BRANDBOOK
## Identity & Design Guidelines

---

## 1. PROJECT OVERVIEW

**Name:** Visual Compare Chile
**Tagline:** Comparación Visual Inteligente de Marcas
**Mission:** Proporcionar tecnología IA avanzada para comparación visual de marcas y consulta de registros chilenos

**Core Values:**
- Precisión: 3 métodos híbridos de comparación (SHA-256, pHash, Embeddings)
- Velocidad: <100ms respuesta en P95
- Accesibilidad: 350K+ marcas registradas, búsqueda avanzada
- Confiabilidad: SLA 99.95%, auditoría completa

---

## 2. TYPOGRAPHY

### Primary Font: Montserrat
- **URL:** Google Fonts - Montserrat
- **Weights Used:** 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold), 800 (ExtraBold)

### Usage Guidelines:

**Headings (h1, h2, h3)**
- Weight: 700 (Bold)
- Size: 2.25rem (h1), 1.875rem (h2), 1.5rem (h3)
- Letter-spacing: -0.02em
- Line-height: 1.2
- Color: Foreground (white in dark mode)

**Body Text**
- Weight: 400 (Regular)
- Size: 1rem (body), 0.875rem (small)
- Letter-spacing: 0
- Line-height: 1.5
- Color: Muted Foreground (gray-300 in dark mode)

**Accent/Buttons**
- Weight: 600 (SemiBold)
- Size: 1rem
- Letter-spacing: 0.01em
- Color: Foreground with primary accent

**Code/Technical**
- Font: IBM Plex Mono (fallback: monospace)
- Weight: 400
- Size: 0.875rem
- Color: Muted Foreground

---

## 3. COLOR PALETTE

### Primary Colors

#### Blue (Primary Brand Color)
- **Light Blue:** #3b82f6 (Blue-500)
  - Usage: Buttons, highlights, interactive elements
  - Opacity: 100% primary, 20% backgrounds
- **Dark Blue:** #1e40af (Blue-900)
  - Usage: Text, dark mode accents, borders
  - Opacity: 100% text, 30% subtle backgrounds

#### Purple (Secondary Accent)
- **Purple:** #a855f7 (Purple-500)
  - Usage: Highlights, decorative elements, gradients
  - Opacity: 100% accent, 10% backgrounds

#### Amber (Tertiary Accent)
- **Amber:** #f59e0b (Amber-500)
  - Usage: Warnings, important notifications, feature highlights
  - Opacity: 100% accent, 15% backgrounds

### Neutral Colors

**Light Mode (when used):**
- Background: #ffffff (White)
- Foreground: #000000 (Black)
- Muted: #6b7280 (Gray-500)

**Dark Mode (Primary):**
- Background: #0f172a (Slate-900)
- Foreground: #ffffff (White)
- Muted Foreground: #d1d5db (Gray-300)
- Muted Background: #1e293b (Slate-800)
- Card: #1e293b with glassmorphism

---

## 4. COLOR APPLICATIONS

### Component Usage:

**Buttons**
- Primary CTA: Blue-500 background, white text, 4px border-radius
- Secondary: Border blue-500/50, transparent background
- Danger: Red-600 background
- Success: Emerald-600 background

**Cards/Containers**
- Glassmorphism: backdrop-blur-xl + bg-white/10 + border border-white/20
- Elevation: Subtle shadow on hover
- Border: Blue-700/50 for glass cards, Purple-700/50 for accent sections

**Gradients**
- Background: Purple (#a855f7) to Blue (#3b82f6), left-to-right
- Accent: Blue (#3b82f6) to Cyan (when applicable)
- Hover: Gradient intensity +20%

**Text Hierarchy**
- Heading: Foreground (white)
- Body: Muted Foreground (gray-300)
- Accent: Blue-300 for interactive hints
- Disabled: Gray-500

---

## 5. GLASSMORPHISM DESIGN SYSTEM

### Definition:
Frosted glass aesthetic using backdrop blur, transparency, and subtle borders.

### Implementation:

**Base Glass Card:**
```
className="glass p-8 rounded-2xl border border-blue-700/50 bg-gradient-to-br from-blue-900/20 to-slate-900/50 backdrop-blur-xl"
```

**Glass Hover State:**
```
className="hover:border-blue-600/70 hover:bg-gradient-to-br hover:from-blue-900/30 hover:to-slate-900/60 transition-all duration-300"
```

**Glass Variants:**
- Default Glass: Blue theme (for primary content)
- Purple Glass: Purple-700/50 border (for secondary)
- Emerald Glass: Emerald-700/50 border (for success states)
- Amber Glass: Amber-700/50 border (for warnings)

### Depth Layers:
1. **Backdrop:** Blur filter (12px)
2. **Container:** Semi-transparent gradient background (10-20% opacity)
3. **Border:** Subtle colored line (30-50% opacity)
4. **Shadow:** Subtle elevation (2-4px blur)

---

## 6. LAYOUT & SPACING

### Grid System:
- Base unit: 4px (Tailwind default)
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120

### Container Widths:
- Max-width: 80rem (1280px) for content sections
- Padding: 24px (6 units) on desktop, 16px (4 units) on mobile

### Breakpoints (Tailwind):
- Mobile: < 640px
- Tablet: ≥ 640px (sm:)
- Desktop: ≥ 1024px (lg:)
- Large Desktop: ≥ 1280px (xl:)

### Common Patterns:
- Hero Section: Full width, 96-120px vertical padding
- Feature Cards: Grid 1 col mobile, 2 col tablet, 3 col desktop
- Section Spacing: 96px vertical between sections

---

## 7. COMPONENTS & PATTERNS

### Buttons
**Primary Button (CTA)**
- Background: Blue-600
- Hover: Blue-700
- Text: White, Montserrat 600
- Padding: 12px 24px (py-3 px-6)
- Border-radius: 8px
- Icon: Lucide icons, 20px

**Secondary Button**
- Background: Transparent
- Border: Blue-700/50
- Text: Blue-300
- Hover: bg-blue-900/20

### Cards
**Feature Card (Glassmorphism)**
- Width: Full container, max 350px in 3-col grid
- Padding: 32px (p-8)
- Border-radius: 16px (rounded-2xl)
- Glass effect as defined above
- Icon: 48-60px, color-coded by theme

**Stat Card**
- Compact version: 120px height
- Large number: 36px bold
- Label: 12px muted
- Unit: 16px regular

### Roadmap Cards
**Phase Card**
- Left content: 2/3 width on desktop, 100% on mobile
- Right timing: 1/3 width on desktop
- Expandable: ChevronDown icon, smooth expansion (300ms)
- Colors: Phase 1=Red, Phase 2=Red, Phase 3=Blue, Phase 4=Emerald

### Badges
- Padding: 8px 16px (py-2 px-4)
- Border-radius: 8px
- Font: 12px, 600 weight
- Color: Blue-900 background, Blue-300 text
- Usage: Status labels, tags, phase indicators

---

## 8. ICONS

### Icon Library: Lucide React
**Common Icons:**
- Zap: Bolt/power
- Search: Magnifying glass
- CheckCircle2: Success/confirmed
- ArrowRight: Call-to-action direction
- ChevronDown: Expandable content
- Upload: File upload
- Eye: View/visibility
- Shield: Security
- Database: Data/storage
- Code2: Development/technical
- Gauge: Performance/metrics

**Icon Sizing:**
- Small: 16px (UI elements)
- Medium: 20-24px (Buttons, headers)
- Large: 32-48px (Hero/feature cards)
- XL: 64px+ (Hero icons)

**Icon Colors:**
- Primary: Blue-400 (#60a5fa)
- Accent: Purple-400 (#c084fc)
- Success: Emerald-400 (#34d399)
- Warning: Amber-400 (#fbbf24)
- Error: Red-400 (#f87171)

---

## 9. ANIMATIONS & TRANSITIONS

### Standard Timing:
- Quick interactions: 150ms (z.B. button hover)
- UI transitions: 300ms (z.B. expand/collapse)
- Page transitions: 500ms
- Hover effects: 200ms

### Easing:
- Default: ease-in-out
- Entrances: ease-out
- Exits: ease-in

### Common Animations:
- Fade: opacity transition
- Slide: transform translateY/translateX
- Scale: transform scale
- Blur: blur filter
- Glow: box-shadow expansion

### Hover States:
- Cards: blur expansion +1px, border brightness +10%
- Buttons: background brightness +10%, slight scale (1.02)
- Icons: rotate 15-20° or scale 1.1
- Links: underline transition, color shift

---

## 10. ACCESSIBILITY

### Color Contrast:
- Text on backgrounds: Minimum WCAG AA (4.5:1)
- Text on colored backgrounds: Verified with WebAIM
- Decorative colors: Not relied upon for information

### Typography Accessibility:
- Minimum font size: 14px for body text
- Line-height: Minimum 1.4 (1.5 preferred)
- Letter-spacing: Normal or slightly increased
- No justified text (readability)

### Interactive Elements:
- Focus states: Blue-500 outline, 2px
- Disabled states: Gray-500 text, cursor-not-allowed
- Keyboard navigation: Fully supported
- ARIA labels: On all interactive elements

### Alternative Content:
- Images: Descriptive alt text
- Icons: ARIA labels or sr-only text
- Charts/data: Accessible descriptions

---

## 11. TONE OF VOICE

### Brand Personality:
- **Professional:** Authority in image comparison technology
- **Innovative:** Cutting-edge 3-method comparison engine
- **Accessible:** Clear communication about complex features
- **Trustworthy:** Transparent about capabilities and SLAs

### Writing Style:
- Concise and direct
- Technical accuracy without jargon overload
- Spanish fluent, with technical terms when necessary
- Call-to-action: Clear and compelling

### Examples:

**Weak:** "Nuestro sistema puede comparar imágenes"
**Strong:** "Compara imágenes con precisión < 0.1% usando 3 métodos híbridos"

**Weak:** "Tenemos muchas marcas"
**Strong:** "350K+ marcas registradas, búsqueda en <200ms"

---

## 12. IMAGERY & VISUALS

### Photography Style:
- Clean, modern, minimal
- High contrast with dark backgrounds
- Blue/purple color grading when applicable
- Technical/professional aesthetic

### Graphics:
- Geometric shapes: Circles, rounded squares
- Glassmorphism overlays
- Gradient accents (Blue → Purple)
- Minimal line illustrations (when needed)

### Data Visualization:
- Charts: Recharts library with custom theme
- Colors: Blue-500 primary, Purple-400 secondary, Amber-400 highlight
- Gridlines: Subtle (gray-700/30)
- Labels: 12px, muted foreground

---

## 13. DESIGN TOKENS (CSS Variables)

```css
:root {
  /* Primary Colors */
  --primary-light: #3b82f6;      /* Blue-500 */
  --primary-dark: #1e40af;       /* Blue-900 */
  
  /* Secondary Colors */
  --secondary: #a855f7;          /* Purple-500 */
  --accent: #f59e0b;             /* Amber-500 */
  
  /* Neutral Colors */
  --foreground: #ffffff;
  --background: #0f172a;
  --muted-foreground: #d1d5db;
  --muted-background: #1e293b;
  
  /* Typography */
  --font-primary: 'Montserrat', sans-serif;
  --font-code: 'IBM Plex Mono', monospace;
  
  /* Spacing */
  --spacing-unit: 4px;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.3);
}
```

---

## 14. RESPONSIVE DESIGN

### Mobile (< 640px):
- Single column layouts
- Full-width cards
- Larger touch targets (44px minimum)
- Simplified navigation
- Larger typography for readability

### Tablet (640px - 1024px):
- 2-column grids where applicable
- Balanced spacing
- Medium typography
- Hybrid navigation

### Desktop (> 1024px):
- 3+ column grids
- Optimized whitespace
- Full feature presentation
- Comprehensive navigation

---

## 15. BRAND APPLICATIONS

### Landing Page
- Hero: Full gradient background, large typography
- Sections: Alternating glass cards and content
- CTAs: Blue-600 buttons with icons
- Roadmap: Color-coded phases with expandable details

### Application UI (Comparador)
- Workspace: Dark canvas with glass controls
- Upload areas: Blue dashed border, hover effects
- Results: Glass card containers with comparison data
- Performance metrics: Amber highlights

### Application UI (Portal)
- Search bar: Glass morphism with blue focus state
- Results: Card grid with hover elevation
- Filters: Slide-down panels with blue accents
- Export: Amber highlight for important action

### Dashboard (Admin)
- Metrics: Large blue numbers, amber highlights
- Charts: Recharts with brand colors
- Controls: Glass toggles and switches
- Status: Color-coded indicators (green/red)

---

## 16. DO's & DON'Ts

### DO:
- ✓ Use the 3-color palette (Blue, Purple, Amber) consistently
- ✓ Apply glassmorphism to cards and overlays
- ✓ Maintain typography hierarchy with Montserrat weights
- ✓ Include proper spacing (multiples of 4px)
- ✓ Use color purposefully for information
- ✓ Test contrast ratios for accessibility
- ✓ Implement focus states for keyboard navigation

### DON'T:
- ✗ Use colors outside the defined palette
- ✗ Mix fonts (Montserrat for UI, code font for code only)
- ✗ Remove borders from glass cards
- ✗ Reduce spacing below defined minimums
- ✗ Use more than 2 fonts at once
- ✗ Create hover effects longer than 300ms
- ✗ Add imagery without brand alignment
- ✗ Ignore accessibility requirements

---

## 17. FILE STRUCTURE

```
/project-root
├── /app
│   ├── /docs
│   │   └── BRANDBOOK.md (this file)
│   ├── page.tsx (landing)
│   ├── /comparador (app)
│   └── /consulta (app)
├── /components
│   ├── /landing (hero, sections)
│   ├── /brand (logo, typography)
│   ├── /ui (buttons, cards)
│   └── /app (workbench, panels)
├── /styles
│   └── globals.css (design tokens)
└── /public
    └── /images (branded assets)
```

---

## 18. CONTACT & QUESTIONS

For brand guidelines questions or clarifications:
- Design Lead: travis@visualcompare.cl
- Project Manager: [contact info]
- Repository: v0-project (Vercel Sandbox)

---

**Version:** 1.0
**Last Updated:** 2026-05-11
**Next Review:** 2026-08-11
