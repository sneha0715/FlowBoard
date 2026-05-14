import { useState } from "react";
import { Draggable } from "react-beautiful-dnd";
import { Plus, MoreHorizontal, Trash2, Edit2, MoveHorizontal, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import CardTile from "./CardTile";
import { StrictModeDroppable } from "./StrictModeDroppable";

export default function ColumnLane({ 
  list, 
  cards, 
  onCreateCard, 
  onRenameList, 
  onDeleteList, 
  onMoveList,
  otherBoards,
  saving,
  readOnly,
  boardId 
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", priority: "MEDIUM" });

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
          className="w-[280px] flex-shrink-0 flex flex-col h-full group/column bg-[#0d1117]/40 border border-white/5 rounded-[1.25rem] overflow-hidden"
          style={columnProvided.draggableProps.style}
        >
          {/* Column Header */}
          <div 
            {...columnProvided.dragHandleProps}
            className="flex items-center justify-between py-3.5 px-4 bg-white/[0.02] border-b border-white/5"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <h3 className="text-[10px] font-black tracking-[0.15em] uppercase text-foreground/80 truncate max-w-[140px]">
                {list.name}
              </h3>
              <Badge variant="secondary" className="h-4 px-1 text-[8px] font-black rounded-md bg-white/5 border border-white/5 text-muted-foreground/60">
                {cards.length}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover/column:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg hover:bg-white/5 text-muted-foreground/40">
                    <MoreHorizontal size={12} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0d1117] border-white/10 rounded-xl min-w-[160px]">
                  <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-3">Column Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-widest gap-2 px-3 py-2 cursor-pointer" onClick={() => {
                    const next = prompt("Enter new column name:", list.name);
                    if (next) onRenameList(list.listId, { name: next });
                  }}>
                    <Edit2 size={12} className="text-primary" /> Rename Signal
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem
                    className="text-[10px] font-bold uppercase tracking-widest py-2 px-3 rounded-lg cursor-pointer gap-2 text-red-500/80 hover:text-red-500 hover:bg-red-500/10"
                    onClick={() => {
                      if (window.confirm(`Permanently terminate "${list.name}"?`)) {
                        onDeleteList(list.listId);
                      }
                    }}
                  >
                    <Trash2 size={12} /> Terminate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
 
          {/* Cards Container */}
          <StrictModeDroppable droppableId={`list-${list.listId}`} type="CARD">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`
                  flex-1 min-h-[100px] p-2.5 rounded-b-2xl no-scrollbar overflow-y-auto transition-colors duration-200
                  ${snapshot.isDraggingOver ? 'bg-white/[0.03]' : 'bg-transparent'}
                `}
              >
                <div className="flex flex-col gap-0.5">
                  {cards.map((card, index) => (
                    <Draggable key={card.cardId} draggableId={`card-${card.cardId}`} index={index} isDragDisabled={readOnly}>
                      {(cardProvided, cardSnapshot) => (
                        <CardTile
                          card={card}
                          provided={cardProvided}
                          snapshot={cardSnapshot}
                          boardId={boardId}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
 
                {!readOnly && (
                  <div className="mt-2">
                    <AnimatePresence mode="wait">
                      {!open ? (
                        <Button
                          variant="ghost"
                          className="w-full h-10 justify-center text-muted-foreground/30 hover:text-primary hover:bg-primary/5 border border-dashed border-border/50 hover:border-primary/20 rounded-xl px-4 gap-2 text-[9px] font-black uppercase tracking-widest transition-all"
                          onClick={() => setOpen(true)}
                        >
                          <Plus size={12} /> Establish Task
                        </Button>
                      ) : (
                        <motion.form
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          onSubmit={handleSubmit}
                          className="bg-muted/20 p-3 rounded-xl border border-border/50 space-y-3"
                        >
                          <Input
                            autoFocus
                            placeholder="Designate Task Name..."
                            value={draft.title}
                            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                            className="h-9 bg-transparent border-none text-xs font-bold focus-visible:ring-0 p-0 px-1"
                          />
                          <div className="flex justify-between items-center pt-2 border-t border-white/5">
                             <div className="flex gap-1">
                                {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => setDraft({...draft, priority: p})}
                                    className={`w-2 h-2 rounded-full border transition-all ${draft.priority === p ? 'border-primary bg-primary' : 'border-white/20 hover:border-white/40'}`}
                                  />
                                ))}
                             </div>
                             <div className="flex gap-2">
                               <Button type="button" variant="ghost" size="sm" className="h-7 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest" onClick={() => setOpen(false)}>Cancel</Button>
                               <Button type="submit" size="sm" className="h-7 px-4 rounded-lg text-[8px] font-black uppercase tracking-widest bg-primary hover:bg-primary/80">Add</Button>
                             </div>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </StrictModeDroppable>
        </div>
      )}
    </Draggable>
  );
}
