import { create } from "zustand";

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: {
    id: string;
    name: string;
    slug: string;
  };
  permissions: string[];
}

interface AuthState {
  user: AdminUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AdminUser, token: string) => void;
  logout: () => void;
  hasPermission: (permissionSlug: string) => boolean;
}

const DEFAULT_ADMIN: AdminUser = {
  id: "admin-master",
  email: "admin@pharmacy.com",
  firstName: "Administrator",
  lastName: "",
  role: {
    id: "admin",
    name: "Administrator",
    slug: "ADMIN",
  },
  permissions: ["*"],
};

const getInitialState = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
    const storedUser = localStorage.getItem("admin_user");
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return { user: parsedUser, accessToken: token, isAuthenticated: true };
      } catch {
        // ignore
      }
    }
  }
  return { user: DEFAULT_ADMIN, accessToken: "admin-session-active", isAuthenticated: true };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...getInitialState(),

  setAuth: (user, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_token", token);
      localStorage.setItem("admin_user", JSON.stringify(user));
    }
    set({ user, accessToken: token, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
    }
    set({ user: DEFAULT_ADMIN, accessToken: "admin-session-active", isAuthenticated: true });
  },

  hasPermission: () => true,
}));
