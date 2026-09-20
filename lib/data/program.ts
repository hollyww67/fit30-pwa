export type Exercise = {
  key: string;
  name: string;
  sets: number | string;
  reps: string;
  rest: string;
  note?: string;
};

export type WorkoutTemplate = {
  code: "A" | "B" | "C" | "D" | "LISS" | "MOBILITY" | "REST" | "RECOVERY";
  title: string;
  subtitle: string;
  duration: string;
  exercises: Exercise[];
};

export type MealTemplate = {
  number: number;
  breakfast: string;
  lunch: string;
  snack: string;
  dinner: string;
  calories: number;
  protein: number;
};

export type ProgramDay = {
  day: number;
  week: number;
  workoutCode: WorkoutTemplate["code"];
  activity: string;
  steps: number;
  menu: number;
};

export const workouts: Record<WorkoutTemplate["code"], WorkoutTemplate> = {
  A: {
    code: "A",
    title: "Ноги + ягодицы",
    subtitle: "Силовая A",
    duration: "30–35 мин",
    exercises: [
      { key: "goblet-squat", name: "Goblet squat", sets: 3, reps: "10–12", rest: "60–90 сек", note: "При необходимости присед к скамье" },
      { key: "rdl", name: "Румынская тяга с гантелями", sets: 3, reps: "10–12", rest: "60–90 сек", note: "Движение тазом назад, нейтральная спина" },
      { key: "hip-thrust", name: "Ягодичный мост / Hip Thrust", sets: 3, reps: "12–15", rest: "60 сек", note: "Пауза в верхней точке" },
      { key: "reverse-lunge", name: "Выпады назад", sets: 2, reps: "8–10 / нога", rest: "60 сек", note: "Можно держаться за опору" },
      { key: "kickback", name: "Отведение ноги назад", sets: 2, reps: "12–15 / нога", rest: "45–60 сек" },
      { key: "finisher-a", name: "Финишер без прыжков", sets: 3, reps: "30 сек работа / 30 сек отдых", rest: "—", note: "Быстрый шаг → присед к стулу → шаги в стороны" },
    ],
  },
  B: {
    code: "B",
    title: "Спина + грудь + руки",
    subtitle: "Силовая B",
    duration: "30–35 мин",
    exercises: [
      { key: "lat-pulldown", name: "Тяга верхнего блока", sets: 3, reps: "10–12", rest: "60–90 сек", note: "Дома — тяга резинки" },
      { key: "db-bench", name: "Жим гантелей лёжа", sets: 3, reps: "10–12", rest: "60–90 сек" },
      { key: "row", name: "Горизонтальная тяга", sets: 3, reps: "10–12", rest: "60–90 сек" },
      { key: "shoulder-press", name: "Жим гантелей вверх", sets: 3, reps: "8–10", rest: "60–90 сек" },
      { key: "curl", name: "Сгибание рук", sets: 2, reps: "12", rest: "45–60 сек" },
      { key: "triceps", name: "Разгибание на трицепс", sets: 2, reps: "12", rest: "45–60 сек" },
      { key: "dead-bug", name: "Dead Bug", sets: 3, reps: "8–10 / сторона", rest: "45 сек" },
    ],
  },
  C: {
    code: "C",
    title: "Ягодицы + задняя поверхность + Core",
    subtitle: "Силовая C",
    duration: "30–40 мин",
    exercises: [
      { key: "hip-thrust-c", name: "Hip Thrust", sets: 4, reps: "10–12", rest: "60–90 сек", note: "Главное упражнение дня" },
      { key: "rdl-c", name: "Румынская тяга", sets: 3, reps: "10", rest: "60–90 сек" },
      { key: "step-up", name: "Step-up", sets: 3, reps: "8 / нога", rest: "60 сек", note: "Невысокая платформа" },
      { key: "leg-curl", name: "Сгибание ног", sets: 3, reps: "12", rest: "60 сек", note: "Дома — скольжение пятками" },
      { key: "abduction", name: "Отведение бедра", sets: 3, reps: "15", rest: "45–60 сек" },
      { key: "bird-dog", name: "Bird Dog", sets: 3, reps: "10 / сторона", rest: "45 сек" },
      { key: "pallof", name: "Pallof Press", sets: 3, reps: "10 / сторона", rest: "45 сек" },
    ],
  },
  D: {
    code: "D",
    title: "Full Body",
    subtitle: "Функциональный круг",
    duration: "30–35 мин",
    exercises: [
      { key: "goblet-d", name: "Goblet squat", sets: "Круг", reps: "10", rest: "—" },
      { key: "row-d", name: "Тяга гантелей", sets: "Круг", reps: "10", rest: "—" },
      { key: "press-d", name: "Жим гантелей", sets: "Круг", reps: "10", rest: "—" },
      { key: "rdl-d", name: "Румынская тяга", sets: "Круг", reps: "10", rest: "—" },
      { key: "farmer", name: "Farmer Walk", sets: "Круг", reps: "30 сек", rest: "—" },
      { key: "fast-walk", name: "Быстрый шаг", sets: "Круг", reps: "45 сек", rest: "60–90 сек после круга", note: "Нед.1: 3 круга; нед.2: 3–4; нед.3: 4; нед.4: 4 + немного веса" },
    ],
  },
  LISS: {
    code: "LISS",
    title: "LISS",
    subtitle: "Низкоинтенсивное кардио",
    duration: "30–45 мин",
    exercises: [
      { key: "liss", name: "Дорожка / прогулка / эллипс / велосипед", sets: 1, reps: "30–45 мин", rest: "—", note: "Темп: можно говорить предложениями. Прогрессия 30 → 35 → 40 → 40–45 мин" },
    ],
  },
  MOBILITY: {
    code: "MOBILITY",
    title: "Mobility + Core",
    subtitle: "Восстановление",
    duration: "20–30 мин",
    exercises: [
      { key: "cat-cow", name: "Cat-Cow", sets: 1, reps: "8–10", rest: "—" },
      { key: "wgs", name: "World's Greatest Stretch", sets: 1, reps: "5 / сторона", rest: "—" },
      { key: "hip-flexor", name: "Растяжка сгибателей бедра", sets: 1, reps: "30–45 сек / сторона", rest: "—" },
      { key: "glute-stretch", name: "Ягодичная растяжка", sets: 1, reps: "30–45 сек / сторона", rest: "—" },
      { key: "thoracic", name: "Мобилизация грудного отдела", sets: 1, reps: "8–10", rest: "—" },
      { key: "dead-bug-m", name: "Dead Bug", sets: 2, reps: "8–10 / сторона", rest: "—" },
      { key: "bird-dog-m", name: "Bird Dog", sets: 2, reps: "8–10 / сторона", rest: "—" },
      { key: "side-plank", name: "Side Plank", sets: 2, reps: "15–30 сек / сторона", rest: "—", note: "Можно с колен" },
    ],
  },
  REST: { code: "REST", title: "Отдых", subtitle: "Восстановление", duration: "—", exercises: [] },
  RECOVERY: { code: "RECOVERY", title: "Active Recovery", subtitle: "Финальный день", duration: "55–80 мин", exercises: [
    { key: "recovery-walk", name: "Спокойная прогулка", sets: 1, reps: "40–60 мин", rest: "—" },
    { key: "recovery-mobility", name: "Mobility", sets: 1, reps: "15–20 мин", rest: "—" },
  ] },
};

