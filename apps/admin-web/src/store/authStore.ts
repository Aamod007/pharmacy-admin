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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, token) => {
    localStorage.setItem("admin_token", token);
    set({ user, accessToken: token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem("admin_token");
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
  hasPermission: (permissionSlug: string) => {
    const user = get().user;
    if (!user) return false;
    if (user.role.slug === "SUPER_ADMIN") return true;
    return user.permissions.includes(permissionSlug);
  },
}));
