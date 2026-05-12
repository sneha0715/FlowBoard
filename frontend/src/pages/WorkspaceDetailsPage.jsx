import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Edit2, 
  Eye, 
  FolderKanban, 
  LoaderCircle, 
  LogOut, 
  Mail, 
  Plus, 
  Send, 
  Shield, 
  Trash2, 
  UserPlus, 
  Users, 
  X,
  MoreVertical,
  Lock,
  Globe
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import { authApi, boardApi, columnApi, notificationApi, workspaceApi } from "../api/services";
import { fetchWorkspaceBundle } from "../store/slices/workspaceSlice";
import { canEditInWorkspace, canManageWorkspace, workspaceRoleLabel, WORKSPACE_ROLES } from "../utils/roles";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const VISIBILITY_OPTIONS = ["PRIVATE", "TEAM", "PUBLIC"];
const BACKGROUND_OPTIONS = ["Ocean", "Sunset", "Midnight", "Forest", "Aurora"];
const BG_GRADIENTS = {
  Ocean: "linear-gradient(135deg, #0d3b66, #1565c0)",
  Sunset: "linear-gradient(135deg, #c62828, #e65100)",
  Midnight: "linear-gradient(135deg, #1a237e, #0d1117)",
  Forest: "linear-gradient(135deg, #1b5e20, #2e7d32)",
  Aurora: "linear-gradient(135deg, #4a148c, #006064)",
};
const DEFAULT_LISTS = [
  { name: "To Do", color: "#0079BF" },
  { name: "In Progress", color: "#f59e0b" },
  { name: "In Review", color: "#a78bfa" },
  { name: "Done", color: "#3fb950" },
];

