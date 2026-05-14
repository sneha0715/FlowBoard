import React from 'react';

const statsConfig = [
  { 
    id: 'BACKLOG', 
    label: 'Backlog', 
    color: '#FF9F43',
    bgColor: 'rgba(255, 159, 67, 0.15)',
  },
  { 
    id: 'IN_PROGRESS', 
    label: 'In Progress', 
    color: '#A29BFE',
    bgColor: 'rgba(162, 155, 254, 0.15)',
  },
  { 
    id: 'COMPLETED', 
    label: 'Completed', 
    color: '#55efc4',
    bgColor: 'rgba(85, 239, 196, 0.15)',
  }
];

export default function BoardSummary({ cards = [], lists = [] }) {
  const getCount = (type) => {
    const listNames = {
      BACKLOG: ['backlog', 'to do', 'todo'],
      IN_PROGRESS: ['in progress', 'doing', 'active', 'in review'],
      COMPLETED: ['done', 'completed', 'finished']
    };
    const targetLists = lists.filter(l => 
      listNames[type].some(name => l.name?.toLowerCase().includes(name))
    );
    const listIds = targetLists.map(l => l.listId);
    return cards.filter(c => listIds.includes(c.listId)).length;
  };

  return (
    <div className="flex gap-3">
      {statsConfig.map((stat) => (
        <div
          key={stat.id}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[140px]"
          style={{ backgroundColor: stat.bgColor }}
        >
          {/* Left colored bar */}
          <div 
            className="w-[3px] h-10 rounded-full"
            style={{ backgroundColor: stat.color }}
          />
          <div className="flex flex-col">
            <span 
              className="text-[11px] font-semibold"
              style={{ color: stat.color }}
            >
              {stat.label}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white leading-tight">
                {getCount(stat.id)}
              </span>
              <span className="text-[11px] text-white/40 font-medium">
                Task
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
