import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authApi } from "../../api/services";

const savedToken = localStorage.getItem("flowboard.token");
const savedUser = localStorage.getItem("flowboard.user");

export const login = createAsyncThunk("auth/login", async (credentials) => {
  const data = await authApi.login(credentials);
  localStorage.setItem("flowboard.token", data.token);
  return data.token;
});

export const fetchProfile = createAsyncThunk("auth/fetchProfile", async () => {
  const profile = await authApi.profile();
  localStorage.setItem("flowboard.user", JSON.stringify(profile));
  return profile;
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: savedToken,
    user: savedUser ? JSON.parse(savedUser) : null,
    status: "idle",
    error: null
  },
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      localStorage.removeItem("flowboard.token");
      localStorage.removeItem("flowboard.user");
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.token = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Unable to log in.";
      })
      .addCase(fetchProfile.pending, (state) => {
        state.status = state.user ? "authenticated" : "loading";
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "authenticated";
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Unable to load profile.";
      });
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
