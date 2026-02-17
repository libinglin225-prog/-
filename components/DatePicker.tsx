import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getCalendarGrid, isSameDay } from '../utils';
import { Task, Period } from '../types';

interface DatePickerProps {
  currentDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
  tasks: Task[];
  period: Period;
}

const DatePicker: React.FC<DatePickerProps> = ({ currentDate, onSelect, onClose, tasks, period }) => {
  // View state (tracks which year/month is currently being viewed)
  const [viewDate, setViewDate] = useState(new Date(currentDate));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const isMonthPicker = period === Period.Month;

  // Identify dates/months that have data
  const { datesWithData, monthsWithData } = useMemo(() => {
    const dates = new Set<string>();
    const months = new Set<string>();
    tasks.forEach(task => {
      task.sessions.forEach(session => {
        const d = new Date(session.startTime);
        // Date key: YYYY-M-D
        dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
        // Month key: YYYY-M
        months.add(`${d.getFullYear()}-${d.getMonth()}`);
      });
    });
    return { datesWithData: dates, monthsWithData: months };
  }, [tasks]);

  const prevPage = () => {
    if (isMonthPicker) {
      setViewDate(new Date(year - 1, month, 1));
    } else {
      setViewDate(new Date(year, month - 1, 1));
    }
  };

  const nextPage = () => {
    if (isMonthPicker) {
      setViewDate(new Date(year + 1, month, 1));
    } else {
      setViewDate(new Date(year, month + 1, 1));
    }
  };

  const handleSelect = (date: Date) => {
    onSelect(date);
  };

  const renderMonthPicker = () => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    return (
      <div className="grid grid-cols-3 gap-4">
        {months.map(m => {
          const date = new Date(year, m, 1);
          // Check if this month matches the currently selected month (ignoring day)
          const isSelected = year === currentDate.getFullYear() && m === currentDate.getMonth();
          const isCurrentMonth = year === new Date().getFullYear() && m === new Date().getMonth();
          const hasData = monthsWithData.has(`${year}-${m}`);

          return (
            <button
              key={m}
              onClick={() => handleSelect(date)}
              className={`
                h-14 rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all relative
                ${isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'hover:bg-slate-100 text-slate-700'}
                ${isCurrentMonth && !isSelected ? 'border border-indigo-600 text-indigo-600' : ''}
              `}
            >
              <span>{m + 1}月</span>
              {hasData && (
                <span className={`absolute bottom-2 w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : 'bg-indigo-500'}`}></span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderDayPicker = () => {
    const grid = getCalendarGrid(year, month);
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    return (
      <>
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-medium text-slate-400 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-2">
          {grid.map((date, index) => {
            const isCurrentMonth = date.getMonth() === month;
            const isSelected = isSameDay(date, currentDate);
            const isToday = isSameDay(date, new Date());
            
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const hasData = datesWithData.has(dateKey);

            return (
              <button
                key={index}
                onClick={() => handleSelect(date)}
                className={`
                  h-10 w-10 mx-auto flex flex-col items-center justify-center rounded-full text-sm font-medium transition-all relative
                  ${!isCurrentMonth ? 'text-slate-300' : 'text-slate-700'}
                  ${isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'hover:bg-slate-100'}
                  ${isToday && !isSelected ? 'border border-indigo-600 text-indigo-600' : ''}
                `}
              >
                <span>{date.getDate()}</span>
                {/* Data Indicator Dot */}
                {hasData && (
                  <span className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : 'bg-indigo-500'}`}></span>
                )}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 transform transition-all scale-100">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800">
            {isMonthPicker ? `${year}年` : `${year}年 ${month + 1}月`}
          </h3>
          <div className="flex items-center gap-1">
             <button onClick={prevPage} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full">
               <ChevronLeft size={20} />
             </button>
             <button onClick={nextPage} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full">
               <ChevronRight size={20} />
             </button>
             <button onClick={onClose} className="p-2 ml-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full">
               <X size={20} />
             </button>
          </div>
        </div>

        {/* Content */}
        {isMonthPicker ? renderMonthPicker() : renderDayPicker()}

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <button 
                onClick={() => handleSelect(new Date())}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
                {isMonthPicker ? '回到本月' : '回到今天'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default DatePicker;