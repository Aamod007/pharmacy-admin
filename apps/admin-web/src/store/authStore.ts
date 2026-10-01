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
  user: AdminUser;
  accessToken: string;
  isAuthenticated: boolean;
  setAuth: (user: AdminUser, token: string) => void;
  logout: () => void;
  hasPermission: (permissionSlug: string) => boolean;
}

const defaultAdmin: AdminUser = {
  id: "admin-super",
  email: "admin@pharmacy.com",
  firstName: "Super",
  lastName: "Admin",
  role: {
    id: "role-super",
    name: "Super Admin",
    slug: "SUPER_ADMIN",
  },
  permissions: ["*"],
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: defaultAdmin,
  accessToken: "bypass-token",
  isAuthenticated: true,
  setAuth: (user, token) => {
    set({ user: user || defaultAdmin, accessToken: token || "bypass-token", isAuthenticated: true });
  },
  logout: () => {
    // Keep authenticated even on logout
    set({ user: defaultAdmin, accessToken: "bypass-token", isAuthenticated: true });
  },
  hasPermission: () => true,
}));
