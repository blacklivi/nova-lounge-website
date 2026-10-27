# NOVA — Sitewide contrast and clickable controls
2026-10-27. Branch `nova-design-lab`, with rollback checkpoint `nova-design-lab-pre-contrast-buttons-20261027`.

## Found by real browser computed styles
The address text on the deep olive venue bar inherited `rgb(61,64,58)` from base typography; background was near `#1F2D13`. Primary and secondary menu/booking actions were 44px high and transparent with only underlines.
Editorial story/menu/contacts and event-index links repeated the same visually weak pattern. Mobile sticky CTA was a flat rectangle; venue-card CTA labels were effectively plain text.

## Implemented
- Venue addresses in warm legible `#E8EEE2`; small address label `#D0DBC8`.
- Dark venue primary button: matte sage `#DFE8D7` / dark type `#20301A`; secondary: subtle tint with clear light border and text.
- Shared 48–56px action hit targets and 7px radius, no pills and no unnecessary arrows. Quiet, differentiated focus and pressed states.
- Other page controls: muted `#EEF2EA` background and dark typography; dark Vostok photo card receives the inverse sage-tinted treatment.
- Header/home CTA, mobile fixed reservation button, drawer, booking-modal buttons and whole booking-feature CTA brought into the same system.
- Footer address readability, small icons (44px), hover and keyboard focus.
- Motion-reduced users get no transforms/transitions.

All changes are appended to `public/design-lab.css`; original `site.css`, CMS, routes and functionality unchanged. Check actual computed styles at 320/390/768/1440, modal booking, RU/EN and the three /spaces/ paths before approving.
