import type { FormSection } from "../../types/form";
import { FieldControl } from "./FieldControl";

type SectionCardProps = {
  section: FormSection;
  values: Record<string, unknown>;
  visibility: Record<string, boolean>;
  requiredMap: Record<string, boolean>;
  errors: Record<string, { message?: string } | undefined>;
  onChange: (fieldId: string, value: unknown) => void;
};

export function SectionCard({
  section,
  values,
  visibility,
  requiredMap,
  errors,
  onChange,
}: SectionCardProps) {
  const visibleFields = section.fields.filter(
    (field) => visibility[field.id] !== false
  );

  if (visibleFields.length === 0) return null;

  const gridSpan = (width?: number) => {
    switch (width) {
      case 3:
        return "md:col-span-3";
      case 4:
        return "md:col-span-4";
      case 6:
        return "md:col-span-6";
      default:
        return "md:col-span-12";
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl shadow-black/20 backdrop-blur">
      <div className="border-b border-slate-800 px-6 py-4">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-400">
          Sección
        </p>
        <h3 className="text-xl font-semibold text-slate-50">{section.title}</h3>
        {section.description ? (
          <p className="text-sm text-slate-400">{section.description}</p>
        ) : null}
      </div>
      <div className="grid gap-4 px-6 py-6 md:grid-cols-12">
        {visibleFields.map((field) => (
          <div
            key={field.id}
            className={`${gridSpan(field.grid_width)} col-span-12`}
          >
            <FieldControl
              field={field}
              value={values[field.id]}
              required={requiredMap[field.id]}
              error={errors[field.id]?.message}
              onChange={onChange}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
