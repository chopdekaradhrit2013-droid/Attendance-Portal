import { navigate } from "../utils";

function Logo() {
  return (
    <span className="brand">
      <span className="mark">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7.2l3 3 6-6.5" stroke="#F6F4F0" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      Attendance Portal
    </span>
  );
}

export function Brand() {
  return <Logo />;
}

export default function Landing() {
  return (
    <div className="land">
      <nav className="nav">
        <Logo />
        <div className="row">
          <button className="btn ghost" onClick={() => navigate("/signin")}>Sign In</button>
          <button className="btn" onClick={() => navigate("/signup")}>Get Started</button>
        </div>
      </nav>
      <section className="hero">
        <div>
          <h1>Attendance,<br />simplified.</h1>
          <p className="sub">
            Mark attendance, manage your classes, and track student attendance — all in one place.
          </p>
          <div className="row">
            <button className="btn lg" onClick={() => navigate("/signup")}>Get Started</button>
            <button className="btn ghost lg" onClick={() => navigate("/signin")}>Sign In</button>
          </div>
        </div>
        <div className="preview" aria-hidden>
          <div className="preview-top">
            <div>
              <div className="preview-kicker">Today</div>
              <strong>Computer Networks</strong>
            </div>
            <span className="pill good">Ready to mark</span>
          </div>
          <div className="p-grid">
            <div className="p-card"><span>Average</span><b>86%</b></div>
            <div className="p-card"><span>Below 75%</span><b>3</b></div>
          </div>
          <div className="p-row"><span>01 · Aarav Shah</span><span className="pill good">Present</span></div>
          <div className="p-row"><span>02 · Riya Mehta</span><span className="pill good">Present</span></div>
          <div className="p-row"><span>03 · Kabir Patel</span><span className="pill warn">Absent</span></div>
        </div>
      </section>
      <section className="features">
        <article className="feat">
          <div className="icon-box">✓</div>
          <h3>Fast attendance marking</h3>
          <p>Large present and absent controls designed for live lectures, not afterthoughts.</p>
        </article>
        <article className="feat">
          <div className="icon-box">☰</div>
          <h3>Organized class management</h3>
          <p>Keep every division, subject, and academic year in one quiet workspace.</p>
        </article>
        <article className="feat">
          <div className="icon-box">◉</div>
          <h3>Attendance analytics</h3>
          <p>See class averages and who is slipping below 75% before it becomes a problem.</p>
        </article>
        <article className="feat">
          <div className="icon-box">◷</div>
          <h3>Attendance history</h3>
          <p>Open any past session, review the record, and correct a mark in seconds.</p>
        </article>
      </section>
      <footer className="footer">
        <span>Attendance Portal</span>
        <span>Built for professors</span>
      </footer>
    </div>
  );
}
