# Orbiq CRM · контракт данных и прав (v1)

Источник требований: `/mnt/user-data/uploads/0165bb3b-Orbiq-Claude.md` (части III–VI). Часть I — слова Владимира, часть II — предложение по коммерции (не утверждено). Этот файл — единый контракт для всех агентов. Меняет его только координатор.

Все тексты интерфейса — русский, без буквы «ё», без «не X, а Y». Во внутреннем кабинете (партнер, владелец) обращение на «вы» допустимо (это рабочий кабинет, не журнал). В клиентских страницах (приглашение, подборка) — по ТЗ: «Иван, это ваша подборка».

## 0. Стек
- Статический сайт на Vercel (репо `/tmp/wt-ed`, ветка `journal-editorial` = превью). Без сборщика: чистые HTML/CSS/JS.
- Новая серверная функция `api/crm.mjs` (`/api/crm?r=<route>`), ядро `api/_crm_core.mjs` (чистые функции: права, проекции, баллы круга, квота, выборка). Хранилище — тот же Upstash Redis (переменные `KV_REST_API_URL/TOKEN`), хелперы как в `api/j.mjs` (kv, CAS-update, LPUSH). Почта — Resend (`RESEND_API_KEY`, отправитель `Orbiq <crm@orbiqgroup.com>`; в тестах `EMAIL_MODE=test` возвращает `test_link`).
- AI: Vercel AI Gateway, `POST https://ai-gateway.vercel.sh/v1/chat/completions`, ключ `AI_GATEWAY_API_KEY`, модель `ENV.CRM_AI_MODEL || 'anthropic/claude-haiku-4.5'`. Без ключа — детерминированный эвристический разбор (для тестов и как резерв).
- Telegram: `TG_BOT_TOKEN` пока нет. Код привязки и отправки пишем, без токена события остаются во «Входящих».
- Тесты: `node tests/crm-*.mjs` с `tests/kvmock.mjs` (мок Redis на fetch). Тестовые данные только вымышленные.

## 1. Роли и состояния
- `owner` — владелец Orbiq. Вход = ссылка из письма на адрес из `CRM_OWNER_EMAILS` (через запятую) **плюс** второй фактор: ключ `ADMIN_KEY` (маршрут `auth/owner-key`). Роль owner выдается только сервером по этим двум условиям, никогда через форму. Сессия owner без подтвержденного ключа = права обычного партнера-нуля (ничего).
- `partner` с `tier`: `candidate` → `trial` → `paid` ; флаг `suspended` (любой tier). Партнера создает только owner (приглашение).
- Клиент (член семьи) — учетная запись журнала (cookie `oj`, `users/<uid>.json`), к CRM-кабинету доступа не имеет.

Сессия CRM: cookie `oc` = подпись HMAC (`SESSION_SECRET`) `{u: uid, r: role, v: sessVer, exp}`. При каждом запросе сервер перечитывает партнера: `suspended` или `sessVer` не совпал → 401. Приостановка увеличивает `sessVer` (все сессии гаснут). Owner: cookie `oc` с `r:'owner'` + `mfa:true` только после `auth/owner-key`; срок 12 ч.

## 2. Ключи Redis
```
crm/p/<pid>.json            партнер {id,email,name,tier,suspended,sessVer,created,invitedBy,tg:{chatId,on:{...}},ical:{tokHash},trial:{start,end,quota:3,used:0},paid:{seats:[...],pay1,pay2Due},categories:[...],lastSeen}
crm/pidx/<emailHash>        pid
crm/pinv/<tokHash>.json     приглашение партнера {pid,email,expires,status:created|used|revoked}
crm/c/<cid>.json            карточка клиента (полная, видит только владелец карточки и owner)
crm/alias/<norm>            cid   (SET NX — уникальность имени по всей CRM)
crm/cidx/all                SET всех cid (не архивных)
crm/cidx/p/<pid>            SET cid партнера
crm/note/<pid>/<cid>.json   личные заметки автора pid к карточке [{id,text,at}]
crm/task/<pid>.json         задачи автора [{id,cid?,title,due,tz,remind,done,at}]
crm/rq/<rid>.json           обращение («Предложить через Orbiq»)
crm/rqidx/all, crm/rqidx/p/<pid>  SET
crm/pf/<pid>.json           портфель на проверку {cards:[cid], submittedAt, sample:[cid], status, decisions:{cid:{exists,relation,capital,reason,at}}, decision, reason}
crm/inv/<tokHash>.json      приглашение семьи {cid,pid,status,consentAt,consentChannel,expires,activatedUid,seat2:{relation,tokHash,status,uid}}
crm/audit                   LIST журнал {who,role,action,obj,at,reason,status}  (без текстов заметок, контактов, документов)
crm/catalog.json            каталог предложений (см. §7), стартовое наполнение из журнала
```

