import { useEffect, useState } from "react";
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
import BoardSummary from "@/components/board/BoardSummary";
import BoardSidebar from "@/components/board/BoardSidebar";
import AppShell from "@/components/layout/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LoaderCircle, 
  Eye, 
  Users, 
  Mail, 
  UserX,
  ArrowRight,
  Grid3x3,
  ArchiveRestore,
  Settings,
  Trash2,
  Check,
  Lock,
  Globe,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [archivedCards, setArchivedCards] = useState([]);
  const [boardMembers, setBoardMembers] = useState([]);
  const [workspaceBoards, setWorkspaceBoards] = useState([]);
  const [memberDraft, setMemberDraft] = useState({ email: "", role: "MEMBER" });
  const [boardEditDraft, setBoardEditDraft] = useState(null);
  const [boardUpdating, setBoardUpdating] = useState(false);
  const [boardDeleting, setBoardDeleting] = useState(false);
  const [activities, setActivities] = useState([]);

  const canEdit = userRole === "ADMIN" || userRole === "MEMBER";
  const isBoardAdmin = userRole === "ADMIN";
  const isObserver = userRole === "OBSERVER";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("edit") === "true" && isBoardAdmin) setActiveTab("settings");
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
          <div className="p-6 pt-3 lg:p-8 lg:pt-4 space-y-5">
            
            {isObserver && (
              <div className="flex items-center gap-2 p-3 px-4 rounded-xl bg-white/[0.03] border border-white/5 text-[12px] text-white/50">
                <Eye size={14} />
                <span className="font-medium">Read-only access — Observation mode</span>
              </div>
            )}

            {status === "loading" && !activeBoard ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-white/40">
                <LoaderCircle className="h-8 w-8 animate-spin text-[#55efc4]" />
                <p className="text-[12px] font-medium animate-pulse">Loading board...</p>
              </div>
            ) : (
              <div className="flex gap-8">
                {/* ===== Main Content ===== */}
                <div className="flex-1 flex flex-col gap-8 min-w-0">
                  
                  {/* Information Row - Summary Cards */}
                  <section>
                    <h3 className="text-[13px] font-semibold text-white/50 mb-3">Information</h3>
                    <BoardSummary cards={Object.values(cardsById)} lists={lists} />
                  </section>

                  {/* All My Tasks Section */}
                  <section className="flex-1 flex flex-col min-h-[500px] gap-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-[28px] font-bold text-white flex items-center gap-3">
                            All My Tasks
                            <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-[#55efc4]/10">
                              <Pencil size={14} className="text-[#55efc4]" />
                            </span>
                          </h2>
                          <p className="text-[13px] text-white/30 mt-1">
                            Managing your tasks is easy with Task Management
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <TabsList className="bg-white/[0.03] border border-white/5 p-1 rounded-xl h-9">
                            <TabsTrigger 
                              value="members" 
                              className="gap-1.5 px-3.5 h-7 rounded-lg data-[state=active]:bg-[#55efc4] data-[state=active]:text-[#0d0d0d] transition-all duration-200 font-semibold text-[11px]"
                            >
                              <Users size={12} /> Members
                            </TabsTrigger>
                            {isBoardAdmin && archivedCards.length > 0 && (
                              <TabsTrigger 
                                value="archived" 
                                className="gap-1.5 px-3.5 h-7 rounded-lg data-[state=active]:bg-[#55efc4] data-[state=active]:text-[#0d0d0d] transition-all duration-200 font-semibold text-[11px]"
                              >
                                <ArchiveRestore size={12} /> Archived
                              </TabsTrigger>
                            )}
                          </TabsList>

                          <button 
                            onClick={() => {
                              setActiveTab("board");
                              setShowAllTasks(!showAllTasks);
                            }}
                            className={`flex items-center gap-2 text-[12px] font-medium transition-colors ${showAllTasks ? 'text-[#55efc4]' : 'text-white/40 hover:text-[#55efc4]'}`}
                          >
                            {showAllTasks ? 'Show Summary' : 'See All Task'} <ArrowRight size={14} className={`transition-transform ${showAllTasks ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>
                      <TabsContent value="board" className="flex-1 outline-none mt-0 overflow-hidden">
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
                          onMoveList={handleMoveList}
                          otherBoards={workspaceBoards.filter(b => b.boardId !== Number(boardId))}
                          saving={status === "saving"}
                          readOnly={!canEdit}
                          activeTab={activeTab}
                          setActiveTab={setActiveTab}
                          isBoardAdmin={isBoardAdmin}
                          archivedCount={archivedCards.length}
                          showAll={showAllTasks}
                        />
                      </TabsContent>

                      <TabsContent value="members" className="outline-none mt-0 overflow-y-auto no-scrollbar">
                        <div className="max-w-4xl py-4">
                          <Card className="bg-[#1e1e30] border-white/5 overflow-hidden rounded-2xl">
                            <CardHeader className="pb-6 border-b border-white/5">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <CardTitle className="text-[18px] font-bold text-white flex items-center gap-2">
                                    <Users className="text-[#55efc4]" size={20} /> Collaborators
                                  </CardTitle>
                                  <CardDescription className="text-[12px] text-white/30">Manage access and roles</CardDescription>
                                </div>
                                {isBoardAdmin && (
                                  <form onSubmit={inviteBoardMember} className="flex gap-2">
                                    <div className="relative">
                                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                                      <Input placeholder="Invite by email..." className="pl-9 w-56 h-9 bg-white/[0.03] border-white/5 rounded-xl text-[12px] text-white placeholder:text-white/20 focus-visible:ring-0" value={memberDraft.email} onChange={e => setMemberDraft(prev => ({ ...prev, email: e.target.value }))} />
                                    </div>
                                    <select value={memberDraft.role} onChange={e => setMemberDraft(prev => ({ ...prev, role: e.target.value }))} className="w-28 h-9 bg-white/[0.03] border border-white/5 rounded-xl text-[11px] font-medium text-white/60 px-3 outline-none appearance-none cursor-pointer">
                                      <option value="ADMIN">Admin</option>
                                      <option value="MEMBER">Member</option>
                                      <option value="OBSERVER">Observer</option>
                                    </select>
                                    <button type="submit" className="h-9 px-4 rounded-xl text-[11px] font-semibold bg-[#55efc4] text-[#0d0d0d] hover:bg-[#00b894] transition-colors">Invite</button>
                                  </form>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="divide-y divide-white/5">
                                {boardMembers.map((m) => (
                                  <div key={m.userId} className="flex items-center justify-between p-5 px-6 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center gap-4">
                                      <div className="h-10 w-10 rounded-full bg-[#6c5ce7]/20 flex items-center justify-center">
                                        <span className="text-[14px] font-bold text-[#a29bfe]">{(m.fullName || m.email || "U").charAt(0).toUpperCase()}</span>
                                      </div>
                                      <div>
                                        <p className="text-[13px] font-semibold text-white">{m.fullName || m.email}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="text-[10px] font-medium text-white/30 bg-white/5 px-2 py-0.5 rounded">{m.role}</span>
                                          {Number(m.userId) === Number(activeBoard?.createdById) && <span className="text-[10px] font-medium text-[#55efc4] bg-[#55efc4]/10 px-2 py-0.5 rounded">Creator</span>}
                                        </div>
                                      </div>
                                    </div>
                                    {isBoardAdmin && Number(m.userId) !== Number(activeBoard?.createdById) && (
                                      <div className="flex gap-2">
                                        <button className="h-8 px-3 rounded-lg text-[11px] font-medium text-white/40 border border-white/5 hover:bg-white/5 transition-colors" onClick={() => updateBoardRole(m)}>Change Role</button>
                                        <button className="h-8 w-8 rounded-lg text-red-400 border border-red-400/10 hover:bg-red-400/10 flex items-center justify-center transition-colors" onClick={() => removeBoardMember(m)}>
                                          <UserX size={14} />
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

                      <TabsContent value="archived" className="outline-none mt-0 overflow-y-auto no-scrollbar">
                        <div className="max-w-4xl py-4">
                          <Card className="bg-[#1e1e30] border-white/5 overflow-hidden rounded-2xl">
                            <CardHeader className="pb-6 border-b border-white/5">
                              <CardTitle className="text-[18px] font-bold text-white flex items-center gap-2">
                                <ArchiveRestore className="text-[#55efc4]" size={20} /> Archived Cards
                              </CardTitle>
                              <CardDescription className="text-[12px] text-white/30">View and restore archived cards</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                              {archivedCards.length === 0 ? (
                                <div className="p-16 text-center space-y-3">
                                  <ArchiveRestore size={28} className="text-white/10 mx-auto" />
                                  <p className="text-[12px] text-white/20 font-medium">No archived cards</p>
                                </div>
                              ) : (
                                <div className="divide-y divide-white/5">
                                  {archivedCards.map((card) => (
                                    <div key={card.cardId} className="flex items-center justify-between p-5 px-6 hover:bg-white/[0.02] transition-colors group">
                                      <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white/[0.03] flex items-center justify-center">
                                          <Grid3x3 size={16} className="text-white/20" />
                                        </div>
                                        <div>
                                          <p className="text-[13px] font-semibold text-white group-hover:text-[#55efc4] transition-colors">{card.title}</p>
                                          <p className="text-[10px] text-white/20 mt-0.5">Archived {new Date(card.updatedAt).toLocaleDateString()}</p>
                                        </div>
                                      </div>
                                      <button onClick={() => handleRestoreCard(card.cardId)} className="h-8 px-4 rounded-lg text-[11px] font-semibold bg-[#55efc4] text-[#0d0d0d] hover:bg-[#00b894] transition-colors">
                                        Restore
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      <TabsContent value="settings" className="outline-none mt-0 overflow-y-auto no-scrollbar">
                        <div className="max-w-3xl py-4 space-y-6">
                          <Card className="bg-[#1e1e30] border-white/5 overflow-hidden rounded-2xl">
                            <CardHeader className="pb-6 border-b border-white/5">
                              <CardTitle className="text-[18px] font-bold text-white flex items-center gap-2">
                                <Settings className="text-[#55efc4]" size={20} /> Configuration
                              </CardTitle>
                              <CardDescription className="text-[12px] text-white/30">Adjust board settings</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                              <form onSubmit={handleUpdateBoard} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <div className="space-y-1.5">
                                      <Label className="text-[11px] font-medium text-white/40">Board Name</Label>
                                      <Input value={boardEditDraft?.name || ""} onChange={e => setBoardEditDraft(d => ({ ...d, name: e.target.value }))} className="h-10 bg-white/[0.03] border-white/5 rounded-xl text-[13px] text-white focus-visible:ring-0" />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-[11px] font-medium text-white/40">Description</Label>
                                      <textarea value={boardEditDraft?.description || ""} onChange={e => setBoardEditDraft(d => ({ ...d, description: e.target.value }))} className="w-full min-h-[100px] bg-white/[0.03] border border-white/5 rounded-xl p-3 text-[13px] text-white resize-none outline-none focus:border-white/10 transition-colors" />
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <div className="space-y-1.5">
                                      <Label className="text-[11px] font-medium text-white/40">Visibility</Label>
                                      <div className="flex gap-3">
                                        {["PRIVATE", "PUBLIC"].map(v => (
                                          <button key={v} type="button" onClick={() => setBoardEditDraft(d => ({ ...d, visibility: v }))}
                                            className={`flex-1 h-10 rounded-xl border flex items-center justify-center gap-2 transition-all text-[12px] font-medium ${boardEditDraft?.visibility === v ? 'border-[#55efc4] bg-[#55efc4]/10 text-[#55efc4]' : 'border-white/5 bg-white/[0.02] text-white/40 hover:border-white/10'}`}
                                          >
                                            {v === "PRIVATE" ? <Lock size={13} /> : <Globe size={13} />} {v}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="pt-4 border-t border-white/5 flex justify-end">
                                  <button type="submit" disabled={boardUpdating} className="h-10 px-6 rounded-xl text-[12px] font-semibold bg-[#55efc4] text-[#0d0d0d] hover:bg-[#00b894] transition-colors flex items-center gap-2 disabled:opacity-50">
                                    {boardUpdating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save Changes
                                  </button>
                                </div>
                              </form>
                            </CardContent>
                          </Card>

                          <Card className="border-red-500/10 bg-red-500/5 overflow-hidden rounded-2xl">
                            <div className="p-6 flex items-center justify-between gap-6">
                              <div>
                                <h4 className="text-[15px] font-bold text-red-400 flex items-center gap-2"><Trash2 size={16} /> Danger Zone</h4>
                                <p className="text-[12px] text-red-400/50 mt-0.5">Permanently delete this board. This cannot be undone.</p>
                              </div>
                              <button onClick={handleDeleteBoard} disabled={boardDeleting}
                                className="h-9 px-5 rounded-xl text-[12px] font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-2 disabled:opacity-50 border border-red-500/20"
                              >
                                {boardDeleting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Trash2 size={13} />} Delete Board
                              </button>
                            </div>
                          </Card>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </section>
                </div>

                {/* ===== Right Sidebar ===== */}
                <BoardSidebar activities={activities} />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
