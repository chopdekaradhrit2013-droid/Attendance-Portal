import { useStore } from "../store";
import { greeting, navigate, pct } from "../utils";

export default function Dashboard() {
  const { current, db, overview, studentStats, myClasses, myOverview, myRoster } = useStore();
  if (current?.role === "student") {
    const ov = myOverview();
    const roster = myRoster();
    const classes = myClasses();
    return (
      <>
        <div className="topbar">
          <div>
            <h1>{greeting()}, {current.name.split(" ")[0]}</h1>
            <p>Your attendance only · {current.email}</p>
          </div>
        </div>
        <div className="cards">
          <div className="stat"><span>My Classes</span><b>{ov.classes}</b></div>
          <div className="stat"><span>My Attendance</span><b>{ov.present + ov.absent ? pct(ov.percentage) : "—"}</b></div>
          <div className="stat"><span>Present</span><b>{ov.present}</b></div>
          <div className="stat"><span>Absent</span><b>{ov.absent}</b></div>
        </div>
        <section className="panel">
          <h2>My subjects</h2>
          {classes.length === 0 && <div className="empty">No classes linked yet. Ask your professor to add this email — <strong>{current.email}</strong> — to the class student list.</div>}
          {classes.map((c) => {
            const me = roster.find((s) => s.classId === c.id);
            const stat = me ? studentStats(c.id).find((s) => s.student.id === me.id) : null;
            return (
              <div className="class-item" key={c.id}>
                <div>
                  <strong>{c.subject}</strong>
                  <div className="meta">{c.name} · Div {c.division}{me ? ` · Roll ${me.rollNo}` : ""}</div>
                </div>
                <div className="row">
                  {stat && stat.total > 0 && <span className={`pill ${stat.percentage < 75 ? "warn" : "good"}`}>{pct(stat.percentage)}</span>}
                  <button className="btn" onClick={() => navigate(`/class/${c.id}/mine`)}>View mine</button>
                </div>
              </div>
            );
          })}
        </section>
      </>
    );
  }
  const ov = overview();
  const classes = db.classes.filter((c) => c.professorId === current?.id);
  const attention = classes.flatMap((c) => studentStats(c.id).filter((s) => s.total > 0 && s.percentage < 75).map((s) => ({ ...s, className: c.subject })));
  return (
    <>
      <div className="topbar">
        <div>
          <h1>{greeting()}, Professor {current?.name.split(" ").slice(-1)[0]}</h1>
          <p>{current?.department} · {current?.institution}</p>
        </div>
        <button className="btn" onClick={() => navigate("/classes")}>+ Create Class</button>
      </div>
      <div className="cards">
        <div className="stat"><span>Total Students</span><b>{ov.totalStudents}</b></div>
        <div className="stat"><span>Total Classes</span><b>{ov.totalClasses}</b></div>
        <div className="stat"><span>Average Attendance</span><b>{pct(ov.average)}</b></div>
        <div className="stat"><span>Students Below 75%</span><b>{ov.below75}</b></div>
      </div>
      <div className="two">
        <section className="panel">
          <h2>Today’s Classes</h2>
          {classes.length === 0 && <div className="empty">No classes yet. Create one to start marking attendance.</div>}
          {classes.map((c) => (
            <div className="class-item" key={c.id}>
              <div><strong>{c.subject}</strong><div className="meta">{c.meetingTime || "Today"} · {c.name} — Division {c.division}</div></div>
              <button className="btn" onClick={() => navigate(`/class/${c.id}/mark`)}>Mark Attendance</button>
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>Students Requiring Attention</h2>
          {attention.length === 0 && <div className="empty">No students below 75% yet.</div>}
          {attention.slice(0, 8).map((s) => (
            <div className="attn-item" key={s.student.id}>
              <div><strong>{s.student.fullName}</strong><div className="meta">{s.className} · Roll {s.student.rollNo}</div></div>
              <span className="pill warn">{pct(s.percentage)}</span>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
