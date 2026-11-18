import json, re, os
B = '/home/claude/orbicgroup/'
css = open(B+'base.css').read()
extra = open(B+'extra.css').read()
body = open(B+'body.html').read()
js = open(B+'base.js').read()
fav = open(B+'favicon.js').read()
cfjs = open(B+'chatfilm.js').read()
pooljs = open(B+'pool.js').read()
formjs = open(B+'form.js').read()
DOM = 'https://orbiqgroup.com'

def items(lst, cls=''):
    LN = [0, 3, 1, 5, 2, 4, 3, 0, 4, 1, 5, 2]
    LS = [14, 17, 15.5, 19, 13, 16.5]
    R0 = [2.1, 9.4, 5.7, 12.3, 0.8, 7.6]
    TT = [LS[LN[i]] for i in range(12)]
    DL = [R0[LN[i]] + (LS[LN[i]] / 2 if i >= 6 else 0) for i in range(12)]
    return ''.join('<div class="bx-it %s" style="--l:%d;--t:%.1fs;--o:%.1fs"><span>%s</span><em>✓</em></div>' % ('v' if i % 4 == 0 else '', LN[i % 12], TT[i % 12], DL[i % 12], x) for i, x in enumerate(lst))

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
 md_m='How we search', md_h='Urgently at&nbsp;any price or&nbsp;without rush at&nbsp;the&nbsp;best one',
 md1_t='Urgent', md1_h='Needed by a&nbsp;date', md1_p='We find exactly this piece or place as fast as possible. No substitutes, no haggling over price.',
 md2_t='No rush', md2_h='The best price', md2_p='We set up dozens of AI&#8209;agents for each request. Every day they check thousands of marketplaces, private sellers and collectors. When the right piece appears at the best price, we let you know at once.',
 st_m='Stories', st_h='She went to&nbsp;London to&nbsp;shop and ended up at&nbsp;Royal Ascot', st_note='Examples of how we work. We never publish real client requests.', st_prev='Back', st_next='Next',
 lang='en', path='/', title='Orbiq · Concierge without borders',
 desc='Orbiq takes tasks that open only through the right people: Monaco residence, Le Rosey, Patek Philippe without a waitlist, family trusts, Charité, Sotheby’s and Christie’s.',
 og='og-orbic-en.png',
 nav1='Services', nav2='Why now', nav3='Comparison', nav4='Companies',
 langchip='<a class="chip" href="/ru/" hreflang="ru" lang="ru" aria-label="Русская версия">RU</a>',
 motion_on='Motion: on', kick='Private concierge', h1b='without borders',
 lead='Monaco residence, Le&nbsp;Rosey, Patek Philippe 5711, Royal Enclosure. Orbiq takes on matters that only the right people can settle, and knows whom to&nbsp;call.',
 k1='always on&nbsp;duty', k2='own AI agent network for each client', k3='own visa license',
 bx_h='Family requests', bx_live='In progress now', bx_aria='Family requests and their status: transfers, residence, trusts, schools, clinics, documents',
 bx_a='Request', bx_b='Done', bx_line='Orbiq',
 bx_items=None,
 bxf1k='Own license', bxf1v='Visas · Singapore', bxf2k='Through partners', bxf2v='Trusts, Patek, Hermès, Sotheby’s',
 ticker=ticker(['Orbiq', 'concierge without borders', 'Monaco residence', 'Hermès Birkin', 'Le Rosey', 'Patek Philippe', 'family trusts', 'Sotheby’s', 'Charité', 'Gulfstream G700', 'Gübelin sapphires']),
 s0_m='00 · Services', s0_h='From a&nbsp;visa to&nbsp;a&nbsp;Patek Philippe',
 s0_lead='Capital, residence, children’s education, health, collections, closed events. For each request we pick partners in the right country.',
 xb=xb([('Residence', 'Monaco, Switzerland, UAE', 'Monaco and Singapore residence, UAE Golden Visa, Swiss lump-sum taxation, a second citizenship for the family'),
        ('Documents', 'Visas and residence permits', 'Tourist, work and family visas, residence permits. We collect the documents, book the appointment and follow the application to the decision'),
        ('Finance', 'Transfers between countries', 'We open accounts at private banks in Geneva and Singapore and help pay for tuition, treatment and deals abroad'),
        ('Finance', 'Trusts and inheritance', 'Family trusts and foundations in Liechtenstein and Switzerland through licensed partners: capital protected and passed to children and grandchildren'),
        ('Capital', 'Private pre-IPO deals', 'Closed rounds and secondary shares of late-stage companies: Stripe, Databricks, Anduril. Licensed partners run the deal'),
        ('Education', 'Schools and universities', 'We find a school and university that suit the child: Le Rosey, Eton, Oxford, the Ivy League'),
        ('Health', 'Doctors and medicines', 'Second opinion from Charité and Mayo Clinic, surgeons in Seoul, Clinique La Prairie. A rare drug: we find the country where it is sold and get it through a clinic with a prescription'),
        ('Flights', 'Private jets', 'Gulfstream G700, Bombardier Global 7500, Dassault Falcon 8X'),
        ('Collecting', 'Watches, stones, toys', 'Patek Philippe, Audemars Piguet, F.P. Journe with authentication; diamonds, sapphires and emeralds with GIA and Gübelin reports; rare coins and collectible toys: Steiff, Be@rbrick, LEGO; Hermès Birkin and Kelly'),
        ('Art', 'Sotheby’s and Christie’s', 'Lot selection, bidding at Sotheby’s, Christie’s and Phillips, collection storage in the Geneva Freeport'),
        ('Events', 'Closed events', 'amfAR Gala in Cannes, Vienna Opera Ball, Chanel Haute Couture, Monaco Grand Prix, Royal Ascot'),
        ('Property', 'Off-market property', 'Villas and penthouses that never reach the market: Marbella, Monaco, One Hyde Park in London')]),
 syn=syn([('Speed', 'Each client has their own AI agents', 'For each client we run separate agents. They handle all matters at once, check the documents of two countries and watch every deadline.'),
          ('Access', 'Licensed people in the right country', 'Trust, payment and legal firms, visa centers. For each matter we pick people we have checked ourselves.'),
          ('Quiet', 'Only the family’s concierge knows its affairs', 'Each partner sees only their part. The site stores no requests, the whole conversation stays in a private chat.')]),
 s1_m='01 · Why now', s1_h='Borders got higher',
 p1_n='Reason 1', p1_h='Moving money and people got harder', p1_p='Each year adds new limits:',
 p1_bars=bars(['Transfers abroad take weeks and get stuck', 'Banks close accounts without explanation', 'Fewer direct flights, longer routes', 'Visa refusals and queues at consulates', 'Residence and citizenship rules change every year', 'Capital needs protection in several jurisdictions']),
 p2_n='Reason 2', p2_h='Deadlines stay the same', p2_p='Tuition, surgery, a deal, a family event: the date is set, the route changes every month',
 p3_n='Reason 3', p3_h='A bank concierge is bound by its bank’s rules',
 p3_steps=steps(['<b>Standard.</b> Restaurants, hotels, tickets. Any concierge handles them.', '<b>Non&#8209;standard.</b> Money, documents, people and things between countries. A bank concierge stays within the rules and limits of its bank.', '<b>Orbiq.</b> Partners in many countries and the client’s personal agent network. Each task gets its own route, faster.']),
 p3_seg_aria='Example', p3_seg1='Example: money', p3_seg2='Example: visas',
 tail_aria='Requests by type: standard on the right, non-standard on the left', tail_core='STANDARD REQUESTS', tail_tail='NON-STANDARD TASKS',
 tail_bl='NON-STANDARD · EACH TASK IS UNIQUE', tail_br='STANDARD · EVERY DAY',
 cf_n='One family · 30 seconds', cf_h='School in&nbsp;London, a&nbsp;visa and a&nbsp;Kelly in&nbsp;one chat', cf_p='A mother sends one message. Agents and partners in two countries take on the matters, and the status of each is right in the chat.',
 cf_playing='Film: playing', cf_paused='Film: paused', cf_replay='Replay', cf_online='online', cf_board='Status', cf_demo='Demo',
 s2_m='02 · Comparison', s2_h='A bank concierge and&nbsp;Orbiq', s2_seg_aria='Concierge', s2_seg1='Bank concierge',
 s2_aria='Share of tasks solved by task type: a bank concierge and Orbiq', s2_cross='LIMIT OF BANK RULES', s2_round='ORBIQ FINDS A ROUTE',
 s2_revT='TASKS SOLVED', s2_riskT='TASKS LEFT UNSOLVED', s2_l1='Tasks solved', s2_l2='Tasks left unsolved', s2_l3='Diagram not to scale',
 s3_m='03 · How a task goes', s3_h='One request, three steps', s3_p='Each step is visible in the chat: status, documents, deadline.',
 s3_aria='A task goes in three steps: request, route, result', s3_l1='REQUEST IN CHAT', s3_l2='ROUTE AND PARTNERS', s3_l3='DONE AND REPORTED', s3_step='Step',
 s4_h='Com<span>panies</span>',
 s4_k=pk([('SG', 'visa center license'), ('12', 'service lines')]),
 s4_lead='For each service line Orbiq builds a separate company with its own license and team.',
 v_no='01 · Visas', v_st='Start: Singapore', v_one='Visa center with a&nbsp;license in&nbsp;Singapore. Next: Dubai, Thailand, Vietnam and&nbsp;Australia. Agents collect documents and track every application.',
 v_mk0='$15.2', v_mk1='B → $27.5B by&nbsp;2034', v_mk2='global visa services market, 2025',
 v_t1k='License', v_t1='Visa center license in&nbsp;Singapore', v_t2k='Demand', v_t2='Every international trip needs a&nbsp;visa',
 v_aria='From Singapore, an AI agent processes visas to countries worldwide', v_cnt='VISAS PROCESSED · DEMO',
 m_no='02 · AdTech · traffic for the group', m_st='Profit $1.7M', m_one='Website monetization.<br>Clients are publishers, website owners. They earn 30–80% more thanks to&nbsp;MAST technology.<br>Zero staff: MAST AI&#8209;agents do all the work.',
 m_mk0='$134.8', m_mk1='B', m_mk2='programmatic advertising in the US alone, 2024',
 m_t1k='Results', m_t1='Profit $1.7M, valuation $7M', m_t2k='Role', m_t2='Paid traffic for all companies of&nbsp;the&nbsp;group',
 m_aria='MAST connects publisher websites to the ad networks of Google, Amazon, Microsoft, Magnite and Taboola, publisher income grows',
 m_lw='PUBLISHER WEBSITES', m_ln='AD NETWORKS', m_li='PUBLISHER INCOME', m_lc='WEBSITES CONNECTED · DEMO',
 j_m='Orbiq · concierge without borders', j_h='Some places sell no&nbsp;tickets <span>Royal Enclosure, Bal des&nbsp;Débutantes</span>',
 j_p='Clients write in&nbsp;Telegram what they need and by&nbsp;when. The plan and dates come back to&nbsp;the same chat.',
 j_btn='Write in Telegram', j_link='Founders with a license in a new country: we build companies together',
 j_slots=slots(['Monaco', 'Trusts', 'Le Rosey', 'Patek', 'Hermès', 'Any task']),
 copy='Copy',
 # JS
 TX="{money:{core:'Restaurants, hotels, tickets',tail:'Transfers, payments, trusts',ex:'<b>Money.</b> A hotel and a restaurant are standard requests. Tuition abroad, support for family in another country, a trust for heirs are non-standard tasks. Orbiq builds a route for them with licensed partners.'},visa:{core:'Tickets and hotels',tail:'Visas, residence, citizenship',ex:'<b>Visas.</b> A ticket and a hotel are standard requests. A visa, a residence permit, a family move are non-standard: they need the documents of two countries. Orbiq agents collect the documents, the visa center files the application.'}}",
 cost0='LIMIT OF BANK RULES', cost1='ORBIQ · PARTNERS IN MANY COUNTRIES',
 axis="['HOTEL','FLIGHT','TRANSFER','VISA','TRUST']",
 SIDE="[{t:'Bank concierge',h:'Works within the rules of one bank',l:['Handles standard requests fast','Non-standard tasks hit the rules and limits of the bank','The bank sets the list of services']},{t:'Orbiq',h:'Builds a route for each task',l:['Partners in many countries: payment, legal, trust, visa','A personal agent network runs all tasks in parallel',{s:'In one chat:',u:['status of each task','documents and deadlines','one manager for the whole family']}],g:true}]",
 goal='<div class="goal"><span>On duty</span><b class="num">1</b><span>one chat for any task</span></div>',
 cta='See the stories', cta_short='Contact',
 trust1='One person sees the request',
 trust2='',
 t_m='Request',
 t_h='Write to a&nbsp;personal concierge',
 t_p='Three short steps. The text can be dictated by voice.',
 t_trust='<li><div><b>Confidential</b><span>The site stores no requests. Only the personal concierge sees them.</span></div></li><li><div><b>No sign-up</b><span>Name is optional. Introductions can wait until the first conversation.</span></div></li>',
 t_q1='How can we help?',
 t_chips='<button type="button">Capital and trusts</button><button type="button">Residence</button><button type="button">Children and education</button><button type="button">Health and medicines</button><button type="button">Watches and stones</button><button type="button">Hermès bags</button><button type="button">Art</button><button type="button">Closed events</button><button type="button">Property</button><button type="button">Other</button>',
 t_q2='The request in a few words',
 t_ph='For example: a place at a Swiss boarding school for a 12-year-old son, September 2027',
 t_mic='Dictate',
 t_back='← Back',
 t_next='Next',
 t_q3='Where to reply?',
 t_name='Name, optional',
 t_tg='Send via Telegram',
 t_mail='Send by email',
 t_note='Telegram or email opens with the text ready, just press Send.',
 TF=dict(title='Orbiq · request',cat='Area',name='Name',lang='en-US',mic='Dictate',micStop='Stop'),
 POOL=['Hermès Birkin 25 Himalaya', 'Cerebras pre-IPO +2085%', 'Royal Enclosure', 'Patek Philippe 5711 Tiffany', 'Pictet account', 'Le Rosey', 'Ferrari Daytona SP3', 'Clinique La Prairie', 'Monaco residence', 'Pigeon Blood ruby', 'Paddock Club Monaco', 'Kelly 28 Himalaya', 'Royal Oak Jumbo 16202', 'UAE Golden Visa', 'Aiglon College', 'CoreWeave pre-IPO +235%', 'Vienna Opera Ball', 'Koenigsegg Jesko', 'Swiss lump-sum tax', 'Be@rbrick Chanel 1000%', 'Muzo emerald', 'Lanserhof Tegernsee', 'F.P. Journe Chronomètre Bleu', 'Family trust', 'amfAR Cannes', 'Birkin Faubourg', 'Eton College', 'Liechtenstein foundation', 'Steiff Louis Vuitton', 'Gulfstream G700', 'Kashmir sapphire', 'Charité second opinion', 'Chanel Haute Couture show', 'Rolex Daytona Paul Newman', 'Pagani Utopia', 'Medicine from Switzerland', 'Oxford', 'Argyle pink diamond', 'Art Basel VIP', 'Surgeon in Seoul', 'Richard Mille RM 27-04', 'Boba Fett Kenner 1979', 'Mayo Clinic', 'One Hyde Park', 'Deal in Monaco', 'Edward VIII sovereign', 'Bal des Débutantes', 'Bombardier Global 7500', 'Julius Baer account', 'Padparadscha sapphire', 'Geneva Freeport', 'Jumping International de Monte-Carlo', 'Singapore residence', 'Dassault Falcon 8X', 'LEGO Millennium Falcon 10179', 'Paraiba tourmaline', 'Sotheby’s Magnificent Jewels', 'Family security', 'Wimbledon Centre Court', 'Konstantin rouble', 'Christie’s Evening Sale', 'Off-market villa'],
 CF=dict(started='STARTED', done='DONE ✓', playing='Film: playing', paused='Film: paused', tasksAt=4600,
   msgs=[dict(who='c', at=1600, meta='Thu · 21:40', text='My daughter starts university in London on Monday. Today we need to pay the tuition, get visas for her grandparents to visit and find a Hermès Kelly for her birthday.'),
         dict(who='o', at=4200, meta='Orbiq · 21:41', text='Taking on all three. We will post updates here.'),
         dict(who='o', at=14600, meta='Orbiq · Fri 09:12', text='The university confirmed the tuition payment.'),
         dict(who='o', at=18200, meta='Orbiq · Fri 11:30', text='The grandparents are booked to file their visa documents on Thursday at 10:00.'),
         dict(who='o', at=22000, meta='Orbiq · Sat 14:20', text='The Kelly 25 in Gold is with your daughter in London. Photo below.'),
         dict(who='c', at=25200, meta='Sat · 14:25', text='Thank you. Next month: a trust for the grandchildren.')],
   tasks=[dict(name='Tuition · London', steps=[dict(label='Route', at=6200), dict(label='Payment', at=9800), dict(label='Received', at=14600)]),
          dict(name='Visas · Britain', steps=[dict(label='Documents', at=7200), dict(label='Form', at=12000), dict(label='Appointment', at=18200)]),
          dict(name='Hermès Kelly · Paris', steps=[dict(label='Boutique', at=8200), dict(label='Reserved', at=15600), dict(label='Handed over', at=22000)])]),
)

