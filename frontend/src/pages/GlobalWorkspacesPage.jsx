import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  Globe,
  Layers,
  Search as SearchIcon,
  LoaderCircle,
  Lock,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { workspaceApi } from "../api/services";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GridIcon, Table01Icon } from "hugeicons-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function GlobalWorkspacesPage() {
  const user = useSelector((s) => s.auth.user);
  const token = useSelector((s) => s.auth.token);
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [selectedWs, setSelectedWs] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const wsList = await workspaceApi.publicWorkspaces();
      setWorkspaces(wsList);
    } catch (err) {
      console.error("Failed to fetch public workspaces:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleWorkspaceClick = (workspaceId) => {
    if (!token) {
      setSelectedWs(workspaceId);
      setShowPrompt(true);
    } else {
      navigate(`/workspaces/${workspaceId}`);
    }
  };

  const filteredWorkspaces = workspaces.filter(ws =>
    ws.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell>
      {/* Action Header */}
      <div className="flex flex-col gap-10 mb-8">
        <div className="flex items-center justify-between w-full">
          <div className="relative">
            <h2 className="text-6xl font-black tracking-tighter text-foreground drop-shadow-sm">
              Global Workspaces<span className="text-[#6C75BD] ml-1 opacity-70">.</span>
            </h2>
            <p className="text-sm font-medium text-muted-foreground mt-2">Explore public workspaces across the sector.</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 w-full">
          {/* Search Pill */}
          <div className="flex items-center px-8 h-14 rounded-full bg-card/30 backdrop-blur-2xl border border-white/5 shadow-2xl ring-1 ring-white/5 flex-1 max-w-md group transition-all focus-within:border-primary/40 focus-within:ring-primary/10">
            <SearchIcon className="h-5 w-5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by workspace name..."
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

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <LoaderCircle size={40} className="animate-spin text-primary opacity-20" />
          <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Synchronizing Data...</p>
        </div>
      ) : filteredWorkspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 rounded-3xl bg-muted/5 border-2 border-dashed border-border/50">
          <Globe size={40} className="text-muted-foreground/50 mb-4" />
          <p className="text-lg font-black text-foreground/60">No public workspaces discovered.</p>
          <p className="text-sm font-medium text-muted-foreground mt-1">Check back later or create your own.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredWorkspaces.map((ws) => (
            <div key={ws.workspaceId} onClick={() => handleWorkspaceClick(ws.workspaceId)} className="group relative block cursor-pointer">
              <Card
                className="flex flex-col h-60 transition-all duration-500 rounded-[2rem] overflow-hidden border border-border bg-card hover:border-foreground/20 hover:shadow-2xl shadow-inner"
              >
                <CardHeader className="pb-2 pt-7 px-7">
                  <div className="flex justify-between items-start">
                    <div className="w-9 h-9 rounded-xl bg-foreground/5 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:border-foreground/20 transition-all duration-700 border border-border shadow-inner">
                      <Layers size={14} />
                    </div>
                    <div className="px-3 py-1 rounded-full bg-[#CDD9B2] text-[#606653]">
                      <span className="text-[8px] font-black uppercase tracking-widest">PUBLIC</span>
                    </div>
                  </div>
                  <CardTitle className="mt-6 text-xl font-black tracking-tight group-hover:text-primary transition-colors line-clamp-1">{ws.name}</CardTitle>
                  <CardDescription className="text-xs font-medium text-muted-foreground/60 line-clamp-1 mt-1 lowercase">{ws.description || "Sector awaiting mission parameters."}</CardDescription>
                </CardHeader>
                <CardContent className="px-7 mt-auto pb-7">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-1 h-1 rounded-full animate-pulse bg-[#CDD9B2]" />
                      <span className="text-xs font-medium text-muted-foreground/60">Public Sector</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[2.5rem] border border-border bg-card overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-border h-16">
                <TableHead className="w-[50%] font-black text-[13px] text-muted-foreground px-10">Workspace Identity</TableHead>
                <TableHead className="w-[30%] font-black text-[13px] text-muted-foreground">Protocol Mode</TableHead>
                <TableHead className="w-[20%] text-right font-black text-[13px] text-muted-foreground px-10">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkspaces.map((ws) => (
                <TableRow key={ws.workspaceId} className="group hover:bg-muted/50 transition-colors border-border h-20 cursor-pointer" onClick={() => handleWorkspaceClick(ws.workspaceId)}>
                  <TableCell className="p-0">
                    <div className="flex items-center gap-5 w-full h-full px-10">
                      <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center text-muted-foreground border border-border group-hover:text-foreground group-hover:border-foreground/20 transition-all duration-500 shadow-inner">
                        <Layers size={12} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-black text-xl tracking-tight group-hover:text-primary transition-colors">{ws.name}</div>
                        </div>
                        <div className="text-xs font-medium text-muted-foreground/60 line-clamp-1 mt-1 lowercase">{ws.description || "Sector awaiting mission parameters."}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#CDD9B2] border-none text-[#606653]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#606653]" />
                      <span className="text-[9px] font-black uppercase tracking-tight">PUBLIC</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-10">
                    <Button variant="ghost" size="sm" className="font-bold">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Prompt Modal */}
      <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
            <DialogDescription>
              You must be logged in to interact with workspaces and view their detailed content.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => {
              setShowPrompt(false);
              navigate(`/workspaces/${selectedWs}`);
            }}>
              Continue as Guest
            </Button>
            <Button onClick={() => navigate("/login")}>
              Log In / Sign Up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
