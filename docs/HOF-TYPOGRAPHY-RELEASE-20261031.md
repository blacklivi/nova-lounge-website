# HOF by NOVA — launch checkpoint and typography QA

Date: 2026-10-31

## Release intent
Promote experiment `experiment/hof-by-nova-20261030` to the default NOVA main site. HOF by NOVA replaces the old Zybitskaya page visually while venue ID `zyb`, URL `/spaces/zybitskaya`, menu and booking flows remain intact.

## Safe rollback
Baseline branch **`backup/nova-pre-hof-20261031`** contains the exact former main commit `dc026fbfe77bd177614abb2f13a27e3faa1681fb`.
Rollback procedure: start from backup branch to create an explicit revert PR or use the GitHub pre-HOF commit. Do not reset D1/R2, secrets, CMS content or media; they were not modified during this redesign.

## Design constraints
- Manrope family, 300/400/500; white/olive NOVA outside HOF, dark-green editorial HOF inside.
- No negative letter-spacing on HOF typography. Existing deliberate NOVA wordmark's tracking is retained to avoid disturbing its approved optical/photo alignment.
- Balance headings, pretty-wrap body; never force breaks in editable or editorial headings; nonbreaking spaces bind RU short words and English connectors.
- Mobile text sizing and CTA stacking for 320px, reduced motion and keyboard focus preserved.
- Avoid fake chapter numbers, excessive tracked captions, invented events, fake data. Two sample posters explicitly marked as not real events.
- Design-lab references: `docs/NOVA-TYPOGRAPHY-POLISH.md`, `docs/NOVA-HALLMARK-ART-DIRECTION-20261027.md`, `docs/NOVA-ART-DIRECTION-2026.md`.
- Hallmark and ai-design-skills inform the checks, but this is **not** an official upstream Hallmark rendered 57-gate audit.

## Quality checks
- HOF renders at widths 320, 390, 768, 1440, 1920 in RU/EN; no overflow, negative heading tracking, or broken images observed in the browser checks.
- On HOF, all H1/H2 are balanced; Russian `на Зыбицкой` uses NBSP, as do adjacent short connectors `и в доме`.
- Booking opens with internal venue `zyb` and visible label HOF by NOVA; other venue details and events page remain accessible.
- `npm run check` includes `scripts/check-hof-typography.mjs` to guard future changes.
- Final human visual review on real mobile Safari and with genuine venue photography remains outstanding.
