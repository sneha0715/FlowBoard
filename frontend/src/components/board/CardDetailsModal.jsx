import { useEffect, useState } from "react";
import {
  Archive,
  Calendar,
  CheckSquare,
  MessageCircle,
  Paperclip,
  Tag,
  Trash2,
  User,
  X,
  Reply,
  Edit2,
  FilePlus,
  FileText,
  Clock,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Hash,
  Send,
  LoaderCircle,
  Layout as LayoutIcon,
  Palette,
  Plus
} from "lucide-react";
import { attachmentApi, cardApi, checklistApi, commentApi, labelApi, notificationApi } from "../../api/services";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUS_OPTIONS = ["TO_DO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

const PRIORITY_CONFIG = {
  LOW: { label: "Low", variant: "outline", class: "border-stone-500/20 text-stone-500 bg-stone-500/5" },
  MEDIUM: { label: "Medium", variant: "outline", class: "border-blue-500/20 text-blue-500 bg-blue-500/5" },
  HIGH: { label: "High", variant: "outline", class: "border-orange-500/20 text-orange-500 bg-orange-500/5" },
  CRITICAL: { label: "Critical", variant: "destructive", class: "" },
};

const LABEL_PRESETS = [
  { name: "Bug", color: "#ef4444" },
  { name: "Feature", color: "#3b82f6" },
  { name: "Improvement", color: "#10b981" },
  { name: "Documentation", color: "#f59e0b" },
  { name: "Design", color: "#8b5cf6" },
  { name: "Urgent", color: "#f43f5e" },
];

export default function CardDetailsModal({ boardId, card, boardMembers, currentUser, open, onClose, onRefresh, readOnly }) {
  const [activeTab, setActiveTab] = useState("details");
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  // Comments
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Checklists
  const [checklists, setChecklists] = useState([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newItems, setNewItems] = useState({});

  // Labels
  const [cardLabels, setCardLabels] = useState([]);
  const [boardLabels, setBoardLabels] = useState([]);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");

  useEffect(() => {
    if (!card) return;
    setDraft({
      title: card.title,
      description: card.description || "",
      priority: card.priority || "MEDIUM",
      status: card.status || "TO_DO",
      dueDate: card.dueDate ? card.dueDate.split("T")[0] : "",
      startDate: card.startDate ? card.startDate.split("T")[0] : "",
      assigneeId: card.assigneeId ? String(card.assigneeId) : "",
      coverColor: card.coverColor || "#3b82f6",
    });
    setActiveTab("details");
    loadComments();
    loadChecklists();
    loadLabels();
    loadAttachments();
  }, [card?.cardId]);

  if (!card) return null;

  const loadComments = async () => {
    const data = await commentApi.byCard(card.cardId).catch(() => []);
    setComments(Array.isArray(data) ? data : []);
  };

  const loadChecklists = async () => {
    const data = await checklistApi.byCard(card.cardId).catch(() => []);
    setChecklists(Array.isArray(data) ? data : []);
  };

  const loadLabels = async () => {
    const [cardL, boardL] = await Promise.all([
      labelApi.byCard(card.cardId).catch(() => []),
      labelApi.byBoard(boardId).catch(() => []),
    ]);
    setCardLabels(Array.isArray(cardL) ? cardL : []);
    setBoardLabels(Array.isArray(boardL) ? boardL : []);
  };
  
  const loadAttachments = async () => {
    const data = await attachmentApi.byCard(card.cardId).catch(() => []);
    setAttachments(Array.isArray(data) ? data : []);
  };

  const saveCard = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await cardApi.update(card.cardId, {
        ...draft,
        assigneeId: draft.assigneeId ? Number(draft.assigneeId) : null,
        listId: card.listId,
        boardId: card.boardId,
      });

      if (draft.assigneeId && Number(draft.assigneeId) !== Number(currentUser?.userId)) {
        await notificationApi.send({
          recipientId: Number(draft.assigneeId),
          actorId: Number(currentUser?.userId),
          type: "ASSIGNMENT",
          title: `Assigned to card: ${draft.title}`,
          message: `${currentUser?.fullName || currentUser?.email} assigned you to "${draft.title}".`,
          relatedId: card.cardId,
          relatedType: "CARD",
        }).catch(() => {});
      }
      onRefresh();
    } catch {
      // silent
    } finally { setSaving(false); }
  };

  const archiveCard = async () => {
    await cardApi.archive(card.cardId).catch(() => {});
    onRefresh();
    onClose();
  };

  const deleteCard = async () => {
    await cardApi.remove(card.cardId).catch(() => {});
    onRefresh();
    onClose();
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      await commentApi.create({ 
        cardId: card.cardId, 
        authorId: Number(currentUser?.userId), 
        content: commentText,
        parentId: replyingTo?.commentId 
      });
      setCommentText("");
      setReplyingTo(null);
      await loadComments();
    } finally { setCommentSubmitting(false); }
  };

  const deleteComment = async (commentId) => {
    await commentApi.remove(commentId).catch(() => {});
    await loadComments();
  };
  
  const handleEditComment = async (e) => {
    e.preventDefault();
    if (!editCommentText.trim()) return;
    await commentApi.update(editingComment.commentId, { content: editCommentText });
    setEditingComment(null);
    setEditCommentText("");
    await loadComments();
  };
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const mockUrl = URL.createObjectURL(file);
      await attachmentApi.create({
        cardId: card.cardId,
        fileName: file.name,
        fileUrl: mockUrl,
        fileType: file.type,
        sizeKb: Math.round(file.size / 1024)
      });
      await loadAttachments();
    } finally { setUploading(false); }
  };
  
  const deleteAttachment = async (id) => {
    await attachmentApi.remove(id).catch(() => {});
    await loadAttachments();
  };

  const addChecklist = async (e) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;
    await checklistApi.create({ cardId: card.cardId, title: newChecklistTitle, position: checklists.length });
    setNewChecklistTitle("");
    await loadChecklists();
  };

  const addChecklistItem = async (checklistId, e) => {
    e.preventDefault();
    const text = newItems[checklistId];
    if (!text?.trim()) return;
    await checklistApi.addItem(checklistId, { title: text, completed: false });
    setNewItems((prev) => ({ ...prev, [checklistId]: "" }));
    await loadChecklists();
  };

  const toggleItem = async (itemId) => {
    await checklistApi.toggleItem(itemId).catch(() => {});
    await loadChecklists();
  };

  const assignLabel = async (labelId) => {
    await labelApi.assignToCard(card.cardId, labelId).catch(() => {});
    await loadLabels();
  };

  const removeLabel = async (labelId) => {
    await labelApi.removeFromCard(card.cardId, labelId).catch(() => {});
    await loadLabels();
  };

  const createAndAssignLabel = async (e) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    try {
      const newLabel = await labelApi.create({ boardId, name: newLabelName.trim(), color: newLabelColor });
      await labelApi.assignToCard(card.cardId, newLabel.labelId || newLabel.id);
      setNewLabelName("");
      await loadLabels();
    } catch {}
  };

  const totalItems = checklists.flatMap((cl) => cl.items || []).length;
  const doneItems = checklists.flatMap((cl) => cl.items || []).filter((it) => it.completed || it.isCompleted).length;
  const checkProgress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  const assignedLabelIds = new Set(cardLabels.map((l) => l.labelId || l.id));

  const isOverdue = draft?.dueDate && draft.status !== "DONE" && new Date(draft.dueDate) < new Date();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background border-none shadow-2xl">
        {/* Cover Strip */}
        <div className="h-4 w-full" style={{ background: draft?.coverColor || "var(--primary)" }} />

        <div className="p-8 space-y-8">
          {/* Header Area */}
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Hash size={16} />
                  </div>
                  <input
                    value={draft?.title || ""}
                    onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))}
                    className="text-2xl font-black tracking-tight bg-transparent border-none outline-none focus:ring-0 w-full uppercase"
                    readOnly={readOnly}
                    placeholder="Task Title"
                  />
                </div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest ml-11">
                  In list <span className="text-foreground">{card.listName || "Backlog"}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!readOnly && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical size={18} /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-amber-500 gap-2" onClick={archiveCard}>
                        <Archive size={14} /> Archive Card
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive gap-2" onClick={deleteCard}>
                        <Trash2 size={14} /> Delete Permanently
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={onClose}><X size={18} /></Button>
              </div>
            </div>

            {/* Quick Badges */}
            <div className="flex flex-wrap gap-3 ml-11">
              <Badge variant={PRIORITY_CONFIG[draft?.priority]?.variant || "outline"} className={`uppercase text-[10px] font-black tracking-widest h-6 px-2 ${PRIORITY_CONFIG[draft?.priority]?.class}`}>
                {draft?.priority} PRIORITY
              </Badge>
              <Badge variant="outline" className="uppercase text-[10px] font-black tracking-widest h-6 px-2 border-border/50 bg-muted/30">
                {draft?.status?.replace("_", " ")}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="uppercase text-[10px] font-black tracking-widest h-6 px-2 animate-pulse">
                  OVERDUE
                </Badge>
              )}
            </div>
          </div>

          {/* Main Tabs Layout */}
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-muted/50 h-12 p-1 mb-8 w-full justify-start overflow-x-auto overflow-y-hidden no-scrollbar">
              <TabsTrigger value="details" className="px-5 h-10 gap-2"><User size={14} /> Details</TabsTrigger>
              <TabsTrigger value="checklist" className="px-5 h-10 gap-2">
                <CheckSquare size={14} /> Checklist 
                {totalItems > 0 && <span className="ml-1 opacity-50">{doneItems}/{totalItems}</span>}
              </TabsTrigger>
              <TabsTrigger value="comments" className="px-5 h-10 gap-2">
                <MessageCircle size={14} /> Comments 
                {comments.length > 0 && <span className="ml-1 opacity-50">{comments.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="attachments" className="px-5 h-10 gap-2">
                <Paperclip size={14} /> Files
                {attachments.length > 0 && <span className="ml-1 opacity-50">{attachments.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="labels" className="px-5 h-10 gap-2">
                <Tag size={14} /> Labels
              </TabsTrigger>
            </TabsList>

            <div className="min-h-[400px] max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <TabsContent value="details" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                <form onSubmit={saveCard} className="space-y-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Context / Description</Label>
                    <textarea
                      value={draft?.description}
                      onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
                      className="flex min-h-[160px] w-full rounded-2xl border border-border/50 bg-muted/20 px-6 py-4 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none font-medium leading-relaxed"
                      placeholder="Specify the goals, requirements, and context for this task..."
                      readOnly={readOnly}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Assignee</Label>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border-2 border-background">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${draft?.assigneeId}`} />
                          <AvatarFallback><User size={18} /></AvatarFallback>
                        </Avatar>
                        <select 
                          value={draft?.assigneeId} 
                          onChange={(e) => setDraft(d => ({ ...d, assigneeId: e.target.value }))} 
                          className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={readOnly}
                        >
                          <option value="">Unassigned</option>
                          {boardMembers.map(m => (
                            <option key={m.userId} value={m.userId}>User #{m.userId} ({m.role})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Schedule</Label>
                      <div className="flex gap-4">
                        <div className="relative flex-1">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="date" 
                            className="pl-9 h-11 rounded-xl pr-9" 
                            value={draft?.dueDate} 
                            onChange={e => setDraft(d => ({ ...d, dueDate: e.target.value }))}
                            readOnly={readOnly}
                          />
                          {draft?.dueDate && !readOnly && (
                            <button 
                              type="button"
                              onClick={() => setDraft(d => ({ ...d, dueDate: "" }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <X size={14} strokeWidth={3} />
                            </button>
                          )}
                        </div>
                        <div className="relative flex-1">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Badge 
                            variant="outline" 
                            className={`h-11 rounded-xl w-full flex items-center justify-center border-dashed transition-all ${draft?.dueDate && !readOnly ? 'cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30' : ''}`}
                            onClick={() => !readOnly && draft?.dueDate && setDraft(d => ({ ...d, dueDate: "" }))}
                          >
                             {draft?.dueDate ? "Clear Due Date" : "No Due Date"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Task Priority</Label>
                      <div className="flex gap-2">
                        {PRIORITY_OPTIONS.map(p => (
                          <Button 
                            key={p}
                            type="button"
                            variant={draft?.priority === p ? "default" : "outline"}
                            className="flex-1 h-11 rounded-xl text-[10px] font-black"
                            onClick={() => setDraft(d => ({ ...d, priority: p }))}
                            disabled={readOnly}
                          >
                            {p}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Theme Color</Label>
                      <div className="flex gap-3">
                        <div className="w-11 h-11 rounded-xl border flex items-center justify-center overflow-hidden shrink-0">
                          <input 
                            type="color" 
                            className="w-16 h-16 cursor-pointer scale-150"
                            value={draft?.coverColor}
                            onChange={e => setDraft(d => ({ ...d, coverColor: e.target.value }))}
                          />
                        </div>
                        <Input 
                          value={draft?.coverColor} 
                          onChange={e => setDraft(d => ({ ...d, coverColor: e.target.value }))}
                          className="h-11 rounded-xl uppercase font-mono"
                          readOnly={readOnly}
                        />
                      </div>
                    </div>
                  </div>

                  {!readOnly && (
                    <Button type="submit" className="w-full h-12 rounded-xl font-bold gap-2 shadow-xl" disabled={saving}>
                      {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 size={18} />}
                      Update Registry
                    </Button>
                  )}
                </form>
              </TabsContent>

              <TabsContent value="checklist" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-8">
                  {totalItems > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Master Progress</h4>
                         <span className="text-sm font-black text-primary">{checkProgress}%</span>
                      </div>
                      <Progress value={checkProgress} className="h-2 bg-muted rounded-full overflow-hidden" />
                    </div>
                  )}

                  <div className="space-y-6">
                    {checklists.map(cl => (
                      <Card key={cl.checklistId} className="border-none bg-muted/20 rounded-[24px] overflow-hidden">
                        <CardHeader className="pb-4 pt-6 px-6 bg-muted/40 flex flex-row items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-primary shadow-sm">
                               <CheckSquare size={16} />
                            </div>
                            <CardTitle className="text-sm font-bold">{cl.title}</CardTitle>
                          </div>
                          <Badge variant="secondary" className="text-[10px] font-black">{cl.items?.length || 0} ITEMS</Badge>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          <div className="space-y-3">
                            {cl.items?.map(item => (
                              <div key={item.checklistItemId} className="flex items-center gap-4 group">
                                <button 
                                  onClick={() => !readOnly && toggleItem(item.checklistItemId)}
                                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-primary border-primary text-primary-foreground' : 'border-border/60 hover:border-primary/50'}`}
                                >
                                  {item.completed && <X size={14} strokeWidth={4} />}
                                </button>
                                <span className={`text-sm font-medium transition-all ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                  {item.title}
                                </span>
                              </div>
                            ))}
                          </div>
                          {!readOnly && (
                            <form onSubmit={e => addChecklistItem(cl.checklistId, e)} className="flex gap-2 pt-2">
                              <Input 
                                placeholder="Add checkpoint..." 
                                className="h-10 rounded-xl bg-background border-none shadow-sm"
                                value={newItems[cl.checklistId] || ""}
                                onChange={e => setNewItems(prev => ({ ...prev, [cl.checklistId]: e.target.value }))}
                              />
                              <Button type="submit" size="sm" className="rounded-xl h-10 px-4">Establish</Button>
                            </form>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {!readOnly && (
                    <form onSubmit={addChecklist} className="flex gap-4 p-6 border-2 border-dashed rounded-[24px] border-border/50 hover:border-primary/30 transition-colors bg-muted/5 group">
                      <Input 
                        placeholder="New Checklist Segment..." 
                        className="h-12 rounded-xl bg-background border-none shadow-sm"
                        value={newChecklistTitle}
                        onChange={e => setNewChecklistTitle(e.target.value)}
                      />
                      <Button type="submit" className="h-12 rounded-xl gap-2 px-6">
                        <Plus size={16} /> New List
                      </Button>
                    </form>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="comments" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-8">
                  {!readOnly && (
                    <Card className="rounded-[24px] border-none shadow-xl bg-muted/20">
                      <CardContent className="p-6">
                        <form onSubmit={submitComment} className="space-y-4">
                          {replyingTo && (
                            <Badge variant="secondary" className="gap-2 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-primary">
                              <Reply size={12} /> Replying to User #{replyingTo.authorId}
                              <button type="button" onClick={() => setReplyingTo(null)} className="ml-2 hover:text-foreground"><X size={12} /></button>
                            </Badge>
                          )}
                          <textarea 
                            className="flex min-h-[100px] w-full rounded-xl border border-transparent bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none font-medium"
                            placeholder="Add your contribution to the discussion..."
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                          />
                          <div className="flex justify-end">
                            <Button type="submit" disabled={commentSubmitting || !commentText.trim()} className="rounded-xl gap-2 px-6">
                              {commentSubmitting ? <LoaderCircle className="animate-spin" /> : <Send size={16} />}
                              Transmit
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-6">
                    {comments.filter(c => !c.parentId).map(c => (
                      <div key={c.commentId} className="flex flex-col gap-4">
                        <div className="flex gap-4 group">
                          <Avatar className="h-10 w-10 shrink-0 border-2 border-background shadow-md">
                             <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.authorId}`} />
                             <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black uppercase">User #{c.authorId}</span>
                                  <span className="text-[10px] font-bold text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setReplyingTo(c)}><Reply size={14} /></Button>
                                  {Number(c.authorId) === Number(currentUser?.userId) && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive" onClick={() => deleteComment(c.commentId)}><Trash2 size={14} /></Button>
                                  )}
                                </div>
                             </div>
                             <div className="p-4 rounded-[20px] rounded-tl-none bg-muted/30 border border-border/40 text-sm font-medium leading-relaxed">
                               {c.content}
                             </div>
                          </div>
                        </div>
                        
                        {/* Nested Replies */}
                        {comments.filter(r => Number(r.parentId) === Number(c.commentId)).map(r => (
                          <div key={r.commentId} className="ml-14 flex gap-4">
                            <Avatar className="h-8 w-8 shrink-0 border-2 border-background shadow-sm">
                               <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.authorId}`} />
                               <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                               <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-black uppercase">User #{r.authorId}</span>
                                  <span className="text-[9px] font-bold text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span>
                               </div>
                               <div className="p-3 rounded-[16px] rounded-tl-none bg-muted/10 border border-border/20 text-xs font-medium">
                                 {r.content}
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-8">
                  {!readOnly && (
                    <div className="relative group">
                       <input 
                         type="file" 
                         className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                         onChange={handleFileUpload}
                       />
                       <div className="h-40 rounded-[28px] border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 bg-muted/5 group-hover:bg-muted/10 group-hover:border-primary/30 transition-all">
                          <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center text-muted-foreground group-hover:scale-110 group-hover:text-primary transition-all shadow-sm">
                             <FilePlus size={24} />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold">{uploading ? 'Processing Signal...' : 'Deposit Assets'}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">PDF, PNG, JPG, DOCX (Max 10MB)</p>
                          </div>
                       </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attachments.map(at => (
                      <Card key={at.attachmentId} className="p-4 rounded-[20px] border-none bg-muted/20 group hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shadow-sm overflow-hidden">
                              {at.fileType?.includes('image') ? (
                                <img src={at.fileUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <FileText size={20} className="text-primary" />
                              )}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">{at.fileName}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{at.sizeKb} KB · {at.fileType?.split('/')[1]}</p>
                           </div>
                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" asChild>
                                <a href={at.fileUrl} target="_blank" rel="noreferrer"><Paperclip size={14} /></a>
                              </Button>
                              {!readOnly && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" onClick={() => deleteAttachment(at.attachmentId)}><Trash2 size={14} /></Button>
                              )}
                           </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="labels" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-10">
                  {/* Active Labels */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Assigned Markers</h4>
                    <div className="flex flex-wrap gap-2">
                       {cardLabels.map(l => (
                         <Badge 
                           key={l.labelId} 
                           className="h-8 px-4 rounded-full gap-2 text-[11px] font-black border-none shadow-md"
                           style={{ backgroundColor: `${l.color}22`, color: l.color, border: `1px solid ${l.color}44` }}
                         >
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                           {l.name}
                           {!readOnly && (
                             <button onClick={() => removeLabel(l.labelId)} className="hover:scale-125 transition-transform">
                               <X size={12} strokeWidth={4} />
                             </button>
                           )}
                         </Badge>
                       ))}
                       {cardLabels.length === 0 && <p className="text-sm text-muted-foreground italic pl-1">No markers assigned.</p>}
                    </div>
                  </div>

                  {/* Board Labels */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Board Registry</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                       {boardLabels.map(l => {
                         const assigned = assignedLabelIds.has(l.labelId);
                         return (
                           <Button
                             key={l.labelId}
                             variant="outline"
                             className={`h-10 justify-start px-4 rounded-xl gap-3 transition-all ${assigned ? 'border-primary bg-primary/5' : 'hover:border-primary/30'}`}
                             onClick={() => !readOnly && (assigned ? removeLabel(l.labelId) : assignLabel(l.labelId))}
                           >
                             <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                             <span className="text-[11px] font-bold uppercase truncate">{l.name}</span>
                             {assigned && <CheckCircle2 size={12} className="ml-auto text-primary" />}
                           </Button>
                         );
                       })}
                    </div>
                  </div>

                  {/* Create New */}
                  {!readOnly && (
                    <Card className="rounded-[24px] border-none bg-muted/20">
                       <CardHeader className="pb-2 pt-6 px-6">
                         <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Synthesize Marker</CardTitle>
                       </CardHeader>
                       <CardContent className="p-6 pt-0 space-y-6">
                          <div className="flex flex-wrap gap-2">
                             {LABEL_PRESETS.map(p => (
                               <button 
                                 key={p.name} 
                                 type="button"
                                 className="h-8 px-3 rounded-lg text-[10px] font-black uppercase transition-all hover:scale-105"
                                 style={{ backgroundColor: `${p.color}15`, color: p.color, border: `1px solid ${p.color}30` }}
                                 onClick={() => { setNewLabelName(p.name); setNewLabelColor(p.color); }}
                                >
                                 {p.name}
                               </button>
                             ))}
                          </div>
                          <form onSubmit={createAndAssignLabel} className="flex gap-4 items-end">
                             <div className="space-y-2 shrink-0">
                                <Label className="text-[9px] font-black uppercase ml-1">Hue</Label>
                                <div className="w-11 h-11 rounded-xl border flex items-center justify-center overflow-hidden">
                                  <input type="color" className="w-16 h-16 cursor-pointer scale-150" value={newLabelColor} onChange={e => setNewLabelColor(e.target.value)} />
                                </div>
                             </div>
                             <div className="space-y-2 flex-1">
                                <Label className="text-[9px] font-black uppercase ml-1">Designation</Label>
                                <Input 
                                  placeholder="New marker name..." 
                                  className="h-11 rounded-xl bg-background"
                                  value={newLabelName}
                                  onChange={e => setNewLabelName(e.target.value)}
                                />
                             </div>
                             <Button type="submit" className="h-11 rounded-xl px-6 gap-2">
                               <Plus size={16} /> Establish
                             </Button>
                          </form>
                       </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Footer actions */}
        {!readOnly && activeTab === "details" && (
           <div className="p-8 pt-0 border-t border-border/30 bg-muted/5 flex justify-end">
              <Button onClick={saveCard} disabled={saving} className="rounded-xl px-10 h-12 shadow-xl shadow-primary/20">
                {saving ? "Processing..." : "Commit All Changes"}
              </Button>
           </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
