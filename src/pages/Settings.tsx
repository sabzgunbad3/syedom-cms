import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { User, Building, Download, Smartphone, Moon, Sun, Palette } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getLocalProfile, saveLocalProfile, addPendingAction, UserProfile } from "@/lib/offlineDB";
import { supabase } from "@/integrations/supabase/client";

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Farm profile state - loaded from LOCAL storage (not defaults)
  const [formData, setFormData] = useState({
    farmName: "",
    ownerName: "",
    address: "",
    phone: "",
    defaultPrice: "",
  });

  // Load profile from LOCAL storage first (offline-first)
  useEffect(() => {
    const loadLocalProfile = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        const localProfile = await getLocalProfile(user.id);
        
        if (localProfile) {
          // USE LOCAL DATA - never show sample defaults after setup
          setFormData({
            farmName: localProfile.farmName || "",
            ownerName: localProfile.fullName || "",
            address: "", // Not stored in profile, could add later
            phone: localProfile.phone || "",
            defaultPrice: localProfile.defaultRate?.toString() || "",
          });
        }
        // If no local profile, leave form empty (don't show sample data)
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLocalProfile();
  }, [user?.id]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(savedTheme === "dark" || (!savedTheme && prefersDark));
  }, []);

  const toggleDarkMode = (enabled: boolean) => {
    setIsDarkMode(enabled);
    localStorage.setItem("theme", enabled ? "dark" : "light");
    document.documentElement.classList.toggle("dark", enabled);
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("Please log in to save settings");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Get existing profile to preserve setupComplete flag
      const existingProfile = await getLocalProfile(user.id);
      
      // SAVE LOCALLY FIRST (offline-first)
      const updatedProfile: UserProfile = {
        userId: user.id,
        fullName: formData.ownerName || existingProfile?.fullName || "",
        farmName: formData.farmName || null,
        phone: formData.phone || null,
        setupComplete: existingProfile?.setupComplete ?? true, // Preserve setup status
        currency: existingProfile?.currency || "PKR",
        defaultRate: parseFloat(formData.defaultPrice) || existingProfile?.defaultRate || 60,
      };
      
      await saveLocalProfile(updatedProfile);
      
      // Try to sync to server (if online)
      if (navigator.onLine) {
        try {
          await supabase
            .from("profiles")
            .upsert({
              user_id: user.id,
              full_name: formData.ownerName,
              farm_name: formData.farmName || null,
              phone: formData.phone || null,
            });
        } catch (error) {
          // Queue for later sync
          await addPendingAction({
            table: "profiles",
            action: "update",
            data: {
              user_id: user.id,
              full_name: formData.ownerName,
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
            user_id: user.id,
            full_name: formData.ownerName,
            farm_name: formData.farmName || null,
            phone: formData.phone || null,
          },
        });
      }
      
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout onLogout={() => navigate("/")}>
      <div className="space-y-6 animate-fade-in max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-serif">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your farm and account settings
          </p>
        </div>

        {/* Appearance */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how Syedom DFMS looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDarkMode ? (
                  <Moon className="h-5 w-5 text-primary" />
                ) : (
                  <Sun className="h-5 w-5 text-warning" />
                )}
                <div>
                  <Label htmlFor="darkMode" className="text-base font-medium">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Better for night usage and outdoor visibility
                  </p>
                </div>
              </div>
              <Switch
                id="darkMode"
                checked={isDarkMode}
                onCheckedChange={toggleDarkMode}
                className="scale-125"
              />
            </div>
          </CardContent>
        </Card>

        {/* Farm Profile */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Farm Profile
            </CardTitle>
            <CardDescription>
              Basic information about your dairy farm
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="farmName">Farm Name</Label>
                <Input 
                  id="farmName" 
                  placeholder="e.g., Green Valley Dairy" 
                  value={formData.farmName}
                  onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                  className="h-12 text-base" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input 
                  id="ownerName" 
                  placeholder="Your name" 
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="h-12 text-base" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Farm Address</Label>
              <Input 
                id="address" 
                placeholder="Full address" 
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="h-12 text-base" 
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  placeholder="+92 XXX XXXXXXX" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-12 text-base" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultPrice">Default Price per Liter</Label>
                <Input 
                  id="defaultPrice" 
                  type="number" 
                  placeholder="60" 
                  value={formData.defaultPrice}
                  onChange={(e) => setFormData({ ...formData, defaultPrice: e.target.value })}
                  className="h-12 text-base" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Settings
            </CardTitle>
            <CardDescription>
              Update your login credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="your@email.com" className="h-12 text-base" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" placeholder="••••••••" className="h-12 text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" placeholder="••••••••" className="h-12 text-base" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Install App */}
        <Card variant="bordered" className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Install Mobile App
            </CardTitle>
            <CardDescription>
              Install Syedom DFMS on your phone for quick access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Add Syedom DFMS to your home screen for the best mobile experience. 
              It works offline and feels just like a native app!
            </p>
            <Button variant="outline" size="lg" className="h-12" onClick={() => navigate("/install")}>
              <Smartphone className="h-4 w-4 mr-2" />
              Learn How to Install
            </Button>
          </CardContent>
        </Card>

        {/* Export Data */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
            <CardDescription>
              Download your farm records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="lg" className="h-12">
                <Download className="h-4 w-4 mr-2" />
                Export Customers
              </Button>
              <Button variant="outline" size="lg" className="h-12">
                <Download className="h-4 w-4 mr-2" />
                Export Deliveries
              </Button>
              <Button variant="outline" size="lg" className="h-12">
                <Download className="h-4 w-4 mr-2" />
                Export Payments
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pb-20 lg:pb-0">
          <Button 
            variant="hero" 
            size="lg" 
            className="h-14 text-base px-8" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}