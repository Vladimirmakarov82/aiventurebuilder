import json, re, os
B = '/home/claude/orbicgroup/'
css = open(B+'base.css').read()
extra = open(B+'extra.css').read()
body = open(B+'body.html').read()
js = open(B+'base.js').read()
fav = open(B+'favicon.js').read()
cfjs = open(B+'chatfilm.js').read()
pooljs = open(B+'pool.js').read()
DOM = 'https://orbiqgroup.com'

def items(lst, cls=''):
    return ''.join('<div class="bx-it %s" style="--l:%d;--d:%d"><span>%s</span><em>✓</em></div>' % ('v' if i % 4 == 0 else '', i % 6, i, x) for i, x in enumerate(lst))

def ticker(lst):
    out = []
    for i, x in enumerate(lst):
        c = 'o' if i % 4 == 2 else ('m' if i % 2 else '')
        out.append('<span%s>%s</span>' % (' class="%s"' % c if c else '', x))
    return ''.join(out) + '<span class="m">·</span>'

def xb(cards):
    return '\n      '.join('<div class="xb%s"><span class="mono">%s</span><b>%s</b><p>%s</p></div>' % (' on' if i == 0 else '', a, b, c) for i, (a, b, c) in enumerate(cards))

def syn(cards):
    return '\n      '.join('<div><span class="mono">%s</span><b>%s</b><p>%s</p></div>' % c for c in cards)

def bars(lst):
    return '\n          '.join('<li>%s</li>' % x for x in lst)

def steps(lst):
    return '\n            '.join('<li data-s="%d">%s</li>' % (i + 1, x) for i, x in enumerate(lst))

def aud(lst):
    return '\n      '.join('<div><span class="mono">%s</span><b>%s</b><p>%s</p></div>' % c for c in lst)

def pk(lst):
    return '\n        '.join('<div><b class="num">%s</b><span>%s</span></div>' % x for x in lst)

def slots(lst):
    cl = ['sb', 'sa', 'sc', 'sd', 'se', 'sf']
    return ''.join('<div class="%s">%s</div>' % (cl[i], x) for i, x in enumerate(lst))

