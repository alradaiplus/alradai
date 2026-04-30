---
name: IX
description: UI/UX Pro Max quality layer. Use when designing, refining, or reviewing user interfaces, web pages, components, banners, slides, logos, or any visual design work. Apply premium UI/UX principles including visual hierarchy, spacing systems, typography, interaction states, accessibility, and conversion optimization. Trigger on /IX command or any UI/UX design or refinement request.
---

# UI/UX Pro Max

Apply this quality layer when designing or refining any user interface, visual design, or web component. Use the principles below as a non-negotiable checklist.

## Visual Hierarchy
- Establish clear primary, secondary, and tertiary visual weight
- Use size, color, contrast, and spacing to guide the eye through the composition in a deliberate sequence
- Every screen should have one dominant focal point, never two competing
- Hierarchy is built with typography first, color second, decoration last

## Spacing System
- Use a consistent spacing scale (4px or 8px base unit)
- Section padding should be generous: 80-160px on desktop, 48-80px on mobile
- Component internal padding should follow a clear scale: 8, 12, 16, 24, 32, 48, 64, 96
- Whitespace is a design element, not empty space — use it to create rhythm and breathing room

## Typography
- Limit to 2 typeface families maximum, often just one
- Establish a clear type scale: 12, 14, 16, 18, 24, 32, 48, 64, 80
- Body text line-height: 1.5-1.7 for Latin, 1.7-1.9 for Arabic
- Headlines have tight line-height (1.0-1.2) and weight 600-700
- Body text uses weight 400-500
- Maintain proper letter-spacing: tighter for large headlines, looser for small caps or labels

## Color
- Define a strict color ratio (e.g., 70% neutral, 20% secondary, 8% primary brand, 2% accent)
- Accent colors are for CTAs, active states, and emphasis only — never for decoration
- Maintain WCAG AA contrast minimum (4.5:1 for body, 3:1 for large text)
- Hover and focus states must use color or weight changes that are visible without relying on color alone

## CTA Hierarchy
- One primary CTA per screen, visually dominant
- Secondary CTAs use lower contrast or ghost styles
- CTAs have generous padding (12-16px vertical, 24-32px horizontal)
- Hover states must communicate interactivity (color shift, shadow, subtle lift)
- Focus states must be keyboard-visible (outline or shadow ring)

## Interaction States
- Every interactive element has at minimum 4 states: default, hover, active/pressed, focus
- Disabled states use reduced opacity (0.4-0.5) and remove pointer events
- Loading states show progress, never blank waiting
- Transitions are 200-400ms for state changes, 600-800ms for entrance animations
- Use cubic-bezier(0.16, 1, 0.3, 1) for travel motion

## Accessibility
- Keyboard navigation must work without a mouse
- All interactive elements have accessible names (aria-label or visible text)
- Focus indicators are always visible
- Color is never the sole indicator of state or meaning
- Touch targets minimum 44x44px on mobile

## Responsive Design
- Mobile-first thinking: design the smallest viewport first, then scale up
- Breakpoints: 375px, 768px, 1024px, 1440px minimum coverage
- Test layouts at each breakpoint, not just smallest and largest
- Hover-only interactions need tap or scroll alternatives on mobile
- Cursor effects are hidden on touch devices

## Conversion Focus
- The primary action should be reachable within 3 seconds of landing
- Forms minimize required fields — only ask for what's necessary now
- Form fields use thin underlines or subtle borders, not heavy boxes
- Error states are inline, near the field, in plain language
- Success states confirm clearly without being patronizing
- CTAs use action verbs in the user's language, not generic "Submit"

## Section Rhythm
- Vary section heights and density to create scroll rhythm
- Alternate between dense content and breathing room
- Use signature moments (one or two per page) to anchor memory
- The rest of the page should be calm and confident, supporting those moments
- Never make every section equally loud — that's visual noise

## What to Avoid
- Generic SaaS gradients (purple-to-pink, blue-to-teal)
- Random bright colors with no system
- Overdecorated cards (heavy shadows, multiple borders, busy backgrounds)
- Excessive animation (parallax everywhere, fade-in on every element)
- Weak spacing (cramped or arbitrary padding)
- Low contrast text (gray-on-gray below 4.5:1)
- Fake metrics or testimonials
- Cluttered sections with no clear focal point
- Template-looking layouts with no point of view
