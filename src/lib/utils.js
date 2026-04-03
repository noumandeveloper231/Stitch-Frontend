import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { COUNTRY_CODES } from "@/config/constants";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return "";

  const value = String(phoneNumber).trim();

  const matchedCountry = [...COUNTRY_CODES]
    .sort((a, b) => b.code.length - a.code.length)
    .find(({ code }) => value.startsWith(code));

  if (!matchedCountry) return value;

  const localNumber = value.slice(matchedCountry.code.length).replace(/\D/g, "");

  if (!localNumber) return matchedCountry.code;

  const chunks = [];
  let cursor = 0;

  while (cursor < localNumber.length) {
    const remaining = localNumber.length - cursor;
    const chunkSize = remaining > 4 ? 3 : remaining;
    chunks.push(localNumber.slice(cursor, cursor + chunkSize));
    cursor += chunkSize;
  }

  return `${matchedCountry.code} ${chunks.join(" ")}`.trim();
}
