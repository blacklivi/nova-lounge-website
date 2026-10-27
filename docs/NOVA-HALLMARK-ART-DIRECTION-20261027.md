# NOVA – Hallmark art-direction experiment

Branch: nova-design-lab. Checkpoint: nova-design-lab-pre-art-direction-20261027. Date: 2026-10-27.

Direction: improve the actual experience of finding one of three venues, rather than performing another generic template makeover. Maintain established white, olive, Manrope identity; preserve full-size cover, responsive photo overlays, booking dock, all working modals, archive and RU/EN.

Changes:
- Replace redundant NOVA MINSK label on all three venue cards with differentiated useful context: evenings/music, meetings/company, food/quiet.
- Make the default venue subtitles concrete and useful. No existing live CMS is modified.
- Give each venue detail page its own editorial chapter heading instead of repeating the same generic phrase. Remove unnecessary NOVA/LOCATION and NOVA MINSK index marks.
- Remove pseudo-publication labels NOVA JOURNAL, NOVA EVENTS, and unnecessary NOVA RESERVATIONS sign-off.
- Separate chapter purposes: kitchen story uses a photographic spread with restrained title; events prioritize an actual programme; booking becomes shorter with one action. Keep editable CMS copy and honest demo-event labels.
- Reduce excessive top/bottom padding on interior pages, without touching the hero/dock fit or the 425px mobile photo cards.

Files: public/app.js, public/content-defaults.json, styles/design-lab/07-art-direction.css, generated public/design-lab.css, CSS assembler and regression tests. Roll back through the checkpoint branch. No main or production Worker changes.

Manual acceptance: iPhone widths 320/390/430, desktop 1440; no horizontal scroll, visible card labels and actions inside all three images, no header/booking overlap; three different detail headings in RU and EN, retained menu/reservation/contacts handlers.
## Desktop story composition refinement
The kitchen section no longer repeats the events page's full-width title-above-image macrostructure. At 1001px and wider, heading and description form a left editorial column and the photograph spans the right column. The block height is driven by the photograph rather than an oversized title plus image stacked. Between 601 and 1000px a straightforward header/photo-copy layout is retained, while mobile keeps the previously approved title-photo-copy reading order.
