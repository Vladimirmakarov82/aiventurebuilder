# Orbiq site: review after every update

Run after any change to orbiqgroup.com, before deploy. Three agents in parallel, then fix, rebuild, repeat until no blocking issues.

Sources: build.py (all copy RU/EN, stories, POOL), body.html (markup), extra.css + base.css (styles), form.js / pool.js / chatfilm.js.
Build: `python3 build.py`. Local server: `cd site && python3 -m http.server 8811`. Screenshots: `python3 shotfull.py` → shots/full-{ru,en}-{d,m}.png.

## Audience and concept
- Reader: wife of a wealthy man (also the man himself), Russian-speaking, lives between countries. Values: speed, quality, confidentiality, uniqueness. Reads on a phone.
- Goal of the site: after reading she wants to become a client and leaves a task or contact.
- Mechanism: stories. Each story: what she asked → what we noticed that she did not know → what we did through the right people → the moment she remembers.
- Everything must evoke exclusivity and emotion. Banned: yachts as fantasy, weddings on Amalfi, moving household goods, cheap "luxury" clichés, "AI-first" as a selling point (internal only).
- No aggressive sales: no "Describe a task" button in the first screen, no pressure, no sticky banners.

## Copy rules (RU and EN)
- Russian as people speak it today. No archaic or bookish words (модистка, сие, ибо), no canцелярит (является, данный, осуществлять).
- Headlines concrete: a name, a place, a brand, an image. Banned empty headlines: «Так это выглядит», «Наши услуги», «Почему мы», «Все, что нужно».
- No «не X, а Y», «не просто», «не только... но и», no rhetorical questions, no «честно», no triads.
- No letter ё. No addressing the reader («вы», «ваш»). Affirmative phrasing.
- Facts only from sources: event rules, places, names must be true. Stories are labeled as scenarios.
- EN mirrors RU in meaning, natural English.
- selling-copy-ru rules apply; target tekst-check ≥ 8/10.

## Design rules
- Calm, premium, 2026 style. No aggression: no heavy black blocks shouting, no loud orange everywhere.
- Images: no two similar images side by side (two horses, two lakes). Each image matches its story. No brand logos that contradict the story.
- Mobile first: short page, horizontal scrollers for cards, nothing cut off, tap targets ≥ 44px.
- No Lora Italic or handwritten fonts.
- Check: overflow, broken layout, empty blocks, z-index overlaps, console errors, images loaded, RU and EN both.

## What each agent returns
- Blocking issues (must fix) with exact file and exact replacement.
- What got better / worse vs previous version.
- Score 1–10 per area: concept, copy, design, mobile.
