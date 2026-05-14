import { useState } from "react";
import { Draggable } from "react-beautiful-dnd";
import { Plus, MoreVertical, Trash2, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import CardTile from "./CardTile";
import { StrictModeDroppable } from "./StrictModeDroppable";

// Column header colors matching the screenshot
const columnColors = {
  'backlog': '#FF9F43',
  'to do': '#FF9F43',
  'todo': '#FF9F43',
  'in progress': '#A29BFE',
  'doing': '#A29BFE',
  'active': '#A29BFE',
  'in review': '#74b9ff',
  'review': '#74b9ff',
  'done': '#55efc4',
  'completed': '#55efc4',
  'finished': '#55efc4',
};

function getColumnColor(name) {
  const lower = name?.toLowerCase() || '';
  for (const [key, color] of Object.entries(columnColors)) {
    if (lower.includes(key)) return color;
  }
  return '#A29BFE'; // default purple
}

export default function ColumnLane({ 
  list, 
  cards, 
  onCreateCard, 
  onRenameList, 
  onDeleteList, 
  onDeleteCard,
  onMoveList,
  otherBoards,
  saving,
  readOnly,
  boardId 
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", priority: "MEDIUM" });
  const color = getColumnColor(list.name);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    onCreateCard(list.listId, draft);
    setDraft({ title: "", description: "", priority: "MEDIUM" });
    setOpen(false);
  };

  return (
    <Draggable draggableId={`column-${list.listId}`} index={list.position} isDragDisabled={readOnly}>
      {(columnProvided) => (
        <div
          ref={columnProvided.innerRef}
          {...columnProvided.draggableProps}
          className="w-[270px] flex-shrink-0 flex flex-col h-full group/column relative"
          style={columnProvided.draggableProps.style}
        >
          {/* Column Header */}
          <div 
            {...columnProvided.dragHandleProps}
            className="flex items-center justify-between mb-3 px-1"
          >
            <div className="flex items-center gap-2 bg-secondary/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/50 shadow-sm">
              <div 
                className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}80` }}
              />
              <span className="text-[12px] font-black uppercase tracking-wider text-foreground leading-none">
                {list.name}
              </span>
              <div className="flex items-center justify-center bg-background/50 h-6 px-3 rounded-full border border-border/30 ml-2">
                <span className="text-[11px] font-black text-primary leading-none">
                  {cards.length}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover/column:opacity-100 transition-all duration-300">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-secondary transition-all">
                    <MoreVertical size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border rounded-2xl min-w-[180px] p-1.5 shadow-2xl">
                  <DropdownMenuItem 
                    className="text-[11px] font-bold uppercase tracking-wider gap-3 p-2.5 rounded-xl cursor-pointer" 
                    onClick={() => {
                      const next = prompt("Rename Stage:", list.name);
                      if (next) onRenameList(list.listId, { name: next });
                    }}
                  >
                    <Edit2 size={12} className="text-primary" /> Rename Stage
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50 my-1" />
                  <DropdownMenuItem
                    className="text-[11px] font-bold uppercase tracking-wider gap-3 p-2.5 rounded-xl cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (window.confirm(`Decommission Stage "${list.name}"?`)) {
                        onDeleteList(list.listId);
                      }
                    }}
                  >
                    <Trash2 size={12} /> Delete Stage
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Cards Container */}
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar">
            <StrictModeDroppable droppableId={String(list.listId)}>
              {(droppableProvided, snapshot) => (
                <div
                  ref={droppableProvided.innerRef}
                  {...droppableProvided.droppableProps}
                  className={`
                    flex-1 flex flex-col p-1 transition-all duration-300 min-h-[400px] rounded-[32px]
                    ${snapshot.isDraggingOver ? "bg-white/[0.02]" : ""}
                  `}
                >
                  <div className="flex-1 space-y-5">
                    {cards.map((card, index) => (
                      <CardTile
                        key={card.cardId}
                        card={card}
                        index={index}
                        boardId={boardId}
                        onDeleteCard={onDeleteCard}
                        readOnly={readOnly}
                      />
                    ))}
                    {droppableProvided.placeholder}

                    {cards.length === 0 && !snapshot.isDraggingOver && (
                      <div 
                        onClick={() => !readOnly && setOpen(true)}
                        className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/[0.05] rounded-[32px] gap-6 group/placeholder cursor-pointer hover:bg-white/[0.02] hover:border-primary/20 transition-all duration-500 min-h-[350px]"
                      >
                        <div className="h-16 w-16 rounded-[24px] bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover/placeholder:scale-110 group-hover/placeholder:bg-primary/10 group-hover/placeholder:border-primary/20 transition-all duration-500">
                          <Plus size={30} className="text-white/10 group-hover/placeholder:text-primary transition-colors" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-[12px] font-black uppercase tracking-[0.4em] text-white/20 group-hover/placeholder:text-white/40 transition-colors">
                            Activate {list.name}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-white/5 group-hover/placeholder:text-white/20 transition-colors">
                            Mission System Interface
                          </span>
                        </div>
                      </div>
                    )}

                    {!readOnly && (
                      <div className="mt-3">
                        <AnimatePresence mode="wait">
                          {!open ? (
                            <button
                              className="w-full h-11 flex items-center justify-center gap-3 text-muted-foreground/30 hover:text-primary hover:bg-primary/5 rounded-[20px] transition-all duration-300 border border-dashed border-border/50 hover:border-primary/30 group/add"
                              onClick={() => setOpen(true)}
                            >
                              <Plus size={16} className="group-hover/add:rotate-90 transition-transform duration-300" />
                              <span className="text-[11px] font-black uppercase tracking-widest">Add Objective</span>
                            </button>
                          ) : (
                            <motion.form
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              onSubmit={handleSubmit}
                              className="bg-card border border-primary/20 p-4 rounded-[24px] shadow-2xl space-y-4"
                            >
                              <Input
                                autoFocus
                                placeholder="Objective Name..."
                                value={draft.title}
                                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                                className="h-10 bg-secondary/30 border-none text-[13px] font-bold text-foreground focus-visible:ring-0 placeholder:text-muted-foreground/20 px-4 rounded-xl"
                              />
                              <div className="flex justify-between items-center">
                                 <div className="flex gap-2">
                                    {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                                      <button
                                        key={p}
                                        type="button"
                                        onClick={() => setDraft({ ...draft, priority: p })}
                                        className={`text-[10px] font-black px-3 py-1.5 rounded-xl transition-all ${draft.priority === p ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-secondary text-muted-foreground/30 hover:text-foreground'}`}
                                      >
                                        {p}
                                      </button>
                                    ))}
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <button 
                                      type="button" 
                                      className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground/30 hover:bg-secondary transition-all" 
                                      onClick={() => setOpen(false)}
                                    >
                                      <X size={16} />
                                    </button>
                                    <button 
                                      type="submit" 
                                      className="h-9 px-6 rounded-full text-[11px] font-black uppercase tracking-widest bg-primary text-black hover:shadow-[0_0_15px_rgba(0,210,141,0.4)] transition-all"
                                    >
                                      Deploy
                                    </button>
                                 </div>
                              </div>
                            </motion.form>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </StrictModeDroppable>
          </div>
        </div>
      )}
    </Draggable>
  );
}