RU = dict(
 md_m='Как мы ищем', md_h='Срочно за&nbsp;любые деньги или&nbsp;без спешки по&nbsp;лучшей цене',
 md1_t='Срочно', md1_h='Нужно к&nbsp;дате', md1_p='Находим именно ту вещь или&nbsp;то место, которое нужно, и&nbsp;как можно быстрее. Без замен и&nbsp;без торга: цена здесь не&nbsp;главное.',
 md2_t='Без спешки', md2_h='Нужна лучшая цена', md2_p='Под каждый запрос настраиваем десятки AI&#8209;агентов. Каждый день они проверяют тысячи маркетплейсов, частных продавцов и&nbsp;коллекционеров. Как только нужная вещь появится по&nbsp;лучшей цене, мы сразу напишем.',
 st_m='Истории', st_h='Она ехала в&nbsp;Лондон за&nbsp;покупками, а&nbsp;попала на&nbsp;Royal Ascot', st_note='Примеры того, как мы работаем. Настоящие запросы клиентов мы не&nbsp;публикуем.', st_prev='Назад', st_next='Дальше',
 lang='ru', path='/ru/', title='Orbiq · Консьерж без границ',
 desc='Orbiq берется за дела, которые решаются только через нужных людей: резидентство Монако, место в Le Rosey, Patek Philippe без листа ожидания, семейный траст, второе мнение Charité, торги Sotheby’s и Christie’s.',
 og='og-orbic-ru.png',
 nav1='Услуги', nav2='Почему сейчас', nav3='Сравнение', nav4='Компании',
 langchip='<a class="chip" href="/" hreflang="en" lang="en" aria-label="English version">EN</a>',
 motion_on='Анимация: вкл', kick='Личный консьерж', h1b='без границ',
 lead='Резидентство Монако, Le&nbsp;Rosey, Patek Philippe 5711, Royal Enclosure. Orbiq берется за&nbsp;дела, которые решаются только через нужных людей, и&nbsp;знает, кому позвонить.',
 k1='', k2='свои AI-агенты у&nbsp;каждого клиента', k3='своя визовая лицензия',
 bx_h='Запросы семей', bx_live='Сейчас в&nbsp;работе', bx_aria='Запросы семей и их статус: переводы, ВНЖ, трасты, школы, клиники, документы',
 bx_a='Запрос', bx_b='Готово', bx_line='Orbiq',
 bx_items=None,
 bxf1k='Своя лицензия', bxf1v='Визы · Сингапур', bxf2k='Через партнеров', bxf2v='Трасты, Patek, Hermès, Sotheby’s',
 ticker=ticker(['Orbiq', 'консьерж без границ', 'резидентство Монако', 'Hermès Birkin', 'Le Rosey', 'Patek Philippe', 'семейные трасты', 'Sotheby’s', 'Charité', 'Gulfstream G700', 'сапфиры Gübelin']),
 s0_m='00 · Услуги', s0_h='От&nbsp;визы до&nbsp;Patek Philippe',
 s0_lead='Капитал, резидентство, учеба детей, здоровье, коллекции, закрытые события. Под каждое дело подбираем партнеров в&nbsp;нужной стране.',
 xb=xb([('Резидентство', 'Монако, Швейцария, ОАЭ', 'Резидентство Монако и Сингапура, Golden Visa ОАЭ, паушальный налог в Швейцарии, второе гражданство для семьи'),
        ('Документы', 'Визы и&nbsp;ВНЖ', 'Туристические, рабочие и семейные визы, вид на жительство. Собираем документы, записываем на подачу и ведем заявку до решения'),
        ('Финансы', 'Переводы между странами', 'Открываем счета в частных банках Женевы и Сингапура. Помогаем оплатить учебу, лечение и сделки за границей'),
        ('Финансы', 'Трасты и&nbsp;наследство', 'Семейные трасты и фонды в Лихтенштейне и Швейцарии. Их оформляют наши партнеры с лицензией, чтобы капитал был защищен и перешел к детям и внукам'),
        ('Капитал', 'Доли до&nbsp;IPO', 'Закрытые раунды и акции крупных частных компаний на вторичном рынке: Stripe, Databricks, Anduril. Сделку ведут партнеры с лицензией'),
        ('Образование', 'Школы и&nbsp;университеты', 'Подбираем школу и университет под характер ребенка: Le Rosey, Eton, Оксфорд, Лига плюща'),
        ('Здоровье', 'Врачи и&nbsp;лекарства', 'Второе мнение врачей Charité и Mayo Clinic, хирурги в Сеуле, Clinique La Prairie. Если редкого лекарства нет в стране, находим, где его продают, и получаем через клинику по рецепту'),
        ('Перелеты', 'Частные самолеты', 'Gulfstream G700, Bombardier Global 7500, Dassault Falcon 8X'),
        ('Коллекции', 'Часы, камни, игрушки', 'Patek Philippe, Audemars Piguet, F.P. Journe с проверкой подлинности. Бриллианты, сапфиры и изумруды с сертификатами GIA и Gübelin. Редкие монеты и&nbsp;коллекционные игрушки: Steiff, Be@rbrick, LEGO. Hermès Birkin и Kelly'),
        ('Искусство', 'Sotheby’s и&nbsp;Christie’s', 'Подбираем лоты, делаем ставки на Sotheby’s, Christie’s и Phillips, храним коллекцию во фрипорте Женевы'),
        ('События', 'Закрытые события', 'Гала amfAR в Каннах, Венский оперный бал, Chanel Haute Couture, Гран-при Монако, Royal Ascot'),
        ('Недвижимость', 'Виллы без объявлений', 'Виллы и пентхаусы, которые продают тихо, без открытой рекламы: Марбелья, Монако, One Hyde Park в Лондоне')]),
 syn=syn([('Скорость', 'Свои AI-агенты у&nbsp;каждого клиента', 'Под каждого клиента запускаем отдельных агентов. Они ведут все дела одновременно, сверяют документы с требованиями обеих стран и следят за каждым сроком.'),
          ('Доступ', 'Свои люди с&nbsp;лицензией в&nbsp;нужной стране', 'Трастовые, платежные и юридические компании, визовые центры. Для каждого дела подбираем тех, кого проверили сами.'),
          ('Тишина', 'О делах семьи знает только ее консьерж', 'Каждый партнер видит только свою часть дела. Сайт не хранит заявки, вся переписка идет в личном чате.')]),
 s1_m='01 · Почему сейчас', s1_h='Жить на&nbsp;несколько стран стало сложнее',
 p1_n='Причина 1', p1_h='Перевести деньги и&nbsp;улететь стало труднее', p1_p='С каждым годом ограничений больше:',
 p1_bars=bars(['Переводы за границу идут неделями и зависают', 'Банки закрывают счета без объяснений', 'Прямых рейсов меньше, дорога длиннее', 'Отказы в визах, очереди в консульствах', 'Правила ВНЖ и гражданства меняются каждый год', 'Капитал приходится защищать сразу в нескольких странах']),
 p2_n='Причина 2', p2_h='А&nbsp;даты прежние', p2_p='Учеба, операция, сделка, семейный праздник. Дата назначена, а дорога к ней меняется каждый месяц',
 p3_n='Причина 3', p3_h='Консьерж банка делает только то, что разрешил банк',
 p3_steps=steps(['<b>Обычное.</b> Рестораны, отели, билеты. С этим справится любой консьерж.', '<b>Сложное.</b> Деньги, документы, переезды и покупки в другой стране. Здесь консьерж банка упирается в правила и лимиты своего банка.', '<b>Orbiq.</b> Партнеры во многих странах и свои AI-агенты у клиента. Для каждого дела свой путь, и он короче.']),
 p3_seg_aria='Пример', p3_seg1='Пример: деньги', p3_seg2='Пример: визы',
 tail_aria='Запросы по типу: обычные справа, сложные слева', tail_core='ОБЫЧНЫЕ ЗАПРОСЫ', tail_tail='СЛОЖНЫЕ ЗАДАЧИ',
 tail_bl='СЛОЖНОЕ · КАЖДЫЙ РАЗ ПО-НОВОМУ', tail_br='ОБЫЧНОЕ · КАЖДЫЙ ДЕНЬ',
 cf_n='Одна семья · 30 секунд', cf_h='Учеба в&nbsp;Лондоне, визы и&nbsp;Kelly в&nbsp;одном чате', cf_p='Мама пишет одно сообщение. Агенты и партнеры в двух странах берутся за дела, а статус каждого виден прямо в чате.',
 cf_playing='Видео: играет', cf_paused='Видео: пауза', cf_replay='Сначала', cf_online='в сети', cf_board='Статус дел', cf_demo='Демо',
 s2_m='02 · Сравнение', s2_h='Консьерж банка и&nbsp;Orbiq', s2_seg_aria='Консьерж', s2_seg1='Консьерж банка',
 s2_aria='Доля решенных задач по типу задачи: консьерж банка и Orbiq', s2_cross='ЗДЕСЬ БАНК ОТКАЗЫВАЕТ', s2_round='ORBIQ НАХОДИТ ПУТЬ',
 s2_revT='РЕШЕНО', s2_riskT='НЕ РЕШЕНО', s2_l1='Решенные задачи', s2_l2='Нерешенные задачи', s2_l3='Схема условная',
 s3_m='03 · Как это работает', s3_h='Три шага в&nbsp;одном чате', s3_p='Каждый шаг виден в чате: статус, документы, срок.',
 s3_aria='Три шага: запрос, план, результат', s3_l1='ЗАПРОС В ЧАТЕ', s3_l2='ПЛАН И ПАРТНЕРЫ', s3_l3='ГОТОВО, ОТЧЕТ В ЧАТЕ', s3_step='Шаг',
 s4_h='Ком<span>пании</span>',
 s4_k=pk([('SG', 'лицензия визового центра'), ('12', 'направлений')]),
 s4_lead='Под каждое направление Orbiq создает отдельную компанию со своей лицензией и командой.',
 v_no='01 · Визы', v_st='Начало: Сингапур', v_one='Визовый центр с&nbsp;лицензией в&nbsp;Сингапуре. Следом Дубай, Таиланд, Вьетнам и&nbsp;Австралия. Агенты собирают документы и&nbsp;ведут каждую заявку.',
 v_mk0='$15,2', v_mk1='млрд → $27,5 млрд к&nbsp;2034', v_mk2='мировой рынок визовых услуг, 2025',
 v_t1k='Лицензия', v_t1='Визовый центр с&nbsp;лицензией в&nbsp;Сингапуре', v_t2k='Спрос', v_t2='Для каждой поездки за&nbsp;границу нужна виза',
 v_aria='AI-агент из Сингапура оформляет визы в разные страны', v_cnt='ОФОРМЛЕНО ВИЗ · ДЕМО',
 m_no='02 · AdTech · трафик для группы', m_st='Прибыль $1,7 млн', m_one='Монетизация сайтов.<br>Клиенты — владельцы сайтов. С&nbsp;технологией MAST они зарабатывают на&nbsp;30–80% больше.<br>Сотрудников нет: всю работу делают AI&#8209;агенты MAST.',
 m_mk0='$134,8', m_mk1='млрд', m_mk2='программатик-реклама только в США, 2024',
 m_t1k='Результат', m_t1='Прибыль $1,7&nbsp;млн, оценка $7&nbsp;млн', m_t2k='Роль', m_t2='Платный трафик для всех компаний группы',
 m_aria='MAST подключает сайты к рекламным сетям Google, Amazon, Microsoft, Magnite и Taboola, доход владельцев сайтов растет',
 m_lw='САЙТЫ', m_ln='РЕКЛАМНЫЕ СЕТИ', m_li='ДОХОД ВЛАДЕЛЬЦЕВ', m_lc='ПОДКЛЮЧЕНО САЙТОВ · ДЕМО',
 j_m='Orbiq · консьерж без границ', j_h='Есть места, куда не&nbsp;продают билеты <span>Royal Enclosure, Bal des&nbsp;Débutantes</span>',
 j_p='Пишут в&nbsp;Telegram, что нужно и&nbsp;к&nbsp;какой дате. План и&nbsp;сроки приходят в&nbsp;тот&nbsp;же чат.',
 j_btn='Написать в Telegram', j_link='Фаундерам с лицензией в новой стране: создаем компании вместе',
 j_slots=slots(['Монако', 'Трасты', 'Le Rosey', 'Patek', 'Hermès', 'Что угодно']),
 copy='Скопировать',
 TX="{money:{core:'Рестораны, отели, билеты',tail:'Переводы, платежи, трасты',ex:'<b>Деньги.</b> Отель и ресторан — обычные запросы. Оплатить учебу за границей, поддержать семью в другой стране, оформить траст для наследников — сложные. Для них Orbiq находит путь вместе с лицензированными партнерами.'},visa:{core:'Билеты и отели',tail:'Визы, ВНЖ, гражданство',ex:'<b>Визы.</b> Билет и отель — обычные запросы. Виза, ВНЖ, переезд семьи — сложные: нужны документы двух стран. Агенты Orbiq собирают документы, визовый центр подает заявление.'}}",
 cost0='ЗДЕСЬ БАНК ОТКАЗЫВАЕТ', cost1='ORBIQ · ПАРТНЕРЫ ВО МНОГИХ СТРАНАХ',
 axis="['ОТЕЛЬ','ПЕРЕЛЕТ','ПЕРЕВОД','ВИЗА','ТРАСТ']",
 SIDE="[{t:'Консьерж банка',h:'Делает то, что разрешил банк',l:['Быстро бронирует рестораны, отели, билеты','Сложное упирается в правила и лимиты банка','Список услуг утверждает банк']},{t:'Orbiq',h:'Находит путь для каждой задачи',l:['Партнеры во многих странах: платежные, юридические, трастовые, визовые','Агенты клиента ведут все дела одновременно',{s:'В одном чате:',u:['статус каждого дела','документы и сроки','один консьерж на всю семью']}],g:true}]",
 goal='<div class="goal"><span>На связи</span><b class="num">1</b><span>один чат для всех дел</span></div>',
 cta='Смотреть истории', cta_short='Написать',
 trust1='Запрос видит только консьерж',
 trust2='',
 t_m='Запрос',
 t_h='Написать личному консьержу',
 t_p='Три коротких шага. Текст можно надиктовать голосом.',
 t_trust='<li><div><b>Конфиденциально</b><span>Сайт не хранит заявки. Запрос видит только личный консьерж.</span></div></li><li><div><b>Без регистрации</b><span>Имя по желанию. Представиться можно при первом разговоре.</span></div></li>',
 t_q1='С чем помочь?',
 t_chips='<button type="button">Капитал и трасты</button><button type="button">Резидентство</button><button type="button">Дети и учеба</button><button type="button">Здоровье и лекарства</button><button type="button">Часы и камни</button><button type="button">Сумки Hermès</button><button type="button">Искусство</button><button type="button">Закрытые события</button><button type="button">Недвижимость</button><button type="button">Другое</button>',
 t_q2='Коротко о запросе',
 t_ph='Например: место в пансионе в Швейцарии для сына 12 лет, сентябрь 2027',
 t_mic='Надиктовать',
 t_back='← Назад',
 t_next='Дальше',
 t_q3='Куда ответить?',
 t_name='Имя (по желанию)',
 t_tg='Отправить в Telegram',
 t_mail='Отправить на почту',
 t_note='Откроется Telegram или почта с готовым текстом. Останется нажать «Отправить».',
 TF=dict(title='Orbiq · запрос',cat='Направление',name='Имя',lang='ru-RU',mic='Надиктовать',micStop='Остановить'),
 POOL=['Hermès Birkin 25 Himalaya', 'Cerebras pre-IPO +2085%', 'Royal Enclosure', 'Patek Philippe 5711 Tiffany', 'Счет в Pictet', 'Le Rosey', 'Ferrari Daytona SP3', 'Clinique La Prairie', 'Резидентство Монако', 'Рубин Pigeon Blood', 'Paddock Club Monaco', 'Kelly 28 Himalaya', 'Royal Oak Jumbo 16202', 'Golden Visa ОАЭ', 'Aiglon College', 'CoreWeave pre-IPO +235%', 'Венский оперный бал', 'Koenigsegg Jesko', 'Паушальный налог Швейцарии', 'Be@rbrick Chanel 1000%', 'Изумруд Muzo', 'Lanserhof Tegernsee', 'F.P. Journe Chronomètre Bleu', 'Семейный траст', 'amfAR Cannes', 'Birkin Faubourg', 'Eton College', 'Фонд в Лихтенштейне', 'Steiff Louis Vuitton', 'Gulfstream G700', 'Кашмирский сапфир', 'Второе мнение Charité', 'Показ Chanel Haute Couture', 'Rolex Daytona Paul Newman', 'Pagani Utopia', 'Препарат из Швейцарии', 'Оксфорд', 'Розовый бриллиант Argyle', 'Art Basel VIP', 'Хирург в Сеуле', 'Richard Mille RM 27-04', 'Boba Fett Kenner 1979', 'Mayo Clinic', 'One Hyde Park', 'Сделка в Монако', 'Соверен Эдуарда VIII', 'Bal des Débutantes', 'Bombardier Global 7500', 'Счет в Julius Baer', 'Сапфир Padparadscha', 'Фрипорт Женевы', 'Jumping International de Monte-Carlo', 'Резидентство Сингапура', 'Dassault Falcon 8X', 'LEGO Millennium Falcon 10179', 'Турмалин Paraiba', 'Sotheby’s Magnificent Jewels', 'Охрана семьи', 'Центральный корт Уимблдона', 'Константиновский рубль', 'Вечерние торги Christie’s', 'Вилла вне продажи'],
 CF=dict(started='НАЧАЛИ', done='ГОТОВО ✓', playing='Видео: играет', paused='Видео: пауза', tasksAt=4600,
   msgs=[dict(who='c', at=1600, meta='Чт · 21:40', text='Дочь в понедельник начинает учебу в Лондоне. Сегодня нужно оплатить обучение. Еще бабушке с дедушкой нужны визы, чтобы они прилетели ее навестить. А к ее дню рождения нужна Hermès Kelly.'),
         dict(who='o', at=4200, meta='Orbiq · 21:41', text='Беремся за все три. Новости будем писать сюда.'),
         dict(who='o', at=14600, meta='Orbiq · Пт 09:12', text='Университет подтвердил оплату.'),
         dict(who='o', at=18200, meta='Orbiq · Пт 11:30', text='Бабушку с дедушкой записали подавать документы на визы в четверг на 10:00.'),
         dict(who='o', at=22000, meta='Orbiq · Сб 14:20', text='Kelly 25 в цвете Gold уже у дочери в Лондоне. Фото ниже.'),
         dict(who='c', at=25200, meta='Сб · 14:25', text='Спасибо. В следующем месяце займемся трастом для внуков.')],
   tasks=[dict(name='Учеба · Лондон', steps=[dict(label='План', at=6200), dict(label='Платеж', at=9800), dict(label='Зачислено', at=14600)]),
          dict(name='Визы · Британия', steps=[dict(label='Документы', at=7200), dict(label='Анкета', at=12000), dict(label='Запись', at=18200)]),
          dict(name='Hermès Kelly · Париж', steps=[dict(label='Бутик', at=8200), dict(label='Резерв', at=15600), dict(label='Передана', at=22000)])]),
)

