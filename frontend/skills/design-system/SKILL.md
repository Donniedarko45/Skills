---
name: design-system
description: Set up and extend a design system in a React/Next.js + Tailwind CSS codebase - design tokens, theming and dark mode, a reusable component library with variants, and shadcn/ui or headless primitives. Use this whenever the task is to create or change theme colours, CSS variables, the Tailwind theme, dark mode, brand colours, fonts, spacing or radius scales; to build or standardise shared UI components (Button, Input, Badge, Card, Dialog) or their variants and sizes; to add or customise shadcn/ui; to fix inconsistent styling across the app; or to start a new project's styling foundation.
---

# Design system

A design system is a set of decisions made once so they do not have to be made again: which
colours exist and what each is for, which sizes and radii are allowed, and how a button behaves
everywhere. Its value comes from being small and being used. Add to it reluctantly.

## 1. Find out what is already there

- **Tailwind version.** v4 configures the theme in CSS (`@import "tailwindcss"` and `@theme` in
  the global stylesheet). v3 uses `tailwind.config.{js,ts}` with `@tailwind base/components/utilities`.
  The token model below is the same; the syntax differs. `references/tokens.md` shows both.
- **Existing tokens and components.** Read the global stylesheet, `components/ui/`, and
  `components.json` (present when shadcn/ui is installed). Extend what exists; a second, parallel
  set of tokens is worse than an imperfect single set.
- **Helpers.** Look for `cn()` (usually `lib/utils.ts`), `class-variance-authority`,
  `tailwind-variants`, `tailwind-merge`. Use what the project uses.
- **Primitives.** Radix UI, Base UI, React Aria or Headless UI may already be installed. Build on
  the one that is there.

## 2. Tokens in three layers

1. **Primitive values**: the raw palette and scales (`--gray-50` ... `--gray-950`, the brand hue).
   Tailwind's default palette can serve as this layer.
2. **Semantic tokens**: names that say what a value is *for*. Components use only these.
3. **Component tokens**: only when a component needs a value that is not a semantic token
   (`--sidebar-width`). Rare.

The semantic layer is what makes theming work. A component that says `bg-primary` gets dark mode
and rebrands for free; one that says `bg-indigo-600` has to be found and edited.

A semantic colour set that covers most products (the shadcn/ui convention, widely recognised):

| Token                                  | Used for                                         |
| -------------------------------------- | ------------------------------------------------ |
| `background` / `foreground`            | page background and default text                 |
| `card` / `card-foreground`             | raised surfaces                                  |
| `popover` / `popover-foreground`       | menus, popovers, tooltips                        |
| `primary` / `primary-foreground`       | the main action and active states                |
| `secondary` / `secondary-foreground`   | lower-emphasis actions                           |
| `muted` / `muted-foreground`           | subtle fills and secondary text                  |
| `accent` / `accent-foreground`         | hover and selected fills in lists and menus      |
| `destructive` / `destructive-foreground` | errors and destructive actions                 |
| `border`, `input`, `ring`              | dividers, input borders, focus rings             |

Rules that keep the set healthy:

- Tokens come in **background/foreground pairs**. Whoever picks `bg-primary` also uses
  `text-primary-foreground`, and the pair is guaranteed to have enough contrast.
- Name by role, never by value: `--destructive`, not `--red`.
- Add `success`, `warning` and `info` pairs when the product needs them, and chart colours as
  `chart-1` ... `chart-5`.
- Define every token for every theme. A token with no dark value is the usual cause of unreadable
  dark-mode screens.
- Check contrast when choosing values: 4.5:1 for each foreground/background pair, and 3:1 for
  `input` and `ring` against the surfaces they sit on. `border` is for decorative dividers and
  can be lighter.
- Prefer OKLCH for colour values. Lightness is perceptually even, so a scale built by stepping
  lightness looks even, and hover states can be derived by nudging one number.

Non-colour tokens: one `--radius` with derived steps, font families (`--font-sans`, `--font-mono`
wired from `next/font`), and a short shadow scale. Use Tailwind's spacing and type scales as
they are unless the brand demands otherwise; consistency matters more than custom numbers.

The full token stylesheet, for Tailwind v4 and v3, is in `references/tokens.md`.

## 3. Theming and dark mode

