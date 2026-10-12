import { createContext, useContext } from "react";

export type Mode = "player" | "goddess";

export const ModeContext = createContext<{
  mode: Mode;
  setMode: (m: Mode) => void;
  goddessEligible: boolean;
  setGoddessEligible: (v: boolean) => void;
}>({
  mode: "player",
  setMode: () => {},
  goddessEligible: true,
  setGoddessEligible: () => {},
});

export const useMode = () => useContext(ModeContext);

export const AuthContext = createContext<{
  loggedIn: boolean;
  login: () => void;
  logout: () => void;
  requireLogin: (action?: () => void) => void;
}>({ loggedIn: false, login: () => {}, logout: () => {}, requireLogin: () => {} });

export const useAuth = () => useContext(AuthContext);
