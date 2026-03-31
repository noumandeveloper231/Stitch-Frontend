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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
