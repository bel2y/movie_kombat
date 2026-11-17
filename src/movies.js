// Порядок в каждом списке задаёт рейтинг желания от 1 до 16.
const movieLists = [
  [
    {
      "id": 652,
      "title": "Троя",
      "year": 2004,
      "genre": "Приключения",
      "poster": "https://image.tmdb.org/t/p/w342/a07wLy4ONfpsjnBqMwhlWTJTcm.jpg"
    },
    {
      "id": 77338,
      "title": "1+1",
      "year": 2011,
      "genre": "Комедия",
      "poster": "https://image.tmdb.org/t/p/w342/1QU7HKgsQbGpzsJbJK4pAVQV9F5.jpg"
    },
    {
      "id": 278,
      "title": "Побег из Шоушенка",
      "year": 1994,
      "genre": "Драма",
      "poster": "https://image.tmdb.org/t/p/w342/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg"
    },
    {
      "id": 77,
      "title": "Мементо",
      "year": 2000,
      "genre": "Триллер",
      "poster": "https://image.tmdb.org/t/p/w342/nzlv62aC0octS5AklAiWpXLX9Z0.jpg"
    },
    {
      "id": 79443,
      "title": "Ронал-варвар",
      "year": 2011,
      "genre": "Анимация",
      "poster": "https://image.tmdb.org/t/p/w342/k32V790RUZksAMm6SbvBm3QicIp.jpg"
    },
    {
      "id": 1242898,
      "title": "Хищник: Планета смерти",
      "year": 2025,
      "genre": "Фантастика",
      "poster": "https://image.tmdb.org/t/p/w342/pHpq9yNUIo6aDoCXEBzjSolywgz.jpg"
    },
    {
      "id": 602147,
      "title": "Тёмное наследие",
      "year": 2020,
      "genre": "Триллер",
      "poster": "https://image.tmdb.org/t/p/w342/rEpfvgTQsc768zNND0SjMelbnLH.jpg"
    },
    {
      "id": 497,
      "title": "Зелёная миля",
      "year": 1999,
      "genre": "Драма",
      "poster": "https://image.tmdb.org/t/p/w342/8VG8fDNiy50H4FedGwdSVUPoaJe.jpg"
    },
    {
      "id": 4922,
      "title": "Загадочная история Бенджамина Баттона",
      "year": 2008,
      "genre": "Драма",
      "poster": "https://image.tmdb.org/t/p/w342/26wEWZYt6yJkwRVkjcbwJEFh9IS.jpg"
    },
    {
      "id": 12193,
      "title": "Четыре Рождества",
      "year": 2008,
      "genre": "Комедия",
      "poster": "https://image.tmdb.org/t/p/w342/zixj44TC7rwzpxtJAG5OzFJnEqe.jpg"
    },
    {
      "id": 384682,
      "title": "Новогодний корпоратив",
      "year": 2016,
      "genre": "Комедия",
      "poster": "https://image.tmdb.org/t/p/w342/7r3w3cPTbNEIr1imb8zXyeIJCJe.jpg"
    },
    {
      "id": 10147,
      "title": "Плохой Санта",
      "year": 2003,
      "genre": "Комедия",
      "poster": "https://image.tmdb.org/t/p/w342/rfClLIyeHqpMofmrPY8DaLe4z9x.jpg"
    },
    {
      "id": 11674,
      "title": "101 далматинец",
      "year": 1996,
      "genre": "Семейный",
      "poster": "https://image.tmdb.org/t/p/w342/8o2ADoAyG796UwTjwBFjPyBz0yG.jpg"
    },
    {
      "id": 11823,
      "title": "Пережить Рождество",
      "year": 2004,
      "genre": "Комедия",
      "poster": "https://image.tmdb.org/t/p/w342/agiItFfsvNsjpinLGwjfpYOhLaX.jpg"
    },
    {
      "id": 335797,
      "title": "Зверопой",
      "year": 2016,
      "genre": "Анимация",
      "poster": "https://image.tmdb.org/t/p/w342/rwopfpHqPCYBSgBuZwkaXXqHp14.jpg"
    },
    {
      "id": 1005331,
      "title": "Ручная кладь",
      "year": 2024,
      "genre": "Триллер",
      "poster": "https://image.tmdb.org/t/p/w342/sjMN7DRi4sGiledsmllEw5HJjPy.jpg"
    }
  ],
  [
    {
      "id": 17979,
      "title": "Рождественская история",
      "year": 2009,
      "genre": "Анимация",
      "poster": "https://image.tmdb.org/t/p/w342/xNwlAIdx1Ln28GRiQttUP9Gojy2.jpg"
    },
    {
      "id": 10184,
      "title": "Обещать — не значит жениться",
      "year": 2009,
      "genre": "Мелодрама",
      "poster": "https://image.tmdb.org/t/p/w342/jip2ap24Y6JxEgzVRyNqyYssnyR.jpg"
    },
    {
      "id": 137,
      "title": "День сурка",
      "year": 1993,
      "genre": "Комедия",
      "poster": "https://image.tmdb.org/t/p/w342/gCgt1WARPZaXnq523ySQEUKinCs.jpg"
    },
    {
      "id": 1921,
      "title": "Сладкий ноябрь",
      "year": 2001,
      "genre": "Мелодрама",
      "poster": "https://image.tmdb.org/t/p/w342/3biEHZSBSYqSkawU2sQyNbLcjgE.jpg"
    },
    {
      "id": "local:you-are-my-only-one-1993",
      "title": "Ты у меня одна",
      "year": 1993,
      "genre": "Драма"
    },
    {
      "id": 562,
      "title": "Крепкий орешек",
      "year": 1988,
      "genre": "Боевик",
      "poster": "https://image.tmdb.org/t/p/w342/7Bjd8kfmDSOzpmhySpEhkUyK2oH.jpg"
    },
    {
      "id": 8844,
      "title": "Джуманджи",
      "year": 1995,
      "genre": "Приключения",
      "poster": "https://image.tmdb.org/t/p/w342/bdHG5Mo83VPobeZZdlSz0Y7HQHB.jpg"
    },
    {
      "id": 1573,
      "title": "Крепкий орешек 2",
      "year": 1990,
      "genre": "Боевик",
      "poster": "https://image.tmdb.org/t/p/w342/ybki0UWO3OPhaM6MSniuKC7sy1R.jpg"
    },
    {
      "id": "local:feedback-2020",
      "title": "Обратная связь",
      "year": 2020,
      "genre": "Комедия"
    },
    {
      "id": 510,
      "title": "Пролетая над гнездом кукушки",
      "year": 1975,
      "genre": "Драма",
      "poster": "https://image.tmdb.org/t/p/w342/kjWsMh72V6d8KRLV4EOoSJLT1H7.jpg"
    },
    {
      "id": 51828,
      "title": "Один день",
      "year": 2011,
      "genre": "Мелодрама",
      "poster": "https://image.tmdb.org/t/p/w342/n9jMwSg4IavdD8wqdYnyW5w3Mvp.jpg"
    },
    {
      "id": 3981,
      "title": "Чего хотят женщины",
      "year": 2000,
      "genre": "Комедия",
      "poster": "https://image.tmdb.org/t/p/w342/eqkBEMDk1316Yx5wVoabWY07JAi.jpg"
    },
    {
      "id": 9535,
      "title": "Анализируй это",
      "year": 1999,
      "genre": "Комедия",
      "poster": "https://image.tmdb.org/t/p/w342/gN8o7Ke1lUF2K8tzcLRb5bfEKbD.jpg"
    },
    {
      "id": 11036,
      "title": "Дневник памяти",
      "year": 2004,
      "genre": "Мелодрама",
      "poster": "https://image.tmdb.org/t/p/w342/rNzQyW4f8B8cQeg7Dgj3n6eT5k9.jpg"
    },
    {
      "id": 5255,
      "title": "Полярный экспресс",
      "year": 2004,
      "genre": "Анимация",
      "poster": "https://image.tmdb.org/t/p/w342/eOoCzH0MqeGr2taUZO4SwG416PF.jpg"
    },
    {
      "id": 508,
      "title": "Реальная любовь",
      "year": 2003,
      "genre": "Мелодрама",
      "poster": "https://image.tmdb.org/t/p/w342/7QPeVsr9rcFU9Gl90yg0gTOTpVv.jpg"
    }
  ]
];
