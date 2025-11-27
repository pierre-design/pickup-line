# Sidekick Design System

A comprehensive guide to the visual design, components, and patterns used in the Sidekick Performance Coach application.

---

## Table of Contents

1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Spacing & Layout](#spacing--layout)
4. [Components](#components)
5. [Interaction Patterns](#interaction-patterns)
6. [Animation & Motion](#animation--motion)
7. [Accessibility](#accessibility)

---

## Color Palette

### Primary Colors

```css
--darkest-green: #01150A    /* Primary background */
--dark-green: #04411F       /* Secondary background, cards */
--medium-green: #00953B     /* Success states, positive scores */
--light-green: #8DCB89      /* Accents, secondary text, borders */
--yellow: #FFDD00           /* Primary CTA, highlights, "NEW" badges */
--pink: #F87171             /* Error states, negative scores, warnings */
```

### Usage Guidelines

**Backgrounds:**
- `#01150A` - Main app background, creates depth
- `#04411F` - Cards, modals, elevated surfaces

**Interactive Elements:**
- `#FFDD00` - Primary buttons, important CTAs
- `#8DCB89` - Secondary buttons, links, borders
- White - Tertiary buttons (outlined)

**Feedback:**
- `#00953B` - Success, passing scores (≥80%)
- `#F87171` - Errors, failing scores (<80%)
- `#8DCB89` - Neutral information
- Orange (`#F97316`) - In-progress states

**Text:**
- White - Primary text
- `#8DCB89` - Secondary text, labels
- `rgba(255,255,255,0.8)` - Tertiary text
- `rgba(255,255,255,0.6)` - Disabled/placeholder text

---

## Typography

### Font Family

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 
             'Droid Sans', 'Helvetica Neue', sans-serif;
```

System fonts for optimal performance and native feel.

### Type Scale

**Headings:**
```css
h1: 3xl (1.875rem / 30px) - font-bold - Page titles
h2: 2xl (1.5rem / 24px) - font-bold - Section headers
h3: xl (1.25rem / 20px) - font-bold - Card titles
```

**Body Text:**
```css
Large: base (1rem / 16px) - Descriptions, body copy
Medium: sm (0.875rem / 14px) - Secondary information
Small: xs (0.75rem / 12px) - Labels, badges, metadata
```

**Display:**
```css
8xl (6rem / 96px) - Streak numbers
2xl (1.5rem / 24px) - Modal titles
```

### Font Weights

- `font-bold` (700) - Headings, buttons, emphasis
- `font-semibold` (600) - Subheadings, labels
- `font-medium` (500) - Body text with emphasis
- `font-normal` (400) - Default body text

---

## Spacing & Layout

### Spacing Scale (Tailwind)

```
2  = 0.5rem  (8px)   - Tight spacing
3  = 0.75rem (12px)  - Small gaps
4  = 1rem    (16px)  - Default spacing
6  = 1.5rem  (24px)  - Medium spacing
8  = 2rem    (32px)  - Large spacing
12 = 3rem    (48px)  - Extra large spacing
```

### Container Widths

```css
max-w-md: 28rem (448px)  - Login forms, modals
max-w-4xl: 56rem (896px) - Main content area
```

### Padding Standards

**Cards:**
- `p-6` (24px) - Standard card padding
- `px-12 py-10` (48px/40px) - Modal padding

**Buttons:**
- `py-3 px-4` (12px/16px) - Standard button
- `py-4` (16px) - Large CTA button

**Page Containers:**
- `px-8 py-8` (32px) - Desktop
- `px-4` (16px) - Mobile

### Border Radius

```css
rounded-lg: 0.5rem (8px)    - Cards, inputs, buttons
rounded-xl: 0.75rem (12px)  - Large cards
rounded-3xl: 1.5rem (24px)  - Modals
rounded-full: 9999px        - Pills, badges, circular elements
```

---

## Components

### Buttons

#### Primary Button (CTA)
```tsx
className="w-full bg-[#FFDD00] text-black font-bold py-4 rounded-lg 
           hover:bg-[#FFE44D] transition-colors 
           disabled:opacity-50 disabled:cursor-not-allowed"
```
- Yellow background
- Black text
- Full width or fixed width
- Hover: Lighter yellow
- Disabled: 50% opacity

#### Secondary Button (Outlined)
```tsx
className="w-full border-2 border-[#8DCB89] text-[#8DCB89] 
           font-semibold py-3 rounded-lg 
           hover:bg-[#8DCB89] hover:text-[#01150A] transition-colors"
```
- Light green border
- Transparent background
- Hover: Filled with light green

#### Tertiary Button (White Outlined)
```tsx
className="w-full border-2 border-white text-white 
           font-semibold py-3 rounded-lg 
           hover:bg-white hover:text-[#04411F] transition-colors"
```
- White border
- Transparent background
- Hover: Filled with white

### Cards

#### Standard Card
```tsx
className="rounded-lg bg-[#04411F]/50 border border-[#006B3A] 
           shadow-md p-6 
           hover:scale-[1.02] hover:bg-white hover:shadow-lg 
           transition-all duration-200 cursor-pointer"
```
- Semi-transparent dark green background
- Green border
- Hover: Scale up, white background
- Smooth transitions

#### Modal Card
```tsx
className="rounded-3xl bg-[#04411F] px-12 py-10 
           shadow-2xl max-w-md w-full"
```
- Solid dark green background
- Large border radius
- Heavy shadow for elevation
- Centered with backdrop

### Inputs

#### Text Input
```tsx
className="w-full px-4 py-3 rounded-lg bg-white text-black 
           focus:outline-none focus:ring-2 focus:ring-[#FFDD00]"
```
- White background
- Yellow focus ring
- No default border

#### PIN Input
```tsx
className="w-16 h-16 rounded-lg bg-white text-black 
           text-center text-2xl font-bold 
           focus:outline-none focus:ring-2 focus:ring-[#FFDD00]"
```
- Square aspect ratio
- Large centered text
- Yellow focus ring

### Badges & Pills

#### Status Badge
```tsx
className="text-xs px-2 py-1 rounded 
           bg-white/20 text-white"
```
- Small text
- Minimal padding
- Semi-transparent background

#### "NEW" Badge
```tsx
className="bg-[#FFDD00] text-black text-xs 
           font-semibold px-2 py-0.5 rounded-full"
```
- Yellow background
- Black text
- Fully rounded

#### Tier Badge
```tsx
className="px-3 py-1 text-xs font-semibold uppercase rounded-full 
           bg-[#8DCB89]/20 text-[#8DCB89]"
```
- Light green with transparency
- Uppercase text
- Fully rounded

### Score Display

#### Passing Score (≥80%)
```tsx
<h3 style={{ color: '#00953B' }} className="text-xl font-bold">
  {score}%
</h3>
```

#### Failing Score (<80%)
```tsx
<h3 style={{ color: '#F87171' }} className="text-xl font-bold">
  {score}%
</h3>
```

### Quality Streak Flame

```tsx
<div className="relative inline-block">
  {/* Flame SVG with gradient mask */}
  <div style={{
    maskImage: 'linear-gradient(to top, transparent 0%, transparent 10%, 
                rgba(0,0,0,0.9) 90%, rgba(0,0,0,0.9) 100%)',
    width: 'min(55vw, 260px)',
    height: 'min(55vw, 260px)',
  }}>
    <svg fill={flameColor}>
      {/* Flame path */}
    </svg>
  </div>
  
  {/* Streak number overlaid */}
  <div className="text-white text-8xl font-bold">
    {streak}
  </div>
</div>
```

**Flame Colors by Streak:**
- 0-4: `#8B8B8B` (Gray)
- 5-9: `#FFD700` (Gold)
- 10-14: `#FF8C00` (Orange)
- 15+: `#FF4500` (Red-Orange)

---

## Interaction Patterns

### Hover States

**Cards:**
- Scale: `scale-[1.02]` (2% larger)
- Background: Dark → White
- Shadow: Medium → Large
- Duration: 200ms

**Buttons:**
- Background color change
- No scale transformation
- Smooth color transition

**Links:**
- Color: `#8DCB89` → White
- No underline by default

### Focus States

**Inputs:**
- Yellow ring: `ring-2 ring-[#FFDD00]`
- No outline

**Buttons:**
- Inherit hover state
- Keyboard accessible

### Loading States

**Spinner:**
```tsx
<div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
```

**Button Loading:**
```tsx
disabled={loading}
className="disabled:opacity-50 disabled:cursor-not-allowed"
```

### Error States

**Input Error:**
```tsx
<div className="bg-[#F87171] bg-opacity-20 border border-[#F87171] 
                rounded-lg p-4">
  <p className="text-[#F87171] text-sm font-semibold">{error}</p>
</div>
```

### Empty States

```tsx
<div className="text-white/60 text-center py-12">
  <p className="text-sm">No data available yet.</p>
</div>
```

---

## Animation & Motion

### Transitions

**Standard:**
```css
transition-colors duration-200
transition-all duration-200
```

**Hover Effects:**
```css
hover:scale-[1.02] transition-all duration-200
```

**Opacity Fade:**
```css
transition-opacity duration-200
opacity-0 → opacity-100
```

### Animations

**Pulse (Loading):**
```css
animate-pulse
```

**Gradient Mask (Flame):**
```css
maskImage: 'linear-gradient(to top, transparent 0%, transparent 10%, 
            rgba(0,0,0,0.9) 90%, rgba(0,0,0,0.9) 100%)'
```

### Scroll Behavior

**Snap Scrolling:**
```css
overflow-y-auto snap-y snap-proximity
```

**Snap Points:**
```css
snap-start
```

---

## Accessibility

### Focus Management

- All interactive elements have visible focus states
- Modal traps focus when open
- ESC key closes modals
- Tab navigation supported

### Color Contrast

- White text on dark backgrounds: WCAG AAA
- Yellow buttons with black text: WCAG AA
- Error states use sufficient contrast

### ARIA Labels

```tsx
role="dialog"
aria-modal="true"
aria-labelledby="modal-title"
aria-label="Close modal"
```

### Keyboard Navigation

- Tab through interactive elements
- Enter/Space activates buttons
- ESC closes modals
- Arrow keys for PIN inputs

### Screen Reader Support

- Semantic HTML elements
- Descriptive alt text for images
- Status announcements for dynamic content

---

## Layout Patterns

### Full-Screen Sections

```tsx
<div className="min-h-screen bg-gradient-to-b from-[#04411F] to-[#01150A] 
                flex flex-col snap-start">
  {/* Content */}
</div>
```

### Centered Content

```tsx
<div className="container mx-auto px-8 py-8 max-w-4xl">
  {/* Content */}
</div>
```

### Vertical Spacing

```tsx
<div className="flex flex-col">
  <div className="mb-24">{/* Header */}</div>
  <div className="flex-none">{/* Fixed content */}</div>
  <div className="flex-1" />{/* Spacer */}
  <div className="flex-none mb-8">{/* Footer content */}</div>
</div>
```

### Grid Layouts

**3-Column Badge Grid:**
```tsx
<div className="grid grid-cols-3 gap-4">
  {/* Items */}
</div>
```

---

## Responsive Design

### Breakpoints (Tailwind defaults)

```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

### Mobile-First Approach

- Base styles for mobile
- Progressive enhancement for larger screens
- Touch-friendly tap targets (min 44x44px)

### Safe Areas

```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
```

---

## Best Practices

### Do's

✅ Use system fonts for performance
✅ Maintain consistent spacing scale
✅ Use semantic color names
✅ Provide hover states for interactive elements
✅ Include loading and error states
✅ Support keyboard navigation
✅ Use transitions for smooth interactions
✅ Test with screen readers

### Don'ts

❌ Don't use custom fonts (performance)
❌ Don't mix spacing scales arbitrarily
❌ Don't rely on color alone for information
❌ Don't create hover states without focus states
❌ Don't forget disabled states
❌ Don't trap users in modals without ESC
❌ Don't use animations longer than 300ms
❌ Don't forget alt text on images

---

## Implementation Notes

### Tailwind Configuration

```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      'dark-green': '#04411F',
      'darkest-green': '#01150A',
      'yellow': '#FFDD00',
      'light-green': '#8DCB89',
      'medium-green': '#00953B',
      'pink': '#F87171',
    },
  },
}
```

### CSS Variables

```css
:root {
  --dark-green: #04411f;
  --darkest-green: #01150a;
  --yellow: #ffdd00;
  --light-green: #8dcb89;
  --medium-green: #00953b;
  --pink: #f87171;
}
```

### Global Styles

```css
html, body {
  margin: 0;
  padding: 0;
  background-color: #01150a;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## Quick Reference

### Common Component Classes

**Primary Button:**
`bg-[#FFDD00] text-black font-bold py-4 rounded-lg hover:bg-[#FFE44D]`

**Secondary Button:**
`border-2 border-[#8DCB89] text-[#8DCB89] py-3 rounded-lg hover:bg-[#8DCB89] hover:text-[#01150A]`

**Card:**
`rounded-lg bg-[#04411F]/50 border border-[#006B3A] p-6 hover:scale-[1.02]`

**Modal:**
`rounded-3xl bg-[#04411F] px-12 py-10 shadow-2xl`

**Input:**
`px-4 py-3 rounded-lg bg-white text-black focus:ring-2 focus:ring-[#FFDD00]`

**Badge:**
`text-xs px-2 py-1 rounded bg-white/20 text-white`

---

## Version History

- **v1.0** - Initial design system documentation
- Based on Sidekick Performance Coach production application
- Last updated: November 2024

---

## Credits

Design system extracted from the Sidekick Performance Coach application, a sales training and performance tracking platform built with Next.js, React, and Tailwind CSS.
