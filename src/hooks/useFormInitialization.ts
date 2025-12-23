import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import type { FormField, FormSection } from "../types/form";

type UseFormInitializationOptions = {
  sections: FormSection[];
  allFields: FormField[];
};

export function useFormInitialization(
  options: UseFormInitializationOptions
): UseFormReturn<FieldValues> {
  const methods = useForm({
    mode: "onChange",
    defaultValues: {},
  });

  useEffect(() => {
    if (options.allFields.length === 0) return;

    const defaults: Record<string, unknown> = {};
    options.allFields.forEach((field) => {
      const defaultValue = field.props?.default_value;
      if (field.type === "switch") {
        defaults[field.id] = defaultValue ?? false;
      } else {
        defaults[field.id] = defaultValue ?? null;
      }
    });

    methods.reset(defaults);
  }, [options.allFields, methods]);

  return methods;
}
