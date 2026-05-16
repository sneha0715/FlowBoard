import { useEffect, useState } from "react";
import { Archive } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Trash2,
  Reply,
  Edit2,
  FilePlus,
  FileText,
  Clock,
  CheckCircle2,
  Send,
  LoaderCircle,
  Layout as LayoutIcon,
  Check,
  ArrowLeft,
  Info,
  Target,
  Zap,
  X,
  ShieldCheck,
  Layers
} from "lucide-react";
import { attachmentApi, cardApi, checklistApi, commentApi, labelApi, notificationApi, boardApi, authApi, workspaceApi } from "../api/services";
import { useSelector, useDispatch } from "react-redux";
import { setActiveCard } from "../store/slices/boardSlice";
import AppShell from "../components/layout/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function RegistryDetailsPage() {
  const { boardId, cardId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [card, setCard] = useState(null);
  const [boardMembers, setBoardMembers] = useState([]);
  const [memberProfiles, setMemberProfiles] = useState({});
  const [activeTab, setActiveTab] = useState("details");
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Comments
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Checklists
  const [checklists, setChecklists] = useState([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newItems, setNewItems] = useState({});
  const [editingChecklistId, setEditingChecklistId] = useState(null);
  const [editingChecklistTitle, setEditingChecklistTitle] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemText, setEditingItemText] = useState("");

  // Labels
  const [cardLabels, setCardLabels] = useState([]);
  const [boardLabels, setBoardLabels] = useState([]);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    if (cardId && boardId) {
      loadInitialData();
    }
    return () => {
      dispatch(setActiveCard(null));
    };
  }, [cardId, boardId, dispatch]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [cardData, boardData, allUsers] = await Promise.all([
        cardApi.get(Number(cardId)),
        boardApi.get(Number(boardId)),
        authApi.searchUsers("")
      ]);

      const wsMembers = await workspaceApi.members(boardData.workspaceId);

      setCard(cardData);
      dispatch(setActiveCard(cardData));
      // Set active board so breadcrumbs work
      dispatch({ type: "board/fetchBoardBundle/fulfilled", payload: { activeBoard: boardData, lists: [], cardsById: {}, cardsByListId: {}, userRole: "MEMBER" } });

      const profiles = {};
      allUsers.forEach(u => { profiles[u.userId] = u; });
      setMemberProfiles(profiles);

      setBoardMembers(wsMembers);
      setDraft({
        title: cardData.title,
        description: cardData.description || "",
        priority: cardData.priority || "MEDIUM",
        status: cardData.status || "TO_DO",
        dueDate: cardData.dueDate ? cardData.dueDate.split("T")[0] : "",
        startDate: cardData.startDate ? cardData.startDate.split("T")[0] : "",
        assigneeId: cardData.assigneeId ? String(cardData.assigneeId) : "",
        coverColor: cardData.coverColor || "#14b8a6",
      });
      loadAll(cardData.cardId);
    } catch (err) {
      console.error("Failed to load registry details:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAll = (id) => {
    const cid = id || card?.cardId;
    if (!cid) return;
    loadComments(cid);
    loadChecklists(cid);
    loadLabels(cid);
    loadAttachments(cid);
  };

  const loadComments = async (cid) => {
    const data = await commentApi.byCard(cid).catch(() => []);
    setComments(Array.isArray(data) ? data : []);
  };

  const loadChecklists = async (cid) => {
    const data = await checklistApi.byCard(cid).catch(() => []);
    setChecklists(Array.isArray(data) ? data : []);
  };

  const loadLabels = async (cid) => {
    const [cardL, boardL] = await Promise.all([
      labelApi.byCard(cid).catch(() => []),
      labelApi.byBoard(Number(boardId)).catch(() => []),
    ]);
    setCardLabels(Array.isArray(cardL) ? cardL : []);
    setBoardLabels(Array.isArray(boardL) ? boardL : []);
  };

  const loadAttachments = async (cid) => {
    const data = await attachmentApi.byCard(cid).catch(() => []);
    setAttachments(Array.isArray(data) ? data : []);
  };

  const saveCard = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await cardApi.update(card.cardId, {
        ...draft,
        assigneeId: draft.assigneeId ? Number(draft.assigneeId) : null,
        listId: card.listId,
        boardId: card.boardId,
      });
      loadInitialData();
    } catch {
    } finally { setSaving(false); }
  };

  const archiveCard = async () => {
    await cardApi.archive(card.cardId).catch(() => { });
    navigate(`/boards/${boardId}`);
  };

  const deleteCard = async () => {
    await cardApi.remove(card.cardId).catch(() => { });
    navigate(`/boards/${boardId}`);
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      await commentApi.create({
        cardId: card.cardId,
        authorId: Number(user?.userId),
        content: commentText,
        parentId: replyingTo?.commentId
      });
      setCommentText("");
      setReplyingTo(null);
      await loadComments(card.cardId);
    } finally { setCommentSubmitting(false); }
  };

  const deleteComment = async (commentId) => {
    await commentApi.remove(commentId).catch(() => { });
    await loadComments(card.cardId);
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
      await loadAttachments(card.cardId);
    } finally { setUploading(false); }
  };

  const deleteAttachment = async (id) => {
    await attachmentApi.remove(id).catch(() => { });
    await loadAttachments(card.cardId);
  };

  const addChecklist = async (e) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;
    try {
      await checklistApi.create({ cardId: parseInt(cardId), title: newChecklistTitle, position: checklists.length });
      setNewChecklistTitle("");
      await loadChecklists(parseInt(cardId));
    } catch (err) {
      console.error("Failed to create checklist:", err);
    }
  };

  const saveChecklistTitle = async (checklistId) => {
    if (!editingChecklistTitle.trim()) return;
    try {
      await checklistApi.update(checklistId, {
        title: editingChecklistTitle.trim(),
        cardId: card.cardId
      });
      setEditingChecklistId(null);
      await loadChecklists(card.cardId);
    } catch (err) {
      console.error("Failed to update checklist title:", err);
    }
  };

  const deleteChecklist = async (checklistId) => {
    try {
      await checklistApi.remove(checklistId);
      await loadChecklists(parseInt(cardId));
    } catch (err) {
      console.error("Failed to delete checklist:", err);
    }
  };

  const saveItemText = async (checklistId, itemId) => {
    if (!editingItemText.trim()) return;
    try {
      await checklistApi.updateItem(itemId, { text: editingItemText.trim(), cardId: parseInt(cardId) });
      setEditingItemId(null);
      await loadChecklists(parseInt(cardId));
    } catch (err) {
      console.error("Failed to update item text:", err);
    }
  };

  const deleteItem = async (checklistId, itemId) => {
    try {
      await checklistApi.removeItem(itemId);
      await loadChecklists(parseInt(cardId));
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const addChecklistItem = async (checklistId, e) => {
    if (e) e.preventDefault();
    const text = newItems[checklistId];
    if (!text?.trim()) return;

    try {
      await checklistApi.addItem(checklistId, {
        text: text.trim(),
        isCompleted: false,
        completed: false
      });
      setNewItems(prev => ({ ...prev, [checklistId]: "" }));
      await loadChecklists(card.cardId);
    } catch (err) {
      console.error("Failed to add checklist item:", err);
    }
  };

  const toggleItem = async (itemId) => {
    await checklistApi.toggleItem(itemId).catch(() => { });
    await loadChecklists(card.cardId);
  };

  const assignLabel = async (labelId) => {
    await labelApi.assignToCard(card.cardId, labelId).catch(() => { });
    await loadLabels(card.cardId);
  };

  const removeLabel = async (labelId) => {
    await labelApi.removeFromCard(card.cardId, labelId).catch(() => { });
    await loadLabels(card.cardId);
  };

  const createAndAssignLabel = async (e) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    try {
      const newLabel = await labelApi.create({ boardId: Number(boardId), name: newLabelName.trim(), color: newLabelColor });
      await labelApi.assignToCard(card.cardId, newLabel.labelId || newLabel.id);
      setNewLabelName("");
      await loadLabels(card.cardId);
    } catch { }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <LoaderCircle className="animate-spin text-primary" size={32} />
        </div>
      </AppShell>
    );
  }

  if (!card) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-4">
          <h2 className="text-xl font-black uppercase">Registry Not Found</h2>
          <Button onClick={() => navigate(`/boards/${boardId}`)}>Return to Board</Button>
        </div>
      </AppShell>
    );
  }

  const totalItems = checklists.flatMap((cl) => cl.items || []).length;
  const doneItems = checklists.flatMap((cl) => cl.items || []).filter((it) => it.completed || it.isCompleted).length;
  const checkProgress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  const assignedLabelIds = new Set(cardLabels.map((l) => l.labelId || l.id));
  const isOverdue = draft?.dueDate && draft.status !== "DONE" && new Date(draft.dueDate) < new Date();

  return (
    <AppShell>
      <div className="w-full min-h-[calc(100vh-120px)] relative flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-12">
          {/* Unified Header & Navigation Section */}
          <div className="grid grid-cols-3 items-center mb-8 sticky top-4 z-50">
            <div className="flex items-center gap-4">
              <input
                value={draft?.title}
                onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))}
                className="w-full bg-transparent border-none outline-none text-2xl font-black tracking-tighter hover:text-primary transition-colors focus:text-primary placeholder:text-white/5"
                placeholder="UNTITLED_TASK"
              />
            </div>

            <div className="flex justify-center">
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-[#0a0c10]/40 backdrop-blur-3xl border border-white/10 rounded-full p-1 shadow-[0_10px_30px_rgba(0,0,0,0.3)] ring-1 ring-white/5"
              >
                <TabsList className="bg-transparent h-7 gap-0.5 p-0">
                  {["details", "checklist", "comments", "files", "labels"].map(tab => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="data-[state=active]:bg-[#52525B] data-[state=active]:text-white rounded-full px-4 text-[8px] font-black uppercase tracking-[0.25em] transition-all h-full"
                    >
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </motion.div>
            </div>

            <div /> {/* Spacer for symmetry */}
          </div>

          <div className="flex flex-col relative">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="h-full"
                >
                  <TabsContent value="details" className="mt-0 space-y-6 outline-none flex-1 flex flex-col pb-16 pt-6 relative">


                    <div className="flex flex-row gap-6 flex-1">
                      {/* Left Column */}
                      <div className="flex-1 space-y-6">
                        <div className="flex flex-nowrap gap-x-6 gap-y-4 py-2">
                          <div className="space-y-1 min-w-[180px]">
                            <div className="flex items-center gap-3 text-muted-foreground/40">
                              <div className="p-1.5 rounded-lg bg-primary/5 text-primary">
                                <ShieldCheck size={12} />
                              </div>
                              <Label className="text-sm font-black">Execution Role</Label>
                            </div>
                            <div className="flex items-center gap-2 group">

                              <div className="flex-1 pl-9">
                                <select
                                  value={draft?.assigneeId}
                                  onChange={(e) => setDraft(d => ({ ...d, assigneeId: e.target.value }))}
                                  className="bg-transparent border-none outline-none text-base font-black w-full cursor-pointer appearance-none hover:text-primary transition-colors tracking-tight"
                                >
                                  <option value="">Unassigned</option>
                                  {boardMembers.map(m => {
                                    const profile = memberProfiles[m.userId];
                                    return (
                                      <option key={m.userId} value={m.userId}>
                                        {profile?.fullName || profile?.email || `User #${m.userId}`}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 min-w-[180px]">
                            <div className="flex items-center gap-3 text-muted-foreground/40">
                              <div className="p-1.5 rounded-lg bg-amber-500/5 text-amber-500">
                                <Clock size={12} />
                              </div>
                              <Label className="text-sm font-black">Target Timeline</Label>
                            </div>
                            <div className="flex items-center gap-2 group">

                              <div className="flex-1 pl-9">
                                <input
                                  type="date"
                                  className={`bg-transparent border-none outline-none text-base font-black w-full cursor-pointer transition-colors tracking-tight ${isOverdue ? 'text-red-500' : 'hover:text-amber-500'}`}
                                  value={draft?.dueDate}
                                  onChange={e => setDraft(d => ({ ...d, dueDate: e.target.value }))}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 py-2">
                          <div className="flex items-center gap-3 text-muted-foreground/40">
                            <div className="p-1.5 rounded-lg bg-indigo-500/5 text-indigo-500">
                              <Zap size={12} />
                            </div>
                            <Label className="text-sm font-black">Priority Level</Label>
                          </div>
                          <div className="inline-flex p-1 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-md">
                            {PRIORITY_OPTIONS.map(p => {
                              const isActive = draft?.priority === p;
                              const themes = {
                                LOW: "bg-blue-500/20 text-blue-400 border-blue-500/30",
                                MEDIUM: "bg-[#6C75BD]/20 text-[#6C75BD] border-[#6C75BD]/30",
                                HIGH: "bg-amber-500/20 text-amber-400 border-amber-500/30",
                                CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30"
                              };
                              return (
                                <button
                                  key={p}
                                  className={`px-6 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 border ${isActive ? `${themes[p]} scale-105` : 'bg-transparent border-transparent text-muted-foreground/30 hover:text-muted-foreground'}`}
                                  onClick={() => setDraft(d => ({ ...d, priority: p }))}
                                >
                                  {p}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right Column (Task Specifications) */}
                      <div className="flex-[1.5] space-y-2 flex flex-col pt-2">
                        <div className="flex items-center gap-4 text-muted-foreground/30">
                          <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                            <Info size={14} />
                          </div>
                          <span className="text-sm font-black text-white/60">Task Specifications</span>
                        </div>
                        <textarea
                          value={draft?.description}
                          onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
                          className="w-full h-full bg-white/[0.01] border border-white/5 rounded-xl p-3 text-sm font-medium leading-relaxed resize-none outline-none focus:border-primary/20 transition-all shadow-inner placeholder:text-muted-foreground/5 min-h-[250px]"
                          placeholder="Establish detailed technical parameters and strategic goals for this initiative..."
                        />
                      </div>
                    </div>


                  </TabsContent>

                  <TabsContent value="checklist" className="mt-0 space-y-12 outline-none">
                    {totalItems > 0 && (
                      <div className="relative overflow-hidden py-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-xl bg-[#6C75BD]/10 flex items-center justify-center text-[#6C75BD] shadow-inner">
                              <Target size={16} strokeWidth={2.5} />
                            </div>
                            <div>
                              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#6C75BD]">Operational Milestone</h4>
                              <p className="text-[10px] font-bold text-muted-foreground/20 uppercase tracking-widest mt-1 flex items-center gap-2">
                                <Zap size={12} className="text-[#6C75BD]/40" /> Initiative Progression
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-black tracking-tighter text-foreground">{checkProgress}%</span>
                          </div>
                        </div>

                        <div className="relative h-1 w-full bg-white/[0.03] rounded-full overflow-hidden ring-1 ring-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${checkProgress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="absolute top-0 left-0 h-full bg-[#6C75BD] shadow-[0_0_25px_rgba(108,117,189,0.4)] rounded-full"
                          />
                        </div>
                      </div>
                    )}
                    <div className="grid gap-3">
                      {checklists.map(cl => (
                        <div key={cl.checklistId} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-2 shadow-xl">
                          <div className="flex items-center justify-between mb-1">
                            {editingChecklistId === cl.checklistId ? (
                              <form onSubmit={(e) => { e.preventDefault(); saveChecklistTitle(cl.checklistId); }} className="flex items-center gap-2">
                                <Input
                                  value={editingChecklistTitle}
                                  onChange={(e) => setEditingChecklistTitle(e.target.value)}
                                  className="h-7 rounded-lg bg-white/5 border-none text-xs font-black px-2 w-auto"
                                  autoFocus
                                />
                                <Button type="submit" size="sm" className="h-7 rounded-lg px-2 text-xs bg-[#6C75BD] text-white hover:bg-[#6C75BD]/90">Save</Button>
                                <Button size="sm" variant="secondary" className="h-7 rounded-lg px-2 text-xs" onClick={() => setEditingChecklistId(null)}>Cancel</Button>
                                <Button type="button" variant="destructive" size="sm" className="h-7 rounded-lg px-2 text-xs" onClick={() => deleteChecklist(cl.checklistId)}>
                                  <Trash2 size={12} />
                                </Button>
                              </form>
                            ) : (
                              <div className="flex items-center gap-2 group flex-1">
                                <h4 className="text-xs font-black flex items-center gap-4">
                                  <div className="w-2 h-2 rounded-full bg-[#CDD9B2]" />
                                  {cl.title}
                                </h4>
                                <div className="flex items-center gap-1">
                                  <button
                                    className="p-1 text-muted-foreground/40 hover:text-primary transition-colors"
                                    onClick={() => {
                                      setEditingChecklistId(cl.checklistId);
                                      setEditingChecklistTitle(cl.title);
                                    }}
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                </div>
                              </div>
                            )}
                            <Badge variant="secondary" className="bg-white/5 text-[10px] font-black py-1 px-4 rounded-full">{cl.items?.length || 0} UNITS</Badge>
                          </div>
                          <div className="space-y-4">
                            {cl.items?.map(item => (
                              <div key={item.itemId} className="flex items-center gap-4 group">
                                <button
                                  onClick={() => toggleItem(item.itemId)}
                                  className={`group/unit flex items-center justify-center transition-all ${item.completed || item.isCompleted ? 'text-[#6C75BD]' : 'text-muted-foreground/30 hover:text-[#6C75BD]/50'}`}
                                >
                                  {item.completed || item.isCompleted ? (
                                    <CheckCircle2 size={20} className="fill-[#6C75BD]/10" />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-current transition-all group-hover/unit:scale-110" />
                                  )}
                                </button>
                                {editingItemId === item.itemId ? (
                                  <form onSubmit={(e) => { e.preventDefault(); saveItemText(cl.checklistId, item.itemId); }} className="flex items-center gap-2 flex-1">
                                    <input
                                      value={editingItemText}
                                      onChange={(e) => setEditingItemText(e.target.value)}
                                      className="h-8 rounded-lg bg-white/5 border !border-white/40 text-sm font-medium px-2 flex-1 focus:!border-white/60 focus:!outline-none transition-colors"
                                      autoFocus
                                    />
                                    <Button type="submit" size="sm" className="h-8 rounded-lg px-2 text-xs bg-[#6C75BD] text-white hover:bg-[#6C75BD]/90">Save</Button>
                                    <Button size="sm" variant="secondary" className="h-8 rounded-lg px-2 text-xs" onClick={() => setEditingItemId(null)}>Cancel</Button>
                                    <Button type="button" variant="destructive" size="sm" className="h-8 rounded-lg px-2 text-xs" onClick={() => deleteItem(cl.checklistId, item.itemId)}>
                                      <Trash2 size={12} />
                                    </Button>
                                  </form>
                                ) : (
                                  <div className="flex items-center justify-between flex-1">
                                    <span className={`text-sm font-bold transition-all ${item.completed || item.isCompleted ? 'text-muted-foreground/40 line-through' : 'text-foreground/80'}`}>
                                      {item.text}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        className="p-1 text-muted-foreground/40 hover:text-[#6C75BD] transition-colors"
                                        onClick={() => {
                                          setEditingItemId(item.itemId);
                                          setEditingItemText(item.text);
                                        }}
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <form onSubmit={e => addChecklistItem(cl.checklistId, e)} className="flex gap-2 pt-2">
                            <Input
                              placeholder="Add new operational unit..."
                              className="h-7 rounded-lg bg-white/5 border border-white/5 focus:border-white/20 text-xs font-medium px-3 shadow-inner focus-visible:ring-1 focus-visible:ring-white/30 transition-colors"
                              value={newItems[cl.checklistId] || ""}
                              onChange={e => setNewItems(prev => ({ ...prev, [cl.checklistId]: e.target.value }))}
                            />
                            <Button type="submit" className="rounded-lg h-7 px-4 text-[10px] font-black bg-[#6C75BD] text-white hover:bg-[#6C75BD]/90 transition-all">Add Unit</Button>
                          </form>
                        </div>
                      ))}

                      <form onSubmit={addChecklist} className="flex gap-2 p-2 border border-dashed border-white/5 rounded-xl hover:border-white/20 transition-all bg-white/[0.01] group">
                        <Input
                          placeholder="Establish new checklist segment..."
                          className="h-7 rounded-lg bg-transparent border-none text-xs font-black placeholder:text-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-white/30"
                          value={newChecklistTitle}
                          onChange={e => setNewChecklistTitle(e.target.value)}
                        />
                        <Button type="submit" variant="secondary" className="h-7 rounded-lg px-4 text-[10px] font-black bg-[#6C75BD] text-white hover:bg-[#6C75BD]/90 transition-all">Create Segment</Button>
                      </form>
                    </div>
                  </TabsContent>

                  <TabsContent value="comments" className="mt-0 space-y-10 outline-none">
                    <div className="space-y-6">
                      <textarea
                        className="w-full min-h-[80px] bg-white/[0.02] border border-white/5 rounded-xl p-3 text-xs font-medium resize-none outline-none focus:border-[#6C75BD]/30 transition-all shadow-inner"
                        placeholder="Signal your contribution to this initiative..."
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                      />
                      <div className="flex justify-end mt-2">
                        <Button onClick={submitComment} disabled={commentSubmitting || !commentText.trim()} className="rounded-lg h-8 px-6 text-[10px] font-black uppercase gap-2 shadow-xl bg-[#6C75BD] hover:bg-[#6C75BD]/90 text-white shadow-[#6C75BD]/20">
                          {commentSubmitting ? <LoaderCircle className="animate-spin" size={12} /> : <Send size={12} />}
                          Transmit Signal
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                      {comments.filter(c => !c.parentId).map(c => (
                        <div key={c.commentId} className="flex gap-3 group">
                          <Avatar className="h-8 w-8 ring-2 ring-white/10 shrink-0 shadow-lg">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${c.authorId}`} />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6C75BD]/80">User #{c.authorId}</span>
                              <span className="text-[8px] font-bold text-muted-foreground/30">{new Date(c.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="p-3 rounded-xl rounded-tl-none bg-white/[0.03] border border-white/5 text-xs font-medium leading-relaxed shadow-sm">
                              {c.content}
                            </div>
                            <div className="flex gap-4 px-2">
                              <button className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-[#6C75BD] transition-colors">Reply</button>
                              {Number(c.authorId) === Number(user?.userId) && (
                                <button onClick={() => deleteComment(c.commentId)} className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/40 hover:text-red-500 transition-colors">Terminate</button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="files" className="mt-0 space-y-4 outline-none">
                    <div className="relative group">
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileUpload} />
                      <div className="h-24 rounded-xl border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center gap-2 group-hover:bg-[#6C75BD]/5 group-hover:border-[#6C75BD]/20 transition-all">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#6C75BD]/10 transition-all">
                          <FilePlus size={16} className="text-muted-foreground/40 group-hover:text-[#6C75BD] transition-colors" />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Deposit Digital Assets</p>
                          <p className="text-[8px] font-bold text-muted-foreground/20 uppercase tracking-widest mt-0.5">Drag and drop or click to upload</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {attachments.map(at => (
                        <div key={at.attachmentId} className="p-2 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-3 group hover:bg-white/[0.04] hover:border-[#6C75BD]/20 transition-all shadow-lg">
                          <div className="w-8 h-8 rounded-lg bg-[#6C75BD]/10 flex items-center justify-center shrink-0 ring-1 ring-[#6C75BD]/20 shadow-lg shadow-[#6C75BD]/5">
                            <FileText size={16} className="text-[#6C75BD]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate pr-2 uppercase tracking-tight">{at.fileName}</p>
                            <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">{at.sizeKb} KB · {at.fileType?.split('/')[1]}</p>
                          </div>
                          <button onClick={() => deleteAttachment(at.attachmentId)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10 text-red-500/40 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="labels" className="mt-0 space-y-6 outline-none">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                        <div className="w-1 h-3 bg-[#6C75BD] rounded-full" />
                        Assigned Indicators
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {cardLabels.map(l => (
                          <Badge
                            key={l.labelId}
                            className="h-7 px-3 rounded-lg gap-2 text-[8px] font-black uppercase tracking-widest border-none shadow-lg"
                            style={{ backgroundColor: `${l.color}22`, color: l.color, border: `1px solid ${l.color}44` }}
                          >
                            <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_10px_currentcolor]" style={{ backgroundColor: l.color }} />
                            {l.name}
                            <X size={12} className="cursor-pointer hover:scale-125 transition-transform" onClick={() => removeLabel(l.labelId)} />
                          </Badge>
                        ))}
                        {cardLabels.length === 0 && (
                          <div className="w-full p-3 rounded-xl border border-dashed border-white/5 flex items-center justify-center">
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/20">No indicators assigned</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                        <div className="w-1 h-3 bg-[#6C75BD] rounded-full" />
                        Registry Catalog
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {boardLabels.map(l => {
                          const assigned = assignedLabelIds.has(l.labelId);
                          return (
                            <button
                              key={l.labelId}
                              className={`h-8 rounded-lg px-3 flex items-center justify-between text-[9px] font-black uppercase tracking-widest border transition-all ${assigned ? 'bg-[#6C75BD]/10 border-[#6C75BD] text-[#6C75BD] shadow-lg shadow-[#6C75BD]/10' : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/10'}`}
                              onClick={() => (assigned ? removeLabel(l.labelId) : assignLabel(l.labelId))}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                                {l.name}
                              </div>
                              {assigned && <CheckCircle2 size={16} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl space-y-4 shadow-inner">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Establish New Indicator</h4>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="space-y-1 flex-1">
                          <Label className="text-[8px] font-black uppercase tracking-widest ml-1 opacity-50">Designation</Label>
                          <Input
                            placeholder="New indicator name..."
                            className="h-8 rounded-lg bg-white/5 border-none text-xs font-medium px-3"
                            value={newLabelName}
                            onChange={e => setNewLabelName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] font-black uppercase tracking-widest ml-1 opacity-50">Hue Selection</Label>
                          <div className="w-8 h-8 rounded-lg border border-white/10 overflow-hidden ring-2 ring-white/5">
                            <input type="color" className="w-14 h-14 cursor-pointer scale-150" value={newLabelColor} onChange={e => setNewLabelColor(e.target.value)} />
                          </div>
                        </div>
                        <Button onClick={createAndAssignLabel} className="h-8 mt-auto rounded-lg px-4 text-[10px] font-black uppercase bg-[#6C75BD] hover:bg-[#6C75BD]/90 text-white shadow-lg shadow-[#6C75BD]/20">Create Indicator</Button>
                      </div>
                    </div>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Tabs>

        {/* Global Buttons at bottom right of the page */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 items-end z-50">
          <Button
            onClick={archiveCard}
            className="h-8 px-6 rounded-full font-black uppercase tracking-[0.2em] text-[9px] gap-2 bg-purple-500/[0.05] border border-purple-500/10 text-purple-500/70 hover:bg-purple-500/20 transition-all min-w-[160px] group/archive"
          >
            <Archive size={12} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
            Archive Task
          </Button>

          <Button
            onClick={deleteCard}
            className="h-8 px-6 rounded-full font-black uppercase tracking-[0.2em] text-[9px] gap-2 bg-rose-500/[0.05] border border-rose-500/10 text-rose-500/70 hover:bg-rose-500/20 transition-all min-w-[160px] group/terminate"
          >
            <Trash2 size={12} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
            Terminate Task
          </Button>

          <Button
            onClick={saveCard}
            disabled={saving}
            className="h-8 px-6 rounded-full font-black uppercase tracking-[0.25em] text-[9px] gap-2 bg-[#6C75BD]/70 hover:bg-[#6C75BD]/90 text-white/80 transition-all active:scale-95 group/save min-w-[160px] shadow-lg shadow-[#6C75BD]/10"
          >
            {saving ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <Check size={12} strokeWidth={2.5} className="group-hover:scale-125 transition-transform" />}
            Authorize Changes
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
