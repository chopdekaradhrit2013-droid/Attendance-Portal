import { useEffect, useMemo, useRef, useState } from "react";
import { sessionFor, useStore } from "../store";
import type { ClassRecord, Status, Student } from "../types";
import { formatDate, navigate, parseStudentCsv, pct, todayISO } from "../utils";
import { Toast } from "../ui";

export default function ClassPage({ path }: { path: string }) {
  const parts = path.split("/").filter(Boolean);
  const classId = parts[1];
  const tab = parts[2] || "students";
  const extra = parts[3];
  const { current, db, classStats, deleteClass, myRoster, studentStats } = useStore();
  const cls = db.classes.find((c) => c.id === classId);
  if (!cls) return <div className="panel">Class not found.</div>;
  if (current?.role === "student") {
    const me = myRoster().find((s) => s.classId === cls.id);
    if (!me) return <div className="panel">You are not enrolled in this class.</div>;
    const stat = studentStats(cls.id).find((s) => s.student.id === me.id);
    const sessions = db.sessions.filter((s) => s.classId === cls.id).slice().sort((a, b) => b.date.localeCompare(a.date));
    return (
      <>
        <div className="topbar"><div><h1>{cls.subject}</h1><p>{cls.name} · Division {cls.division} · Roll {me.rollNo}</p></div></div>
        <div className="cards">
          <div className="stat"><span>My Attendance</span><b>{stat && stat.total ? pct(stat.percentage) : "—"}</b></div>
          <div className="stat"><span>Present</span><b>{stat?.present ?? 0}</b></div>
          <div className="stat"><span>Absent</span><b>{stat?.absent ?? 0}</b></div>
          <div className="stat"><span>Sessions</span><b>{stat?.total ?? 0}</b></div>
        </div>
        <section className="panel">
          <h2>My record</h2>
          {sessions.length === 0 && <div className="empty">No sessions recorded yet.</div>}
          {sessions.map((s) => {
            const rec = db.records.find((r) => r.sessionId === s.id && r.studentId === me.id);
            return (
              <div className="hist-item" key={s.id}>
                <div><strong>{formatDate(s.date)}</strong><div className="meta">{cls.subject} · only your mark</div></div>
                {rec ? <span className={`pill ${rec.status === "present" ? "good" : "warn"}`}>{rec.status === "present" ? "Present" : "Absent"}</span> : <span className="pill neutral">Not marked</span>}
              </div>
            );
          })}
        </section>
      </>
    );
  }
  const stats = classStats(cls.id);
  return (
    <>
      <div className="topbar">
        <div><h1>{cls.subject}</h1><p>{cls.name} · Division {cls.division} · {cls.academicYear}</p></div>
        <button className="btn ghost" onClick={() => { if (confirm("Delete this class and its attendance?")) { deleteClass(cls.id); navigate("/classes"); } }}>Delete class</button>
      </div>
      <div className="cards">
        <div className="stat"><span>Total Students</span><b>{stats.totalStudents}</b></div>
        <div className="stat"><span>Average Attendance</span><b>{pct(stats.average)}</b></div>
        <div className="stat"><span>Classes Conducted</span><b>{stats.sessions}</b></div>
        <div className="stat"><span>Students Below 75%</span><b>{stats.below75}</b></div>
      </div>
      <div className="tabs">
        {["students", "mark", "history", "analytics"].map((t) => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => navigate(`/class/${cls.id}/${t}`)}>
            {t === "students" ? "Students" : t === "mark" ? "Mark Attendance" : t === "history" ? "Attendance History" : "Analytics"}
          </button>
        ))}
      </div>
      {tab === "students" && <StudentsTab cls={cls} />}
      {tab === "mark" && <MarkTab cls={cls} date={extra || todayISO()} />}
      {tab === "history" && <HistoryTab cls={cls} />}
      {tab === "analytics" && <AnalyticsTab cls={cls} />}
    </>
  );
}