EN = dict(
 lang='en', path='/', title='Orbiq · Concierge without borders',
 desc='Orbiq takes tasks that open only through the right people: Monaco residence, Le Rosey, Patek Philippe without a waitlist, family trusts, Charité, Sotheby’s and Christie’s.',
 og='og-orbic-en.png',
 nav1='Services', nav2='Why now', nav3='Comparison', nav4='Companies',
 langchip='<a class="chip" href="/ru/" hreflang="ru" lang="ru" aria-label="Русская версия">RU</a>',
 motion_on='Motion: on', kick='Private concierge', h1b='without borders',
 lead='Any task in any country. Fast and flawless.',
 k1='always on&nbsp;duty', k2='personal agent network per client', k3='own visa license',
 bx_h='Tasks across borders', bx_live='Personal agent network at work', bx_aria='Tasks cross the border and get done: transfers, residence, trusts, schools, clinics, documents',
 bx_a='Request', bx_b='Done', bx_line='Border',
 bx_items=None,
 bxf1k='Own license', bxf1v='Visas · Singapore', bxf2k='Through partners', bxf2v='Trusts, Patek, Hermès, Sotheby’s',
 ticker=ticker(['Orbiq', 'concierge without borders', 'Monaco residence', 'Hermès Birkin', 'Le Rosey', 'Patek Philippe', 'family trusts', 'Sotheby’s', 'Charité', 'Gulfstream G700', 'Gübelin sapphires', '24/7']),
 s0_m='00 · Services', s0_h='Everything a family needs across countries',
 s0_lead='Capital, residence, education, health and medicines, collections and events. Visas go through our visa center with a&nbsp;license in&nbsp;Singapore. Everything else goes through partners selected for each task.',
 xb=xb([('Own license · VisaTO', 'Visas and residence', 'Tourist, work and family visas, residence permits. Singapore, next Dubai, Thailand, Vietnam, Australia'),
        ('Through partners', 'Residence and citizenship', 'Monaco and Singapore residence, UAE Golden Visa, Swiss lump-sum taxation, a second citizenship for the family'),
        ('Finance', 'Money across borders', 'Accounts at private banks in Geneva and Singapore, payments for tuition, clinics and deals abroad'),
        ('Finance', 'Trusts and inheritance', 'Family trusts and foundations in Liechtenstein and Switzerland through licensed partners: capital protected and passed to children and grandchildren'),
        ('Analytics', 'Decisions for the family', 'Countries for a move, taxes, areas and schools compared. A ready analysis with options and figures'),
        ('Education', 'The future of children', 'A school and university matched to the character of the child: Le Rosey, Eton, Oxford, the Ivy League'),
        ('Health', 'Doctors and medicines', 'Second opinion from Charité and Mayo Clinic, surgeons in Seoul, Clinique La Prairie. A rare drug: we find the country where it exists and arrange it through a clinic and a prescription'),
        ('Through partners', 'Private jets', 'Gulfstream G700, Bombardier Global 7500, Dassault Falcon 8X for the family'),
        ('Collecting', 'Watches, stones, coins', 'Patek Philippe, Audemars Piguet, F.P. Journe with authentication; diamonds, sapphires and emeralds with GIA and Gübelin reports; rare coins; Hermès Birkin and Kelly'),
        ('Art', 'Sotheby’s and Christie’s', 'Lot selection, bidding at Sotheby’s, Christie’s and Phillips, collection storage in the Geneva Freeport'),
        ('Events', 'Stars and events', 'Dinner with Lenny Kravitz, meeting Justin Bieber, reception with Lady Gaga, Chanel Haute Couture, Monaco Grand Prix'),
        ('Property', 'Off-market property', 'Villas and penthouses that never reach the market: Marbella, Monaco, One Hyde Park in London')]),
 syn=syn([('Speed', 'A personal network of AI agents', 'For every client we deploy their own network of agents. They run all tasks in parallel, check documents of two countries and never miss a deadline.'),
          ('Access', 'Licensed partners in each country', 'Trust, payment and legal companies, visa centers. We select and check them for each task.'),
          ('Quality', 'One chat for everything', 'A personal manager and the agent network in one chat. Statuses, documents and deadlines stay in one thread.')]),
 s1_m='01 · Why now', s1_h='Borders got higher',
 p1_n='Pain 1', p1_h='Moving money and people got harder', p1_p='Every year brings new limits:',
 p1_bars=bars(['Transfers abroad take weeks and get stuck', 'Banks close accounts without explanation', 'Fewer direct flights, longer routes', 'Visa refusals and queues at consulates', 'Residence and citizenship rules change every year', 'Capital needs protection in several jurisdictions']),
 p2_n='Pain 2', p2_h='Deadlines stay the same', p2_p='Tuition, surgery, a deal, a family event: the date is set, the route changes every month',
 p3_n='Pain 3', p3_h='A bank concierge works within the rules of its bank',
 p3_steps=steps(['<b>Standard.</b> Restaurants, hotels, tickets. Any concierge handles them.', '<b>Non&#8209;standard.</b> Money, documents, people and things across borders. A bank concierge stays within the rules and limits of its bank.', '<b>Orbiq.</b> Partners in many countries and the client’s personal agent network. Each task gets its own route, faster.']),
 p3_seg_aria='Example', p3_seg1='Example: money', p3_seg2='Example: visas',
 tail_aria='Requests by type: standard on the right, non-standard on the left', tail_core='STANDARD REQUESTS', tail_tail='NON-STANDARD TASKS',
 tail_bl='NON-STANDARD · EACH TASK IS UNIQUE', tail_br='STANDARD · EVERY DAY',
 cf_n='One family · 30 seconds', cf_h='Three tasks across borders in&nbsp;one chat', cf_p='This is how the work looks: one request, the client’s agent network and partners in two countries, the status of each task in the chat.',
 cf_playing='Film: playing', cf_paused='Film: paused', cf_replay='Replay', cf_online='online 24/7', cf_board='Tasks · live', cf_demo='Demo',
 s2_m='02 · Comparison', s2_h='A bank concierge and&nbsp;Orbiq', s2_seg_aria='Concierge', s2_seg1='Bank concierge',
 s2_aria='Share of tasks solved by task type: a bank concierge and Orbiq', s2_cross='LIMIT OF BANK RULES', s2_round='ORBIQ FINDS A ROUTE',
 s2_revT='TASKS SOLVED', s2_riskT='TASKS LEFT UNSOLVED', s2_l1='Tasks solved', s2_l2='Tasks left unsolved', s2_l3='Diagram not to scale',
 s3_m='03 · How a task goes', s3_h='One request, three steps', s3_p='Each step is visible in the chat: status, documents, deadline.',
 s3_aria='A task goes in three steps: request, route, result', s3_l1='REQUEST IN CHAT', s3_l2='ROUTE AND PARTNERS', s3_l3='DONE AND REPORTED', s3_step='Step',
 s4_h='Com<span>panies</span>',
 s4_k=pk([('SG', 'visa center license'), ('24/7', 'always on duty'), ('12', 'service lines')]),
 s4_lead='For each service line Orbiq builds a separate company with its own license and team.',
 v_no='01 · Visas', v_st='Start: Singapore', v_one='Visa center with a&nbsp;license in&nbsp;Singapore. Next: Dubai, Thailand, Vietnam and&nbsp;Australia. Agents collect documents and track every application.',
 v_mk0='$15.2', v_mk1='B → $27.5B by&nbsp;2034', v_mk2='global visa services market, 2025',
 v_t1k='License', v_t1='Visa center license in&nbsp;Singapore', v_t2k='Demand', v_t2='Every international trip needs a&nbsp;visa',
 v_aria='From Singapore, an AI agent processes visas to countries worldwide', v_cnt='VISAS PROCESSED · DEMO',
 m_no='02 · AdTech · traffic for the group', m_st='Profit $1.7M', m_one='Website monetization.<br>Clients are publishers, website owners. They earn 30–80% more thanks to&nbsp;MAST technology.<br>Zero staff: MAST AI&#8209;agents do all the work.',
 m_mk0='$134.8', m_mk1='B', m_mk2='programmatic advertising in the US alone, 2024',
 m_t1k='Traction', m_t1='Profit $1.7M, valuation $7M', m_t2k='Role', m_t2='Paid traffic for all companies of&nbsp;the&nbsp;group',
 m_aria='MAST connects publisher websites to the ad networks of Google, Amazon, Microsoft, Magnite and Taboola, publisher income grows',
 m_lw='PUBLISHER WEBSITES', m_ln='AD NETWORKS', m_li='PUBLISHER INCOME', m_lc='WEBSITES CONNECTED · DEMO',
 j_m='Orbiq · concierge without borders', j_h='Tasks across borders <span>start in&nbsp;Telegram</span>',
 j_p='A Monaco residence, Le Rosey, a Kashmir sapphire, a family trust for three generations. The reply with a route and a deadline comes to the same chat.',
 j_btn='Send a task', j_link='Founders with a license in a new country: we build companies together',
 j_slots=slots(['Monaco', 'Trusts', 'Le Rosey', 'Patek', 'Hermès', 'Any task']),
 copy='Copy',
 # JS
 TX="{money:{core:'Restaurants, hotels, tickets',tail:'Transfers, payments, trusts',ex:'<b>Money.</b> A hotel and a restaurant are standard requests. Tuition abroad, support for family in another country, a trust for heirs are non-standard tasks. Orbiq builds a route for them with licensed partners.'},visa:{core:'Tickets and hotels',tail:'Visas, residence, citizenship',ex:'<b>Visas.</b> A ticket and a hotel are standard requests. A visa, a residence permit, a family move are non-standard: they need the documents of two countries. Orbiq agents collect the documents, the visa center files the application.'}}",
 cost0='LIMIT OF BANK RULES', cost1='ORBIQ · PARTNERS IN MANY COUNTRIES',
 axis="['HOTEL','FLIGHT','TRANSFER','VISA','TRUST']",
 SIDE="[{t:'Bank concierge',h:'Works within the rules of one bank',l:['Handles standard requests fast','Non-standard tasks hit the rules and limits of the bank','The bank sets the list of services']},{t:'Orbiq',h:'Builds a route for each task',l:['Partners in many countries: payment, legal, trust, visa','A personal agent network runs all tasks in parallel',{s:'In one chat:',u:['status of each task','documents and deadlines','one manager for the whole family']}],g:true}]",
 goal='<div class="goal"><span>On duty</span><b class="num">24/7</b><span>one chat for any task</span></div>',
 POOL=['Hermès Birkin', 'Account at a Geneva private bank', 'A place at Le Rosey', 'A drug not available at home', 'Patek Philippe 5711 without a waitlist', 'Monaco residence', 'Second opinion from Charité', 'Dinner with Lenny Kravitz', 'Family trust for three generations', 'Kashmir sapphire with a Gübelin report', 'Gulfstream G700 for the family', 'University matched to the child’s character', 'Sotheby’s lot', 'Off-market villa in Marbella', 'Rolex Daytona “Paul Newman”', 'UAE Golden Visa for 10 years', 'Surgeon in Seoul', 'Hermès Kelly', 'Family foundation in Liechtenstein', 'Meeting Justin Bieber', 'Argyle pink diamond', 'Admission to Eton', 'Access to a drug in clinical trials', 'Check-up at Mayo Clinic', 'Christie’s painting', 'Swiss lump-sum taxation', 'F.P. Journe Chronomètre Bleu', 'Penthouse at One Hyde Park', 'Reception with Lady Gaga', 'Koenigsegg Jesko', 'Oxford tuition paid in a day', 'Clinique La Prairie', 'Russian Empire coins at auction', 'Chanel Haute Couture show', 'Burmese ruby', 'Bombardier Global 7500', 'Family tax strategy across three countries', 'Art Basel preview', 'Audemars Piguet Royal Oak', 'Singapore residence for the family', 'Rare prescription drug from Switzerland', 'Lanserhof at Tegernsee', 'Table at the Monaco Grand Prix', 'Colombian emerald', 'Oxford preparation with a tutor', 'Collection storage in the Geneva Freeport', 'Limited-series Ferrari', 'Transfer for a deal in Monaco', '1937 gold sovereign', 'Stone grading at GIA', 'Account at a Singapore private bank', 'Personal security for a family trip', 'Watch authentication before purchase', 'Summer school in Switzerland', 'Genetic check-up in Zurich'],
 CF=dict(started='STARTED', done='DONE ✓', playing='Film: playing', paused='Film: paused', tasksAt=4600,
   msgs=[dict(who='c', at=1600, meta='Thu · 21:40', text='My daughter starts university in London on Monday. Today we need to pay the tuition, get visas for her grandparents to visit and find a Hermès Kelly for her birthday.'),
         dict(who='o', at=4200, meta='Orbiq · 21:41', text='Taking all three tasks. Statuses will appear here.'),
         dict(who='o', at=14600, meta='Orbiq · Fri 09:12', text='The university confirmed the tuition payment.'),
         dict(who='o', at=18200, meta='Orbiq · Fri 11:30', text='Visa appointment for the grandparents: Thursday, 10:00.'),
         dict(who='o', at=22000, meta='Orbiq · Sat 14:20', text='Hermès Kelly 25 in Gold handed over in London. Photo in the chat.'),
         dict(who='c', at=25200, meta='Sat · 14:25', text='Thank you. Next month: a trust for the grandchildren.')],
   tasks=[dict(name='Tuition · London', steps=[dict(label='Route', at=6200), dict(label='Payment', at=9800), dict(label='Received', at=14600)]),
          dict(name='Visas · UK', steps=[dict(label='Documents', at=7200), dict(label='Form', at=12000), dict(label='Appointment', at=18200)]),
          dict(name='Hermès Kelly · Paris', steps=[dict(label='Boutique', at=8200), dict(label='Reserved', at=15600), dict(label='Handed over', at=22000)])]),
)

