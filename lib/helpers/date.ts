/**
 * 日付関連のヘルパー関数
 */

/**
 * 月の最初の日を取得
 */
export function getStartOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * 月の最後の日を取得
 */
export function getEndOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * 今月の日付範囲を取得
 */
export function getCurrentMonthRange(): { start: Date; end: Date } {
  return {
    start: getStartOfMonth(),
    end: getEndOfMonth(),
  };
}

/**
 * 先月の日付範囲を取得
 */
export function getLastMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return {
    start: getStartOfMonth(lastMonth),
    end: getEndOfMonth(lastMonth),
  };
}

/**
 * 今週の日付範囲を取得（月曜始まり）
 */
export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // 月曜日を週の始まりとする

  const start = new Date(now);
  start.setDate(now.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * 今日の日付範囲を取得
 */
export function getTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * カスタム期間の日付範囲を取得
 */
export function getCustomRange(
  startDate: Date,
  endDate: Date
): { start: Date; end: Date } {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * 年の最初の日を取得
 */
export function getStartOfYear(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), 0, 1);
}

/**
 * 年の最後の日を取得
 */
export function getEndOfYear(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

/**
 * 今年の日付範囲を取得
 */
export function getCurrentYearRange(): { start: Date; end: Date } {
  return {
    start: getStartOfYear(),
    end: getEndOfYear(),
  };
}

