# NOVA · Design system lock

Status: **existing approved identity**. This is an experimental branch, not permission to replace NOVA with a template. Hallmark v2's quality gates are used as a *craft audit*, with intentional exceptions for the existing hospitality brand.

## Purpose and material

Three lounge café spaces in Minsk: Zybickaya (nightlife/DJs), Pobediteley (larger lounge/meetings), Vostok (family/restful). The main job is to help a visitor choose a place, view events or a menu, and initiate table reservation. Existing photos in the repo are demonstration images, not verified venue photographs. Never invent a review, award, follower count, opening hour or an event.

## Immutable identity

- Branding: NOVA and the original wordmark.
- Font: **Manrope**, already self-hosted in \`public/fonts/\`.
- Background: **white**, \`#FFFFFF\`; original ink \`#151813\`, primary olive \`#384929\`, deep olive \`#1F2D13\`.
- Dark olive primary buttons; secondary actions on white surfaces stay white with dark text and thin border.
- Light type and soft outlines on dark photo cards.
- Editorial photographic composition; quiet, modern, minimal, not a generic app dashboard or an ornamental luxury template.
- The main cover occupies the available first screen. On mobile the bottom venue rail aligns exactly with the top of the fixed booking dock; never reintroduce a gap.
- Below 601 CSS px all three venue cards are photographic overlays with the caption and action **inside** the picture, as in the existing Vostok card. Desktop keeps the approved asymmetrical compositions.
- Venue names on the main hero rail are NOT underlined. Avoid repeated decorative arrows and serial numbers.
- Maintain correct Cyrillic word spacing, prevent orphaned short prepositions in RU and preserve EN translations.
- Existing approved editorial label language such as "NOVA MINSK" and place-name uppercase is a *deliberate brand exception* to Hallmark's general no-tracked-labels rule. Do not delete labels just to satisfy a generic linter.

## Reusable craft decisions (Hallmark adaptation)

1. **One prominent action per surface**; bookable UI must look and behave clickable, with focus, active and hover states.
2. **Tokens, not random new swatches**. If another colour or font is needed, explain and record its role here before adding it.
3. Animate only transform/opacity when possible; no resizing photo containers during entry. Prefer short, purposeful transitions and respect reduced motion.
4. Preserve SEO/content without JS; no first-paint text flash. Never conceal a useful page behind a failed animation.
5. Contrast checks on *actual backgrounds* (especially the olive address panel and any light text over photographs).
6. On phones verify 320, 390, 430px; on desktop 768, 1024, 1440, 1920. No sideways scroll, caption clipping, or layout jump.
7. Focus visibility must work by keyboard, not only hover. Buttons have practical tap targets.
8. No fake screenshots, social proof, invented testimonials, or substituted logos.

## Wiring and safety

Preserve \`public/app.js\` SPA links, all routes, dynamic content keys, modal handlers, RU/EN support, existing demonstration photography, and venue IDs. No real booking, admin, or CMS writes through the lab Worker. Scope all visual changes to \`body[data-design-lab=true]\`. Run \`npm run check:design-lab\` and browser review. Do not change \`main\`, \`nova-lounge-demo\`, DNS, AVE, or production databases.

## External skill

Adapted in \`.agents/skills/nova-hallmark/SKILL.md\`; original source pinned in \`hallmark-source.json\`. It is a development review workflow, **not a frontend library** or a package that visitors download. For the complete upstream Hallmark toolchain, developers can separately opt in to the documented official install command; it is not run during production builds.

## CSS source files
The editable ordered NOVA style modules are in `styles/design-lab/`; the actual `public/design-lab.css` is compiled without runtime `@import` by `npm run css:design-lab`. See `docs/NOVA-CSS-CONSOLIDATION.md` for the cascade-order contract and visual baseline. Do not manually append one-off patches to the generated file.

## Hallmark art-direction iteration
2026-10-27: experimental NOVA home and inner pages get distinct, grounded venue labels, shorter editorial chapters and fewer purely decorative slogans. Keep first screen, 425px mobile venue photo cards, booking dock, colours and Manrope intact. See docs/NOVA-HALLMARK-ART-DIRECTION-20261027.md and checkpoint nova-design-lab-pre-art-direction-20261027.

## Useful venue details (2026-10-27)
The lab shows the existing CMS-configured address, opening hours and safe map URL below each venue photo, with booking and menu controls unchanged. No made-up opening hours; source keys `address_`, `hours_`, `map_`. Implementation: `styles/design-lab/08-venue-utility.css`. Refer to `docs/NOVA-VENUE-UTILITY-20261027.md`.

## Photo-light foundation — October 2026
The experimental NOVA site defaults to photography-free editorial design until venue images are approved. Dark olive full-screen cover, ruled destination selector, text-led kitchen and event schedule, compact booking CTA, and photography-free venue detail pages. All earlier photo templates are retained and gated by explicit `*_photo_ready` switches. The layout does not show synthetic restaurant imagery. See `docs/NOVA-PHOTO-LIGHT-FOUNDATION.md`.
