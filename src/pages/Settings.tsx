import { useState } from "react";
import { useStore } from "../store";
import { hashPassword, navigate } from "../utils";
import { Toast } from "../ui";

export default function Settings() {
  const { current, updateProfessor, signOut } = useStore();
  const [name, setName] = useState(current?.name ?? "");
  const [institution, setInstitution] = useState(current?.institution ?? "");
  const [department, setDepartment] = useState(current?.department ?? "");
  const [email, setEmail] = useState(current?.email ?? "");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState("");

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Settings</h1>
          <p>Your professor profile</p>
        </div>
      </div>
      <section className="panel" style={{ maxWidth: 520 }}>
        <div className="field"><label>Professor name</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field"><label>Institution</label><input value={institution} onChange={(e) => setInstitution(e.target.value)} /></div>
        <div className="field"><label>Department</label><input value={department} onChange={(e) => setDepartment(e.target.value)} /></div>
        <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label>New password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" /></div>
        <div className="actions">
          <button className="btn" onClick={async () => {
            const patch: Record<string, string> = { name, institution, department, email };
            if (password) patch.passwordHash = await hashPassword(password);
            updateProfessor(patch);
            setPassword("");
            setToast("Settings saved");
          }}>Save changes</button>
          <button className="btn warn" onClick={() => { signOut(); navigate("/"); }}>Log out</button>
        </div>
      </section>
      {toast && <Toast text={toast} onDone={() => setToast("")} />}
    </>
  );
}
