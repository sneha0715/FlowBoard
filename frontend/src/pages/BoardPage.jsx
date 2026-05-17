import { useEffect, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { UserMultipleIcon, ShieldKeyIcon, Delete02Icon, ShieldUserIcon, UserIcon, CrownIcon, Mail01Icon, SentIcon } from "hugeicons-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [users, setUsers] = useState([]);

  const memberProfiles = useMemo(() => {
    const profiles = {};
    users.forEach(u => { profiles[u.userId] = u; });
    return profiles;
  }, [users]);

  useEffect(() => {
    authApi.searchUsers("").then(setUsers).catch(() => setUsers([]));
  }, []);

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

  const updateBoardRole = async (userId, nextRole) => {
    try {
      await boardApi.updateMemberRole(Number(boardId), userId, nextRole);
      setBoardMembers(await boardApi.members(Number(boardId)));
      toast.success("Role updated.");
    } catch (err) {
      toast.error("Failed to update role.");
    }
  };

  const removeBoardMember = async (member) => {
    await boardApi.removeMember(Number(boardId), member.userId);
    setBoardMembers(await boardApi.members(Number(boardId)));
  };

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="pt-0 space-y-2">

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
                <div className="flex-1 flex flex-col gap-5 min-w-0">

                  {/* Header Row */}
                  <section className="flex flex-col gap-2">
                    <div className="flex items-end justify-between gap-4 pb-1">
                      <div className="space-y-1">
                        <div className="flex items-center gap-4">
                          <h1 className="text-4xl flex items-center font-black tracking-tighter text-foreground leading-none">
                            {activeBoard?.name || "Untitled Board"}
                            {activeTab !== 'board' && (
                              <>
                                <span className="w-2.5 h-2.5 rounded-full bg-[#cdd9b2] mx-4 mt-1 opacity-80" />
                                <span className="text-3xl font-thin text-white/60 tracking-tight mt-0.5">
                                  {activeTab === 'members' ? 'Collaboration' : 'Edit'}
                                </span>
                              </>
                            )}
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
                        <div className="max-w-5xl py-2 pt-4">

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                              <div className="rounded-[2.5rem] bg-[#0e0e10] border border-white/15 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
                                <div className="py-6 px-8 border-b border-white/10">
                                  <div className="flex items-center justify-between">
                                    <span className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                                      <UserMultipleIcon size={18} className="text-[#6C75BD]" />
                                      Collaborators
                                    </span>
                                    <Badge variant="outline" className="bg-[#40456B]/20 text-[#6C75BD] border-[#40456B]/30 text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-widest">
                                      {boardMembers.length} Members
                                    </Badge>
                                  </div>
                                </div>
                                <div className="divide-y divide-white/10">
                                  {boardMembers.map((m) => {
                                    const profile = memberProfiles[m.userId];
                                    const email = profile?.email;
                                    const fullName = profile?.fullName;
                                    const displayName = email || fullName || "Unknown Operative";
                                    const firstLetter = displayName.charAt(0).toUpperCase();

                                    const colorPalette = [
                                      "bg-[#6C75BD]/20 text-[#6C75BD]", // Signature Purple
                                      "bg-[#CDD9B2]/20 text-[#CDD9B2]", // Olive
                                      "bg-[#a098fa]/20 text-[#a098fa]", // Light Purple
                                      "bg-[#BEF264]/20 text-[#BEF264]", // Lemon
                                      "bg-white/10 text-white/70"       // Silver
                                    ];

                                    // Improved hash to ensure variety even for similar length names
                                    const hash = displayName.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
                                    const themeClass = colorPalette[hash % colorPalette.length];

                                    return (
                                      <div key={m.userId} className="flex items-center justify-between h-20 px-8 hover:bg-white/[0.02] transition-all group">
                                        <div className="flex items-center gap-6">
                                          <div className={`h-10 w-10 rounded-full flex items-center justify-center group-hover:scale-105 transition-all font-black text-[16px] ${themeClass}`}>
                                            {firstLetter}
                                          </div>
                                          <div>
                                            <p className="text-[15px] font-bold text-white tracking-tight leading-none mb-2">{displayName}</p>
                                            <div className="flex items-center gap-2">
                                              <Badge variant="outline" className={`${m.role === 'ADMIN' ? 'bg-[#6C75BD] text-white' : 'bg-teal-800 text-white'} border-none text-[7px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1`}>
                                                {m.role === 'ADMIN' ? <ShieldUserIcon size={8} /> : <UserIcon size={8} />}
                                                {m.role}
                                              </Badge>
                                              {Number(m.userId) === Number(activeBoard?.createdById) && (
                                                <Badge variant="outline" className="bg-[#CDD9B2] text-[#0E0E10] border-none text-[7px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-[0_0_10px_rgba(205,217,178,0.2)] flex items-center gap-1">
                                                  <CrownIcon size={8} />
                                                  FOUNDER
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        {isBoardAdmin && Number(m.userId) !== Number(activeBoard?.createdById) && (
                                          <div className="flex items-center gap-2 transition-all">
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-6 px-3 rounded-full text-[8px] font-black uppercase tracking-widest text-white/40 hover:bg-white/5 hover:text-white border border-white/5 flex items-center gap-1.5"
                                                >
                                                  <ShieldKeyIcon size={8} />
                                                  Permissions
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end" className="rounded-xl border-border/50 shadow-2xl bg-[#0e0e10] text-white">
                                                {["ADMIN", "MEMBER", "OBSERVER"].map(r => (
                                                  <DropdownMenuItem key={r} onClick={() => updateBoardRole(m.userId, r)} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 hover:bg-white/10 cursor-pointer">
                                                    {r}
                                                  </DropdownMenuItem>
                                                ))}
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 px-3 rounded-full text-[8px] font-black uppercase tracking-widest text-rose-500/60 hover:bg-rose-500/10 hover:text-rose-400 transition-all border border-rose-500/10 flex items-center gap-1.5"
                                              onClick={() => removeBoardMember(m)}
                                            >
                                              <Delete02Icon size={8} />
                                              Remove
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-6">
                              <div className="p-6 rounded-[2rem] bg-[#0e0e10] border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
                                <div className="flex items-center gap-4 mb-6">
                                  <div className="h-10 w-10 rounded-xl bg-[#40456B]/10 border border-[#40456B]/20 flex items-center justify-center text-[#6C75BD]">
                                    <Mail size={18} />
                                  </div>
                                  <h3 className="text-sm font-black uppercase tracking-widest">Invite Member</h3>
                                </div>
                                <form onSubmit={inviteBoardMember} className="space-y-6">
                                  <div className="space-y-3">
                                    <Label className="text-[12px] font-black tracking-widest text-white/20 ml-1 flex items-center gap-1.5">
                                      <Mail01Icon size={12} />
                                      SecureEmail
                                    </Label>
                                    <Input
                                      placeholder="member@gmail.com"
                                      className="h-10 bg-white/[0.03] border-white/5 rounded-2xl text-[13px] font-medium placeholder:text-white/10 focus-visible:border-white/20 focus-visible:ring-1 focus-visible:ring-white/20 transition-all"
                                      value={memberDraft.email}
                                      onChange={e => setMemberDraft(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <Label className="text-[12px] font-black tracking-widest text-white/20 ml-1 flex items-center gap-1.5">
                                      <ShieldKeyIcon size={12} />
                                      AccessLevel
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/[0.03] border border-white/5">
                                      {['ADMIN', 'MEMBER'].map(role => (
                                        <button
                                          key={role}
                                          type="button"
                                          onClick={() => setMemberDraft(prev => ({ ...prev, role }))}
                                          className={`h-8 rounded-xl text-[11px] font-black tracking-widest transition-all flex items-center justify-center gap-1.5 ${memberDraft.role === role ? 'bg-white/15 text-white shadow-lg shadow-black/20' : 'text-white/30 hover:text-white'}`}
                                        >
                                          {role === 'ADMIN' ? <ShieldUserIcon size={12} /> : <UserIcon size={12} />}
                                          {role === 'ADMIN' ? 'Admin' : 'Member'}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <Button type="submit" className="w-full h-10 rounded-2xl bg-[#6C75BD] hover:bg-[#6C75BD]/90 text-white font-black tracking-widest text-[12px] transition-all hover:scale-[1.02] active:scale-95 border-none shadow-[0_0_20px_rgba(108,117,189,0.3)] mt-2 flex items-center justify-center gap-2">
                                    <SentIcon size={14} />
                                    Send Invitation
                                  </Button>
                                </form>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="settings" className="outline-none mt-10 animate-in fade-in slide-in-from-right-4 duration-500 h-[calc(100vh-14rem)]">
                        <div className="max-w-5xl w-full h-full py-0">
                          <div className="h-full relative">
                            {boardEditDraft && (
                              <form onSubmit={handleUpdateBoard} className="h-full w-full">

                                <div className="grid grid-cols-5 gap-8">
                                  <div className="col-span-2 space-y-8">
                                    <div className="space-y-3">
                                      <Label className="block text-[14px] font-black tracking-widest text-white/20 ml-1">BoardName</Label>
                                      <Input
                                        value={boardEditDraft.name}
                                        onChange={e => setBoardEditDraft({ ...boardEditDraft, name: e.target.value })}
                                        className="h-12 bg-white/[0.03] border-white/5 rounded-2xl text-[16px] font-bold placeholder:text-white/10 focus-visible:border-white/20 focus-visible:ring-1 focus-visible:ring-white/20 transition-all"
                                      />
                                    </div>

                                    <div className="space-y-3">
                                      <Label className="block text-[14px] font-black tracking-widest text-white/20 ml-1">Visibility</Label>
                                      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/5">
                                        {['PRIVATE', 'PUBLIC'].map(v => (
                                          <button
                                            key={v}
                                            type="button"
                                            onClick={() => setBoardEditDraft({ ...boardEditDraft, visibility: v })}
                                            className={`h-10 rounded-xl text-[12px] font-black tracking-widest transition-all flex items-center justify-center gap-1.5 ${boardEditDraft.visibility === v ? 'bg-white/15 text-white shadow-lg shadow-black/20' : 'text-white/30 hover:text-white'}`}
                                          >
                                            {v === 'PRIVATE' ? <Lock size={14} /> : <Globe size={14} />}
                                            {v === 'PRIVATE' ? 'Private' : 'Public'}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="col-span-3 space-y-3">
                                    <Label className="block text-[14px] font-black tracking-widest text-white/20 ml-1">Description</Label>
                                    <textarea
                                      value={boardEditDraft.description}
                                      onChange={e => setBoardEditDraft({ ...boardEditDraft, description: e.target.value })}
                                      className="w-full h-[240px] bg-white/[0.03] border border-white/5 rounded-2xl text-[13px] font-medium p-4 text-white placeholder:text-white/10 focus-visible:border-white/20 focus-visible:ring-1 focus-visible:ring-white/20 outline-none transition-all resize-none"
                                      placeholder="Establish mission parameters..."
                                    />
                                  </div>
                                </div>

                                <div className="absolute -bottom-8 right-0 flex flex-col gap-3">
                                  <Button
                                    type="submit"
                                    disabled={boardUpdating}
                                    className="w-56 h-10 rounded-2xl bg-[#6C75BD] hover:bg-[#6C75BD]/90 text-white font-black tracking-widest text-[12px] transition-all hover:scale-[1.02] active:scale-95 border-none shadow-[0_0_20px_rgba(108,117,189,0.3)] flex items-center justify-center gap-2"
                                  >
                                    <Check size={14} strokeWidth={3} /> {boardUpdating ? "Synchronizing..." : "Apply Changes"}
                                  </Button>
                                  <Button
                                    type="button"
                                    onClick={handleDeleteBoard}
                                    disabled={boardDeleting}
                                    className="w-56 h-10 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-white font-black tracking-widest text-[12px] transition-all hover:scale-[1.02] active:scale-95 border border-rose-500/20 flex items-center justify-center gap-2"
                                  >
                                    <Trash2 size={14} strokeWidth={2.5} /> Delete Board
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
