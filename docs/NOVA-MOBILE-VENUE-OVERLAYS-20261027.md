# NOVA – mobile venue card parity

Changed **only** in `nova-design-lab`. Revert to `nova-design-lab-pre-venue-overlays-20261027` to restore the previous design.

- At max-width 600 CSS pixels, Zybitskaya and Pobediteley use the existing Vostok pattern: a 425px photo card, fully filled cover image, with location kicker, name, description, and visible CTA on the photograph.
- Use a bottom-only gradient for legibility without an opaque text panel. Whole cards remain links (unchanged `app.js`, CMS bindings and RU/EN).
- Choose an appropriate size for the longer Pobediteley title. The design is responsive and does not overflow at 320px.
- Both labels keep inverse white text and transparent bordered CTA, consistent with the dark-photo Vostok card.
- Desktop (width >= 601px) and Vostok rules unchanged.
- Confirm after build on mobile 320 / 390 / 430 and desk 1440: same-height photographs, captions inside images, buttons are accessible, no horizontal overflow, booking dock untouched.
