import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Milk, TrendingUp, Calendar, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProduction } from "@/hooks/useProduction";

export default function Production() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { entries, loading, addProduction, getWeeklyStats } = useProduction();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newEntry, setNewEntry] = useState({
    morningQuantity: "",
    eveningQuantity: "",
    notes: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleAddEntry = async () => {
    if (!newEntry.morningQuantity && !newEntry.eveningQuantity) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addProduction({
        date: selectedDate,
        morning_quantity: parseFloat(newEntry.morningQuantity) || 0,
        evening_quantity: parseFloat(newEntry.eveningQuantity) || 0,
        notes: newEntry.notes || undefined,
      });
      
      setNewEntry({ morningQuantity: "", eveningQuantity: "", notes: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const weeklyStats = getWeeklyStats();
  const todayEntry = entries.find(e => e.date === new Date().toISOString().split("T")[0]);

  if (authLoading) {
    return (
      <DashboardLayout onLogout={handleLogout}>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-serif">Milk Production</h1>
          <p className="text-muted-foreground mt-1">
            Track your daily milk production
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="stat" className="p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Milk className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Total</p>
                <p className="text-2xl font-bold font-serif">
                  {loading ? "..." : `${todayEntry?.total_quantity || 0}L`}
                </p>
              </div>
            </div>
          </Card>
          <Card variant="stat" className="p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weekly Average</p>
                <p className="text-2xl font-bold font-serif">
                  {loading ? "..." : `${weeklyStats.average}L/day`}
                </p>
              </div>
            </div>
          </Card>
          <Card variant="stat" className="p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold font-serif">
                  {loading ? "..." : `${weeklyStats.total}L`}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Add Production Form */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Record Today's Production
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="morning" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Morning (L)
                </Label>
                <Input
                  id="morning"
                  type="number"
                  placeholder="e.g., 280"
                  value={newEntry.morningQuantity}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, morningQuantity: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evening" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Evening (L)
                </Label>
                <Input
                  id="evening"
                  type="number"
                  placeholder="e.g., 170"
                  value={newEntry.eveningQuantity}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, eveningQuantity: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Any remarks..."
                  value={newEntry.notes}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <Button 
              variant="hero" 
              className="mt-6" 
              onClick={handleAddEntry}
              disabled={isSubmitting || (!newEntry.morningQuantity && !newEntry.eveningQuantity)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Save Production Record
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Production History */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Production History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : entries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                        Morning
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                        Evening
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                        Total
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.slice(0, 15).map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          {new Date(entry.date).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </td>
                        <td className="py-4 px-4 text-right font-medium">
                          {entry.morning_quantity}L
                        </td>
                        <td className="py-4 px-4 text-right font-medium">
                          {entry.evening_quantity}L
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-bold text-primary">
                            {entry.total_quantity}L
                          </span>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {entry.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No production records yet. Add your first entry above!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
