import { Check, X, CheckSquare, Square, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export type FilterType = "all" | "delivered" | "missed" | "custom" | "pending";

interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  pendingCount: number;
  filter: FilterType;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDeliver: () => void;
  onBulkMissed: () => void;
  onFilterChange: (filter: FilterType) => void;
  disabled?: boolean;
}

export function BulkActions({
  selectedCount,
  totalCount,
  pendingCount,
  filter,
  onSelectAll,
  onDeselectAll,
  onBulkDeliver,
  onBulkMissed,
  onFilterChange,
  disabled,
}: BulkActionsProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-xl">
      {/* Selection controls */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-2 text-xs"
        onClick={allSelected ? onDeselectAll : onSelectAll}
      >
        {allSelected ? (
          <>
            <CheckSquare className="h-4 w-4" />
            Deselect All
          </>
        ) : (
          <>
            <Square className="h-4 w-4" />
            Select All
          </>
        )}
      </Button>

      {selectedCount > 0 && (
        <span className="text-xs text-muted-foreground">
          {selectedCount} selected
        </span>
      )}

      <div className="flex-1" />

      {/* Filter dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
            <Filter className="h-3.5 w-3.5" />
            {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onFilterChange("all")}>
            All Customers
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange("pending")}>
            Pending Only
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange("delivered")}>
            Delivered Only
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange("missed")}>
            Missed Only
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange("custom")}>
            Custom Qty Only
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Bulk action buttons */}
      <Button
        size="sm"
        variant="default"
        className="h-8 gap-1.5 text-xs bg-success hover:bg-success/90"
        onClick={onBulkDeliver}
        disabled={disabled || (selectedCount === 0 && pendingCount === 0)}
      >
        <Check className="h-3.5 w-3.5" />
        {selectedCount > 0 ? `Deliver (${selectedCount})` : "Deliver All"}
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1.5 text-xs border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
        onClick={onBulkMissed}
        disabled={disabled || (selectedCount === 0 && pendingCount === 0)}
      >
        <X className="h-3.5 w-3.5" />
        {selectedCount > 0 ? `Missed (${selectedCount})` : "Miss All"}
      </Button>
    </div>
  );
}
