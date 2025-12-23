import type { FC } from "react";

type FormActionsProps = {
  isSubmitting: boolean;
  submitButtonText: string;
  onReset: () => void;
};

export const FormActions: FC<FormActionsProps> = ({
  isSubmitting,
  submitButtonText,
  onReset,
}) => (
  <div className="flex items-center gap-3">
    <button
      type="submit"
      disabled={isSubmitting}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-400 hover:to-violet-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSubmitting ? "Enviando..." : submitButtonText}
    </button>
    <button
      type="button"
      onClick={onReset}
      className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
    >
      Limpiar
    </button>
  </div>
);
