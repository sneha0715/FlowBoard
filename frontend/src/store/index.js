import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import boardReducer from "./slices/boardSlice";
import workspaceReducer from "./slices/workspaceSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    board: boardReducer,
    workspace: workspaceReducer
  }
});
