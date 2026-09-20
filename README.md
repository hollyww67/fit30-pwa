# Fit30 PWA

Рабочий MVP трекера 30-дневной программы питания и тренировок.

## Что уже есть

- экран **Сегодня**: калории, белок, шаги, вода, сон, вес и заметки;
- 30-дневный календарь программы;
- 7-дневное меню, циклически распределённое на 30 дней;
- тренировки A/B/C/D, LISS, Mobility и Recovery;
- интерактивный workout runner: подходы, вес, повторы, отдых, завершение тренировки;
- отметки приёмов пищи;
- вес, замеры и график прогресса;
- локальный demo mode без аккаунта;
- Supabase Auth + cloud storage после настройки env;
- RLS-политики для пользовательских данных;
- PWA manifest, иконки и service worker;
- адаптивный интерфейс под iPhone/Android/desktop.

## 1. Локальный запуск

```bash
npm install
npm run dev
```

Открой `http://localhost:3000`.

Без `.env.local` приложение работает в **Demo mode** и хранит данные в `localStorage`.

## 2. Подключение Supabase

Создай `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Затем выполни SQL из:

```text
supabase/migrations/001_fit30.sql
```

в Supabase SQL Editor.

После этого `/login` позволяет зарегистрироваться или войти. Новые данные авторизованного пользователя записываются в Supabase.

### Таблицы

- `profiles`
- `daily_checkins`
- `meal_checks`
- `body_measurements`
- `program_day_status`
- `workout_sessions`
- `workout_sets`

Все пользовательские таблицы защищены RLS по `auth.uid()`.

## 3. Деплой на Vercel

Самый простой путь:

1. загрузить проект в GitHub;
2. создать новый проект в Vercel из репозитория;
3. добавить Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Deploy.

Или через CLI:

```bash
npm i -g vercel
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
vercel deploy
vercel deploy --prod
```

## 4. PWA на iPhone

После HTTPS-деплоя открой сайт в Safari → **Поделиться** → **На экран «Домой»**.

Manifest: `app/manifest.ts`  
Service worker: `public/sw.js`

## Архитектура

```text
app/
  today/        главный экран
  program/      календарь на 30 дней
  nutrition/    питание
  workouts/     интерактивные тренировки
  progress/     вес и замеры
  settings/     цели пользователя
  login/        Supabase Auth
components/
lib/
  data/         программа + storage layer
  supabase/     browser client
supabase/
  migrations/   SQL schema + RLS
public/
  icons/        PWA icons
  sw.js         service worker
```

## Следующий разумный этап

- фото прогресса через Supabase Storage;
- Apple Health / Google Health Connect;
- уведомления и напоминания;
- история рабочих весов и автоматическая прогрессия;
- рецепты с ингредиентами и БЖУ;
- админка тренера для изменения программы;
- push notifications.
