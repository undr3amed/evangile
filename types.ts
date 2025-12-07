export interface Reading {
  title: string;
  reference: string;
  text: string;
}

export interface LiturgyDay {
  date: string;
  liturgicalColor: 'green' | 'red' | 'white' | 'purple' | 'rose';
  liturgicalDayName: string; // e.g., "3e dimanche de l'Avent"
  firstReading?: Reading;
  psalm?: Reading;
  secondReading?: Reading;
  gospel: Reading;
}

export enum ViewMode {
  READING = 'READING',
  REFLECTION = 'REFLECTION',
}
