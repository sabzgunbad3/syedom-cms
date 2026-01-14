import { useState, memo } from "react";
import { Minus, Plus, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface DeliveryItem {
  customerId: string;
  customerName: string;
  defaultQuantity: number;
  currentQuantity: number | null;
  status: "pending" | "delivered" | "missed" | "custom";
  isSelected: boolean;
}

interface DeliveryCardProps {
  item: DeliveryItem;
  isProcessing: boolean;
  onMinus: (customerId: string) => void;
  onPlus: (customerId: string) => void;
  onCustom: (customerId: string, quantity: number) => void;
  onSelect: (customerId: string) => void;
}

export const DeliveryCard = memo(function DeliveryCard({
  item,
  isProcessing,
  onMinus,
  onPlus,
  onCustom,
  onSelect,
}: DeliveryCardProps) {
  const [customValue, setCustomValue] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleCustomSubmit = () => {
    const qty = parseFloat(customValue);
    if (!isNaN(qty) && qty > 0) {
      onCustom(item.customerId, qty);
      setShowCustomInput(false);
      setCustomValue("");
    }
  };

  const getStatusStyles = () => {
    switch (item.status) {
      case "delivered":
        return "bg-success/10 border-success/30 ring-1 ring-success/20";
      case "missed":
        return "bg-destructive/10 border-destructive/30 ring-1 ring-destructive/20";
      case "custom":
        return "bg-primary/10 border-primary/30 ring-1 ring-primary/20";
      default:
        return "bg-card border-border hover:border-primary/30";
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 active:scale-[0.99]",
        getStatusStyles()
      )}
    >
      {/* Selection checkbox */}
      <button
        onClick={() => onSelect(item.customerId)}
        className={cn(
          "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
          item.isSelected
            ? "bg-primary border-primary"
            : "border-muted-foreground/40 hover:border-primary"
        )}
      >
        {item.isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
      </button>

      {/* Customer info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm">{item.customerName}</p>
        <p className="text-xs text-muted-foreground">
          {item.status === "pending" ? (
            `${item.defaultQuantity}L default`
          ) : item.status === "missed" ? (
            <span className="text-destructive">Missed</span>
          ) : (
            <span className={item.status === "custom" ? "text-primary" : "text-success"}>
              {item.currentQuantity}L delivered
            </span>
          )}
        </p>
      </div>

      {/* Action buttons */}
      {item.status === "pending" ? (
        <div className="flex items-center gap-2">
          {showCustomInput ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                inputMode="decimal"
                step="0.5"
                min="0"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Qty"
                className="w-16 h-9 text-center"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCustomSubmit();
                  if (e.key === "Escape") setShowCustomInput(false);
                }}
              />
              <Button
                size="sm"
                className="h-9 w-9 p-0"
                onClick={handleCustomSubmit}
                disabled={!customValue || isProcessing}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 w-9 p-0"
                onClick={() => setShowCustomInput(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              {/* Minus button - Mark as missed */}
              <Button
                size="sm"
                variant="outline"
                className="h-10 w-10 p-0 rounded-full border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground active:scale-90 transition-transform"
                onClick={() => onMinus(item.customerId)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Minus className="h-5 w-5" />
                )}
              </Button>

              {/* Custom input trigger */}
              <Button
                size="sm"
                variant="outline"
                className="h-10 px-3 text-xs font-medium"
                onClick={() => setShowCustomInput(true)}
                disabled={isProcessing}
              >
                {item.defaultQuantity}L
              </Button>

              {/* Plus button - Deliver default */}
              <Button
                size="sm"
                variant="outline"
                className="h-10 w-10 p-0 rounded-full border-success/30 text-success hover:bg-success hover:text-success-foreground active:scale-90 transition-transform"
                onClick={() => onPlus(item.customerId)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </Button>
            </>
          )}
        </div>
      ) : (
        /* Status badge for completed deliveries */
        <div
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium",
            item.status === "delivered" && "bg-success/20 text-success",
            item.status === "missed" && "bg-destructive/20 text-destructive",
            item.status === "custom" && "bg-primary/20 text-primary"
          )}
        >
          {item.status === "missed" ? "Missed" : `${item.currentQuantity}L`}
        </div>
      )}
    </div>
  );
});
