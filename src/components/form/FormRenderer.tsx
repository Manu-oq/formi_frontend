import { FormEvent, useEffect, useMemo, useState } from "react";

import { API_BASE_URL, useFormSchema } from "../../services/useFormSchema";
import { ConditionalRule, FormConfig, FormField, FormSection } from "../../types/form";
import { SectionCard } from "./SectionCard";

type FormRendererProps = {
  versionId?: number | string;
};

type SubmitState = "idle" | "submitting" | "success" | "error";

type FieldState = {
  visibility: Record<string, boolean>;
  required: Record<string, boolean>;
};

function flattenFields(sections: FormSection[]): FormField[] {
  return sections.flatMap((section) => section.fields);
}

function evaluateCondition(condition: ConditionalRule["conditions"], values: Record<string, unknown>) {
  const left = values[condition.trigger_field];
  const right = condition.value;

  switch (condition.operator) {
    case "equals":
      return left === right;
    case "not_equals":
      return left !== right;
    case "greater_than":
      return Number(left) > Number(right);
    case "less_than":
      return Number(left) < Number(right);
    case "contains":
      return Array.isArray(left) ? left.includes(right as never) : false;
    default:
      return false;
  }
}

function deriveFieldState(
  sections: FormSection[],
  config: FormConfig | undefined,
  values: Record<string, unknown>,
  baseRequired: Record<string, boolean>
): FieldState {
  const visibility: Record<string, boolean> = {};
  const required: Record<string, boolean> = { ...baseRequired };

  flattenFields(sections).forEach((field) => {
    visibility[field.id] = true;
  });

  const rules = (config?.conditional_logic ?? []) as ConditionalRule[];

  rules.forEach((rule) => {
    const matches = evaluateCondition(rule.conditions, values);

    rule.actions?.forEach((action) => {
      if (action.type === "show_field") {
        if (visibility[action.target_field] === undefined) {
          visibility[action.target_field] = false;
        }
        visibility[action.target_field] = matches;
      }

      if (action.type === "hide_field") {
        if (matches) {
          visibility[action.target_field] = false;
        }
      }

      if (action.type === "set_required") {
        const base = baseRequired[action.target_field] ?? false;
        const requiredValue = action.value === undefined ? true : Boolean(action.value);
        required[action.target_field] = matches ? requiredValue : base;
      }
    });
  });

  return { visibility, required };
}

export function FormRenderer({ versionId = 3 }: FormRendererProps) {
  const { data, loading, error, refetch } = useFormSchema(versionId);

  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [initialValues, setInitialValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitMessage, setSubmitMessage] = useState<string>("");

  const sections: FormSection[] = useMemo(() => data?.schema?.sections ?? [], [data]);
  const allFields: FormField[] = useMemo(() => flattenFields(sections), [sections]);

  useEffect(() => {
    if (!data) return;
    const defaults: Record<string, unknown> = {};
    allFields.forEach((field) => {
      const defaultValue = field.props?.default_value;
      if (field.type === "switch") {
        defaults[field.id] = defaultValue ?? false;
      } else {
        defaults[field.id] = defaultValue ?? null;
      }
    });
    setFormValues(defaults);
    setInitialValues(defaults);
  }, [data, allFields]);

  const baseRequired = useMemo(() => {
    const map: Record<string, boolean> = {};
    allFields.forEach((field) => {
      map[field.id] = Boolean(field.validations?.required);
    });
    return map;
  }, [allFields]);

  const fieldState = useMemo(() => {
    return deriveFieldState(sections, data?.config as FormConfig | undefined, formValues, baseRequired);
  }, [sections, data?.config, formValues, baseRequired]);

  const visibleFields = useMemo(() => {
    return new Set(
      allFields
        .filter((field) => fieldState.visibility[field.id] !== false)
        .map((field) => field.id)
    );
  }, [allFields, fieldState.visibility]);

  const handleChange = (fieldId: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    allFields.forEach((field) => {
      const isVisible = fieldState.visibility[field.id] !== false;
      const isRequired = fieldState.required[field.id];
      if (!isVisible || !isRequired) return;

      const value = formValues[field.id];
      const empty =
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);
      if (empty) {
        nextErrors[field.id] = "Este campo es obligatorio";
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitUrl = `${API_BASE_URL}/form-versions/${versionId}/submissions`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!data) return;

    if (!validate()) return;

    setSubmitState("submitting");
    setSubmitMessage("");

    try {
      let response: Response;

      const valuesPayload = Array.from(visibleFields).reduce((acc, key) => {
        acc[key] = formValues[key];
        return acc;
      }, {} as Record<string, unknown>);

      const hasActualFiles = Object.values(valuesPayload).some((val) => val instanceof File);

      if (hasActualFiles) {
        const body = new FormData();
        Object.entries(valuesPayload).forEach(([key, value]) => {
          if (value instanceof File) {
            body.append(`payload[${key}]`, value);
          } else if (Array.isArray(value)) {
            value.forEach((item) => body.append(`payload[${key}][]`, String(item)));
          } else if (value !== null) {
            body.append(`payload[${key}]`, String(value));
          }
        });

        response = await fetch(submitUrl, {
          method: "POST",
          body,
        });
      } else {
        response = await fetch(submitUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ payload: valuesPayload }),
        });
      }

      if (!response.ok) {
        throw new Error(`Error al enviar: ${response.status}`);
      }

      const successMsg =
        (data.config as FormConfig | undefined)?.submission_settings?.success_message ??
        "Formulario enviado correctamente";

      setSubmitState("success");
      setSubmitMessage(successMsg);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo enviar";
      setSubmitState("error");
      setSubmitMessage(message);
    }
  };

  const renderStatus = () => {
    if (loading) return <p className="text-slate-300">Cargando versión...</p>;
    if (error) {
      return (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <p>Error al cargar el formulario: {error}</p>
          <button
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white"
            onClick={refetch}
            type="button"
          >
            Reintentar
          </button>
        </div>
      );
    }
    if (!data) return null;
    return null;
  };

  if (loading || error || !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Versión</p>
            <h1 className="text-3xl font-bold text-slate-50">Formulario versión {versionId}</h1>
          </div>
        </div>
        {renderStatus()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-10 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4">
        <header className="rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-[1px] shadow-2xl">
          <div className="rounded-3xl bg-slate-950/80 px-8 py-6 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">Versión {data.id}</p>
            <h1 className="text-3xl font-bold text-slate-50">
              {data.schema?.ui_settings?.form_title ?? "Formulario"}
            </h1>
            <p className="text-sm text-slate-300">
              Lógica condicional habilitada. Completa los campos para ver cambios en tiempo real.
            </p>
          </div>
        </header>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {sections.map((section) => (
            <SectionCard
              key={section.id ?? section.title}
              section={section}
              values={formValues}
              visibility={fieldState.visibility}
              requiredMap={fieldState.required}
              errors={errors}
              onChange={handleChange}
            />
          ))}

          {submitState === "error" ? (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {submitMessage || "No se pudo enviar el formulario"}
            </div>
          ) : null}
          {submitState === "success" ? (
            <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {submitMessage}
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitState === "submitting"}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-400 hover:to-violet-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitState === "submitting" ? "Enviando..." : data.config?.submission_settings?.submit_button_text ?? "Enviar"}
            </button>
            <button
              type="button"
              onClick={() => setFormValues(initialValues)}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
