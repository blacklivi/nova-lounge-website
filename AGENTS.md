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
- The design concept is standalone static `public/concept.html`, `public/concept.css`, `public/concept.js`. It must not make authenticated or CMS writes; no live booking or client data.
- Demo event titles are fictional and must be labelled accordingly.
- Do not expose the site's repository, admin, deployment status or demo URL in client-facing materials.
- A Git branch is not a separate deployment. Before sharing a preview URL, verify it is branch-scoped and cannot update the demo Worker or write to production data.
- Run `npm run check`, concept static checks and mobile / reduced-motion visual QA before release.

## Motion
- Default curve: cubic-bezier(.22,1,.36,1).
- Animate `transform` / `opacity` for section transitions; image containers must retain size before animation starts.
- No unnecessary auto-play loops or delayed image expansion. Real UI functionality must not depend on animation.
- Respect `prefers-reduced-motion: reduce`.
- Keep the desktop typography and mobile composition stable during page load.

## Delivery
- Audit first, approve major composition changes, then implement in reviewable commits.
- Client-facing concept is not the actual functioning website. Keep this distinction explicit in internal docs, but do not present implementation status to the client.
