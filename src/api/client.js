import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const raw = axios.create({ baseURL, headers: { "Content-Type": "application/json" } });

export const api = axios.create({ baseURL, headers: { "Content-Type": "application/json" } });

function getAccess() {
  return localStorage.getItem("accessToken");
}

function getRefresh() {
  return localStorage.getItem("refreshToken");
}

api.interceptors.request.use((config) => {
  const t = getAccess();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

let refreshPromise = null;

function doRefresh() {
  const rt = getRefresh();
  if (!rt) return Promise.reject(new Error("No refresh token"));
  refreshPromise =
    refreshPromise ||
    raw
      .post("/auth/refresh", { refreshToken: rt })
      .then((res) => {
        const d = res.data.data;
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

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (!original || original._retry) return Promise.reject(error);
    if (error.response?.status !== 401) return Promise.reject(error);
    if (original.url?.includes("/auth/refresh") || original.url?.includes("/auth/login")) {
      return Promise.reject(error);
    }
    original._retry = true;
    try {
      const token = await doRefresh();
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch {
      return Promise.reject(error);
    }
  },
);

/** Download order invoice PDF (uses auth headers). */
export async function downloadOrderInvoicePdf(orderId) {
  const res = await api.get(`/orders/${orderId}/invoice/pdf`, {
    responseType: "blob",
  });
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
