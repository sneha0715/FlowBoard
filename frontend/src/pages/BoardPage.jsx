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
import AppShell from "@/components/layout/AppShell";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { 
  LoaderCircle, 
  Eye, 
  Users, 
  Mail, 
  Search,
  UserX,
  ArrowLeft,
  Grid3x3,
  ArchiveRestore,
  Settings,
  Trash2,
  Check,
  X,
  Lock,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
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

  const canEdit = userRole === "ADMIN" || userRole === "MEMBER";
  const isBoardAdmin = userRole === "ADMIN";
  const isObserver = userRole === "OBSERVER";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("edit") === "true" && isBoardAdmin) {
      setActiveTab("settings");
    }
  }, [location.search, isBoardAdmin]);

  useEffect(() => {
    if (activeBoard && !boardEditDraft) {
      setBoardEditDraft({
        name: activeBoard.name,
        description: activeBoard.description || "",
        visibility: activeBoard.visibility
      });
    }
  }, [activeBoard]);

  const handleUpdateBoard = async (e) => {
    e.preventDefault();
    setBoardUpdating(true);
    try {
      await boardApi.update(Number(boardId), boardEditDraft);
      toast.success("Board configuration updated.");
      dispatch(fetchBoardBundle(Number(boardId)));
    } catch (err) {
      toast.error("Failed to update board.");
    } finally {
      setBoardUpdating(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!window.confirm("FATAL ACTION: Terminate this board permanently? All stage data will be lost.")) return;
    setBoardDeleting(true);
    try {
      await boardApi.remove(Number(boardId));
      toast.success("Board terminated.");
      navigate(`/workspaces/${activeBoard.workspaceId}`);
    } catch (err) {
      toast.error("Failed to terminate board.");
      setBoardDeleting(false);
    }
  };

  const handleRestoreCard = async (cardId) => {
    try {
      await cardApi.unarchive(cardId);
      toast.success("Card restored to board.");
      dispatch(fetchBoardBundle(Number(boardId)));
      const updatedArchived = await cardApi.archivedByBoard(Number(boardId));
      setArchivedCards(updatedArchived);
    } catch (err) {
      toast.error("Failed to restore card.");
    }
  };


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
      showToast("success", "List deleted.");
    } catch (err) {
      showToast("error", "Failed to delete list.");
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
        boardId: Number(boardId),
        cardId,
        sourceListId: Number(source.droppableId.replace("list-", "")),
        destinationListId: Number(destination.droppableId.replace("list-", "")),
        destinationIndex: destination.index,
      })).unwrap();

      if (movedCard?.assigneeId) {
        const destListId = Number(destination.droppableId.replace("list-", ""));
        const destList = lists.find((l) => Number(l.listId) === destListId);
        const isDone = destList?.name?.toLowerCase() === "done";
        await notificationApi.send({
          recipientId: Number(movedCard.assigneeId),
          actorId: Number(user.userId),
          type: "MOVE",
          title: isDone ? `Task completed: ${movedCard.title}` : `Card moved: ${movedCard.title}`,
          message: isDone
            ? `${user.fullName || user.email} moved the task to Done.`
            : `${user.fullName || user.email} moved the card to ${destList?.name || "a new stage"}.`,
          relatedId: cardId,
          relatedType: "CARD",
        });
      }
    } catch {
      dispatch(fetchBoardBundle(Number(boardId)));
    }
  };

  const inviteBoardMember = async (e) => {
    e.preventDefault();
    try {
      const users = await authApi.searchUsers(memberDraft.email);
      const match = users.find((u) => u.email?.toLowerCase() === memberDraft.email.trim().toLowerCase());
      if (!match) throw new Error("User not found.");
      await boardApi.addMember(Number(boardId), { userId: Number(match.userId), role: memberDraft.role });
      setMemberDraft({ email: "", role: "MEMBER" });
      showToast("success", `${match.fullName || match.email} added.`);
      setBoardMembers(await boardApi.members(Number(boardId)));
    } catch (err) {
      showToast("error", err?.message || "Failed to add.");
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
      <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">

        <div className="flex-1 p-4 lg:p-6 lg:pt-0 overflow-hidden flex flex-col">
          {isObserver && (
            <div className="flex items-center gap-2 p-2 px-4 rounded-xl bg-muted/30 border border-border/50 text-[10px] text-muted-foreground mb-4 backdrop-blur-md">
              <Eye size={12} />
              <span>Read-only access enabled.</span>
            </div>
          )}

          {status === "loading" && !activeBoard ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 text-muted-foreground">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-black uppercase tracking-widest animate-pulse">Synchronizing Stage...</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
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
                />
              </TabsContent>

              <TabsContent value="members" className="outline-none mt-0 overflow-y-auto custom-scrollbar">
                <div className="max-w-5xl mx-auto py-8">
                  <Card className="bg-card/30 backdrop-blur-md border-border/30 overflow-hidden rounded-[2rem] shadow-2xl">
                    <CardHeader className="pb-8 border-b border-border/20">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1.5">
                          <CardTitle className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                            <Users className="text-primary" size={24} />
                            Stage Collaborators
                          </CardTitle>
                          <CardDescription className="text-xs font-medium tracking-wide">Manage access and roles for this board</CardDescription>
                        </div>
                        {isBoardAdmin && (
                          <form onSubmit={inviteBoardMember} className="flex gap-3">
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                              <Input
                                placeholder="Invite by email..."
                                className="pl-10 w-64 h-11 bg-background/50 border-border/30 rounded-xl text-xs"
                                value={memberDraft.email}
                                onChange={e => setMemberDraft(prev => ({ ...prev, email: e.target.value }))}
                              />
                            </div>
                            
                            <select 
                              value={memberDraft.role} 
                              onChange={e => setMemberDraft(prev => ({ ...prev, role: e.target.value }))}
                              className="w-32 h-11 bg-background/50 border border-border/30 rounded-xl text-[10px] font-black uppercase tracking-widest px-3 outline-none focus:ring-2 ring-primary/20 appearance-none cursor-pointer"
                            >
                              <option value="ADMIN">Admin</option>
                              <option value="MEMBER">Member</option>
                              <option value="OBSERVER">Observer</option>
                            </select>

                            <Button type="submit" className="h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                              Invite
                            </Button>
                          </form>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border/10">
                        {boardMembers.map((m) => (
                          <div key={m.userId} className="flex items-center justify-between p-6 px-8 hover:bg-muted/10 transition-colors">
                            <div className="flex items-center gap-5">
                              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                                <span className="text-lg font-black text-primary">{(m.fullName || m.email || "U").charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-black text-foreground">{m.fullName || m.email}</p>
                                <div className="flex items-center gap-3">
                                  <Badge variant="secondary" className="text-[9px] h-4 px-2 bg-muted/40 text-muted-foreground border-border/40 font-black uppercase tracking-widest">
                                    {m.role}
                                  </Badge>
                                  {Number(m.userId) === Number(activeBoard?.createdById) && <Badge className="text-[9px] h-4 px-2 bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-widest">Creator</Badge>}
                                </div>
                              </div>
                            </div>
                            {isBoardAdmin && Number(m.userId) !== Number(activeBoard?.createdById) && (
                              <div className="flex gap-3">
                                <Button variant="ghost" className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-border/20 hover:bg-background" onClick={() => updateBoardRole(m)}>Change Role</Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive border border-destructive/10" onClick={() => removeBoardMember(m)}>
                                  <UserX size={16} />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="archived" className="outline-none mt-0 overflow-y-auto custom-scrollbar">
                <div className="max-w-5xl mx-auto py-8">
                  <Card className="bg-card/30 backdrop-blur-md border-border/30 overflow-hidden rounded-[2rem] shadow-2xl">
                    <CardHeader className="pb-8 border-b border-border/20">
                      <div className="space-y-1.5">
                        <CardTitle className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                          <ArchiveRestore className="text-primary" size={24} />
                          Archived Repository
                        </CardTitle>
                        <CardDescription className="text-xs font-medium tracking-wide">View and restore operationally suspended cards</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {archivedCards.length === 0 ? (
                        <div className="p-20 text-center space-y-4">
                          <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto border border-border/10">
                             <ArchiveRestore size={32} className="text-muted-foreground/30" />
                          </div>
                          <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/40">Repository Empty</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border/10">
                          {archivedCards.map((card) => (
                            <div key={card.cardId} className="flex items-center justify-between p-6 px-8 hover:bg-muted/10 transition-colors group">
                              <div className="flex items-center gap-6">
                                <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
                                  <Grid3x3 size={20} className="text-primary/40" />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{card.title}</p>
                                  <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                    Archived on {new Date(card.updatedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Button 
                                onClick={() => handleRestoreCard(card.cardId)}
                                className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                              >
                                Restore Card
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="outline-none mt-0 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto py-8 space-y-8">
                  <Card className="bg-card/30 backdrop-blur-md border-border/30 overflow-hidden rounded-[2rem] shadow-2xl">
                    <CardHeader className="pb-8 border-b border-border/20">
                      <div className="space-y-1.5">
                        <CardTitle className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                          <Settings className="text-primary" size={24} />
                          Stage Configuration
                        </CardTitle>
                        <CardDescription className="text-xs font-medium tracking-wide">Adjust the core operational parameters of this initiative</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      <form onSubmit={handleUpdateBoard} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-70">Designation</Label>
                              <Input 
                                value={boardEditDraft?.name || ""} 
                                onChange={e => setBoardEditDraft(d => ({ ...d, name: e.target.value }))}
                                className="h-12 bg-background/50 border-border/30 rounded-xl text-sm font-bold"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-70">Mission Statement</Label>
                              <textarea 
                                value={boardEditDraft?.description || ""} 
                                onChange={e => setBoardEditDraft(d => ({ ...d, description: e.target.value }))}
                                className="w-full min-h-[120px] bg-background/50 border border-border/30 rounded-xl p-4 text-sm font-medium resize-none outline-none focus:ring-2 ring-primary/20 transition-all"
                              />
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-70">Visibility Level</Label>
                              <div className="flex gap-4">
                                {["PRIVATE", "PUBLIC"].map(v => (
                                  <button
                                    key={v}
                                    type="button"
                                    onClick={() => setBoardEditDraft(d => ({ ...d, visibility: v }))}
                                    className={`flex-1 h-12 rounded-xl border flex items-center justify-center gap-3 transition-all ${boardEditDraft?.visibility === v ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10' : 'border-border/30 bg-background/30 hover:border-border'}`}
                                  >
                                    {v === "PRIVATE" ? <Lock size={14} /> : <Globe size={14} />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{v}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-border/20 flex justify-end">
                          <Button type="submit" disabled={boardUpdating} className="h-12 px-10 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20">
                            {boardUpdating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                            Authorize Changes
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  <Card className="border-destructive/20 bg-destructive/5 overflow-hidden rounded-[2rem]">
                    <div className="p-8 flex items-center justify-between gap-8">
                      <div className="space-y-1.5">
                        <h4 className="text-lg font-black uppercase tracking-widest text-destructive flex items-center gap-2">
                          <Trash2 size={20} />
                          Fatal Action
                        </h4>
                        <p className="text-xs font-medium text-destructive/70">Permanently terminate this board and all its operational data. This cannot be reversed.</p>
                      </div>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteBoard}
                        disabled={boardDeleting}
                        className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-destructive/20"
                      >
                        {boardDeleting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Terminate Board
                      </Button>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

    </AppShell>
  );
}
