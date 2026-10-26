# NOVA Design Lab — first audit, 2026-10-26

## Scope and source
Reviewed current `main` at commit `90fea6e6d90cb7018417dbdcb28be39e70dd788e`, including site CSS, main app, booking calendar, presentation content defaults and existing UI QA docs. Referenced Elaya's `landing-page-design`, `design-to-motion` and `redesign-existing-projects` skills.

This is **static source review** plus an isolated client concept. It is **not** a completed cross-browser visual QA or a production deployment.

## Preserve
1. Three-venue information architecture: Zybitskaya, Pobediteley, Vostok.
2. Manrope typeface, white/olive/deep-green palette, restrained no-radius editorial components.
3. The three venue cards, full-bleed photography, booking strip, bilingual navigation.
4. Already-fixed mobile image width and lettering entrance, click-to-scroll and arrow behaviour.
5. CMS and events D1/R2 separation, private admin, demo-mode booking safeguards.

## Findings — targeted work, not blanket redesign

| Priority | Area | Evidence and recommended response |
|---|---|---|
| P0 | Safety / environment | Site is configured in `wrangler.jsonc` to deploy to `nova-lounge-demo`. A branch alone does not isolate Worker, DB, assets or public URL. Never run the default `wrangler deploy` from this branch until a new Worker configuration is explicitly selected and isolated. |
| P1 | Presentation | Existing homepage is functioning navigation, unsuitable as a client "concept-only" preview. Add a separate static concept with real NOVA brand language, staged screens, fictional clearly labelled event artwork and no live actions. Implemented at `public/concept.html`. |
| P1 | Motion | Current app has 180–320ms hover/route/modal transitions; a uniform global 500ms is not suitable. Add section reveals only to the separate presentation first; do not break the smooth, bounded in-page scroll system already implemented in `app.js`. |
| P1 | Mobile | Mobile hero picture is already full-bleed; entrance must never begin with a narrow image. Use stable dimensions and transforms, never animate width / image crop. |
| P1 | Images | Default editorial photos are currently described as concept/demo content. Reuse real NOVA asset files from `public/media`; do not imply that staged photos or event posters are verified photographs of actual events. |
| P2 | Scroll efficiency | Main app uses a passive scroll listener for updateTop, and RAF for assisted navigation. Consider coalescing back-to-top updates into one RAF frame only after mobile regression testing. Do not remove assisted navigation blindly. |
| P2 | Booking / accessibility | Desktop custom date select hides the native input and switches `required` off; verify custom validation, keyboard path and min date with a real browser before any styling changes. Preserve native mobile pickers. |
| P2 | Publication | Audit privacy links, 404 behaviour, canonical/OG meta, event empty/loading semantics and all 11 required viewport widths, in RU and EN, before public release. Existing `docs/UI-QA-2026-10-24.md` explicitly records remaining tests. |
| P3 | Design consistency | One source `site.css` has brand token definitions; `editorial.css` uses an alternate ivory/Helvetica visual direction. Check whether that stylesheet is actively referenced before modifying or removing it. |

## Skills compatibility
- Adopt: content realism, semantic markup, consistent type, focus/hover/active states, one-shot IntersectionObserver section reveal, reduced-motion support, motion showcase exports.
- Reject as mandatory: universal sales funnel, FAQ/trial/guarantee, gradient heading, black-only dark palettes, floating glass nav, removal of all equal columns, generic rules to round all controls.
- Keep animations lightweight and reversible.

## Deliverable created in this commit
`/concept.html`: static editorial **design preview** with intentionally non-functional UI mockups, keyboard navigation, standalone concept CSS and one-shot motion. No database, backend, booking or CMS calls.

## Remaining before sharing a live link
1. Confirm separate Cloudflare branch preview and database isolation, or create a dedicated Worker `nova-design-lab` with its own D1/R2.
2. Verify preview URL resolves directly to this branch's `/concept.html`, not the live demo site.
3. Run desktop and mobile screenshots (320 / 390 / 768 / 1440), inspect actual source image crops, keyboard focus, reduced-motion setting.
4. If presenting a motion video, record from this isolated concept rather than from the functioning website.
5. Preserve original site and do not merge without independent review.
