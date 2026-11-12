# Tokens and theming

## Contents

1. Tailwind v4 token stylesheet
2. Fonts with `next/font`
3. Dark mode wiring with `next-themes`
4. Tailwind v3 equivalent
5. Choosing colour values
6. Extending the set
7. Migrating hard-coded colours to tokens

## 1. Tailwind v4 token stylesheet

Runtime values live in plain CSS variables on `:root` and `.dark`. `@theme inline` maps them to
Tailwind's theme namespaces so utilities like `bg-background`, `text-muted-foreground` and
`rounded-lg` exist. `inline` makes the utilities reference the variable itself, so switching
the class on `<html>` re-themes everything.

```css
/* app/globals.css */
@import "tailwindcss";

/* dark: utilities follow the .dark class, not the OS setting */
@custom-variant dark (&:where(.dark, .dark *));

:root {
  color-scheme: light;

  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.5 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.62 0 0);
  --ring: oklch(0.55 0 0);

  --radius: 0.625rem;
}

.dark {
  color-scheme: dark;

  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --destructive-foreground: oklch(0.18 0.03 25);
  --border: oklch(1 0 0 / 12%);
  --input: oklch(0.55 0 0);
  --ring: oklch(0.65 0 0);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --font-sans: var(--font-sans-family), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-mono-family), ui-monospace, monospace;
}

@layer base {
  * {
    border-color: var(--border);
  }
  body {
    background-color: var(--background);
    color: var(--foreground);
  }
}
```

Notes:

- Variables in `@theme` must use Tailwind's namespaces to generate utilities: `--color-*`,
  `--radius-*`, `--font-*`, `--shadow-*`, `--spacing`, `--breakpoint-*`, `--ease-*`, and so on.
- Opacity modifiers work with these tokens (`bg-primary/90`, `border-border/60`).
- Tailwind v4 changed the default border colour to `currentColor`; the base rule above restores
  a token-based default so a bare `border` class uses the border token.
- If the project already has a shadcn/ui stylesheet, it will look very much like this. Edit the
  values there instead of adding a new file.
- `--border` is for dividers and card outlines, which are decorative. `--input` is darker on
  purpose: an input's outline is what identifies it as a control, so it needs 3:1 against the
  page. Every foreground/background pair above meets 4.5:1.
- The neutral values above are a starting point. Replace `--primary` and `--ring` with the brand
  colour (section 5) and re-check contrast.

## 2. Fonts with `next/font`

`next/font` self-hosts the font files and generates a size-adjusted fallback, so text does not
shift when the web font loads.

```tsx
// app/layout.tsx
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const sans = Inter({ subsets: ['latin'], variable: '--font-sans-family', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono-family', display: 'swap' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
```

The `variable` names here match the ones read in `@theme inline` above. Prefer a variable font
(one file, all weights). For a custom typeface use `next/font/local` with the same `variable`
option.

## 3. Dark mode wiring with `next-themes`

```tsx
// app/providers.tsx
'use client'

import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )
}
```

- `attribute="class"` toggles `.dark` on `<html>`, matching the stylesheet.
- `disableTransitionOnChange` stops every element animating its colours at once on toggle.
- `<html>` needs `suppressHydrationWarning`, because the class is applied by an inline script
  before hydration.

Theme toggle without a hydration mismatch: render both icons and let CSS choose.

```tsx
'use client'

import { useTheme } from 'next-themes'
import { MoonIcon, SunIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <SunIcon aria-hidden className="dark:hidden" />
      <MoonIcon aria-hidden className="hidden dark:block" />
    </Button>
  )
}
```

## 4. Tailwind v3 equivalent

v3 keeps the same variables but maps them in the config file.

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    /* ...same token names, as space-separated HSL channels... */
    --radius: 0.625rem;
  }
  .dark {
    --background: 0 0% 9%;
    --foreground: 0 0% 98%;
    /* ... */
  }
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        // ...the remaining tokens follow the same shape
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
} satisfies Config
```

Storing bare channels (`0 0% 9%`) with `<alpha-value>` is what lets `bg-primary/90` work in v3.
Do not mix v3 and v4 syntax: a project is one or the other. Check the installed `tailwindcss`
major version before editing.

## 5. Choosing colour values

OKLCH is `oklch(lightness chroma hue)`: lightness 0-1, chroma 0 to about 0.37, hue 0-360.

**Neutrals.** Pick one grey family. Pure neutral has chroma 0; a slight tint toward the brand
hue (chroma 0.005-0.02) makes the UI feel cohesive. Light theme surfaces sit at lightness
0.97-1, text at 0.15-0.25. Dark theme surfaces sit at 0.14-0.27, text at 0.9-0.985.

**Brand / primary.** Start from the brand colour, convert it to OKLCH, and check it as a button
background:

- white text on it needs 4.5:1, which usually means lightness at or below about 0.6
- in dark mode, raise lightness (about 0.7-0.8), lower chroma a little, and switch the
  foreground to a dark value if contrast requires

```css
:root {
  --primary: oklch(0.55 0.2 262);
  --primary-foreground: oklch(0.985 0 0);
  --ring: oklch(0.55 0.2 262);
}
.dark {
  --primary: oklch(0.72 0.16 262);
  --primary-foreground: oklch(0.18 0.02 262);
  --ring: oklch(0.72 0.16 262);
}
```

**Semantic colours.** Keep lightness and chroma close across success, warning and destructive
so none shouts louder than the others; vary the hue (about 145 green, 75 amber, 25 red).

**Checking contrast.** Compute it; do not eyeball it. Browser dev tools show the ratio in the
colour picker, and the `accessibility` skill's scan reports failures on rendered pages. Text
pairs need 4.5:1, large text and UI boundaries 3:1.

## 6. Extending the set

Add a token pair when a role recurs, with values for every theme, and map it in `@theme inline`.

```css
:root {
  --success: oklch(0.52 0.14 150);
  --success-foreground: oklch(0.985 0 0);
  --warning: oklch(0.8 0.15 80);
  --warning-foreground: oklch(0.25 0.05 80);
}
.dark {
  --success: oklch(0.7 0.15 150);
  --success-foreground: oklch(0.18 0.03 150);
  --warning: oklch(0.82 0.14 80);
  --warning-foreground: oklch(0.2 0.04 80);
}

@theme inline {
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
}
```

Other scales worth tokenising once, if the defaults do not fit:

- **Shadows**: `--shadow-sm`, `--shadow-md`, `--shadow-lg` in `@theme`, three levels at most.
- **Z-index**: a named order (`dropdown`, `sticky`, `overlay`, `modal`, `toast`) instead of
  competing magic numbers. Portalled primitives remove most of the need.
- **Motion**: `--ease-out` and one or two durations shared by all components.

## 7. Migrating hard-coded colours to tokens

1. Search for raw palette classes and hex values: `(bg|text|border|ring|fill|stroke)-(zinc|gray|slate|neutral|stone|red|blue|indigo|...)-\d+` and `#[0-9a-fA-F]{3,8}`.
2. Group them by role, not by value. `text-gray-500` in captions and `text-gray-500` as an icon
   colour may map to the same token; a `bg-gray-100` hover fill and a `bg-gray-100` page section
   may not.
3. Replace role by role, starting with text and backgrounds, then borders, then accents.
4. Delete `dark:` overrides that the token now covers.
5. View every changed screen in both themes before moving on.

Keep each step a separate, reviewable commit. A single sweeping find-and-replace hides mistakes.
