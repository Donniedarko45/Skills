# Polish checklist

Run this against the rendered screen (a screenshot or the live page), not the code. Each item
is something a careful reviewer would notice.

## Hierarchy

- [ ] Squint at the screen: the most important element is still the most visible.
- [ ] Exactly one primary action per view.
- [ ] Headings, body and metadata are visibly different in size or tone, with no more than about
      four text sizes on screen.
- [ ] Nothing is emphasised that does not need to be (stray bold, extra colour, extra borders).

## Spacing and alignment

- [ ] Every gap comes from the spacing scale.
- [ ] Related items are closer together than unrelated ones.
- [ ] Left edges line up; there are only a few distinct vertical alignment lines.
- [ ] Padding inside a container is at least as large as the gap between its children.
- [ ] Sections have clear breathing room; nothing touches the viewport edge on mobile.
- [ ] Icons are vertically centred with their text and consistently sized.

## Typography

- [ ] Body text is at least 16px on mobile, and line length stays under about 75 characters.
- [ ] Headings do not end with a single orphaned word (`text-balance`).
- [ ] Numbers in columns and counters use `tabular-nums`.
- [ ] No text is truncated without a way to read the full value.
- [ ] Copy is real, specific and free of placeholder text.

## Colour and contrast

- [ ] Body text contrast is at least 4.5:1; muted text, placeholders and disabled-looking labels
      have been checked specifically.
- [ ] Icons, input borders and focus rings reach 3:1 against their background.
- [ ] The accent colour is used for primary actions and active states only.
- [ ] Meaning never depends on colour alone.
- [ ] Dark theme checked separately: surfaces are distinguishable, no pure-white glare, no
      token left unset.

## States

- [ ] Hover, focus-visible, active and disabled states exist for every interactive element.
- [ ] Tab through the screen: the focus ring is always visible and the order makes sense.
- [ ] Loading state matches the final layout; no layout jump when data arrives.
- [ ] Empty state explains itself and offers the next action.
- [ ] Error state says what happened and how to recover.
- [ ] Buttons show pending state and cannot be double-submitted.

## Responsive

- [ ] At 360 px wide: no horizontal page scroll, no clipped content, tap targets about 44 px.
- [ ] At 768 px and 1024 px: layout uses the space sensibly; no stretched single column.
- [ ] At 1440 px and wider: content has a max width and is not stranded on the left.
- [ ] At 200% browser zoom the page is still usable.
- [ ] Images keep their aspect ratio at every width.

## Content resilience

- [ ] Very long names, titles and emails wrap or truncate cleanly.
- [ ] Zero, one and many items all look intentional.
- [ ] Missing images and avatars have a fallback.
- [ ] Large numbers and long translated strings fit.

## Detail

- [ ] One radius scale; nested radii look concentric.
- [ ] Borders, shadows and backgrounds are not all used at once for the same separation.
- [ ] Shadows are subtle and consistent in direction.
- [ ] Transitions are short, use `transform`/`opacity`, and respect reduced motion.
- [ ] No leftover debug borders, test content or commented-out UI.
