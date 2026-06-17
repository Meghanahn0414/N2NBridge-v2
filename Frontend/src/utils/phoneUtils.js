export const DEFAULT_COUNTRY_CODE = "+91";

export const sanitizePhoneInput = (value) =>
  String(value ?? "").replace(/\D/g, "").slice(0, 10);

/** Returns "+CC-XXXXXXXXXX" format for storage and display */
export const normalizePhone = (value, countryCode = DEFAULT_COUNTRY_CODE) => {
  const raw = String(value ?? "").trim().replace(/\s+/g, "");
  if (!raw) return "";

  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length === 10) {
    return `${countryCode}-${digits}`;
  }

  if (digits.length > 10) {
    const ccLen = digits.length - 10;
    const cc = `+${digits.slice(0, ccLen)}`;
    const num = digits.slice(ccLen);
    return `${cc}-${num}`;
  }

  return `${countryCode}-${digits}`;
};

/** Display a stored phone number; returns "—" for empty values */
export const formatPhoneDisplay = (value) => {
  if (!value) return "—";
  // Already in correct +CC-XXXXXXXXXX format
  if (/^\+\d{1,4}-\d{6,12}$/.test(String(value))) return value;
  return normalizePhone(value);
};

export const isValidPhone = (value) => /^\d{10}$/.test(String(value ?? "").replace(/\D/g, ""));
