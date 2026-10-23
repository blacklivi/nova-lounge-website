# NOVA — snapshot after Work limit (2026-10-23)

This branch is a **safety backup**. It was created from `main` without changing `main` or the public `nova-lounge-demo` deployment.

## Source

Cloudflare Worker: `nova-visual-preview`
Version: `a5af7c8e-580a-4b4c-8c94-def1a4004259`
Public preview URL: https://nova-visual-preview.blacklivi-olx.workers.dev/

`preview-snapshot/public/` contains recovered textual static assets from the preview:
`index.html`, `events.html`, `app.js`, `core.js`, `site.css`, `content-defaults.json`.

The source Worker also carries standalone font files, a QA page, pre-change reference, and passthrough to the original site using a service binding; they are **not** duplicated here. Reconstructed snapshot is not a complete production-ready deploy. The live Cloudflare preview remains the complete viewable reference.

## Important safeguards

- Do not merge this branch blindly to main.
- The preview intentionally disables CMS writes and booking submission.
- The production app also has server code, D1, R2, Workers AI and secrets that must remain intact.
- Reintegrate redesigned HTML/CSS/JS with `src/index.js`, verify RU/EN, administration, media upload, events, and mobile browsers.
- Before merge, perform and document visual checks at 320, 375, 390, 430, 768, 1024, 1440, 1920, 2560 px.
- Protect main until the user approves the new design.

## Why this backup exists

A ChatGPT Work run finished implementing most of NOVA's visual changes, but exhausted Work credits before finishing media transfer, all browser-width checks, and GitHub commit. This branch stores the recovered preview source so that later work can resume without rebuilding the design from scratch.
