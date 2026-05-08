import http from "./http";

const unwrap = async (request) => {
  const response = await request;
  return response.data?.data;
};

export const authApi = {
  login: (payload) => unwrap(http.post("/auth/login", payload)),
  register: (payload) => unwrap(http.post("/auth/register", payload)),
  profile: () => unwrap(http.get("/auth/profile")),
  searchUsers: (query) => unwrap(http.get("/auth/users/search", { params: { query } })),
  deactivate: (userId) => unwrap(http.post(`/auth/deactivate/${userId}`)),
  updateProfile: (userId, payload) => unwrap(http.put(`/auth/profile/${userId}`, payload)),
  changePassword: (userId, newPassword) => unwrap(http.post(`/auth/change-password/${userId}`, { newPassword }))
};

export const workspaceApi = {
  get: (workspaceId) => unwrap(http.get(`/workspaces/${workspaceId}`)),
  byMember: (userId) => unwrap(http.get(`/workspaces/member/${userId}`)),
  byOwner: (userId) => unwrap(http.get(`/workspaces/owner/${userId}`)),
  create: (payload) => unwrap(http.post("/workspaces/create", payload)),
  members: (workspaceId) => unwrap(http.get(`/workspaces/${workspaceId}/members`)),
  addMember: (workspaceId, payload) => unwrap(http.post(`/workspaces/${workspaceId}/members/add`, payload)),
  getRole: (workspaceId, userId) => http.get(`/workspaces/${workspaceId}/members/${userId}/role`).then(r => r.data),
  updateRole: (workspaceId, userId, role) =>
    unwrap(http.put(`/workspaces/${workspaceId}/members/role`, null, { params: { userId, role } })),
  removeMember: (workspaceId, userId) => unwrap(http.delete(`/workspaces/${workspaceId}/members/remove/${userId}`)),
  remove: (workspaceId) => unwrap(http.delete(`/workspaces/${workspaceId}`))
};

export const boardApi = {
  byWorkspace: (workspaceId) => unwrap(http.get(`/boards/workspace/${workspaceId}`)),
  get: (boardId) => unwrap(http.get(`/boards/${boardId}`)),
  getRole: (boardId, userId) => http.get(`/boards/${boardId}/members/${userId}/role`).then(r => r.data),
  create: (payload) => unwrap(http.post("/boards", payload)),
  members: (boardId) => unwrap(http.get(`/boards/${boardId}/members`)),
  update: (boardId, payload) => unwrap(http.put(`/boards/${boardId}`, payload)),
  addMember: (boardId, payload) => unwrap(http.post(`/boards/${boardId}/members`, payload)),
  close: (boardId) => unwrap(http.put(`/boards/${boardId}/close`, null)),
  updateMemberRole: (boardId, userId, role) =>
    unwrap(http.put(`/boards/${boardId}/members/${userId}/role`, null, { params: { role } })),
  removeMember: (boardId, userId) => unwrap(http.delete(`/boards/${boardId}/members/${userId}`)),
  remove: (boardId) => unwrap(http.delete(`/boards/${boardId}`))
};

export const columnApi = {
  byBoard: (boardId) => unwrap(http.get(`/columns/board/${boardId}`)),
  create: (payload) => unwrap(http.post("/columns", payload)),
  update: (listId, payload) => unwrap(http.put(`/columns/${listId}`, payload)),
  reorder: (boardId, listIds) => unwrap(http.put(`/columns/reorder/${boardId}`, listIds)),
  archive: (listId) => unwrap(http.post(`/columns/${listId}/archive`)),
  unarchive: (listId) => unwrap(http.post(`/columns/${listId}/unarchive`)),
  move: (listId, newBoardId) => unwrap(http.put(`/columns/${listId}/move/${newBoardId}`)),
  archivedByBoard: (boardId) => unwrap(http.get(`/columns/board/${boardId}/archived`))
};

