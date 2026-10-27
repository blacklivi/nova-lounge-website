# NOVA / Design Lab — agent rules

Scope: branch `nova-design-lab` in `blacklivi/nova-lounge-website`.

## Source of truth
- This is an existing, client-approved editorial hospitality design, not a SaaS landing page.
- Keep Manrope, white #FFFFFF, ink #151813, olive #384929, deep green #1F2D13, generous whitespace and editorial photography.
- Three equally weighted space cards are intentional: NOVA has three venues. Do not replace them merely because a generic design rule discourages three columns.
- Do not apply generic CTA/FAQ/proof/social-proof/gradient/floating-navigation requirements without a demonstrated NOVA-specific reason.
- Respect all previously fixed desktop and mobile layouts. Avoid crop/layout flashes during entrance animations.
- Site text is Russian/English; maintain both variants where appropriate.

## Imported design guidance, curated (not executed as external code)
References:
- https://github.com/elayadesign/ai-design-skills/tree/main/skills/landing-page-design
- https://github.com/elayadesign/ai-design-skills/tree/main/skills/design-to-motion
- https://github.com/elayadesign/redesign-skill/tree/main/skills/redesign-existing-projects

Use their ideas for a structured design audit, realistic copy, optical alignment, meaningful hover/focus/empty/error states, transforms/opacity-driven animation, IntersectionObserver one-time reveal and reduced-motion accessibility. Adapt values to NOVA brand tokens. Do not blindly import the authors' hardcoded fonts, gradients, spacing, card layout or navigation treatment.

## Strict isolation
- Never modify main, production or the existing Cloudflare Worker `nova-lounge-demo` as part of this branch.
- Never change AVE resources, NOVA production D1/R2, secrets, DNS or domain settings.
- The **original NOVA site** is the primary surface for improvement. Root `/`, `/spaces/*` and `/events` serve the original `public/index.html` and `public/events.html` through a completely isolated read-only `src/design-lab.js` Worker. `public/concept.html` is a secondary archived presentation, not the primary project. No authenticated or CMS writes, real booking, or client data.
- Demo event titles are fictional and must be labelled accordingly.
- Do not expose the site's repository, admin, deployment status or demo URL in client-facing materials.
- A Git branch is not a separate deployment. Before sharing a preview URL, verify it is branch-scoped and cannot update the demo Worker or write to production data.
- Run `npm run check:design-lab` plus mobile / desktop / reduced-motion visual QA before release. Keep the Worker restricted to static assets, read-only content/events responses and public website routes.

## Motion
- Default curve: cubic-bezier(.22,1,.36,1).
- Animate `transform` / `opacity` for section transitions; image containers must retain size before animation starts.
- No unnecessary auto-play loops or delayed image expansion. Real UI functionality must not depend on animation.
- Respect `prefers-reduced-motion: reduce`.
- Keep the desktop typography and mobile composition stable during page load.

## Delivery
- Audit first, approve major composition changes, then implement in reviewable commits.
- Original website visuals and page structure must be improved, not replaced with a new presentation site. When creating client-facing outputs, omit deployment implementation details and clearly distinguish fictional sample events and nonfunctional booking. No merge to `main` without separate approval.

## Hallmark v2 · source-linked quality workflow
- Project design lock: `design.md`; pinned original source and licence: `hallmark-source.json`.
- Project-specific audit/polish adapter: `.agents/skills/nova-hallmark/SKILL.md`; baseline findings: `docs/HALLMARK-NOVA-AUDIT.md`.
- Hallmark is an **agent design skill**, not runtime UI code. Do not install npm skill runners as a production or Cloudflare dependency. Read the pinned upstream originals for a full official Hallmark run.
- First Hallmark-inspired safe polish: responsive text wrapping, focus visibility, clipping rather than hiding overflow, throttled sticky-header update. See audit. Never replace the approved olive/white brand or the three mobile photo overlays with generic Hallmark theme presets.

## CSS authoring (after 2026-10-27 consolidation)
- Source of truth: `styles/design-lab/01-*.css` through `09-*.css`, in order. See `docs/NOVA-CSS-CONSOLIDATION.md`.
- `public/design-lab.css` is generated for a **single browser request**, not directly edited. Run `npm run css:design-lab` and commit the generated file after edits.
- `npm run check:design-lab` begins with the `--check` parity gate; do not delete it to bypass a stale compiled file.
- Consolidation first preserves exact browser CSS bytes; only remove old overlapping declarations with layout/render regression evidence. Keep the backup branch `nova-design-lab-pre-css-consolidation-20261027`.

- Hallmark's *actual* pinned static `sloplint` is now vendored under `tools/hallmark/` and invoked with `npm run audit:hallmark` in the lab's build. It reports findings without enforcing sitewide generic restyles. For evidence, counts and design critique: `docs/HALLMARK-AUDIT-EXECUTED-20261027.md`. No official `--render` or subagent review has been claimed.

- Photo-light mode is now the experiment default. All photos require a separately approved media value and corresponding `*_photo_ready` flag. Never show sample venue photos as if authentic. Preserve original gallery and hero layout when flags become true. See `docs/NOVA-PHOTO-LIGHT-FOUNDATION.md`.
