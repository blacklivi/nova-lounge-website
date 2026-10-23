# NOVA — сайт сети кафе, Минск

Отдельный проект `blacklivi/nova-lounge-website` → Cloudflare Worker `nova-lounge-demo`.

## Ссылки
- Сайт: https://nova-lounge-demo.blacklivi-olx.workers.dev/
- События: https://nova-lounge-demo.blacklivi-olx.workers.dev/events
- Редактор: https://nova-lounge-demo.blacklivi-olx.workers.dev/admin

## Архитектура
- `public/` — адаптивный интерфейс, события, редактор и статические фотографии;
- `src/index.js` — защищённый API редактора, загрузка изображений;
- `D1 DB` `nova-content-db` — текстовые поля и анонсы;
- `R2 MEDIA` `nova-website-media` — загруженные изображения;
- `ADMIN_PASSWORD`, `ADMIN_SIGNING_KEY` — только Cloudflare Secrets, **не хранить в Git**.

Редактирование текстов и событий в `/admin` применяется сразу, без GitHub deploy. Изменение верстки/программного кода публикуется через коммит в GitHub `main` → Cloudflare Builds. Доступ в `/admin` требует отдельного пароля.

## Публикация

```
npm install
npm run check
npx wrangler deploy
```

Сайт пока в демонстрационном режиме: бронирования в Telegram не отправляются; реальные контакты, меню и фотографии нуждаются в заполнении.

## Контент и события
- Анонсы с `published=true` появляются в `/events`.
- Будущие сортируются по времени проведения (первый по времени — на главной).
- Прошедшие автоматически оказываются в архиве страницы `/events`.
- Неопубликованные объявления не видны посетителям.
- Время мероприятия вводится в часовом поясе **Минска (UTC+3)**.

## Важное
- Не подключать этот Worker к D1/R2 AVE.
- Секреты не записывать в GitHub и не публиковать в README.
- Изображения и тексты через CMS не требуют правок GitHub.
- Схема таблиц в `migrations/0001_content.sql` (уже применена на отдельной базе NOVA).
