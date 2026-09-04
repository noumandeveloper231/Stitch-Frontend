import { Navigate, useLocation } from "react-router-dom";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";
import Spinner from "./ui/Spinner";

export default function EmployeeProtectedRoute({ children }) {
  const { employee, ready } = useEmployeeAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--sf-bg)]">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!employee) {
    return <Navigate to="/employee/login" state={{ from: location }} replace />;
  }

  return children;
}
