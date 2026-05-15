import { useState, useMemo } from "react";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Activity,
  LayoutGrid
} from "lucide-react";
import ColumnLane from "./ColumnLane";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StrictModeDroppable } from "./StrictModeDroppable";

export default function BoardCanvas({
  board,
  members,
  lists = [],
  cardsByListId = {},
  cardsById = {},
  onDragEnd,
  onCreateList,
  onCreateCard,
  onRenameList,
  onDeleteList,
  onDeleteCard,
  onMoveList,
  otherBoards,
  saving,
  readOnly,
  activeTab,
  setActiveTab,
  isBoardAdmin,
  archivedCount = 0
}) {
  const [open, setOpen] = useState(false);
  const [listDraft, setListDraft] = useState({ name: "", color: "#A29BFE" });

  const handleSubmitList = async (e) => {
    e.preventDefault();
    if (!listDraft.name.trim()) return;
    try {
      await onCreateList({ name: listDraft.name, color: listDraft.color || "#A29BFE" });
      setListDraft({ name: "", color: "#A29BFE" });
      setOpen(false);
    } catch (err) {
      console.error("Failed to add list:", err);
    }
  };

  const sortedLists = useMemo(() => {
    return [...lists].sort((a, b) => a.position - b.position);
  }, [lists]);

  return (
    <div className="h-full flex flex-col relative group/canvas">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

      <DragDropContext onDragEnd={onDragEnd}>
        <StrictModeDroppable droppableId="board" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex gap-2 h-full pb-8 overflow-x-auto custom-scrollbar relative z-10"
            >
              {/* Render Existing Lists Only */}
              {sortedLists.map((list) => (
                <ColumnLane
                  key={list.listId}
                  list={list}
                  cards={(cardsByListId[list.listId] || []).map(id => cardsById[id])}
                  onCreateCard={onCreateCard}
                  onRenameList={onRenameList}
                  onDeleteList={onDeleteList}
                  onDeleteCard={onDeleteCard}
                  onDeleteCardOptimistic={onDeleteCard}
                  onMoveList={onMoveList}
                  otherBoards={otherBoards}
                  saving={saving}
                  readOnly={readOnly}
                  boardId={board?.boardId}
                />
              ))}

              {provided.placeholder}

              {/* Add New List Control */}
              {!readOnly && (
                <div className="w-[220px] flex-shrink-0 flex flex-col h-full">
                  {/* Dummy header to match column alignment (Header height 44px + mb-3) */}
                  <div className="h-[44px] mb-3 invisible" />

                  <AnimatePresence mode="wait">
                    {!open ? (
                      <button
                        onClick={() => setOpen(true)}
                        className="w-full h-[150px] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 group/new"
                      >
                        <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover/new:scale-110 group-hover/new:bg-white/10 transition-all">
                          <Plus size={18} className="text-white/10 group-hover/new:text-muted-foreground" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/5 group-hover/new:text-muted-foreground transition-colors">Construct Stage</span>
                      </button>
                    ) : (
                      <motion.form
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onSubmit={handleSubmitList}
                        className="bg-[#0e0e10] border border-white/5 p-6 rounded-[32px] shadow-2xl space-y-6"
                      >
                        <div className="space-y-3">
                          <label className="text-[11px] font-black tracking-widest text-white/20 ml-1">StageName</label>
                          <Input
                            autoFocus
                            placeholder="e.g. Quality Assurance"
                            value={listDraft.name}
                            onChange={(e) => setListDraft({ ...listDraft, name: e.target.value })}
                            className="h-10 bg-white/[0.03] border border-white/5 rounded-2xl text-[14px] font-bold text-white placeholder:text-white/10 focus-visible:border-white/20 focus-visible:ring-1 focus-visible:ring-white/20 transition-all px-4"
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <label className="text-[11px] font-black tracking-widest text-white/20 ml-1">AccentColor</label>
                          <div className="flex gap-2.5">
                            {['#FF7675', '#00CEC9', '#FDCB6E', '#E84393', '#0984E3'].map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setListDraft({ ...listDraft, color: c })}
                                className={`w-6 h-6 rounded-full transition-all ${listDraft.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0e0e10]' : 'border border-white/10 hover:border-white/30'}`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="flex-1 h-10 rounded-2xl text-[11px] font-black tracking-widest text-white/30 hover:text-white hover:bg-white/[0.03]"
                          >
                            Abort
                          </Button>
                          <Button
                            type="submit"
                            className="flex-[2] h-10 rounded-2xl bg-[#6C75BD] hover:bg-[#6C75BD]/90 text-white font-black tracking-widest text-[11px] transition-all hover:scale-[1.02] active:scale-95 border-none"
                          >
                            Initialize
                          </Button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </StrictModeDroppable>
      </DragDropContext>
    </div>
  );
}
