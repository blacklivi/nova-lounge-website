# NOVA · Typography-first foundation, prepared for real photography

Experiment: `nova-design-lab` — 27 October 2026.
Rollback: `nova-design-lab-pre-photo-light-20261027`.

## Rationale

The venues have not yet been photographed. Using stock-like sample interiors creates an artificial, untrustworthy impression. The new approach relies on NOVA's own typographic identity, white space, dark olive palette, and practical differentiation of the three places. It is not another premade landing-page theme.

## What changes

- **Cover:** one full-screen dark-olive composition, large NOVA lettering, existing short tagline and the three venue links anchored above the fixed mobile reservation dock. No photographic background.
- **Venues:** three clickable, ruled editorial entries on white, with place name, character and clear “Открыть пространство” target. No vacant image blocks. All 3 detail routes still work.
- **Kitchen:** meaningful text and menu CTA, not a random food stock photo.
- **Events:** date-led list on the homepage, still linked to the real event archive. Demo poster imagery is not used. Mock events remain explicitly labelled as demonstration.
- **Booking:** concise full-width olive invitation with the same functional reservation modal.
- **Detail pages:** venue name and context, current configured address, hours, map/menu/booking, descriptive chapter and links to other spaces. No empty galleries.

## Readiness switches for later photography

The existing media fields are unchanged, and the photograph-based templates remain in code. All switches below default to the string `"false"` in **both languages** in `public/content-defaults.json`:

`hero_photo_ready`, `story_photo_ready`, `booking_photo_ready`,
`venue_zyb_photo_ready`, `venue_pob_photo_ready`, `venue_east_photo_ready`,
`gallery_zyb_photo_ready`, `gallery_pob_photo_ready`, `gallery_east_photo_ready`.

Once photos are delivered, replace the media paths with actual approved NOVA images and change only corresponding flags to `"true"` in RU/EN. A venue's main photo can be enabled without its gallery. Gallery switches require BOTH genuine images. Admin UI exposure of these flags is not guaranteed; source configuration works until CMS controls are created. Without approval the original demonstration images remain unused.

## Hallmark application

Visual integrity and meaningful hierarchy outrank gimmicks. The site now has distinct typographic rhythms for cover, destination list, kitchen introduction, linear event schedule and reservation. No invented reviews, numbers, stock-photo façades, decorative arrows, hardcoded opening hours or added frontend dependencies. The pinned original Hallmark static audit runs on builds. Only the isolated lab Worker and branch may change; `main` and `nova-lounge-demo` must remain untouched.

## Acceptance

Run `npm run check:design-lab`, observe browser rendering at 320/390/430 and 1440px where available. Verify no demo images, no horizontal scroll, correct hero/dock boundary, clickable venue rows, RU/EN, location details, booking/menu modal, and honest demo event labels. 
