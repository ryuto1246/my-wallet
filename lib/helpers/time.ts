/**
 * 時間帯・曜日関連のヘルパー関数
 */

/**
 * 現在の時間帯を取得
 * @returns 時間帯（morning, afternoon, evening, night）
 */
export const getTimeOfDay = (): string => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
};

/**
 * 現在の曜日を取得
 * @returns 曜日（sunday, monday, tuesday, wednesday, thursday, friday, saturday）
 */
export const getDayOfWeek = (): string => {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[new Date().getDay()];
};

/**
 * 曜日を日本語で取得
 * @param date 日付（省略時は今日）
 * @returns 曜日（日、月、火、水、木、金、土）
 */
export const getDayOfWeekJa = (date: Date = new Date()): string => {
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return days[date.getDay()];
};

