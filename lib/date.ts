export function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatRuDate(date = new Date()) {
  return new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" }).format(date);
}

export function dayDate(startDate: string, day: number) {
  const date = new Date(`${startDate}T12:00:00`);
  date.setDate(date.getDate() + day - 1);
  return date;
}
