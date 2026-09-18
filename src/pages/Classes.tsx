import { useState } from "react";
import { useStore } from "../store";
import type { ClassRecord } from "../types";
import { navigate, pct } from "../utils";

export default function Classes() {
  const { current, db, createClass, classStats, myClasses, myRoster, studentStats } = useStore();
  const [open, setOpen] = useState(false);
  if (current?.role === "student") {
    const mine = myClasses();
    const roster = myRoster();
    return (
      <>
        <div className="topbar">
          <div>
            <h1>My Subjects</h1>
            <p>{mine.length} class{mine.length === 1 ? "" : "es"} linked to {current.email}</p>
          </div>
        </div>
        {mine.length === 0 && <div className="panel empty">Nothing here yet. Your professor must add your email to a class roster.</div>}
        <div className="grid-cards">
          {mine.map((c) => {
            const me = roster.find((s) => s.classId === c.id);
            const stat = me ? studentStats(c.id).find((s) => s.student.id === me.id) : null;
            return (
              <button key={c.id} className="class-card" onClick={() => navigate(`/class/${c.id}/mine`)}>
                <h3>{c.subject}</h3>
                <div className="meta">{c.name} · Division {c.division}</div>
                <p style={{ margin: "10px 0 14px" }}>{me ? `Roll ${me.rollNo}` : "Linked by email"}</p>
                <div className="row">
                  <span className="pill neutral">{stat?.total ?? 0} sessions</span>
                  <span className={`pill ${stat && stat.total && stat.percentage < 75 ? "warn" : "good"}`}>{stat && stat.total ? pct(stat.percentage) : "No data"}</span>
                </div>
              </button>
            );
          })}
        </div>
      </>
    );
  }
  const mine = db.classes.filter((c) => c.professorId === current?.id);
  return (
    <>
      <div className="topbar">
        <div>
          <h1>My Classes</h1>
          <p>{mine.length} class{mine.length === 1 ? "" : "es"}</p>
        </div>
        <button className="btn" onClick={() => setOpen(true)}>+ Create Class</button>
      </div>
      {mine.length === 0 && <div className="panel empty">Create your first class to add students and start attendance.</div>}
      <div className="grid-cards">
        {mine.map((c) => {
          const s = classStats(c.id);
          return (
            <button key={c.id} className="class-card" onClick={() => navigate(`/class/${c.id}/students`)}>
              <h3>{c.name}</h3>
              <div className="meta">Division {c.division} · {c.academicYear}</div>
              <p style={{ margin: "10px 0 14px" }}>{c.subject}</p>
              <div className="row">
                <span className="pill neutral">{s.totalStudents} students</span>
                <span className="pill good">{pct(s.average)} avg</span>
              </div>
            </button>
          );
        })}
      </div>
      {open && <ClassModal onClose={() => setOpen(false)} onSave={(data) => { createClass(data); setOpen(false); }} />}
    </>
  );
}

export function ClassModal({ onClose, onSave, initial }: { onClose: () => void; onSave: (c: Omit<ClassRecord, "id" | "professorId" | "createdAt">) => void; initial?: ClassRecord }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [division, setDivision] = useState(initial?.division ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [academicYear, setAcademicYear] = useState(initial?.academicYear ?? "2026–27");
  const [meetingTime, setMeetingTime] = useState(initial?.meetingTime ?? "");
  return (
    <div className="modal-back" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={(e) => {
        e.preventDefault();
        onSave({ name: name.trim(), division: division.trim(), subject: subject.trim(), academicYear: academicYear.trim(), meetingTime: meetingTime.trim() });
      }}>
        <h3>{initial ? "Edit class" : "Create class"}</h3>
        <div className="field"><label>Class Name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="FY BSc Computer Science" required /></div>
        <div className="field"><label>Division</label><input value={division} onChange={(e) => setDivision(e.target.value)} placeholder="A" required /></div>
        <div className="field"><label>Subject</label><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Computer Networks" required /></div>
        <div className="field"><label>Academic Year</label><input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} required /></div>
        <div className="field"><label>Class time (optional)</label><input value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} placeholder="10:00 AM" /></div>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn">Save</button>
        </div>
      </form>
    </div>
  );
}
