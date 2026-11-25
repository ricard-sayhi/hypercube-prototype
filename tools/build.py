"""Build the Hypercube prototype site.

Input : the local mirror of hypercube.nl (../hypercube-site) + src/hc (hero reveal, 3D landing).
Output: dist/  a static site that works from any sub-folder (e.g. GitHub Pages project sites).

  - Sport, Mobiliteit, Over Hypercube (NL) and Sports, Mobility, About Hypercube (EN): the original page title and
    hotspot image are replaced by the hero reveal; the page's own tab component moves under it (its tabs stay the
    navigation: the new menu and the image markers open them).
  - Home (NL + EN): the first section (the three squares) is replaced by the 3D hypercube landing.
  - Every root-relative URL ("/wp-content/...", "/sport/") becomes relative, so the site runs from a sub-folder.
  - Every page gets <meta name="robots" content="noindex"> (this is a prototype, not the official site).

Usage: python3 tools/build.py [mirror_dir] [out_dir]
"""
import os, re, shutil, sys
from bs4 import BeautifulSoup

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
MIRROR = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(REPO, '..', 'hypercube-site'))
OUT = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else os.path.join(REPO, 'dist'))
SRC_HC = os.path.join(REPO, 'src', 'hc')

GSAP = ['https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/CustomEase.min.js']
MAIN = [  # (file, type, lang, page colour fallback)
    ('sport/index.html', 'sport', 'nl', '#fe0100'),
    ('mobiliteit/index.html', 'mobility', 'nl', '#0000ff'),
    ('over-hypercube/index.html', 'about', 'nl', '#000000'),
    ('en/sports/index.html', 'sport', 'en', '#fe0100'),
    ('en/mobility/index.html', 'mobility', 'en', '#0000ff'),
    ('en/about-hypercube/index.html', 'about', 'en', '#000000'),
]
HOME = [('index.html', 'nl'), ('en/index.html', 'en')]


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def write(p, s):
    with open(p, 'w', encoding='utf-8') as f:
        f.write(s)


def classes(tag):
    return tag.get('class') or []


def top_row(tag):
    """The outermost theme row (wpb_row that is not an inner_row) containing tag."""
    row = None
    for a in [tag] + list(tag.parents):
        if getattr(a, 'name', None) == 'div' and 'wpb_row' in classes(a) and 'inner_row' not in classes(a):
            row = a
    return row


def add_head(soup, extra_css=True):
    head = soup.head
    if not head.find('meta', attrs={'charset': True}):
        head.insert(0, soup.new_tag('meta', charset='utf-8'))
    if not head.find('meta', attrs={'name': 'robots'}):
        head.append(soup.new_tag('meta', attrs={'name': 'robots', 'content': 'noindex, nofollow'}))
    else:
        head.find('meta', attrs={'name': 'robots'})['content'] = 'noindex, nofollow'
    if extra_css:
        head.append(soup.new_tag('link', rel='stylesheet', href='/hc/hero-reveal.css'))
        s = soup.new_tag('script'); s.string = "document.documentElement.classList.add('js-hc');"
        head.append(s)


def split_title(text):
    t = re.sub(r'\s+', ' ', text).strip()
    if '&' in t:
        i = t.index('&')
        return t[:i + 1].strip(), t[i + 1:].strip()
    a, _, b = t.partition(' ')
    return a, b


