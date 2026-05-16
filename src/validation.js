/**
 * Hook și utilități de validare pentru configuratoare
 * Reguli: min/max, numere pozitive, zecimale, câmpuri obligatorii
 */

export const ValidationRules = {
  // Dimensiuni generale
  width:    { min: 0.1, max: 20,   required: true,  label: "Lățime" },
  height:   { min: 0.1, max: 6,    required: true,  label: "Înălțime" },
  depth:    { min: 0.1, max: 20,   required: true,  label: "Adâncime" },
  // Balustrade specifice
  panelWidth: { min: 0.3, max: 3, required: true,  label: "Lățime panou" },
  // Contact
  name:     { minLength: 2, maxLength: 80, required: true,  label: "Nume" },
  email:    { required: true, label: "Email", type: "email" },
  phone:    { required: false, label: "Telefon", type: "phone" },
  message:  { minLength: 10, maxLength: 2000, required: true, label: "Mesaj" },
};

/**
 * Validează o singură valoare conform regulilor
 * @param {string} field - cheia regulii din ValidationRules
 * @param {string|number} value - valoarea introdusă
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateField(field, value) {
  const rules = ValidationRules[field];
  if (!rules) return { valid: true, error: null };

  // Required check
  if (rules.required && (value === "" || value === null || value === undefined)) {
    return { valid: false, error: `${rules.label} este obligatoriu` };
  }

  // Dacă nu e required și e gol, e OK
  if (!rules.required && (value === "" || value === null || undefined)) {
    return { valid: true, error: null };
  }

  const strVal = String(value).trim();

  // Email
  if (rules.type === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(strVal)) {
      return { valid: false, error: "Adresa de email nu este validă" };
    }
  }

  // Phone
  if (rules.type === "phone" && strVal) {
    const phoneRegex = /^[\d\s+\-().]{7,20}$/;
    if (!phoneRegex.test(strVal)) {
      return { valid: false, error: "Numărul de telefon nu este valid" };
    }
  }

  // String length
  if (rules.minLength !== undefined && strVal.length < rules.minLength) {
    return { valid: false, error: `${rules.label} trebuie să aibă minim ${rules.minLength} caractere` };
  }
  if (rules.maxLength !== undefined && strVal.length > rules.maxLength) {
    return { valid: false, error: `${rules.label} trebuie să aibă maxim ${rules.maxLength} caractere` };
  }

  // Numeric
  if (rules.type !== "email" && rules.type !== "phone") {
    const num = parseFloat(strVal);
    if (isNaN(num)) {
      return { valid: false, error: `${rules.label} trebuie să fie un număr valid` };
    }
    if (rules.min !== undefined && num < rules.min) {
      return { valid: false, error: `${rules.label} minim: ${rules.min}` };
    }
    if (rules.max !== undefined && num > rules.max) {
      return { valid: false, error: `${rules.label} maxim: ${rules.max}` };
    }
  }

  return { valid: true, error: null };
}

/**
 * Validează un întreg formular (obiect de câmpuri)
 * @param {Object} fields - { fieldKey: value }
 * @returns {{ valid: boolean, errors: Object, firstError: string|null }}
 */
export function validateForm(fields) {
  const errors = {};
  let firstError = null;

  for (const [key, value] of Object.entries(fields)) {
    const result = validateField(key, value);
    if (!result.valid) {
      errors[key] = result.error;
      if (!firstError) firstError = result.error;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    firstError,
  };
}