## 3. Карточка клиента `crm/c/<cid>.json`
```json
{
 "id":"c_x1", "owner":"<pid>", "alias":"Атлас", "created":"...", "updated":"...", "archived":false,
 "age":"55–64", "capital":"10–25", "kids":2, "investing":"active|sometimes|no|",
 "interests":["Часы","Архитектура"],
 "requests":[{"id":"r1","cat":"citizenship","text":"Второе гражданство","status":"open|closed","at":"...","public":true}],
 "cells":{"about.age":{"v":"55–64","kind":"fact|hypothesis|unknown|na","src":"dict|md|manual","at":"..."}, ...},
 "relation":{"role":"клиент по часам","lastContact":"2026-10","topic":"..."},
 "capitalBasis":"текст основания оценки капитала",
 "plan":[], "history":[{"at":"...","what":"..."}],
 "publicText":{"<requestId>":"очищенная формулировка, подтвержденная владельцем"}
}
```
- Диапазоны капитала (млн $): `<1`, `1–3`, `3–10`, `10–25`, `25–100`, `100+`. Возраст: `<35`, `35–44`, `45–54`, `55–64`, `65+`.
- Категории запросов (`cat`): `citizenship` Гражданство и ВНЖ, `realty` Недвижимость, `watches` Часы и коллекции, `finance` Финансы и переводы, `preipo` Pre-IPO и инвестиции, `security` Безопасность, `health` Здоровье, `education` Образование детей, `travel` Путешествия и события, `art` Искусство, `aviation` Авиация и яхты, `legal` Право и наследство, `digital` Цифровая инфраструктура, `other` Другое.
- Имя: `trim`, схлопнуть пробелы, нормализация для уникальности `toLowerCase()` + `ё→е`. Сервер: `SET crm/alias/<norm> cid NX`. Конфликт → 409 `{error:"Это имя уже занято. Придумайте другое, например «Атлас»"}` (пример подставлять свободный из списка). Переименование: NX нового, затем DEL старого.

### Круг 360°: 6 секторов × 3 ячейки (ключи)
```
about.age, about.region, about.places
business.source, business.now, business.project
family.circle, family.kids, family.gift
interests.time, interests.subject, interests.memory
prefs.formats, prefs.no, prefs.style
plans.asked, plans.next, plans.timing
```
Вопросы — дословно из таблицы §3 ТЗ. Процент = round(100 × заполненные(kind=fact) / применимые), где `na` (подтвержденное «не применимо») исключается из знаменателя, `hypothesis`/`unknown` баллов не дают. Ноль применимых → «Пока нет данных». Квалификационный зачет (§10): фиксированный знаменатель 18, нужно ≥15 fact.

## 4. Сетевое представление (что видят другие партнеры)
Сервер собирает **отдельный объект** только из полей: `id, alias, age, capital, kids, investing, interests, requests[] (только status=open и public=true: {id,cat,text: publicText[id] || ''})`, `mine:false`. Никогда: `owner`, `cells`, `relation`, `capitalBasis`, `plan`, `history`, импорт, заметки. Свободный текст запроса попадает в сеть только после подтверждения владельцем карточки (`publicText`). Ответы API для чужой карточки строятся только через `networkView(card)`; прямой `GET crm/c/<cid>` чужому — 404 (не 403, чтобы не раскрывать существование деталей).
Сетевой доступ: `tier in (trial, paid)` и не `suspended`. `candidate` видит только агрегаты спроса по своим категориям (`demand`: `[{cat, count, examples:[{text, age, capital}]}]` без alias и id).

