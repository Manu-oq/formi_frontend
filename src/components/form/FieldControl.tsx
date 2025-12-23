import { type ChangeEvent, useState } from "react";
import type { FormField } from "../../types/form";
import { uploadFile } from "../../services/formService"; 

type FieldControlProps = {
  field: FormField;
  value: unknown;
  required?: boolean;
  error?: string;
  onChange: (fieldId: string, value: unknown) => void;
  versionId: string | number; 
};

const baseInput =
  "w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

export function FieldControl({
  field,
  value,
  required,
  error,
  onChange,
  versionId, 
}: FieldControlProps) {

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleTextChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const raw = event.target.value;
    if (field.type === "number") {
      onChange(field.id, raw === "" ? null : Number(raw));
      return;
    }
    onChange(field.id, raw === "" ? null : raw);
  };

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const raw = event.target.value;
    if (raw === "") {
      onChange(field.id, null);
      return;
    }
    const option = field.options?.find((opt) => String(opt.value) === raw);
    onChange(field.id, option ? option.value : raw);
  };

  const handleCheckboxGroup = (
    optionValue: string | number | boolean,
    checked: boolean
  ) => {
    const current = Array.isArray(value) ? (value as unknown[]) : [];
    if (checked) {
      onChange(field.id, [...current, optionValue]);
    } else {
      onChange(
        field.id,
        current.filter((item) => item !== optionValue)
      );
    }
  };

  const handleSwitch = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(field.id, event.target.checked);
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      if (field.props?.multiple) {
        const uploadPromises = Array.from(files).map((file) =>
          uploadFile(versionId, field.id, file)
        );
        
        const results = await Promise.all(uploadPromises);
        const ids = results.map((r) => r.file_id);

        onChange(field.id, ids); 
      } else {
        const result = await uploadFile(versionId, field.id, files[0]);
        
        onChange(field.id, result.file_id);
      }
    } catch (err) {
      console.error(err);
      setUploadError("Error al subir el archivo. Intente nuevamente.");
      onChange(field.id, null);
      event.target.value = ""; 
    } finally {
      setIsUploading(false);
    }
  };

  const label = field.label ?? field.id;

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-slate-900/60 p-4 shadow-inner shadow-black/10">
      <div className="flex items-center justify-between gap-2">
        <label
          className="text-sm font-semibold text-slate-100"
          htmlFor={field.id}
        >
          {label}
        </label>
        {required ? (
          <span className="text-xs text-amber-300">Obligatorio</span>
        ) : null}
      </div>

      {(() => {
        switch (field.type) {
          case "textarea":
             return ( 
                <textarea
                    id={field.id}
                    className={`${baseInput} min-h-[120px] resize-y`}
                    placeholder={field.placeholder ?? field.props?.placeholder}
                    rows={(field.props?.rows as number | undefined) ?? 4}
                    value={(value as string | null | undefined) ?? ""}
                    onChange={handleTextChange}
                />
             );
          case "select":
             return ( 
                <select
                    id={field.id}
                    className={`${baseInput} appearance-none`}
                    value={value === null || value === undefined ? "" : String(value)}
                    onChange={handleSelectChange}
                >
                    <option value="">Selecciona una opción</option>
                    {field.options?.map((option) => (
                    <option key={option.value?.toString()} value={String(option.value)}>
                        {option.label}
                    </option>
                    ))}
                </select>
             );
          case "checkbox_group":
             return ( 
                <div className="grid gap-2">
                    {field.options?.map((option) => {
                    const checked = Array.isArray(value)
                        ? (value as unknown[]).includes(option.value)
                        : false;
                    return (
                        <label
                        key={option.value?.toString()}
                        className="flex items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                        >
                        <input
                            type="checkbox"
                            className="h-4 w-4 accent-indigo-500"
                            checked={checked}
                            onChange={(event) =>
                            handleCheckboxGroup(option.value, event.target.checked)
                            }
                        />
                        <span>{option.label}</span>
                        </label>
                    );
                    })}
                </div>
             );
          case "switch":
             return ( 
                <label className="flex items-center gap-3" htmlFor={field.id}>
                    <div className="relative inline-flex h-7 w-12 items-center">
                    <input
                        id={field.id}
                        type="checkbox"
                        className="peer absolute h-full w-full cursor-pointer opacity-0"
                        checked={Boolean(value)}
                        onChange={handleSwitch}
                    />
                    <span className="pointer-events-none h-7 w-12 rounded-full bg-slate-600 transition peer-checked:bg-emerald-500" />
                    <span className="pointer-events-none absolute left-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                    </div>
                    <span className="text-sm text-slate-200">
                    {Boolean(value) ? "Sí" : "No"}
                    </span>
                </label>
             );

          case "file":
          case "image":
            return (
              <div className="flex flex-col gap-2">
                <input
                  id={field.id}
                  type="file"
                  className="text-sm text-slate-100 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  onChange={handleFile}
                  disabled={isUploading} 
                  multiple={Boolean(field.props?.multiple)}
                  accept={
                    typeof field.props?.accept === "string"
                      ? field.props?.accept
                      : undefined
                  }
                />
                
                {isUploading && (
                  <p className="text-xs text-indigo-300 animate-pulse">
                    Subiendo archivo(s)... Por favor espere.
                  </p>
                )}
                
                {value && !isUploading && !uploadError && (
                  <p className="text-xs text-emerald-400 font-medium">
                    ✓ Archivo cargado correctamente (ID: {Array.isArray(value) ? value.join(', ') : value})
                  </p>
                )}
                
                {uploadError && (
                  <p className="text-xs text-red-400 font-medium">{uploadError}</p>
                )}
              </div>
            );

          case "number":
             return (
                <input
                    id={field.id}
                    type="number"
                    className={baseInput}
                    placeholder={field.placeholder ?? field.props?.placeholder}
                    min={field.props?.min as number | undefined}
                    max={field.props?.max as number | undefined}
                    step={field.props?.step as number | undefined}
                    value={
                    value === null || value === undefined
                        ? ""
                        : (value as number | string)
                    }
                    onChange={handleTextChange}
                />
             );
          default:
             return ( 
                <input
                    id={field.id}
                    type={field.type === "email" ? "email" : "text"}
                    className={baseInput}
                    placeholder={field.placeholder ?? field.props?.placeholder}
                    value={(value as string | null | undefined) ?? ""}
                    onChange={handleTextChange}
                />
             );
        }
      })()}

      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
