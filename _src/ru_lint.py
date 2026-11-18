"""Linter for visible Russian copy on Vladimir's sites.
Usage: python3 ru_lint.py site/ru/index.html   (exit code 1 if hard errors)
Rules: humanizer-ru hard bans (github.com/ilyautov/humanizer-ru, MIT),
selling-copy-ru bans, and phrases Vladimir rejected on his sites."""
import re, sys, html

HARD = [
    # empty slogans and calques Vladimir rejected
    (r'через границ', 'калька «через границу»'),
    (r'вс[её] начинается с', 'пустой лозунг «все начинается с»'),
    (r'за минуту', 'пустое обещание «за минуту»'),
    (r'так это выглядит', 'пустой заголовок'),
    (r'вс[её],? что нужно', 'пустой заголовок «все, что нужно»'),
    (r'модистк', 'архаизм'),
    (r'нестандарт', 'жаргон'),
    (r'трекшн', 'жаргон'),
    (r'сеть агентов в работе', 'калька'),
    (r'описать задачу', 'кнопка-давилка'),
    (r'\bзадач[аиу]? (в|через) ', 'канцелярское «задача» как продукт'),
    (r'решени[ея] (для|задач)', 'слово «решение» как solution'),
    # humanizer-ru hard bans
    (r'не просто [^.]{1,40}, а ', '«не просто X, а Y»'),
    (r'не только [^.]{1,40}, но и', '«не только X, но и Y»'),
    (r'\bне [^.,]{1,30}, а ', '«не X, а Y»'),
    (r'в современном мире', 'космическое вступление'),
    (r'в услови(ях|е) ', '«в условиях...»'),
    (r'стоит отметить', 'метатекст'),
    (r'важно (понимать|помнить|отметить)', 'метатекст'),
    (r'\bданн(ый|ая|ое|ые|ого|ой)\b', 'канцелярит «данный»'),
    (r'\bявля(ется|ются)\b', 'канцелярит «является»'),
    (r'(играет|играют) (важную|ключевую) роль', 'раздувание значимости'),
    (r'подводя итог|таким образом,', 'формульный вывод'),
    (r'погрузимся|давайте посмотрим', 'анонс'),
    (r'раскры(ть|вает) потенциал|новый уровень|новые горизонты', 'мотивационное клише'),
    (r'комплексн(ый|ое) (подход|решение)', 'клише'),
    (r'в связи с этим', 'канцелярит'),
    (r'представляет собой|позволяет|осуществля', 'канцелярит'),
    (r'ё', 'буква ё'),
    (r'\b(вы|вас|вам|ваш|ваша|ваше|ваши)\b', 'обращение на «вы» запрещено на этом сайте'),
    (r'честно|без воды|без прикрас', 'самомаркировка честности'),
    (r'\?\s+(да|потому что)', 'псевдосократика'),
]
SOFT = [
    (r' — ', 'тире-пауза: лучше точка или двоеточие'),
    (r'уникальн|инновацион|эффективн|оптимальн|индивидуальн(ый|ого) подход|широкий спектр', 'оценка без цифры'),
    (r'\bпремиальн|\bэксклюзивн|\bлакшери|\bлюкс', 'слово-ярлык вместо примера'),
]

def visible_text(path):
    s = open(path, encoding='utf-8').read()
    s = re.sub(r'<script.*?</script>|<style.*?</style>|<svg.*?</svg>', ' ', s, flags=re.S)
    s = re.sub(r'<head>.*?</head>', ' ', s, flags=re.S)
    s = re.sub(r'<[^>]+>', '\n', s)
    s = html.unescape(s).replace('\xa0', ' ')
    return [l.strip() for l in s.split('\n') if l.strip()]

def lint_lines(lines):
    hard, soft = [], []
    for l in lines:
        low = l.lower()
        for rx, why in HARD:
            if re.search(rx, low): hard.append((why, l))
        for rx, why in SOFT:
            if re.search(rx, low): soft.append((why, l))
    return hard, soft

if __name__ == '__main__':
    lines = visible_text(sys.argv[1])
    # also lint JS-injected RU data passed as extra files of plain text lines
    for extra in sys.argv[2:]:
        lines += [l.strip() for l in open(extra, encoding='utf-8') if l.strip()]
    hard, soft = lint_lines(lines)
    for why, l in hard: print('ERROR', why, '|', l[:140])
    for why, l in soft: print('warn ', why, '|', l[:140])
    print(f'{len(hard)} errors, {len(soft)} warnings')
    sys.exit(1 if hard else 0)
