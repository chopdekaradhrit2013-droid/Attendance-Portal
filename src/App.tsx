import { useEffect, useState } from "react";
import { useStore } from "./store";
import { navigate } from "./utils";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Shell from "./pages/Shell";
import Dashboard from "./pages/Dashboard";
import Classes from "./pages/Classes";
import ClassPage from "./pages/ClassPage";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function useHash() {
  const [hash, setHash] = useState(window.location.hash || "#/");
  useEffect(() => {
    const on = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash.replace(/^#/, "") || "/";
}

export default function App() {
  const path = useHash();
  const { current } = useStore();

  useEffect(() => {
    const protectedPaths = ["/dashboard", "/classes", "/reports", "/settings"];
    const isClass = path.startsWith("/class/");
    if (!current && (protectedPaths.some((p) => path.startsWith(p)) || isClass)) {
      navigate("/signin");
    }
    if (current && (path === "/signin" || path === "/signup")) {
      navigate("/dashboard");
    }
  }, [current, path]);

  if (path === "/signin") return <Auth mode="in" />;
  if (path === "/signup") return <Auth mode="up" />;
  if (current && path.startsWith("/class/")) return <Shell path={path}><ClassPage path={path} /></Shell>;
  if (current && path.startsWith("/reports")) return <Shell path={path}><Reports /></Shell>;
  if (current && path.startsWith("/settings")) return <Shell path={path}><Settings /></Shell>;
  if (current && path.startsWith("/classes")) return <Shell path={path}><Classes /></Shell>;
  if (current && path.startsWith("/dashboard")) return <Shell path={path}><Dashboard /></Shell>;
  return <Landing />;
}
