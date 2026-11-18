// Порядок в каждом списке задаёт рейтинг желания от 1 до 16.
const movieLists = [
  [
    {
      "id": 652,
      "title": "Троя",
      "year": 2004,
      "genre": "Приключения",
      "poster": "src/posters/tmdb-652.jpg"
    },
    {
      "id": 77338,
      "title": "1+1",
      "year": 2011,
      "genre": "Комедия",
      "poster": "src/posters/tmdb-77338.jpg"
    },
    {
      "id": 278,
      "title": "Побег из Шоушенка",
      "year": 1994,
      "genre": "Драма",
      "poster": "src/posters/tmdb-278.jpg"
    },
    {
      "id": 77,
      "title": "Мементо",
      "year": 2000,
      "genre": "Триллер",
      "poster": "src/posters/tmdb-77.jpg"
    },
    {
      "id": 79443,
      "title": "Ронал-варвар",
      "year": 2011,
      "genre": "Анимация",
      "poster": "src/posters/tmdb-79433.jpg"
    },
    {
      "id": 1242898,
      "title": "Хищник: Планета смерти",
      "year": 2025,
      "genre": "Фантастика",
      "poster": "src/posters/tmdb-1242898.jpg"
    },
    {
      "id": 602147,
      "title": "Тёмное наследие",
      "year": 2020,
      "genre": "Триллер",
      "poster": "src/posters/tmdb-602147.jpg"
    },
    {
      "id": 497,
      "title": "Зелёная миля",
      "year": 1999,
      "genre": "Драма",
      "poster": "src/posters/tmdb-497.jpg"
    },
    {
      "id": 4922,
      "title": "Загадочная история Бенджамина Баттона",
      "year": 2008,
      "genre": "Драма",
      "poster": "src/posters/tmdb-4922.jpg"
    },
    {
      "id": 12193,
      "title": "Четыре Рождества",
      "year": 2008,
      "genre": "Комедия",
      "poster": "src/posters/tmdb-12193.jpg"
    },
    {
      "id": 384682,
      "title": "Новогодний корпоратив",
      "year": 2016,
      "genre": "Комедия",
      "poster": "src/posters/tmdb-384682.jpg"
    },
    {
      "id": 10147,
      "title": "Плохой Санта",
      "year": 2003,
      "genre": "Комедия",
      "poster": "src/posters/tmdb-10147.jpg"
    },
    {
      "id": 11674,
      "title": "101 далматинец",
      "year": 1996,
      "genre": "Семейный",
      "poster": "src/posters/tmdb-11674.jpg"
    },
    {
      "id": 11823,
      "title": "Пережить Рождество",
      "year": 2004,
      "genre": "Комедия",
      "poster": "src/posters/tmdb-15566.jpg"
    },
    {
      "id": 335797,
      "title": "Зверопой",
      "year": 2016,
      "genre": "Анимация",
      "poster": "src/posters/tmdb-335797.jpg"
    },
    {
      "id": 1005331,
      "title": "Ручная кладь",
      "year": 2024,
      "genre": "Триллер",
      "poster": "src/posters/tmdb-1005331.jpg"
    }
  ],
  [
    {
      "id": 17979,
      "title": "Рождественская история",
      "year": 2009,
      "genre": "Анимация",
      "poster": "src/posters/tmdb-17979.jpg"
    },
    {
      "id": 10184,
      "title": "Обещать — не значит жениться",
      "year": 2009,
      "genre": "Мелодрама",
      "poster": "src/posters/tmdb-10184.jpg"
    },
    {
      "id": 137,
      "title": "День сурка",
      "year": 1993,
      "genre": "Комедия",
      "poster": "src/posters/tmdb-137.jpg"
    },
    {
      "id": 1921,
      "title": "Сладкий ноябрь",
      "year": 2001,
      "genre": "Мелодрама",
      "poster": "src/posters/tmdb-1921.jpg"
    },
    {
      "id": "local:you-are-my-only-one-1993",
      "title": "Ты у меня одна",
      "year": 1993,
      "genre": "Драма",
      "poster": "src/posters/tmdb-83614.jpg"
    },
    {
      "id": 562,
      "title": "Крепкий орешек",
      "year": 1988,
      "genre": "Боевик",
      "poster": "src/posters/tmdb-562.jpg"
    },
    {
      "id": 8844,
      "title": "Джуманджи",
      "year": 1995,
      "genre": "Приключения",
      "poster": "src/posters/tmdb-8844.jpg"
    },
    {
      "id": 1573,
      "title": "Крепкий орешек 2",
      "year": 1990,
      "genre": "Боевик",
      "poster": "src/posters/tmdb-1573.jpg"
    },
    {
      "id": "local:feedback-2020",
      "title": "Обратная связь",
      "year": 2020,
      "genre": "Комедия",
      "poster": "src/posters/tmdb-598354.jpg"
    },
    {
      "id": 510,
      "title": "Пролетая над гнездом кукушки",
      "year": 1975,
      "genre": "Драма",
      "poster": "src/posters/tmdb-510.jpg"
    },
    {
      "id": 51828,
      "title": "Один день",
      "year": 2011,
      "genre": "Мелодрама",
      "poster": "src/posters/tmdb-51828.jpg"
    },
    {
      "id": 3981,
      "title": "Чего хотят женщины",
      "year": 2000,
      "genre": "Комедия",
      "poster": "src/posters/tmdb-3981.jpg"
    },
    {
      "id": 9535,
      "title": "Анализируй это",
      "year": 1999,
      "genre": "Комедия",
      "poster": "src/posters/tmdb-9535.jpg"
    },
    {
      "id": 11036,
      "title": "Дневник памяти",
      "year": 2004,
      "genre": "Мелодрама",
      "poster": "src/posters/tmdb-11036.jpg"
    },
    {
      "id": 5255,
      "title": "Полярный экспресс",
      "year": 2004,
      "genre": "Анимация",
      "poster": "src/posters/tmdb-5255.jpg"
    },
    {
      "id": 508,
      "title": "Реальная любовь",
      "year": 2003,
      "genre": "Мелодрама",
      "poster": "src/posters/tmdb-508.jpg"
    }
  ]
];