## 5. Маршруты `/api/crm?r=`
Все POST — JSON. Все ответы `Cache-Control: no-store`. Ошибки `{error}` со статусом 400/401/403/404/409/429.

Авторизация
- `auth/request` {email} → письмо со ссылкой входа (только если email принадлежит партнеру или owner; иначе тот же ответ `{ok:true}` без письма). Rate limit 5/час на email и IP.
- `auth/verify?t=` → ставит `oc`, 302 на `/crm/`.
- `auth/owner-key` {key} (только для сессии с email из `CRM_OWNER_EMAILS`) → `oc` с `mfa:true`, 12 ч.
- `auth/logout`.
- `me` → `{role, partner:{id,name,tier,suspended,trial,paid,categories,tg:{connected}}, owner:bool}` или `{role:null}`.
- `pinv/accept?t=` → активирует приглашение партнера (одноразово), выставляет `oc`, 302 `/crm/?welcome=1`.

Клиенты (партнер с сетевым доступом / candidate только свои)
- `clients?scope=mine|all&q=&cat=&interest=&capital=&investing=` → строки таблицы. Свои — полные строки + `next:{title,due}`; чужие — только `networkView`.
- `client/create` {alias} → карточка. `client/get?id=` (свой полный / чужой networkView / owner полный).
- `client/update` {id, patch} — только владелец карточки (owner Orbiq — тоже нет: владелец Orbiq не правит чужие профили; только модерация). Разрешенные поля: alias, age, capital, kids, investing, interests, requests, cells, relation, capitalBasis, publicText.
- `client/archive` {id} — «Убрать в архив»: `archived:true`, убрать из `cidx/all` и `cidx/p`, alias освободить нельзя (сохранить занятым). Владелец Orbiq видит в архиве.
- `client/extract` {id, text, source:'dict'|'md'} → `{proposals:[{cell, value, kind, conflict?}], contradictions:[...]}` — ничего не сохраняет. Текст до этого очищен на устройстве; сервер повторно вырезает email/телефоны/URL и не пишет текст в лог/аудит. Команды внутри текста — данные (системный промпт).
- `client/apply` {id, items:[{cell,value,kind}]} → сохраняет подтвержденное, возвращает `{circle:{filled,applicable,pct}, changed:["Добавлены два интереса"]}`. Повтор тех же фактов не создает дубли.
- `client/match?id=` → подборка из каталога: `[{itemId,title,why:"связано с фактом …",deliver:"что получит",confirmBy}]` + `questions:[{id,text,basis,itemId?,date,deadline,bucket:'now'|'later'|'done',kind:'offer'|'clarify'}]` (макс 3 в `now`).
- `question/mark` {cid, qid, state:'asked'|'later'|'done', answer?, returnAfter?}.

Заметки и задачи (только автор; owner Orbiq тоже НЕ видит)
- `note/list?cid=`, `note/add` {cid,text}, `note/del` {cid,id}.
- `task/list`, `task/upsert` {...}, `task/del`.
- `ical/rotate` → новая ссылка `https://<host>/api/crm?r=ical&k=<token>`; старая перестает работать. `ical?k=` отдает VCALENDAR с нейтральными названиями («Задача Orbiq») и ссылкой `/crm/`.

Обращения
- `rq/create` {cid, requestId, offer, terms, attachment?:{name,dataUrl ≤ 2 МБ}} — партнер с сетевым доступом, cid чужой или свой. Попадает только к owner. Инициатор видит свои обращения со статусом; владелец карточки не видит обращение, пока owner не переслал.
- `rq/mine` — мои отправленные + адресованные мне сообщения Orbiq (ветка «Orbiq ↔ я»).
- `rq/reply` {rid, text} — ответ в свою ветку (только своя ветка).
- Owner: `rq/all`, `rq/get?rid=` (обе ветки отдельно), `rq/send` {rid, to:'initiator'|'cardOwner', text, attachIds:[]} — пересылка выбранного; `rq/status` {rid, status:'new'|'clarify'|'passed'|'closed', deal?:{payer,amount,percent,basis,received}}.
- Заметка → обращение: `note/forward` {cid, noteId, text} создает отдельный черновик-копию в `rq` (`fromNote:true`), последующие правки заметки не меняют копию.

