# Component recipes

Starting points for shared components. Match the project's existing file layout, naming and
helper choice; if it uses shadcn/ui, edit the generated files instead of adding parallel ones.

## Contents

1. `cn` helper
2. Input
3. Field (label, hint, error)
4. Badge
5. Card
6. Link styled as a button
7. Styling from state attributes
8. Icon-only button
9. A preview page for the system

## 1. `cn` helper

```ts
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

`clsx` handles conditionals; `twMerge` resolves conflicts so the last class for a given CSS
property wins. Always pass the caller's `className` last.

If custom utilities or theme keys are added that `tailwind-merge` cannot infer (a custom font
size name, for instance), configure it with `extendTailwindMerge` so conflicts still resolve.

## 2. Input

```tsx
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base shadow-xs transition-colors outline-none md:text-sm',
        'placeholder:text-muted-foreground',
        'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/30',
        className,
      )}
      {...props}
    />
  )
}
```

- `text-base md:text-sm`: 16px on phones prevents iOS Safari from zooming on focus.
- The invalid style keys off `aria-invalid`, which the field must set anyway for assistive
  technology.
- The height matches the Button `default` size so the two align in a row.

## 3. Field (label, hint, error)

One component owns the wiring between label, control, hint and error, so every form gets it
right.

```tsx
import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type FieldProps = {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  className?: string
  children: (props: {
    id: string
    'aria-describedby': string | undefined
    'aria-invalid': true | undefined
  }) => ReactNode
}

export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('grid gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
```

```tsx
<Field label="Email" hint="Used for sign-in and receipts." error={errors.email}>
  {(field) => <Input name="email" type="email" autoComplete="email" required {...field} />}
</Field>
```

`Field` uses no client-only hooks (`useId` works on the server too), so it can be rendered from
Server and Client Components alike. If the project already has a form library with its own field component (`react-hook-form` with
shadcn's `Form`, TanStack Form, Conform), use that instead.

## 4. Badge

```tsx
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        success: 'border-transparent bg-success/15 text-success',
        destructive: 'border-transparent bg-destructive/15 text-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
```

Tinted badges (`bg-success/15 text-success`) need a contrast check in both themes: coloured
text on a tint of itself often lands under 4.5:1. Darken the text token in light mode or use the
solid variant if it fails. A status badge always carries text, optionally an icon; colour is
never the only signal.

## 5. Card

A card is a surface plus spacing. Keep the parts as plain elements so callers compose freely.

```tsx
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-col gap-4 rounded-lg border border-border bg-card p-6 text-card-foreground', className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('grid gap-1', className)} {...props} />
}

export function CardTitle({ className, ...props }: ComponentProps<'h3'>) {
  return <h3 className={cn('leading-none font-semibold', className)} {...props} />
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mt-auto flex items-center gap-2', className)} {...props} />
}
```

`CardTitle` renders an `h3` by default; the correct heading level depends on where the card
sits in the page outline, so let callers change it (an `as` union or `asChild`).

## 6. Link styled as a button

Navigation is a link; an action is a button. To make a link look like a button, apply the
button's classes to the link. Do not nest one inside the other.

```tsx
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

<Link href="/pricing" className={cn(buttonVariants({ variant: 'outline' }))}>
  See pricing
</Link>
```

Or, if the Button supports `asChild` through a `Slot`:

```tsx
<Button asChild variant="outline">
  <Link href="/pricing">See pricing</Link>
</Button>
```

## 7. Styling from state attributes

Style from the same attributes that communicate state to assistive technology and that headless
libraries set for you.

| State                 | Attribute                           | Tailwind variant                         |
| --------------------- | ----------------------------------- | ---------------------------------------- |
| disabled              | `disabled`                          | `disabled:`                              |
| invalid               | `aria-invalid="true"`               | `aria-invalid:`                          |
| current page          | `aria-current="page"`               | `aria-[current=page]:`                   |
| expanded              | `aria-expanded="true"`              | `aria-expanded:`                         |
| pressed / selected    | `aria-pressed`, `aria-selected`     | `aria-pressed:`, `aria-selected:`        |
| open (Radix etc.)     | `data-state="open"`                 | `data-[state=open]:`                     |
| child reacts to group | `group` on parent                   | `group-hover:`, `group-data-[state=open]:` |
| sibling reacts        | `peer` on the input                 | `peer-invalid:`, `peer-checked:`         |
| parent reacts to child| any                                 | `has-[:focus-visible]:`, `has-[:checked]:` |

```tsx
<Link
  href="/settings"
  aria-current={isActive ? 'page' : undefined}
  className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground aria-[current=page]:bg-accent aria-[current=page]:font-medium aria-[current=page]:text-foreground"
>
  Settings
</Link>
```

## 8. Icon-only button

```tsx
<Button variant="ghost" size="icon" aria-label="Close dialog">
  <XIcon aria-hidden />
</Button>
```

The label describes the action, the icon is hidden from assistive technology, and the square
`icon` size keeps the hit area at the same height as other controls. On touch layouts make sure
the target is at least 44 px, by size or by surrounding spacing.

## 9. A preview page for the system

A single route that renders every component in every variant, size and state, in both themes,
is the fastest way to catch regressions when tokens change. Keep it out of production
navigation (for example under `app/dev/ui/page.tsx`, guarded by `process.env.NODE_ENV`, or use
Storybook if the project has it).

```tsx
const variants = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const
const sizes = ['sm', 'default', 'lg'] as const

export default function UiPreview() {
  return (
    <main className="mx-auto max-w-5xl space-y-12 p-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Button</h2>
        {sizes.map((size) => (
          <div key={size} className="flex flex-wrap items-center gap-3">
            {variants.map((variant) => (
              <Button key={variant} variant={variant} size={size}>
                {variant}
              </Button>
            ))}
            <Button size={size} disabled>
              disabled
            </Button>
          </div>
        ))}
      </section>
      {/* Input, Field with error, Badge, Card ... */}
    </main>
  )
}
```
