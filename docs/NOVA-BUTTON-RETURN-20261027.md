# NOVA – button refinement per mobile review (2026-10-27)

Applied to `nova-design-lab` only.

- Restore the original olive `#384929` for the fixed booking button, with light text and subtle shadow. Original dark button from the supplied before/after screenshots; no pastel sage fill.
- Keep every other control **on light backgrounds** unfilled visually: white `#FFFFFF` surface, dark type, subtle border and darkened border on hover. Covers venue cards (except dark photo card), story menu, events link, contacts and secondary modal buttons.
- The hero rail's three venue names are plain text without any underlining at rest or on hover/focus; each entire cell remains one link with visual feedback from the rail.
- Leave matte-sage primary buttons inside deep-olive sections, because those are not white-background controls.
- Previous deploy retained in `nova-design-lab-prebutton-return-20261027`. Do not modify `main` or `nova-lounge-demo`.

Check the mobile CTA on 320/390/430 CSS pixel widths and that its height stays unchanged (hero bottom = dock top).