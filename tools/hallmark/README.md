# Hallmark upstream linter

This directory contains the unmodified Nutlope/Hallmark v2.0.0 static `sloplint.mjs` at commit `6033bab2a8051b5454552d2e8e6cb8f27c483a42` with its MIT license. Run `npm run audit:hallmark` to execute it. It is an audit, **not** a Hallmark certification, and does **not** run the `--render` browser checks. The instrument is kept out of `public/` so it never reaches visitors. The audit deliberately does not fail the lab build merely for pre-existing branded Hallmark findings; internal linter execution errors do fail.
