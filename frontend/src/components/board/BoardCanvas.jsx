import { useState, useMemo } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  LoaderCircle,
  ListFilter,
  ChevronDown,
  Grid,
  Search,
  LayoutDashboard,
  X,
  Users,
  Grid3x3,
  ArchiveRestore,
  Activity,
  Settings
} from "lucide-react";
import ColumnLane from "./ColumnLane";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

import { StrictModeDroppable } from "./StrictModeDroppable";

const CONSTANT_STATUSES = [
  { id: "TO_DO", label: "To Do List" },
  { id: "IN_PROGRESS", label: "In Progress List" },
  { id: "IN_REVIEW", label: "Review List" },
  { id: "DONE", label: "Done List" }
];

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
  const [draft, setDraft] = useState({ name: "", color: "#3b82f6" });
  const [filters, setFilters] = useState({
    search: "",
    priority: "ALL",
    assigneeId: "ALL"
  });

  const submitList = async (e) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    
    try {
      await onCreateList({
        name: draft.name,
        color: draft.color || "#3b82f6"
      });
      setDraft({ name: "", color: "#3b82f6" });
      setOpen(false);
    } catch (err) {
      console.error("Failed to add list:", err);
    }
  };

  // Map each constant status to a listId from the backend.
  const statusToListMap = useMemo(() => {
    const map = {};
    CONSTANT_STATUSES.forEach((s, i) => {
      const list = lists.find(l => 
        l.name?.toUpperCase().includes(s.id.replace('_', ' ')) || 
        l.name?.toUpperCase() === s.id
      );
      if (list) map[s.id] = list;
    });
    return map;
  }, [lists]);

  const customLists = useMemo(() => {
    const constantIds = new Set(Object.values(statusToListMap).map(l => l.listId));
    return lists.filter(l => !constantIds.has(l.listId));
  }, [lists, statusToListMap]);

  const getFilteredCardsByListId = (listId) => {
    const cardIds = cardsByListId[listId] || [];
    return cardIds
      .map((id) => cardsById[id])
      .filter((card) => {
        if (!card) return false;
        if (filters.search.trim() && !card.title?.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.priority !== "ALL" && card.priority !== filters.priority) return false;
        if (filters.assigneeId !== "ALL") {
          if (filters.assigneeId === "UNASSIGNED") {
            if (card.assigneeId) return false;
          } else {
            if (Number(card.assigneeId) !== Number(filters.assigneeId)) return false;
          }
        }
        return true;
      });
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Ultra-Slim Glassmorphic Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-2 px-4 rounded-2xl bg-card/20 backdrop-blur-xl border border-border/30 shadow-lg sticky top-0 z-50 h-14"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 shadow-sm">
            <LayoutDashboard size={14} className="text-primary" />
            <span className="text-[11px] font-black uppercase tracking-widest text-foreground/90 truncate max-w-[120px]">
              {board?.name || "Loading..."}
            </span>
          </div>

          <TabsList className="bg-background/40 backdrop-blur-md border border-border/20 p-1 rounded-xl h-9">
            <TabsTrigger 
              value="board" 
              onClick={() => setActiveTab("board")}
              className="gap-2 px-4 h-7 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 font-black text-[9px] uppercase tracking-widest"
            >
              <Grid3x3 size={12} /> Board
            </TabsTrigger>
            <TabsTrigger 
              value="members" 
              onClick={() => setActiveTab("members")}
              className="gap-2 px-4 h-7 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 font-black text-[9px] uppercase tracking-widest"
            >
              <Users size={12} /> Members
            </TabsTrigger>
            {isBoardAdmin && archivedCount > 0 && (
              <TabsTrigger 
                value="archived" 
                onClick={() => setActiveTab("archived")}
                className="gap-2 px-4 h-7 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 font-black text-[9px] uppercase tracking-widest"
              >
                <ArchiveRestore size={12} /> Archived
              </TabsTrigger>
            )}
            {isBoardAdmin && (
              <TabsTrigger 
                value="settings" 
                onClick={() => setActiveTab("settings")}
                className="gap-2 px-4 h-7 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 font-black text-[9px] uppercase tracking-widest"
              >
                <Settings size={12} /> Settings
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search tasks..."
              className="pl-8 w-[160px] lg:w-[220px] h-9 bg-background/30 border-border/20 rounded-xl transition-all focus-visible:ring-primary/20 focus-visible:border-primary/40 text-[10px] font-medium"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 bg-background/40 border border-border/20 hover:bg-background/60 transition-all shadow-sm"
              >
                <ListFilter size={12} /> {filters.priority === "ALL" ? "Priority" : filters.priority} <ChevronDown size={10} className="opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-xl border-border/40 p-1.5 shadow-2xl rounded-xl">
              <div className="px-2 py-1.5 mb-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Stage Priority</span>
              </div>
              {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => (
                <DropdownMenuItem 
                  key={p} 
                  className={`text-[9px] font-bold uppercase tracking-wider py-2 rounded-lg cursor-pointer ${filters.priority === p ? 'bg-primary/10 text-primary' : ''}`}
                  onClick={() => setFilters(prev => ({ ...prev, priority: p }))}
                >
                  {p === "ALL" ? "Default" : p}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <AnimatePresence>
            {saving && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary"
                title="Syncing Changes"
              >
                <Activity size={14} className="animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Kanban Content Area */}
      <DragDropContext onDragEnd={readOnly ? () => { } : onDragEnd}>
        <StrictModeDroppable droppableId="board-columns" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex-1 flex gap-6 items-start overflow-x-auto pb-6 custom-scrollbar min-h-0"
            >
              {/* Render Constant Columns */}
              {CONSTANT_STATUSES.map((status, index) => {
                const list = statusToListMap[status.id];
                if (!list) {
                   return (
                     <div 
                       key={status.id} 
                       className="w-72 flex-shrink-0 opacity-40 hover:opacity-100 transition-all cursor-pointer group h-full"
                       onClick={() => onCreateList({ name: status.label, color: "#3b82f6" })}
                     >
                        <div className="h-full min-h-[300px] rounded-3xl border-2 border-dashed border-border/30 group-hover:border-primary/40 flex flex-col items-center justify-center p-8 bg-muted/5 group-hover:bg-primary/5 transition-all">
                          <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ring-1 ring-border/20">
                            <Plus size={20} className="text-muted-foreground" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/70">{status.label}</span>
                          <p className="text-[8px] text-center mt-2 text-muted-foreground/40 font-bold uppercase tracking-tighter">Establish Stage</p>
                        </div>
                     </div>
                   );
                }

                return (
                  <ColumnLane
                    key={list.listId}
                    list={{ ...list, name: status.label }}
                    cards={getFilteredCardsByListId(list.listId)}
                    onCreateCard={onCreateCard}
                    onRenameList={onRenameList}
                    onDeleteList={onDeleteList}
                    onMoveList={onMoveList}
                    otherBoards={otherBoards}
                    saving={saving}
                    readOnly={readOnly}
                    boardId={board.boardId}
                  />
                );
              })}

              {/* Render Custom Columns */}
              {customLists.map((list) => (
                <ColumnLane
                  key={list.listId}
                  list={list}
                  cards={getFilteredCardsByListId(list.listId)}
                  onCreateCard={onCreateCard}
                  onRenameList={onRenameList}
                  onDeleteList={onDeleteList}
                  onMoveList={onMoveList}
                  otherBoards={otherBoards}
                  saving={saving}
                  readOnly={readOnly}
                />
              ))}

              {provided.placeholder}

              {!readOnly && (
                <div className="w-72 flex-shrink-0 h-full">
                  {!open ? (
                    <div 
                       className="opacity-40 hover:opacity-100 transition-all cursor-pointer group h-full"
                       onClick={() => setOpen(true)}
                    >
                        <div className="h-full min-h-[300px] rounded-3xl border-2 border-dashed border-border/30 group-hover:border-primary/40 flex flex-col items-center justify-center p-8 bg-muted/5 group-hover:bg-primary/5 transition-all">
                          <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ring-1 ring-border/20">
                            <Plus size={20} className="text-muted-foreground" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/70">ESTABLISH TASK</span>
                          <p className="text-[8px] text-center mt-2 text-muted-foreground/40 font-bold uppercase tracking-tighter">Extend Workflow</p>
                        </div>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[#0c1117]/80 backdrop-blur-xl p-8 rounded-[32px] border border-primary/20 shadow-2xl space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black uppercase tracking-widest text-foreground">ESTABLISH TASK</h4>
                        <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="hover:bg-white/5 text-muted-foreground"><X size={16} /></Button>
                      </div>
                      <form onSubmit={submitList} className="space-y-6">
                        <Input
                          autoFocus
                          required
                          placeholder="List Name..."
                          className="h-14 px-6 text-sm font-bold bg-[#161b22]/50 border-border/30 focus-visible:ring-primary/20"
                          value={draft.name}
                          onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                        />
                        <Button type="submit" className="w-full h-14 text-xs font-black uppercase tracking-widest bg-[#00605c] hover:bg-[#004d4a] text-white shadow-lg border-none">
                          ESTABLISH
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
