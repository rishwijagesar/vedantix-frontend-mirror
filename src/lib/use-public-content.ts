import { useEffect, useState } from "react";

export function usePublicContent<T>(fetcher: () => Promise<T[]>, initial: T[] | null = null) {
  const [data, setData] = useState<T[]>(initial ?? []);
  const [loading, setLoading] = useState(initial === null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    let requestNumber = 0;
    async function refresh() {
      const current = ++requestNumber;
      try {
        const result = await fetcher();
        if (active && current === requestNumber) { setData(result); setError(null); }
      } catch (e) {
        if (active && current === requestNumber) { setData([]); setError(e instanceof Error ? e.message : "Gegevens laden mislukt."); }
      } finally { if (active && current === requestNumber) setLoading(false); }
    }
    function onVisible() { if (!document.hidden) void refresh(); }
    function onStorage(event: StorageEvent) { if (event.key === "vedantix-content-updated") void refresh(); }
    void refresh();
    const timer = window.setInterval(onVisible, 30000);
    window.addEventListener("focus", onVisible);
    window.addEventListener("storage", onStorage);
    window.addEventListener("vedantix-content-updated", onVisible);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", onVisible); window.removeEventListener("storage", onStorage); window.removeEventListener("vedantix-content-updated", onVisible); };
  }, [fetcher]);
  return { data, loading, error };
}
