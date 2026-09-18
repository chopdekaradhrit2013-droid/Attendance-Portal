import { useState, type ReactNode } from "react";
import { useStore } from "../store";
import { navigate } from "../utils";
import { Brand } from "./Landing";

export default function Shell({ path, children }: { path: string; children: ReactNode }) {
  const { current, signOut } = useStore();
  const [open, setOpen] = useState(false);
  const student = current?.role === "student";
  const active = path.startsWith("/classes") || path.startsWith("/class/") ? "classes" : path.startsWith("/reports") ? "reports" : path.startsWith("/settings") ? "settings" : "dashboard";
  function go(to: string) {
    setOpen(false);
    if (to === "out") { signOut(); navigate("/"); return; }
    navigate(to);
  }
  return (
    <div className="layout">
      <div className={`scrim ${open ? "open" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="side-brand"><Brand /></div>
        <button className={`nav-btn ${active === "dashboard" ? "active" : ""}`} onClick={() => go("/dashboard")}>Dashboard</button>
        <button className={`nav-btn ${active === "classes" ? "active" : ""}`} onClick={() => go("/classes")}>{student ? "My Subjects" : "My Classes"}</button>
        {!student && <button className={`nav-btn ${active === "reports" ? "active" : ""}`} onClick={() => go("/reports")}>Reports</button>}
        <button className={`nav-btn ${active === "settings" ? "active" : ""}`} onClick={() => go("/settings")}>Settings</button>
        <button className="nav-btn" onClick={() => go("out")}>Log Out</button>
        <div className="side-foot">
          <div className="who">{current?.name}</div>
          <div className="who">{student ? "Student" : current?.institution || "Professor"}</div>
        </div>
      </aside>
      <div className="main">
        <button className="btn ghost menu-btn" onClick={() => setOpen(true)} style={{ marginBottom: 14 }}>Menu</button>
        {children}
      </div>
    </div>
  );
}
