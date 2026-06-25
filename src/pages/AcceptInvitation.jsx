import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";
import Input from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatApiError } from "../utils/errors";
import Spinner from "@/components/ui/Spinner";

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userAuth = useAuth();
  const employeeAuth = useEmployeeAuth();

  const rawToken = searchParams.get("token");

  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!rawToken) {
      setError("No invitation token provided");
      setValidating(false);
      return;
    }

    (async () => {
      try {
        const { data } = await api.get(`/invitations/${rawToken}`);
        const result = data.data;
        if (result.valid) {
          setValid(true);
          setName(result.name);
          setEntityType(result.entityType);
          setEmail(result.email);
        }
      } catch (err) {
        setError(formatApiError(err));
      } finally {
        setValidating(false);
      }
    })();
  }, [rawToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!password) errors.password = "Required";
    if (password.length < 6) errors.password = "At least 6 characters";
    if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    try {
      const { data } = await api.post("/invitations/complete", {
        token: rawToken,
        password,
      });

      const result = data.data;

      if (result.entityType === "user") {
        userAuth.login(result);
        toast.success("Account activated! Welcome.");
        navigate("/", { replace: true });
      } else {
        employeeAuth.login(result);
        toast.success("Account activated! Welcome.");
        navigate("/employee/dashboard", { replace: true });
      }
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--sf-bg)]">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--sf-bg)] p-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
          <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 mb-2">Invalid Invitation</h1>
          <p className="text-sm text-zinc-500 mb-6">{error}</p>
          <p className="text-xs text-zinc-400">
            Please contact the administrator who invited you to request a new invitation link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--sf-bg)] p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Set Your Password</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Welcome, <span className="font-medium text-zinc-700">{name}</span>
          </p>
          <p className="text-xs text-zinc-400">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={formErrors.password}
            placeholder="At least 6 characters"
          />
          <Input
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={formErrors.confirmPassword}
            placeholder="Repeat your password"
          />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Activating..." : "Activate Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
