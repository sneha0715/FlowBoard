import { describe, it, expect, vi, beforeEach } from "vitest";
import authReducer, { logout, login, fetchProfile } from "./authSlice";

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

vi.stubGlobal("localStorage", localStorageMock);

// Mock api
vi.mock("../../api/services", () => ({
  authApi: {
    login: vi.fn(),
    profile: vi.fn(),
  },
}));

import { authApi } from "../../api/services";

describe("authSlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it("should return the initial state", () => {
    const initialState = {
      token: null,
      user: null,
      status: "idle",
      error: null,
    };
    expect(authReducer(undefined, { type: "unknown" })).toEqual(initialState);
  });

  it("should handle logout", () => {
    const previousState = {
      token: "some-token",
      user: { id: 1, name: "Test User" },
      status: "authenticated",
      error: null,
    };
    const nextState = authReducer(previousState, logout());
    expect(nextState.token).toBeNull();
    expect(nextState.user).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("flowboard.token");
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("flowboard.user");
  });

  it("should handle login.pending", () => {
    const action = { type: login.pending.type };
    const state = authReducer(undefined, action);
    expect(state.status).toBe("loading");
    expect(state.error).toBeNull();
  });

  it("should handle login.fulfilled", () => {
    const action = { type: login.fulfilled.type, payload: "test-token" };
    const state = authReducer(undefined, action);
    expect(state.status).toBe("authenticated");
    expect(state.token).toBe("test-token");
  });

  it("should handle login.rejected", () => {
    const action = { type: login.rejected.type, error: { message: "Invalid credentials" } };
    const state = authReducer(undefined, action);
    expect(state.status).toBe("failed");
    expect(state.error).toBe("Invalid credentials");
  });
});