RU = dict(
 lang='ru', path='/ru/', title='Orbiq · Консьерж без границ',
 desc='Orbiq берет задачи, которые решаются через нужных людей: резидентство Монако, Le Rosey, Patek Philippe без листа ожидания, семейные трасты, Charité, Sotheby’s и Christie’s.',
 og='og-orbic-ru.png',
 nav1='Услуги', nav2='Почему сейчас', nav3='Сравнение', nav4='Компании',
 langchip='<a class="chip" href="/" hreflang="en" lang="en" aria-label="English version">EN</a>',
 motion_on='Движение: вкл', kick='Личный консьерж', h1b='без границ',
 lead='Любая задача в&nbsp;любой стране. Быстро и&nbsp;безупречно.',
 k1='всегда на&nbsp;связи', k2='личная сеть агентов на&nbsp;клиента', k3='своя визовая лицензия',
 bx_h='Задачи через границу', bx_live='Личная сеть агентов в работе', bx_aria='Задачи пересекают границу и выполняются: переводы, ВНЖ, трасты, школы, клиники, документы',
 bx_a='Запрос', bx_b='Готово', bx_line='Граница',
 bx_items=None,
 bxf1k='Своя лицензия', bxf1v='Визы · Сингапур', bxf2k='Через партнеров', bxf2v='Трасты, Patek, Hermès, Sotheby’s',
 ticker=ticker(['Orbiq', 'консьерж без границ', 'Резидентство Монако', 'Hermès Birkin', 'Le Rosey', 'Patek Philippe', 'семейные трасты', 'Sotheby’s', 'Charité', 'Gulfstream G700', 'сапфиры Gübelin', '24/7']),
 s0_m='00 · Услуги', s0_h='Все, что нужно семье в&nbsp;разных странах',
 s0_lead='Капитал, резидентство, образование, здоровье и&nbsp;лекарства, коллекции и&nbsp;события. Визы оформляет наш визовый центр с&nbsp;лицензией в&nbsp;Сингапуре. Остальное ведут партнеры, которых подбираем под каждую задачу.',
 xb=xb([('Своя лицензия · VisaTO', 'Визы и&nbsp;ВНЖ', 'Туристические, рабочие и семейные визы, вид на жительство. Сингапур, дальше Дубай, Таиланд, Вьетнам, Австралия'),
        ('Через партнеров', 'Резидентство и&nbsp;гражданство', 'Резидентство Монако и Сингапура, Golden Visa ОАЭ, Швейцария по паушальному налогу, второе гражданство для семьи'),
        ('Финансы', 'Деньги через границу', 'Счета в частных банках Женевы и Сингапура, оплата учебы, клиник и сделок за границей'),
        ('Финансы', 'Трасты и&nbsp;наследство', 'Семейные трасты и фонды в Лихтенштейне и Швейцарии через лицензированных партнеров: капитал под защитой и переходит детям и внукам'),
        ('Аналитика', 'Решения для семьи', 'Сравнение стран для переезда, налогов, районов и школ. Готовый разбор с вариантами и цифрами'),
        ('Образование', 'Будущее детей', 'Школа и университет под характер ребенка: Le Rosey, Eton, Оксфорд, Лига плюща'),
        ('Здоровье', 'Врачи и&nbsp;лекарства', 'Второе мнение из Charité и Mayo Clinic, хирурги Сеула, Clinique La Prairie. Редкий препарат: находим страну, где он есть, и получение через клинику по рецепту'),
        ('Через партнеров', 'Частные джеты', 'Gulfstream G700, Bombardier Global 7500, Dassault Falcon 8X для всей семьи'),
        ('Коллекции', 'Часы, камни, монеты', 'Patek Philippe, Audemars Piguet, F.P. Journe с проверкой подлинности; бриллианты, сапфиры и изумруды с сертификатами GIA и Gübelin; редкие монеты; Hermès Birkin и Kelly'),
        ('Искусство', 'Sotheby’s и&nbsp;Christie’s', 'Подбор лота, торги Sotheby’s, Christie’s и Phillips, хранение коллекции во фрипорте Женевы'),
        ('События', 'Звезды и&nbsp;события', 'Ужин с Ленни Кравицем, встреча с Джастином Бибером, прием у Леди Гаги, показ Chanel Haute Couture, Гран-при Монако'),
        ('Недвижимость', 'Вне рынка', 'Виллы и пентхаусы, которых нет в открытой продаже: Марбелья, Монако, One Hyde Park в Лондоне')]),
 syn=syn([('Скорость', 'Личная сеть AI-агентов', 'Под каждого клиента разворачиваем свою сеть агентов. Они ведут все задачи параллельно, сверяют документы двух стран и не пропускают ни одного срока.'),
          ('Доступ', 'Партнеры с лицензией в каждой стране', 'Трастовые, платежные и юридические компании, визовые центры. Подбираем и проверяем под каждую задачу.'),
          ('Качество', 'Один чат на все', 'Личный менеджер и сеть агентов в одном чате. Статусы, документы и сроки собраны в одной переписке.')]),
 s1_m='01 · Почему сейчас', s1_h='Границы стали выше',
 p1_n='Боль 1', p1_h='Деньги и людей стало сложнее перемещать', p1_p='Каждый год приносит новые ограничения:',
 p1_bars=bars(['Переводы за границу идут неделями и зависают', 'Банки закрывают счета без объяснений', 'Прямых рейсов меньше, маршруты длиннее', 'Отказы в визах и очереди в консульствах', 'Правила ВНЖ и гражданства меняются каждый год', 'Капиталу нужна защита в нескольких юрисдикциях']),
 p2_n='Боль 2', p2_h='Сроки остаются прежними', p2_p='Учеба, операция, сделка, семейное событие: дата назначена, маршрут меняется каждый месяц',
 p3_n='Боль 3', p3_h='Консьерж банка работает в&nbsp;правилах своего банка',
 p3_steps=steps(['<b>Стандарт.</b> Рестораны, отели, билеты. С этим справляется любой консьерж.', '<b>Нестандарт.</b> Деньги, документы, люди и вещи через границу. Консьерж банка остается в правилах и лимитах своего банка.', '<b>Orbiq.</b> Партнеры во многих странах и личная сеть агентов клиента. У каждой задачи свой маршрут, и он короче.']),
 p3_seg_aria='Пример', p3_seg1='Пример: деньги', p3_seg2='Пример: визы',
 tail_aria='Запросы по типу: стандартные справа, нестандартные слева', tail_core='СТАНДАРТНЫЕ ЗАПРОСЫ', tail_tail='НЕСТАНДАРТНЫЕ ЗАДАЧИ',
 tail_bl='НЕСТАНДАРТ · КАЖДАЯ ЗАДАЧА ОСОБАЯ', tail_br='СТАНДАРТ · КАЖДЫЙ ДЕНЬ',
 cf_n='Одна семья · 30 секунд', cf_h='Три задачи через границу в&nbsp;одном чате', cf_p='Так выглядит работа: один запрос, личная сеть агентов и партнеры в двух странах, статус каждой задачи в чате.',
 cf_playing='Ролик: идет', cf_paused='Ролик: пауза', cf_replay='Сначала', cf_online='на связи 24/7', cf_board='Задачи · онлайн', cf_demo='Демо',
 s2_m='02 · Сравнение', s2_h='Консьерж банка и&nbsp;Orbiq', s2_seg_aria='Консьерж', s2_seg1='Консьерж банка',
 s2_aria='Доля решенных задач по типу задачи: консьерж банка и Orbiq', s2_cross='ПРЕДЕЛ ПРАВИЛ БАНКА', s2_round='ORBIQ НАХОДИТ МАРШРУТ',
 s2_revT='ЗАДАЧИ РЕШЕНЫ', s2_riskT='ЗАДАЧИ БЕЗ РЕШЕНИЯ', s2_l1='Решенные задачи', s2_l2='Задачи без решения', s2_l3='Схема без масштаба',
 s3_m='03 · Как идет задача', s3_h='Один запрос, три шага', s3_p='Каждый шаг виден в чате: статус, документы, срок.',
 s3_aria='Задача идет в три шага: запрос, маршрут, результат', s3_l1='ЗАПРОС В ЧАТЕ', s3_l2='МАРШРУТ И ПАРТНЕРЫ', s3_l3='ГОТОВО И ОТЧЕТ', s3_step='Шаг',
 s4_h='Ком<span>пании</span>',
 s4_k=pk([('SG', 'лицензия визового центра'), ('24/7', 'всегда на связи'), ('12', 'направлений услуг')]),
 s4_lead='Под каждое направление Orbiq строит отдельную компанию со своей лицензией и командой.',
 v_no='01 · Визы', v_st='Старт: Сингапур', v_one='Визовый центр с&nbsp;лицензией в&nbsp;Сингапуре. Дальше Дубай, Таиланд, Вьетнам и&nbsp;Австралия. Агенты собирают документы и&nbsp;ведут каждую заявку.',
 v_mk0='$15,2', v_mk1='млрд → $27,5 млрд к&nbsp;2034', v_mk2='мировой рынок визового сервиса, 2025',
 v_t1k='Лицензия', v_t1='Визовый центр с&nbsp;лицензией в&nbsp;Сингапуре', v_t2k='Спрос', v_t2='Виза нужна в&nbsp;каждой международной поездке',
 v_aria='Из Сингапура AI-агент оформляет визы в страны мира', v_cnt='ОФОРМЛЕНО ВИЗ · ДЕМО',
 m_no='02 · AdTech · трафик для группы', m_st='Прибыль $1,7 млн', m_one='Монетизация сайтов.<br>Клиенты — паблишеры, владельцы сайтов. Они зарабатывают на&nbsp;30–80% больше за&nbsp;счет технологий MAST.<br>Ноль сотрудников: всю работу делают AI&#8209;агенты MAST.',
 m_mk0='$134,8', m_mk1='млрд', m_mk2='программатик-реклама только в США, 2024',
 m_t1k='Трекшн', m_t1='Прибыль $1,7&nbsp;млн, оценка $7&nbsp;млн', m_t2k='Роль', m_t2='Платный трафик для всех компаний группы',
 m_aria='MAST подключает сайты паблишеров к рекламным сетям Google, Amazon, Microsoft, Magnite и Taboola, доход паблишеров растет',
 m_lw='САЙТЫ ПАБЛИШЕРОВ', m_ln='РЕКЛАМНЫЕ СЕТИ', m_li='ДОХОД ПАБЛИШЕРОВ', m_lc='САЙТОВ ПОДКЛЮЧЕНО · ДЕМО',
 j_m='Orbiq · консьерж без границ', j_h='Задачи через границу <span>принимаем в&nbsp;Telegram</span>',
 j_p='Резидентство Монако, Le Rosey, кашмирский сапфир, семейный траст на три поколения. Ответ с маршрутом и сроком приходит в тот же чат.',
 j_btn='Отправить задачу', j_link='Фаундерам с лицензией в новой стране: строим компании вместе',
 j_slots=slots(['Монако', 'Трасты', 'Le Rosey', 'Patek', 'Hermès', 'Любая задача']),
 copy='Скопировать',
 TX="{money:{core:'Рестораны, отели, билеты',tail:'Переводы, платежи, трасты',ex:'<b>Деньги.</b> Отель и ресторан — стандартные запросы. Оплата учебы за границей, поддержка семьи в другой стране, траст для наследников — нестандартные задачи. Orbiq строит под них маршрут с лицензированными партнерами.'},visa:{core:'Билеты и отели',tail:'Визы, ВНЖ, гражданство',ex:'<b>Визы.</b> Билет и отель — стандартные запросы. Виза, ВНЖ, переезд семьи — нестандартные: нужны документы двух стран. Агенты Orbiq собирают документы, визовый центр подает заявление.'}}",
 cost0='ПРЕДЕЛ ПРАВИЛ БАНКА', cost1='ORBIQ · ПАРТНЕРЫ ВО МНОГИХ СТРАНАХ',
 axis="['ОТЕЛЬ','ПЕРЕЛЕТ','ПЕРЕВОД','ВИЗА','ТРАСТ']",
 SIDE="[{t:'Консьерж банка',h:'Работает в правилах одного банка',l:['Стандартные запросы закрывает быстро','Нестандартные задачи упираются в правила и лимиты банка','Набор услуг задает банк']},{t:'Orbiq',h:'Строит маршрут под каждую задачу',l:['Партнеры во многих странах: платежные, юридические, трастовые, визовые','Личная сеть агентов ведет все задачи параллельно',{s:'В одном чате:',u:['статус каждой задачи','документы и сроки','один менеджер на всю семью']}],g:true}]",
 goal='<div class="goal"><span>На связи</span><b class="num">24/7</b><span>один чат на любую задачу</span></div>',
 POOL=['Hermès Birkin', 'Счет в частном банке Женевы', 'Место в Le Rosey', 'Препарат, которого нет в стране', 'Patek Philippe 5711 без листа ожидания', 'Резидентство Монако', 'Второе мнение онколога из Charité', 'Ужин с Ленни Кравицем', 'Семейный траст на три поколения', 'Кашмирский сапфир с сертификатом Gübelin', 'Gulfstream G700 для семьи', 'Подбор университета под характер ребенка', 'Лот Sotheby’s', 'Off-market вилла в Марбелье', 'Rolex Daytona «Paul Newman»', 'Golden Visa ОАЭ на 10 лет', 'Хирург в Сеуле', 'Hermès Kelly', 'Семейный фонд в Лихтенштейне', 'Встреча с Джастином Бибером', 'Розовый бриллиант Argyle', 'Поступление в Eton', 'Доступ к препарату из клинических испытаний', 'Check-up в Mayo Clinic', 'Картина с Christie’s', 'Швейцария по паушальному налогу', 'F.P. Journe Chronomètre Bleu', 'Пентхаус в One Hyde Park', 'Прием у Леди Гаги', 'Koenigsegg Jesko', 'Оплата обучения в Оксфорде за день', 'Clinique La Prairie', 'Монеты Российской империи на торгах', 'Показ Chanel Haute Couture', 'Бирманский рубин', 'Bombardier Global 7500', 'Налоговая стратегия семьи в трех странах', 'Превью Art Basel', 'Audemars Piguet Royal Oak', 'Резидентство Сингапура для семьи', 'Редкое лекарство по рецепту из Швейцарии', 'Lanserhof на Тегернзе', 'Стол на Гран-при Монако', 'Колумбийский изумруд', 'Подготовка к Оксфорду с тьютором', 'Хранение коллекции во фрипорте Женевы', 'Ferrari из лимитированной серии', 'Перевод на сделку в Монако', 'Золотой соверен 1937 года', 'Экспертиза камня в GIA', 'Счет в частном банке Сингапура', 'Личная охрана семьи в поездке', 'Проверка часов перед покупкой', 'Летняя школа в Швейцарии', 'Генетический чек-ап в Цюрихе'],
 CF=dict(started='НАЧАЛИ', done='ГОТОВО ✓', playing='Ролик: идет', paused='Ролик: пауза', tasksAt=4600,
   msgs=[dict(who='c', at=1600, meta='Чт · 21:40', text='Дочь в понедельник начинает учебу в Лондоне. Сегодня нужно оплатить обучение, сделать визы бабушке с дедушкой, чтобы они к ней прилетели, а к ее дню рождения найти Hermès Kelly.'),
         dict(who='o', at=4200, meta='Orbiq · 21:41', text='Берем все три задачи. Статусы появятся здесь.'),
         dict(who='o', at=14600, meta='Orbiq · Пт 09:12', text='Университет подтвердил оплату обучения.'),
         dict(who='o', at=18200, meta='Orbiq · Пт 11:30', text='Бабушка с дедушкой записаны на подачу виз: четверг, 10:00.'),
         dict(who='o', at=22000, meta='Orbiq · Сб 14:20', text='Hermès Kelly 25 в цвете Gold вручена в Лондоне, фото в чате.'),
         dict(who='c', at=25200, meta='Сб · 14:25', text='Спасибо. В следующем месяце займемся трастом для внуков.')],
   tasks=[dict(name='Учеба · Лондон', steps=[dict(label='Маршрут', at=6200), dict(label='Платеж', at=9800), dict(label='Зачислено', at=14600)]),
          dict(name='Визы · UK', steps=[dict(label='Документы', at=7200), dict(label='Анкета', at=12000), dict(label='Запись', at=18200)]),
          dict(name='Hermès Kelly · Париж', steps=[dict(label='Бутик', at=8200), dict(label='Резерв', at=15600), dict(label='Вручена', at=22000)])]),
)

