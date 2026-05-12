import { motion } from "framer-motion";
import { Calendar, MoreHorizontal, Clock } from "lucide-react";
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
  MEDIUM: { label: "Medium", variant: "outline", class: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  LOW: { label: "Low", variant: "outline", class: "bg-stone-500/10 text-stone-500 border-stone-500/20" },
};

export default function CardTile({ card, provided, snapshot, onOpen }) {
  const isOverdue = card.dueDate && card.status !== "DONE" && new Date(card.dueDate) < new Date();
  const priority = priorityConfig[card.priority] || priorityConfig.LOW;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={onOpen}
      className={`relative group mb-3 select-none outline-none ${snapshot.isDragging ? 'z-50' : ''}`}
      style={{ ...provided.draggableProps.style }}
    >
      <div 
        className={`
          group relative flex flex-col gap-3 p-4 rounded-xl border bg-card text-card-foreground shadow-sm transition-all
          ${snapshot.isDragging ? 'rotate-[2deg] scale-[1.05] border-primary ring-4 ring-primary/10 shadow-2xl' : 'hover:border-primary/30 hover:shadow-md'}
        `}
      >
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-sm font-semibold leading-tight tracking-tight group-hover:text-primary transition-colors">
            {card.title}
          </h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen(); }}>View Details</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Archive Card</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-2 items-center mt-1">
          <Badge 
            variant={priority.variant} 
            className={`text-[9px] uppercase font-bold px-1.5 py-0 h-4 border ${priority.class}`}
          >
            {priority.label}
          </Badge>
          {card.tags && card.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-[9px] uppercase font-bold px-1.5 py-0 h-4">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 mt-1 border-t border-border/50">
          <div className="flex -space-x-2">
            {(card.memberIds?.length > 0 ? card.memberIds : [card.assigneeId]).filter(Boolean).map((id) => (
              <Avatar key={id} className="h-6 w-6 border-2 border-card">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            ))}
            {!card.assigneeId && (!card.memberIds || card.memberIds.length === 0) && (
              <Avatar className="h-6 w-6 border-2 border-card opacity-50">
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
            )}
          </div>

          <div className={`flex items-center gap-1.5 text-[10px] font-medium ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
            {isOverdue ? <Clock size={12} className="animate-pulse" /> : <Calendar size={12} />}
            <span>
              {card.dueDate 
                ? new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
                : 'No date'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