export const meals: MealTemplate[] = [
  { number: 1, breakfast: "Овсянка 50 г; молоко 150 мл; греческий йогурт 100 г; ягоды 100 г; банан 70–80 г", lunch: "Куриная грудка 160 г; рис 65 г (сух.); овощи 250–300 г; оливковое масло 8 г", snack: "Творог 170 г + яблоко", dinner: "Белая рыба 180–200 г; картофель 250 г; салат 250 г; йогуртовый соус", calories: 1700, protein: 120 },
  { number: 2, breakfast: "2 яйца; белки ~100 г; цельнозерновой хлеб 60 г; авокадо 40 г; овощи", lunch: "Паста 70 г (сух.); индейка 160 г; томаты; перец; пармезан 10–15 г", snack: "Греческий йогурт 200 г; ягоды; орехи 10 г", dinner: "Креветки 180 г; рис 50 г (сух.); большая порция овощей", calories: 1700, protein: 120 },
  { number: 3, breakfast: "Сырники: творог 180 г; яйцо; мука 25 г; ягоды; йогурт", lunch: "Нежирная говядина 150 г; гречка 65 г (сух.); салат 300 г", snack: "Банан + йогурт или протеиновый напиток", dinner: "Курица/индейка 170 г; картофель 220 г; овощи", calories: 1700, protein: 120 },
  { number: 4, breakfast: "Лаваш 60 г; 2 яйца; индейка 60–70 г; сыр 20 г; овощи", lunch: "Боул: курица 160 г; булгур 60 г (сух.); овощи 300 г; йогуртовый соус", snack: "Творог 150 г + груша", dinner: "Лосось 130–140 г; картофель 200 г; брокколи/стручковая фасоль 250 г", calories: 1700, protein: 120 },
  { number: 5, breakfast: "Овсянка 45 г; 2 яйца; ягоды или фрукт", lunch: "Домашняя шаурма: лаваш 60 г; курица 160 г; овощи; йогуртово-чесночный соус", snack: "Греческий йогурт 200 г + фрукт", dinner: "Котлеты из индейки 170–180 г; гречка 55 г (сух.); овощной салат", calories: 1700, protein: 120 },
  { number: 6, breakfast: "Омлет из 2 яиц; тосты 60 г; сыр 25 г; овощи", lunch: "Паста 70 г; курица/креветки 150–170 г; томатный соус; пармезан 15 г", snack: "Мороженое или десерт ~150–200 ккал", dinner: "Белая рыба 200 г; овощи; небольшая порция картофеля/риса", calories: 1700, protein: 120 },
  { number: 7, breakfast: "Греческий йогурт 250 г; гранола 35–40 г; ягоды; фрукт", lunch: "Индейка 170 г; картофель 250 г; салат", snack: "Творог 150 г + фрукт", dinner: "Цезарь: курица/креветки 170 г; романо; томаты; пармезан 15 г; лёгкий соус; сухарики 30 г", calories: 1700, protein: 120 },
];

