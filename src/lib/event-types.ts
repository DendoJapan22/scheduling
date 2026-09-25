import type { DayWindow } from "./days";

export type EventPublic = {
  publicId: string;
  title: string;
  startDate: string;
  endDate: string;
  dailyStart: number;
  dailyEnd: number;
  slotMinutes: number;
  desiredMinutes: number;
  days: DayWindow[] | null;
};

export type ParticipantPublic = {
  id: string;
  name: string;
  slotKeys: string[];
};

export type Results = {
  participants: ParticipantPublic[];
};