ORIG_TX_EN = re.search(r"var TX=\{visa:.*?\}\};", js, re.S).group(0)

ORDER=[0,2,3,5,1,4,6,7]
IMGS=['ascot','monaco','kelly','lake','alps','art','watch','preipo']
POS=['50% 30%','50% 50%','50% 40%','50% 50%','50% 50%','50% 40%','60% 50%','50% 50%']
ST_RU=[
('Лондон · июнь','Скачки, куда пускают только по&nbsp;рекомендации','Клиентка собиралась на&nbsp;неделю в&nbsp;Лондон за&nbsp;покупками и&nbsp;в&nbsp;театр. Мы сверили даты и&nbsp;увидели, что на&nbsp;эти дни выпадает Royal Ascot. Билет в&nbsp;Royal Enclosure не&nbsp;купить: новичка должны рекомендовать два члена клуба. Наши партнеры нашли поручителей, а&nbsp;шляпу по&nbsp;дресс-коду ей сшили в&nbsp;лондонской мастерской.','В 14:00 мимо нее проехала королевская процессия'),
('Монако · июль','Подарок мужу, который ездит верхом','Клиентка думала, что подарить мужу на&nbsp;годовщину свадьбы. Муж ездит верхом, и&nbsp;мы предложили поехать на&nbsp;Jumping International de&nbsp;Monte-Carlo. Арена стоит прямо в&nbsp;порту, под княжеским дворцом. Мы забронировали столик у&nbsp;арены и&nbsp;номер с&nbsp;видом на&nbsp;порт.','Призы победителям вручали члены княжеской семьи'),
('Париж','Kelly без листа ожидания','Клиентка хотела Kelly 25 в&nbsp;цвете Gold к&nbsp;своему дню рождения. В&nbsp;бутике предложили подождать, но&nbsp;срок никто не&nbsp;назвал. Мы нашли сумку у&nbsp;проверенного продавца в&nbsp;Париже и&nbsp;отдали ее на&nbsp;независимую экспертизу.','В&nbsp;день рождения сумку привезли ей в&nbsp;отель на&nbsp;авеню Монтень'),
('Монтре · Швейцария','Неделя для себя на&nbsp;Женевском озере','Клиентка устала и&nbsp;хотела восстановиться, но&nbsp;так, чтобы это не&nbsp;было похоже на&nbsp;больницу. Мы подобрали ей программу долголетия в&nbsp;Clinique La&nbsp;Prairie: анализы, врачи, сон и&nbsp;питание. В&nbsp;аэропорту Женевы ее встретили водитель и&nbsp;переводчик.','За&nbsp;семь дней ей не&nbsp;пришлось сделать ни&nbsp;одного звонка'),
('Гштаад · январь','Школа, которая зимой уезжает в&nbsp;горы','Родители выбирали школу для дочери. Мы рассказали им про Le&nbsp;Rosey: осенью и&nbsp;весной дети учатся в&nbsp;Ролле, а&nbsp;зимой вся школа переезжает в&nbsp;Гштаад. Мы свозили семью в&nbsp;оба кампуса и&nbsp;устроили встречу с&nbsp;консультантом по&nbsp;поступлению.','Дочь сама попросила подать документы'),
('Нью-Йорк · ноябрь','Картина над камином','Клиентка переехала в&nbsp;новый дом, и&nbsp;стена над камином долго оставалась пустой. Наш арт-консультант отобрал три поздние работы Пикассо с&nbsp;вечерних торгов Christie’s в&nbsp;Нью-Йорке. По&nbsp;каждой он проверил состояние холста и&nbsp;историю владельцев.','Ставку она сделала по&nbsp;телефону, через специалиста Christie’s'),
('Женева','Rolex Datejust, которого нет в&nbsp;витрине','Клиентка искала подарок мужу к&nbsp;50-летию. Он давно хотел Datejust 41 с&nbsp;зеленым циферблатом, но&nbsp;в&nbsp;бутиках таких не&nbsp;было. Наш партнер в&nbsp;Женеве нашел такие часы в&nbsp;полном комплекте, с&nbsp;коробкой и&nbsp;документами, а&nbsp;независимый часовщик проверил механизм.','Часы успели к&nbsp;юбилейному ужину'),
('Цюрих · сентябрь','Доля в&nbsp;компании, о&nbsp;которой все время говорит сын','Сын клиентки работает с&nbsp;данными и&nbsp;часто рассказывает о&nbsp;Databricks. Акции компании на&nbsp;бирже не&nbsp;продаются. Наш партнер с&nbsp;лицензией в&nbsp;Цюрихе нашел акционера, готового продать часть своей доли. Компания одобрила сделку, и&nbsp;долю оформили на&nbsp;семейный траст.','За ужином сын спросил, откуда она знает его любимую компанию'),
]
ST_EN=[
('London · June','Races you enter only by&nbsp;sponsorship','She was planning a&nbsp;week in&nbsp;London for shopping and the theatre. We checked her dates and saw they fell on&nbsp;Royal Ascot. Royal Enclosure badges are not for sale: two members must sponsor a&nbsp;newcomer. Our partners found the sponsors, and a&nbsp;London atelier made her a&nbsp;hat to&nbsp;the dress code.','At 2&nbsp;pm the Royal Procession passed by'),
('Monaco · July','A gift for a&nbsp;husband who rides','She was wondering what to&nbsp;give her husband for their anniversary. He rides, so we suggested Jumping International de&nbsp;Monte-Carlo. The arena sits right in&nbsp;the port, below the Prince’s Palace. We booked a&nbsp;table by&nbsp;the arena and a&nbsp;room overlooking the port.','Members of&nbsp;the princely family presented the prizes'),
('Paris','Kelly without a&nbsp;waitlist','She wanted a&nbsp;Kelly 25 in&nbsp;Gold for her birthday. The boutique asked her to&nbsp;wait but could not say how long. We found the bag with a&nbsp;trusted seller in&nbsp;Paris and had it independently authenticated.','On her birthday the bag was delivered to&nbsp;her hotel on&nbsp;Avenue Montaigne'),
('Montreux · Switzerland','A week for herself by Lake Geneva','She was tired and wanted to&nbsp;recover, but not in&nbsp;anything that felt like a&nbsp;hospital. We chose a&nbsp;longevity program for her at Clinique La&nbsp;Prairie: tests, doctors, sleep and nutrition. A&nbsp;driver and an&nbsp;interpreter met her at Geneva airport.','In&nbsp;seven days she did not have to&nbsp;make a&nbsp;single call'),
('Gstaad · January','A school that moves to&nbsp;the mountains','Parents were choosing a&nbsp;school for their daughter. We told them about Le&nbsp;Rosey: in&nbsp;autumn and spring the children study in&nbsp;Rolle, and in&nbsp;winter the whole school moves to&nbsp;Gstaad. We took the family to&nbsp;both campuses and set up a&nbsp;meeting with an&nbsp;admissions advisor.','The daughter asked to&nbsp;apply herself'),
('New York · November','A painting over the fireplace','She had moved into a&nbsp;new house, and the wall over the fireplace stayed empty for a&nbsp;long time. Our art advisor picked three late Picasso works from Christie’s New York evening sales and checked the condition and provenance of&nbsp;each.','She bid by phone, through a&nbsp;Christie’s specialist'),
('Geneva','A Rolex Datejust not in&nbsp;the window','She was looking for a&nbsp;gift for her husband’s 50th. He had long wanted a&nbsp;Datejust 41 with a&nbsp;green dial, but the boutiques had none. Our partner in&nbsp;Geneva found one as a&nbsp;full set, with box and papers, and an&nbsp;independent watchmaker checked the movement.','The watch arrived for the anniversary dinner'),
('Zurich · September','A stake in&nbsp;the company her son always talks about','Her son works with data and often talks about Databricks. The company’s shares are not sold on&nbsp;any exchange. Our licensed partner in&nbsp;Zurich found a&nbsp;shareholder ready to&nbsp;sell part of&nbsp;his stake. The company approved the deal, and the stake went into the family trust.','At dinner her son asked how she knew his favourite company'),
]
def stories(lst):
    return '\n      '.join('<article class="st"><figure><img src="/img/%s.webp" alt="" width="800" height="1000" loading="lazy" decoding="async" style="object-position:%s"><figcaption class="mono">%s</figcaption></figure><div class="st-b"><h3>%s</h3><p>%s</p><b>%s</b></div></article>' % (IMGS[i], POS[i], a, b, c, d) for i, (a, b, c, d) in [(k, lst[k]) for k in ORDER])