Портфель и тариф
- `pf/status` → `{counted:n, of:30, rows:[{cid,alias,ok,reasons:[...]}], sample, status, decision}`.
- `pf/submit` → фиксирует состав (snapshot cid), сервер выбирает выборку: из каждой полной двадцатки 1 + 1 из остатка (30 → 2), seed = hash(pid+submittedAt); повторный вызов не меняет выборку. Зачет карточки: ≥15/18 fact, capital ≥ `1–3`, непустые `capitalBasis` и `relation.role/lastContact/topic`, хотя бы один open request в **другой** категории, чем `partner.categories`, нет дубля (alias/текст). 
- `intro/use` (owner) {pid, rid} — засчитать знакомство (только когда клиент согласился и Orbiq представил). Атомарно: `used < quota`. Отказ/молчание не вызывают.
- Owner: `partners`, `partner/invite` {name,email,categories} → одноразовая ссылка (7 дней), `partner/reinvite`, `partner/revoke`, `partner/suspend` {pid, on}, `partner/tier` {pid, tier}, `partner/payment` {pid, which:1|2, at, amount}, `seat/list?cat=` (≤2 платных на направление; третье → 409 «Мест нет, лист ожидания»), `pf/decide` {pid, cid, exists, relation, capital, reason}, `pf/final` {pid, decision:'approve'|'clarify'|'reject', reason}.
- `audit?limit=` (owner).

Семья и подарок (только `paid`)
- `invite/create` {cid, consentAt, consentChannel} → 403 для candidate/trial. Ссылка `/i/?t=` (журнальная обложка). `invite/revoke` {token-id}.
- Публичные: `invite/info?t=` (без личных данных: только «Для вас и того, кого вы захотите пригласить», срок), `invite/start` {t, name, email} → код/ссылка на почту; `invite/activate` (атомарно, один раз). После активации — журнальный аккаунт + `crmLink:{inv,cid}` + `interests`; `seat2` {relation:'spouse'|'daughter'|'son', later:true}.
- `client/feed` (журнальная сессия `oj`) → `{name, items:[ids ...], themes}` — персональный порядок. `client/interest` {itemId, action:'like'|'less'|'hide'|'want'}.

## 6. Права (сервер проверяет при КАЖДОМ запросе)
| Операция | candidate | trial | paid | suspended | owner |
|---|---|---|---|---|---|
| своя CRM (создать/править/архив/задачи/заметки) | да | да | да | нет | — (не правит чужие) |
| «Все» / чужая карточка (networkView) | нет (только demand) | да | да | нет | полный вид |
| rq/create | нет | да | да | нет | — |
| invite/create (семья) | нет | нет | да | нет | нет |
| intro квота | — | 3 | — | — | засчитывает |
| partners, inbox, pf/decide, audit | нет | нет | нет | нет | да (mfa) |
Чужая заметка не видна никому, включая owner. Запрет по умолчанию: неизвестный маршрут/роль → 403.

## 7. Каталог
`crm/catalog.json` (если нет — строится из `api/_data/content.json` статей журнала: id, title, section, theme, geo, cost). Поля: `id,title,themes[],format,region,online,terms,cost,dates,deadline,verifiedAt,status:'available'|'idea'`. Подбор: исключить отказанное/скрытое → поднять совпадения с открытым запросом, подтвержденным интересом, ближайшим планом. Косвенный интерес → вопрос-уточнение, не предложение.

## 8. Аудит
Пишем: вход owner, приглашение/приостановка партнера, смена тарифа, платежи, отправка/пересылка обращения, решение по портфелю, создание/отзыв приглашения семьи, архивирование. Не пишем: тексты заметок, тексты импорта, контакты, документы проверки, имена в сверке.
