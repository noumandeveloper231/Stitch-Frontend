export function formatApiError(error) {
  const msg = error.response?.data?.message;
  if (typeof msg === "string") return msg;
  const details = error.response?.data?.details;
  if (Array.isArray(details)) return details.join("; ");
  return error.message || "Something went wrong";
}
