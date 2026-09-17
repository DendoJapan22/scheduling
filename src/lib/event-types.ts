export type EventPublic = {
  publicId: string;
  title: string;
  startDate: string;
  endDate: string;
  dailyStart: number;
  dailyEnd: number;
  slotMinutes: number;
  desiredMinutes: number;
};

export type ParticipantPublic = {
  id: string;
  name: string;
  slotKeys: string[];
};

export type Results = {
  participants: ParticipantPublic[];
};
