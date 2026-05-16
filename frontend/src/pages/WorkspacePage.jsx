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
  TableProperties,
  LayoutGrid,
  List as ListIcon,
  Search as SearchIcon,
  Calendar,
  LoaderCircle,
  Pencil,
  Trash2,
  ChevronUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AppShell from "../components/layout/AppShell";
import { boardApi, workspaceApi, notificationApi } from "../api/services";

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
import { GridIcon, Table01Icon, Building01Icon, PencilEdit01Icon, Delete02Icon } from "hugeicons-react";

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
  const [editingWorkspace, setEditingWorkspace] = useState(null);

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
      
      // Try to send notification to workspace owner
      try {
        const wsData = await workspaceApi.get(wsId);
        if (wsData?.ownerId) {
          await notificationApi.send({
            recipientId: Number(wsData.ownerId),
            actorId: Number(user.userId),
            type: "SYSTEM",
            title: `Invite accepted: ${user.fullName || user.email}`,
            message: `${user.fullName || user.email} has joined the workspace ${wsData.name || "Workspace"}.`,
            relatedId: wsId,
            relatedType: "WORKSPACE",
          }).catch(() => {});
        }
      } catch (notifErr) {
        console.error("Failed to send accept notification:", notifErr);
      }

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

  const handleDeleteWorkspace = async (workspaceId) => {
    if (!window.confirm("Are you sure you want to delete this workspace?")) return;
    try {
      await workspaceApi.remove(workspaceId);
      refresh();
    } catch (err) {
      console.error("Failed to delete workspace:", err);
    }
  };

  const handleUpdateWorkspace = async (e) => {
    e.preventDefault();
    if (!editingWorkspace?.name.trim()) return;
    setSubmitting(true);
    try {
      await workspaceApi.update(editingWorkspace.workspaceId, {
        name: editingWorkspace.name,
        description: editingWorkspace.description,
        visibility: editingWorkspace.visibility
      });
      setEditingWorkspace(null);
      refresh();
    } catch (err) {
      console.error("Failed to update workspace:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      {/* Action Header */}
      <div className="flex flex-col gap-10 mb-8">
        <div className="flex items-center justify-between w-full">
          <div className="relative">
            <h2 className="text-6xl font-black tracking-tighter text-foreground drop-shadow-sm">Workspaces<span className="text-[#6C75BD] ml-1 opacity-70">.</span></h2>
          </div>

          <div className="flex items-center p-2.5 h-16 rounded-full bg-card/30 backdrop-blur-2xl border border-white/5 shadow-2xl ring-1 ring-white/5">
            <Button
              onClick={() => setShowWsForm(true)}
              className="h-11 px-8 rounded-full gap-3 bg-[#40456B] hover:bg-[#40456B]/90 text-white font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] active:scale-95 border-none shadow-[0_0_20px_rgba(64,69,107,0.2)]"
            >
              <Building01Icon size={18} />
              Create
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 w-full">
          {/* Search Pill */}
          <div className="flex items-center px-8 h-14 rounded-full bg-card/30 backdrop-blur-2xl border border-white/5 shadow-2xl ring-1 ring-white/5 flex-1 max-w-md group transition-all focus-within:border-primary/40 focus-within:ring-primary/10">
            <SearchIcon className="h-5 w-5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by workspace name, reference, or description..."
              className="bg-transparent border-none focus-visible:ring-0 text-sm font-medium placeholder:text-muted-foreground/20 w-full ml-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* View Toggle Pill */}
          <div className="flex items-center p-1 h-14 rounded-full bg-card/30 backdrop-blur-2xl border border-white/5 shadow-2xl ring-1 ring-white/5">
            <Tabs value={viewMode} onValueChange={setViewMode} className="bg-transparent">
              <TabsList className="bg-transparent h-12 gap-2 px-1">
                <TabsTrigger value="grid" className="rounded-full w-10 h-10 p-0 text-muted-foreground/40 data-[state=active]:bg-white/20 data-[state=active]:text-white hover:text-white transition-all duration-500 border border-transparent">
                  <GridIcon size={20} />
                </TabsTrigger>
                <TabsTrigger value="list" className="rounded-full w-10 h-10 p-0 text-muted-foreground/40 data-[state=active]:bg-white/20 data-[state=active]:text-white hover:text-white transition-all duration-500 border border-transparent">
                  <Table01Icon size={20} />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
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
                  <CardTitle className="text-base font-black">{invite.workspaceName || "Workspace Invite"}</CardTitle>
                  <CardDescription className="font-medium text-muted-foreground/80">You've been invited to join as <span className="text-amber-600 font-black">{invite.role}</span></CardDescription>
                </CardHeader>
                <CardFooter className="gap-3 pt-4">
                  <Button variant="ghost" size="sm" className="flex-1 font-bold hover:bg-red-500/10 hover:text-red-400" onClick={() => workspaceApi.leaveWorkspace(invite.workspaceId).then(refresh)}>Decline</Button>
                  <Button size="sm" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white border-none font-bold" onClick={() => handleAccept(invite.workspaceId)}>Accept & Join</Button>
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
        <div className="rounded-[2.5rem] border border-border bg-card overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-border h-16">
                <TableHead className="w-[40%] font-black text-[13px] text-muted-foreground px-10">Workspace Identity</TableHead>
                <TableHead className="w-[18%] font-black text-[13px] text-muted-foreground">Protocol Mode</TableHead>
                <TableHead className="w-[20%] font-black text-[13px] text-muted-foreground">Last Synchronized</TableHead>
                <TableHead className="w-[12%] font-black text-[13px] text-muted-foreground">Boards</TableHead>
                <TableHead className="w-[10%] text-right font-black text-[13px] text-muted-foreground px-10">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspaces.filter(ws => ws.name.toLowerCase().includes(searchTerm.toLowerCase())).map((ws) => (
                <TableRow key={ws.workspaceId} className="group hover:bg-muted/50 transition-colors border-border h-20">
                  <TableCell className="p-0">
                    <Link to={`/workspaces/${ws.workspaceId}`} className="flex items-center gap-5 w-full h-full px-10">
                      <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center text-muted-foreground border border-border group-hover:text-foreground group-hover:border-foreground/20 transition-all duration-500 shadow-inner">
                        <Layers size={12} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-black text-xl tracking-tight group-hover:text-primary transition-colors">{ws.name}</div>
                        </div>
                        <div className="text-xs font-medium text-muted-foreground/60 line-clamp-1 mt-1 lowercase">{ws.description || "Sector awaiting mission parameters."}</div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="p-0">
                    <Link to={`/workspaces/${ws.workspaceId}`} className="flex items-center w-full h-full">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${ws.visibility === 'PRIVATE'
                          ? 'bg-[#6C75BD] border-none text-black'
                          : 'bg-[#CDD9B2] border-none text-[#606653]'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${ws.visibility === 'PRIVATE' ? 'bg-black' : 'bg-[#606653]'
                          }`} />
                        <span className="text-[9px] font-black uppercase tracking-tight">{ws.visibility}</span>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="p-0">
                    <Link to={`/workspaces/${ws.workspaceId}`} className="flex items-center w-full h-full">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-white/[0.03] border border-white/5 flex items-center justify-center text-muted-foreground/30">
                          <Calendar size={10} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] font-black">15 May 2026</span>
                          <span className="text-[10px] font-bold text-muted-foreground/20 uppercase tracking-widest">09:15 PM</span>
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="p-0">
                    <Link to={`/workspaces/${ws.workspaceId}`} className="flex items-center w-full h-full">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-black text-primary tracking-tighter">+{boardsByWorkspace[ws.workspaceId]?.length || 0}</span>
                        <ChevronUp size={12} className="text-primary" strokeWidth={3} />
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right px-10">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all" onClick={(e) => { e.stopPropagation(); setEditingWorkspace(ws); }}>
                        <PencilEdit01Icon size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full bg-white/5 text-red-400/30 hover:text-red-400/70 hover:bg-red-500/10 transition-all" onClick={(e) => { e.stopPropagation(); handleDeleteWorkspace(ws.workspaceId); }}>
                        <Delete02Icon size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {workspaces.filter(ws => ws.name.toLowerCase().includes(searchTerm.toLowerCase())).map((ws) => (
            <Link key={ws.workspaceId} to={`/workspaces/${ws.workspaceId}`} className="group relative block">
              <Card
                className="flex flex-col h-60 cursor-pointer transition-all duration-500 rounded-[2rem] overflow-hidden border border-border bg-card hover:border-foreground/20 hover:shadow-2xl shadow-inner"
              >
                <CardHeader className="pb-2 pt-7 px-7">
                  <div className="flex justify-between items-start">
                    <div className="w-9 h-9 rounded-xl bg-foreground/5 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:border-foreground/20 transition-all duration-700 border border-border shadow-inner">
                      <Layers size={14} />
                    </div>
                    <div className={`px-3 py-1 rounded-full ${ws.visibility === 'PRIVATE'
                        ? 'bg-[#6C75BD] text-black'
                        : 'bg-[#CDD9B2] text-[#606653]'
                      }`}>
                      <span className="text-[8px] font-black uppercase tracking-widest">{ws.visibility}</span>
                    </div>
                  </div>
                  <CardTitle className="mt-6 text-xl font-black tracking-tight group-hover:text-primary transition-colors line-clamp-1">{ws.name}</CardTitle>
                  <CardDescription className="text-xs font-medium text-muted-foreground/60 line-clamp-1 mt-1 lowercase">{ws.description || "Sector awaiting mission parameters."}</CardDescription>
                </CardHeader>
                <CardContent className="px-7 mt-auto pb-7">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-1 h-1 rounded-full animate-pulse ${ws.visibility === 'PRIVATE' ? 'bg-[#6C75BD]' : 'bg-[#CDD9B2]'
                        }`} />
                      <span className="text-xs font-medium text-muted-foreground/60">{boardsByWorkspace[ws.workspaceId]?.length || 0} Boards</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

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
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'PRIVATE', label: 'Private', icon: Lock },
                  { id: 'PUBLIC', label: 'Public', icon: Globe }
                ].map(v => (
                  <Button
                    key={v.id}
                    type="button"
                    variant={wsDraft.visibility === v.id ? 'default' : 'outline'}
                    onClick={() => setWsDraft(d => ({ ...d, visibility: v.id }))}
                    className="flex items-center justify-center gap-2 h-9 py-0"
                  >
                    <v.icon size={14} />
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

      {/* Edit Modal */}
      <Dialog open={!!editingWorkspace} onOpenChange={() => setEditingWorkspace(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>
              Update your workspace details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {editingWorkspace && (
            <form onSubmit={handleUpdateWorkspace} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  required
                  value={editingWorkspace.name}
                  onChange={e => setEditingWorkspace(d => ({ ...d, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <textarea
                  id="edit-description"
                  value={editingWorkspace.description || ""}
                  onChange={e => setEditingWorkspace(d => ({ ...d, description: e.target.value }))}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'PRIVATE', label: 'Private', icon: Lock },
                    { id: 'PUBLIC', label: 'Public', icon: Globe }
                  ].map(v => (
                    <Button
                      key={v.id}
                      type="button"
                      variant={editingWorkspace.visibility === v.id ? 'default' : 'outline'}
                      onClick={() => setEditingWorkspace(d => ({ ...d, visibility: v.id }))}
                      className="flex items-center justify-center gap-2 h-9 py-0"
                    >
                      <v.icon size={14} />
                      <span className="text-xs">{v.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditingWorkspace(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
