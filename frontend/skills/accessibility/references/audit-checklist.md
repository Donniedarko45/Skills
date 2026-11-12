# WCAG 2.2 AA audit checklist

Grouped by what you inspect, with success-criterion (SC) numbers for citing in reports. Level A
and AA criteria are both required for AA conformance. "Auto" marks checks an automated scan
usually catches; everything else needs a person or a scripted interaction.

## Contents

1. Page structure
2. Text alternatives and media
3. Keyboard
4. Focus
5. Names, roles and states
6. Forms
7. Colour and visual presentation
8. Zoom, reflow and orientation
9. Pointer and touch
10. Dynamic content and timing
11. Navigation and consistency
12. Authentication
13. Severity guide

## 1. Page structure

- [ ] `<html lang>` is set and correct; passages in another language are marked (3.1.1, 3.1.2). Auto
- [ ] The page has a unique, descriptive `<title>` (2.4.2). Auto (presence only)
- [ ] Landmarks exist: one `<main>`, plus `<header>`, `<nav>`, `<footer>` as applicable;
      repeated landmark types are labelled (1.3.1, 2.4.1). Auto (partly)
- [ ] There is one `<h1>` describing the page, and heading levels do not skip (1.3.1, 2.4.6).
- [ ] Headings and labels describe their content (2.4.6).
- [ ] Lists, tables and quotes use their semantic elements; tables have header cells with
      `scope` (1.3.1).
- [ ] Reading order in the DOM matches the visual order (1.3.2).
- [ ] A skip link or equivalent bypasses repeated navigation (2.4.1).

## 2. Text alternatives and media

- [ ] Informative images have `alt` text that conveys their purpose (1.1.1). Auto (presence only)
- [ ] Decorative images have `alt=""` or are CSS backgrounds; decorative icons are `aria-hidden` (1.1.1).
- [ ] Icon-only buttons and links have accessible names (1.1.1, 4.1.2). Auto
- [ ] Complex images (charts, diagrams) have a text summary or data table (1.1.1).
- [ ] Text is real text, not images of text (1.4.5).
- [ ] Pre-recorded video has captions and audio description or a transcript (1.2.1-1.2.5).
- [ ] Nothing plays audio automatically for more than 3 seconds without a control (1.4.2).

## 3. Keyboard

- [ ] Every interactive element is reachable and operable by keyboard alone (2.1.1).
- [ ] No keyboard trap outside modal dialogs; modals can be closed with Escape (2.1.2).
- [ ] Tab order follows a logical sequence; no positive `tabindex` (2.4.3). Auto (tabindex only)
- [ ] Composite widgets follow their expected arrow-key behaviour (2.1.1, 4.1.2).
- [ ] Single-character keyboard shortcuts can be turned off or remapped (2.1.4).
- [ ] Hover-only content is also available on focus (1.4.13).
- [ ] Drag-and-drop has a non-dragging alternative (2.5.7).

## 4. Focus

- [ ] The focus indicator is visible on every focusable element (2.4.7).
- [ ] The focus indicator has at least 3:1 contrast with adjacent colours (1.4.11).
- [ ] The focused element is not fully hidden by sticky headers, footers or overlays (2.4.11).
- [ ] Opening a dialog moves focus into it; closing returns focus to the trigger (2.4.3).
- [ ] Focus is not lost (reset to the top of the page) when content is removed or replaced (2.4.3).
- [ ] Receiving focus alone does not trigger a change of context (3.2.1).
- [ ] After client-side navigation, the new page is announced and focus is in a sensible place (2.4.3).

## 5. Names, roles and states

- [ ] Every control has an accessible name (4.1.2). Auto
- [ ] The accessible name contains the visible label text (2.5.3).
- [ ] Custom widgets expose the correct role (4.1.2). Auto (validity only)
- [ ] States are exposed and kept current: `aria-expanded`, `aria-selected`, `aria-checked`,
      `aria-pressed`, `aria-current`, `aria-invalid`, `aria-disabled` (4.1.2).
- [ ] ARIA attributes are valid for their role and reference existing `id`s (4.1.2). Auto
- [ ] No focusable elements inside `aria-hidden="true"` content (4.1.2). Auto
- [ ] No nested interactive elements (a button inside a link) (4.1.2). Auto
- [ ] Link purpose is clear from the link text or its context (2.4.4).

## 6. Forms

