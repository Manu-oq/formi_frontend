import type { FormVersion } from "../types/form";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost/api";


export type UploadResponse = {
  file_id: number;
  url: string;
  temp_token?: string;
};

export async function uploadFile(
  versionId: string | number,
  fieldId: string,
  file: File
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("field_id", fieldId);
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/form-versions/${versionId}/uploads`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = "Error al subir el archivo";
    try {
      const errorData = await response.json();
      if (errorData.message) errorMessage = errorData.message;
      if (errorData.errors?.file) errorMessage = errorData.errors.file[0];
    } catch (e) {
    }
    throw new Error(errorMessage);
  }

  const json = await response.json();
  return json.data;
}

export async function getFormSchema(
  versionId: string | number,
  signal?: AbortSignal
): Promise<FormVersion> {
  const response = await fetch(`${API_BASE_URL}/form-versions/${versionId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Error al obtener el formulario: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data ?? json;
}

export async function submitForm(
  versionId: string | number,
  payload: Record<string, unknown>,
  userId?: number | string | null
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/form-versions/${versionId}/submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      payload,
      user_id: userId ?? null,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw errorData; 
  }

  return await response.json();
}
