import { TimeSession, Task } from './types';

export const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
];

export const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export const formatDuration = (ms: number): string => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)));

  const pad = (n: number) => n.toString().padStart(2, '0');
  
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};

export const formatDurationHuman = (ms: number): string => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  
  if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`;
  }
  return `${minutes}分钟`;
};

export const formatDateCN = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日${weekday}`;
};

// Calculate total duration for a task including specific sessions
export const getTaskTotalDuration = (task: Task): number => {
  return task.sessions.reduce((acc, session) => {
    return acc + (session.endTime ? session.duration : 0);
  }, 0);
};

export const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

export const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday (make Monday start)
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getEndOfWeek = (date: Date) => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

export const getStartOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getEndOfMonth = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0); // Last day of previous month (so +1 month, day 0)
  d.setHours(23, 59, 59, 999);
  return d;
};

// Generate a 42-cell grid for the calendar view (6 rows x 7 cols)
export const getCalendarGrid = (year: number, month: number): Date[] => {
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
  
  // Calculate start date of the grid (go back to Sunday)
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - startDayOfWeek);
  
  const grid: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    grid.push(d);
  }
  return grid;
};