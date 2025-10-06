/**
 * Googleカレンダー連携関連の型定義
 */

export const CalendarEventType = {
  DURING: 'during',    // 予定中の支出
  BETWEEN: 'between',  // 予定と予定の間の支出
} as const;

export type CalendarEventTypeValue = typeof CalendarEventType[keyof typeof CalendarEventType];

export interface CalendarEvent {
  eventId: string;
  eventName: string;
  startTime: Date;
  endTime: Date;
  description?: string;
}

export interface CalendarLink {
  eventId: string;
  eventName: string;
  eventType: CalendarEventTypeValue;
  betweenEvents?: {
    // betweenの場合、2つの予定を記録
    firstEventId: string;
    firstEventName: string;
    secondEventId: string;
    secondEventName: string;
  };
}

