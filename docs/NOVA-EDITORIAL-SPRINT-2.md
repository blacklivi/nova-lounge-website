# NOVA Design Lab — Editorial Sprint 2

Checkpoint: `nova-design-lab-sprint1-safe-20261026`, SHA `ecfa527219404c1f7710be7a54fecbb6a056075e`.
Branch to test: `nova-design-lab`.

## Delivered
- Editorial story / About: full-width typographic title, asymmetrical food photography and retained CMS title, description, caption, and existing menu modal.
- Homepage events: up to two upcoming posters with different photographic aspect ratios; dates, venues and original event links remain from the existing event renderer. Demo events retain visible disclaimers.
- Booking strip: typography-forward olive panel, original `data-modal=booking` button wraps the entire panel and opens the existing modal. The mobile sticky booking action is untouched.
- Full events page: coherent typographic hierarchy, editorial two-column poster grid on desktop, single-column stacking on mobile, and differentiated archive.

## Preserved
- `main` and `nova-lounge-demo` unchanged.
- Original routes /, /events and /spaces/... unchanged.
- All CMS keys (`story_kicker`, `story_title`, `story_description`, `story_image`, `media_note`, `booking_title`, `booking_image`) unchanged.
- English/Russian via existing `t` and `content` helpers.
- Demo Worker remains static read-only with no D1, R2 or secrets.
- `prefers-reduced-motion` override and one-shot `IntersectionObserver` reveal.

## Verified
- Build script `npm run check:design-lab` verifies source syntax and static invariants.
- Desktop screenshot after scroll shows both homepage sample-event images (lazy loading works) and correct staggered poster arrangement.
- Mobile screenshot after scroll shows real source image and typographic story with small-screen stacking.
- Booking mobile screenshot shows typography and text-style call to action.
- Screenshot of browser-rendered section alone can precede lazy loading; scroll first when doing QA.

## Remains to verify
- Browser automation 320/375/390/430/768/1024/1440/1920, RU/EN, real Safari, touch and focus.
- Interactive bookings and mobile drawer (must stay read-only in lab).
- Accessibility contrast in varied user photos.
- If a new design is rejected, restore `nova-design-lab` from checkpoint or revert sprint 2 commits; do not modify `main`.
