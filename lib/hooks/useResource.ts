"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type Status = "loading" | "success" | "error";

/**
 * Loads data ONCE on mount (and again only when reload() is called).
 * The loader is kept in a ref, so changing function identity never re-triggers
 * the effect (no accidental fetch loops).
 */
export function useResource<T>(loader: () => Promise<T>, initial: T) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const [data, setData] = useState<T>(initial);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const result = await loaderRef.current();
      if (!alive.current) return;
      setData(result);
      setStatus("success");
    } catch (e) {
      if (!alive.current) return;
      setError((e as Error).message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    load();
    return () => { alive.current = false; };
  }, [load]);

  return { data, setData, status, error, reload: load };
}
