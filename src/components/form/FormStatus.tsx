import type { FC } from "react";

type FormStatusProps = {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  versionId: number | string;
};

export const FormStatus: FC<FormStatusProps> = ({
  loading,
  error,
  onRetry,
}) => {
  if (loading) return <p className="text-slate-300">Cargando versión...</p>;
  if (error) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        <p>Error al cargar el formulario: {error}</p>
        <button
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white"
          onClick={onRetry}
          type="button"
        >
          Reintentar
        </button>
      </div>
    );
  }
  return null;
};
