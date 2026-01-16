import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Milk, X, Minus, ChevronRight, ChevronLeft, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  daily_quantity: number;
  is_active: boolean;
}

interface LowMilkCustomer {
  customerId: string;
  quantity: number;
}

interface DailySmartPopupProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: {
    production: number;
    notReceived: string[];
    lowMilk: LowMilkCustomer[];
  }) => void;
  customers: Customer[];
  yesterdayProduction?: number;
  workflowMode: "quick" | "balanced" | "detailed";
}

export function DailySmartPopup({
  open,
  onClose,
  onComplete,
  customers,
  yesterdayProduction = 0,
  workflowMode,
}: DailySmartPopupProps) {
  const [step, setStep] = useState(1);
  const [production, setProduction] = useState(yesterdayProduction.toString());
  const [notReceivedIds, setNotReceivedIds] = useState<Set<string>>(new Set());
  const [lowMilkCustomers, setLowMilkCustomers] = useState<Map<string, number>>(new Map());
  const [showLowMilkStep, setShowLowMilkStep] = useState(false);

  const activeCustomers = useMemo(
    () => customers.filter((c) => c.is_active),
    [customers]
  );

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setProduction(yesterdayProduction.toString() || "");
      setNotReceivedIds(new Set());
      setLowMilkCustomers(new Map());
      setShowLowMilkStep(false);
    }
  }, [open, yesterdayProduction]);

  const toggleNotReceived = (customerId: string) => {
    setNotReceivedIds((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
        // Remove from low milk if marking as not received
        setLowMilkCustomers((lm) => {
          const newLm = new Map(lm);
          newLm.delete(customerId);
          return newLm;
        });
      }
      return next;
    });
  };

  const toggleLowMilk = (customerId: string, defaultQty: number) => {
    setLowMilkCustomers((prev) => {
      const next = new Map(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.set(customerId, Math.max(0.5, defaultQty - 0.5));
      }
      return next;
    });
  };

  const updateLowMilkQty = (customerId: string, qty: number) => {
    setLowMilkCustomers((prev) => {
      const next = new Map(prev);
      next.set(customerId, qty);
      return next;
    });
  };

  const handleComplete = () => {
    const lowMilk: LowMilkCustomer[] = Array.from(lowMilkCustomers.entries()).map(
      ([customerId, quantity]) => ({ customerId, quantity })
    );

    onComplete({
      production: parseFloat(production) || 0,
      notReceived: Array.from(notReceivedIds),
      lowMilk,
    });
  };

  const handleSkip = () => {
    // Skip means assume everything normal
    onComplete({
      production: parseFloat(production) || yesterdayProduction,
      notReceived: [],
      lowMilk: [],
    });
  };

  // For Quick Mode: Only step 1 (production) and step 2 (who didn't get milk)
  // For Balanced Mode: Add step 3 (who got less milk with +/- buttons)
  // For Detailed Mode: Same as balanced but with custom input fields

  const totalSteps = workflowMode === "quick" ? 2 : 3;

  const canProceed = () => {
    if (step === 1) return production !== "" && !isNaN(parseFloat(production));
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl gradient-hero flex items-center justify-center">
              <Milk className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-xl font-serif">
                Today's Milk Summary
              </DialogTitle>
              <DialogDescription className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-1 mb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i + 1 <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Step 1: Production */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="production" className="text-base font-medium">
                  How much milk was produced today?
                </Label>
                <div className="relative">
                  <Input
                    id="production"
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    value={production}
                    onChange={(e) => setProduction(e.target.value)}
                    placeholder="Enter quantity"
                    className="h-14 text-2xl font-semibold text-center pr-10"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
                    L
                  </span>
                </div>
                {yesterdayProduction > 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Yesterday: {yesterdayProduction}L
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Who didn't receive */}
          {step === 2 && (
            <div className="space-y-3 animate-fade-in">
              <Label className="text-base font-medium">
                Who did NOT get milk today?
              </Label>
              <p className="text-sm text-muted-foreground">
                Tap to mark customers who missed delivery
              </p>
              <ScrollArea className="h-[300px] -mx-2 px-2">
                <div className="space-y-2">
                  {activeCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => toggleNotReceived(customer.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98]",
                        notReceivedIds.has(customer.id)
                          ? "bg-destructive/10 border-destructive/30 ring-1 ring-destructive/20"
                          : "bg-card border-border hover:border-primary/30"
                      )}
                    >
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                          notReceivedIds.has(customer.id)
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-muted"
                        )}
                      >
                        {notReceivedIds.has(customer.id) ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <span className="text-sm font-medium">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.daily_quantity}L daily
                        </p>
                      </div>
                      {notReceivedIds.has(customer.id) && (
                        <span className="text-xs font-medium text-destructive">
                          Missed
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Step 3: Low milk (Balanced/Detailed) */}
          {step === 3 && workflowMode !== "quick" && (
            <div className="space-y-3 animate-fade-in">
              <Label className="text-base font-medium">
                Who got LESS milk today?
              </Label>
              <p className="text-sm text-muted-foreground">
                Adjust quantity for partial deliveries (optional)
              </p>
              <ScrollArea className="h-[300px] -mx-2 px-2">
                <div className="space-y-2">
                  {activeCustomers
                    .filter((c) => !notReceivedIds.has(c.id))
                    .map((customer) => {
                      const isLow = lowMilkCustomers.has(customer.id);
                      const qty = lowMilkCustomers.get(customer.id) ?? customer.daily_quantity;

                      return (
                        <div
                          key={customer.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-all",
                            isLow
                              ? "bg-warning/10 border-warning/30"
                              : "bg-card border-border"
                          )}
                        >
                          <button
                            onClick={() => toggleLowMilk(customer.id, customer.daily_quantity)}
                            className={cn(
                              "h-6 w-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                              isLow
                                ? "bg-warning border-warning"
                                : "border-muted-foreground/40"
                            )}
                          >
                            {isLow && <Minus className="h-3 w-3 text-warning-foreground" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Default: {customer.daily_quantity}L
                            </p>
                          </div>
                          {isLow && (
                            <div className="flex items-center gap-1">
                              {workflowMode === "detailed" ? (
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.5"
                                  min="0"
                                  max={customer.daily_quantity}
                                  value={qty}
                                  onChange={(e) =>
                                    updateLowMilkQty(customer.id, parseFloat(e.target.value) || 0)
                                  }
                                  className="w-16 h-8 text-center text-sm"
                                />
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() =>
                                      updateLowMilkQty(
                                        customer.id,
                                        Math.max(0.5, qty - 0.5)
                                      )
                                    }
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-10 text-center text-sm font-medium">
                                    {qty}L
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() =>
                                      updateLowMilkQty(
                                        customer.id,
                                        Math.min(customer.daily_quantity - 0.5, qty + 0.5)
                                      )
                                    }
                                  >
                                    <span className="text-lg">+</span>
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-4 border-t mt-4">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="h-12"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}

          <div className="flex-1 flex gap-2">
            <Button
              variant="ghost"
              className="h-12 text-muted-foreground"
              onClick={handleSkip}
            >
              Skip for Today
            </Button>

            {step < totalSteps ? (
              <Button
                variant="hero"
                className="flex-1 h-12"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                variant="hero"
                className="flex-1 h-12"
                onClick={handleComplete}
              >
                <Check className="h-4 w-4 mr-2" />
                Save & Continue
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
