import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Milk, Building, User, Check, ArrowRight, ArrowLeft,
  Phone, MapPin, Globe
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { saveLocalProfile, addPendingAction, UserProfile } from "@/lib/offlineDB";
import { toast } from "sonner";

interface SetupWizardProps {
  open: boolean;
  onComplete: () => void;
  userId: string;
}

export function SetupWizard({ open, onComplete, userId }: SetupWizardProps) {
  const { currencies, setCurrency, currency } = useCurrency();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    farmName: "",
    phone: "",
    address: "",
    defaultRate: "60",
    currency: currency.code,
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!formData.fullName) {
      toast.error("Please enter your name");
      return;
    }

    setLoading(true);
    try {
      // STEP 1: Save profile LOCALLY FIRST (offline-first)
      const localProfile: UserProfile = {
        userId,
        fullName: formData.fullName,
        farmName: formData.farmName || null,
        phone: formData.phone || null,
        setupComplete: true,
        currency: formData.currency,
        defaultRate: parseFloat(formData.defaultRate) || 60,
      };
      
      await saveLocalProfile(localProfile);
      
      // Set currency preference locally
      setCurrency(formData.currency);
      localStorage.setItem("preferred_currency", formData.currency);
      
      // STEP 2: Try to sync to server (if online)
      if (navigator.onLine) {
        try {
          const { error } = await supabase
            .from("profiles")
            .upsert({
              user_id: userId,
              full_name: formData.fullName,
              farm_name: formData.farmName || null,
              phone: formData.phone || null,
            });

          if (error) {
            // Queue for later sync
            await addPendingAction({
              table: "profiles",
              action: "update",
              data: {
                user_id: userId,
                full_name: formData.fullName,
                farm_name: formData.farmName || null,
                phone: formData.phone || null,
              },
            });
          }
        } catch (error) {
          console.error("Failed to sync profile to server:", error);
          // Queue for later sync
          await addPendingAction({
            table: "profiles",
            action: "update",
            data: {
              user_id: userId,
              full_name: formData.fullName,
              farm_name: formData.farmName || null,
              phone: formData.phone || null,
            },
          });
        }
      } else {
        // Offline - queue for sync
        await addPendingAction({
          table: "profiles",
          action: "update",
          data: {
            user_id: userId,
            full_name: formData.fullName,
            farm_name: formData.farmName || null,
            phone: formData.phone || null,
          },
        });
      }
      
      toast.success("Welcome to DFMS! Your farm is ready.");
      onComplete();
    } catch (error: any) {
      console.error("Setup error:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "Personal Information",
      description: "Tell us about yourself",
      icon: User,
    },
    {
      title: "Farm Details",
      description: "Set up your dairy farm profile",
      icon: Building,
    },
    {
      title: "Preferences",
      description: "Customize your experience",
      icon: Globe,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto h-14 w-14 rounded-2xl gradient-hero flex items-center justify-center mb-4">
            <Milk className="h-7 w-7 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-serif">Welcome to DFMS!</DialogTitle>
          <DialogDescription>
            Let's set up your farm in just a few steps
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="py-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {steps.map((s, i) => (
              <div 
                key={i} 
                className={`flex items-center gap-1 text-xs ${i + 1 <= step ? "text-primary" : "text-muted-foreground"}`}
              >
                {i + 1 < step ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <s.icon className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="py-4 space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Your Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="+92 XXX XXXXXXX"
                    className="pl-10 h-12 text-base"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="farmName">Farm Name</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="farmName"
                    placeholder="e.g., Green Valley Dairy"
                    className="pl-10 h-12 text-base"
                    value={formData.farmName}
                    onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Farm Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    placeholder="Enter your farm location"
                    className="pl-10 h-12 text-base"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultRate">Default Rate per Liter</Label>
                <Input
                  id="defaultRate"
                  type="number"
                  placeholder="60"
                  className="h-12 text-base"
                  value={formData.defaultRate}
                  onChange={(e) => setFormData({ ...formData, defaultRate: e.target.value })}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>Select Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {currencies.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} - {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Currency has been auto-detected based on your location
                </p>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-medium mb-2">Quick Tips:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Add customers from the Customers page</li>
                  <li>• Record daily production in Production</li>
                  <li>• Track deliveries and payments easily</li>
                  <li>• Works offline - your data is always safe</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-4 border-t">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} className="h-12">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button 
            variant="hero" 
            className="flex-1 h-12 text-base" 
            onClick={step < totalSteps ? handleNext : handleComplete}
            disabled={loading || (step === 1 && !formData.fullName)}
          >
            {step < totalSteps ? (
              <>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                {loading ? "Setting up..." : "Start Using DFMS"}
                <Check className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
