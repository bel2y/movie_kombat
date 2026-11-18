// Порядок в каждом списке задаёт рейтинг желания от 1 до 16.
const movieLists = [
  [
    {
      "id": 652,
      "title": "Троя",
      "year": 2004,
      "genre": "Приключения",
      "poster": "src/optimized/tmdb-652.df757bf4d345.webp"
    },
    {
      "id": 77338,
      "title": "1+1",
      "year": 2011,
      "genre": "Комедия",
      "poster": "src/optimized/tmdb-77338.f92ca61446c7.webp"
    },
    {
      "id": 278,
      "title": "Побег из Шоушенка",
      "year": 1994,
      "genre": "Драма",
      "poster": "src/optimized/tmdb-278.91b625b6efef.webp"
    },
    {
      "id": 77,
      "title": "Мементо",
      "year": 2000,
      "genre": "Триллер",
      "poster": "src/optimized/tmdb-77.afeee06148b1.webp"
    },
    {
      "id": 79443,
      "title": "Ронал-варвар",
      "year": 2011,
      "genre": "Анимация",
      "poster": "src/optimized/tmdb-79433.d92e17c4ae8b.webp"
    },
    {
      "id": 1242898,
      "title": "Хищник: Планета смерти",
      "year": 2025,
      "genre": "Фантастика",
      "poster": "src/optimized/tmdb-1242898.178c3ab694ed.webp"
    },
    {
      "id": 602147,
      "title": "Тёмное наследие",
      "year": 2020,
      "genre": "Триллер",
      "poster": "src/optimized/tmdb-602147.d30ac2bb99bf.webp"
    },
    {
      "id": 497,
      "title": "Зелёная миля",
      "year": 1999,
      "genre": "Драма",
      "poster": "src/optimized/tmdb-497.d8112c5b208e.webp"
    },
    {
      "id": 4922,
      "title": "Загадочная история Бенджамина Баттона",
      "year": 2008,
      "genre": "Драма",
      "poster": "src/optimized/tmdb-4922.32ab5cf23785.webp"
    },
    {
      "id": 12193,
      "title": "Четыре Рождества",
      "year": 2008,
      "genre": "Комедия",
      "poster": "src/optimized/tmdb-12193.2936fa15d740.webp"
    },
    {
      "id": 384682,
      "title": "Новогодний корпоратив",
      "year": 2016,
      "genre": "Комедия",
      "poster": "src/optimized/tmdb-384682.08259b1638cb.webp"
    },
    {
      "id": 10147,
      "title": "Плохой Санта",
      "year": 2003,
      "genre": "Комедия",
      "poster": "src/optimized/tmdb-10147.88abc5534bdf.webp"
    },
    {
      "id": 11674,
      "title": "101 далматинец",
      "year": 1996,
      "genre": "Семейный",
      "poster": "src/optimized/tmdb-11674.e8785712444e.webp"
    },
    {
      "id": 11823,
      "title": "Пережить Рождество",
      "year": 2004,
      "genre": "Комедия",
      "poster": "src/optimized/tmdb-15566.ccfcccc375f2.webp"
    },
    {
      "id": 335797,
      "title": "Зверопой",
      "year": 2016,
      "genre": "Анимация",
      "poster": "src/optimized/tmdb-335797.3d0ec0424e09.webp"
    },
    {
      "id": 1005331,
      "title": "Ручная кладь",
      "year": 2024,
      "genre": "Триллер",
      "poster": "src/optimized/tmdb-1005331.4ec362775248.webp"
    }
  ],
  [
    {
      "id": 17979,
      "title": "Рождественская история",
      "year": 2009,
      "genre": "Анимация",
      "poster": "src/optimized/tmdb-17979.10caa9daa56a.webp"
    },
    {
      "id": 10184,
      "title": "Обещать — не значит жениться",
      "year": 2009,
      "genre": "Мелодрама",
      "poster": "src/optimized/tmdb-10184.00cfdacd0903.webp"
    },
    {
      "id": 137,
      "title": "День сурка",
      "year": 1993,
      "genre": "Комедия",
      "poster": "src/optimized/tmdb-137.0b2048742889.webp"
    },
    {
      "id": 1921,
      "title": "Сладкий ноябрь",
      "year": 2001,
      "genre": "Мелодрама",
      "poster": "src/optimized/tmdb-1921.5c12db43b3ad.webp"
    },
    {
      "id": "local:you-are-my-only-one-1993",
      "title": "Ты у меня одна",
      "year": 1993,
      "genre": "Драма",
      "poster": "src/optimized/tmdb-83614.631c9e93201d.webp"
    },
    {
      "id": 562,
      "title": "Крепкий орешек",
      "year": 1988,
      "genre": "Боевик",
      "poster": "src/optimized/tmdb-562.398327139953.webp"
    },
    {
      "id": 8844,
      "title": "Джуманджи",
      "year": 1995,
      "genre": "Приключения",
      "poster": "src/optimized/tmdb-8844.d9d54f972c4d.webp"
    },
    {
      "id": 1573,
      "title": "Крепкий орешек 2",
      "year": 1990,
      "genre": "Боевик",
      "poster": "src/optimized/tmdb-1573.5b359cca6fc5.webp"
    },
    {
      "id": "local:feedback-2020",
      "title": "Обратная связь",
      "year": 2020,
      "genre": "Комедия",
      "poster": "src/optimized/tmdb-598354.8f7bea232aae.webp"
    },
    {
      "id": 510,
      "title": "Пролетая над гнездом кукушки",
      "year": 1975,
      "genre": "Драма",
      "poster": "src/optimized/tmdb-510.897f6418b9ec.webp"
    },
    {
      "id": 51828,
      "title": "Один день",
      "year": 2011,
      "genre": "Мелодрама",
      "poster": "src/optimized/tmdb-51828.13ab5d7f2e37.webp"
    },
    {
      "id": 3981,
      "title": "Чего хотят женщины",
      "year": 2000,
      "genre": "Комедия",
      "poster": "src/optimized/tmdb-3981.42e8bfb2a9b2.webp"
    },
    {
      "id": 9535,
      "title": "Анализируй это",
      "year": 1999,
      "genre": "Комедия",
      "poster": "src/optimized/tmdb-9535.e1d8d8b65a1a.webp"
    },
    {
      "id": 11036,
      "title": "Дневник памяти",
      "year": 2004,
      "genre": "Мелодрама",
      "poster": "src/optimized/tmdb-11036.41a3ceb0df25.webp"
    },
    {
      "id": 5255,
      "title": "Полярный экспресс",
      "year": 2004,
      "genre": "Анимация",
      "poster": "src/optimized/tmdb-5255.7165685970b4.webp"
    },
    {
      "id": 508,
      "title": "Реальная любовь",
      "year": 2003,
      "genre": "Мелодрама",
      "poster": "src/optimized/tmdb-508.071bf164105c.webp"
    }
  ]
];
