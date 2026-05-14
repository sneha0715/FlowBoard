import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  ArrowRight,
  Users,
  FolderKanban,
  Layers,
  MoreVertical,
  Globe,
  Lock,
  Mail,
  LayoutGrid,
  List as ListIcon,
  Search as SearchIcon,
  Calendar,
  LoaderCircle,
  Pencil
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AppShell from "../components/layout/AppShell";
import { boardApi, workspaceApi } from "../api/services";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WorkspacePage() {
  const user = useSelector((s) => s.auth.user);
  const [workspaces, setWorkspaces] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [boardsByWorkspace, setBoardsByWorkspace] = useState({});
  const [loading, setLoading] = useState(true);
  const [showWsForm, setShowWsForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [wsDraft, setWsDraft] = useState({ name: "", description: "", visibility: "PRIVATE" });
  const [viewMode, setViewMode] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");

  const refresh = async () => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      const [wsList, invites] = await Promise.all([
        workspaceApi.byMember(user.userId),
        workspaceApi.pendingInvitations()
      ]);
      setWorkspaces(wsList);
      setPendingInvites(invites);
      const boardEntries = await Promise.all(
        wsList.map(async (ws) => [ws.workspaceId, await boardApi.byWorkspace(ws.workspaceId).catch(() => [])])
      );
      setBoardsByWorkspace(Object.fromEntries(boardEntries));
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [user?.userId]);

  const handleAccept = async (wsId) => {
    try {
      await workspaceApi.acceptInvitation(wsId);
      refresh();
    } catch (err) {
      console.error("Failed to accept invitation:", err);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!wsDraft.name.trim()) return;
    setSubmitting(true);
    try {
      await workspaceApi.create(wsDraft);
      setWsDraft({ name: "", description: "", visibility: "PRIVATE" });
      setShowWsForm(false);
      refresh();
    } catch (err) {
      console.error("Failed to create workspace:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      {/* Action Header */}
      <div className="flex flex-col space-y-8 mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative">
            <h2 className="text-5xl font-black tracking-tighter text-foreground drop-shadow-sm">Workspaces</h2>
            <div className="absolute -bottom-2 left-0 w-12 h-1 bg-primary rounded-full shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
          </div>
          
          <Button onClick={() => setShowWsForm(true)} className="h-12 px-8 rounded-2xl gap-3 font-black uppercase tracking-[0.15em] text-[11px] shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] bg-primary hover:bg-primary/90 text-primary-foreground border-none ring-1 ring-primary/50">
            <Plus size={20} strokeWidth={3} />
            Initialize Sector
          </Button>
        </div>

        <div className="flex items-center gap-4 p-2 rounded-[1.5rem] bg-card/30 backdrop-blur-xl border border-border/40 shadow-2xl shadow-black/20 ring-1 ring-white/5 max-w-fit">
          <div className="relative group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary transition-all group-focus-within:scale-110" />
            <Input 
              placeholder="Search workspaces..." 
              className="pl-11 w-[280px] h-10 bg-background/40 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-bold placeholder:text-muted-foreground/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-px h-6 bg-border/50 mx-2" />

          <Tabs value={viewMode} onValueChange={setViewMode} className="bg-background/20 p-1 rounded-xl">
            <TabsList className="bg-transparent h-10 gap-1">
              <TabsTrigger value="list" className="rounded-lg px-5 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"><ListIcon size={16} className="mr-2" /> List</TabsTrigger>
              <TabsTrigger value="grid" className="rounded-lg px-5 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"><LayoutGrid size={16} className="mr-2" /> Grid</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Pending Invitations Section */}
      {pendingInvites.length > 0 && (
        <div className="mb-12 p-8 rounded-3xl bg-amber-500/5 border border-amber-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Mail size={120} />
          </div>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
              <Mail size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">Collaboration Invitations</h3>
              <p className="text-sm font-medium text-amber-500/70">Teams are waiting for your expertise.</p>
            </div>
            <Badge variant="secondary" className="ml-2 bg-amber-500 text-white border-none px-3 py-1 font-black">{pendingInvites.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingInvites.map((invite) => (
              <Card key={invite.memberId} className="border-amber-500/30 bg-background/50 backdrop-blur-sm shadow-xl shadow-amber-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-black">Workspace Invite</CardTitle>
                  <CardDescription className="font-medium text-muted-foreground/80">Join as <span className="text-amber-600 font-black">{invite.role}</span></CardDescription>
                </CardHeader>
                <CardFooter className="gap-3 pt-4">
                  <Button variant="ghost" size="sm" className="flex-1 font-bold hover:bg-amber-500/10 hover:text-amber-600" onClick={() => workspaceApi.leaveWorkspace(invite.workspaceId).then(refresh)}>Decline</Button>
                  <Button size="sm" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white border-none font-bold" onClick={() => handleAccept(invite.workspaceId)}>Join Team</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <LoaderCircle size={40} className="animate-spin text-primary opacity-20" />
          <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Synchronizing Data...</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="w-[400px] font-black uppercase tracking-widest text-[10px] h-14 px-8">Workspace Name</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] h-14">Boards</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] h-14">Visibility</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] h-14">Last Active</TableHead>
                <TableHead className="text-right font-black uppercase tracking-widest text-[10px] h-14 px-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspaces.filter(ws => ws.name.toLowerCase().includes(searchTerm.toLowerCase())).map((ws) => (
                <TableRow key={ws.workspaceId} className="group hover:bg-primary/5 transition-colors border-border/50">
                   <TableCell className="px-8 py-6">
                    <div 
                      onClick={() => navigate(`/workspaces/${ws.workspaceId}`)}
                      className="flex items-center gap-4 cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                        <Layers size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-black text-lg capitalize group-hover:text-primary transition-colors">{ws.name}</div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/workspaces/${ws.workspaceId}?edit=true`);
                            }}
                            className="p-1 rounded-md hover:bg-primary/10 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Pencil size={12} className="text-muted-foreground/30" />
                          </button>
                        </div>
                        <div className="text-xs font-medium text-muted-foreground line-clamp-1">{ws.description || "No description provided."}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-background/50 font-bold border-border/50">{boardsByWorkspace[ws.workspaceId]?.length || 0} active</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {ws.visibility === 'PRIVATE' ? <Lock size={14} className="text-muted-foreground" /> : <Globe size={14} className="text-primary" />}
                      <span className="text-xs font-black uppercase tracking-tighter">{ws.visibility}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar size={14} />
                      <span className="text-xs font-medium">May 12, 2026</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-8">
                    <Button asChild variant="outline" size="sm" className="rounded-xl font-bold group-hover:border-primary group-hover:text-primary">
                      <Link to={`/workspaces/${ws.workspaceId}`}>View Details</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.filter(ws => ws.name.toLowerCase().includes(searchTerm.toLowerCase())).map((ws) => (
            <motion.div
              key={ws.workspaceId}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="flex flex-col h-full hover:border-primary/50 transition-all group rounded-[2rem] overflow-hidden shadow-xl hover:shadow-primary/5 border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-2 pt-6 px-6">
                  <div className="flex justify-between items-start">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-inner border border-primary/20">
                      <Layers size={22} />
                    </div>
                    <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase bg-background/50">{ws.visibility}</Badge>
                  </div>
                  <CardTitle className="text-xl mt-4 font-black capitalize group-hover:text-primary transition-colors flex items-center justify-between">
                    {ws.name}
                    <Link 
                      to={`/workspaces/${ws.workspaceId}?edit=true`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-md hover:bg-primary/10 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Pencil size={12} className="text-muted-foreground/30" />
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[32px] font-medium text-xs leading-relaxed mt-1">
                    {ws.description || 'Manage projects, track progress, and collaborate in real-time with your specialized team.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 pb-2 px-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border/50 pb-1">
                      <span>Featured Boards</span>
                      <span className="text-primary">{boardsByWorkspace[ws.workspaceId]?.length || 0} total</span>
                    </div>

                    <div className="space-y-3">
                      {boardsByWorkspace[ws.workspaceId]?.slice(0, 3).map(board => (
                        <Link
                          key={board.boardId}
                          to={`/boards/${board.boardId}`}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-primary/5 transition-all border border-transparent hover:border-primary/10 group/board"
                        >
                          <div className="p-1 rounded-md bg-muted/50 group-hover/board:bg-primary/10 group-hover/board:text-primary transition-colors">
                            <FolderKanban size={12} />
                          </div>
                          <span className="text-xs font-bold text-foreground/80 group-hover/board:text-primary transition-colors">{board.name}</span>
                          <ArrowRight size={12} className="ml-auto opacity-0 -translate-x-2 group-hover/board:opacity-100 group-hover/board:translate-x-0 transition-all text-primary" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-6 pt-2">
                  <Button asChild variant="outline" className="w-full h-10 gap-2 rounded-xl font-black uppercase tracking-widest text-[10px] group-hover:border-primary group-hover:text-primary transition-all shadow-sm">
                    <Link to={`/workspaces/${ws.workspaceId}`}>
                      Enter Workspace <ArrowRight size={14} />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}

          {/* Add Workspace Card */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button
              onClick={() => setShowWsForm(true)}
              className="w-full h-full min-h-[360px] flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-border/50 bg-muted/10 hover:bg-primary/5 hover:border-primary/30 group transition-all duration-500"
            >
              <div className="w-20 h-20 rounded-3xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground/50 group-hover:border-primary group-hover:text-primary group-hover:rotate-90 transition-all duration-500 shadow-inner bg-background/50">
                <Plus size={32} />
              </div>
              <div className="text-center mt-6">
                <p className="text-lg font-black text-foreground/60 group-hover:text-primary transition-colors">Initialize New Sector</p>
                <p className="text-xs font-bold text-muted-foreground/50 mt-1 uppercase tracking-widest">Expansion Required</p>
              </div>
            </button>
          </motion.div>
        </div>
      )}

      {/* Creation Modal - Shadcn Style */}
      <Dialog open={showWsForm} onOpenChange={setShowWsForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>
              Initialize a new collaborative environment. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateWorkspace} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={wsDraft.name}
                onChange={e => setWsDraft(d => ({ ...d, name: e.target.value }))}
                placeholder="e.g. Engineering Team"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={wsDraft.description}
                onChange={e => setWsDraft(d => ({ ...d, description: e.target.value }))}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="Briefly describe the purpose of this workspace..."
              />
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'PRIVATE', label: 'Private', icon: Lock },
                  { id: 'TEAM', label: 'Team', icon: Users },
                  { id: 'PUBLIC', label: 'Public', icon: Globe }
                ].map(v => (
                  <Button
                    key={v.id}
                    type="button"
                    variant={wsDraft.visibility === v.id ? 'default' : 'outline'}
                    onClick={() => setWsDraft(d => ({ ...d, visibility: v.id }))}
                    className="flex flex-col gap-2 h-auto py-3 px-2"
                  >
                    <v.icon size={16} />
                    <span className="text-xs">{v.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowWsForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Workspace'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
