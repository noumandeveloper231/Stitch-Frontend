import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../api/client";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { User, Clock, CheckCircle2, ListTodo, ExternalLink } from "lucide-react";

export default function EmployeeDashboard() {
  const { employee } = useEmployeeAuth();
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingTasks(true);
      try {
        const { data } = await api.get("/employee-auth/tasks");
        setTasks(data.data || []);
      } catch (e) {
        toast.error("Failed to load tasks");
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    })();
  }, []);

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const stats = [
    {
      title: "Status",
      value: employee?.status || "Active",
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      borderColor: "border-l-emerald-500",
    },
    {
      title: "Pending Tasks",
      value: pendingTasks.length,
      icon: ListTodo,
      iconColor: "text-amber-600",
      borderColor: "border-l-amber-500",
    },
    {
      title: "In Progress",
      value: inProgressTasks.length,
      icon: Clock,
      iconColor: "text-blue-600",
      borderColor: "border-l-blue-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
          Welcome, {employee?.firstName}!
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Here's your employee dashboard overview.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className={`rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm border-l-4 ${stat.borderColor}`}
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-zinc-500">{stat.title}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 capitalize">
                {typeof stat.value === "number" ? stat.value : stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-zinc-400" /> My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTasks ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
              <ListTodo className="mb-2 h-8 w-8 opacity-30" />
              <p className="text-sm">No tasks assigned yet.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Task</th>
                    <th className="px-4 py-2 text-left font-medium">Order</th>
                    <th className="px-4 py-2 text-center font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {tasks.map((task) => (
                    <tr key={task._id} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-2 text-zinc-700">{task.taskName}</td>
                      <td className="px-4 py-2">
                        {task.orderId ? (
                          <Link
                            to={`/employee/orders/${task.orderId._id || task.orderId}`}
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            Order #
                            {String(task.orderId._id || task.orderId).slice(-6).toUpperCase()}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Badge className="capitalize text-xs" status={task.status}>
                          {task.status?.replace("_", " ")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span className="text-zinc-500">Name</span>
              <span className="font-medium text-zinc-900">
                {employee?.firstName} {employee?.lastName}
              </span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span className="text-zinc-500">Email</span>
              <span className="font-medium text-zinc-900">{employee?.email}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span className="text-zinc-500">Phone</span>
              <span className="font-medium text-zinc-900">
                {employee?.phone || "Not set"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
