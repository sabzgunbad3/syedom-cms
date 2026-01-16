import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { clearStore, addPendingAction } from "@/lib/offlineDB";

type DataType = "deliveries" | "payments" | "production" | "customers";

interface DeleteDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  dataType: DataType;
  title: string;
  description: string;
  onDeleted: () => void;
}

const DATA_TYPE_INFO: Record<DataType, { label: string; store: string }> = {
  deliveries: { label: "delivery records", store: "deliveries" },
  payments: { label: "payment records", store: "payments" },
  production: { label: "production entries", store: "production" },
  customers: { label: "customer records", store: "customers" },
};

export function DeleteDataDialog({
  open,
  onOpenChange,
  userId,
  dataType,
  title,
  description,
  onDeleted,
}: DeleteDataDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const info = DATA_TYPE_INFO[dataType];

  const handleDelete = async () => {
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      // Clear local store first (offline-first)
      await clearStore(info.store);

      // Delete from server if online
      if (navigator.onLine) {
        const { error } = await supabase
          .from(dataType)
          .delete()
          .eq("user_id", userId);

        if (error) {
          console.error(`Failed to delete ${dataType} from server:`, error);
          // Queue for retry
          await addPendingAction({
            table: dataType,
            action: "delete",
            data: { user_id: userId, _bulk_delete: true },
          });
        }
      } else {
        // Queue for sync when online
        await addPendingAction({
          table: dataType,
          action: "delete",
          data: { user_id: userId, _bulk_delete: true },
        });
      }

      toast.success(`All ${info.label} deleted successfully`);
      setConfirmed(false);
      onDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error(`Failed to delete ${dataType}:`, error);
      toast.error(`Failed to delete ${info.label}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center mb-2">
            <AlertTriangle className="h-6 w-6 text-warning" />
          </div>
          <AlertDialogTitle className="text-center">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/5 border border-warning/20">
            <Checkbox
              id="confirm-delete"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(!!checked)}
            />
            <Label
              htmlFor="confirm-delete"
              className="text-sm leading-tight cursor-pointer"
            >
              I understand that this will permanently delete all {info.label} and
              this action cannot be undone.
            </Label>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="h-12">Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            className="h-12"
            disabled={!confirmed || isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All {info.label.charAt(0).toUpperCase() + info.label.slice(1)}
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
