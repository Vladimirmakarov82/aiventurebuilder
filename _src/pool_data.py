# Hero animation data. SVC: services, may repeat. THINGS: rare collectibles, never repeat on screen.
SVC_RU = ['Резидентство Монако', 'Счет в Pictet', 'Golden Visa ОАЭ', 'Семейный траст', 'Фонд в Лихтенштейне',
          'Второе мнение Charité', 'Места у ринга сумо', 'Хирург в Сеуле', 'Le Rosey', 'Eton College',
          'Royal Enclosure', 'Ночная гонка в Сингапуре', 'Bal des Débutantes', 'Венский оперный бал',
          'Cerebras pre-IPO +2085%', 'CoreWeave pre-IPO +235%', 'Ужин в Гионе', 'Охрана семьи',
          'Вилла вне продажи', 'Clinique La Prairie', 'Mayo Clinic', 'Растаможка груза', 'Оплата поставщику',
          'Компания в ОАЭ', 'Счет в Julius Baer', 'Резидентство Сингапура', 'Семейный офис в Сингапуре',
          'Антарктида из Кейптауна', 'Оксфорд', 'Сафари в Саби Сэнд', 'Art Basel Hong Kong', 'amfAR Cannes',
          'Показ Chanel Haute Couture', 'Центральный корт Уимблдона', 'Gulfstream G700', 'Кубок Америки в Неаполе']
SVC_EN = ['Monaco residence', 'Pictet account', 'UAE Golden Visa', 'Family trust', 'Liechtenstein foundation',
          'Charité second opinion', 'Ringside at sumo', 'Surgeon in Seoul', 'Le Rosey', 'Eton College',
          'Royal Enclosure', 'Singapore night race', 'Bal des Débutantes', 'Vienna Opera Ball',
          'Cerebras pre-IPO +2085%', 'CoreWeave pre-IPO +235%', 'Dinner in Gion', 'Family security',
          'Off-market villa', 'Clinique La Prairie', 'Mayo Clinic', 'Customs clearance', 'Supplier payment',
          'UAE company', 'Julius Baer account', 'Singapore residence', 'Singapore family office',
          'Antarctica from Cape Town', 'Oxford', 'Sabi Sand safari', 'Art Basel Hong Kong', 'amfAR Cannes',
          'Chanel Haute Couture show', 'Wimbledon Centre Court', 'Gulfstream G700', 'America’s Cup Naples']

