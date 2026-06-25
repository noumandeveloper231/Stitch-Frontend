import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../api/client";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";
import Input from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatApiError } from "../utils/errors";

export default function EmployeeLogin() {
  const { login, employee, ready } = useEmployeeAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/employee/dashboard";

  useEffect(() => {
    if (ready && employee) navigate(from, { replace: true });
  }, [ready, employee, from, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!email.trim()) next.email = "Required";
    if (!password) next.password = "Required";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const { data } = await api.post("/employee-auth/login", {
        email: email.trim(),
        password,
      });
      login(data.data);
      toast.success("Signed in");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--sf-bg)] p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Employee Portal</h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in to your employee account</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
