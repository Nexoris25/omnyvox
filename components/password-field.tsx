"use client";
import { useId, useState } from "react";
import { Check, Circle, Eye, EyeOff } from "lucide-react";

export function PasswordField({
  label = "Password",
  name = "password",
  requirements = false,
  confirmation,
  autoComplete = "new-password",
  onValueChange,
}: {
  label?: string;
  name?: string;
  requirements?: boolean;
  confirmation?: string;
  autoComplete?: "new-password" | "current-password";
  onValueChange?: (value: string) => void;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const rules = [
    ["At least 8 characters", value.length >= 8],
    ["One capital letter", /[A-Z]/.test(value)],
    ["One number", /[0-9]/.test(value)],
    ["One special character", /[^a-zA-Z0-9\s]/.test(value)],
  ] as const;
  return (
    <div className="password-field field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          maxLength={128}
          minLength={autoComplete === "new-password" ? 8 : 1}
          value={value}
          aria-describedby={
            requirements || confirmation !== undefined
              ? id + "-help"
              : undefined
          }
          onChange={(e) => {
            setValue(e.target.value);
            onValueChange?.(e.target.value);
          }}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-controls={id}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? (
            <EyeOff size={19} aria-hidden="true" />
          ) : (
            <Eye size={19} aria-hidden="true" />
          )}
        </button>
      </div>
      {requirements && (
        <ul
          id={id + "-help"}
          className="password-requirements"
          aria-label="Password requirements"
        >
          {rules.map(([text, met]) => (
            <li key={text} className={met ? "met" : ""}>
              {met ? (
                <Check size={14} aria-hidden="true" />
              ) : (
                <Circle size={12} aria-hidden="true" />
              )}
              <span>
                {text}
                <span className="sr-only">: {met ? "met" : "not yet met"}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {confirmation !== undefined && (
        <small
          id={id + "-help"}
          className={
            value && value === confirmation ? "password-match" : "muted"
          }
          aria-live="polite"
        >
          {value
            ? value === confirmation
              ? "Passwords match"
              : "Passwords must match"
            : "Enter your password again to confirm."}
        </small>
      )}
    </div>
  );
}
