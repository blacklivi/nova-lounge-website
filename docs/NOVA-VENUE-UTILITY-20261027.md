# NOVA – Practical venue details in context

Experiment branch: `nova-design-lab`. Checkpoint `nova-design-lab-pre-venue-facts-20261027`.

## What improved
Immediately below each venue's photograph, visitors can see the address, **previously configured opening hours** and a simple **map link**, next to the unchanged booking and menu actions. The purpose is to answer real questions, not insert another showy editorial heading. On narrow screens the two facts appear side-by-side when legible and stack below 346 px.

**Data provenance**: the values use the already-present `address_${id}`, `hours_${id}`, and `map_${id}` content keys (ru/en, CMS-aware `value()`). This is a UI change only; hours and addresses are not independently verified or overwritten. A missing hours value omits its column; a missing safe map URL omits its link.

## Safeguards
- DOM: original detail route, gallery, contacts, photos, events, booking and menu actions untouched.
- CSS: 08-venue-utility.css compiled after previous modules; scope only to lab.
- Contrast: light text on existing deep olive, visible keyboard focus.
- Test phones 320 / 390 / 430 and desktop 1440, with both languages and modal actions. No extra fixed buttons or changes to the agreed fullscreen hero.
- Main / production Worker must remain unchanged.
