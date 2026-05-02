import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getStoredUser, setStoredUser, type User } from "./store";

type AuthCtx = {
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
};

const Ctx = createContext<AuthCtx>({ user: null, login: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    setUser(getStoredUser());
  }, []);
  const login = (u: User) => {
    setStoredUser(u);
    setUser(u);
  };
  const logout = () => {
    setStoredUser(null);
    setUser(null);
  };
  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
