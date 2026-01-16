import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { clearAllData } from "@/lib/offlineDB";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onDeleted: () => void;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  userId,
  onDeleted,
}: DeleteAccountDialogProps) {
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [agreements, setAgreements] = useState({
    understand: false,
    permanent: false,
    backup: false,
  });

  const allAgreed = agreements.understand && agreements.permanent && agreements.backup;
  const confirmMatch = confirmText.toLowerCase() === "delete my account";

  const handleDelete = async () => {
    if (!allAgreed || !confirmMatch) return;

    setIsDeleting(true);
    try {
      // Delete all user data from database (if online)
      if (navigator.onLine) {
        await Promise.all([
          supabase.from("deliveries").delete().eq("user_id", userId),
          supabase.from("payments").delete().eq("user_id", userId),
          supabase.from("production").delete().eq("user_id", userId),
          supabase.from("customers").delete().eq("user_id", userId),
          supabase.from("profiles").delete().eq("user_id", userId),
        ]);
      }

      // Clear all local data
      await clearAllData();

      // Sign out
      await supabase.auth.signOut();

      toast.success("Account deleted successfully");
      onDeleted();
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const resetDialog = () => {
    setStep(1);
    setConfirmText("");
    setAgreements({ understand: false, permanent: false, backup: false });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetDialog();
        onOpenChange(o);
      }}
    >
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Delete Your Account?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            This action is <strong>permanent</strong> and cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 space-y-3">
              <p className="text-sm font-medium text-destructive">
                The following data will be permanently deleted:
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Your farm profile and settings</li>
                <li>• All customer records</li>
                <li>• All delivery history</li>
                <li>• All payment records</li>
                <li>• All production data</li>
                <li>• Local offline data</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="understand"
                  checked={agreements.understand}
                  onCheckedChange={(checked) =>
                    setAgreements({ ...agreements, understand: !!checked })
                  }
                />
                <Label htmlFor="understand" className="text-sm leading-tight cursor-pointer">
                  I understand that all my farm data will be deleted
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="permanent"
                  checked={agreements.permanent}
                  onCheckedChange={(checked) =>
                    setAgreements({ ...agreements, permanent: !!checked })
                  }
                />
                <Label htmlFor="permanent" className="text-sm leading-tight cursor-pointer">
                  I understand this action is permanent and cannot be reversed
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="backup"
                  checked={agreements.backup}
                  onCheckedChange={(checked) =>
                    setAgreements({ ...agreements, backup: !!checked })
                  }
                />
                <Label htmlFor="backup" className="text-sm leading-tight cursor-pointer">
                  I have exported any data I need to keep
                </Label>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-sm">
                Type <strong>"delete my account"</strong> to confirm:
              </Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="delete my account"
                className="h-12"
                autoComplete="off"
              />
            </div>
          </div>
        )}

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="h-12">Cancel</AlertDialogCancel>
          
          {step === 1 ? (
            <Button
              variant="destructive"
              className="h-12"
              disabled={!allAgreed}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="destructive"
              className="h-12"
              disabled={!confirmMatch || isDeleting}
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
                  Delete My Account
                </>
              )}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
