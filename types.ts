export interface TimeSession {
  id: string;
  startTime: number;
  endTime: number | null; // null if currently running
  duration: number; // in milliseconds
}

export interface Task {
  id: string;
  title: string;
  color: string;
  sessions: TimeSession[];
  createdAt: number;
}

export enum Period {
  Today = 'Today',
  Week = 'Week',
  Month = 'Month'
}

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface DailyActivity {
  day: string; // e.g., "Mon", "Tue"
  [taskId: string]: number | string; // Dynamic keys for stacked bar chart
}