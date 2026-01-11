import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Smartphone, Share, Plus, Check, Download } from "lucide-react";

export default function Install() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container flex items-center h-16 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-serif text-xl font-bold">Install App</h1>
        </div>
      </header>

      <main className="container py-8 max-w-2xl animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl gradient-hero mb-4">
            <Smartphone className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold font-serif">Install DairyFlow</h2>
          <p className="text-muted-foreground mt-2">
            Add DairyFlow to your home screen for the best experience
          </p>
        </div>

        {/* Benefits */}
        <Card variant="stat" className="mb-8">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Why install the app?</h3>
            <ul className="space-y-3">
              {[
                "Quick access from your home screen",
                "Works offline in areas with poor connectivity",
                "Faster loading and smoother experience",
                "Receive important notifications",
                "No app store download required",
              ].map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <Check className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* iOS Instructions */}
        <Card variant="elevated" className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">On iPhone (Safari)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="font-semibold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Tap the Share button</p>
                <p className="text-sm text-muted-foreground">
                  At the bottom of Safari, tap the{" "}
                  <Share className="h-4 w-4 inline" /> share icon
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="font-semibold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">Add to Home Screen</p>
                <p className="text-sm text-muted-foreground">
                  Scroll down and tap "Add to Home Screen"
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="font-semibold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">Confirm</p>
                <p className="text-sm text-muted-foreground">
                  Tap "Add" in the top right corner
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Android Instructions */}
        <Card variant="elevated" className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">On Android (Chrome)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="font-semibold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Tap the Menu</p>
                <p className="text-sm text-muted-foreground">
                  Tap the three dots (⋮) in the top right corner
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="font-semibold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">Install App</p>
                <p className="text-sm text-muted-foreground">
                  Tap "Install app" or "Add to Home screen"
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="font-semibold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">Confirm Installation</p>
                <p className="text-sm text-muted-foreground">
                  Tap "Install" in the popup dialog
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          variant="hero"
          size="lg"
          className="w-full"
          onClick={() => navigate("/dashboard")}
        >
          Continue to Dashboard
        </Button>
      </main>
    </div>
  );
}
