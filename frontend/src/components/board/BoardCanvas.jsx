import { useState } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  LoaderCircle, 
  ListFilter,
  ChevronDown,
  Grid,
  Search,
  Layout,
  X
} from "lucide-react";
import ColumnLane from "./ColumnLane";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { StrictModeDroppable } from "./StrictModeDroppable";

export default function BoardCanvas({
  board,
  members,
  lists,
  cardsByListId,
  cardsById,
  onDragEnd,
  onCreateList,
  onCreateCard,
  onRenameList,
  onMoveList,
  otherBoards,
  onOpenCard,
  saving,
  readOnly,
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", color: "#3b82f6" });
  const [filterSearch, setFilterSearch] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    await onCreateList(draft);
    setDraft({ name: "", color: "#3b82f6" });
    setOpen(false);
  };

  const getFilteredCards = (listId) => {
    const cardIds = cardsByListId[listId] || [];
    return cardIds
      .map((id) => cardsById[id])
      .filter((card) => {
        if (!card) return false;
        if (filterSearch.trim() && !card.title?.toLowerCase().includes(filterSearch.toLowerCase())) return false;
        return true;
      });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Board Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[24px] bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
            <Layout size={32} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">{board?.name || "Loading..."}</h1>
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-muted/50 border-border/50">
                {board?.visibility}
              </Badge>
            </div>
            <p className="text-sm font-bold text-muted-foreground tracking-tight">
              {board?.description || "Project collaboration space"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex -space-x-3 mr-4">
            {members?.slice(0, 5).map(m => (
              <Avatar key={m.userId} className="h-10 w-10 border-4 border-background shadow-lg">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.userId}`} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            ))}
            {members?.length > 5 && (
              <div className="w-10 h-10 rounded-full border-4 border-background bg-muted flex items-center justify-center text-[10px] font-bold shadow-lg">
                +{members.length - 5}
              </div>
            )}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search cards..." 
              className="pl-9 w-[200px] h-10 bg-muted/30 border-none"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tool Bar */}
      <div className="flex items-center justify-between mb-8 pb-8 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Button variant="default" size="sm" className="h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest gap-2">
            <Grid size={14} /> All Tasks
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest gap-2 border-border/50"
            onClick={() => setOpen(true)}
          >
            <Plus size={14} /> New List
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest gap-2 border-border/50">
                <ListFilter size={14} /> Filter <ChevronDown size={14} className="opacity-50" />
              </Button>
            </DropdownMenuTrigger>
          </DropdownMenu>
        </div>

        <AnimatePresence>
          {saving && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 text-muted-foreground text-xs font-bold uppercase tracking-widest"
            >
              <LoaderCircle size={16} className="animate-spin text-primary" />
              <span>Syncing...Syncing...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={readOnly ? () => {} : onDragEnd}>
        <StrictModeDroppable droppableId="board-columns" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex-1 flex gap-8 items-start overflow-x-auto pb-10 custom-scrollbar"
            >
              {lists.map((list, index) => (
                <ColumnLane
                  key={list.listId}
                  list={{ ...list, position: index }}
                  cards={getFilteredCards(list.listId)}
                  onCreateCard={onCreateCard}
                  onRenameList={onRenameList}
                  onOpenCard={onOpenCard}
                  onMoveList={onMoveList}
                  otherBoards={otherBoards}
                  saving={saving}
                  readOnly={readOnly}
                />
              ))}
              {provided.placeholder}

              {!readOnly && (
                <div className="w-80 flex-shrink-0 pt-3">
                  {!open ? (
                    <button
                      onClick={() => setOpen(true)}
                      className="w-full h-40 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">New Column</span>
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-card p-8 rounded-[32px] border border-primary/20 shadow-2xl space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Add Column</h4>
                        <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X size={16} /></Button>
                      </div>
                      <form onSubmit={submit} className="space-y-6">
                        <Input
                          autoFocus
                          required
                          placeholder="Column Name..."
                          className="h-14 px-6 text-sm font-bold"
                          value={draft.name}
                          onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                        />
                        <Button type="submit" className="w-full h-14 text-xs font-black uppercase tracking-widest shadow-lg">
                          Establish
                        </Button>
                      </form>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          )}
        </StrictModeDroppable>
      </DragDropContext>
    </div>
  );
}
