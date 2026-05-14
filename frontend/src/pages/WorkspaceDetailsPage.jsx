import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
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
  Globe,
  Settings,
  Grid,
  ChevronDown,
  Layers,
  LayoutGrid,
  List as ListIcon,
  Calendar,
  Search as SearchIcon,
  Pencil
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const VISIBILITY_OPTIONS = ["PRIVATE", "TEAM", "PUBLIC"];
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
  const [searchParams] = useSearchParams();
  const user = useSelector((s) => s.auth.user);
  const { activeWorkspace: workspace, members, boards, userRole, status } = useSelector((s) => s.workspace);

  const activeTab = searchParams.get("tab") || "boards";

  const [inviteDraft, setInviteDraft] = useState({ email: "", role: "MEMBER" });
  const [inviteStatus, setInviteStatus] = useState("idle");
  const [showBoardForm, setShowBoardForm] = useState(false);
  const [boardDraft, setBoardDraft] = useState({ name: "", description: "", visibility: "PRIVATE" });
  const [boardSubmitting, setBoardSubmitting] = useState(false);
  const [showWsEdit, setShowWsEdit] = useState(false);
  const [wsEditDraft, setWsEditDraft] = useState({ name: "", description: "", visibility: "PRIVATE" });
  const [wsUpdating, setWsUpdating] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState({});
  const [boardViewMode, setBoardViewMode] = useState("list");
  const [boardSearchTerm, setBoardSearchTerm] = useState("");
  const [showBoardEdit, setShowBoardEdit] = useState(false);
  const [boardEditDraft, setBoardEditDraft] = useState(null);
  const [boardUpdating, setBoardUpdating] = useState(false);

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
      const profiles = { ...memberProfiles };
      try {
        const results = await authApi.searchUsers(""); 
        results.forEach(u => { profiles[u.userId] = u; });
        setMemberProfiles(profiles);
      } catch (err) { console.error("Failed to fetch member profiles", err); }
    };
    fetchProfiles();
  }, [members]);

  const memberIds = useMemo(() => new Set(members.map((m) => Number(m.userId))), [members]);
  const isAdmin = canManageWorkspace(user, userRole);
  const canEdit = canEditInWorkspace(user, userRole);
  const isObserver = userRole === "OBSERVER" && user?.role !== "PLATFORM_ADMIN";
  const isPending = members.find(m => Number(m.userId) === Number(user?.userId))?.status === "PENDING";

  // Auto-open edit modal if query param is present
  useEffect(() => {
    if (searchParams.get("edit") === "true" && isAdmin) {
      setShowWsEdit(true);
    }
  }, [searchParams, isAdmin]);

  const sendInvite = async (e) => {
    e.preventDefault();
    if (!inviteDraft.email) return;
    setInviteStatus("loading");
    try {
      await workspaceApi.invite(workspaceId, inviteDraft);
      toast.success("Invitation dispatched successfully.");
      setInviteDraft({ email: "", role: "MEMBER" });
      load();
    } catch (err) {
      toast.error("Failed to send invitation.");
    } finally { setInviteStatus("idle"); }
  };

  const removeMember = async (memberId) => {
    try {
      await workspaceApi.removeMember(workspaceId, memberId);
      toast.success(`Invite accepted for ${workspace?.name}`);
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
      toast.error("Deployment failed.");
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
      toast.success("Updated!");
      load();
    } catch (err) {
      toast.error("Failed to update.");
    } finally { setWsUpdating(false); }
  };

  const updateMemberRole = async (userId, nextRole) => {
    try {
      await workspaceApi.updateRole(workspaceId, userId, nextRole);
      toast.success("Role updated.");
      load();
    } catch (err) {
      toast.error("Failed to update role.");
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
      toast.success("Board created!");
      load();
    } catch (err) {
      showToast("error", "Failed to create board.");
    } finally {
      setBoardSubmitting(false);
    }
  };

  const handleBoardEdit = (board) => {
    setBoardEditDraft({
      boardId: board.boardId,
      name: board.name,
      description: board.description || "",
      background: board.background || "Ocean",
      visibility: board.visibility || "PRIVATE"
    });
    setShowBoardEdit(true);
  };

  const updateBoard = async (e) => {
    e.preventDefault();
    setBoardUpdating(true);
    try {
      await boardApi.update(boardEditDraft.boardId, boardEditDraft);
      setShowBoardEdit(false);
      toast.success("Board updated!");
      load();
    } catch (err) {
      toast.error("Failed to update board.");
    } finally {
      setBoardUpdating(false);
    }
  };

  const deleteBoard = async () => {
    if (!window.confirm("Permanently delete this board? This action cannot be undone.")) return;
    try {
      await boardApi.remove(boardEditDraft.boardId);
      setShowBoardEdit(false);
      toast.success("Board deleted.");
      load();
    } catch (err) {
      toast.error("Failed to delete board.");
    }
  };

  if (status === "loading" && !workspace) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <LoaderCircle size={40} className="animate-spin text-primary opacity-20" />
          <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Initializing Sector...</p>
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto">

        {isPending && (
          <div className="mb-12 p-8 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-500/5">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/20">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black">Invitation Pending</h3>
                <p className="text-sm font-medium text-amber-500/80">Authorize your access to start orchestrating workflows.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500/10 hover:text-amber-600" onClick={leaveWorkspace}>Decline</Button>
              <Button className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] bg-amber-500 hover:bg-amber-600 text-white border-none" onClick={acceptInvitation}>Accept Access</Button>
            </div>
          </div>
        )}

        {/* Tab Content Rendering */}
        {activeTab === "boards" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-6">
              <div>
                <h2 className="text-3xl font-black tracking-tighter flex items-center gap-4">
                   <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-[0_0_15px_rgba(20,184,166,0.1)]">
                     <FolderKanban className="h-6 w-6" />
                   </div>
                   Active Boards
                </h2>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 p-1.5 rounded-[1.25rem] bg-card/30 backdrop-blur-xl border border-border/40 shadow-2xl ring-1 ring-white/5">
                  <div className="relative group">
                    <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary transition-all group-focus-within:scale-110" />
                    <Input 
                      placeholder="Search boards..." 
                      className="pl-9 w-[220px] h-9 bg-background/40 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-xs font-bold placeholder:text-muted-foreground/40"
                      value={boardSearchTerm}
                      onChange={(e) => setBoardSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="w-px h-5 bg-border/50" />

                  <Tabs value={boardViewMode} onValueChange={setBoardViewMode} className="bg-background/20 p-0.5 rounded-xl">
                    <TabsList className="bg-transparent h-9 gap-1">
                      <TabsTrigger value="list" className="rounded-lg px-4 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"><ListIcon size={14} className="mr-2" /> List</TabsTrigger>
                      <TabsTrigger value="grid" className="rounded-lg px-4 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"><LayoutGrid size={14} className="mr-2" /> Grid</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {canEdit && (
                  <Button onClick={() => setShowBoardForm(true)} className="h-12 px-6 rounded-2xl gap-3 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-[1.05] active:scale-95">
                    <Plus size={18} strokeWidth={3} /> New Board
                  </Button>
                )}
              </div>
            </div>

            {boardViewMode === "list" ? (
              <div className="rounded-[2rem] border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden shadow-2xl">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-border/50">
                      <TableHead className="w-[400px] font-black uppercase tracking-widest text-[10px] h-12 px-8">Board Name</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] h-12">Visibility</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] h-12">Last Active</TableHead>
                      <TableHead className="text-right font-black uppercase tracking-widest text-[10px] h-12 px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boards.filter(b => b.name.toLowerCase().includes(boardSearchTerm.toLowerCase())).map((board) => (
                      <TableRow key={board.boardId} className="group hover:bg-primary/5 transition-colors border-border/50 h-16">
                        <TableCell className="px-6 py-3">
                          <div 
                            onClick={() => navigate(`/boards/${board.boardId}`)}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-xl shadow-lg border border-white/10 group-hover:scale-110 transition-transform bg-primary/10 flex items-center justify-center text-primary/40">
                              <Layers size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="font-black text-md group-hover:text-primary transition-colors">{board.name}</div>
                                {isAdmin && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleBoardEdit(board);
                                    }}
                                    className="p-1 rounded-md hover:bg-primary/10 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <Pencil size={12} className="text-muted-foreground/30" />
                                  </button>
                                )}
                              </div>
                              <div className="text-xs font-medium text-muted-foreground line-clamp-1">{board.description || "No description provided."}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {board.visibility === 'PRIVATE' ? <Lock size={14} className="text-muted-foreground" /> : <Globe size={14} className="text-primary" />}
                            <span className="text-xs font-black uppercase tracking-tighter">{board.visibility}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar size={14} />
                            <span className="text-xs font-medium">Oct 21, 2026</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <Button asChild variant="outline" size="sm" className="rounded-xl font-black uppercase tracking-widest text-[10px] group-hover:border-primary group-hover:text-primary transition-all">
                            <Link to={`/boards/${board.boardId}`}>Open Board</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {boards.filter(b => b.name.toLowerCase().includes(boardSearchTerm.toLowerCase())).map((board) => (
                  <div 
                    key={board.boardId} 
                    onClick={() => navigate(`/boards/${board.boardId}`)}
                    className="cursor-pointer"
                  >
                    <Card className="h-56 relative overflow-hidden group hover:border-primary/50 transition-all rounded-3xl border-border/50 shadow-xl shadow-black/5 hover:shadow-primary/5">
                      <div className="absolute inset-0 opacity-90 group-hover:opacity-100 transition-opacity bg-muted/20 flex items-center justify-center">
                        <Layers size={64} className="text-primary/5 group-hover:text-primary/10 transition-all duration-700" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                      <CardHeader className="relative p-6 pb-0">
                        <div className="flex justify-between items-start">
                          <Badge variant="outline" className="bg-black/30 text-white border-white/20 backdrop-blur-md text-[9px] font-black tracking-widest uppercase py-1 px-3">
                            {board.visibility}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="relative p-6 pt-12">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-2xl text-white font-black group-hover:translate-x-2 transition-transform">{board.name}</CardTitle>
                          {isAdmin && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBoardEdit(board);
                              }}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-white/70 line-clamp-2 mt-2 font-medium leading-relaxed">{board.description || "Visual workflow management board."}</p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
                
                {canEdit && (
                  <button 
                    onClick={() => setShowBoardForm(true)}
                    className="h-full min-h-[280px] flex flex-col items-center justify-center border-2 border-dashed border-border/20 rounded-[2.5rem] bg-transparent hover:bg-primary/5 hover:border-primary/30 group transition-all duration-500"
                  >
                    <div className="h-16 w-16 rounded-[1.25rem] bg-primary/5 border border-primary/10 flex items-center justify-center text-primary/40 group-hover:text-primary group-hover:bg-primary/10 group-hover:scale-110 group-hover:rotate-90 transition-all duration-500">
                      <Plus size={32} strokeWidth={3} />
                    </div>
                    <div className="mt-6 text-center">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 group-hover:text-primary transition-colors">Initialize Stage</h4>
                      <p className="text-[9px] font-bold text-muted-foreground/30 mt-1 uppercase tracking-wider italic">Deploy new board</p>
                    </div>
                  </button>
                )}
              </div>
            )}

            {boards.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 rounded-3xl bg-muted/5 border-2 border-dashed border-border/50">
                <div className="w-20 h-20 rounded-3xl bg-muted/20 flex items-center justify-center text-muted-foreground mb-6">
                  <FolderKanban size={40} />
                </div>
                <p className="text-lg font-black text-foreground/60">No boards discovered in this sector.</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">Start by creating your first collaborative workspace.</p>
                {canEdit && <Button variant="link" className="mt-4 font-black uppercase tracking-widest text-xs text-primary" onClick={() => setShowBoardForm(true)}>Deploy First Board</Button>}
              </div>
            )}
          </div>
        )}

        {activeTab === "members" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/50 pb-8 gap-6">
              <div>
                <h2 className="text-3xl font-black tracking-tighter flex items-center gap-4">
                   <Users className="h-8 w-8 text-primary" />
                   Personnel Management
                </h2>
                <p className="text-sm font-medium text-muted-foreground mt-1">Manage collaborators and authorization levels for this workspace.</p>
              </div>
              
              {isAdmin && (
                <div className="bg-card p-6 rounded-3xl border border-border/50 shadow-2xl flex-1 max-w-xl">
                  <form onSubmit={sendInvite} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        required 
                        placeholder="collaborator@email.com" 
                        className="pl-10 h-11 bg-muted/20 border-border/50 rounded-xl focus:ring-primary/20"
                        value={inviteDraft.email}
                        onChange={(e) => setInviteDraft(d => ({ ...d, email: e.target.value }))}
                      />
                    </div>
                    <select 
                      className="h-11 bg-muted/30 border border-border/50 rounded-xl px-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-2 ring-primary/20 appearance-none cursor-pointer"
                      value={inviteDraft.role}
                      onChange={(e) => setInviteDraft(d => ({ ...d, role: e.target.value }))}
                    >
                      {WORKSPACE_ROLES.filter(r => r !== "OWNER").map(r => (
                        <option key={r} value={r}>{workspaceRoleLabel(r)}</option>
                      ))}
                    </select>
                    <Button type="submit" className="h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20" disabled={inviteStatus === "sending"}>
                      {inviteStatus === "sending" ? <LoaderCircle className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Invite
                    </Button>
                  </form>
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden shadow-2xl">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="w-[400px] font-black uppercase tracking-widest text-[10px] h-14 px-8">Member Name</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px] h-14">Role</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px] h-14">Status</TableHead>
                    <TableHead className="text-right font-black uppercase tracking-widest text-[10px] h-14 px-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => {
                    const profile = memberProfiles[m.userId];
                    const isMe = Number(m.userId) === Number(user?.userId);
                    return (
                      <TableRow key={m.userId} className="group hover:bg-primary/5 transition-colors border-border/50">
                        <TableCell className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-primary/20 ring-4 ring-primary/5">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile?.fullName || m.userId}`} />
                              <AvatarFallback>{profile?.fullName?.[0] || "?"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-black text-lg">
                                {profile?.fullName || `User #${m.userId}`}
                                {isMe && <Badge variant="secondary" className="ml-2 bg-primary text-white border-none text-[8px] font-black uppercase">You</Badge>}
                              </div>
                              <div className="text-xs font-medium text-muted-foreground">{profile?.email || "No contact info"}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isAdmin && m.role !== "OWNER" ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all">
                                  {workspaceRoleLabel(m.role)} <ChevronDown size={12} className="ml-2" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="rounded-xl border-border/50 shadow-2xl">
                                {WORKSPACE_ROLES.filter(r => r !== "OWNER").map(r => (
                                  <DropdownMenuItem key={r} onClick={() => updateMemberRole(m.userId, r)} className="text-[10px] font-black uppercase tracking-widest px-4 py-2">
                                    {workspaceRoleLabel(r)}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest py-1 px-3 border-border/50 bg-background/50">
                               {workspaceRoleLabel(m.role)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                           <Badge className={`text-[10px] font-black uppercase tracking-widest py-1 px-3 ${m.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                             {m.status}
                           </Badge>
                        </TableCell>
                        <TableCell className="text-right px-8">
                          {isAdmin && !isMe && m.role !== "OWNER" && (
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl opacity-0 group-hover:opacity-100 transition-all" onClick={() => removeMember(m.userId)}>
                              <Trash2 size={18} />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
            <div className="border-b border-border/50 pb-6">
              <h2 className="text-3xl font-black tracking-tighter flex items-center gap-4">
                 <Shield className="h-8 w-8 text-destructive" />
                 Sector Configuration
              </h2>
              <p className="text-sm font-medium text-muted-foreground mt-1">Management and security policies for this workspace.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="rounded-[2.5rem] border-border/50 shadow-2xl bg-card/50 overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-black">Workspace Policies</CardTitle>
                  <CardDescription className="font-medium text-sm leading-relaxed">Adjust visibility and access rules for all personnel in this sector.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-6">
                  <div className="p-6 rounded-3xl bg-muted/20 border border-border/50 space-y-4">
                     <div className="flex items-center justify-between">
                        <div className="font-black text-sm uppercase tracking-widest">Visibility Mode</div>
                        <Badge className="bg-primary text-white border-none px-3 font-black">{workspace?.visibility}</Badge>
                     </div>
                     <p className="text-xs font-medium text-muted-foreground leading-relaxed">This workspace is currently visible to {workspace?.visibility === 'PUBLIC' ? 'Everyone' : 'Team Members only'}. Only owners can change this setting.</p>
                  </div>
                  {isAdmin && (
                    <Button variant="outline" className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[11px]" onClick={() => setShowWsEdit(true)}>
                       Edit Configuration
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-destructive/20 shadow-2xl bg-destructive/5 overflow-hidden ring-1 ring-destructive/10">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-black text-destructive">Termination Zone</CardTitle>
                  <CardDescription className="font-medium text-sm leading-relaxed text-destructive/70">Highly sensitive actions that cannot be undone. Exercise extreme caution.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-6">
                   <div className="p-6 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium leading-relaxed">
                      {isAdmin 
                        ? "Careful: deleting this workspace will permanently remove all associated boards, cards, and member data. This action is irreversible." 
                        : "Leaving this workspace will immediately revoke your access to all boards and collaboration history."}
                   </div>
                   {isAdmin ? (
                     <Button variant="destructive" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-destructive/20" onClick={deleteWorkspace}>
                        <Trash2 className="mr-2 h-4 w-4" /> Permanently Delete
                     </Button>
                   ) : (
                     <Button variant="outline" className="w-full h-14 rounded-2xl border-destructive/50 text-destructive hover:bg-destructive hover:text-white font-black uppercase tracking-widest text-[11px]" onClick={leaveWorkspace}>
                        <LogOut className="mr-2 h-4 w-4" /> Leave Workspace
                     </Button>
                   )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs / Modals */}
      
      {/* Create Board Dialog */}
      <Dialog open={showBoardForm} onOpenChange={setShowBoardForm}>
        <DialogContent className="sm:max-w-[460px] rounded-[2rem] border-border/50 shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter">Initialize Board</DialogTitle>
            <DialogDescription className="text-[13px] font-medium leading-tight">Start a new project board. Choose a visual theme to match your workflow.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createBoard} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="board-name" className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-70">Board Name *</Label>
              <Input id="board-name" required placeholder="e.g. Q2 Roadmap" className="h-11 bg-muted/20 rounded-xl border-border/50 focus:ring-primary/20 text-sm font-medium" value={boardDraft.name} onChange={(e) => setBoardDraft(d => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="board-desc" className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-70">Strategy Description</Label>
              <textarea 
                id="board-desc" 
                placeholder="What are we achieving with this board?"
                className="flex min-h-[80px] w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-sm shadow-sm transition-all focus:ring-2 ring-primary/20 outline-none resize-none placeholder:text-muted-foreground/30 font-medium"
                value={boardDraft.description} 
                onChange={(e) => setBoardDraft(d => ({ ...d, description: e.target.value }))} 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-70">Access Level</Label>
              <select 
                className="flex h-11 w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-1 text-[11px] font-black uppercase tracking-widest transition-colors focus:ring-2 ring-primary/20 outline-none appearance-none cursor-pointer"
                value={boardDraft.visibility} 
                onChange={(e) => setBoardDraft(d => ({ ...d, visibility: e.target.value }))}
              >
                {["PRIVATE", "PUBLIC"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <DialogFooter className="pt-2 gap-2 flex-row justify-end items-center">
              <Button type="button" variant="ghost" className="rounded-xl font-bold h-11 px-6 text-[11px] uppercase tracking-widest" onClick={() => setShowBoardForm(false)}>Cancel</Button>
              <Button type="submit" className="rounded-xl px-8 h-11 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20" disabled={boardSubmitting}>
                {boardSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-3.5 w-3.5" />}
                Deploy Board
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Board Dialog */}
      <Dialog open={showBoardEdit} onOpenChange={setShowBoardEdit}>
        <DialogContent className="sm:max-w-[460px] rounded-[2rem] border-border/50 shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter">Edit Board</DialogTitle>
            <DialogDescription className="text-[13px] font-medium leading-tight">Update board configuration or terminate this workflow stage.</DialogDescription>
          </DialogHeader>
          <form onSubmit={updateBoard} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-70">Board Name *</Label>
              <Input required className="h-11 bg-muted/20 rounded-xl border-border/50 text-sm font-medium" value={boardEditDraft?.name || ""} onChange={(e) => setBoardEditDraft(d => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-70">Strategy Description</Label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-sm shadow-sm transition-all focus:ring-2 ring-primary/20 outline-none resize-none placeholder:text-muted-foreground/30 font-medium"
                value={boardEditDraft?.description || ""} 
                onChange={(e) => setBoardEditDraft(d => ({ ...d, description: e.target.value }))} 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-70">Access Level</Label>
              <select 
                className="flex h-11 w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-1 text-[11px] font-black uppercase tracking-widest transition-colors focus:ring-2 ring-primary/20 outline-none appearance-none cursor-pointer"
                value={boardEditDraft?.visibility || "PRIVATE"} 
                onChange={(e) => setBoardEditDraft(d => ({ ...d, visibility: e.target.value }))}
              >
                {["PRIVATE", "PUBLIC"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <DialogFooter className="pt-4 flex flex-row justify-end items-center border-t border-border/10 gap-3">
              <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive font-black uppercase tracking-widest text-[9px] h-10 px-4 rounded-xl mr-auto" onClick={deleteBoard}>
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
              </Button>
              <Button type="button" variant="ghost" className="rounded-xl h-10 font-black uppercase tracking-widest text-[9px] px-6" onClick={() => setShowBoardEdit(false)}>Cancel</Button>
              <Button type="submit" className="rounded-xl px-8 h-10 font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20 bg-primary text-primary-foreground" disabled={boardUpdating}>
                {boardUpdating ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-2 h-3.5 w-3.5" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Workspace Dialog */}
      <Dialog open={showWsEdit} onOpenChange={setShowWsEdit}>
        <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-border/50 shadow-2xl">
          <DialogHeader className="px-2">
            <DialogTitle className="text-3xl font-black tracking-tighter">Sector Management</DialogTitle>
            <DialogDescription className="text-sm font-medium leading-relaxed">Update the core configuration and descriptive metadata for this sector.</DialogDescription>
          </DialogHeader>
          <form onSubmit={updateWorkspace} className="space-y-6 pt-6 px-2">
            <div className="space-y-2">
              <Label htmlFor="ws-name" className="text-xs font-black uppercase tracking-widest ml-1">Sector Name *</Label>
              <Input id="ws-name" required className="h-12 bg-muted/20 rounded-2xl border-border/50 focus:ring-primary/20" value={wsEditDraft.name} onChange={(e) => setWsEditDraft(d => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-desc" className="text-xs font-black uppercase tracking-widest ml-1">Sector Mission</Label>
              <textarea 
                id="ws-desc" 
                className="flex min-h-[120px] w-full rounded-2xl border border-border/50 bg-muted/20 px-4 py-3 text-sm shadow-sm transition-all focus:ring-2 ring-primary/20 outline-none resize-none"
                value={wsEditDraft.description} 
                onChange={(e) => setWsEditDraft(d => ({ ...d, description: e.target.value }))} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest ml-1">Global Visibility</Label>
              <select 
                className="flex h-12 w-full rounded-2xl border border-border/50 bg-muted/20 px-4 py-1 text-xs font-black uppercase tracking-widest transition-colors focus:ring-2 ring-primary/20 outline-none appearance-none cursor-pointer"
                value={wsEditDraft.visibility} 
                onChange={(e) => setWsEditDraft(d => ({ ...d, visibility: e.target.value }))}
              >
                {VISIBILITY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <DialogFooter className="pt-6 flex flex-row justify-between items-center border-t border-border/20">
              {isAdmin && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive font-black uppercase tracking-widest text-[9px] h-10 px-4 rounded-xl group transition-all"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this sector? This cannot be undone.")) {
                      deleteWorkspace();
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5 group-hover:rotate-12 transition-transform" /> Delete
                </Button>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" className="rounded-xl h-10 font-black uppercase tracking-widest text-[9px] px-6" onClick={() => setShowWsEdit(false)}>Cancel</Button>
                <Button type="submit" className="rounded-xl px-8 h-10 font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95" disabled={wsUpdating}>
                  {wsUpdating ? <LoaderCircle className="mr-3 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-3 h-3.5 w-3.5" />}
                  Authorize Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