const schedule: Array<[WorkoutTemplate["code"], string, number]> = [
  ["A", "", 6000], ["B", "", 6000], ["LISS", "30 мин", 6500], ["C", "", 6000], ["D", "3 круга", 6000], ["MOBILITY", "20 мин + прогулка", 7000], ["REST", "Спокойная активность", 6000],
  ["A", "", 6500], ["B", "", 6500], ["LISS", "35 мин", 7000], ["C", "", 7000], ["D", "3–4 круга", 7000], ["MOBILITY", "20–30 мин + прогулка", 7500], ["REST", "Спокойная активность", 6500],
  ["A", "Немного увеличить рабочий вес", 7500], ["B", "", 7500], ["LISS", "40 мин", 8000], ["C", "", 8000], ["D", "4 круга", 8000], ["MOBILITY", "20–30 мин + прогулка", 8500], ["REST", "Спокойная активность", 7500],
  ["A", "", 8000], ["B", "", 8000], ["LISS", "40–45 мин", 8500], ["C", "", 8500], ["D", "4 круга + немного тяжелее", 8500], ["MOBILITY", "20–30 мин", 9000], ["REST", "Спокойная активность", 8000],
  ["D", "Контрольный Full Body: записать веса и ощущения", 8500], ["RECOVERY", "40–60 мин прогулки + 15–20 мин mobility", 8500],
];

export const programDays: ProgramDay[] = schedule.map(([workoutCode, activity, steps], index) => ({
  day: index + 1,
  week: Math.floor(index / 7) + 1,
  workoutCode,
  activity,
  steps,
  menu: (index % 7) + 1,
}));

export const defaultProfile = {
  display_name: "",
  height_cm: 165,
  start_weight_kg: 85,
  target_weight_kg: 62.5,
  calories_target: 1700,
  protein_target_g: 120,
  water_target_l: 2.2,
  steps_target: 8500,
  start_date: new Date().toISOString().slice(0, 10),
};

export function getProgramDay(day: number) {
  return programDays[Math.min(29, Math.max(0, day - 1))];
}

export function getCurrentProgramDay(startDate?: string | null) {
  const start = startDate ? new Date(`${startDate}T00:00:00`) : new Date();
  const now = new Date();
  const diff = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()) / 86400000) + 1;
  return Math.min(30, Math.max(1, diff));
}
