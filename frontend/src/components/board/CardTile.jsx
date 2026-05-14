import { Calendar, MoreHorizontal, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const priorityConfig = {
  CRITICAL: { label: "Critical", variant: "destructive", class: "bg-red-500/10 text-red-500 border-red-500/20" },
  HIGH: { label: "High", variant: "outline", class: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  MEDIUM: { label: "Medium", variant: "outline", class: "bg-teal-500/10 text-teal-500 border-teal-500/20" },
  LOW: { label: "Low", variant: "outline", class: "bg-stone-500/10 text-stone-500 border-stone-500/20" },
};

export default function CardTile({ card, provided, snapshot, boardId }) {
  const navigate = useNavigate();
  const isOverdue = card.dueDate && card.status !== "DONE" && new Date(card.dueDate) < new Date();
  const priority = priorityConfig[card.priority] || priorityConfig.LOW;

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={() => navigate(`/boards/${boardId}/registry/${card.cardId}`)}
      className={`relative group mb-2.5 select-none outline-none ${snapshot.isDragging ? 'z-50' : ''}`}
      style={{ ...provided.draggableProps.style }}
    >
      <div 
        className={`
          group relative flex flex-col gap-2.5 p-3.5 rounded-xl border bg-card/40 backdrop-blur-md text-card-foreground transition-all
          ${snapshot.isDragging 
            ? 'rotate-[1deg] scale-[1.02] bg-card' 
            : 'border-white/5'}
        `}
        style={{
          borderTopColor: card.coverColor || 'transparent',
          borderTopWidth: card.coverColor ? '3px' : '1px'
        }}
      >
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-[13px] font-bold leading-snug tracking-tight text-foreground/90 group-hover:text-primary transition-colors duration-200 uppercase">
            {card.title}
          </h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/40 hover:bg-white/5 hover:text-foreground opacity-0 group-hover:opacity-100 transition-all duration-200">
                <MoreHorizontal size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#0d1117] border-white/10 rounded-xl">
              <DropdownMenuItem className="text-xs font-bold uppercase tracking-widest cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/boards/${boardId}/registry/${card.cardId}`); }}>View Registry</DropdownMenuItem>
              <DropdownMenuItem className="text-xs font-bold uppercase tracking-widest text-destructive">Archive Signal</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-1.5 items-center">
          <Badge 
            variant={priority.variant} 
            className={`text-[8px] uppercase font-black px-1.5 py-0 h-4 border-none tracking-widest ${priority.class}`}
          >
            {priority.label}
          </Badge>
          {card.tags && card.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-[8px] uppercase font-black px-1.5 py-0 h-4 bg-muted text-muted-foreground/60 border-none tracking-widest">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2.5 mt-0.5 border-t border-border/50">
          <div className="flex -space-x-1.5">
            {(card.memberIds?.length > 0 ? card.memberIds : [card.assigneeId]).filter(Boolean).map((id) => (
              <Avatar key={id} className="h-5 w-5 border border-white/10 opacity-30">
                <AvatarFallback className="text-[8px] font-black bg-white/5 text-foreground/40">{id.toString().charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            {!card.assigneeId && (!card.memberIds || card.memberIds.length === 0) && (
              <div className="h-5 w-5 rounded-full bg-muted/20 border border-border/40 flex items-center justify-center text-[8px] font-black text-muted-foreground/40">
                ?
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <div 
              className={`
                flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-widest
                ${isOverdue ? 'bg-red-500/10 text-red-500' : 'text-muted-foreground/40'}
              `}
            >
              {isOverdue ? <Clock size={10} className="animate-pulse" /> : <Calendar size={10} className="opacity-50" />}
              <span>
                {card.dueDate 
                  ? new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase()
                  : 'NO DATA'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
