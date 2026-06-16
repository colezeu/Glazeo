// @ts-nocheck
import { useState, useCallback } from "react";
import { validateField } from "./validation";

/**
 * Input numeric cu validare inline și mesaje de eroare
 * Extinde NumberInput cu feedback vizual imediat
 */
export function ValidatedNumberInput({
  label,
  value,
  onChange,
  placeholder,
  step,
  min,
  max,
  fieldName,        // cheia din ValidationRules (ex: "width", "height")
  showError = true,  // afișează/ascunde mesajul de eroare
  helperText,        // text ajutător sub input (ex: "Ex: 3.0")
  ...rest
}) {
  const [touched, setTouched] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleChange = useCallback((e) => {
    const newVal = e.target.value;
    onChange(newVal);

    // Validare live după primul blur
    if (touched && fieldName) {
      const result = validateField(fieldName, newVal);
      setLocalError(result.valid ? null : result.error);
    }
  }, [onChange, touched, fieldName]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    if (fieldName) {
      const result = validateField(fieldName, value);
      setLocalError(result.valid ? null : result.error);
    }
  }, [fieldName, value]);

  const hasError = touched && localError && showError;

  return (
    <div>
      <label style={{
        fontSize: "0.78rem",
        color: hasError ? "rgba(239,68,68,0.7)" : "rgba(240,237,232,0.45)",
        display: "block",
        marginBottom: 6
      }}>
        {label}{fieldName && <span style={{ color: "rgba(239,68,68,0.5)", marginLeft: 2 }}>*</span>}
      </label>
      <input
        className="input-field"
        type="number"
        step={step || "0.1"}
        min={min}
        max={max}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        style={{
          borderColor: hasError ? "rgba(239,68,68,0.5)" : undefined,
          background: hasError ? "rgba(239,68,68,0.03)" : undefined,
        }}
        {...rest}
      />
      {hasError ? (
        <div style={{
          fontSize: "0.72rem",
          color: "#ef4444",
          marginTop: 4,
          display: "flex",
          alignItems: "center",
          gap: 4
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1L9 8H1L5 1Z" fill="#ef4444"/>
            <rect x="4.5" y="3.5" width="1" height="2.5" rx="0.5" fill="#0f1117"/>
            <rect x="4.5" y="6.5" width="1" height="1" rx="0.5" fill="#0f1117"/>
          </svg>
          {localError}
        </div>
      ) : helperText ? (
        <div style={{ fontSize: "0.7rem", color: "rgba(240,237,232,0.25)", marginTop: 4 }}>
          {helperText}
        </div>
      ) : null}
    </div>
  );
}
