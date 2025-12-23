import { useMutation } from "@tanstack/react-query";
import type { FieldValues } from "react-hook-form";
import { API_BASE_URL } from "../services/useFormSchema";
import type { FormConfig, FormField } from "../types/form";

type SubmissionPayload = Record<string, unknown>;

type UseFormSubmissionOptions = {
  versionId: number | string;
  config?: FormConfig;
  visibleFields: Set<string>;
  fieldState: { required: Record<string, boolean> };
  allFields: FormField[];
};

async function submitFormRequest(
  submitUrl: string,
  payload: SubmissionPayload
): Promise<void> {
  const hasActualFiles = Object.values(payload).some(
    (val) => val instanceof File
  );

  let response: Response;

  if (hasActualFiles) {
    const body = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
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
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ payload }),
    });
  }

  if (!response.ok) {
    throw new Error(`Error al enviar: ${response.status}`);
  }
}

export function useFormSubmission(options: UseFormSubmissionOptions) {
  const validateForm = (
    values: FieldValues,
    fieldState: {
      visibility: Record<string, boolean>;
      required: Record<string, boolean>;
    }
  ): Record<string, string> => {
    const errors: Record<string, string> = {};

    options.allFields.forEach((field) => {
      const isVisible = fieldState.visibility[field.id] !== false;
      const isRequired = fieldState.required[field.id];
      if (!isVisible || !isRequired) return;

      const value = values[field.id];
      const empty =
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);

      if (empty) {
        errors[field.id] = "Este campo es obligatorio";
      }
    });

    return errors;
  };

  const mutation = useMutation({
    mutationFn: async (payload: SubmissionPayload) => {
      const submitUrl = `${API_BASE_URL}/form-versions/${options.versionId}/submissions`;
      await submitFormRequest(submitUrl, payload);
    },
  });

  const getSuccessMessage = (): string => {
    return (
      options.config?.submission_settings?.success_message ??
      "Formulario enviado correctamente"
    );
  };

  return {
    mutation,
    validateForm,
    getSuccessMessage,
  };
}
