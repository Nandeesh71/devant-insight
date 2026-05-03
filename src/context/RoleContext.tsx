import { createContext, useContext, useState, ReactNode } from "react";
import type { Role } from "@/data/seed";

type Ctx = { role: Role; setRole: (r: Role) => void; canEdit: boolean };
const RoleContext = createContext<Ctx | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => (localStorage.getItem("devant.role") as Role) || "Owner");
  const setRole = (r: Role) => { setRoleState(r); localStorage.setItem("devant.role", r); };
  const canEdit = role !== "Viewer";
  return <RoleContext.Provider value={{ role, setRole, canEdit }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
