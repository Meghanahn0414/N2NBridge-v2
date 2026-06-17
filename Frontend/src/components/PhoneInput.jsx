import React, { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_COUNTRY_CODE, sanitizePhoneInput } from "../utils/phoneUtils";
import "./PhoneInput.css";

const COUNTRY_OPTIONS = [
  { label: "India", dialCode: "+91", flag: "🇮🇳" },
  { label: "United States", dialCode: "+1", flag: "🇺🇸" },
  { label: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { label: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { label: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { label: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { label: "France", dialCode: "+33", flag: "🇫🇷" },
  { label: "Singapore", dialCode: "+65", flag: "🇸🇬" },
];

export default function PhoneInput({
  value,
  onChange,
  name = "mobile",
  placeholder = "Enter phone number",
  className = "",
  inputClassName = "",
  defaultCountryCode = DEFAULT_COUNTRY_CODE,
  maxLength,
}) {
  const [country, setCountry] = useState(
    COUNTRY_OPTIONS.find((option) => option.dialCode === defaultCountryCode) || COUNTRY_OPTIONS[0]
  );
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const nextCountry = COUNTRY_OPTIONS.find((option) => option.dialCode === defaultCountryCode);
    if (nextCountry) {
      setCountry(nextCountry);
    }
  }, [defaultCountryCode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const countryOptions = useMemo(
    () =>
      COUNTRY_OPTIONS.filter(
        (option) =>
          option.label.toLowerCase().includes(countrySearch.toLowerCase()) ||
          option.dialCode.includes(countrySearch)
      ),
    [countrySearch]
  );

  const handlePhoneChange = (event) => {
    const nextValue = sanitizePhoneInput(event.target.value);
    onChange?.(name, nextValue);
  };

  return (
    <div className={`phone-input-shell ${className}`.trim()} ref={dropdownRef}>
      <button
        type="button"
        className="phone-input-country-button"
        onClick={() => setShowCountryDropdown((prev) => !prev)}
        aria-label="Select country code"
      >
        <span className="phone-input-flag">{country.flag}</span>
        <span className="phone-input-code">{country.dialCode}</span>
        <span className="phone-input-arrow">▾</span>
      </button>

      <input
        type="tel"
        name={name}
        value={value}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        className={`phone-input-field ${inputClassName}`.trim()}
        autoComplete="tel"
        maxLength={maxLength}
      />

      {showCountryDropdown && (
        <div className="phone-input-dropdown">
          <div className="phone-input-search-wrap">
            <span className="phone-input-search-icon">🔎</span>
            <input
              type="text"
              value={countrySearch}
              onChange={(event) => setCountrySearch(event.target.value)}
              placeholder="Search country"
              className="phone-input-search"
            />
          </div>
          <div className="phone-input-list">
            {countryOptions.map((option) => (
              <button
                type="button"
                key={`${option.label}-${option.dialCode}`}
                className="phone-input-option"
                onClick={() => {
                  setCountry(option);
                  setShowCountryDropdown(false);
                  setCountrySearch("");
                }}
              >
                <span className="phone-input-flag">{option.flag}</span>
                <span className="phone-input-option-label">{option.label}</span>
                <span className="phone-input-option-code">{option.dialCode}</span>
              </button>
            ))}
            {!countryOptions.length && <p className="phone-input-empty">No country found</p>}
          </div>
        </div>
      )}
    </div>
  );
}
