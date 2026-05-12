import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  ArchiveRestore, 
  CheckSquare, 
  Edit2, 
  Eye, 
  Grid3x3, 
  LoaderCircle, 
  MoreHorizontal, 
  Send, 
  Trash2, 
  UserPlus, 
  UserX, 
  Users, 
  X,
  Plus,
  Clock,
  Activity,
  Settings2
} from "lucide-react";

import { authApi, boardApi, cardApi, columnApi, notificationApi } from "../api/services";
import BoardCanvas from "../components/board/BoardCanvas";
import CardDetailsModal from "../components/board/CardDetailsModal";
import AppShell from "../components/layout/AppShell";
import {
  createCard,
  createList,
  fetchBoardBundle,
  moveCardOptimistic,
  moveListOptimistic,
  persistCardMove,
  persistListMove,
} from "../store/slices/boardSlice";
import { isBoardAdmin as checkBoardAdmin, canEditBoard, workspaceRoleLabel, BOARD_ROLES } from "../utils/roles";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function BoardPage() {
  const { boardId } = useParams();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { activeBoard, lists, cardsById, cardsByListId, userRole, status, error } = useSelector((s) => s.board);

  const [boardMembers, setBoardMembers] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [memberDraft, setMemberDraft] = useState({ email: "", role: "MEMBER" });
  const [toast, setToast] = useState(null);
  const [archivedCards, setArchivedCards] = useState([]);
  const [activeTab, setActiveTab] = useState("board");
  const [showBoardEdit, setShowBoardEdit] = useState(false);
  const [boardEditDraft, setBoardEditDraft] = useState({ name: "", description: "", background: "Ocean", visibility: "PRIVATE" });
  const [boardUpdating, setBoardUpdating] = useState(false);
  const [workspaceBoards, setWorkspaceBoards] = useState([]);

  const isBoardAdmin = checkBoardAdmin(user, userRole);
  const canEdit = canEditBoard(user, userRole);
  const isObserver = userRole === "OBSERVER" && user?.role !== "PLATFORM_ADMIN";

  const totalCards = Object.keys(cardsById).length;
  const completedCards = Object.values(cardsById).filter((c) => c.status === "DONE").length;
  const overdueCards = Object.values(cardsById).filter((c) => c.dueDate && c.status !== "DONE" && new Date(c.dueDate) < new Date()).length;

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    dispatch(fetchBoardBundle(Number(boardId)));
  }, [boardId, user?.userId, dispatch]);

  useEffect(() => {
    if (error) showToast("error", error);
  }, [error]);

  useEffect(() => {
    if (!boardId) return;
    boardApi.members(Number(boardId)).then(setBoardMembers).catch(() => setBoardMembers([]));
    if (activeBoard?.workspaceId) {
      boardApi.byWorkspace(activeBoard.workspaceId).then(data => setWorkspaceBoards(data)).catch(() => []);
    }
  }, [boardId, status, activeBoard?.workspaceId]);

  useEffect(() => {
    if (!boardId) return;
    cardApi.archivedByBoard(Number(boardId)).then(setArchivedCards).catch(() => setArchivedCards([]));
    if (activeBoard) {
      setBoardEditDraft({
        name: activeBoard.name,
        description: activeBoard.description || "",
        background: activeBoard.background || "Ocean",
        visibility: activeBoard.visibility || "PRIVATE"
      });
    }
  }, [boardId, status, activeBoard?.name]);

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

  const handleUpdateBoard = async (e) => {
    e.preventDefault();
    setBoardUpdating(true);
    try {
      await boardApi.update(Number(boardId), boardEditDraft);
      setShowBoardEdit(false);
      dispatch(fetchBoardBundle(Number(boardId)));
      showToast("success", "Board updated.");
    } catch (err) {
      showToast("error", "Update failed.");
    } finally { setBoardUpdating(false); }
  };

  const handleCloseBoard = async () => {
    await boardApi.close(Number(boardId));
    dispatch(fetchBoardBundle(Number(boardId)));
  };

  const handleDeleteBoard = async () => {
    try {
      await boardApi.remove(Number(boardId));
      window.location.href = "/workspaces/" + activeBoard?.workspaceId;
    } catch (err) {
      showToast("error", "Failed to delete.");
    }
  };

  const handleCreateCard = async (listId, draft) => {
    await dispatch(createCard({ boardId: Number(boardId), listId: Number(listId), ...draft })).unwrap();
  };

  const handleDragEnd = async (result) => {
    const { destination, source, type, draggableId } = result;
    console.log("Drag result:", result);
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
      await notificationApi.send({
        recipientId: Number(match.userId),
        actorId: Number(user.userId),
        type: "ASSIGNMENT",
        title: `Board access: ${activeBoard?.name || "Board"}`,
        message: `${user.fullName || user.email} added you as ${memberDraft.role}.`,
        relatedId: Number(boardId),
        relatedType: "BOARD",
      });
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
    dispatch(fetchBoardBundle(Number(boardId)));
  };

  const removeBoardMember = async (member) => {
    await boardApi.removeMember(Number(boardId), member.userId);
    setBoardMembers(await boardApi.members(Number(boardId)));
  };

  const restoreCard = async (cardId) => {
    await cardApi.unarchive(cardId);
    await dispatch(fetchBoardBundle(Number(boardId))).unwrap();
    setArchivedCards(await cardApi.archivedByBoard(Number(boardId)));
  };

  const progressPercent = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

  return (
    <AppShell>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-10 z-[100] animate-in fade-in slide-in-from-right-4 duration-300">
          <Badge variant={toast.type === "error" ? "destructive" : "default"} className="px-4 py-2 text-sm shadow-lg gap-2">
            {toast.type === "success" && <CheckSquare size={14} />}
            {toast.type === "error" && <X size={14} />}
            {toast.msg}
          </Badge>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
             <h1 className="text-3xl font-bold tracking-tight text-foreground">{activeBoard?.name || "Board"}</h1>
             {isBoardAdmin && (
               <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setShowBoardEdit(true)}>
                 <Edit2 size={16} />
               </Button>
             )}
          </div>
          <p className="text-sm text-muted-foreground">{activeBoard?.description || "Visual workflow management."}</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" asChild>
             <Link to={`/workspaces/${activeBoard?.workspaceId}`}><ArrowLeft className="mr-2 h-4 w-4" /> Workspace</Link>
           </Button>
           {isBoardAdmin && (
             <Button size="sm" variant="outline" onClick={() => setShowBoardEdit(true)} className="border-primary/20 hover:bg-primary/5 text-primary">
               <Settings2 size={16} className="mr-2 h-4 w-4" /> Settings
             </Button>
           )}
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="py-4 pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center justify-between">
              Progress
              <Activity className="h-3.5 w-3.5 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold">{progressPercent}%</span>
              <span className="text-xs text-muted-foreground">{completedCards}/{totalCards} tasks</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="py-4 pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center justify-between">
              Visibility
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold uppercase tracking-tighter">{activeBoard?.visibility || "PRIVATE"}</div>
            <p className="text-xs text-muted-foreground mt-1">Visible to {activeBoard?.visibility === 'PUBLIC' ? 'Everyone' : 'Team Members'}</p>
          </CardContent>
        </Card>

        <Card className={`bg-card/50 backdrop-blur-sm ${overdueCards > 0 ? 'border-destructive/30 ring-1 ring-destructive/10' : 'border-border/50'}`}>
          <CardHeader className="py-4 pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center justify-between">
              Overdue
              <Clock className={`h-3.5 w-3.5 ${overdueCards > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueCards > 0 ? 'text-destructive' : ''}`}>{overdueCards}</div>
            <p className="text-xs text-muted-foreground mt-1">Critical tasks past due date</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="py-4 pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center justify-between">
              Team
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {boardMembers.slice(0, 3).map((m, i) => (
                  <Avatar key={i} className="h-7 w-7 border-2 border-background">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.userId}`} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                ))}
                {boardMembers.length > 3 && (
                  <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold">
                    +{boardMembers.length - 3}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium ml-1">{boardMembers.length} Members</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium underline cursor-pointer" onClick={() => setActiveTab("members")}>Manage Access</p>
          </CardContent>
        </Card>
      </div>

      {isObserver && (
        <div className="flex items-center gap-2 p-3 px-4 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground mb-6">
          <Eye size={14} />
          <span>You have <strong>read-only</strong> access as an observer. You can view tasks but cannot modify the board.</span>
        </div>
      )}

      {status === "loading" ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium animate-pulse">Initializing Board Workspace...</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50 p-1 h-12 mb-8">
            <TabsTrigger value="board" className="gap-2 px-6"><Grid3x3 size={14} /> Board</TabsTrigger>
            <TabsTrigger value="members" className="gap-2 px-6"><Users size={14} /> Members</TabsTrigger>
            {isBoardAdmin && archivedCards.length > 0 && (
              <TabsTrigger value="archived" className="gap-2 px-6"><ArchiveRestore size={14} /> Archived</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="board" className="outline-none">
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
              onMoveList={handleMoveList}
              otherBoards={workspaceBoards.filter(b => b.boardId !== Number(boardId))}
              onOpenCard={setSelectedCard}
              saving={status === "saving"}
              readOnly={!canEdit}
            />
          </TabsContent>

          <TabsContent value="members" className="outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 items-start">
              {isBoardAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-primary" />
                      Add Board Member
                    </CardTitle>
                    <CardDescription>Grant specific access to this project board.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form onSubmit={inviteBoardMember} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Email Address</Label>
                        <Input 
                          type="email" 
                          required 
                          placeholder="collaborator@email.com" 
                          value={memberDraft.email} 
                          onChange={(e) => setMemberDraft(d => ({ ...d, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Role</Label>
                        <select 
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={memberDraft.role} 
                          onChange={(e) => setMemberDraft(d => ({ ...d, role: e.target.value }))}
                        >
                          <option value="MEMBER">Member (Edit)</option>
                          <option value="ADMIN">Admin (Full Control)</option>
                          <option value="OBSERVER">Observer (View Only)</option>
                        </select>
                      </div>
                      <Button type="submit" className="w-full gap-2">
                        <Send size={14} /> Add to Board
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Board Personnel</CardTitle>
                  <CardDescription>Users with access to this board.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {boardMembers.map((m) => (
                      <div key={m.userId} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-accent/10">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.userId}`} />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold">User #{m.userId}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[10px] font-bold py-0 h-4 uppercase tracking-wider">
                                {m.role}
                              </Badge>
                              {Number(m.userId) === Number(activeBoard?.createdById) && <Badge className="text-[8px] h-3.5 px-1 bg-primary/10 text-primary border-primary/20">Creator</Badge>}
                            </div>
                          </div>
                        </div>
                        {isBoardAdmin && Number(m.userId) !== Number(activeBoard?.createdById) && (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => updateBoardRole(m)}>Change Role</Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => removeBoardMember(m)}>
                              <UserX size={14} />
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

          <TabsContent value="archived" className="outline-none">
            <Card>
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArchiveRestore className="h-5 w-5 text-amber-500" />
                    Archived Records
                  </CardTitle>
                  <CardDescription>Recently removed items that can be restored to the active board.</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-3">
                   {archivedCards.map((c) => (
                     <div key={c.cardId} className="flex items-center justify-between p-4 rounded-xl border bg-accent/5">
                        <div className="space-y-1">
                          <p className="text-sm font-bold">{c.title}</p>
                          <div className="flex gap-2 items-center">
                            <Badge variant="outline" className="text-[10px]">{c.priority}</Badge>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{c.status}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => restoreCard(c.cardId)}>
                           <ArchiveRestore size={14} /> Restore Item
                        </Button>
                     </div>
                   ))}
                   {archivedCards.length === 0 && (
                     <div className="text-center py-10 text-muted-foreground italic text-sm">
                       No archived items found.
                     </div>
                   )}
                 </div>
               </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Edit Board Dialog */}
      <Dialog open={showBoardEdit} onOpenChange={setShowBoardEdit}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Board Configurations</DialogTitle>
            <DialogDescription>Modify global settings and visual identity for this board.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateBoard} className="space-y-5 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-board-name">Board Name *</Label>
              <Input id="edit-board-name" required value={boardEditDraft.name} onChange={(e) => setBoardEditDraft(d => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-board-desc">Description</Label>
              <textarea 
                id="edit-board-desc" 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={boardEditDraft.description} 
                onChange={(e) => setBoardEditDraft(d => ({ ...d, description: e.target.value }))} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>Visual Theme</Label>
                 <select 
                   className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                   value={boardEditDraft.background} 
                   onChange={(e) => setBoardEditDraft(d => ({ ...d, background: e.target.value }))}
                 >
                   {["Ocean", "Sunset", "Midnight", "Forest", "Aurora"].map(b => <option key={b} value={b}>{b}</option>)}
                 </select>
               </div>
               <div className="space-y-1.5">
                 <Label>Visibility</Label>
                 <select 
                   className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                   value={boardEditDraft.visibility} 
                   onChange={(e) => setBoardEditDraft(d => ({ ...d, visibility: e.target.value }))}
                 >
                   {["PRIVATE", "TEAM", "PUBLIC"].map(v => <option key={v} value={v}>{v}</option>)}
                 </select>
               </div>
            </div>

            <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-destructive/80 flex items-center gap-2">
                <Trash2 size={12} /> Danger Zone
              </h4>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="flex-1 text-xs border-destructive/20 hover:bg-destructive/10 text-destructive" onClick={handleCloseBoard}>Archive Board</Button>
                <Button type="button" variant="outline" size="sm" className="flex-1 text-xs bg-destructive text-white hover:bg-destructive/90 border-transparent" onClick={handleDeleteBoard}>Delete Forever</Button>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setShowBoardEdit(false)}>Cancel</Button>
              <Button type="submit" disabled={boardUpdating}>
                {boardUpdating ? <LoaderCircle size={14} className="mr-2 animate-spin" /> : <CheckSquare size={14} className="mr-2" />}
                Save Configuration
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CardDetailsModal
        boardId={Number(boardId)}
        card={selectedCard}
        boardMembers={boardMembers}
        currentUser={user}
        open={Boolean(selectedCard)}
        onClose={() => setSelectedCard(null)}
        onRefresh={() => dispatch(fetchBoardBundle(Number(boardId))).unwrap()}
        readOnly={!canEdit}
      />
    </AppShell>
  );
}