- [ ] Every input has a programmatically associated, visible label (1.3.1, 3.3.2). Auto
- [ ] Placeholder text is not the only label (3.3.2).
- [ ] Related inputs are grouped with `<fieldset>` and `<legend>` (1.3.1).
- [ ] Required fields are indicated in text and programmatically (3.3.2).
- [ ] Personal-data inputs have correct `autocomplete` values (1.3.5). Auto (validity only)
- [ ] Errors are identified in text and associated with their field (3.3.1).
- [ ] Error messages suggest how to fix the problem (3.3.3).
- [ ] Errors are announced: focus moves to them or they are in a live region (4.1.3).
- [ ] Changing a field's value does not unexpectedly change context (3.2.2).
- [ ] Legal, financial and data-deleting submissions can be reviewed, confirmed or undone (3.3.4).
- [ ] Information already entered in the same process is not asked for again (3.3.7).

## 7. Colour and visual presentation

- [ ] Text contrast is at least 4.5:1, or 3:1 for large text (1.4.3). Auto (not over images or gradients)
- [ ] UI component boundaries, states and meaningful graphics have at least 3:1 contrast (1.4.11).
- [ ] Colour is not the only means of conveying information, including links within text (1.4.1).
- [ ] Both light and dark themes meet the contrast requirements.
- [ ] Text over images or gradients stays readable at every viewport size (1.4.3).
- [ ] Text spacing can be increased (line height 1.5, paragraph spacing 2x, letter spacing
      0.12em, word spacing 0.16em) without loss of content (1.4.12).
- [ ] Instructions do not rely on shape, colour, size or position alone ("the green button on
      the right") (1.3.3).

## 8. Zoom, reflow and orientation

- [ ] Text can be resized to 200% without loss of content or function (1.4.4).
- [ ] At 320 CSS px wide, content reflows without horizontal scrolling, except data tables,
      maps and similar (1.4.10).
- [ ] The viewport meta tag does not disable zoom (1.4.4). Auto
- [ ] Content works in both portrait and landscape (1.3.4).

## 9. Pointer and touch

- [ ] Targets are at least 24x24 CSS px or have equivalent spacing (2.5.8). Auto (partly)
- [ ] Multi-point or path-based gestures (pinch, swipe) have a single-pointer alternative (2.5.1).
- [ ] Actions fire on pointer up, not down, and can be aborted (2.5.2).
- [ ] Functions triggered by device motion have a UI alternative (2.5.4).

## 10. Dynamic content and timing

- [ ] Status messages are announced without moving focus (4.1.3).
- [ ] Content that appears on hover or focus is dismissable, hoverable and persistent (1.4.13).
- [ ] Moving, blinking or auto-updating content lasting over 5 seconds can be paused, stopped
      or hidden (2.2.2).
- [ ] Nothing flashes more than three times per second (2.3.1).
- [ ] Time limits can be turned off, adjusted or extended (2.2.1).
- [ ] Animation is reduced when `prefers-reduced-motion` is set (best practice; 2.3.3 is AAA).
- [ ] Loading states are conveyed to assistive technology (4.1.3).

## 11. Navigation and consistency

- [ ] There is more than one way to find pages: navigation, search or a sitemap (2.4.5).
- [ ] Navigation appears in the same order across pages (3.2.3).
- [ ] The same function has the same name and icon everywhere (3.2.4).
- [ ] Help mechanisms (contact, chat) appear in the same relative place on each page (3.2.6).
- [ ] The current page is indicated in navigation with `aria-current="page"`.

## 12. Authentication

- [ ] Sign-in does not require a cognitive function test (remembering, transcribing, solving)
      without an alternative: password managers and paste work; a copy-paste code or passkey is
      offered (3.3.8).
- [ ] One-time-code inputs use `autocomplete="one-time-code"` and accept paste.

## 13. Severity guide

Use these when ordering findings.

| Severity | Meaning                                                    | Examples                                                                                  |
| -------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Blocker  | Some users cannot complete a core task                     | Control not keyboard-operable; modal traps or loses focus; unlabeled required input       |
| Serious  | Task is possible but slow, confusing or error-prone        | Low-contrast body text; errors not announced; invisible focus; unnamed icon buttons       |
| Moderate | Friction or missing context                                | Skipped heading levels; vague link text; missing landmarks; small targets                 |
| Minor    | Polish and best practice                                   | Redundant ARIA; decorative icon not hidden; missing `aria-current`                        |

Weight by where the issue occurs: a moderate problem in checkout or sign-in matters more than
the same problem on a rarely visited page.
