import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight,
  Bell,
  Clock,
  PanelRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function BoardSidebar({ activities = [], onToggle }) {
  const [currentDate] = useState(new Date());

  const getWeekDays = () => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const result = [];
    for (let i = -2; i <= 2; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      result.push({ 
        day: days[d.getDay()], 
        date: d.getDate(), 
        isToday: i === 0,
        fullDate: d
      });
    }
    return result;
  };

  return (
    <div className="w-[340px] flex-shrink-0 bg-secondary/5 backdrop-blur-sm flex flex-col h-full animate-in slide-in-from-right-10 duration-700">
      <div className="p-8 space-y-10">
        
        {/* Calendar Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Station Time</span>
                <h3 className="text-[18px] font-black text-foreground tracking-tight">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
             </div>
              <div className="flex gap-1.5 items-center">
                 <div className="flex gap-1">
                    <button className="h-8 w-8 rounded-xl bg-secondary/50 border border-border/50 flex items-center justify-center hover:bg-secondary transition-all">
                       <ChevronLeft size={14} className="text-muted-foreground" />
                    </button>
                    <button className="h-8 w-8 rounded-xl bg-secondary/50 border border-border/50 flex items-center justify-center hover:bg-secondary transition-all">
                       <ChevronRight size={14} className="text-muted-foreground" />
                    </button>
                 </div>
                 <div className="w-px h-4 bg-border/50 mx-1" />
                 <button 
                   onClick={onToggle}
                   className="h-8 w-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center hover:bg-primary/20 transition-all"
                 >
                    <PanelRight size={14} />
                 </button>
              </div>
          </div>

          <div className="grid grid-cols-5 gap-2.5">
            {getWeekDays().map((d, i) => (
              <div 
                key={i} 
                className={`
                  flex flex-col items-center justify-center py-4 rounded-2xl border transition-all duration-500
                  ${d.isToday 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-primary scale-105 z-10' 
                    : 'bg-card border-border/50 text-muted-foreground hover:border-primary/30'}
                `}
              >
                <span className="text-[9px] font-black tracking-widest mb-1 opacity-60">{d.day}</span>
                <span className="text-[15px] font-black leading-none">{d.date}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Activity Feed */}
        <section className="space-y-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between">
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Live Stream</span>
                <h3 className="text-[18px] font-black text-foreground tracking-tight">Activity Log</h3>
             </div>
             <div className="h-6 px-2.5 rounded-full bg-rose-500/10 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[8px] font-black text-rose-500 uppercase tracking-wider">Realtime</span>
             </div>
          </div>

          <div className="space-y-6 overflow-y-auto no-scrollbar max-h-[calc(100vh-500px)]">
            {activities.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-20">
                <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-muted-foreground flex items-center justify-center">
                   <Bell size={20} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.1em]">Signal Silent</p>
              </div>
            ) : (
              activities.slice(0, 8).map((act, i) => (
                <div key={i} className="flex gap-4 group/act relative">
                  {/* Vertical Line Connector */}
                  {i < Math.min(activities.length, 8) - 1 && (
                    <div className="absolute left-[13px] top-8 bottom-[-24px] w-0.5 bg-border/30" />
                  )}
                  
                  <div className={`h-7 w-7 rounded-lg shrink-0 flex items-center justify-center z-10 transition-transform group-hover/act:scale-110 ${i === 0 ? 'bg-primary/20 border border-primary/30' : 'bg-secondary/50 border border-border/50'}`}>
                    <Bell size={12} className={i === 0 ? 'text-primary' : 'text-muted-foreground/40'} />
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[12px] font-bold text-foreground leading-snug group-hover/act:text-primary transition-colors">
                      {act.title}
                    </p>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-medium text-muted-foreground/40 line-clamp-1">{act.message}</span>
                       <span className="w-1 h-1 rounded-full bg-border" />
                       <span className="text-[9px] font-black text-muted-foreground/20 uppercase whitespace-nowrap">2m ago</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <button className="w-full h-11 rounded-2xl border border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
            View Mission History
          </button>
        </section>

      </div>
    </div>
  );
}
