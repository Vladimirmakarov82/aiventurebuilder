"""Собирает скрытую страницу журнала Orbiq из journal/items.json.
Страница: /journal-c0f4ba/ (noindex, нигде не связана с сайтом). Отзывы Владимир дает в чате проекта; уроки записываются в RULES.md.
Карточка без фото (поле img) в журнал не попадает.
Запуск: python3 journal/build_journal.py"""
import json, html, os, re, urllib.parse

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = os.environ.get('JOURNAL_SITE') or os.path.join(ROOT, '..', 'site')
SLUG = 'journal-c0f4ba'
TG = 'https://t.me/vladimir82makarov?text='

items = json.load(open(os.path.join(ROOT, 'items.json')))
allitems = [i for i in items if i.get('status') != 'rejected' and i.get('live') != 'closed']
items = [i for i in allitems if i.get('img')]
noimg = sorted([i for i in allitems if not i.get('img')], key=lambda i: -float(i.get('score_all') or 0))
items.sort(key=lambda i: (bool(i.get('kids')), -float(i.get('score_all') or 0), i.get('order', 0)))
issues = sorted({i.get('issue', '') for i in items}, reverse=True)
issue = issues[0] if issues else ''
MONTHS = {'01': 'январь', '02': 'февраль', '03': 'март', '04': 'апрель', '05': 'май', '06': 'июнь', '07': 'июль', '08': 'август', '09': 'сентябрь', '10': 'октябрь', '11': 'ноябрь', '12': 'декабрь'}
issue_h = (MONTHS.get(issue[5:7], '') + ' ' + issue[:4]).strip()

FOR = {'она': 'Для нее', 'он': 'Для него', 'семья': 'Для семьи', 'дети': 'Детям'}
CATS = []
for i in items:
    if i['cat'] not in CATS and not i.get('kids'):
        CATS.append(i['cat'])

e = lambda s: html.escape(str(s or ''), quote=True)
plain = lambda s: re.sub('<[^>]+>', '', s or '')


def host(u):
    try:
        return urllib.parse.urlparse(u).netloc.replace('www.', '')
    except Exception:
        return ''


def fors(i):
    return [f.strip() for f in re.split(r'[,/]', i.get('for', '')) if f.strip()]


def dmy(d):
    p = (d or '').split('-')
    return '.'.join(reversed(p)) if len(p) == 3 else (MONTHS.get(p[1], '') + ' ' + p[0] if len(p) == 2 else d or '')


def live_line(i):
    if not i.get('verified_on'):
        return ''
    s = ('Актуально на ' if i.get('live') == 'active' else 'Нужна перепроверка, проверено ') + dmy(i['verified_on'])
    if i.get('last_seen'):
        s += ' · последнее упоминание: ' + dmy(i['last_seen']) + (', ' + host(i['last_seen_url']) if i.get('last_seen_url') else '')
    return s


def article(i):
    tg = TG + urllib.parse.quote('Хочу такую историю из журнала Orbiq: ' + plain(i['title']))
    obj = ('<a href="%s" target="_blank" rel="noopener">Сайт мастера</a>' % e(i['object_url'])) if i.get('object_url') else ''
    return '''<template id="t-%(id)s">%(fig)s
<div class="ov-body"><span class="kick">%(geo)s · %(cat)s</span><h2>%(title)s</h2><p class="dek">%(hook)s</p><p class="txt">%(text)s</p>
<div class="make"><span class="kick">Orbiq может постараться устроить</span><p>%(make)s</p><a class="cta" href="%(tg)s" target="_blank" rel="noopener">Хочу такую историю <span>→</span></a></div>
<a class="orig" href="%(src)s" target="_blank" rel="noopener"><span class="kick">%(srcn)s%(date)s</span><span class="ot">%(atitle)s</span><span class="or">Читать статью →</span></a><p class="live %(lcls)s">%(live)s</p><p class="src">%(obj)s</p></div></template>''' % dict(
        id=e(i['id']), fig=('<figure class="ov-img"><img src="%s" alt="%s"><figcaption>%s</figcaption></figure>' % (e(i['img']), e(plain(i['title'])), e(i.get('img_credit', '')))) if i.get('img') else '<figure class="ov-img ov-noimg"><span>%s</span></figure>' % e(i.get('publication') or ''), geo=e(i['geo']), cat=e(i['cat']),
        title=i['title'], hook=i['hook'], text=i['text'], make=i['make'], tg=e(tg), src=e(i['source_url']),
        srcn=e(i.get('publication') or i.get('source_name') or host(i['source_url'])), obj=obj, date=e(' · ' + i['pub_date'] if i.get('pub_date') else ''), atitle=e(i.get('article_title') or plain(i['title'])), live=e(live_line(i)), lcls='q' if i.get('live')=='unclear' else '')


def tile(i, cls):
    return '''<a class="t %(cls)s" href="#%(id)s" data-id="%(id)s" data-cat="%(cat)s" data-for="%(for)s" data-kids="%(kids)s" data-sa="%(sa)s" data-sm="%(sm)s" data-sf="%(sf)s">
<span class="ti"><img src="%(img)s" alt="%(alt)s" loading="lazy"></span>
<span class="tb"><span class="kick">%(pub)s%(geo)s</span><span class="th">%(title)s</span><span class="td">%(hook)s</span></span>
</a>''' % dict(cls=cls, id=e(i['id']), cat=e(i['cat']), img=e(i['img']), alt=e(plain(i['title'])), geo=e(i['geo']),
                title=i['title'], hook=i['hook'], pub=e(i['publication'] + ' · ' if i.get('publication') else ''), kids='1' if i.get('kids') else '0', sa=i.get('score_all') or 0, sm=i.get('score_m') or 0, sf=i.get('score_f') or 0, **{'for': e(' '.join(fors(i)))})


