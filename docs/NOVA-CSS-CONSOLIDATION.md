# NOVA Design Lab — CSS source-of-truth

Created: 2026-10-27. Branch \`nova-design-lab\`.

## Problem

The experimental CSS had grown to **100,156 bytes / 2,421 lines** after successive design passes. The last rule often overrides earlier rules for the same selector, which makes it easy to accidentally resurrect deleted arrows or pastel buttons. The browser should not load 6 new blocking stylesheets and then reflow.

## Stable, compiled single-file approach

**Edit** CSS in \`styles/design-lab/\` in cascade order:

1. \`01-foundation-and-spaces.css\` — basic experience, original photo/venue hierarchy
2. \`02-story-events-booking.css\` — magazine home chapters, events, booking
3. \`03-venue-details-and-density.css\` — venue subpages and compact sizing
4. \`04-cover-motion-and-typography.css\` — cover height, reveal, title and Cyrillic tracking
5. \`05-interactions-and-mobile.css\` — contrasts, actions, booking dock, three mobile photo overlays
6. \`06-hallmark-accessibility.css\` — Hallmark-inspired small craft refinements

**Build** one normal static CSS file (not multiple runtime imports):
\`npm run css:design-lab\`.

**Check** it with \`npm run css:design-lab:check\`; this runs at the start of \`npm run check:design-lab\` and fails Cloudflare Builds if the generated file does not match the source modules.

The CSS assembler validates balanced braces, quotes and comments in each module; refuses CSS \`@import\` and checks key functional blocks are still present.

## Baseline and visual safety

This initial consolidation is intentionally **byte-for-byte identical** to the pre-consolidation \`public/design-lab.css\`. The browser receives the same CSS, with no difference in class names, specificity, media queries, stylesheet order, downloads, page composition or functionality. The source is now in small inspectable modules rather than one append-only file.

**Do not edit \`public/design-lab.css\` directly.** Update the appropriate module, run the assembler, and commit both the source and generated CSS. For changes involving multiple modules, preserve cascade order and visually test before removing older rules. Do not aggressively auto-remove duplicate property names: \`height:100vh;height:100svh\` is an intentional old-browser fallback, and responsive overrides may be deliberately stronger.

## Functional regression contract

- At 390×844 the hero, venue rail and booking dock share one boundary (cover ~771 px, dock 73 px in the baseline browser). No blank photo tail.
- Exactly 3 mobile photo-overlay venue cards with captions/buttons within their own photos at <=600px.
- Fixed booking button stays dark olive (\`#384929\`); white-background secondary controls remain white, and the hero venue names have no underlines.
- Desktop 1440-wide cards remain asymmetrical.
- RU/EN, all links, modals, dates, events and no database writes unaffected.
- Accessibility: reduced motion, visible focus, content not masked by scripts.

## Browser testing note

Cloudflare Browser Rendering returned HTTP 429 during this source-only migration. The first publication must therefore keep exact CSS bytes. Expanded browser visual QA should be done when the service allows; future substantive pruning should run side-by-side render comparisons before release.

## Rollback

The unmodified snapshot is at \`nova-design-lab-pre-css-consolidation-20261027\`. Neither \`main\` nor \`nova-lounge-demo\` may be changed.
