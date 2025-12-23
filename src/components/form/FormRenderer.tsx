import { useMemo } from "react";
import type { FieldValues } from "react-hook-form";

import { useFormSchema } from "../../services/useFormSchema";
import type { FormConfig, FormSection } from "../../types/form";
import { useFieldState } from "../../hooks/useFieldState";
import { useFormSubmission } from "../../hooks/useFormSubmission";
import { useFormInitialization } from "../../hooks/useFormInitialization";
import { SectionCard } from "./SectionCard";
import { FormStatus } from "./FormStatus";
import { FormSubmitMessage } from "./FormSubmitMessage";
import { FormActions } from "./FormActions";

type FormRendererProps = {
  versionId?: number | string;
};

export function FormRenderer({ versionId = 3 }: FormRendererProps) {
  const { data, loading, error, refetch } = useFormSchema(versionId);

  const sections: FormSection[] = useMemo(
    () => data?.schema?.sections ?? [],
    [data]
  );

  const { allFields } = useFieldState(
    sections,
    data?.config as FormConfig | undefined,
    {}
  );

  const methods = useFormInitialization({ sections, allFields });

  const formValues = methods.watch();
  const { fieldState, visibleFields } = useFieldState(
    sections,
    data?.config as FormConfig | undefined,
    formValues
  );

  const { mutation, validateForm, getSuccessMessage } = useFormSubmission({
    versionId,
    config: data?.config as FormConfig | undefined,
    visibleFields,
    fieldState,
    allFields,
  });

  const handleSubmit = methods.handleSubmit(async (formData: FieldValues) => {
    const errors = validateForm(formData, fieldState);
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([fieldId, message]) => {
        methods.setError(fieldId, { message });
      });
      return;
    }

    const valuesPayload = Array.from(visibleFields).reduce((acc, key) => {
      acc[key] = formData[key];

      if (key.startsWith("f_")) {
        const rawKey = key.slice(2);
        acc[rawKey] = formData[key];
      }
      return acc;
    }, {} as Record<string, unknown>);

    mutation.mutate(valuesPayload);
  });

  if (loading || error || !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">
              Versión
            </p>
            <h1 className="text-3xl font-bold text-slate-50">
              Formulario versión {versionId}
            </h1>
          </div>
        </div>
        <FormStatus
          loading={loading}
          error={error}
          onRetry={refetch}
          versionId={versionId}
        />
      </div>
    );
  }

  const submitButtonText =
    data?.config?.submission_settings?.submit_button_text ?? "Enviar";

  return (
    <div className="min-h-screen bg-slate-950 py-10 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4">
        <header className="rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-[1px] shadow-2xl">
          <div className="rounded-3xl bg-slate-950/80 px-8 py-6 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">
              Versión {data.id}
            </p>
            <h1 className="text-3xl font-bold text-slate-50">
              {data.schema?.ui_settings?.form_title ?? "Formulario"}
            </h1>
            <p className="text-sm text-slate-300">
              Lógica condicional habilitada. Completa los campos para ver
              cambios en tiempo real.
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
              errors={methods.formState.errors}
              onChange={(fieldId, value) => {
                methods.setValue(fieldId, value, { shouldValidate: true });
              }}
              versionId={versionId}
            />
          ))}

          {mutation.isPending && (
            <FormSubmitMessage type="success" message="Enviando..." />
          )}
          {mutation.isError && (
            <FormSubmitMessage
              type="error"
              message={
                mutation.error instanceof Error
                  ? mutation.error.message
                  : "No se pudo enviar el formulario"
              }
            />
          )}
          {mutation.isSuccess && (
            <FormSubmitMessage type="success" message={getSuccessMessage()} />
          )}

          <FormActions
            isSubmitting={mutation.isPending}
            submitButtonText={submitButtonText}
            onReset={() => methods.reset()}
          />
        </form>
      </div>
    </div>
  );
}