# (ru, en)
THINGS = [
    # wine and spirits
    ('Romanée-Conti 1945', 'Romanée-Conti 1945'), ('Pétrus 1961', 'Pétrus 1961'),
    ('Screaming Eagle 1992', 'Screaming Eagle 1992'), ('Château d’Yquem 1811', 'Château d’Yquem 1811'),
    ('Penfolds Grange 1951', 'Penfolds Grange 1951'), ('Krug Clos d’Ambonnay', 'Krug Clos d’Ambonnay'),
    ('Domaine Leroy Musigny', 'Domaine Leroy Musigny'), ('Macallan 1926', 'Macallan 1926'),
    ('Yamazaki 55', 'Yamazaki 55'), ('Louis XIII Rare Cask', 'Louis XIII Rare Cask'),
    # tea and cigars
    ('Пуэр Red Mark', 'Red Mark pu-erh'), ('Пуэр Song Pin Hao', 'Song Pin Hao pu-erh'),
    ('Cohiba Behike 56', 'Cohiba Behike 56'),
    # porcelain and antiques
    ('Ваза эпохи Цяньлун', 'Qianlong vase'), ('Чаша Чэнхуа с курами', 'Chenghua chicken cup'),
    ('Фарфор Мин', 'Ming porcelain'), ('Фарфор Ру', 'Ru ware'), ('Нэцкэ эпохи Эдо', 'Edo netsuke'),
    ('Ковер эпохи Сефевидов', 'Safavid carpet'), ('Атлас Блау', 'Blaeu atlas'),
    ('Меч эпохи Камакура', 'Kamakura sword'),
    # art
    ('Яеи Кусама', 'Yayoi Kusama'), ('Баския', 'Basquiat'), ('Герхард Рихтер', 'Gerhard Richter'),
    ('Дэвид Хокни', 'David Hockney'), ('Марк Ротко', 'Mark Rothko'), ('Энди Уорхол', 'Andy Warhol'),
    ('Айвазовский', 'Aivazovsky'), ('Илья Кабаков', 'Ilya Kabakov'), ('Бэнкси', 'Banksy'),
    ('Поздний Пикассо', 'Late Picasso'),
    # watches
    ('Patek Philippe 5711 Tiffany', 'Patek Philippe 5711 Tiffany'), ('Patek Grandmaster Chime', 'Patek Grandmaster Chime'),
    ('Royal Oak Jumbo 16202', 'Royal Oak Jumbo 16202'), ('Rolex Daytona Paul Newman', 'Rolex Daytona Paul Newman'),
    ('F.P. Journe Chronomètre Bleu', 'F.P. Journe Chronomètre Bleu'), ('Richard Mille RM 27-04', 'Richard Mille RM 27-04'),
    ('Lange Datograph', 'Lange Datograph'),
    # bags and jewelry
    ('Hermès Birkin 25 Himalaya', 'Hermès Birkin 25 Himalaya'), ('Kelly 28 Himalaya', 'Kelly 28 Himalaya'),
    ('Birkin Faubourg', 'Birkin Faubourg'), ('Chanel 2.55 1955', 'Chanel 2.55 1955'),
    ('Cartier Tutti Frutti', 'Cartier Tutti Frutti'), ('Van Cleef Zip', 'Van Cleef Zip'), ('JAR', 'JAR'),
    ('Брошь Фаберже', 'Fabergé brooch'),
    # stones
    ('Рубин Pigeon Blood', 'Pigeon Blood ruby'), ('Кашмирский сапфир', 'Kashmir sapphire'),
    ('Изумруд Muzo', 'Muzo emerald'), ('Розовый бриллиант Argyle', 'Argyle pink diamond'),
    ('Сапфир Padparadscha', 'Padparadscha sapphire'), ('Турмалин Paraiba', 'Paraiba tourmaline'),
    # coins, stamps, books, comics, cards
    ('Константиновский рубль', 'Constantine rouble'), ('Соверен Эдуарда VIII', 'Edward VIII sovereign'),
    ('Double Eagle 1933', '1933 Double Eagle'), ('Brasher Doubloon', 'Brasher Doubloon'),
    ('Марка Inverted Jenny', 'Inverted Jenny stamp'), ('Голубой Маврикий', 'Blue Mauritius'),
    ('Шекспир First Folio', 'Shakespeare First Folio'), ('Первое издание «Гарри Поттера»', 'Harry Potter first edition'),
    ('Action Comics #1', 'Action Comics #1'), ('Amazing Fantasy #15', 'Amazing Fantasy #15'),
    ('Pikachu Illustrator', 'Pikachu Illustrator'), ('Charizard 1st Edition', 'Charizard 1st Edition'),
    ('Honus Wagner T206', 'Honus Wagner T206'), ('Michael Jordan Fleer 1986', 'Michael Jordan Fleer 1986'),
    # toys
    ('Steiff Louis Vuitton', 'Steiff Louis Vuitton'), ('Be@rbrick Chanel 1000%', 'Be@rbrick Chanel 1000%'),
    ('Boba Fett Kenner 1979', 'Boba Fett Kenner 1979'), ('LEGO Millennium Falcon 10179', 'LEGO Millennium Falcon 10179'),
    ('Солдатики Britains', 'Britains toy soldiers'), ('Hot Wheels Beach Bomb', 'Hot Wheels Beach Bomb'),
    ('Barbie 1959', 'Barbie 1959'),
    # cars and sneakers
    ('Ferrari 250 GTO', 'Ferrari 250 GTO'), ('Ferrari Daytona SP3', 'Ferrari Daytona SP3'),
    ('Mercedes 300 SL Gullwing', 'Mercedes 300 SL Gullwing'), ('Aston Martin DB5', 'Aston Martin DB5'),
    ('Porsche 959', 'Porsche 959'), ('Koenigsegg Jesko', 'Koenigsegg Jesko'), ('Pagani Utopia', 'Pagani Utopia'),
    ('Nike Air Mag', 'Nike Air Mag'), ('Air Jordan 1 Chicago', 'Air Jordan 1 Chicago'),
    # instruments, records, nature
    ('Скрипка Страдивари', 'Stradivarius violin'), ('Gibson Les Paul 1959', 'Gibson Les Paul 1959'),
    ('Beatles Butcher Cover', 'Beatles Butcher Cover'), ('Лунный метеорит', 'Lunar meteorite'),
    ('Скелет трицератопса', 'Triceratops skeleton'),
    # jets and homes
    ('Bombardier Global 7500', 'Bombardier Global 7500'), ('Dassault Falcon 8X', 'Dassault Falcon 8X'),
    ('One Hyde Park', 'One Hyde Park'),
]
THINGS_RU = [r for r, e in THINGS]
THINGS_EN = [e for r, e in THINGS]
# pill slots that carry services (7 of 12) so services always outnumber things on screen
S_SLOTS = [0, 2, 3, 5, 7, 8, 10]
