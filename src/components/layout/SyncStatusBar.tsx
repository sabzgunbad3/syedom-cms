import { RefreshCw, Wifi, WifiOff, Check, AlertCircle, Cloud, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SyncStatus } from "@/hooks/useSyncEngine";
import { formatDistanceToNow } from "date-fns";

interface SyncStatusBarProps {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingCount: number;
  lastSyncTime: Date | null;
  onSync: () => void;
}

export function SyncStatusBar({
  isOnline,
  syncStatus,
  pendingCount,
  lastSyncTime,
  onSync,
}: SyncStatusBarProps) {
  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    switch (syncStatus) {
      case "syncing":
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case "synced":
        return <Check className="h-4 w-4" />;
      case "failed":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Cloud className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    if (!isOnline) return "Offline Mode";
    switch (syncStatus) {
      case "syncing":
        return "Syncing...";
      case "synced":
        return "Synced";
      case "failed":
        return "Sync Failed";
      default:
        return pendingCount > 0 ? `${pendingCount} pending` : "Ready";
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return "bg-warning/15 text-warning border-warning/30";
    switch (syncStatus) {
      case "syncing":
        return "bg-primary/15 text-primary border-primary/30";
      case "synced":
        return "bg-success/15 text-success border-success/30";
      case "failed":
        return "bg-destructive/15 text-destructive border-destructive/30";
      default:
        return pendingCount > 0 
          ? "bg-accent/15 text-accent border-accent/30" 
          : "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Main Status Badge */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border transition-all",
          getStatusColor()
        )}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
        
        {isOnline && syncStatus !== "syncing" && pendingCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 ml-1 hover:bg-transparent font-semibold"
            onClick={onSync}
          >
            Sync Now
          </Button>
        )}
      </div>

      {/* Last Sync Time - shown when online and synced */}
      {isOnline && syncStatus === "synced" && lastSyncTime && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Last synced {formatDistanceToNow(lastSyncTime, { addSuffix: true })}</span>
        </div>
      )}

      {/* Offline Badge - More prominent */}
      {!isOnline && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-warning/10 text-warning text-xs font-medium">
          <WifiOff className="h-3 w-3" />
          <span>Changes saved locally</span>
        </div>
      )}
    </div>
  );
}