export const cardApi = {
  byBoard: (boardId) => unwrap(http.get(`/cards/board/${boardId}`)),
  archivedByBoard: (boardId) => unwrap(http.get(`/cards/board/${boardId}/archived`)),
  get: (cardId) => unwrap(http.get(`/cards/${cardId}`)),
  create: (payload) => unwrap(http.post("/cards", payload)),
  update: (cardId, payload) => unwrap(http.put(`/cards/${cardId}`, payload)),
  move: (cardId, newListId, newPosition) =>
    unwrap(http.put(`/cards/${cardId}/move`, null, { params: { newListId, newPosition } })),
  reorder: (listId, cardIds) => unwrap(http.put(`/cards/reorder/${listId}`, cardIds)),
  assign: (cardId, assigneeId) => unwrap(http.put(`/cards/${cardId}/assignee`, null, { params: { assigneeId } })),
  setPriority: (cardId, priority) => unwrap(http.put(`/cards/${cardId}/priority`, null, { params: { priority } })),
  setStatus: (cardId, status) => unwrap(http.put(`/cards/${cardId}/status`, null, { params: { status } })),
  archive: (cardId) => unwrap(http.post(`/cards/${cardId}/archive`)),
  unarchive: (cardId) => unwrap(http.post(`/cards/${cardId}/unarchive`)),
  overdue: () => unwrap(http.get("/cards/overdue")),
  remove: (cardId) => unwrap(http.delete(`/cards/${cardId}`))
};

export const checklistApi = {
  byCard: (cardId) => unwrap(http.get(`/checklists/card/${cardId}`)),
  create: (payload) => unwrap(http.post("/checklists", payload)),
  addItem: (checklistId, payload) => unwrap(http.post(`/checklists/${checklistId}/items`, payload)),
  toggleItem: (itemId) => unwrap(http.put(`/checklists/items/${itemId}/toggle`)),
  progress: (cardId) => unwrap(http.get(`/checklists/card/${cardId}/progress`))
};

export const labelApi = {
  byBoard: (boardId) => unwrap(http.get(`/labels/board/${boardId}`)),
  byCard: (cardId) => unwrap(http.get(`/labels/card/${cardId}`)),
  create: (payload) => unwrap(http.post("/labels", payload)),
  assignToCard: (cardId, labelId) => unwrap(http.post(`/labels/card/${cardId}/assign/${labelId}`)),
  removeFromCard: (cardId, labelId) => unwrap(http.delete(`/labels/card/${cardId}/remove/${labelId}`))
};

export const commentApi = {
  byCard: (cardId) => unwrap(http.get(`/comments/card/${cardId}`)),
  replies: (commentId) => unwrap(http.get(`/comments/${commentId}/replies`)),
  create: (payload) => unwrap(http.post("/comments", payload)),
  update: (commentId, payload) => unwrap(http.put(`/comments/${commentId}`, payload)),
  remove: (commentId) => unwrap(http.delete(`/comments/${commentId}`))
};

export const attachmentApi = {
  byCard: (cardId) => unwrap(http.get(`/attachments/card/${cardId}`)),
  create: (payload) => unwrap(http.post("/attachments", payload)),
  remove: (attachmentId) => unwrap(http.delete(`/attachments/${attachmentId}`))
};

export const notificationApi = {
  send: (payload) => unwrap(http.post("/notifications", payload)),
  bulk: (recipientIds, title, message) =>
    unwrap(http.post("/notifications/bulk", recipientIds, { params: { title, message } })),
  byRecipient: (recipientId) => unwrap(http.get(`/notifications/recipient/${recipientId}`)),
  unreadCount: (recipientId) => unwrap(http.get(`/notifications/recipient/${recipientId}/unread-count`)),
  markRead: (notificationId) => unwrap(http.put(`/notifications/${notificationId}/read`)),
  markAllRead: (recipientId) => unwrap(http.put(`/notifications/recipient/${recipientId}/read-all`)),
  deleteRead: (recipientId) => unwrap(http.delete(`/notifications/recipient/${recipientId}/read`)),
  all: () => unwrap(http.get("/notifications")),
  email: (to, subject, body) => unwrap(http.post("/notifications/email", null, { params: { to, subject, body } }))
};
