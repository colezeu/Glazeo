export const ValidationRules: Record<string, {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  label: string;
  type?: string;
}>;

export function validateField(field: string, value: string | number): { valid: boolean; error: string | null };
export function validateForm(fields: Record<string, string | number>): {
  valid: boolean;
  errors: Record<string, string | null>;
  firstError: string | null;
};
