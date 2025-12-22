import { useCallback, useEffect, useMemo, useState } from "react";

import { FormVersion } from "../types/form";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost/api";

export function useFormSchema(versionId: number | string | null) {
  const [data, setData] = useState<FormVersion | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const versionUrl = useMemo(() => {
    if (versionId === null || versionId === undefined) return null;
    return `${API_BASE_URL}/form-versions/${versionId}`;
  }, [versionId]);

  const fetchSchema = useCallback(
    async (signal?: AbortSignal) => {
      if (!versionUrl) return;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(versionUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const json = (await response.json()) as { data?: unknown } | FormVersion;
        const version = (json as { data?: FormVersion }).data ?? (json as FormVersion);
        setData(version ?? null);
      } catch (err) {
        if ((err as DOMException).name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [versionUrl]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchSchema(controller.signal);
    return () => controller.abort();
  }, [fetchSchema]);

  return { data, loading, error, refetch: () => fetchSchema() };
}
