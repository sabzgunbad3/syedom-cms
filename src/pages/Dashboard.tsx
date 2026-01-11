import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Milk,
  Users,
  Truck,
  IndianRupee,
  Plus,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  // Mock data - will be replaced with real data from database
  const stats = {
    todayProduction: 450,
    totalCustomers: 48,
    todayDeliveries: 42,
    pendingPayments: 15600,
  };

  const recentDeliveries = [
    { customer: "Sharma Family", quantity: 2, time: "6:30 AM", status: "delivered" },
    { customer: "Gupta Store", quantity: 10, time: "7:00 AM", status: "delivered" },
    { customer: "Singh Household", quantity: 1.5, time: "7:30 AM", status: "pending" },
    { customer: "Patel Dairy Shop", quantity: 15, time: "8:00 AM", status: "delivered" },
  ];

  const alerts = [
    { message: "Low milk production today - 50L shortage", type: "warning" },
    { message: "3 customers have pending payments > 30 days", type: "info" },
  ];

  return (
    <DashboardLayout onLogout={() => navigate("/")}>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your farm overview for today.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/production")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Production
            </Button>
            <Button variant="hero" onClick={() => navigate("/deliveries")}>
              <Truck className="h-4 w-4 mr-2" />
              Start Deliveries
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard
            title="Today's Production"
            value={`${stats.todayProduction}L`}
            subtitle="Milk collected"
            icon={<Milk className="h-6 w-6" />}
            trend={{ value: 12, label: "vs yesterday" }}
          />
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            subtitle="Active subscribers"
            icon={<Users className="h-6 w-6" />}
            trend={{ value: 4, label: "this month" }}
          />
          <StatCard
            title="Today's Deliveries"
            value={`${stats.todayDeliveries}/${stats.totalCustomers}`}
            subtitle="Completed"
            icon={<Truck className="h-6 w-6" />}
          />
          <StatCard
            title="Pending Payments"
            value={`₹${stats.pendingPayments.toLocaleString()}`}
            subtitle="To be collected"
            icon={<IndianRupee className="h-6 w-6" />}
            trend={{ value: -8, label: "vs last week" }}
          />
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20"
              >
                <AlertCircle className="h-5 w-5 text-warning shrink-0" />
                <p className="text-sm font-medium">{alert.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Deliveries */}
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Deliveries</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/deliveries")}>
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDeliveries.map((delivery, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{delivery.customer}</p>
                        <p className="text-sm text-muted-foreground">{delivery.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{delivery.quantity}L</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          delivery.status === "delivered"
                            ? "bg-success/10 text-success"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {delivery.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start h-14"
                onClick={() => navigate("/customers")}
              >
                <Users className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Add New Customer</p>
                  <p className="text-xs text-muted-foreground">Register a new milk subscriber</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-14"
                onClick={() => navigate("/production")}
              >
                <Milk className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Record Production</p>
                  <p className="text-xs text-muted-foreground">Log today's milk collection</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-14"
                onClick={() => navigate("/payments")}
              >
                <IndianRupee className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Record Payment</p>
                  <p className="text-xs text-muted-foreground">Add payment from customer</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