adults = [i for i in items if not i.get('kids')]
heroes = [i for i in adults if i.get('img_hero')]
cover = heroes[0] if heroes else (adults[0] if adults else items[0])
rest = [i for i in items if i is not cover]

# ритм раскладки, как в журнале: широкая, три обычные, две половины, три обычные, высокая...
PATTERN = ['wide', 'n', 'n', 'n', 'half', 'half', 'n', 'n', 'n', 'wide', 'n', 'n', 'n', 'half', 'half']
tiles = [tile(i, PATTERN[k % len(PATTERN)] if not i.get('kids') else 'n') for k, i in enumerate(rest)]

nav = '<button type="button" class="jf on" data-k="all">Все истории</button>' + ''.join(
    '<button type="button" class="jf" data-k="cat" data-v="%s">%s</button>' % (e(c), e(c)) for c in CATS) + ''.join(
    '<button type="button" class="jf%s" data-k="for" data-v="%s">%s</button>' % (' kd' if k == 'дети' else '', k, v) for k, v in FOR.items())

cover_html = '''<section class="cover"><img src="%(img)s" alt="%(alt)s"><div class="cv-sh"></div>
<div class="cv-top"><span class="mast">ORBIQ</span><span class="kick">Журнал · %(issue)s</span></div>
<a class="cv-b" href="#%(id)s"><span class="kick">История номера · %(pub)s</span><span class="cv-h">%(title)s</span><span class="cv-d">%(hook)s</span><span class="cv-r">Читать историю →</span></a></section>''' % dict(
    id=e(cover['id']), img=e(cover['img']), alt=e(plain(cover['title'])), issue=e(issue_h), geo=e(cover['geo']), pub=e(cover.get('publication') or cover['geo']), title=cover['title'], hook=cover['hook'])

import glob


def qitem(it, extra=''):
    lic = (' · ' + e(it['license'])) if it.get('license') else ''
    src = e(it.get('source') or host(it.get('url', '')))
    meta = ' · '.join(x for x in [e(it.get('authors', '')), str(it.get('year') or it.get('date') or '')] if x)
    return ('<div class="qi">%s<blockquote>%s</blockquote><p class="qo">%s</p>%s'
            '<a class="qs" href="%s" target="_blank" rel="noopener">%s%s%s →</a></div>') % (
        ('<span class="qh">%s</span>' % (it.get('claim_ru') or it.get('item'))) if (it.get('claim_ru') or it.get('item')) else '',
        e(it.get('quote_ru', '')), e(it.get('quote', '')), extra, e(it.get('url', '')), src, (' · ' + e(meta)) if meta else '', lic)


dossiers = []
for f in sorted(glob.glob(os.path.join(ROOT, 'dossiers', '*.json'))):
    d = json.load(open(f))
    blocks = ''
    for bl in d.get('blocks', []):
        its = ''
        for it in bl.get('items', []):
            extra = ''
            if it.get('now'):
                extra += '<p class="now"><b>Сейчас:</b> %s%s</p>' % (e(it['now']), (' <a href="%s" target="_blank" rel="noopener">→</a>' % e(it['now_url'])) if it.get('now_url') else '')
            if it.get('orbiq'):
                extra += '<p class="orb">Orbiq может постараться: %s</p>' % e(it['orbiq'])
            its += qitem(it, extra)
        blocks += '<div class="db"><h3>%s</h3><div class="dq">%s</div></div>' % (e(bl['name']), its)
    dossiers.append('<article class="dos" id="d-%s"><span class="kick">Досье</span><h2>%s</h2>%s</article>' % (e(d.get('slug', '')), e(d.get('person', '')), blocks))

research = []
for f in sorted(glob.glob(os.path.join(ROOT, 'research', '*.json'))):
    d = json.load(open(f))
    blocks = ''.join('<div class="db"><h3>%s</h3><div class="dq">%s</div></div>' % (e(bl['name']), ''.join(qitem(it) for it in bl.get('items', []))) for bl in d.get('blocks', []))
    research.append('<article class="dos"><span class="kick">Исследование</span><h2>%s</h2>%s</article>' % (e(d.get('title', '')), blocks))

more = ''.join('<a class="mi" href="#%s" data-sa="%s"><span class="kick">%s · %s</span><span class="mt">%s</span><span class="md">%s</span></a>' % (e(i['id']), i.get('score_all') or 0, e(i.get('publication') or ''), e(i['geo']), i['title'], i['hook']) for i in noimg)
page = open(os.path.join(ROOT, 'journal_template.html')).read()
for k, v in dict(dossiers='\n'.join(dossiers) or '', research='\n'.join(research) or '', cover=cover_html, nav=nav, tiles='\n'.join(tiles), articles='\n'.join(article(i) for i in items + noimg), more=more, issue=e(issue)).items():
    page = page.replace('@@%s@@' % k, v)

out = os.path.join(SITE, SLUG)
os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'index.html'), 'w').write(page)
print('journal:', len(items), 'stories with photos ->', '/' + SLUG + '/')
