export type FieldType =
  | "text"
  | "number"
  | "select"
  | "checkbox_group"
  | "date"
  | "file"
  | "image"
  | "textarea"
  | "switch";

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  min_length?: number;
  max_length?: number;
  email?: boolean;
}

export interface FieldProps {
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  multiple?: boolean;
  accept?: string;
  rows?: number;
  max_size_mb?: number;
  default_value?: unknown;
  prefix?: string;
  suffix?: string;
}

export interface FieldOption {
  label: string;
  value: string | number | boolean;
}

export interface FormField {
  id: string;
  type: FieldType | string;
  label: string;
  grid_width?: 12 | 6 | 4 | 3;
  validations?: FieldValidation;
  props?: FieldProps;
  options?: FieldOption[];
  placeholder?: string;
}

export interface FormSection {
  id?: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export type ConditionalCondition = {
  trigger_field: string;
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains";
  value: unknown;
};

export type ConditionalAction = {
  type: "show_field" | "hide_field" | "set_required" | string;
  target_field: string;
  value?: unknown;
};

export type ConditionalRule = {
  id?: string;
  description?: string;
  conditions: ConditionalCondition;
  actions: ConditionalAction[];
};

export type SubmissionSettings = {
  submit_button_text?: string;
  success_message?: string;
  redirect_url?: string;
};

export interface FormSchema {
  ui_settings?: {
    form_title?: string;
    layout_variant?: "stepper" | "simple" | string;
    [key: string]: unknown;
  };
  sections: FormSection[];
}

export interface FormConfig {
  conditional_logic?: ConditionalRule[];
  submission_settings?: SubmissionSettings;
  [key: string]: unknown;
}

export interface FormVersion {
  id: number;
  schema: FormSchema;
  config?: FormConfig;
  [key: string]: unknown;
}
