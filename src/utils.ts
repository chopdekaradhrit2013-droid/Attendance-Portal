export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`ap.v1:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function pct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n)}%`;
}

export function downloadCsv(filename: string, rows: string[][]): void {
  const csv = rows
    .map((r) =>
      r
        .map((cell) => {
          const v = String(cell ?? "");
          if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
          return v;
        })
        .join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseStudentCsv(text: string): { rollNo: string; fullName: string; email: string }[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const split = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (q && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = !q;
      } else if (c === "," && !q) {
        out.push(cur.trim());
        cur = "";
      } else cur += c;
    }
    out.push(cur.trim());
    return out;
  };
  const header = split(lines[0]).map((h) => h.toLowerCase());
  const hasHeader = header.some((h) =>
    ["roll", "roll no", "rollno", "name", "full name", "email"].includes(h)
  );
  const start = hasHeader ? 1 : 0;
  const idx = (names: string[], fallback: number) => {
    const i = header.findIndex((h) => names.includes(h));
    return i >= 0 ? i : fallback;
  };
  const rollI = hasHeader ? idx(["roll", "roll no", "rollno", "roll number"], 0) : 0;
  const nameI = hasHeader ? idx(["name", "full name", "student name"], 1) : 1;
  const emailI = hasHeader ? idx(["email", "e-mail"], 2) : 2;
  const rows: { rollNo: string; fullName: string; email: string }[] = [];
  for (let i = start; i < lines.length; i++) {
    const cols = split(lines[i]);
    const rollNo = (cols[rollI] || "").trim();
    const fullName = (cols[nameI] || "").trim();
    const email = (cols[emailI] || "").trim();
    if (rollNo && fullName) rows.push({ rollNo, fullName, email });
  }
  return rows;
}

export function navigate(path: string) {
  window.location.hash = path.startsWith("#") ? path.slice(1) : path;
}
