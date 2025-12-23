import { useMemo } from "react";
import type {
  ConditionalRule,
  FormConfig,
  FormField,
  FormSection,
} from "../types/form";

type FieldState = {
  visibility: Record<string, boolean>;
  required: Record<string, boolean>;
};

function flattenFields(sections: FormSection[]): FormField[] {
  return sections.flatMap((section) => section.fields);
}

function evaluateCondition(
  condition: ConditionalRule["conditions"],
  values: Record<string, unknown>
) {
  const left = values[condition.trigger_field];
  const right = condition.value;

  switch (condition.operator) {
    case "equals":
      return left == right;
    case "not_equals":
      return left != right;
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

  const showControlledFields = new Set<string>();
  rules.forEach((rule) => {
    rule.actions?.forEach((action) => {
      if (action.type === "show_field") {
        showControlledFields.add(action.target_field);
      }
    });
  });

  showControlledFields.forEach((fieldId) => {
    visibility[fieldId] = false;
  });

  rules.forEach((rule) => {
    const matches = evaluateCondition(rule.conditions, values);

    rule.actions?.forEach((action) => {
      if (action.type === "show_field") {
        if (matches) {
          visibility[action.target_field] = true;
        }
      }

      if (action.type === "hide_field") {
        if (matches) {
          visibility[action.target_field] = false;
        }
      }

      if (action.type === "set_required") {
        const requiredValue =
          action.value === undefined ? true : Boolean(action.value);
        if (matches) {
          required[action.target_field] = requiredValue;
        }
      }
    });
  });

  return { visibility, required };
}

export function useFieldState(
  sections: FormSection[],
  config: FormConfig | undefined,
  formValues: Record<string, unknown>
) {
  const allFields: FormField[] = useMemo(
    () => flattenFields(sections),
    [sections]
  );

  const baseRequired = useMemo(() => {
    const map: Record<string, boolean> = {};
    allFields.forEach((field) => {
      map[field.id] = Boolean(field.validations?.required);
    });
    return map;
  }, [allFields]);

  const fieldState = useMemo(() => {
    return deriveFieldState(sections, config, formValues, baseRequired);
  }, [sections, config, formValues, baseRequired]);

  const visibleFields = useMemo(() => {
    return new Set(
      allFields
        .filter((field) => fieldState.visibility[field.id] !== false)
        .map((field) => field.id)
    );
  }, [allFields, fieldState.visibility]);

  return { fieldState, visibleFields, allFields, baseRequired };
}
