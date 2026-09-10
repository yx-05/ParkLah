---
name: Aegean Drift
colors:
  surface: '#f7fafa'
  surface-dim: '#d7dadb'
  surface-bright: '#f7fafa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f4'
  surface-container: '#ebeeef'
  surface-container-high: '#e6e9e9'
  surface-container-highest: '#e0e3e3'
  on-surface: '#181c1d'
  on-surface-variant: '#3e494a'
  inverse-surface: '#2d3132'
  inverse-on-surface: '#eef1f2'
  outline: '#6f797a'
  outline-variant: '#bec8ca'
  surface-tint: '#006972'
  primary: '#00535b'
  on-primary: '#ffffff'
  primary-container: '#006d77'
  on-primary-container: '#9becf7'
  inverse-primary: '#82d3de'
  secondary: '#23676f'
  on-secondary: '#ffffff'
  secondary-container: '#adedf7'
  on-secondary-container: '#2b6d76'
  tertiary: '#713d10'
  on-tertiary: '#ffffff'
  tertiary-container: '#8e5426'
  on-tertiary-container: '#ffd7bd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9ff0fb'
  primary-fixed-dim: '#82d3de'
  on-primary-fixed: '#001f23'
  on-primary-fixed-variant: '#004f56'
  secondary-fixed: '#adedf7'
  secondary-fixed-dim: '#91d1da'
  on-secondary-fixed: '#001f23'
  on-secondary-fixed-variant: '#004f56'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#6d390c'
  background: '#f7fafa'
  on-background: '#181c1d'
  surface-variant: '#e0e3e3'
  action-blue: '#007bff'
  surface-ice: '#f2fbfe'
  star-gold: '#ffb400'
typography:
  headline-lg:
    fontFamily: Lexend
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Lexend
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Lexend
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Lexend
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Lexend
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Lexend
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Lexend
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-md:
    fontFamily: Lexend
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Lexend
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  margin-mobile: 20px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  nav-height: 72px
---

## Brand & Style

The design system evolves into a **High-Contrast Modern** aesthetic that merges the tranquil deep-sea tones of the original palette with a bold, technical energy. It is designed for a premium parking matchmaking experience that feels both reliable and cutting-edge.

The visual narrative is driven by extreme clarity and high-impact geometry. By utilizing a "floating" UI model—where primary navigation and interactive containers sit independently above the background—the system creates a sense of lightness and speed. The interface evokes professional efficiency through generous whitespace, high-contrast action elements, and a sophisticated, bold typographic hierarchy.

## Colors

The "Aegean Drift" palette is maintained but restructured for higher functional contrast.

- **Primary (Deep Teal):** Used for primary semantic weight and brand-critical elements.
- **Action (Bright Blue):** Introduced as a high-contrast interactive color for primary CTAs and active states, ensuring "Get Started" and "Per Hour" badges pop against the icy surfaces.
- **Neutral (Surface Ice):** The dominant background color, providing a clean, bright environment that feels spacious.
- **Status & Accents:** Gold is used exclusively for ratings and high-value feedback, while deep slates handle typography to avoid the harshness of pure black while maintaining legibility.

## Typography

The design system adopts **Lexend** as the sole typeface. Its geometric construction and varying widths provide a modern, technical feel that is exceptionally readable at all sizes.

- **Headlines:** Use heavy weights (700) with tight letter spacing for a bold, editorial impact.
- **Body:** Use regular weights (400) for high legibility in descriptions.
- **Labels:** Use medium weights (500-600) for functional UI elements like price tags, availability, and distances.
- **Hierarchy:** Contrast is achieved through weight and size rather than font switching, maintaining a unified, clean appearance.

## Layout & Spacing

The layout follows a **Fluid Floating Grid** model. Elements are not always pinned to the edges; instead, they often sit within containers that float with consistent margins.

- **Floating Navigation:** The bottom navigation bar is a detached, rounded container with significant bottom and side margins, creating a "remote control" feel.
- **Safe Margins:** A 20px horizontal margin is enforced across all mobile screens.
- **Spacing Rhythm:** Use 16px as the standard gutter for card internal padding and 24px for vertical separation between logical sections.

## Elevation & Depth

Depth is used to signify "interactivity" and "separation."

- **Floating Surfaces:** Navigation bars and search bars use a **Level 2 Elevation**, utilizing soft, diffused shadows (0px 8px 30px, 8% opacity) to appear as if hovering over the scrollable content.
- **Tonal Layering:** Main content cards use a **Level 1 Elevation** with a very subtle shadow or a simple white surface against the `surface-ice` background.
- **Glassmorphism:** Bottom sheets and floating navigation containers may utilize a light backdrop blur (10px - 15px) to maintain context while highlighting the active layer.

## Shapes

The shape language is strictly **Pill-Shaped and Ultra-Rounded**.

- **Buttons & Chips:** All primary actions, chips (e.g., "Nearest"), and status badges use a `rounded-full` pill shape.
- **Containers:** Main content cards and image containers use a `rounded-xl` (24px) radius to soften the high-contrast aesthetic.
- **Interactive Inputs:** Search bars and form fields follow the pill-shaped convention for a friendly, modern touch.

## Components

- **Buttons:** Primary buttons are pill-shaped, high-contrast elements. They often feature an icon on the right (e.g., ">>>") to suggest forward momentum. Use the `action-blue` for primary CTAs.
- **Floating Bottom Nav:** A detached, horizontal container with a high corner radius (32px+). Icons are clean, thin-stroke line art. The active state is indicated by a solid blue circular or pill-shaped background behind the icon.
- **Parking Cards:** Feature high-radius image containers (top) with metadata below. Price badges are pill-shaped and pinned to the bottom-left of the image or right-aligned in the list.
- **Chips:** Small, pill-shaped filters. Active chips use a solid primary color with white text; inactive chips use a subtle grey/light-blue background with darker text.
- **Input Fields:** Search bars are pill-shaped with an inset search icon, maintaining the floating appearance with a subtle shadow.
- **Distance & Rating Labels:** Use bold typography and small icons (stars/location pins) with tight grouping to provide quick scannability.