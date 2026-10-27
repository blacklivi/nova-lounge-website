# NOVA — Official Hallmark v2.0.0 audit and design direction

**Performed 2026-10-27** on branch `nova-design-lab`, using the **unmodified upstream** `Nutlope/hallmark` / `skills/hallmark/scripts/sloplint.mjs` from commit `6033bab2a8051b5454552d2e8e6cb8f27c483a42` (MIT). Executed by `npm run audit:hallmark` during the Cloudflare Builds run for commit `3afe16f3e6f256c20f53a770ceddf1f23ae3ee7c`. Worker build completed successfully; no production or main branch changes.

## Honest scope

- **Actual upstream static audit executed**, on `public/index.html`, `public/site.css`, and `public/design-lab.css`.
- No upstream `sloplint --render` tier or fresh-context subagent judge run: the Cloudflare build has no authenticated local Chrome harness. **Do not call this a complete Hallmark certification or full 57-gate rendered pass.**
- The homepage and internal routes are produced primarily in `public/app.js` at runtime, so static HTML analysis alone does not see all actual components.
- Independent browser check via Cloudflare Browser Rendering at 390×844 confirmed no horizontal overflow; 771px hero ends at the 73px booking dock; three 425px photo-overlay venue cards with actions inside them; 52px dark-olive booking button. This is a manual browser sanity check, not the upstream render-tier score.

## Actual static results

| Grade | Individual hits |
|---|---:|
| **FAIL** | **305** |
| **REFLEX** | **317** |
| **WARN** | **17** |

These are **individual CSS/markup rule hits, not 639 unique user-facing defects**.

Breakdown:

| Hallmark gate | Grade | Count | Interpretation |
|---|---|---:|---|
| 48 — colour tokens | FAIL | 208 | Historical literal colours in the ~100 KB layered stylesheet. Rational long-term token cleanup, not 208 bad colours |
| 7a — pure white | FAIL | 64 | Conflicts with NOVA's **explicit white background and white secondary controls**; DO NOT replace the approved brand with cream |
| 67 — tracked uppercase labels | FAIL | 21 | Overuse can feel templated; some captions are intentional brand treatment. Review case-by-case, not wholesale removal |
| 24b — 4px spacing scale | REFLEX | 316 | Optical spacing and overlapping historical CSS contribute. Avoid blind mechanical normalization |
| 6a — vh hero | FAIL | 1 | An old 100vh fallback precedes 100svh; rendered mobile layout currently works |
| 10a — top animation | FAIL | 1 | Hamburger icon transitions `top` — change to a stable centre with transform-only motion |
| 15 — focus ring animation | FAIL | 1 | Mobile CTA shadow transition can make keyboard ring response delayed — narrow transition |
| 39a — control state | FAIL | 3 | Border-based focus and opacity-only disabled calendar buttons. Existing outline exists for fields, so scanner is partially conservative; improve disabled states |
| 34 — hidden overflow | FAIL | 1 | Inside a cropped photo card; clipping is deliberate, and document has `overflow-x:clip` |
| 19, 20, 62 | FAIL | 1+1+3 | Source punctuation / Hallmark stamp / JS-driven reveal warnings. Reported, but several are stylistic or static-parser findings; visibility without JS needs a separate browser check |
| 7b | REFLEX | 1 | Static colour/style convention |
| 11, 25, 29, 40, 41, F15, F24 | WARN | 17 | Advisory items; should be judged against the rendered interface, not counted as confirmed errors |

Note: audit counts reflect pre-fix commit `3afe16f3`. Do not compare those numbers to later automated logs as though they were from the same source revision.

## Visual critique: what actually makes NOVA feel AI-generated

### P1 — Photographic credibility
The current image set includes **demonstration images**, some indistinct and without proof of the specific real venues. This is the biggest remaining authenticity problem. Replace each location's header/card/venue-gallery images with its **own verified venue photography**. A polished animation cannot compensate for a generic, reused hospitality photograph. Keep source truth and photo authorship.

### P1 — Repetitive editorial metadata
The same pattern repeats: tiny tracked introductory label, very large headline, photo, generic CTA. It is useful in a few chapters, but repeated on every screen makes the design predictable. Keep a strong first-screen lockup, remove redundant labels when the next heading already names the section, and vary the editorial **function** (practical visitor info versus photograph versus events) rather than only making alternating picture grids.

### P1 — Venue identity and choice
Zybickaya is party/DJ-focused, Pobediteley is a meeting-oriented larger space, Vostok is more family-oriented. These distinctions should be observable immediately through real place photographs and **specific helpful information**, not just vague phrases like "своя атмосфера". Preserve three venues, full-photo mobile cards (requested), and clear links, but improve differentiated copy and material.

### P2 — Booking action hierarchy
A reservation should remain visible, readable, and consistent, but not appear as five competing primary actions in the same view. Current user-approved dark-olive mobile dock is the canonical mobile booking action; desktop can offer one contextual CTA. Keep secondary white-button styling. Review double booking links on the same screen rather than decorating more buttons.

### P2 — Motion restraint
Keep the one-shot NOVA word reveal and photo-first visual; avoid animating text width, layout dimensions or every paragraph. The header/menu should animate only transforms and opacity with reduced-motion fallback. Visual delight is from editorial timing, not universal entrance effects.

### P2 — Content honesty
The existing demo caveats are better than invented claims, but should not dominate a client-ready impression. Event placeholders and copy must be clearly preview-only, not presented as actual forthcoming events, and real dates must come from CMS. No fake testimonials, ratings or metrics.

## Applied safe technical polish

- Burger menu transform animation now keeps the same initial visual arrangement but never animates its `top` position.
- Disabled calendar navigation and disabled dates now have visibly different **fill + ink + cursor**, not just faded opacity.
- Mobile booking focus state no longer transitions box-shadow, so the keyboard outline appears immediately.
- No changes to markup/content, route wiring, image filenames, hero heights, fixed dock position, or brand palette.

## Redesign architecture for next design iteration

1. **Do not import a random Hallmark theme.** NOVA has an established visual identity and a specific reservation/navigation job. Keep the `design.md` lock.
2. **Reduce repetition, not just pixels.** Place-specific photography and differentiated content before swapping card shapes.
3. **Audit each actual page at desktop/tablet/mobile**, including the real booking modal, event page and three detail pages; static sloplint cannot do this alone.
4. **Validate preserved functionality** (RU/EN, venue links, menu modals, reservation form, event archive) and document before/after. No speculative data edits.
5. For a **full Hallmark redesign**, use the explicit redesign workflow and its `--before` and `--kept` preservation tests; the current work is an audit + technical polish, not a redesigned site.

## Rollback & safety
Restore branch `nova-design-lab-pre-official-hallmark-audit-20261027` to return before the original linter was added. Main is unchanged and the lab Worker only has an `ASSETS` binding.
