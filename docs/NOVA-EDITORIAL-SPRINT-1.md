# NOVA — Editorial redesign, sprint 1
Date: 2026-10-26

## Restoration point
`nova-design-lab-checkpoint-20261026` points to `580c3497a70d670b5ed541a94d0ed44bdc27600d`.
No code was changed in `main` or the independent `nova-lounge-demo` Worker.

## Changes implemented in experiment
- Home header uses deep olive for stronger brand cohesion; all other page headers keep their existing style.
- Home hero now has full-bleed original NOVA image with steady dimensions at first paint, large white NOVA wordmark, understated booking action and three real venue route links.
- Three equal-width venue cards replaced by asymmetrical editorial spreads. Zybitskaya: image left, text right. Pobediteley: reversed. Vostok: atmospheric full-width photograph with overlaid typography.
- Mobile is a dedicated single-column composition, with images kept full width, stacked route navigation and preserved sticky booking CTA.
- Original dynamic CMS keys, links and route handlers are preserved; no schema migrations or production API calls were introduced.
- Existing events, story, booking and detail routes remain in place for later dedicated audit.

## Visual reference
See `docs/NOVA-ART-DIRECTION-2026.md` for the rationale and the proposed future direction.

## QA / risk
- Automated `npm run check:design-lab` runs a syntax check and verifies read-only isolation.
- Cloudflare Workers Builds reported a successful deployment of first editorial update.
- Screenshots at 320/390/768/1440/1920, keyboard focus, modal booking, RU/EN and Safari are still required before design approval.
- The live data-free lab returns empty content and events so bundled content/defaults are rendered. It does not send real booking requests.
- If this design is rejected, restore only the experimental branch from `nova-design-lab-checkpoint-20261026` or revert the editorial commits. Do not rewrite `main`.
