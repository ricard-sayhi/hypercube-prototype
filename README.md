# Hypercube prototype

A working prototype of hypercube.nl with the new interactive heroes. This is a design prototype and not the official site: every page is set to `noindex`.

**Live:** https://ricard-sayhi.github.io/hypercube-prototype/

## What's in it

- **Home (NL/EN):** the three-square navigation is replaced by a rotating 3D hypercube. Hovering a face, a corner or a page pill opens that page's face; clicking goes to the page.
- **Sport / Sports, Mobiliteit / Mobility, Over Hypercube / About Hypercube:** each page's title and hotspot image are replaced by a scroll-driven hero. Its order is title → image → text:
  1. The title fills the screen inside the page's square, then shrinks, spreads, joins and settles into the title row.
  2. The image rises in:
     - **Sport:** a field fusing football, basketball and hockey. Hovering a player passes the ball to them.
     - **Mobiliteit:** a transit network. Each train runs to its stop and is absorbed into it.
     - **Over Hypercube:** the hypercube draws itself from the centre outwards (trim path), then the section squares pop in.
  3. The menu under the image is the page's own tab navigation. The menu and the image markers are linked, and both open the original tabs.
  4. The first tab's text reveals in random 3–6 word groups, in reading order. The page won't scroll past the image until the text on screen has fully appeared.
- **NL / EN switch:** beside the Menu button on every page and at every width (the theme's own switch only showed above 1000 px). Each language links to the page's own translation; the two pages without one link to that language's home.
- **Sport discipline icons:** the twelve mixed PNG/JPG icons are replaced by one SVG family: 48 px grid, 3 px stroke with square ends and sharp corners, black with one element in Sport red.
- **Over Hypercube cube:** the old 8-frame logo GIF beside the text is replaced by the hero's cube drawing as a looping animated SVG (`src/hc/cube-loop.svg`, made by `tools/make_cube_loop.py`). It plays by itself and shows the finished cube when reduced motion is on.
- **Everything else:** the original site as mirrored, with the original header, menu and footer.

## Build

```bash
python3 -m pip install beautifulsoup4
```

```bash
python3 tools/build.py ../hypercube-site dist
```

- `../hypercube-site` is the local mirror of hypercube.nl. It isn't in this repo.
- `src/hc/` holds the hero reveal (`hero-reveal.css`, `hero-reveal.js`), the language switch styles (`lang.css`), the sport icons (`icons/`), the contact form helpers (`form.css`, `form.js`) and the 3D landing (`landing/`).
- `tools/build.py` copies the mirror and rebuilds the six main pages around their tab components. It also swaps the home hero for the 3D landing and makes every URL relative, so the site works from a sub-folder (GitHub Pages).

`dist/` is published on the `gh-pages` branch.

## Notes

- **Animation:** GSAP 3.12.5 (ScrollTrigger, CustomEase) and Three.js r170 load from public CDNs.
- **Contact form:** it doesn't send from the prototype: its Cloudflare Turnstile check only works on hypercube.nl, so the check is hidden here and Versturen, after checking the required fields, says so and offers the message as an e-mail to info@hypercube.nl. The e-mail field gets a dropdown of common addresses (anna@gmail.com, anna@hotmail.com, ...) that narrows as you type after the @ (`src/hc/form.css`, `form.js`).
