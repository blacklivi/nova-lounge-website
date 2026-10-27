---
name: nova-hallmark
description: Apply the Hallmark anti-template design audit and polish to the existing NOVA experimental website, respecting design.md and keeping routes and booking wiring unchanged.
---

# NOVA Hallmark · project adapter

Source: [Nutlope/hallmark](https://github.com/Nutlope/hallmark), release 2.0.0, commit \`6033bab2a8051b5454552d2e8e6cb8f27c483a42\` (MIT license). Source manifest: \`hallmark-source.json\`. This is a **project-specific adaptation** of Hallmark's audits, not the entire upstream skill installation and not its 57-gate certified run.

## When to use

User asks for Hallmark, a NOVA design audit, an improvement, or a redesign. Use existing NOVA code and real screenshots as the material. Read \`design.md\`, \`AGENTS.md\`, then \`docs/HALLMARK-NOVA-AUDIT.md\`.

The Hallmark upstream contracts are in \`skills/hallmark/SKILL.md\`, \`skills/hallmark/references/redesign.md\`, \`skills/hallmark/references/gates.md\` and \`skills/hallmark/references/craft.md\` at the pinned GitHub commit. Read the official files when doing a full Hallmark run. Its Node linter is *not vendored* here, and the included NOVA check is only a limited, local regression check.

## NOVA workflow

1. Audit the original website routes \`/\`, \`/events\`, \`/spaces/zybitskaya\`, \`/spaces/pobediteley\`, \`/spaces/vostok\` in the isolated lab Worker. Collect mobile and desktop computed sizes, text contrast, focus states and screenshot evidence.
2. Classify every finding: broken usability, design mismatch, or mere Hallmark-default styling preference. Preserve deliberate NOVA brand exceptions.
3. For a polish, change the smallest verified cause and avoid restructuring full sections. For a full redesign, require an explicit user request and safeguard all routes/content keys/actions.
4. Use the Hallmark quality ideas: meaningful one-action hierarchy, no invented claims, no layout animation, readable contrast, keyboard focus, reduced-motion, responsive text/image balance, honest media.
5. Run \`npm run check:design-lab\` and actual browser checks, then document before/after. Never claim to have run Hallmark's upstream \`sloplint --render\` unless it actually ran.
6. Keep \`main\` unchanged, use \`nova-design-lab\`, and retain a rollback ref.

## Optional official local install

For an AI code editor needing the *full* upstream skill and references, a developer may run \`npx skills add nutlope/hallmark --agent codex\` inside their own trusted workspace. This is opt-in and must not be added as a Cloudflare build step or executed automatically. Check the upstream source before updating the pin.
