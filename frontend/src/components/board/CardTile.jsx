import { Calendar, ArrowUpRight, Clock, MessageSquare, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Draggable } from "react-beautiful-dnd";

export default function CardTile({ card, index, boardId, onDeleteCard, readOnly }) {
  const navigate = useNavigate();

  const getPriorityTagColor = (p) => {
    switch (p) {
      case "CRITICAL": return "bg-purple-500/10 text-purple-300/50 border border-purple-500/20";
      case "HIGH": return "bg-red-500/10 text-red-300/50 border border-red-500/20";
      case "MEDIUM": return "bg-green-500/10 text-green-300/50 border border-green-500/20";
      default: return "bg-white/5 text-white/40 border border-white/10";
    }
  };

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Logic to determine if we should show certain UI elements
  const hasDescription = card.description && card.description.trim().length > 0;
  const dueDate = formatDate(card.dueDate);
  const priority = card.priority;
  const progress = priority === "HIGH" ? 75 : priority === "MEDIUM" ? 45 : 20;

  return (
    <Draggable draggableId={`card-${card.cardId}`} index={index} isDragDisabled={readOnly}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => navigate(`/boards/${boardId}/registry/${card.cardId}`)}
          className={`
            group relative p-4 rounded-[32px] transition-all duration-500 cursor-pointer mb-2
            ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-[0_30px_60px_rgba(0,0,0,0.5)] z-50 bg-background border-primary/40' : 'bg-card border border-border/50 hover:border-primary/20 hover:bg-accent/5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:-translate-y-1'}
          `}
        >
          {/* Internal Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px] pointer-events-none" />

          <div className="relative space-y-3">
            {/* Tag Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {priority && (
                  <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${getPriorityTagColor(priority)}`}>
                    {priority}
                  </span>
                )}
                {card.status === "DONE" && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500/60">
                    Completed
                  </span>
                )}
              </div>
              <motion.button 
                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/80 border border-border text-foreground hover:bg-accent hover:border-primary/30 transition-all duration-500 overflow-hidden relative group-hover:scale-125"
                onClick={(e) => { e.stopPropagation(); navigate(`/boards/${boardId}/registry/${card.cardId}`); }}
              >
                <motion.div
                  className="transition-transform duration-500 group-hover:rotate-12 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                >
                  <ArrowUpRight size={18} />
                </motion.div>
              </motion.button>
            </div>

            {/* Title Block */}
            <div className="space-y-1.5">
              <h4 className="text-[24px] font-black text-foreground transition-colors leading-[1.1] tracking-tight pt-1">
                {card.title || "Untitled Objective"}
              </h4>
              {hasDescription && (
                <p className="text-[10.5px] text-muted-foreground font-thin line-clamp-3 leading-tight mt-1 ">
                  {card.description}
                </p>
              )}
            </div>

            {/* Progress Visual */}
            <div className="space-y-3 pt-4">
              <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="absolute top-0 left-0 h-full bg-slate-600 rounded-full transition-all duration-1000"
                />
              </div>
              <div className="flex items-center justify-between">
                {dueDate ? (
                  <div className="flex items-center gap-2 text-violet-400/50">
                    <Calendar size={12} />
                    <span className="text-[10px] font-bold tracking-wider">{dueDate}</span>
                  </div>
                ) : (
                  <div />
                )}
                <span className={`text-[8px] font-black uppercase tracking-widest ${card.status === "DONE" ? "text-emerald-500/60" : "text-lime-300"}`}>
                  {card.status === "DONE" ? "Mission Clear" : "Active"}
                </span>
              </div>
            </div>

            {/* Footer Row (Only show if there's data) */}
            {(card.assigneeId || card.commentCount > 0) && (
              <div className="flex items-center justify-between pt-3 border-white/5">
                <div className="flex -space-x-2">
                  {card.assigneeId && (
                    <Avatar className="h-8 w-8 border-2 border-[#181920] ring-1 ring-white/5">
                      <AvatarFallback className="bg-[#1c1d26] text-[10px] font-black text-white/20">
                        U
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                {card.commentCount > 0 && (
                  <div className="flex items-center gap-3 text-white/10">
                    <div className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      <span className="text-[10px] font-black">{card.commentCount}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
