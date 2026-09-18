export type Status = "present" | "absent";
export type Role = "professor" | "student";

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  passwordHash: string;
  institution: string;
  department: string;
  createdAt: string;
}

export interface Professor {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  institution: string;
  department: string;
  createdAt: string;
}

export interface ClassRecord {
  id: string;
  professorId: string;
  name: string;
  division: string;
  subject: string;
  academicYear: string;
  meetingTime: string;
  createdAt: string;
}

export interface Student {
  id: string;
  classId: string;
  rollNo: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: Status;
}

export interface Database {
  users: User[];
  professors: Professor[];
  classes: ClassRecord[];
  students: Student[];
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
}

export interface StudentStats {
  student: Student;
  present: number;
  absent: number;
  total: number;
  percentage: number;
}
