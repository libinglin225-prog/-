import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Task, Period } from '../types';
import { getStartOfWeek, getStartOfMonth, isSameDay, getEndOfWeek, getEndOfMonth, formatDateCN } from '../utils';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import DatePicker from './DatePicker';

interface StatsProps {
  tasks: Task[];
  period: Period;
  setPeriod: (p: Period) => void;
}

const Stats: React.FC<StatsProps> = ({ tasks, period, setPeriod }) => {
  // State to track the currently viewed date (default to now)
  const [dateCursor, setDateCursor] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Reset to today whenever the view period changes (e.g. switching from Month to Day)
  useEffect(() => {
    setDateCursor(new Date());
  }, [period]);

  // Handle previous button click
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newDate = new Date(dateCursor);
    if (period === Period.Today) {
      newDate.setDate(newDate.getDate() - 1);
    } else if (period === Period.Week) {
      newDate.setDate(newDate.getDate() - 7);
    } else if (period === Period.Month) {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setDateCursor(newDate);
  };

  // Handle next button click
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newDate = new Date(dateCursor);
    if (period === Period.Today) {
      newDate.setDate(newDate.getDate() + 1);
    } else if (period === Period.Week) {
      newDate.setDate(newDate.getDate() + 7);
    } else if (period === Period.Month) {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setDateCursor(newDate);
  };

  const handleDateSelect = (date: Date) => {
    setDateCursor(date);
    setIsDatePickerOpen(false);
  };

  // Filter data based on dateCursor and period
  const data = useMemo(() => {
    let filteredTasks = tasks.map(task => {
      // Filter sessions based on period relative to dateCursor
      const relevantSessions = task.sessions.filter(session => {
        if (!session.endTime) return false;
        const sessionDate = new Date(session.startTime);
        
        if (period === Period.Today) {
          return isSameDay(sessionDate, dateCursor);
        } else if (period === Period.Week) {
          const start = getStartOfWeek(dateCursor);
          const end = getEndOfWeek(dateCursor);
          return sessionDate >= start && sessionDate <= end;
        } else if (period === Period.Month) {
          const start = getStartOfMonth(dateCursor);
          const end = getEndOfMonth(dateCursor);
          return sessionDate >= start && sessionDate <= end;
        }
        return true;
      });

      const totalDuration = relevantSessions.reduce((acc, s) => acc + s.duration, 0);
      return {
        ...task,
        periodDuration: totalDuration
      };
    }).filter(t => t.periodDuration > 0);

    return filteredTasks.sort((a, b) => b.periodDuration - a.periodDuration);
  }, [tasks, period, dateCursor]);

  // Generate the display label for the date navigator
  const getDateLabel = () => {
    const now = new Date();
    
    if (period === Period.Today) {
      if (isSameDay(dateCursor, now)) return '今天';
      return formatDateCN(dateCursor);
    } 
    
    if (period === Period.Week) {
      const start = getStartOfWeek(dateCursor);
      const end = getEndOfWeek(dateCursor);
      const startNow = getStartOfWeek(now);
      
      // If the start of the viewed week is the same as the start of current week
      if (start.getTime() === startNow.getTime()) return '本周';
      return `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;
    } 
    
    if (period === Period.Month) {
      if (dateCursor.getMonth() === now.getMonth() && dateCursor.getFullYear() === now.getFullYear()) {
        return '本月';
      }
      return `${dateCursor.getFullYear()}年${dateCursor.getMonth() + 1}月`;
    }

    return '';
  };

  const barData = data.map(t => ({
    name: t.title,
    minutes: Math.round(t.periodDuration / 1000 / 60),
    fill: t.color
  }));

  const totalTime = data.reduce((acc, curr) => acc + curr.periodDuration, 0);
  const hours = Math.floor(totalTime / (1000 * 60 * 60));
  const minutes = Math.floor((totalTime / (1000 * 60)) % 60);
  
  const formatBigTime = () => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}`;
  };

  const periodLabels: Record<Period, string> = {
    [Period.Today]: '天',
    [Period.Week]: '周',
    [Period.Month]: '月',
  };

  return (
    <div className="animate-in fade-in duration-500 pb-24">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">数据统计</h2>

      {/* Period Selector */}
      <div className="bg-slate-100 p-1 rounded-xl flex mb-4">
        {[Period.Today, Period.Week, Period.Month].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
              period === p 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Date Navigator - Clickable to open Calendar */}
      <div 
        className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between mb-6 shadow-sm select-none cursor-pointer hover:border-indigo-200 transition-colors group"
        onClick={() => setIsDatePickerOpen(true)}
      >
        <button 
          onClick={handlePrev}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <ChevronLeft size={20}/>
        </button>
        
        <div className="flex items-center gap-2 text-slate-700 font-medium text-sm group-hover:text-indigo-600 transition-colors">
          <Calendar size={16} className="text-indigo-500" />
          <span>{getDateLabel()}</span>
        </div>
        
        <button 
          onClick={handleNext}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <ChevronRight size={20}/>
        </button>
      </div>

      {/* Date Picker Modal */}
      {isDatePickerOpen && (
        <DatePicker 
          currentDate={dateCursor} 
          onSelect={handleDateSelect} 
          onClose={() => setIsDatePickerOpen(false)} 
          tasks={tasks}
          period={period}
        />
      )}

      {/* Total Duration Card */}
      <div className="bg-[#1a1b2e] rounded-2xl p-6 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-slate-400 text-sm mb-2">专注时长</p>
          <div className="text-6xl font-bold tracking-tight font-mono">
            {formatBigTime()}
          </div>
        </div>
        {/* Abstract decoration */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Distribution Chart */}
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-slate-800 rounded-full"></span>
        时长分布
      </h3>

      {data.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl h-40 flex items-center justify-center text-slate-400 text-sm">
          该时间段没有记录
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm h-64">
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={70} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="minutes" radius={[0, 4, 4, 0]} barSize={20}>
                  {barData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default Stats;