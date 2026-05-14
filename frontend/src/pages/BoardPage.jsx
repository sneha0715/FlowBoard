import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  fetchBoardBundle,
  createList,
  createCard,
  persistCardMove,
  persistListMove,
  moveCardOptimistic,
  moveListOptimistic
} from "@/store/slices/boardSlice";
import BoardCanvas from "@/components/board/BoardCanvas";
import BoardSidebar from "@/components/board/BoardSidebar";
import AppShell from "@/components/layout/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LoaderCircle, 
  Eye, 
  Users, 
  Mail, 
  UserX,
  LayoutGrid,
  ArchiveRestore,
  Settings,
  Trash2,
  Check,
  Lock,
  Globe,
  Pencil,
  Grid3x3,
  PanelRight,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { boardApi, authApi, notificationApi, columnApi, cardApi } from "@/api/services";


export default function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { activeBoard, lists, cardsById, cardsByListId, status, userRole } = useSelector((state) => state.board);
  const { user } = useSelector((state) => state.auth);
  const { workspaces } = useSelector((state) => state.workspace);

  const [activeTab, setActiveTab] = useState("board");
  const [archivedCards, setArchivedCards] = useState([]);
  const [boardMembers, setBoardMembers] = useState([]);
  const [workspaceBoards, setWorkspaceBoards] = useState([]);
  const [memberDraft, setMemberDraft] = useState({ email: "", role: "MEMBER" });
  const [boardEditDraft, setBoardEditDraft] = useState(null);
  const [boardUpdating, setBoardUpdating] = useState(false);
  const [boardDeleting, setBoardDeleting] = useState(false);
  const [activities, setActivities] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const canEdit = userRole === "ADMIN" || userRole === "MEMBER";
  const isBoardAdmin = userRole === "ADMIN";
  const isObserver = userRole === "OBSERVER";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("edit") === "true" && isBoardAdmin) setActiveTab("members");
  }, [location.search, isBoardAdmin]);

  useEffect(() => {
    if (activeBoard && !boardEditDraft) {
      setBoardEditDraft({ 
        name: activeBoard.name, 
        description: activeBoard.description || "", 
        visibility: activeBoard.visibility,
        workspaceId: activeBoard.workspaceId
      });
    }
  }, [activeBoard]);

  useEffect(() => {
    if (boardId) {
      dispatch(fetchBoardBundle(Number(boardId)));
      boardApi.members(Number(boardId)).then(setBoardMembers).catch(() => setBoardMembers([]));
    }
  }, [boardId, dispatch]);

  useEffect(() => {
    if (activeBoard?.workspaceId) {
      boardApi.byWorkspace(activeBoard.workspaceId).then(setWorkspaceBoards).catch(() => setWorkspaceBoards([]));
    }
  }, [activeBoard?.workspaceId]);

  useEffect(() => {
    if (!boardId) return;
    cardApi.archivedByBoard(Number(boardId)).then(setArchivedCards).catch(() => setArchivedCards([]));
  }, [boardId, status]);

  useEffect(() => {
    if (user?.userId) {
      notificationApi.byRecipient(user.userId).then(data => setActivities(data || [])).catch(() => setActivities([]));
    }
  }, [user?.userId]);

  const handleUpdateBoard = async (e) => {
    e.preventDefault();
    setBoardUpdating(true);
    try {
      await boardApi.update(Number(boardId), boardEditDraft);
      toast.success("Board configuration updated.");
      dispatch(fetchBoardBundle(Number(boardId)));
    } catch (err) { toast.error("Failed to update board."); }
    finally { setBoardUpdating(false); }
  };

  const handleDeleteBoard = async () => {
    if (!window.confirm("Permanently delete this board? All data will be lost.")) return;
    setBoardDeleting(true);
    try {
      await boardApi.remove(Number(boardId));
      toast.success("Board deleted.");
      navigate(`/workspaces/${activeBoard.workspaceId}`);
    } catch (err) { toast.error("Failed to delete board."); setBoardDeleting(false); }
  };

  const handleRestoreCard = async (cardId) => {
    try {
      await cardApi.unarchive(cardId);
      toast.success("Card restored.");
      dispatch(fetchBoardBundle(Number(boardId)));
      setArchivedCards(await cardApi.archivedByBoard(Number(boardId)));
    } catch (err) { toast.error("Failed to restore card."); }
  };

  const handleCreateList = async ({ name, color }) => {
    await dispatch(createList({ boardId: Number(boardId), name, color })).unwrap();
  };

  const handleRenameList = async (listId, payload) => {
    await columnApi.update(listId, payload);
    await dispatch(fetchBoardBundle(Number(boardId))).unwrap();
  };

  const handleMoveList = async (listId, newBoardId) => {
    await columnApi.move(listId, newBoardId);
    await dispatch(fetchBoardBundle(Number(boardId))).unwrap();
  };

  const handleDeleteList = async (listId) => {
    try {
      await columnApi.remove(listId);
      await dispatch(fetchBoardBundle(Number(boardId))).unwrap();
      toast.success("List deleted.");
    } catch { toast.error("Failed to delete list."); }
  };

  const handleDeleteCard = async (cardId) => {
    console.log("SYSTEM: Initiating Card Deletion Sequence", { cardId, boardId });
    try {
      await cardApi.remove(cardId);
      console.log("SYSTEM: Card Purged Successfully. Synchronizing Board State...");
      try {
        await dispatch(fetchBoardBundle(Number(boardId))).unwrap();
        toast.success("Card purged.");
      } catch (syncErr) {
        console.error("SYSTEM WARNING: Card Deleted but Refresh Failed", syncErr);
        toast.warning("Card deleted, but UI sync failed. Reloading...");
        window.location.reload();
      }
    } catch (err) { 
      console.error("SYSTEM CRITICAL FAILURE: Card Deletion API Rejected", err);
      if (err.response) {
        console.error("DATA RESPONSE:", err.response.data);
        console.error("STATUS:", err.response.status);
      }
      toast.error("Deletion Rejected: Mission Record Locked or Access Denied."); 
    }
  };

  const handleCreateCard = async (listId, draft) => {
    await dispatch(createCard({ boardId: Number(boardId), listId: Number(listId), ...draft })).unwrap();
  };

  const handleDragEnd = async (result) => {
    const { destination, source, type, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    try {
      if (type === "COLUMN") {
        dispatch(moveListOptimistic({ sourceIndex: source.index, destinationIndex: destination.index }));
        await dispatch(persistListMove({ boardId: Number(boardId) })).unwrap();
        return;
      }
      const cardId = Number(draggableId.replace("card-", ""));
      const movedCard = cardsById[cardId];
      dispatch(moveCardOptimistic({ source, destination }));
      await dispatch(persistCardMove({
        boardId: Number(boardId), cardId,
        sourceListId: Number(source.droppableId.replace("list-", "")),
        destinationListId: Number(destination.droppableId.replace("list-", "")),
        destinationIndex: destination.index,
      })).unwrap();
      if (movedCard?.assigneeId) {
        const destListId = Number(destination.droppableId.replace("list-", ""));
        const destList = lists.find((l) => Number(l.listId) === destListId);
        const isDone = destList?.name?.toLowerCase() === "done";
        await notificationApi.send({
          recipientId: Number(movedCard.assigneeId), actorId: Number(user.userId), type: "MOVE",
          title: isDone ? `Task completed: ${movedCard.title}` : `Card moved: ${movedCard.title}`,
          message: isDone ? `${user.fullName || user.email} moved the task to Done.` : `${user.fullName || user.email} moved the card to ${destList?.name || "a new stage"}.`,
          relatedId: cardId, relatedType: "CARD",
        });
      }
    } catch { dispatch(fetchBoardBundle(Number(boardId))); }
  };

  const inviteBoardMember = async (e) => {
    e.preventDefault();
    try {
      const users = await authApi.searchUsers(memberDraft.email);
      const match = users.find((u) => u.email?.toLowerCase() === memberDraft.email.trim().toLowerCase());
      if (!match) throw new Error("User not found.");
      await boardApi.addMember(Number(boardId), { userId: Number(match.userId), role: memberDraft.role });
      setMemberDraft({ email: "", role: "MEMBER" });
      toast.success(`${match.fullName || match.email} added.`);
      setBoardMembers(await boardApi.members(Number(boardId)));
    } catch (err) { toast.error(err?.message || "Failed to add."); }
  };

  const updateBoardRole = async (member) => {
    const next = member.role === "MEMBER" ? "OBSERVER" : member.role === "OBSERVER" ? "ADMIN" : "MEMBER";
    await boardApi.updateMemberRole(Number(boardId), member.userId, next);
    setBoardMembers(await boardApi.members(Number(boardId)));
  };

  const removeBoardMember = async (member) => {
    await boardApi.removeMember(Number(boardId), member.userId);
    setBoardMembers(await boardApi.members(Number(boardId)));
  };

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="p-3 pt-0 lg:p-5 lg:pt-0 space-y-2">
            
            {isObserver && (
              <div className="flex items-center gap-2 p-3 px-4 rounded-xl bg-white/[0.03] border border-white/5 text-[12px] text-white/50">
                <Eye size={14} />
                <span className="font-medium">Read-only access — Observation mode</span>
              </div>
            )}

            {status === "loading" && !activeBoard ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-muted-foreground/40 animate-in fade-in duration-700">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
                <p className="text-[13px] font-bold tracking-widest uppercase animate-pulse">Synchronizing board data...</p>
              </div>
            ) : (
              <div className="flex gap-8 h-full">
                {/* ===== Main Content ===== */}
                <div className="flex-1 flex flex-col gap-3 min-w-0">
                  
                  {/* Header Row */}
                  <section className="flex flex-col gap-4">
                    <div className="flex items-end justify-between gap-4 pb-1">
                      <div className="space-y-1">
                        <div className="flex items-center gap-4">
                          <h1 className="text-[26px] font-black tracking-tighter text-foreground leading-none">
                            {activeBoard?.name || "Untitled Board"}
                          </h1>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-secondary/20 backdrop-blur-sm p-1 rounded-full border border-border/40 shadow-2xl">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                          <TabsList className="bg-transparent border-none p-0 gap-0.5 h-8">
                            <TabsTrigger 
                              value="board" 
                              className="gap-2.5 px-5 h-8 rounded-full data-[state=active]:bg-[#00d28d] data-[state=active]:text-black data-[state=active]:shadow-[0_0_15px_rgba(0,210,141,0.3)] transition-all duration-500 font-black text-[11px] uppercase tracking-widest"
                            >
                              <LayoutGrid size={13} /> Board
                            </TabsTrigger>
                            <TabsTrigger 
                              value="members" 
                              className="gap-2.5 px-5 h-8 rounded-full data-[state=active]:bg-[#00d28d] data-[state=active]:text-black data-[state=active]:shadow-[0_0_15px_rgba(0,210,141,0.3)] transition-all duration-500 font-black text-[11px] uppercase tracking-widest text-muted-foreground/40 hover:text-foreground"
                            >
                              <Users size={13} /> Team
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                        
                        <div className="w-px h-4 bg-border/40 mx-1.5" />
                        
                        <button 
                          onClick={() => setActiveTab("settings")}
                          className="flex items-center gap-2.5 px-4 h-8 rounded-full hover:bg-secondary/40 text-muted-foreground/40 hover:text-foreground transition-all group/edit"
                        >
                          <Pencil size={13} className="group-hover/edit:text-[#00d28d] transition-colors" />
                          <span className="text-[11px] font-black uppercase tracking-widest">Edit</span>
                        </button>
                        {!isSidebarOpen && (
                          <>
                            <div className="w-px h-4 bg-border/40 mx-1.5" />
                            <button 
                              onClick={() => setIsSidebarOpen(true)}
                              className="h-8 w-8 rounded-full bg-secondary/20 text-muted-foreground/30 border border-border/40 hover:bg-secondary hover:text-foreground flex items-center justify-center transition-all animate-in fade-in zoom-in duration-500 ml-0.5"
                              title="Expand Intelligence"
                            >
                              <PanelRight size={14} className="rotate-180" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-h-[600px]">
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                        <TabsContent value="board" className="h-full outline-none mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <BoardCanvas
                            board={activeBoard}
                            members={boardMembers}
                            lists={lists}
                            cardsByListId={cardsByListId}
                            cardsById={cardsById}
                            onDragEnd={handleDragEnd}
                            onCreateList={handleCreateList}
                            onCreateCard={handleCreateCard}
                            onRenameList={handleRenameList}
                            onDeleteList={handleDeleteList}
                            onDeleteCard={handleDeleteCard}
                            onMoveList={handleMoveList}
                            otherBoards={workspaceBoards.filter(b => b.boardId !== Number(boardId))}
                            saving={status === "saving"}
                            readOnly={!canEdit}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            isBoardAdmin={isBoardAdmin}
                            archivedCount={archivedCards.length}
                          />
                        </TabsContent>

                        <TabsContent value="members" className="outline-none mt-0 animate-in fade-in duration-500">
                          <div className="max-w-4xl py-4">
                            <Card className="bg-card border-border/50 overflow-hidden rounded-3xl shadow-xl shadow-black/10">
                              <CardHeader className="pb-8 border-b border-border/30">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <CardTitle className="text-[20px] font-black text-foreground flex items-center gap-3">
                                      <button 
                                        onClick={() => setActiveTab("board")}
                                        className="p-2 rounded-full hover:bg-secondary/50 transition-all text-muted-foreground hover:text-primary mr-2"
                                      >
                                        <ArrowLeft size={20} />
                                      </button>
                                      <Users className="text-primary" size={24} /> Mission Personnel
                                    </CardTitle>
                                    <CardDescription className="text-[12px] text-muted-foreground font-medium uppercase tracking-widest opacity-60 ml-[52px]">Deployment Authorization List</CardDescription>
                                  </div>
                                  {isBoardAdmin && (
                                    <form onSubmit={inviteBoardMember} className="flex gap-3">
                                      <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                        <Input placeholder="Search operative email..." className="pl-11 w-64 h-11 bg-secondary/30 border-border/50 rounded-xl text-[13px] font-bold focus-visible:ring-primary/20" value={memberDraft.email} onChange={e => setMemberDraft(prev => ({ ...prev, email: e.target.value }))} />
                                      </div>
                                      <select value={memberDraft.role} onChange={e => setMemberDraft(prev => ({ ...prev, role: e.target.value }))} className="w-32 h-11 bg-secondary/30 border border-border/50 rounded-xl text-[11px] font-black uppercase tracking-wider text-muted-foreground px-4 outline-none appearance-none cursor-pointer hover:border-primary/30 transition-all">
                                        <option value="ADMIN">Admin</option>
                                        <option value="MEMBER">Member</option>
                                        <option value="OBSERVER">Observer</option>
                                      </select>
                                      <Button type="submit" className="h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20">Add Operative</Button>
                                    </form>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent className="p-0">
                                <div className="divide-y divide-border/30">
                                  {boardMembers.map((m) => (
                                    <div key={m.userId} className="flex items-center justify-between p-6 px-8 hover:bg-secondary/20 transition-all group">
                                      <div className="flex items-center gap-5">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                                          <span className="text-[16px] font-black text-primary">{(m.fullName || m.email || "U").charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div>
                                          <p className="text-[14px] font-black text-foreground">{m.fullName || m.email}</p>
                                          <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-2.5 py-1 rounded-md">{m.role}</span>
                                            {Number(m.userId) === Number(activeBoard?.createdById) && <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] bg-rose-500/10 px-2.5 py-1 rounded-md">Founder</span>}
                                          </div>
                                        </div>
                                      </div>
                                      {isBoardAdmin && Number(m.userId) !== Number(activeBoard?.createdById) && (
                                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground border border-border/50 hover:bg-secondary transition-all" onClick={() => updateBoardRole(m)}>Update Role</button>
                                          <button className="h-9 w-9 rounded-xl text-rose-500 border border-rose-500/10 hover:bg-rose-500/10 flex items-center justify-center transition-all" onClick={() => removeBoardMember(m)}>
                                            <UserX size={16} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                        <TabsContent value="settings" className="outline-none mt-0 animate-in fade-in duration-500">
                          <div className="max-w-2xl py-4">
                            <Card className="bg-card border-border/50 rounded-3xl shadow-xl">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-[20px] font-black flex items-center gap-3">
                                    <button 
                                      onClick={() => setActiveTab("board")}
                                      className="p-2 rounded-full hover:bg-secondary/50 transition-all text-muted-foreground hover:text-primary mr-2"
                                    >
                                      <ArrowLeft size={20} />
                                    </button>
                                    <Settings className="text-primary" size={24} /> Mission Configuration
                                  </CardTitle>
                                </div>
                                <CardDescription className="text-[12px] font-medium uppercase tracking-widest opacity-60 ml-[52px]">Update deployment parameters</CardDescription>
                              </CardHeader>
                              <CardContent>
                                {boardEditDraft && (
                                  <form onSubmit={handleUpdateBoard} className="space-y-6">
                                    <div className="space-y-2">
                                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground/60">Objective Designation</Label>
                                      <Input 
                                        value={boardEditDraft.name} 
                                        onChange={e => setBoardEditDraft({...boardEditDraft, name: e.target.value})}
                                        className="bg-secondary/30 border-border/50 h-12 rounded-xl text-[14px] font-bold"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground/60">Mission Briefing</Label>
                                      <Input 
                                        value={boardEditDraft.description} 
                                        onChange={e => setBoardEditDraft({...boardEditDraft, description: e.target.value})}
                                        className="bg-secondary/30 border-border/50 h-12 rounded-xl text-[14px] font-bold"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground/60">Security Clearance</Label>
                                      <div className="flex gap-3">
                                        {['PRIVATE', 'PUBLIC'].map(v => (
                                          <button
                                            key={v}
                                            type="button"
                                            onClick={() => setBoardEditDraft({...boardEditDraft, visibility: v})}
                                            className={`flex-1 h-12 rounded-xl border flex items-center justify-center gap-3 transition-all ${boardEditDraft.visibility === v ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(0,210,141,0.1)]' : 'bg-secondary/30 border-border/50 text-muted-foreground'}`}
                                          >
                                            {v === 'PRIVATE' ? <Lock size={14} /> : <Globe size={14} />}
                                            <span className="text-[11px] font-black uppercase tracking-widest">{v}</span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="pt-4 flex items-center justify-between">
                                      <Button 
                                        type="button" 
                                        variant="ghost" 
                                        onClick={handleDeleteBoard}
                                        disabled={boardDeleting}
                                        className="h-12 px-6 rounded-xl text-rose-500 hover:bg-rose-500/10 font-black uppercase tracking-widest text-[11px] gap-3"
                                      >
                                        <Trash2 size={16} /> Decommission Board
                                      </Button>
                                      <Button 
                                        type="submit" 
                                        disabled={boardUpdating}
                                        className="h-12 px-8 rounded-xl bg-primary text-black font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20"
                                      >
                                        {boardUpdating ? "Synchronizing..." : "Apply Changes"}
                                      </Button>
                                    </div>
                                  </form>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </section>
                </div>

                {/* ===== Right Sidebar ===== */}
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.div
                      initial={{ width: 0, opacity: 0, x: 20 }}
                      animate={{ width: "auto", opacity: 1, x: 0 }}
                      exit={{ width: 0, opacity: 0, x: 20 }}
                      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden border-l border-border/30"
                    >
                      <BoardSidebar activities={activities} onToggle={() => setIsSidebarOpen(false)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
