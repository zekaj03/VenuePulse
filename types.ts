
export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other',
}

export interface LogEntry {
  id: number;
  timestamp: Date;
  action: 'in' | 'out';
  gender: Gender;
}
