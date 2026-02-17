import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Plus, Trash2, List, BarChart2, X } from 'lucide-react';
import { Task, Period } from './types';
import { getRandomColor, formatDuration, getTaskTotalDuration, formatDateCN, isSameDay } from './utils';
import Stats from './components/Stats';
import { generateProductivityInsight } from './services/geminiService';

const App: React.FC = () => {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('focusflow_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => {
    return localStorage.getItem('focusflow_active_id');
  });

  const [startTime, setStartTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('focusflow_start_time');
    return saved ? parseInt(saved, 10) : null;
  });

  const [currentSessionDuration, setCurrentSessionDuration] = useState<number>(0);
  const [view, setView] = useState<'tasks' | 'stats'>('tasks');
  const [period, setPeriod] = useState<Period>(Period.Today);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  
  const intervalRef = useRef<number | null>(null);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('focusflow_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (activeTaskId) {
      localStorage.setItem('focusflow_active_id', activeTaskId);
    } else {
      localStorage.removeItem('focusflow_active_id');
    }
  }, [activeTaskId]);

  useEffect(() => {
    if (startTime) {
      localStorage.setItem('focusflow_start_time', startTime.toString());
    } else {
      localStorage.removeItem('focusflow_start_time');
    }
  }, [startTime]);

  useEffect(() => {
    if (activeTaskId && startTime) {
      intervalRef.current = window.setInterval(() => {
        setCurrentSessionDuration(Date.now() - startTime);
      }, 1000);
    } else {
      setCurrentSessionDuration(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTaskId, startTime]);


  // --- Handlers ---
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskName,
      color: getRandomColor(),
      sessions: [],
      createdAt: Date.now(),
    };

    setTasks([...tasks, newTask]);
    setNewTaskName('');
    setIsModalOpen(false);
  };

  const deleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTaskId === id) stopTimer();
    setTasks(tasks.filter(t => t.id !== id));
  };

  const startTimer = (taskId: string) => {
    if (activeTaskId) stopTimer();
    setActiveTaskId(taskId);
    setStartTime(Date.now());
  };

  const stopTimer = () => {
    if (!activeTaskId || !startTime) return;
    const endTime = Date.now();
    const duration = endTime - startTime;

    setTasks(prevTasks => prevTasks.map(t => {
      if (t.id === activeTaskId) {
        return {
          ...t,
          sessions: [
            ...t.sessions,
            { id: crypto.randomUUID(), startTime, endTime, duration }
          ]
        };
      }
      return t;
    }));

    setActiveTaskId(null);
    setStartTime(null);
    setCurrentSessionDuration(0);
  };

  const toggleTimer = (taskId: string) => {
    if (activeTaskId === taskId) {
      stopTimer();
    } else {
      startTimer(taskId);
    }
  };

  // --- Helper for Today's Stats ---
  const getTaskTodayStats = (task: Task) => {
    const today = new Date();
    const todaySessions = task.sessions.filter(s => s.endTime && isSameDay(new Date(s.startTime), today));
    
    // Add current session if active and belongs to this task
    let todayDuration = todaySessions.reduce((acc, s) => acc + s.duration, 0);
    if (activeTaskId === task.id) {
        todayDuration += currentSessionDuration;
    }
    
    const count = task.sessions.length + (activeTaskId === task.id ? 1 : 0);
    return { duration: todayDuration, count };
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="max-w-md mx-auto bg-white min-h-screen relative shadow-2xl overflow-hidden flex flex-col">
        
        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          
          {view === 'tasks' && (
            <div className="animate-in fade-in duration-500 pb-24">
              {/* Header */}
              <div className="flex justify-between items-start mb-8 pt-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-1">今日专注</h1>
                  <p className="text-slate-500 text-sm font-medium">{formatDateCN(new Date())}</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-12 h-12 bg-[#1a1b2e] rounded-full flex items-center justify-center text-white shadow-lg shadow-slate-300 hover:scale-105 transition-transform"
                >
                  <Plus size={24} />
                </button>
              </div>

              {/* Task List */}
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <p>还没有任务，点击右上角添加</p>
                  </div>
                ) : (
                  tasks.map(task => {
                    const isActive = activeTaskId === task.id;
                    const { duration: todayDuration, count } = getTaskTodayStats(task);

                    return (
                      <div 
                        key={task.id} 
                        className={`relative bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between transition-all ${isActive ? 'ring-2 ring-indigo-500/10 border-indigo-100' : ''}`}
                      >
                         {/* Left Content */}
                        <div className="flex items-center gap-4">
                          {/* Colored Bar */}
                          <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: task.color }}></div>
                          
                          <div>
                            <h3 className="font-bold text-lg text-slate-800 leading-tight mb-1">{task.title}</h3>
                            <div className="text-xs text-slate-400 font-medium">
                              <span className="mr-3">今日: {formatDuration(todayDuration)}</span>
                              <span>累计: {count} 次</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Action */}
                        <div className="flex items-center gap-2">
                           {/* Trash Icon (Hidden by default, shown on hover/group if we had hover on mobile, kept simple for now) */}
                           <button 
                              onClick={(e) => deleteTask(task.id, e)}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                           >
                              <Trash2 size={16} />
                           </button>

                           <button 
                            onClick={() => toggleTimer(task.id)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}
                          >
                            {isActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {view === 'stats' && (
            <Stats tasks={tasks} period={period} setPeriod={setPeriod} />
          )}

        </main>

        {/* Bottom Navigation */}
        <div className="border-t border-slate-100 bg-white absolute bottom-0 w-full pb-safe">
          <div className="flex justify-around items-center h-16">
            <button 
              onClick={() => setView('tasks')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${view === 'tasks' ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <List size={22} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">任务</span>
            </button>
            <button 
              onClick={() => setView('stats')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${view === 'stats' ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <BarChart2 size={22} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">统计</span>
            </button>
          </div>
        </div>

      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom-10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">新建任务</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={addTask}>
              <div className="mb-6">
                <input
                  autoFocus
                  type="text"
                  placeholder="请输入任务名称..."
                  className="w-full px-4 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none transition-all text-lg text-slate-800 placeholder:text-slate-400"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                disabled={!newTaskName.trim()}
                className="w-full py-4 bg-[#1a1b2e] hover:bg-slate-800 disabled:opacity-70 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]"
              >
                确认创建
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;