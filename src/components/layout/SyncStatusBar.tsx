import { RefreshCw, Wifi, WifiOff, Check, AlertCircle, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SyncStatus } from "@/hooks/useSyncEngine";

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
    if (!isOnline) return "bg-warning/10 text-warning border-warning/20";
    switch (syncStatus) {
      case "syncing":
        return "bg-primary/10 text-primary border-primary/20";
      case "synced":
        return "bg-success/10 text-success border-success/20";
      case "failed":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
        getStatusColor()
      )}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      
      {isOnline && syncStatus !== "syncing" && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 ml-1 hover:bg-transparent"
          onClick={onSync}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