export default function WorkspaceDetailsPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { activeWorkspace: workspace, members, boards, userRole, status, error } = useSelector((s) => s.workspace);

  const [toast, setToast] = useState(null);
  const [inviteDraft, setInviteDraft] = useState({ email: "", role: "MEMBER" });
  const [inviteStatus, setInviteStatus] = useState("idle");
  const [showBoardForm, setShowBoardForm] = useState(false);
  const [boardDraft, setBoardDraft] = useState({ name: "", description: "", background: "Ocean", visibility: "PRIVATE" });
  const [boardSubmitting, setBoardSubmitting] = useState(false);
  const [showWsEdit, setShowWsEdit] = useState(false);
  const [wsEditDraft, setWsEditDraft] = useState({ name: "", description: "", visibility: "PRIVATE" });
  const [wsUpdating, setWsUpdating] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const load = () => dispatch(fetchWorkspaceBundle(workspaceId));

  useEffect(() => {
    load();
  }, [workspaceId]);

  useEffect(() => {
    if (workspace) {
      setWsEditDraft({ 
        name: workspace.name, 
        description: workspace.description || "", 
        visibility: workspace.visibility || "PRIVATE" 
      });
    }
  }, [workspace]);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (members.length === 0) return;
      setLoadingProfiles(true);
      const profiles = { ...memberProfiles };
      try {
        const results = await authApi.searchUsers(""); 
        results.forEach(u => { profiles[u.userId] = u; });
        setMemberProfiles(profiles);
      } catch (err) { console.error("Failed to fetch member profiles", err); }
      finally { setLoadingProfiles(false); }
    };
    fetchProfiles();
  }, [members]);

  const memberIds = useMemo(() => new Set(members.map((m) => Number(m.userId))), [members]);
  const isAdmin = canManageWorkspace(user, userRole);
  const canEdit = canEditInWorkspace(user, userRole);
  const isObserver = userRole === "OBSERVER" && user?.role !== "PLATFORM_ADMIN";
  const isPending = members.find(m => Number(m.userId) === Number(user?.userId))?.status === "PENDING";

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    setInviteStatus("sending");
    try {
      const users = await authApi.searchUsers(inviteDraft.email);
      let match = users.find((u) => u.email?.toLowerCase() === inviteDraft.email.trim().toLowerCase());
      
      if (!match) {
        showToast("error", "User not found. They must register first.");
        setInviteStatus("idle");
        return;
      }
      
      if (memberIds.has(Number(match.userId))) {
        showToast("info", "User is already a member.");
        setInviteStatus("idle");
        return;
      }

      await workspaceApi.addMember(workspaceId, { userId: Number(match.userId), role: inviteDraft.role });
      await notificationApi.send({
        recipientId: Number(match.userId),
        actorId: Number(user.userId),
        type: "ASSIGNMENT",
        title: `Workspace invite: ${workspace?.name || "Workspace"}`,
        message: `${user.fullName || user.email} invited you to join ${workspace?.name}.`,
        relatedId: Number(workspaceId),
        relatedType: "WORKSPACE",
      });

      setInviteDraft({ email: "", role: "MEMBER" });
      setInviteStatus("idle");
      showToast("success", `${match.fullName || match.email} invited!`);
      load();
    } catch (err) {
      setInviteStatus("failed");
      showToast("error", err?.message || "Failed to invite.");
    }
  };

  const removeMember = async (memberId) => {
    try {
      await workspaceApi.removeMember(workspaceId, memberId);
      showToast("success", "Member removed.");
      load();
    } catch (err) {
      showToast("error", "Failed to remove member.");
    }
  };

  const leaveWorkspace = async () => {
    try {
      await workspaceApi.leaveWorkspace(workspaceId);
      navigate("/");
    } catch (err) {
      showToast("error", "Failed to leave workspace.");
    }
  };

  const acceptInvitation = async () => {
    try {
      await workspaceApi.acceptInvitation(workspaceId);
      showToast("success", "Welcome!");
      load();
    } catch (err) {
      showToast("error", "Failed to accept.");
    }
  };

  const deleteWorkspace = async () => {
    try {
      await workspaceApi.remove(workspaceId);
      navigate("/");
    } catch (err) {
      showToast("error", "Failed to delete.");
    }
  };

  const updateWorkspace = async (e) => {
    e.preventDefault();
    setWsUpdating(true);
    try {
      await workspaceApi.update(workspaceId, wsEditDraft);
      setShowWsEdit(false);
      showToast("success", "Updated!");
      load();
    } catch (err) {
      showToast("error", "Failed to update.");
    } finally { setWsUpdating(false); }
  };

  const updateMemberRole = async (userId, nextRole) => {
    try {
      await workspaceApi.updateRole(workspaceId, userId, nextRole);
      showToast("success", "Role updated.");
      load();
    } catch (err) {
      showToast("error", "Failed to update role.");
    }
  };

  const createBoard = async (e) => {
    e.preventDefault();
    setBoardSubmitting(true);
    try {
      const board = await boardApi.create({ ...boardDraft, workspaceId: Number(workspaceId) });
      await Promise.all(DEFAULT_LISTS.map((l, i) => 
        columnApi.create({ boardId: board.boardId, name: l.name, color: l.color, position: i })
      ));
      setBoardDraft({ name: "", description: "", background: "Ocean", visibility: "PRIVATE" });
      setShowBoardForm(false);
      showToast("success", "Board created!");
      load();
    } catch (err) {
      showToast("error", "Failed to create board.");
    } finally {
      setBoardSubmitting(false);
    }
  };

  return (
    <AppShell>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-10 z-[100] animate-in fade-in slide-in-from-right-4 duration-300">
          <Badge variant={toast.type === "error" ? "destructive" : "default"} className="px-4 py-2 text-sm shadow-lg gap-2">
            {toast.type === "success" && <Check size={14} />}
            {toast.type === "error" && <X size={14} />}
            {toast.msg}
          </Badge>
        </div>
      )}

      {/* Header with Title and Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
             <h1 className="text-3xl font-bold tracking-tight text-foreground">{workspace?.name || "Workspace"}</h1>
             {isAdmin && (
               <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setShowWsEdit(true)}>
                 <Edit2 size={16} />
               </Button>
             )}
          </div>
          <p className="text-sm text-muted-foreground">{workspace?.description || "Collaborative environment for your team."}</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" asChild>
             <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> All Workspaces</Link>
           </Button>
           {canEdit && (
             <Button size="sm" onClick={() => setShowBoardForm(true)}>
               <Plus className="mr-2 h-4 w-4" /> New Board
             </Button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Left Column: Boards */}
        <div className="space-y-6">
          {/* Status Banners */}
          {isPending && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Users className="text-primary h-5 w-5" />
                  <div>
                    <p className="text-sm font-semibold">You've been invited to join this team!</p>
                    <p className="text-xs text-muted-foreground">Accept to start collaborating on boards.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={leaveWorkspace}>Decline</Button>
                  <Button size="sm" onClick={acceptInvitation}>Accept & Join</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isObserver && !isPending && (
            <div className="flex items-center gap-2 p-3 px-4 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
              <Eye size={14} />
              <span>You have <strong>read-only</strong> access as an observer.</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              Boards
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {boards.map((board) => (
              <Link key={board.boardId} to={`/boards/${board.boardId}`}>
                <Card className="h-40 relative overflow-hidden group hover:border-primary/50 transition-all cursor-pointer">
                  <div 
                    className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity" 
                    style={{ background: BG_GRADIENTS[board.background] || BG_GRADIENTS.Ocean }} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <CardHeader className="relative p-4 pb-0">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="bg-black/20 text-white border-white/20 backdrop-blur-sm text-[10px]">
                        {board.visibility}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10 rounded-full">
                        <MoreVertical size={14} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="relative p-4 pt-8">
                    <CardTitle className="text-lg text-white group-hover:translate-x-1 transition-transform">{board.name}</CardTitle>
                    <p className="text-xs text-white/70 line-clamp-1 mt-1">{board.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
            
            {canEdit && (
              <button 
                onClick={() => setShowBoardForm(true)}
                className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-card/50 hover:bg-card hover:border-primary/50 group transition-all"
              >
                <div className="h-10 w-10 rounded-full border border-dashed border-muted-foreground flex items-center justify-center text-muted-foreground group-hover:border-primary group-hover:text-primary transition-all">
                  <Plus size={20} />
                </div>
                <span className="text-sm font-medium mt-3 text-muted-foreground group-hover:text-foreground">New Board</span>
              </button>
            )}
          </div>

          {boards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-xl">
              <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No boards found in this workspace.</p>
              {canEdit && <Button variant="link" onClick={() => setShowBoardForm(true)}>Create your first board</Button>}
            </div>
          )}
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          {/* Invite Member Card */}
          {isAdmin && (
            <Card className="overflow-hidden border-primary/20">
              <CardHeader className="bg-primary/5 py-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Invite Member
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-6 space-y-4">
                <form onSubmit={sendInvite} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="invite-email" className="text-xs">User Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input 
                        id="invite-email" 
                        type="email" 
                        required 
                        placeholder="collaborator@email.com" 
                        className="pl-9 h-9 text-sm"
                        value={inviteDraft.email}
                        onChange={(e) => setInviteDraft(d => ({ ...d, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="invite-role" className="text-xs">Role</Label>
                    <select 
                      id="invite-role"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={inviteDraft.role}
                      onChange={(e) => setInviteDraft(d => ({ ...d, role: e.target.value }))}
                    >
                      {WORKSPACE_ROLES.filter(r => r !== "OWNER").map(r => (
                        <option key={r} value={r}>{workspaceRoleLabel(r)}</option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" className="w-full h-9 gap-2" disabled={inviteStatus === "sending"}>
                    {inviteStatus === "sending" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Send Invitation
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Team Members Card */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Team
                </div>
                <Badge variant="secondary" className="text-[10px] h-5">{members.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              {userRole && userRole !== "NONE" && (
                <div className="p-2 px-3 rounded-lg bg-accent/50 border border-border flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Your Role</span>
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 uppercase">
                    {workspaceRoleLabel(userRole)}
                  </Badge>
                </div>
              )}
              
              <div className="space-y-3">
                {members.map((m) => {
                  const profile = memberProfiles[m.userId];
                  const isMe = Number(m.userId) === Number(user?.userId);
                  return (
                    <div key={m.userId} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.fullName || m.userId}`} />
                          <AvatarFallback>{profile?.fullName?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium truncate leading-none">
                            {profile?.fullName || `User #${m.userId}`}
                            {isMe && <span className="text-[10px] text-muted-foreground ml-1">(You)</span>}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {isAdmin && m.role !== "OWNER" ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter">
                                    {workspaceRoleLabel(m.role)}
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  {WORKSPACE_ROLES.filter(r => r !== "OWNER").map(r => (
                                    <DropdownMenuItem key={r} onClick={() => updateMemberRole(m.userId, r)}>
                                      {workspaceRoleLabel(r)}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                                {workspaceRoleLabel(m.role)}
                              </span>
                            )}
                            {m.status === "PENDING" && <Badge className="text-[8px] h-3.5 px-1 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>}
                          </div>
                        </div>
                      </div>
                      {isAdmin && !isMe && m.role !== "OWNER" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeMember(m.userId)}>
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Settings Card */}
          <Card className="border-destructive/10 overflow-hidden">
             <CardHeader className="bg-destructive/5 py-4">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive/80">
                  <Shield className="h-4 w-4" />
                  Workspace Settings
                </CardTitle>
             </CardHeader>
             <CardContent className="p-4 pt-4">
                <p className="text-[11px] text-muted-foreground mb-4">
                  {isAdmin 
                    ? "Careful: deleting this workspace will permanently remove all associated boards and data." 
                    : "Leaving this workspace will remove your access to all its content."}
                </p>
                {isAdmin ? (
                  <Button variant="outline" size="sm" className="w-full text-destructive border-destructive/20 hover:bg-destructive hover:text-white" onClick={deleteWorkspace}>
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Workspace
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="w-full text-destructive border-destructive/20" onClick={leaveWorkspace}>
                    <LogOut className="mr-2 h-3.5 w-3.5" /> Leave Workspace
                  </Button>
                )}
             </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs / Modals */}
      
      {/* Create Board Dialog */}
      <Dialog open={showBoardForm} onOpenChange={setShowBoardForm}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Create Board</DialogTitle>
            <DialogDescription>Start a new project board. Choose a visual theme to match.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createBoard} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="board-name">Board Name *</Label>
              <Input id="board-name" required value={boardDraft.name} onChange={(e) => setBoardDraft(d => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="board-desc">Description</Label>
              <textarea 
                id="board-desc" 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={boardDraft.description} 
                onChange={(e) => setBoardDraft(d => ({ ...d, description: e.target.value }))} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Background</Label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={boardDraft.background} 
                  onChange={(e) => setBoardDraft(d => ({ ...d, background: e.target.value }))}
                >
                  {BACKGROUND_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Visibility</Label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={boardDraft.visibility} 
                  onChange={(e) => setBoardDraft(d => ({ ...d, visibility: e.target.value }))}
                >
                  {VISIBILITY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="h-12 rounded-lg" style={{ background: BG_GRADIENTS[boardDraft.background] }} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowBoardForm(false)}>Cancel</Button>
              <Button type="submit" disabled={boardSubmitting}>
                {boardSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create Board
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Workspace Dialog */}
      <Dialog open={showWsEdit} onOpenChange={setShowWsEdit}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>Update the name and visibility of this workspace.</DialogDescription>
          </DialogHeader>
          <form onSubmit={updateWorkspace} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="ws-name">Name *</Label>
              <Input id="ws-name" required value={wsEditDraft.name} onChange={(e) => setWsEditDraft(d => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ws-desc">Description</Label>
              <textarea 
                id="ws-desc" 
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={wsEditDraft.description} 
                onChange={(e) => setWsEditDraft(d => ({ ...d, description: e.target.value }))} 
              />
            </div>
            <div className="space-y-1.5">
              <Label>Visibility</Label>
              <div className="grid grid-cols-3 gap-2">
                {VISIBILITY_OPTIONS.map(v => (
                  <Button 
                    key={v}
                    type="button"
                    variant={wsEditDraft.visibility === v ? "default" : "outline"}
                    className="h-9 text-xs"
                    onClick={() => setWsEditDraft(d => ({ ...d, visibility: v }))}
                  >
                    {v === 'PRIVATE' && <Lock className="mr-1.5 h-3 w-3" />}
                    {v === 'PUBLIC' && <Globe className="mr-1.5 h-3 w-3" />}
                    {v === 'TEAM' && <Users className="mr-1.5 h-3 w-3" />}
                    {v}
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowWsEdit(false)}>Cancel</Button>
              <Button type="submit" disabled={wsUpdating}>
                {wsUpdating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </AppShell>
  );
}
