import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import Calendar from "./pages/Calendar";
import CreateOrder from "./pages/CreateOrder";
import OrderKanban from "./pages/OrderKanban";
import OrderDetails from "./pages/OrderDetails";
import Measurements from "./pages/Measurements";
import CreateMeasurement from "./pages/CreateMeasurement";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForceChangePassword from "./pages/ForceChangePassword";
import Users from "./pages/Admin/Users";
import Roles from "./pages/Admin/Roles";
import LoginHistory from "./pages/Admin/LoginHistory";
import EmailTemplates from "./pages/Admin/EmailTemplates";
import { doneProgress, startProgress } from "./lib/progress";

function RouteProgress() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    let finished = false;
    startProgress();
    const timer = setTimeout(() => {
      doneProgress();
      finished = true;
    }, 180);
    return () => {
      clearTimeout(timer);
      if (!finished) doneProgress();
    };
  }, [pathname, search]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteProgress />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/force-change-password" element={
          <ProtectedRoute>
            <ForceChangePassword />
          </ProtectedRoute>
        } />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/orders/kanban" element={<OrderKanban />} />
          <Route path="/orders/new" element={<CreateOrder />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/measurements" element={<Measurements />} />
          <Route path="/measurements/new" element={<CreateMeasurement />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/roles" element={<Roles />} />
          <Route path="/admin/history" element={<LoginHistory />} />
          <Route path="/admin/email-templates" element={<EmailTemplates />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
