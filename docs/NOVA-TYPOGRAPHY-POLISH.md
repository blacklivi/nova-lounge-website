# NOVA Editorial Typography and Link Hierarchy

Scope: `nova-design-lab` only (2026-10-26). Checkpoint `nova-design-lab-pretypography-20261026`.

## Typography
- Neutral/lightly positive tracking for Cyrillic place names and detail-page headings. Original -0.04 to -0.08em is too condensed for long Manrope uppercase names.
- Display headings -0.012em, editorial body +0.005em, event headings -0.005em, NOVA logotype retains deliberate tight branded tracking (-0.06em) and the existing extra mask ink allowance.
- Controlled line heights and balanced headlines. Special responsive type size for long «Победителей».
- Central text formatter protects short Russian prepositions and conjunctions using nonbreaking spaces, including two adjacent short words; also protects short connectors in English.
- Static RU/EN interface translations now run through the formatter rather than only CMS/editorial content.
- No editor-entered fixed linebreaks or extra HTML tags in translation strings.

## Interaction cleanup
- Entire venue photo/card remains one link, title arrow removed, underlined «Открыть пространство» remains.
- Bottom hero venue links are full links without extra arrow glyphs.
- Events headline is still a link with underline-on-hover, without oversized arrow; «Вся афиша» stays underlined.
- Venue booking/menu actions and cross-venue links preserve handlers and routes, but remove ornamental arrows. Keep meaningful back navigation and one final booking strip arrow.
- Keyboard-visible focus and reduced-motion behaviour preserved.

## Checks
- Build `npm run check:design-lab` tests Russian prepositions and two-word bindings.
- Confirm optical spacing and single CTA indicator at 320/390/768/1024/1440/1920, including English.
- No changes to main, CMS, Worker bindings or booking actions.