def transform_main(path, kind, lang, fallback_colour):
    soup = BeautifulSoup(read(path), 'html.parser')
    wrap = soup.find(id='ajax-content-wrap')
    hot = wrap.find(class_='nectar_image_with_hotspots')
    hero_row = top_row(hot)
    tabbed = hero_row.find_next(class_='tabbed')
    tabs_row = top_row(tabbed)
    parent = tabs_row.parent
    assert hero_row.parent is parent, f'{path}: hero row and tabs row have different parents'
    h2 = wrap.find('h2')
    t1, t2 = split_title(h2.get_text(' '))
    # page colour: the title square column carries it as an inline colour
    colour = fallback_colour
    title_row = top_row(h2)
    m = re.search(r'color:\s*(#[0-9a-fA-F]{3,6})', ' '.join(c.get('style', '') for c in title_row.find_all(style=True))) if title_row else None
    if m:
        colour = m.group(1)
    # remove every theme row before the tab component (red band, title row, hotspot image row)
    for sib in list(tabs_row.previous_siblings):
        if getattr(sib, 'name', None) == 'div' and 'wpb_row' in classes(sib):
            sib.decompose()
    # the first tab's running text gets the word-group reveal
    first_pane = tabbed.find(class_='wpb_tab', recursive=False) or tabbed.find(class_='wpb_tab')
    for p in first_pane.select('.wpb_text_column p'):
        if len(p.get_text(' ').strip()) >= 60 and p.find_parent(class_='tabbed') is tabbed:   # not inside a nested tab set
            p['class'] = classes(p) + ['hc-reveal']
    # the hero, wrapping the page's own tab component
    label = {'nl': 'Secties', 'en': 'Sections'}[lang]
    html = f'''<div class="hc-shift"><section class="hc-page" data-page="{kind}" data-lang="{lang}" style="--c:{colour}">
  <div class="hc-stage">
    <div class="hc-layout">
      <div class="hc-title-row"><span class="hc-sq" aria-hidden="true"></span><h2 class="hc-title"><span class="hc-t1"></span> <span class="hc-t2"></span></h2></div>
      <div class="hc-hero"></div>
      <nav class="hc-menu" aria-label="{label}"></nav>
    </div>
    <svg class="hc-gsq" aria-hidden="true"><rect fill="none" stroke="currentColor"/></svg>
    <div class="hc-gtitle" aria-hidden="true"><span class="hc-t1"></span><span class="hc-t2"></span></div>
    <div class="hc-cue" aria-hidden="true">Scroll</div>
  </div>
  <div class="hc-copy"><div class="hc-copy-in"></div></div>
</section></div>'''
    hero = BeautifulSoup(html, 'html.parser')
    for sel in ('.hc-title .hc-t1', '.hc-gtitle .hc-t1'):
        hero.select_one(sel).string = t1
    for sel in ('.hc-title .hc-t2', '.hc-gtitle .hc-t2'):
        hero.select_one(sel).string = t2
    tabs_row.insert_before(hero)
    soup.select_one('.hc-copy-in').append(tabs_row.extract())
    add_head(soup)
    body = soup.body
    for src in GSAP + ['/hc/hero-reveal.js']:
        body.append(soup.new_tag('script', src=src))
    write(path, str(soup))
    return colour, t1, t2


def transform_home(path, lang):
    soup = BeautifulSoup(read(path), 'html.parser')
    wrap = soup.find(id='ajax-content-wrap')
    # the squares navigation exists twice (desktop and phone variants): rows whose whole text is just the three pages
    def is_squares(row):
        words = set(re.sub(r'[^A-Za-z ]', ' ', row.get_text(' ')).upper().split())
        return words and words <= {'SPORT', 'SPORTS', 'MOBILITEIT', 'MOBILITY', 'OVER', 'ABOUT', 'HYPERCUBE'} and len(words) >= 3
    rows = [r for r in wrap.find_all('div', class_='wpb_row') if 'inner_row' not in classes(r) and top_row(r) is r]
    squares = [r for r in rows if is_squares(r)]
    assert squares, f'{path}: squares section not found'
    first = squares[0]
    for extra in squares[1:]:
        extra.decompose()
    hero = BeautifulSoup(f'<div class="hc-shift hc-shift-home"><div class="hc-home3d"><iframe src="/hc/landing/index.html?embed=1&amp;lang={lang}" '
                         f'title="Hypercube" loading="eager"></iframe></div></div>', 'html.parser')
    first.replace_with(hero)
    add_head(soup)
    soup.body.append(soup.new_tag('script', src='/hc/hero-reveal.js'))
    write(path, str(soup))


# the theme's yellow (#ffff01: contact panel, yellow rows and dividers, team roles, the full-screen menu) becomes
# the logo's yellow, the one the new graphics use
OLD_YELLOW = re.compile(r'#ffff01\b', re.I)
BRAND_YELLOW = '#FFCC00'


def brand_colours(text):
    return OLD_YELLOW.subn(BRAND_YELLOW, text)


