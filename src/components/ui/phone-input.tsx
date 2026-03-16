"use client";

import { PhoneInput as RIPPhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { cn } from "@/lib/utils";

interface PhoneInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function PhoneInputField({
  value,
  onChange,
  className,
  disabled,
}: PhoneInputFieldProps) {
  return (
    <div className={cn("phone-input-wrapper", className)}>
      <RIPPhoneInput
        defaultCountry="fr"
        value={value}
        onChange={onChange}
        disabled={disabled}
        inputStyle={{
          width: "100%",
          height: "40px",
          border: "1px solid var(--border)",
          borderLeft: "none",
          borderRadius: "0 12px 12px 0",
          fontSize: "14px",
          color: "var(--brand-dark)",
          backgroundColor: "white",
          paddingLeft: "12px",
          outline: "none",
        }}
        countrySelectorStyleProps={{
          buttonStyle: {
            height: "40px",
            border: "1px solid var(--border)",
            borderRight: "none",
            borderRadius: "12px 0 0 12px",
            backgroundColor: "white",
            paddingLeft: "12px",
            paddingRight: "8px",
            cursor: "pointer",
          },
        }}
        style={{ width: "100%", display: "flex" }}
      />

      <style>{`
        .phone-input-wrapper .react-international-phone-input:focus {
          outline: none;
          border-color: var(--brand-blue) !important;
          box-shadow: 0 0 0 2px rgba(51, 51, 255, 0.15);
        }
        .phone-input-wrapper .react-international-phone-input:focus + * .react-international-phone-country-selector-button,
        .phone-input-wrapper:focus-within .react-international-phone-country-selector-button {
          border-color: var(--brand-blue) !important;
        }
        .phone-input-wrapper:focus-within .react-international-phone-input {
          border-color: var(--brand-blue) !important;
          box-shadow: 0 0 0 2px rgba(51, 51, 255, 0.15);
        }
        .phone-input-wrapper:focus-within .react-international-phone-country-selector-button {
          border-color: var(--brand-blue) !important;
          box-shadow: -2px 0 0 2px rgba(51, 51, 255, 0.15), 0 -2px 0 2px rgba(51, 51, 255, 0.15), 0 2px 0 2px rgba(51, 51, 255, 0.15);
        }
        .phone-input-wrapper .react-international-phone-country-selector-dropdown {
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          margin-top: 4px;
          max-height: 260px;
          overflow-y: auto;
          z-index: 50;
        }
        .phone-input-wrapper .react-international-phone-country-selector-dropdown__list-item {
          padding: 8px 12px;
          font-size: 13px;
        }
        .phone-input-wrapper .react-international-phone-country-selector-dropdown__list-item:hover {
          background-color: #f9fafb;
        }
        .phone-input-wrapper .react-international-phone-country-selector-dropdown__list-item--selected {
          background-color: rgba(51, 51, 255, 0.06);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
