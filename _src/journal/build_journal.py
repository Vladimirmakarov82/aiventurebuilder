"""Собирает скрытую страницу журнала Orbiq из journal/items.json.
Страница: /journal-c0f4ba/ (noindex, нигде не связана с сайтом). Отзывы Владимир дает в чате проекта; уроки записываются в RULES.md.
Карточка без фото (поле img) в журнал не попадает.
Запуск: python3 journal/build_journal.py"""
import json, html, os, re, urllib.parse

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = os.environ.get('JOURNAL_SITE') or os.path.join(ROOT, '..', 'site')
SLUG = 'journal'
TG = 'https://t.me/vladimir82makarov?text='

items = json.load(open(os.path.join(ROOT, 'items.json')))
allitems = [i for i in items if i.get('status') != 'rejected' and i.get('live') != 'closed']
items = [i for i in allitems if i.get('img')]
noimg = [i for i in allitems if not i.get('img')]
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



def facts_html(i):
    rows = ([('Повторить', e(i['repeat'][0].upper() + i['repeat'][1:]), '')] if i.get('repeat') else []) + [(k, e(v), '') for k, v in i.get('facts', [])]
    if i.get('verified_on'):
        ok = i.get('live') == 'active'
        s = ('Актуально на ' if ok else 'Нужна перепроверка, проверено ') + dmy(i['verified_on'])
        if i.get('last_seen'):
            s += '. Последнее упоминание: ' + dmy(i['last_seen'])
        rows.append(('Актуальность', e(s), 'ok' if ok else 'q'))
    srcn = e(i.get('publication') or i.get('source_name') or host(i['source_url']))
    rows.append(('Источник', '<a href="%s" target="_blank" rel="noopener">%s%s →</a>' % (e(i['source_url']), srcn, e(', ' + dmy(i['pub_date']) if i.get('pub_date') else '')), ''))
    if i.get('facts_src'):
        rows.append(('Цифры', '<a href="%s" target="_blank" rel="noopener">%s →</a>' % (e(i['facts_src']), e(host(i['facts_src']))), ''))
    return '<dl class="facts">' + ''.join('<div><dt>%s</dt><dd class="%s">%s</dd></div>' % (k, c, v) for k, v, c in rows) + '</dl>'


def article(i):
    tg = TG + urllib.parse.quote('Хочу такую историю из журнала Orbiq: ' + plain(i['title']))
    fig = ('<figure class="ov-img"><img src="%s" alt="%s"><figcaption>%s</figcaption></figure>' % (e(i['img']), e(plain(i['title'])), e(i.get('img_credit', '')))) if i.get('img') else '<figure class="ov-img ov-noimg"></figure>'
    return ('<template id="t-%s">%s<div class="ov-body"><span class="kick">%s</span><h2>%s</h2><p class="dek">%s</p><p class="txt">%s</p>'
            '%s<a class="cta" href="%s" target="_blank" rel="noopener">Хочу такую историю →</a>'
            '<p class="end">Orbiq — истории, которые можно повторить</p></div></template>') % (
        e(i['id']), fig, e(i['geo']), i['title'], i['hook'], i['text'], facts_html(i), e(tg))


def spread(i):
    return ('<a class="sp" href="#%s"><img src="%s" alt="%s"%s><span class="sh"></span>'
            '<span class="sb"><span class="kick">%s</span><span class="sh2">%s</span><span class="sd">%s</span><span class="sr">Читать историю →</span></span></a>') % (
        e(i['id']), e(i['img']), e(plain(i['title'])), '' if i is feed[0] else ' loading="lazy"', e(i['geo']), i['title'], i['hook'])


def country(i):
    return (i.get('geo') or '').split(',')[0].strip()


def diversify(pool):
    out, prev = [], []
    pool = sorted(pool, key=lambda i: -float(i.get('score_all') or 0))
    while pool:
        def ok(i):
            if prev and i.get('archetype') and any(i.get('archetype') == p.get('archetype') for p in prev):
                return False
            if any(i.get('kind') == p.get('kind') for p in prev[-2:]):
                return False
            if any(country(i) == country(p) for p in prev[-2:]):
                return False
            if i.get('vis') and any(i.get('vis') == p.get('vis') for p in prev[-4:]):
                return False
            return True
        pick = next((i for i in pool if ok(i)), pool[0])
        out.append(pick); prev.append(pick); pool.remove(pick)
    return out


adults = [i for i in items if not i.get('kids') and i.get('repeat') and i.get('theme')]  # тест повторения: без поля repeat история в журнал не попадает
heroes = [i for i in adults if i.get('img_hero')]
cover = heroes[0] if heroes else adults[0]
# одна тема на выпуск: вторая история той же темы в ленту не попадает
_seen, _pool = {cover.get('theme')}, []
for _i in sorted([i for i in adults if i is not cover], key=lambda i: -float(i.get('score_all') or 0)):
    if _i.get('theme') and _i['theme'] in _seen:
        continue
    _seen.add(_i.get('theme')); _pool.append(_i)
feed = [cover] + diversify(_pool)
page = open(os.path.join(ROOT, 'journal_template.html')).read()
for k, v in dict(spreads='\n'.join(spread(i) for i in feed), articles='\n'.join(article(i) for i in feed), issue=e(issue_h)).items():
    page = page.replace('@@%s@@' % k, v)
out = os.path.join(SITE, SLUG)
os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'index.html'), 'w').write(page)
print('journal:', len(feed), 'spreads ->', '/' + SLUG + '/')
