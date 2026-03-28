/** Ensures absolute URL: values without http(s):// are treated as relative paths on the current origin. */
function normalizeApiBaseUrl(raw) {
  const fallback = "http://localhost:5000/api";
  if (raw == null || String(raw).trim() === "") return fallback;
  let u = String(raw).trim();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u.replace(/\/+$/, "");
}

const baseURL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
import { doneProgress, startProgress } from "@/lib/progress";

const DEFAULT_HEADERS = { "Content-Type": "application/json" };

function getAccess() {
  return localStorage.getItem("accessToken");
}

function getRefresh() {
  return localStorage.getItem("refreshToken");
}

function toQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const str = qs.toString();
  return str ? `?${str}` : "";
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.response = { status, data };
  }
}

let refreshPromise = null;

async function parseResponseData(response, responseType) {
  if (responseType === "blob") return response.blob();
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function doRawRequest(path, options = {}) {
  const {
    method = "GET",
    params,
    body,
    headers = {},
    responseType,
    token,
  } = options;
  const query = toQuery(params);
  const requestHeaders = { ...DEFAULT_HEADERS, ...headers };

  if (token) requestHeaders.Authorization = `Bearer ${token}`;
  if (body instanceof FormData) delete requestHeaders["Content-Type"];

  const response = await fetch(`${baseURL}${path}${query}`, {
    method,
    headers: requestHeaders,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });
  const data = await parseResponseData(response, responseType);
  if (!response.ok) {
    const message =
      data?.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data);
  }
  return { data };
}

function doRefresh() {
  const rt = getRefresh();
  if (!rt) return Promise.reject(new Error("No refresh token"));
  refreshPromise =
    refreshPromise ||
    doRawRequest("/auth/refresh", {
      method: "POST",
      body: { refreshToken: rt },
    })
      .then((res) => {
        const d = res.data?.data;
        localStorage.setItem("accessToken", d.accessToken);
        localStorage.setItem("refreshToken", d.refreshToken);
        refreshPromise = null;
        return d.accessToken;
      })
      .catch((e) => {
        refreshPromise = null;
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        throw e;
      });
  return refreshPromise;
}

async function request(path, options = {}) {
  startProgress();
  try {
    const token = getAccess();
    return await doRawRequest(path, { ...options, token });
  } catch (error) {
    const canRetry =
      error?.response?.status === 401 &&
      !String(path).includes("/auth/refresh") &&
      !String(path).includes("/auth/login") &&
      !options._retry;
    if (!canRetry) throw error;
    const token = await doRefresh();
    return doRawRequest(path, { ...options, token, _retry: true });
  } finally {
    doneProgress();
  }
}

export const api = {
  get(path, config = {}) {
    return request(path, { method: "GET", ...config });
  },
  post(path, body, config = {}) {
    return request(path, { method: "POST", body, ...config });
  },
  put(path, body, config = {}) {
    return request(path, { method: "PUT", body, ...config });
  },
  patch(path, body, config = {}) {
    return request(path, { method: "PATCH", body, ...config });
  },
  delete(path, config = {}) {
    return request(path, { method: "DELETE", ...config });
  },
};

/** Download order invoice PDF (uses auth headers). */
export async function downloadOrderInvoicePdf(orderId) {
  const res = await api.get(`/orders/${orderId}/invoice/pdf`, { responseType: "blob" });
  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${String(orderId).slice(-8)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
