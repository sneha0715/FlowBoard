import { useState } from "react";
import { Draggable, Droppable } from "react-beautiful-dnd";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MoreVertical, X, Check } from "lucide-react";
import CardTile from "./CardTile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { StrictModeDroppable } from "./StrictModeDroppable";

export default function ColumnLane({ list, cards, onCreateCard, onRenameList, onMoveList, otherBoards, onOpenCard, saving, readOnly }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", priority: "MEDIUM" });

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    await onCreateCard(list.listId, { ...draft, status: list.name.toUpperCase().replace(' ', '_') });
    setDraft({ title: "", description: "", priority: "MEDIUM" });
    setOpen(false);
  };

  return (
    <Draggable draggableId={`column-${list.listId}`} index={list.position} isDragDisabled={readOnly}>
      {(columnProvided) => (
        <div
          ref={columnProvided.innerRef}
          {...columnProvided.draggableProps}
          className="w-80 flex-shrink-0 flex flex-col h-full group/column"
        >
          {/* Column Header */}
          <div 
            {...columnProvided.dragHandleProps}
            className="flex items-center justify-between py-4 px-3 mb-2 bg-transparent rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold tracking-tight uppercase text-foreground/80">{list.name}</h3>
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold rounded-md bg-muted/50">
                {cards.length}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover/column:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={() => setOpen(true)}
              >
                <Plus size={14} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onRenameList(list.listId, { name: list.name })}>Rename List</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Delete List</DropdownMenuItem>
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
                  flex-1 min-h-[150px] p-2 rounded-xl transition-all duration-300
                  ${snapshot.isDraggingOver ? 'bg-accent/30 ring-2 ring-primary/20' : 'bg-transparent'}
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
                          onOpen={() => onOpenCard(card)}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>

                {!readOnly && (
                  <div className="mt-3">
                    <AnimatePresence mode="wait">
                      {!open ? (
                        <Button
                          variant="ghost"
                          className="w-full h-12 justify-start text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent hover:border-border rounded-xl px-4 gap-3 text-xs font-bold"
                          onClick={() => setOpen(true)}
                        >
                          <Plus size={16} />
                          <span>Add Task</span>
                        </Button>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="bg-card p-4 rounded-xl border border-primary/20 shadow-lg space-y-4"
                        >
                          <form onSubmit={submit} className="space-y-4">
                            <textarea
                              autoFocus
                              placeholder="What needs to be done?"
                              className="w-full min-h-[80px] bg-muted/30 border border-border rounded-lg p-3 text-sm font-medium outline-none focus:ring-2 ring-primary/20 transition-all resize-none"
                              value={draft.title}
                              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  submit(e);
                                }
                              }}
                            />
                            <div className="flex items-center justify-between">
                              <select 
                                className="bg-muted/50 border border-border rounded-md text-[10px] font-bold px-2 py-1 outline-none appearance-none cursor-pointer hover:bg-muted"
                                value={draft.priority}
                                onChange={e => setDraft(d => ({ ...d, priority: e.target.value }))}
                              >
                                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                              <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                                  <X size={14} />
                                </Button>
                                <Button type="submit" size="sm" className="h-8 px-4 rounded-lg">
                                  <Check size={14} className="mr-1.5" /> Save
                                </Button>
                              </div>
                            </div>
                          </form>
                        </motion.div>
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