function StudentsTab({ cls }: { cls: ClassRecord }) {
  const { studentStats, addStudent, updateStudent, removeStudent, importStudents } = useStore();
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<null | Partial<Student>>(null);
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const stats = studentStats(cls.id).filter((s) => {
    const t = q.toLowerCase();
    return !t || s.student.fullName.toLowerCase().includes(t) || s.student.rollNo.toLowerCase().includes(t);
  });
  return (
    <section className="panel">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <input className="search" placeholder="Search students" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="row">
          <button className="btn ghost" onClick={() => fileRef.current?.click()}>Import CSV</button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            const n = importStudents(cls.id, parseStudentCsv(await f.text()));
            setToast(`${n} student${n === 1 ? "" : "s"} imported`);
            e.target.value = "";
          }} />
          <button className="btn" onClick={() => setModal({})}>Add student</button>
        </div>
      </div>
      <div className="table-wrap hide-sm">
        <table>
          <thead><tr><th>Roll No.</th><th>Student Name</th><th>Attendance</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.student.id}>
                <td>{s.student.rollNo}</td><td>{s.student.fullName}</td><td>{s.total ? pct(s.percentage) : "—"}</td>
                <td>{s.total === 0 ? <span className="pill neutral">No data</span> : s.percentage < 75 ? <span className="pill warn">Warning</span> : <span className="pill good">Good</span>}</td>
                <td>
                  <button className="btn ghost" onClick={() => setModal(s.student)}>Edit</button>{" "}
                  <button className="btn ghost" onClick={() => { if (confirm("Remove this student?")) removeStudent(s.student.id); }}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="show-sm">
        {stats.map((s) => (
          <div key={s.student.id} className="mark-row" style={{ marginBottom: 8 }}>
            <div><strong>{s.student.rollNo} — {s.student.fullName}</strong><div className="meta">{s.total ? pct(s.percentage) : "No data"}</div></div>
            <div className="row">
              <button className="btn ghost" onClick={() => setModal(s.student)}>Edit</button>
              <button className="btn ghost" onClick={() => removeStudent(s.student.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      {stats.length === 0 && <div className="empty">No students yet. Add one or import a CSV with columns Roll No, Name, Email.</div>}
      {modal && <StudentModal initial={modal} onClose={() => setModal(null)} onSave={(data) => {
        if (modal.id) updateStudent(modal.id, data);
        else { const err = addStudent({ classId: cls.id, ...data }); if (err) { alert(err); return; } }
        setModal(null);
      }} />}
      {toast && <Toast text={toast} onDone={() => setToast("")} />}
    </section>
  );
}

function StudentModal({ initial, onClose, onSave }: { initial: Partial<Student>; onClose: () => void; onSave: (s: { rollNo: string; fullName: string; email: string }) => void }) {
  const [rollNo, setRollNo] = useState(initial.rollNo ?? "");
  const [fullName, setFullName] = useState(initial.fullName ?? "");
  const [email, setEmail] = useState(initial.email ?? "");
  return (
    <div className="modal-back" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSave({ rollNo: rollNo.trim(), fullName: fullName.trim(), email: email.trim() }); }}>
        <h3>{initial.id ? "Edit student" : "Add student"}</h3>
        <div className="field"><label>Roll number</label><input value={rollNo} onChange={(e) => setRollNo(e.target.value)} required /></div>
        <div className="field"><label>Full name</label><input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>
        <div className="field"><label>Email (needed for student login)</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="actions"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="btn">Save</button></div>
      </form>
    </div>
  );
}

function MarkTab({ cls, date }: { cls: ClassRecord; date: string }) {
  const { db, saveAttendance } = useStore();
  const students = db.students.filter((s) => s.classId === cls.id).slice().sort((a, b) => a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true }));
  const existing = sessionFor(db, cls.id, date);
  const existingMarks = useMemo(() => {
    const map: Record<string, Status> = {};
    if (!existing) return map;
    db.records.filter((r) => r.sessionId === existing.id).forEach((r) => { map[r.studentId] = r.status; });
    return map;
  }, [db.records, existing]);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [toast, setToast] = useState("");
  useEffect(() => {
    const next: Record<string, Status> = {};
    students.forEach((s) => { next[s.id] = existingMarks[s.id] ?? "present"; });
    setMarks(next);
  }, [cls.id, date, existing?.id, students.length]);
  if (students.length === 0) return <div className="panel empty">Add students before marking attendance.</div>;
  return (
    <section className="panel">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>Mark Attendance</h2>
          <div className="meta">Class: {cls.subject} · Date: {formatDate(date)}{existing ? " · Editing existing record" : ""}</div>
        </div>
        <div className="row">
          <input type="date" className="search" value={date} onChange={(e) => navigate(`/class/${cls.id}/mark/${e.target.value}`)} />
          <button className="btn soft" onClick={() => { const next: Record<string, Status> = {}; students.forEach((s) => { next[s.id] = "present"; }); setMarks(next); }}>Mark all present</button>
        </div>
      </div>
      <div className="mark-list">
        {students.map((s) => (
          <div className="mark-row" key={s.id}>
            <strong>{s.rollNo} — {s.fullName}</strong>
            <div className="seg">
              <button type="button" className={marks[s.id] === "present" ? "on-p" : ""} onClick={() => setMarks((m) => ({ ...m, [s.id]: "present" }))}>PRESENT</button>
              <button type="button" className={marks[s.id] === "absent" ? "on-a" : ""} onClick={() => setMarks((m) => ({ ...m, [s.id]: "absent" }))}>ABSENT</button>
            </div>
          </div>
        ))}
      </div>
      <div className="actions" style={{ marginTop: 16 }}>
        <button className="btn lg" onClick={() => { saveAttendance(cls.id, date, marks); setToast("Attendance saved"); }}>{existing ? "Update attendance" : "Save attendance"}</button>
      </div>
      {toast && <Toast text={toast} onDone={() => setToast("")} />}
    </section>
  );
}

