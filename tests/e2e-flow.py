# Сквозной сценарий Orbiq на локальном стенде: Founder → партнер → посетитель сайта → клиент → жена клиента.
# Запуск: node tests/e2e-server.mjs 8790 & python3 tests/e2e-flow.py
import json, re, sys, os
from playwright.sync_api import sync_playwright
B = 'http://localhost:8790'
OUT = '/tmp/e2e'; os.makedirs(OUT, exist_ok=True)
R = []
def ok(name, cond, info=''):
    R.append((name, bool(cond), info)); print(('PASS ' if cond else 'FAIL ') + name + (' · ' + str(info) if info else ''), flush=True)
def errs(pg, bag): pg.on('pageerror', lambda e: bag.append(str(e)))
with sync_playwright() as p:
    br = p.chromium.launch()
    # ---------- Founder ----------
    oc = br.new_context(viewport={'width': 1360, 'height': 900}); op = oc.new_page(); oe = []; errs(op, oe)
    r = oc.request.post(B + '/api/crm/?r=auth/request', data={'email': 'owner@e2e.test'}, headers={'Origin': B}).json()
    ok('owner: ссылка входа', r.get('test_link'), r)
    op.goto(r['test_link'].replace('https://localhost:8790', B)); op.wait_for_timeout(800)
    k = oc.request.post(B + '/api/crm/?r=auth/owner-key', data={'key': 'e2e-admin-key'}, headers={'Origin': B}); ok('owner: ключ', k.status == 200, k.status)
    op.goto(B + '/crm/#/partners'); op.wait_for_timeout(1500); op.screenshot(path=OUT + '/01-owner-partners.png')
    btn = op.locator('[data-a="pinvite"], [data-a="pinv2"], button:has-text("Добавить партнера")').first
    ok('owner: кнопка пригласить', btn.count() > 0)
    btn.click(); op.wait_for_timeout(600)
    op.fill('#pin', 'Егор'); op.fill('#pie', 'egor.matveev@e2e.test'); op.fill('#pph', '+7 968 715-11-88')
    op.screenshot(path=OUT + '/02-owner-invite-form.png')
    op.click('#pigo'); op.wait_for_timeout(1500)
    op.click('#pisend'); op.wait_for_timeout(1500); op.screenshot(path=OUT + '/03-owner-invite-done.png')
    links = op.locator('#pires').inner_text()
    inv = re.search(r'https?://\S*pinv\S*', links); site = re.search(r'https?://localhost:8790/[a-z][a-z0-9-]{1,23}/?(?=\s|$)', links)
    ok('owner: ссылка входа партнера', inv, links[:200]); ok('owner: короткая ссылка для клиентов', site, site and site.group(0)); ok('owner: сообщение с двумя ссылками', op.locator('#pires [data-a=plcopy]').count() > 0)
    inv = inv.group(0).replace('https://localhost:8790', B) if inv else ''; site = site.group(0).replace('https://localhost:8790', B) if site else ''
    # ---------- Партнер ----------
    pc = br.new_context(viewport={'width': 1360, 'height': 900}); pp = pc.new_page(); pe = []; errs(pp, pe)
    pp.goto(inv); pp.wait_for_timeout(2500); pp.screenshot(path=OUT + '/04-partner-first.png')
    ok('partner: попал в знакомство', '#/welcome' in pp.url and pp.locator('.wl-hero').count() > 0, pp.url)
    pp.screenshot(path=OUT + '/04b-welcome.png', full_page=True)
    pp.locator('[data-a=wlsite]').click(); pp.wait_for_timeout(1200)
    ok('partner: из знакомства в кабинет', '#/site' in pp.url, pp.url)
    pp.evaluate("location.hash='#/site'"); pp.locator('[data-a=howto]').first.click() if pp.locator('[data-a=howto]').count() else None; pp.wait_for_timeout(1000)
    ok('partner: «Как это работает» открывает знакомство', '#/welcome' in pp.url, pp.url)
    for i in range(10):
        if pp.locator('.tour').count() == 0: break
        pp.screenshot(path=OUT + '/05-tour-%d.png' % i)
        nx = pp.locator('.tour-tip button').last
        if nx.count(): nx.click(); pp.wait_for_timeout(700)
    pp.goto(B + '/crm/#/site'); pp.wait_for_timeout(1500)
    ok('partner: ссылка сайта видна', pp.locator('.site-u').count() and '/egor' in pp.locator('.site-u').inner_text(), pp.locator('.site-u').inner_text() if pp.locator('.site-u').count() else '')
    ok('partner: счетчик старта', pp.locator('.trp').count() > 0)
    pp.fill('#qif input[name=alias]', 'Андрей'); pp.fill('#qif input[name=email]', 'andrey@e2e.test'); pp.click('#qif [type=submit]'); pp.wait_for_timeout(1500)
    pp.screenshot(path=OUT + '/06-partner-invite.png')
    m = re.search(r'https?://\S*/i/\?t=[A-Za-z0-9_-]+', pp.locator('#qir').inner_text())
    ok('partner: личная ссылка клиенту', m); cinv = m.group(0).replace('https://localhost:8790', B) if m else ''
    # ---------- Загрузка клиентов списком и рекомендации ----------
    pp.goto(B + '/crm/#/clients'); pp.wait_for_timeout(1500); pp.locator('[data-a=bulk]').first.click(); pp.wait_for_timeout(800)
    ok('bulk: задание для своей нейросети', pp.locator('.aiown').count() > 0)
    pp.fill('#blk', 'Иван Петров, 52 года, +7 917 000-00-00, логистика, капитал около 20 млн долларов, ищет доходность в долларах выше депозита\nМарина Соколова, 41, ivanova@mail.ru, сеть клиник, хочет ВНЖ в ОАЭ и школу для детей\nОлег, 60 лет, агробизнес, интересуется вином и яхтами, у него украли криптовалюту')
    pp.wait_for_timeout(400); pp.screenshot(path=OUT + '/06b-bulk.png'); pp.click('#blkgo'); pp.wait_for_timeout(9000)
    ok('bulk: переход в рекомендации', '#/reco' in pp.url, pp.url)
    pp.screenshot(path=OUT + '/06c-reco.png', full_page=True)
    rtxt = pp.locator('.reco-l').inner_text() if pp.locator('.reco-l').count() else ''
    ok('reco: карточки клиентов', pp.locator('.reco').count() >= 3, pp.locator('.reco').count())
    ok('reco: фамилии и контакты удалены', 'Петров' not in rtxt and '917' not in rtxt and 'mail.ru' not in rtxt)
    ok('reco: есть что предложить', pp.locator('.reco-p li').count() >= 1, rtxt[:300])
    # ---------- Посетитель сайта партнера ----------
    vc = br.new_context(viewport={'width': 390, 'height': 844}); vp = vc.new_page(); ve = []; errs(vp, ve)
    vp.goto(site); vp.wait_for_timeout(2000); vp.screenshot(path=OUT + '/07-visitor-home.png')
    ok('visitor: плашка партнера', 'Егор' in (vp.locator('.plk-rib').inner_text() if vp.locator('.plk-rib').count() else ''))
    vp.goto(B + '/journal/asymmetry/'); vp.wait_for_timeout(1800)
    ok('visitor: асимметрия первая в меню', vp.locator('#ms a').first.get_attribute('href')=='/journal/asymmetry/')
    vp.locator('a.dl-c').first.click(); vp.wait_for_timeout(1500); vp.screenshot(path=OUT + '/08-visitor-deal.png')
    cta = vp.locator('a.cta:visible').first; ok('visitor: кнопка «Связаться с Егором»', 'Егором' in cta.inner_text(), cta.inner_text())
    cta.click(); vp.wait_for_timeout(600); ok('visitor: шаг 1 регистрация', 'регистрация' in vp.locator('.plk-m').inner_text().lower())
    vp.fill('.plk-m input[name=name]', 'Ольга'); vp.fill('.plk-m input[name=email]', 'olga@e2e.test'); vp.fill('.plk-m input[name=password]', 'olgapass1'); vp.screenshot(path=OUT + '/09a-visitor-register.png')
    vp.click('.plk-m .go'); vp.wait_for_timeout(1800); vp.screenshot(path=OUT + '/09b-visitor-step2.png')
    ok('visitor: шаг 2 отправить Егору', 'Егору' in vp.locator('.plk-m').inner_text(), vp.locator('.plk-m').inner_text()[:200])
    vp.fill('.plk-m textarea', 'Нужно срочно'); vp.click('.plk-m .go'); vp.wait_for_timeout(1500); vp.screenshot(path=OUT + '/09-visitor-sent.png')
    ok('visitor: заявка отправлена + мессенджеры', 'Запрос отправлен' in vp.locator('.plk-m').inner_text() and vp.locator('.plk-m a.wa').count() > 0, vp.locator('.plk-m').inner_text()[:200])
    vw = vc.request.get(B + '/api/crm/?r=client/who').json(); ok('visitor: стал клиентом Егора', vw.get('linked') and vw.get('partner') == 'Егор', vw)
    pp.goto(B + '/crm/#/clients'); pp.wait_for_timeout(500); pp.goto(B + '/crm/#/site'); pp.wait_for_timeout(1500)
    ok('partner: заявка в кабинете', 'olga@e2e.test' in pp.locator('main').inner_text()); pp.screenshot(path=OUT + '/10-partner-lead.png', full_page=True)
    # ---------- Клиент по личной ссылке ----------
    cc = br.new_context(viewport={'width': 1280, 'height': 860}); cp = cc.new_page(); ce = []; errs(cp, ce)
    cp.goto(cinv); cp.wait_for_timeout(2500); cp.screenshot(path=OUT + '/11-client-cover.png')
    ok('client: обложка с именем партнера', 'Егор' in cp.locator('#front').inner_text(), cp.locator('#front').inner_text()[:120])
    cp.click('#openBtn'); cp.wait_for_timeout(1800)
    ok('client: имя и почта уже внесены', 'andrey@e2e.test' in cp.locator('#fStart').inner_text() and cp.locator('#fStart input[name=email][type=hidden]').count() == 1, cp.locator('#fStart').inner_text()[:160])
    cp.screenshot(path=OUT + '/11b-client-password.png')
    tk = cinv.split('t=')[1]; bad = cc.request.post(B + '/api/crm/?r=invite/claim', data={'t': tk, 'name': 'Андрей', 'email': 'wrong@e2e.test', 'password': 'secret123'}, headers={'Origin': B})
    ok('client: чужая почта отклонена', bad.status in (400, 403, 409), bad.status)
    cp.fill('#fStart input[name=password]', 'secret123'); cp.click('#fStart [data-sub]'); cp.wait_for_timeout(3500); cp.screenshot(path=OUT + '/12-client-in.png')
    w = cc.request.get(B + '/api/crm/?r=client/who').json(); ok('client: связан с партнером', w.get('linked') and w.get('partner') == 'Егор', w)
    cp.goto(B + '/journal/asymmetry/'); cp.wait_for_timeout(2000); cp.locator('a.dl-c').nth(1).click(); cp.wait_for_timeout(1200)
    cta = cp.locator('a.cta:visible').first; ok('client: кнопка «Запросить у Егора»', 'Егора' in cta.inner_text(), cta.inner_text())
    cta.click(); cp.wait_for_timeout(500); cp.click('.plk-m .go'); cp.wait_for_timeout(1200); ok('client: запрос отправлен', 'Запрос отправлен' in cp.locator('.plk-m').inner_text())
    s2 = cc.request.post(B + '/api/crm/?r=invite/seat2', data={'relation': 'wife'}, headers={'Origin': B}).json(); ok('client: ссылка для жены', s2.get('link'), s2)
    # выход и вход по паролю
    cc.request.post(B + '/api/j/?r=logout', headers={'Origin': B}); cc.clear_cookies()
    cp.goto(B + '/journal/profile/'); cp.wait_for_timeout(1500); cp.fill('#lg input[name=email]', 'andrey@e2e.test'); cp.click('#lgpw'); cp.fill('#lgp input[name=password]', 'secret123'); cp.click('#lgp button'); cp.wait_for_timeout(2000)
    w2 = cc.request.get(B + '/api/crm/?r=client/who').json(); ok('client: вход по паролю', w2.get('linked'), w2)
    # ---------- Жена ----------
    if s2.get('link'):
        wc = br.new_context(viewport={'width': 390, 'height': 844}); wp = wc.new_page(); we = []; errs(wp, we)
        wp.goto(s2['link'].replace('https://localhost:8790', B)); wp.wait_for_timeout(2200); wp.click('#openBtn'); wp.wait_for_timeout(1500)
        wp.fill('#fStart input[name=name]', 'Мария'); wp.fill('#fStart input[name=email]', 'maria@e2e.test'); wp.fill('#fStart input[name=password]', 'secret456'); wp.click('#fStart [data-sub]'); wp.wait_for_timeout(3000)
        fw = wc.request.get(B + '/api/crm/?r=client/feed').json(); ok('wife: своя лента', fw.get('personal'), str(fw)[:120]); wp.screenshot(path=OUT + '/13-wife.png')
        ww = wc.request.get(B + '/api/crm/?r=client/who').json(); ok('wife: пол f', ww.get('sex') == 'f', ww)
        ok('wife: без ошибок', not we, we)
    # ---------- Карточка клиента у партнера и общий CRM ----------
    pp.goto(B + '/crm/#/clients'); pp.wait_for_timeout(1500)
    pp.locator('text=Андрей').first.click(); pp.wait_for_timeout(2000); pp.locator('#plk').scroll_into_view_if_needed(); pp.wait_for_timeout(800)
    t = pp.locator('#plk').inner_text(); ok('partner: запрос клиента в карточке', 'ЗАПРОСЫ КЛИЕНТА' in t.upper() and 'В ORBIQ' in t.upper(), t[:200]); pp.screenshot(path=OUT + '/14-partner-card.png')
    op.goto(B + '/crm/#/asks'); op.wait_for_timeout(1500); t = op.locator('main').inner_text(); ok('owner: запросы в общем CRM', 'olga@e2e.test' in t or 'Ольга' in t, t[:200]); op.screenshot(path=OUT + '/15-owner-asks.png')
    # ---------- служебный ключ и продление старта ----------
    H={'x-ops-key':'ops-key-e2e-0123456789abcdef0123456789'}
    pl = oc.request.get(B + '/api/crm/?r=partners', headers=H).json(); eg=[x for x in pl.get('partners',[]) if x.get('name')=='Егор']
    ok('ops: список партнеров по ключу', eg, str(pl)[:120])
    ok('ops: старт виден в админке', eg and eg[0].get('startTrial') and eg[0]['startTrial'].get('left') == 10, eg[0].get('startTrial') if eg else '')
    np = oc.request.post(B + '/api/crm/?r=partner/invite', data={'name':'Тест','email':'t2@e2e.test','kind':'networker','phone':'+79000000000','mail':False}, headers=H).json()
    ok('ops: партнер создан без письма, ссылки есть', np.get('link') and np.get('site'), np)
    tr = oc.request.post(B + '/api/crm/?r=partner/trial', data={'pid':eg[0]['id'],'days':7}, headers=H).json(); pl2 = oc.request.get(B + '/api/crm/?r=partners', headers=H).json()
    ok('ops: продление старта', [x for x in pl2['partners'] if x['name']=='Егор'][0]['startTrial']['left'] == 17)
    bad = br.new_context().request.get(B + '/api/crm/?r=partners', headers={'x-ops-key':'wrong-key-wrong-key-wrong-key-wrong'}); ok('ops: чужой ключ не пускает', bad.status in (401,403), bad.status)
    pp.goto(B + '/crm/#/site'); pp.wait_for_timeout(1500); ok('partner: блок Telegram с инструкцией', 'Подключить Telegram' in pp.locator('.tgb').inner_text())
    cr = oc.request.get(B + '/api/crm/?r=cron', headers={'Authorization': 'Bearer cron'}).json(); ok('cron: письмо дня 1', cr.get('drip', 0) >= 1, cr)
    ok('ошибок JS: founder', not oe, oe[:3]); ok('ошибок JS: partner', not pe, pe[:3]); ok('ошибок JS: visitor', not ve, ve[:3]); ok('ошибок JS: client', not ce, ce[:3])
    br.close()
print('\nИТОГ: %d из %d' % (sum(1 for x in R if x[1]), len(R)))
json.dump(R, open(OUT + '/result.json', 'w'), ensure_ascii=False)
