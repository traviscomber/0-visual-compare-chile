# 🎨 BRAND BOOK CORRECTO - Logo Similarity Chile

## Brand Identity (Del documento oficial - líneas 56-151)

### Primary Information
**Brand name**: Logo Similarity Chile  
**Alternative internal name**: Trademark Visual Compare  
**Optional footer line**: Powered by N3uralia  

---

## 🎯 Brand Personality

The interface MUST feel like a **premium B2B legal-tech / IP-tech SaaS platform** for visual logo analysis.

- Precise
- Legal-tech oriented
- Trustworthy
- Modern
- Minimal
- Analytical
- Evidence-based
- Professional
- Chile-ready
- Easy to understand

---

## 🎨 Color Palette (EXACT - DO NOT DEVIATE)

```
Primary Colors:
- Background:       #F8FAFC (very light slate)
- Surface:          #FFFFFF (white)
- Surface soft:     #F1F5F9 (light slate)

Brand Colors (TEAL - Main):
- Primary teal:     #0F766E (main brand color)
- Primary dark:     #134E4A (darker teal)

Trust Color (NAVY):
- Navy:              #0F172A (serious, trusted)

Technical Accent (Blue):
- Accent blue:      #2563EB (secondary only)

Text Colors:
- Text primary:     #0F172A (same as Navy - serious)
- Text secondary:   #64748B (slate)

System Colors:
- Border:           #E2E8F0 (light border)
- Success:          #16A34A (green)
- Warning:          #D97706 (amber)
- Danger:           #DC2626 (red)
- Neutral dark:     #111827 (very dark)
```

### Rules:
- ✅ Use TEAL as the main brand color (NOT blue, NOT purple)
- ✅ Use NAVY for trust and seriousness
- ✅ Use blue ONLY as secondary technical accent
- ✅ NO heavy gradients
- ✅ NO neon colors
- ✅ Light, spacious, professional appearance

---

## 🔤 Typography

**Preferred fonts**: Geist or Inter

### Font Sizing Hierarchy:
```
H1 (Hero):   32-40px, bold, Navy or Teal
H2 (Section): 24px, semibold, Navy
H3 (Subsection): 18px, semibold, Navy
Body:        16px, regular, Text Primary
Small:       14px, regular, Text Secondary
Tiny:        12px, regular, Text Secondary
```

### Font Rules:
- ✅ Use Geist as primary (Next.js native)
- ✅ Consistent line-height (1.5-1.6)
- ✅ Clear hierarchy
- ✅ NO decorative fonts

---

## 🎭 Visual Direction

### What it MUST look like:
- Clean legal-tech dashboard
- Light interface
- Soft cards with rounded corners
- Clear search and result hierarchy
- Calm teal and navy accents
- Structured data presentation
- Evidence-oriented design
- Logo comparison grid
- Clear scoring badges
- Professional Chilean B2B tone

### What it MUST NOT look like:
- ❌ Toy-like AI design
- ❌ Overly futuristic neon
- ❌ Generic AI magic
- ❌ Cartoon graphics
- ❌ Random abstract AI art
- ❌ Heavy gradients
- ❌ Unnecessary visual noise
- ❌ Flashy animations

---

## 🏗️ Component Style Guide

### Cards
```css
- Rounded: 2xl (rounded-2xl in Tailwind)
- Border: 1px solid #E2E8F0
- Shadow: Minimal (shadow-sm or none)
- Padding: Spacious (p-6)
- Background: White or #F1F5F9
```

### Buttons
```css
Primary:
- Background: #0F766E (teal)
- Text: White
- Rounded: lg (rounded-lg)
- Padding: px-6 py-2

Secondary:
- Background: #F1F5F9 (soft surface)
- Text: #0F172A (navy text)
- Border: 1px #E2E8F0
- Rounded: lg

Danger:
- Background: #DC2626 (red)
- Text: White
```

### Badges
```css
Similarity Status:
- very_high:  bg-red-100, text-red-800 (or bg-red-500, text-white)
- high:       bg-orange-100, text-orange-800
- medium:     bg-yellow-100, text-yellow-800
- low:        bg-blue-100, text-blue-800
- none:       bg-gray-100, text-gray-800
```

### Search Results Grid
```css
- Column layout: 2-3 columns on desktop
- Gap: 4 (gap-4)
- Cards inside: Soft borders, no shadows
- Logo thumbnail: Centered, square aspect ratio
- Similarity score: Large badge, prominent
```

### Logo Comparison Layout
```css
Side-by-side:
Left side:   Uploaded/queried logo
Right side:  Best match logo

Technical panel below:
- Table format
- Teal headers
- Navy text
- Clear metrics
```

---

## 📐 Layout Structure

### Spacing System (Tailwind)
```
Padding:   p-4, p-6, p-8 (use spacious)
Margins:   m-4, m-6, m-8
Gap:       gap-4, gap-6 (between cards)
```

### Responsive
```
Mobile:   1 column, tight spacing
Tablet:   2 columns, normal spacing
Desktop:  3 columns or 2-column with sidebar
```

### Sidebar (if applicable)
```
Width:     w-64 or w-72
Background: #F8FAFC
Border:    Right border only
Text:      Navy, secondary text color
```

---

## 🎤 Tone of Voice

### Language: Spanish (Chile-focused)

### Examples from document:
- "Nueva búsqueda de similitud"
- "Sube un logo para compararlo contra la base disponible."
- "Resultado orientativo para análisis preliminar."
- "Esta plataforma no reemplaza una revisión legal especializada."
- "Los logos se almacenan en un bucket privado y solo son visibles para usuarios autorizados."

### Tone:
- Professional
- Reassuring
- Clear
- Legal-informed
- Non-alarmist
- Helpful
- Accurate

### Common phrases to use:
- "Comparación visual"
- "Análisis preliminar"
- "Resultado orientativo"
- "Especialista en marcas"
- "Evaluación final"
- "Almacenamiento privado"
- "Datos protegidos"

---

## 🌐 Logo & Branding

### Logo Similarity Chile Logo (TBD - should be created)
Should represent:
- Visual comparison
- Legal/professional
- Trustworthy
- Modern
- Can incorporate: scales, magnifying glass, or geometric comparison icon

### Footer
Should include:
```
Logo Similarity Chile
Powered by N3uralia
© 2025 All rights reserved
```

---

## 🚫 What NOT to Do

| Don't | Do Instead |
|---|---|
| Use bright neons | Use teal and navy |
| Add heavy shadows | Use minimal or no shadows |
| Use cartoon icons | Use professional icons (Lucide/Heroicons) |
| Mix many gradients | Use flat colors |
| Add animations | Keep it static/professional |
| Use colored text backgrounds | Use text + badge system |
| Large header images | Clean, spacious layouts |
| Generic tech imagery | Evidence-based design |

---

## ✅ Implementation Checklist

- [ ] Update colors in globals.css (CSS variables for tokens)
- [ ] Update typography (import Geist from next/font/google)
- [ ] Update component styles (shadcn override or CSS)
- [ ] Remove neon/gradient backgrounds
- [ ] Update logo and branding
- [ ] Add "Powered by N3uralia" in footer
- [ ] Review all text for Chilean Spanish tone
- [ ] Ensure card styling is consistent (2xl rounded, soft borders)
- [ ] Verify color contrast (accessibility)
- [ ] Test on mobile/tablet/desktop

---

## 🎨 Figma Mockup (If needed)

Key screens to design:
1. Landing page
2. Login
3. Dashboard (post-login)
4. Search page with upload
5. Results page with side-by-side comparison
6. Logos dataset page
7. Settings page

All should follow this brand book exactly.
