# NOVA · Hallmark v2 baseline audit

Date: 2026-10-27 · Branch: \`nova-design-lab\` · Source snapshot: \`d74989aa889a0f9b55f6113d12df78bf998dc305\`

Hallmark upstream: [Nutlope/hallmark](https://github.com/Nutlope/hallmark), v2.0.0, MIT, pinned \`6033bab2a8051b5454552d2e8e6cb8f27c483a42\`.

This is a **manual, source-informed Hallmark audit**, NOT a claim that all 57 official gates or the upstream sloplint rendered suite have been executed. It covers the actual editable experimental NOVA website rather than the unrelated concept presentation.

## What already works and must stay

- Self-hosted Manrope, white/olive/deep-olive visual identity, RU/EN, real route names, and three deliberately differentiated venues.
- Hero photograph with a restrained entrance; fixed mobile booking action; lower venue rail flush with the cover. Three mobile venue panels share an overlay-photo composition. Do not break these user-approved details.
- 0 literal \`transition: all\` and 0 \`100vw\` tokens in the two public stylesheets audited.
- Multiple \`:focus-visible\` selectors (34 in \`design-lab.css\`, 10 in \`site.css\`) and 14 reduced-motion blocks across the same pair of stylesheets.
- Demo venue images and events are labelled. No imaginary metrics or testimonials were added.

## Findings and actions

| Priority | Location | Hallmark craft signal | Action |
| --- | --- | --- | --- |
| P1 | \`public/design-lab-ui.js\` | A passive scroll listener still toggled header style on every scroll event | Coalesce work into one \`requestAnimationFrame\` update; same visual result, fewer style mutations |
| P1 | \`public/design-lab.css\` | Clip horizontal overflow without producing a scrolling ancestor that can disrupt sticky/fixed elements | Add \`overflow-x:clip\` to lab HTML/body. Check layout on mobile |
| P2 | editorial prose and headings | Avoid orphaned last words and unstable wrapping where the width changes | Use \`text-wrap:pretty\` on running paragraphs and \`balance\` on modest editorial headings only. Preserve NOVA logotype and the exact mobile photo overlays |
| P2 | focus state | Browser-default focus styles vary across linked photo cards; no site-wide fallback for new links | Add consistent keyboard-only focus ring to lab links/controls, with dark-surface override |
| P2 | \`public/design-lab.css\` (~98 KB) | Append-only CSS has accrued duplicate historical overrides and responsive declarations | **Not in this safe polish:** separate planned consolidation with visual before/after parity and rollback |
| P2 | homepage photos and gallery | Some images are demonstration content; claims about physical venues must not outpace verified assets | Keep existing editorial media notes, replace only on user-supplied venue originals |

## Intentional Hallmark exceptions

- NOVA uses a large photograph-first hero, mixed-case/uppercase place identifiers and subdued editorial labels. A generic ban on caps labels or more than one large photograph would clash with the established hospitality direction and user feedback.
- The site must keep its **white** background, Manrope, specific olive brand, full-height hero and exactly three spaces. Do not import an unrelated Hallmark theme.
- Existing mobile fixed booking dock is part of user-approved navigation, not an extra floating notification.
- A complete redesign has not been requested; this change is a **polish**, not a new composition.

## Source findings vs browser verification

The above source counts and targeted defects are verified against the GitHub branch snapshot. Browser rendering / computed-style QA after deployment should check 320, 390, 768, 1440 where service permits. The official Hallmark render checker depends on local Node/Chrome and is not silently executed in Cloudflare Builds.

## Rollback

\`nova-design-lab-pre-hallmark-20261027\` preserves the baseline. The main branch and existing demonstration Worker must remain untouched.
