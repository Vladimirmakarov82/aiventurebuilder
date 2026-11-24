"""Проверка русских текстов перед публикацией (страница партнерам, кабинет).
Запуск: python3 _src/ru_check.py ru/partners/index.html
1) правила Владимира (запреты и отклоненные фразы), 2) повторы фактов и слов,
3) LanguageTool ru-RU (орфография, грамматика, пунктуация). Код выхода 1 при ошибках."""
import re, sys, json, html, urllib.request, urllib.parse, collections, os
sys.path.insert(0, os.path.dirname(__file__))
from ru_lint import visible_text, HARD as SITE_HARD
SKIP = re.compile(r'партн|брокер|через партнер|задач|лицензи|^от ')  # правила главной, которые не относятся к странице партнерам
HARD = [(rx, why) for rx, why in SITE_HARD if not SKIP.search(rx)] + [
    (r'\bзапрос (вчера|сегодня|\d+ (день|дня|дней) назад)', 'лишнее слово «запрос» перед датой: «вчера», «3 дня назад»'),
    (r'закрепляются по порядку', 'фраза без смысла для читателя (24.11)'),
    (r'клиенты (сети )?ищут', 'клиенты ничего не ищут: партнеры знают задачи своих клиентов (24.11)'),
    (r'до недели', 'срок пишем «2–7 дней»'),
    (r'в 2[–-]3 раза', 'утверждение без основания'),
    (r'\bвпервые\b', 'утверждение без основания'),
    (r'возможности, которые бывают', 'определение вместо слова «асимметрия»'),
    (r'\bоффер|спецпредложени', 'жаргон: «предложение»'),
    (r'\b(станьте|загрузите|отметьте|нажмите|выберите|свяжитесь|напишите|оставьте|укажите|подарите)\b', 'призыв к читателю запрещен'),
    (r'\b(midsize|jet card|brief|бриф)\b', 'английское слово или жаргон'),
    (r'\b(\d{2}[–-]\d{2}) ·', 'возраст без слова «года»'),
    (r'\bвзнос партнера|\$20\s?000', 'взнос партнера на сайте не показываем (24.11)'),
    (r'(остаются|остается|записан) за партнером\b(?!, который)', 'неясно, за каким партнером: «за тем, кто его привел» (24.11)'),
    (r'международного консьерж-сервиса, где', 'длинное придаточное: разбить'),
]
def strings_from_js(src):
    out = []
    for m in re.finditer(r'var LD=(\[.*?\]),(?:CT=(\[.*?\]),)?TX=(\{.*?\});', src, re.S):
        for it in json.loads(m.group(1)):
            for k in ('q', 'who', 'b', 'w', 'm', 'h', 'ago', 'kl'): out.append(str(it.get(k) or ''))
            out += list(it.get('s') or []) + list(it.get('d') or [])
        out += [c['n'] for c in json.loads(m.group(2) or '[]')] + list(json.loads(m.group(3)).values())
    return [x for x in out if x.strip()]
def view_lines(path, view):
    src = open(path, encoding='utf-8').read()
    if view:
        a = src.index(f'id="{view}"'); b = src.index('</section>', a); part = src[a:b]
        tmp = '/tmp/_rucheck.html'; open(tmp, 'w').write(part); lines = visible_text(tmp)
    else: lines = visible_text(path)
    return lines, strings_from_js(src)
def lt(text):
    data = urllib.parse.urlencode({'language': 'ru-RU', 'text': text, 'disabledRules': 'WHITESPACE_RULE,UPPERCASE_SENTENCE_START'}).encode()
    try:
        r = json.load(urllib.request.urlopen('https://api.languagetool.org/v2/check', data, timeout=30))
        return [(m['message'], text[max(0, m['offset']-25):m['offset']+m['length']+25].replace('\n',' / '), text[m['offset']:m['offset']+m['length']]) for m in r.get('matches', [])]
    except Exception as e: return [('LanguageTool недоступен: ' + str(e)[:60], '', '')]
def main():
    path = sys.argv[1]; view = sys.argv[2] if len(sys.argv) > 2 else 'v-aud'
    vis, data = view_lines(path, view if view != 'all' else None); lines = vis + data
    errs = []
    raw = open(path, encoding='utf-8').read()
    for m in re.finditer(r'(\$20[\s\u00a0,.]?000|\$20k|20&nbsp;000)', raw):  # взнос партнера: нигде на странице, включая скрытые виды
        ctx = re.sub(r'<[^>]+>', ' ', raw[max(0, m.start()-80):m.end()+140])
        if not re.search(r'Гражданство|Citizenship|Картина|Painting|typicalEarn', ctx): errs.append(('сумма $20 000 на странице (взнос партнера запрещен)', ctx.strip()))
    for l in lines:
        low = l.lower()
        for rx, why in HARD:
            if re.search(rx, low) and not (why.startswith('канцелярит «данный»') and re.search(r'(обезличенн\w+|личн\w+|персональн\w+) данн|данные по ', low)): errs.append((why, l))
    # повторы: одинаковые фразы из 3+ слов
    grams = collections.Counter()
    for l in vis:
        w = re.findall(r'[а-яa-z0-9$]+', l.lower())
        for i in range(len(w) - 2): grams[' '.join(w[i:i+3])] += 1
    reps = [(g, c) for g, c in grams.items() if c > 1 and not re.fullmatch(r'[\d$ ]+', g) and g not in ('в каждой категории','каждой категории два')]
    for g, c in reps: errs.append((f'повтор {c} раза', g))
    MONTHS = re.compile(r'(янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек)\.?$')
    txt = [l if re.search(r'[.!?:]$', l) else l + '.' for l in lines]; chunks, cur = [], ''
    for l in txt:
        if len(cur) + len(l) > 12000: chunks.append(cur); cur = ''
        cur += l + '\n'
    chunks.append(cur)
    for msg, ctx, word in [x for ch in chunks for x in lt(ch)]: 
        if 'орфограф' in msg and (word.lower() in {'бизнес-джет','бизнес-джета','арт-консультант','дирхамах','хели-ски','резидентство','резидентства','топ-школах','виниры','джет','джет-клубе','аккредитив','бонд','децентрализованного','консьерж-сервиса','консьерж-сервис'} or word[:1].isupper() or MONTHS.match(word)): continue  # имена, топонимы, подписи графика
        errs.append(('LanguageTool: ' + msg, ctx))
    for why, l in errs: print('ERROR', why, '|', l[:150])
    print(f'{len(errs)} errors in {len(lines)} lines'); sys.exit(1 if errs else 0)
if __name__ == '__main__': main()
