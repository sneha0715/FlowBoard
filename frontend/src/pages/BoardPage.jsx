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
  ArrowLeft,
  Plus,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { boardApi, authApi, notificationApi, columnApi, cardApi, workspaceApi } from "@/api/services";

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
  const [workspaceMembers, setWorkspaceMembers] = useState([]);

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
      workspaceApi.members(activeBoard.workspaceId).then(setWorkspaceMembers).catch(() => setWorkspaceMembers([]));
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

  const [inviting, setInviting] = useState(false);

  const inviteBoardMember = async (e) => {
    e.preventDefault();
    if (!memberDraft.email.trim()) return;

    setInviting(true);
    try {
      // 1. Verify User exists in Auth Database
      const users = await authApi.searchUsers(memberDraft.email.trim());
      const match = users.find((u) => u.email?.toLowerCase() === memberDraft.email.trim().toLowerCase());

      if (!match) {
        toast.error("Access Denied: Operative not found in central database.");
        return;
      }

      // 2. Check if already on board
      const isAlreadyMember = boardMembers.some(m => m.userId === match.userId);
      if (isAlreadyMember) {
        toast.warning(`${match.fullName || match.email} is already on mission.`);
        return;
      }

      // 3. Add to Board
      await boardApi.addMember(Number(boardId), { userId: Number(match.userId), role: memberDraft.role });
      setMemberDraft({ email: "", role: "MEMBER" });
      toast.success(`${match.fullName || match.email} has been deployed.`);

      // 4. Refresh List
      const updatedMembers = await boardApi.members(Number(boardId));
      setBoardMembers(updatedMembers);
    } catch (err) {
      console.error("Invite Error:", err);
      toast.error(err?.message || "Protocol Failure: Could not add operative.");
    } finally {
      setInviting(false);
    }
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
                      <div className="flex items-center gap-1 bg-secondary/10 backdrop-blur-sm p-0.5 rounded-lg border border-white/5 shadow-2xl">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                          <TabsList className="bg-transparent border-none p-0 gap-0.5 h-6">
                            <TabsTrigger
                              value="board"
                              className="gap-1.5 px-2 h-6 rounded-md data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all duration-500 font-black text-[9px] uppercase tracking-widest"
                            >
                              <LayoutGrid size={11} /> Board
                            </TabsTrigger>
                            <TabsTrigger
                              value="members"
                              className="gap-1.5 px-2 h-6 rounded-md data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all duration-500 font-black text-[9px] uppercase tracking-widest text-muted-foreground/40 hover:text-foreground"
                            >
                              <Users size={11} /> Team
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>

                        <div className="w-px h-2.5 bg-white/5 mx-0.5" />

                        <button
                          onClick={() => setActiveTab("settings")}
                          className="flex items-center gap-1.5 px-2 h-6 rounded-md hover:bg-white/5 text-muted-foreground/40 hover:text-white transition-all group/edit"
                        >
                          <Pencil size={11} className="transition-colors" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Edit</span>
                        </button>
                      </div>
                    </div>
                  </section>

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

                      <TabsContent value="members" className="outline-none mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="max-w-5xl py-8">
                          <div className="flex items-center gap-6 mb-10">
                            <button
                              onClick={() => setActiveTab("board")}
                              className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white hover:border-white/20 transition-all group"
                            >
                              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div className="space-y-1">
                              <h2 className="text-2xl font-black tracking-tighter uppercase">Collaboration</h2>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-4">
                              <div className="rounded-[2rem] bg-[#0a0c10]/40 border border-white/5 overflow-hidden backdrop-blur-xl shadow-2xl">
                                <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/60">Active Operatives</span>
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black px-3 py-0.5 rounded-full">
                                      {boardMembers.length} Units
                                    </Badge>
                                  </div>
                                </div>
                                <div className="divide-y divide-white/5">
                                  {boardMembers.map((m) => (
                                    <div key={m.userId} className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-all group">
                                      <div className="flex items-center gap-5">
                                        <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-105 transition-all group-hover:border-primary/30 group-hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]">
                                          <Avatar className="h-full w-full rounded-2xl">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${m.fullName || m.email}`} />
                                            <AvatarFallback className="text-[14px] font-black text-primary">{(m.fullName || m.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
                                          </Avatar>
                                        </div>
                                        <div>
                                          <p className="text-lg font-black text-white tracking-tight leading-none mb-1">{m.fullName || m.email || "Unknown Operative"}</p>
                                          <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="bg-[#86efac]/10 text-[#86efac] border-[#86efac]/20 text-[8px] font-black px-2 py-0 h-4 rounded-md uppercase tracking-widest">
                                              {m.role}
                                            </Badge>
                                            {Number(m.userId) === Number(activeBoard?.createdById) && (
                                              <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[8px] font-black px-2 py-0 h-4 rounded-md uppercase tracking-widest">
                                                FOUNDER
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      {isBoardAdmin && Number(m.userId) !== Number(activeBoard?.createdById) && (
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:bg-white/5 hover:text-white"
                                            onClick={() => updateBoardRole(m)}
                                          >
                                            Update Permissions
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                            onClick={() => removeBoardMember(m)}
                                          >
                                            <UserX size={14} />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-6">
                              <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 shadow-inner">
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <Mail size={16} />
                                  </div>
                                  <h3 className="text-xs font-black uppercase tracking-[0.2em]">Collaborate Member</h3>
                                </div>
                                <form onSubmit={inviteBoardMember} className="space-y-4">
                                  <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Secure Email</Label>
                                    <Input
                                      placeholder=" operative@command.io"
                                      className="h-11 bg-black/40 border-white/5 rounded-xl text-[13px] font-bold focus:border-primary/30 transition-all shadow-inner"
                                      value={memberDraft.email}
                                      onChange={e => setMemberDraft(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Access Level</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      {['ADMIN', 'MEMBER'].map(role => (
                                        <button
                                          key={role}
                                          type="button"
                                          onClick={() => setMemberDraft(prev => ({ ...prev, role }))}
                                          className={`h-11 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${memberDraft.role === role ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]' : 'bg-black/40 border-white/5 text-muted-foreground/40 hover:border-white/10'}`}
                                        >
                                          {role}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <Button type="submit" className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-[10px] mt-4 shadow-xl shadow-primary/20">
                                    Add Member
                                  </Button>
                                </form>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="settings" className="outline-none mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="max-w-3xl py-8">
                          <div className="flex items-center gap-6 mb-10">
                            <button
                              onClick={() => setActiveTab("board")}
                              className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white hover:border-white/20 transition-all group"
                            >
                              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div className="space-y-1">
                              <h2 className="text-2xl font-black tracking-tighter uppercase">Mission Configuration</h2>
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Core Protocol & Deployment Parameters</p>
                            </div>
                          </div>

                          <div className="rounded-[2.5rem] bg-[#0a0c10]/40 border border-white/5 p-10 backdrop-blur-xl shadow-2xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                              <Settings size={180} strokeWidth={1} />
                            </div>

                            {boardEditDraft && (
                              <form onSubmit={handleUpdateBoard} className="space-y-8 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-violet-400/50 ml-1">Objective Designation</Label>
                                    <Input
                                      value={boardEditDraft.name}
                                      onChange={e => setBoardEditDraft({ ...boardEditDraft, name: e.target.value })}
                                      className="bg-black/40 border-white/5 h-12 rounded-xl text-[15px] font-black tracking-tight focus:border-primary/30 transition-all shadow-inner"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-violet-400/50 ml-1">Security Clearance</Label>
                                    <div className="flex gap-3">
                                      {['PRIVATE', 'PUBLIC'].map(v => (
                                        <button
                                          key={v}
                                          type="button"
                                          onClick={() => setBoardEditDraft({ ...boardEditDraft, visibility: v })}
                                          className={`flex-1 h-12 rounded-xl border flex items-center justify-center gap-3 transition-all ${boardEditDraft.visibility === v ? 'bg-primary/10 border-primary text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' : 'bg-black/40 border-white/5 text-muted-foreground/40 hover:border-white/10'}`}
                                        >
                                          {v === 'PRIVATE' ? <Lock size={14} /> : <Globe size={14} />}
                                          <span className="text-[10px] font-black uppercase tracking-widest">{v}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase tracking-widest text-violet-400/50 ml-1">Mission Briefing</Label>
                                  <textarea
                                    value={boardEditDraft.description}
                                    onChange={e => setBoardEditDraft({ ...boardEditDraft, description: e.target.value })}
                                    className="w-full bg-black/40 border border-white/5 h-32 rounded-2xl text-[14px] font-medium p-4 focus:border-primary/30 outline-none transition-all shadow-inner resize-none"
                                    placeholder="Establish mission parameters..."
                                  />
                                </div>

                                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/5">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleDeleteBoard}
                                    disabled={boardDeleting}
                                    className="h-11 px-6 rounded-xl text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 font-black uppercase tracking-widest text-[10px] gap-3 transition-all"
                                  >
                                    <Trash2 size={16} /> Decommission Board
                                  </Button>
                                  <Button
                                    type="submit"
                                    disabled={boardUpdating}
                                    className="h-11 px-10 rounded-xl bg-primary text-black font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95"
                                  >
                                    {boardUpdating ? "Synchronizing..." : "Apply Protocol Changes"}
                                  </Button>
                                </div>
                              </form>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>

                </div>
              )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
