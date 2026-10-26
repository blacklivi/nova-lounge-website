# NOVA Design Lab / Compact editorial density

2026-10-26 · In experimental branch only.

## Issue
Editorial Nightlife sprint 1–3 enlarged sections and photographed panels to 700–1000px on typical laptop viewports. The page felt like several full-screen posters and required too much scrolling before a guest could choose a venue.

## Solution
One reversible, additive and LAB-ONLY compact editorial block at the end of `public/design-lab.css`. Keep the existing typography, asymmetry, original images and venue structure. Shorten chapter spacing, picture height and excessive display scale. No template restructuring, APIs, booking, routing, CMS, DNS or main-branch edits.

### Intentional proportions
- Desktop hero approximately 78svh (min 520, max 760) instead of the original very tall first screen.
- Desktop venue imagery about 35vw (bounded 350–555) instead of 48vw/795.
- Main-page chapter padding generally ~60–110 rather than ~100–200.
- East full-width venue photo 430–590 instead of 640+.
- Booking strip 410–625 instead of 560–860.
- Mobile hero about 68svh bounded 460–640; sticky booking CTA remains untouched.
- Mobile venue photographs change from portrait 4:5 to editorial near-square 1.13:1.
- Mobile story and event photos near-square for faster reading.
- Venue detail hero photos 340–540 on mobile; gallery images near-square.
- Mobile interactive tap targets preserved; no font below previous paragraph sizes.

## Safety
Checkpoint prior to this density change: `nova-design-lab-precompact-20261026`.
Run `npm run check:design-lab`, check desktop/mobile hero crop, horizontal scroll, RU/EN, focus, reduced motion, active booking navigation.
Reverting this single density commit, or resetting lab branch to the checkpoint, restores prior sizes.