function HistoryTab({ cls }: { cls: ClassRecord }) {
  const { db } = useStore();
  const sessions = db.sessions.filter((s) => s.classId === cls.id).slice().sort((a, b) => b.date.localeCompare(a.date));
  return (
    <section className="panel">
      <h2>Attendance History</h2>
      {sessions.length === 0 && <div className="empty">No sessions recorded yet.</div>}
      {sessions.map((s) => {
        const recs = db.records.filter((r) => r.sessionId === s.id);
        const present = recs.filter((r) => r.status === "present").length;
        return (
          <div className="hist-item" key={s.id}>
            <div><strong>{formatDate(s.date)}</strong><div className="meta">{cls.subject} · {present} / {recs.length} Present</div></div>
            <button className="btn ghost" onClick={() => navigate(`/class/${cls.id}/mark/${s.date}`)}>Open / Edit</button>
          </div>
        );
      })}
    </section>
  );
}

function AnalyticsTab({ cls }: { cls: ClassRecord }) {
  const { classStats, studentStats } = useStore();
  const stats = classStats(cls.id);
  const list = studentStats(cls.id);
  return (
    <>
      <section className="panel">
        <h2>Class overview</h2>
        <p>Overall attendance <strong>{pct(stats.average)}</strong> · {stats.presentTotal} present · {stats.absentTotal} absent</p>
        <div className="bar"><i style={{ width: `${Math.min(100, stats.average)}%` }} /></div>
      </section>
      <section className="panel">
        <h2>Students</h2>
        {list.map((s) => (
          <div className="attn-item" key={s.student.id}>
            <div style={{ flex: 1 }}>
              <strong>{s.student.fullName}</strong>
              <div className="meta">{s.present} Present · {s.absent} Absent</div>
              <div className="bar"><i style={{ width: `${s.total ? s.percentage : 0}%`, background: s.percentage < 75 && s.total ? "var(--warn)" : undefined }} /></div>
            </div>
            <div>
              <div>{s.total ? pct(s.percentage) : "—"}</div>
              {s.total > 0 && s.percentage < 75 && <span className="pill warn">Needs attention</span>}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
