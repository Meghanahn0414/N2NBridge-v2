export const DEFAULT_COUNTRY_CODE = "+91";

export const sanitizePhoneInput = (value) =>
  String(value ?? "").replace(/\D/g, "").slice(0, 10);

export const normalizePhone = (value, countryCode = DEFAULT_COUNTRY_CODE) => {
  const raw = String(value ?? "").trim().replace(/\s+/g, "");
  if (!raw) return "";

  const digits = raw.replace(/\D/g, "");

  if (digits.length === 10) {
    return `${countryCode}${digits}`;
  }

  if (digits.length > 10) {
    return raw.startsWith("+") ? raw : `+${digits}`;
  }

  return raw.startsWith("+") ? raw : `${countryCode}${digits}`;
};

export const formatPhoneDisplay = (value, countryCode = DEFAULT_COUNTRY_CODE) => {
  const normalized = normalizePhone(value, countryCode);
  if (!normalized) return "";

  const digits = normalized.replace(/\D/g, "");
  if (digits.length < 10) return normalized;

  const country = normalized.startsWith("+") ? normalized.match(/^\+\d+/)?.[0] || countryCode : countryCode;
  const number = digits.slice(-10);
  return `${country} ${number.slice(0, 5)} ${number.slice(5)}`;
};

export const isValidPhone = (value) => /^\d{10}$/.test(String(value ?? "").replace(/\D/g, ""));