def asset_version():
    """Short hash of everything in src/hc, added to /hc/*.css|js links so browsers fetch new files after a publish."""
    import hashlib
    h = hashlib.sha1()
    for d, _, files in sorted(os.walk(SRC_HC)):
        for fn in sorted(files):
            with open(os.path.join(d, fn), 'rb') as f:
                h.update(fn.encode())
                h.update(f.read())
    return h.hexdigest()[:10]


HC_ASSET = re.compile(r'(/hc/[\w./-]+\.(?:css|js))(["\'])')


def bust_cache(text, ver):
    return HC_ASSET.sub(lambda m: m.group(1) + '?v=' + ver + m.group(2), text)


LANG_HOME = {'nl': '/', 'en': '/en/'}
LANG_LABEL = {'nl': ('Nederlands', 'NL'), 'en': ('English', 'EN')}


def add_lang_switch(soup):
    """NL / EN switch beside the header's Menu button (desktop nav + mobile header). Each language links to this
    page's own translation (the page's hreflang alternates); a page with no translation links to that language's home."""
    header = soup.find(id='header-outer')
    if not header or header.find(class_='hc-lang'):
        return False
    html_lang = (soup.html.get('lang') or 'nl').lower()
    current = 'en' if html_lang.startswith('en') else 'nl'
    alts = {l.get('hreflang'): l.get('href') for l in soup.find_all('link', rel='alternate') if l.get('hreflang') in LANG_HOME}

    def switch():
        nav = soup.new_tag('div', attrs={'class': 'hc-lang', 'role': 'navigation', 'aria-label': {'nl': 'Taal', 'en': 'Language'}[current]})
        for code in ('nl', 'en'):
            name, short = LANG_LABEL[code]
            a = soup.new_tag('a', href=alts.get(code) or LANG_HOME[code], hreflang=code, lang=code, title=name)
            if code == current:
                a['aria-current'] = 'true'
            a.string = short
            nav.append(a)
        return nav

    right = header.select_one('nav.right-side')
    if right:
        buttons = right.find('ul', class_='buttons')
        (buttons.insert_before if buttons else right.append)(switch())
    inner = header.select_one('.mobile-header .inner')
    if inner:
        inner.insert(0, switch())
    head = soup.head
    if head and not head.find('link', href='/hc/lang.css'):
        head.append(soup.new_tag('link', rel='stylesheet', href='/hc/lang.css'))
        head.append(soup.new_tag('link', rel='stylesheet', href='/hc/site.css'))   # small site-wide fixes (footer alignment)
    return True


SPORT_ICONS = {  # label next to the icon (NL / EN)  ->  src/hc/icons/<name>.svg
    'voetbal': 'voetbal', 'football': 'voetbal', 'volleybal': 'volleybal', 'volleyball': 'volleybal',
    'basketbal': 'basketbal', 'basketball': 'basketbal', 'hockey': 'hockey', 'field hockey': 'hockey',
    'beachvolleybal': 'beachvolleybal', 'beach volleyball': 'beachvolleybal', 'schaatsen': 'schaatsen',
    'ice skating': 'schaatsen', 'wielrennen': 'wielrennen', 'cycling': 'wielrennen', 'tennis': 'tennis',
    'ijshockey': 'ijshockey', 'ice hockey': 'ijshockey', 'rugby': 'rugby', 'futsal': 'futsal',
    'formule 1': 'formule-1', 'formula 1': 'formule-1',
}


def swap_sport_icons(soup):
    """Sport discipline icons (icon-with-text blocks): the mixed PNG/JPG icons become one SVG family
    (48 grid, 3 px square-ended stroke, black with one Sport-red accent)."""
    n = 0
    for box in soup.select('.iwithtext'):
        img, label = box.select_one('.iwt-icon img'), box.select_one('.iwt-text')
        name = label and SPORT_ICONS.get(label.get_text(' ', strip=True).lower())
        if img and name:
            img['src'] = f'/hc/icons/{name}.svg'
            for a in ('srcset', 'sizes', 'width', 'height'):
                img.attrs.pop(a, None)
            img['class'] = img.get('class', []) + ['hc-icon']
            n += 1
    return n


