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

const getInitialState = () => {
  if (typeof window === "undefined") {
    return { user: null, accessToken: null, isAuthenticated: false };
  }
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
  return { user: null, accessToken: null, isAuthenticated: false };
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
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  hasPermission: (permissionSlug: string) => {
    const { user } = get();
    if (!user) return false;
    if (user.role?.slug === "SUPER_ADMIN") return true;
    if (user.permissions?.includes("*")) return true;
    return user.permissions?.includes(permissionSlug) ?? false;
  },
}));
