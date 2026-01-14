import { Milk, Truck, Check, Clock, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useCurrency } from "@/contexts/CurrencyContext";

interface DeliveryStatsProps {
  availableMilk: number;
  totalScheduled: number;
  totalDelivered: number;
  pendingCount: number;
  missedCount: number;
}

export function DeliveryStats({
  availableMilk,
  totalScheduled,
  totalDelivered,
  pendingCount,
  missedCount,
}: DeliveryStatsProps) {
  const shortage = Math.max(0, totalScheduled - availableMilk);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card className="p-3 bg-card border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Milk className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Available</p>
            <p className="text-lg font-bold">{availableMilk}L</p>
          </div>
        </div>
      </Card>

      <Card className="p-3 bg-card border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
            <Truck className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Scheduled</p>
            <p className="text-lg font-bold">{totalScheduled}L</p>
          </div>
        </div>
      </Card>

      <Card className="p-3 bg-card border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center">
            <Check className="h-4 w-4 text-success" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Delivered</p>
            <p className="text-lg font-bold">{totalDelivered}L</p>
          </div>
        </div>
      </Card>

      <Card className="p-3 bg-card border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pending</p>
            <p className="text-lg font-bold">{pendingCount}</p>
          </div>
        </div>
      </Card>

      {/* Shortage alert */}
      {shortage > 0 && (
        <div className="col-span-2 sm:col-span-4 flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">Milk Shortage</p>
            <p className="text-xs text-muted-foreground">
              {shortage}L short for today's scheduled deliveries
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
