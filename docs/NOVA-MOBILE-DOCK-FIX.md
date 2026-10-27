# NOVA mobile hero / booking dock alignment

Date: 2026-10-27. Experiment `nova-design-lab` ONLY.

## Reported defect and measured root cause
At a 390×844 CSS viewport, initial hero height was 844px. Three venue links ended at Y784 and the fixed mobile booking bar started at Y771 (height 73px). Consequently the photograph still existed underneath the booking dock and, while scrolling, a 60px photograph tail appeared after the venue links.

## Fix
- Mobile hero height is now `100svh` minus the **actual rendered height** of `.mobile-cta`, with a correct initial CSS fallback of 73px plus the safe-area inset.
- The dock is measured with `ResizeObserver`; the value is updated on SPA rerenders and orientation changes. Do NOT use continuously changing `visualViewport.height` (it causes jumping on iOS Safari as the browser address bar retracts).
- Venue navigation uses `bottom:0` inside the hero; cover image fills the hero and ends at exactly the same pixel as the venue navigation.
- The next section is adjacent to the hero; mobile top padding reduced to 36px.
- The mobile booking button is now sage-filled with dark high-contrast type, visible border, focus and pressed states.
- Hero venue links have persistent fine underlines and a gentle, dark surface to make them look tappable without adding ornamental arrows.
- Desktop keeps its full viewport hero and uninterrupted original photograph.

## Protection
Previous state: branch `nova-design-lab-predock-fix-20261027`. `main` and `nova-lounge-demo` must remain unchanged.
Build must pass `npm run check:design-lab`. Browser QA: measure hero.bottom == nav.bottom == dock.top at 320/390/430 CSS widths; no horizontal overflow, scrolling immediately shows next content, RU/EN and booking modal functional.