- Put light values on `:root` and dark values on `.dark` (or `[data-theme="dark"]`). Components
  never mention the theme; they only reference tokens. `dark:` utilities are then needed only for
  the rare case a token cannot express.
- In Tailwind v4, make `dark:` follow the class instead of the OS setting with
  `@custom-variant dark (&:where(.dark, .dark *));`. In v3, set `darkMode: 'class'`.
- Set `color-scheme: light` / `dark` alongside the tokens so native controls, scrollbars and
  form widgets match.
- Avoid the flash of the wrong theme: the theme class must be on `<html>` before first paint.
  `next-themes` handles this with an inline script; add `suppressHydrationWarning` to `<html>`
  because the class is set before React hydrates.
- Offer light, dark and system. Default to system.
- A theme toggle renders differently on server and client. Render it only after mount, or use
  CSS to show the right icon, to avoid a hydration mismatch.

## 4. Components: variants without chaos

Give each shared component a small, closed set of options and one place where its classes live.

- `variant` for visual role (`default`, `secondary`, `outline`, `ghost`, `destructive`, `link`),
  `size` for dimensions (`sm`, `default`, `lg`, `icon`). Avoid one-off boolean style props.
- Define variants with `cva` (or `tailwind-variants`) so the options are typed and the default is
  explicit.
- Merge classes with `cn()` = `twMerge(clsx(...))`, with the caller's `className` last. Without
  `tailwind-merge`, `px-4` and a caller's `px-2` both apply and the winner depends on CSS order.
- Extend the native element's props, spread the rest, and pass `ref` through (see the
  `react-components` skill).
- Style states from attributes, not extra props: `disabled:`, `aria-invalid:`,
  `data-[state=open]:`, `aria-[current=page]:`. The attribute is needed for accessibility
  anyway, so styling from it keeps the two in sync.
- Every interactive component ships with hover, `focus-visible`, active, disabled and (where
  relevant) loading and invalid states. The focus ring uses the `ring` token and is never removed
  without a replacement.
- Consistent control heights across Button, Input and Select at each size (for example 32 / 36 /
  40 px), so they line up in a row.

```tsx
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3',
        default: 'h-9 px-4',
        lg: 'h-10 px-6',
        icon: 'size-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

type ButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { buttonVariants }
```

Exporting `buttonVariants` lets a `<Link>` look like a button without nesting a button in a link.

More recipes (Input and Field, Badge, Card, the `cn` helper) are in
`references/component-recipes.md`.

## 5. Build complex widgets on headless primitives

Dialogs, menus, popovers, comboboxes, selects, tabs, tooltips and toasts have keyboard, focus
and screen-reader behaviour that takes weeks to get right. Use a headless library for behaviour
and apply the system's styling on top:

- **shadcn/ui** is a set of components copied into the repo (`components/ui/`) and built on a
  headless library. You own the code: edit it to fit the system rather than wrapping it. Add
  components with its CLI (`npx shadcn@latest add dialog`) when the project uses it.
- Otherwise use the headless library the project already has (Radix, Base UI, React Aria).
- Hand-roll only simple things: buttons, inputs, badges, cards, layout primitives.

Do not install a second primitive library alongside an existing one for a single component.

## 6. When to add to the system

Ask in this order:

1. Can an existing component do it as-is?
2. Can it do it with composition (children, slots) or the `className` escape hatch?
3. Does it need a new variant? Add one only when the look recurs in at least two or three places
   and has a nameable role.
4. Only then, a new component.

One-off layouts stay in the feature that owns them. Promote a pattern to `components/ui` on its
third use, not its first. Remove variants nobody uses.

## 7. Verify

- Render every variant and size, in light and dark, and look at them (a simple `/dev/ui` route
  or Storybook, whichever the project has).
- Tab through: focus rings visible on every component, on every surface colour.
- Check contrast of each foreground/background token pair after changing colour values.
- Run typecheck and lint; make sure the `className` override actually wins.

## Reference files

- `references/tokens.md` - a complete token stylesheet for Tailwind v4 (`@theme inline`) and the
  v3 equivalent, fonts with `next/font`, dark mode wiring, and how to derive a palette.
- `references/component-recipes.md` - `cn`, Input and Field, Badge, Card, Link-as-button, and
  state styling from ARIA and data attributes.