ORIG_TX_EN = re.search(r"var TX=\{visa:.*?\}\};", js, re.S).group(0)

def build(T):
    T=dict(T); T['bx_items']=items(T['POOL'][:12])
    b = body
    for k, v in T.items():
        if isinstance(v, str):
            b = b.replace('{{%s}}' % k, v)
    left = re.findall(r'\{\{\w+\}\}', b)
    assert not left, left
    j = js
    j = j.replace(ORIG_TX_EN, 'var TX=' + T['TX'] + ';')
    j = j.replace("var tex='visa';", "var tex='money';").replace("setTX('visa');", "setTX('money');")
    j = j.replace("'COST OF SERVICE · AI AGENTS':'COST OF SERVICE · PEOPLE'", "'%s':'%s'" % (T['cost1'], T['cost0']))
    # comparison curves
    j = j.replace("function revB(m){return .08+.011*m}function riskB(m){return .035*Math.exp(m/8)}",
                  "function sg(m){return 1/(1+Math.exp(-(m-11)/2.2))}function revB(m){return .9-.78*sg(m)}function riskB(m){return .05+.8*sg(m)}")
    j = j.replace("function revA(m){return m<4?.08+.011*m:.124+Math.pow(m-4,1.62)*.0058}function riskA(m){return .035+.0055*m}",
                  "function revA(m){return .92-.004*m}function riskA(m){return .04+.002*m}")
    j = j.replace("[0,6,12,18,24].forEach(function(m){el('line',{x1:px(m),y1:30,x2:px(m),y2:Y0,stroke:'var(--line)'},ax);el('text',{x:px(m),y:Y0+26,'text-anchor':'middle',class:'svgl',fill:'var(--mute)'},ax).textContent=m?m+' MO':'START'});",
                  "var AXL=%s;[0,6,12,18,24].forEach(function(m,i){el('line',{x1:px(m),y1:30,x2:px(m),y2:Y0,stroke:'var(--line)'},ax);el('text',{x:px(m),y:Y0+26,'text-anchor':i?(i==4?'end':'middle'):'start',class:'svgl',fill:'var(--mute)'},ax).textContent=AXL[i]});" % T['axis'])
    j = j.replace("var cm=15.4;", "var cm=11.33;")
    j = j.replace("$('round').setAttribute('transform','translate('+px(4)+' '+py(revA(4))+')')", "$('round').setAttribute('transform','translate('+px(14)+' '+py(revA(14))+')')")
    j = j.replace("$('revT').setAttribute('y',py(re)+(k>.5?-14:22));$('riskT').setAttribute('x',X1);$('riskT').setAttribute('y',py(ri)+(k>.5?22:-12));",
                  "$('revT').setAttribute('y',py(re)+(k>.5?-14:22));$('riskT').setAttribute('x',X1);$('riskT').setAttribute('y',py(ri)+(k>.5?-12:22));")
    j = re.sub(r"var SIDE=\[.*?\];\n", 'var SIDE=' + T['SIDE'] + ';\n', j, flags=re.S)
    j = j.replace("'<div class=\"goal\"><span>Goal</span><b class=\"num\">$300k+</b><span>round in 3–5 months</span></div>'", "'" + T['goal'] + "'")
    if T['lang'] == 'ru':
        j = j.replace("n=v.toFixed(dec);n=n.replace(/^(\\d+)/,function(m){return m.replace(/\\B(?=(\\d{3})+(?!\\d))/g,',')})",
                      "n=v.toFixed(dec).replace('.',',');n=n.replace(/^(\\d+)/,function(m){return m.replace(/\\B(?=(\\d{3})+(?!\\d))/g,' ')})")
        j = j.replace("'Motion: '+(v?'on':'off')", "'Движение: '+(v?'вкл':'выкл')")
        j = j.replace("tgc.textContent='Copied';setTimeout(function(){tgc.textContent='Copy'},1600)", "tgc.textContent='Скопировано';setTimeout(function(){tgc.textContent='Скопировать'},1600)")
        j = j.replace("tgc.textContent='Selected'", "tgc.textContent='Выделено'")
    assert 'venture' not in j.lower() and '$300k' not in j, 'old text left'
    url = DOM + T['path']
    head = f'''<!doctype html>
<!-- build 2026-11-17 · orbicgroup.com -->
<html lang="{T['lang']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{T['title']}</title>
<meta name="description" content="{T['desc']}">
<meta property="og:title" content="{EN['title']}">
<meta property="og:description" content="{EN['desc']}">
<meta property="og:locale" content="en_US">
<meta property="og:url" content="{url}">
<meta property="og:type" content="website">
<meta property="og:image" content="{DOM}/{EN['og']}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FF4D00">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/favicon.svg">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="en" href="{DOM}/">
<link rel="alternate" hreflang="ru" href="{DOM}/ru/">
<link rel="alternate" hreflang="x-default" href="{DOM}/">
<style>body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
</head>
<body>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=TikTok+Sans:opsz,wdth,wght@12..36,75..150,300..900&family=Geist+Mono:wght@400..600&display=swap">
'''
    cf = '<script>window.__CF=' + json.dumps(T['CF'], ensure_ascii=False) + ';window.__POOL=' + json.dumps(T['POOL'], ensure_ascii=False) + ';</script>\n' + pooljs
    libs = '''<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/ScrollTrigger.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/SplitText.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js"></script>
'''
    out = head + css + '\n' + extra + '\n' + b + '\n' + libs + j + '\n' + fav + '\n' + cf + cfjs + '</body></html>\n'
    assert 'ё' not in out
    return out

os.makedirs(B+'site/ru', exist_ok=True); os.makedirs(B+'site/en', exist_ok=True)
open(B+'site/index.html', 'w').write(build(EN))
open(B+'site/ru/index.html', 'w').write(build(RU))
open(B+'site/en/index.html', 'w').write('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex">\n<title>Orbiq · Concierge without borders</title><link rel="canonical" href="https://orbiqgroup.com/">\n<script>location.replace("/"+location.search+location.hash)</script>\n<meta http-equiv="refresh" content="0;url=/"></head><body style="background:#F3F4F2"></body></html>\n')
open(B+'site/robots.txt', 'w').write('User-agent: *\nAllow: /\n')
print('ok')
