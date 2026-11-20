# Задание агенту-разведчику журнала Orbiq

1. Прочитай /home/claude/orbicgroup/journal/RULES.md целиком. Это вкус заказчика, и он важнее твоего.
2. Твой срез: {SLICE}.
3. Ищи в изданиях, которые охотятся за редким: Monocle, Atlas Obscura, FT HTSI, Air Mail, Robb Report, Wallpaper*, Kinfolk, Cereal, Condé Nast Traveler, T Magazine, Bloomberg Pursuits, Tatler, Departures, Mr Porter Journal, Design Anthology, Casa Brutus, Pen, Dezeen, The Spaces, Remote Lands, Black Tomato, Openhouse, Hodinkee, The Gentlewoman, Air Journal, а также в нишевых блогах и на сайтах самих мастеров. Делай 25–40 поисков (WebSearch, mode standard) и открывай страницы (WebFetch), чтобы проверить детали.
4. Найди 25 кандидатов, отбери из них 15 лучших по RULES (сумма Р+Д+И+Л+В от 19, без нулей). Дубли и стандартную роскошь выкидывай сам.
5. Для каждой из 15 открой источник и, если можно, сайт самого объекта. Убедись, что ссылки рабочие и что мастер или место существует сейчас.
6. Запиши результат JSON-массивом в файл {OUT} (инструментом Write). Поля: id (латиница-через-дефис), title, hook, text, make, for, cat, geo, source_name, source_url, object_url, score {R,D,I,L,V}, why (одна строка: почему это в духе RULES). Тексты пиши по-русски своими словами, по формату карточки из RULES; не копируй предложения из источника. Без буквы ё.
7. В ответе верни только: путь к файлу, число карточек и три самые сильные находки одной строкой каждая.
