import { useState } from "react";
import { useStore } from "../store";
import { downloadCsv, pct } from "../utils";

export default function Reports() {
  const { current, db, studentStats, classStats } = useStore();
  const classes = db.classes.filter((c) => c.professorId === current?.id);
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [q, setQ] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const cls = classes.find((c) => c.id === classId);
  const stats = cls ? classStats(cls.id) : null;
  const rows = cls
    ? studentStats(cls.id).filter((s) => {
        const t = q.toLowerCase();
        const match = !t || s.student.fullName.toLowerCase().includes(t) || s.student.rollNo.toLowerCase().includes(t);
        const low = !onlyLow || (s.total > 0 && s.percentage < 75);
        return match && low;
      })
    : [];

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Reports</h1>
          <p>Export a class register whenever you need it.</p>
        </div>
      </div>
      <section className="panel">
        <div className="row" style={{ marginBottom: 16 }}>
          <select className="search" value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.length === 0 && <option value="">No classes</option>}
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.subject} · {c.name} {c.division}</option>
            ))}
          </select>
          <input className="search" placeholder="Search students" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className="row" style={{ fontSize: 14 }}>
            <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} /> Below 75%
          </label>
          <button className="btn" disabled={!cls} onClick={() => {
            if (!cls) return;
            downloadCsv(`${cls.subject.replace(/\s+/g, "-")}-attendance.csv`, [
              ["Roll No", "Student Name", "Email", "Present", "Absent", "Sessions", "Attendance %", "Status"],
              ...rows.map((s) => [
                s.student.rollNo, s.student.fullName, s.student.email,
                String(s.present), String(s.absent), String(s.total),
                s.total ? String(Math.round(s.percentage)) : "",
                s.total === 0 ? "No data" : s.percentage < 75 ? "Warning" : "Good",
              ]),
            ]);
          }}>Export CSV</button>
        </div>
        {stats && (
          <div className="row" style={{ marginBottom: 12 }}>
            <span className="pill neutral">{stats.totalStudents} students</span>
            <span className="pill good">{pct(stats.average)} average</span>
            <span className="pill warn">{stats.below75} below 75%</span>
            <span className="pill">{stats.sessions} sessions</span>
          </div>
        )}
        <div className="table-wrap">
          <table>
            <thead><tr><th>Roll</th><th>Name</th><th>Attendance</th><th>Present / Absent</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.student.id}>
                  <td>{s.student.rollNo}</td>
                  <td>{s.student.fullName}</td>
                  <td>{s.total ? pct(s.percentage) : "—"}</td>
                  <td>{s.present} / {s.absent}</td>
                  <td>{s.total === 0 ? "No data" : s.percentage < 75 ? "Warning" : "Good"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
