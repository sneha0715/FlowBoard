import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { workspaceApi, boardApi } from "../../api/services";

export const fetchWorkspaceBundle = createAsyncThunk(
  "workspace/fetchWorkspaceBundle",
  async (workspaceId, { getState }) => {
    const userId = getState().auth.user?.userId;
    const [workspace, members, boards, userRole] = await Promise.all([
      workspaceApi.get(workspaceId),
      workspaceApi.members(workspaceId),
      boardApi.byWorkspace(workspaceId),
      userId ? workspaceApi.getRole(workspaceId, userId) : Promise.resolve("NONE")
    ]);

    return {
      activeWorkspace: workspace,
      members,
      boards,
      userRole: userRole || "NONE"
    };
  }
);

const workspaceSlice = createSlice({
  name: "workspace",
  initialState: {
    activeWorkspace: null,
    members: [],
    boards: [],
    userRole: "NONE",
    status: "idle",
    error: null
  },
  reducers: {
    clearWorkspace(state) {
      state.activeWorkspace = null;
      state.members = [];
      state.boards = [];
      state.userRole = "NONE";
      state.status = "idle";
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaceBundle.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchWorkspaceBundle.fulfilled, (state, action) => {
        state.status = "ready";
        state.error = null;
        state.activeWorkspace = action.payload.activeWorkspace;
        state.members = action.payload.members;
        state.boards = action.payload.boards;
        state.userRole = action.payload.userRole;
      })
      .addCase(fetchWorkspaceBundle.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Unable to load workspace.";
      });
  }
});

export const { clearWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;