def swap_cube_gif(soup):
    """Over Hypercube / About: the old 8-frame logo GIF becomes the hero's cube drawing as a looping SVG
    (src/hc/cube-loop.svg, made by tools/make_cube_loop.py)."""
    n = 0
    for img in soup.find_all('img'):
        if (img.get('data-nectar-img-src') or img.get('src') or '').endswith('/Cube-animatie.gif'):
            for a in ('data-nectar-img-src', 'srcset', 'sizes', 'data-nectar-img-srcset'):
                img.attrs.pop(a, None)
            img['src'] = '/hc/cube-loop.svg'
            img['width'], img['height'] = '204', '204'
            img['loading'] = 'lazy'   # like the GIF it replaces (theme lazy-load), it must not hold up the page's load event
            img['class'] = [c for c in img.get('class', []) if c != 'nectar-lazy'] + ['hc-cube-loop']
            n += 1
    return n


def add_form_helpers(soup):
    """Contact form (About pages): layout fixes, e-mail endings, Dutch phone formatting, and a clear message
    instead of a failed post (src/hc/form.css + form.js)."""
    if not soup.find(id='gform_1') or soup.find('script', src='/hc/form.js'):
        return False
    soup.head.append(soup.new_tag('link', rel='stylesheet', href='/hc/form.css'))
    soup.body.append(soup.new_tag('script', src='/hc/form.js', defer=None))
    return True


ROOT_ATTR = re.compile(r'''(\s(?:href|src|action|poster|content|data-[\w-]+)\s*=\s*["'])/(?!/)''')
SRCSET = re.compile(r'''(\s(?:data-)?srcset\s*=\s*["'])([^"']*)(["'])''')
CSS_URL = re.compile(r'''url\(\s*(["']?)/(?!/)''')


def relativize(text, depth, is_css=False):
    prefix = '../' * depth if depth else './'
    if is_css:
        return CSS_URL.sub(lambda m: f'url({m.group(1)}{prefix}', text)
    text = ROOT_ATTR.sub(lambda m: m.group(1) + prefix, text)
    text = SRCSET.sub(lambda m: m.group(1) + re.sub(r'(^|,\s*)/(?!/)', lambda n: n.group(1) + prefix, m.group(2)) + m.group(3), text)
    text = CSS_URL.sub(lambda m: f'url({m.group(1)}{prefix}', text)
    return text


def main():
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    shutil.copytree(MIRROR, OUT, ignore=shutil.ignore_patterns('_mirror_report.txt', '.DS_Store'))
    shutil.copytree(SRC_HC, os.path.join(OUT, 'hc'))
    for rel, kind, lang, colour in MAIN:
        print('hero  ', rel, transform_main(os.path.join(OUT, rel), kind, lang, colour))
    for rel, lang in HOME:
        transform_home(os.path.join(OUT, rel), lang); print('home  ', rel)
    # every other page: charset + noindex
    n_html = n_css = n_lang = n_icons = n_cube = n_form = n_yellow = 0
    ver = asset_version()
    for d, _, files in os.walk(OUT):
        for fn in files:
            p = os.path.join(d, fn)
            rel = os.path.relpath(p, OUT)
            depth = rel.count(os.sep)
            if fn.endswith('.html') and not rel.startswith('hc' + os.sep):
                soup = BeautifulSoup(read(p), 'html.parser')
                if soup.head:
                    add_head(soup, extra_css=False)
                    n_lang += add_lang_switch(soup)
                    n_icons += swap_sport_icons(soup)
                    n_cube += swap_cube_gif(soup)
                    n_form += add_form_helpers(soup)
                text, n = brand_colours(str(soup)); n_yellow += n
                text = bust_cache(text, ver)
                write(p, relativize(text, depth)); n_html += 1
            elif fn.endswith('.css') and not rel.startswith('hc' + os.sep):
                text, n = brand_colours(read(p)); n_yellow += n
                write(p, relativize(text, depth, is_css=True)); n_css += 1
    write(os.path.join(OUT, '.nojekyll'), '')
    write(os.path.join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n')
    print(f"relative paths: {n_html} html, {n_css} css, language switch on {n_lang} pages, {n_icons} sport icons, {n_cube} cube loops, {n_form} forms, {n_yellow} yellows -> #FFCC00  ->  {OUT}")


if __name__ == '__main__':
    main()
