import { useState } from "react";
import type { Role } from "../types";
import { useStore } from "../store";
import { hashPassword, navigate } from "../utils";
import { Brand } from "./Landing";

export default function Auth({ mode }: { mode: "in" | "up" }) {
  const { signIn, signUp } = useStore();
  const [role, setRole] = useState<Role>("professor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [institution, setInstitution] = useState("");
  const [department, setDepartment] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const hash = await hashPassword(password);
      if (mode === "in") {
        const msg = signIn(email.trim(), hash, role);
        if (msg) setErr(msg);
        else navigate("/dashboard");
      } else {
        if (!name.trim()) { setErr("Please enter your name."); return; }
        if (role === "professor" && (!institution.trim() || !department.trim())) { setErr("Please complete every field."); return; }
        if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }
        const msg = signUp({ role, name: name.trim(), email: email.trim(), passwordHash: hash, institution: institution.trim(), department: department.trim() });
        if (msg) setErr(msg);
        else navigate("/dashboard");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <aside className="auth-side">
        <Brand />
        <div>
          <h2>{role === "professor" ? "A quieter way to take attendance." : "See only your attendance."}</h2>
          <p>{role === "professor" ? "Built for the few minutes before a lecture starts." : "Students see their own record. Professors see the full class."}</p>
        </div>
        <span>V1 · Professor and student access</span>
      </aside>
      <form className="auth-form" onSubmit={submit}>
        <h1>{mode === "in" ? "Sign in" : "Create your account"}</h1>
        <p className="muted">{mode === "in" ? "Choose who you are, then continue." : "First, tell us your role."}</p>
        <div className="role-pick" role="radiogroup" aria-label="Account type">
          <button type="button" className={`role-card ${role === "professor" ? "on" : ""}`} onClick={() => setRole("professor")}>
            <strong>Professor</strong>
            <span>Manage classes and everyone’s attendance</span>
          </button>
          <button type="button" className={`role-card ${role === "student" ? "on" : ""}`} onClick={() => setRole("student")}>
            <strong>Student</strong>
            <span>View only your own attendance</span>
          </button>
        </div>
        {mode === "up" && (
          <>
            <div className="field"><label>{role === "professor" ? "Professor name" : "Full name"}</label><input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            {role === "professor" && (
              <>
                <div className="field"><label>Institution</label><input value={institution} onChange={(e) => setInstitution(e.target.value)} required /></div>
                <div className="field"><label>Department</label><input value={department} onChange={(e) => setDepartment(e.target.value)} required /></div>
              </>
            )}
            {role === "student" && (
              <div className="field"><label>College / institution (optional)</label><input value={institution} onChange={(e) => setInstitution(e.target.value)} /></div>
            )}
          </>
        )}
        <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="field"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        {mode === "up" && role === "student" && <p className="hint">Use the same email your professor added to the class list, or you won’t see any records yet.</p>}
        {err && <p className="err">{err}</p>}
        <button className="btn full lg" disabled={busy}>{mode === "in" ? "Sign In" : "Create account"}</button>
        <p className="muted" style={{ marginTop: 16 }}>
          {mode === "in" ? <>No account? <a className="link" href="#/signup">Sign up</a></> : <>Already registered? <a className="link" href="#/signin">Sign in</a></>}
        </p>
      </form>
    </div>
  );
}
