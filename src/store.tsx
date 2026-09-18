import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AttendanceRecord, AttendanceSession, ClassRecord, Database, Professor, Status, Student, StudentStats } from "./types";
import { todayISO, uid } from "./utils";

const DB_KEY = "attendance-portal-db-v1";
const SESSION_KEY = "attendance-portal-session-v1";
const emptyDb = (): Database => ({ professors: [], classes: [], students: [], sessions: [], records: [] });

function loadDb(): Database {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return emptyDb();
    return { ...emptyDb(), ...JSON.parse(raw) };
  } catch {
    return emptyDb();
  }
}

interface StoreValue {
  db: Database;
  current: Professor | null;
  signUp: (p: Omit<Professor, "id" | "createdAt">) => string | null;
  signIn: (email: string, passwordHash: string) => string | null;
  signOut: () => void;
  updateProfessor: (patch: Partial<Professor>) => void;
  createClass: (c: Omit<ClassRecord, "id" | "professorId" | "createdAt">) => ClassRecord;
  updateClass: (id: string, patch: Partial<ClassRecord>) => void;
  deleteClass: (id: string) => void;
  addStudent: (s: Omit<Student, "id" | "createdAt">) => string | null;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  removeStudent: (id: string) => void;
  importStudents: (classId: string, rows: { rollNo: string; fullName: string; email: string }[]) => number;
  saveAttendance: (classId: string, date: string, marks: Record<string, Status>) => AttendanceSession;
  classStats: (classId: string) => { totalStudents: number; sessions: number; average: number; below75: number; presentTotal: number; absentTotal: number };
  studentStats: (classId: string) => StudentStats[];
  overview: () => { totalStudents: number; totalClasses: number; average: number; below75: number };
}

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(() => loadDb());
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem(SESSION_KEY));
  useEffect(() => { localStorage.setItem(DB_KEY, JSON.stringify(db)); }, [db]);
  const current = useMemo(() => db.professors.find((p) => p.id === userId) ?? null, [db.professors, userId]);
  const setAndPersistUser = (id: string | null) => {
    setUserId(id);
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  };
  const signUp: StoreValue["signUp"] = (p) => {
    if (db.professors.some((x) => x.email.toLowerCase() === p.email.toLowerCase())) return "An account with this email already exists.";
    const prof: Professor = { ...p, id: uid("prof"), createdAt: new Date().toISOString() };
    setDb((d) => ({ ...d, professors: [...d.professors, prof] }));
    setAndPersistUser(prof.id);
    return null;
  };
  const signIn: StoreValue["signIn"] = (email, passwordHash) => {
    const prof = db.professors.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!prof || prof.passwordHash !== passwordHash) return "Invalid email or password.";
    setAndPersistUser(prof.id);
    return null;
  };
  const signOut = () => setAndPersistUser(null);
  const updateProfessor: StoreValue["updateProfessor"] = (patch) => {
    if (!userId) return;
    setDb((d) => ({ ...d, professors: d.professors.map((p) => (p.id === userId ? { ...p, ...patch } : p)) }));
  };
  const createClass: StoreValue["createClass"] = (c) => {
    const rec: ClassRecord = { ...c, id: uid("cls"), professorId: userId!, createdAt: new Date().toISOString() };
    setDb((d) => ({ ...d, classes: [...d.classes, rec] }));
    return rec;
  };
  const updateClass: StoreValue["updateClass"] = (id, patch) => {
    setDb((d) => ({ ...d, classes: d.classes.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  };
  const deleteClass: StoreValue["deleteClass"] = (id) => {
    setDb((d) => {
      const sessionIds = new Set(d.sessions.filter((s) => s.classId === id).map((s) => s.id));
      return {
        ...d,
        classes: d.classes.filter((c) => c.id !== id),
        students: d.students.filter((s) => s.classId !== id),
        sessions: d.sessions.filter((s) => s.classId !== id),
        records: d.records.filter((r) => !sessionIds.has(r.sessionId)),
      };
    });
  };
  const addStudent: StoreValue["addStudent"] = (s) => {
    if (db.students.some((x) => x.classId === s.classId && x.rollNo.trim().toLowerCase() === s.rollNo.trim().toLowerCase())) {
      return "A student with this roll number already exists in the class.";
    }
    const rec: Student = { ...s, id: uid("stu"), createdAt: new Date().toISOString() };
    setDb((d) => ({ ...d, students: [...d.students, rec] }));
    return null;
  };
  const updateStudent: StoreValue["updateStudent"] = (id, patch) => {
    setDb((d) => ({ ...d, students: d.students.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  };
  const removeStudent: StoreValue["removeStudent"] = (id) => {
    setDb((d) => ({ ...d, students: d.students.filter((s) => s.id !== id), records: d.records.filter((r) => r.studentId !== id) }));
  };
  const importStudents: StoreValue["importStudents"] = (classId, rows) => {
    let added = 0;
    setDb((d) => {
      const existing = new Set(d.students.filter((s) => s.classId === classId).map((s) => s.rollNo.trim().toLowerCase()));
      const next = [...d.students];
      for (const row of rows) {
        const key = row.rollNo.trim().toLowerCase();
        if (!key || !row.fullName.trim() || existing.has(key)) continue;
        existing.add(key);
        next.push({ id: uid("stu"), classId, rollNo: row.rollNo.trim(), fullName: row.fullName.trim(), email: row.email.trim(), createdAt: new Date().toISOString() });
        added++;
      }
      return { ...d, students: next };
    });
    return added;
  };
  const saveAttendance: StoreValue["saveAttendance"] = (classId, date, marks) => {
    let saved: AttendanceSession | null = null;
    setDb((d) => {
      const existing = d.sessions.find((s) => s.classId === classId && s.date === date);
      const now = new Date().toISOString();
      if (existing) {
        saved = { ...existing, updatedAt: now };
        const others = d.records.filter((r) => r.sessionId !== existing.id);
        const nextRecords: AttendanceRecord[] = Object.entries(marks).map(([studentId, status]) => ({ id: uid("rec"), sessionId: existing.id, studentId, status }));
        return { ...d, sessions: d.sessions.map((s) => (s.id === existing.id ? saved! : s)), records: [...others, ...nextRecords] };
      }
      const session: AttendanceSession = { id: uid("ses"), classId, date, createdAt: now, updatedAt: now };
      saved = session;
      const nextRecords: AttendanceRecord[] = Object.entries(marks).map(([studentId, status]) => ({ id: uid("rec"), sessionId: session.id, studentId, status }));
      return { ...d, sessions: [...d.sessions, session], records: [...d.records, ...nextRecords] };
    });
    return saved ?? { id: "", classId, date, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  };
  const studentStats = useCallback((classId: string): StudentStats[] => {
    const students = db.students.filter((s) => s.classId === classId).slice().sort((a, b) => a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true }));
    const sessions = db.sessions.filter((s) => s.classId === classId);
    const recs = db.records.filter((r) => sessions.some((s) => s.id === r.sessionId));
    return students.map((student) => {
      const mine = recs.filter((r) => r.studentId === student.id);
      const present = mine.filter((r) => r.status === "present").length;
      const absent = mine.filter((r) => r.status === "absent").length;
      const total = mine.length;
      return { student, present, absent, total, percentage: total === 0 ? 0 : (present / total) * 100 };
    });
  }, [db]);
  const classStats = useCallback((classId: string) => {
    const stats = studentStats(classId);
    const sessions = db.sessions.filter((s) => s.classId === classId).length;
    const withData = stats.filter((s) => s.total > 0);
    const average = withData.length ? withData.reduce((a, s) => a + s.percentage, 0) / withData.length : 0;
    return { totalStudents: stats.length, sessions, average, below75: withData.filter((s) => s.percentage < 75).length, presentTotal: stats.reduce((a, s) => a + s.present, 0), absentTotal: stats.reduce((a, s) => a + s.absent, 0) };
  }, [db.sessions, studentStats]);
  const overview = useCallback(() => {
    if (!userId) return { totalStudents: 0, totalClasses: 0, average: 0, below75: 0 };
    const classes = db.classes.filter((c) => c.professorId === userId);
    const allStats = classes.flatMap((c) => studentStats(c.id));
    const withData = allStats.filter((s) => s.total > 0);
    return { totalStudents: allStats.length, totalClasses: classes.length, average: withData.length ? withData.reduce((a, s) => a + s.percentage, 0) / withData.length : 0, below75: withData.filter((s) => s.percentage < 75).length };
  }, [db.classes, studentStats, userId]);
  const value: StoreValue = { db, current, signUp, signIn, signOut, updateProfessor, createClass, updateClass, deleteClass, addStudent, updateStudent, removeStudent, importStudents, saveAttendance, classStats, studentStats, overview };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("Store missing");
  return v;
}

export function sessionFor(db: Database, classId: string, date = todayISO()) {
  return db.sessions.find((s) => s.classId === classId && s.date === date) ?? null;
}