def build(T):
    T=dict(T); T['bx_items']=items(T['POOL'][:12]); T['stories']=stories(ST_RU if T.get('st_m')=='Истории' else ST_EN)
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
        j = j.replace("'Motion: '+(v?'on':'off')", "'Анимация: '+(v?'вкл':'выкл')")
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
<meta property="og:title" content="{T['title']}">
<meta property="og:description" content="{T['desc']}">
<meta property="og:locale" content="{'ru_RU' if T['lang']=='ru' else 'en_US'}">
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
<link rel="preload" href="/fonts/TikTokSans-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/TikTokSans-cyrillic.woff2" as="font" type="font/woff2" crossorigin>
<style>@@FONTCSS@@body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
</head>
<body>

'''
    cf = '<script>window.__CF=' + json.dumps(T['CF'], ensure_ascii=False) + ';window.__POOL=' + json.dumps(T['POOL'], ensure_ascii=False) + ';window.__TF=' + json.dumps(T['TF'], ensure_ascii=False) + ';</script>\n' + pooljs + formjs
    libs = '''<script src="/js/gsap.min.js"></script>
<script src="/js/ScrollTrigger.min.js"></script>
<script src="/js/SplitText.min.js"></script>
<script src="/js/lenis.min.js"></script>
'''
    head = head.replace('@@FONTCSS@@', open(B+'site/fonts/fonts.css').read())
    out = head + css + '\n' + extra + '\n' + b + '\n' + libs + j + '\n' + fav + '\n' + cf + cfjs + '</body></html>\n'
    assert 'ё' not in out
    return out

os.makedirs(B+'site/ru', exist_ok=True); os.makedirs(B+'site/en', exist_ok=True)
open(B+'site/index.html', 'w').write(build(EN))
open(B+'site/ru/index.html', 'w').write(build(RU))
open(B+'site/en/index.html', 'w').write('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex">\n<title>Orbiq · Concierge without borders</title><link rel="canonical" href="https://orbiqgroup.com/">\n<script>location.replace("/"+location.search+location.hash)</script>\n<meta http-equiv="refresh" content="0;url=/"></head><body style="background:#F3F4F2"></body></html>\n')
open(B+'site/robots.txt', 'w').write('User-agent: *\nAllow: /\n')
print('ok')
