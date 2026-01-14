import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Moon, Sun, Download } from "lucide-react";

export function Header() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newDark);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Benefits", href: "#benefits" },
    { label: "Pricing", href: "#pricing" },
  ];

  const handleNavClick = (href: string) => {
    setOpen(false);
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="Syedom DFMS Logo" 
            className="h-10 w-10 rounded-lg object-contain"
          />
          <div className="flex flex-col">
            <span className="font-serif font-bold text-lg leading-tight">Syedom.com</span>
            <span className="text-[10px] text-muted-foreground leading-tight">DFMS</span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link.href)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {showInstallPrompt && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleInstall}
              className="gap-2 border-primary text-primary"
            >
              <Download className="h-4 w-4" />
              Install App
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
          <Button variant="hero" onClick={() => navigate("/auth")}>
            Get Started Free
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-2 md:hidden">
          {showInstallPrompt && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleInstall}
              className="gap-1.5 h-9 px-3 border-primary text-primary"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Install</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-6 pt-8">
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => handleNavClick(link.href)}
                    className="text-lg font-medium text-left"
                  >
                    {link.label}
                  </button>
                ))}
                <div className="flex flex-col gap-3 pt-6 border-t">
                  <Button variant="outline" onClick={() => { setOpen(false); navigate("/auth"); }}>
                    Sign In
                  </Button>
                  <Button variant="hero" onClick={() => { setOpen(false); navigate("/auth"); }}>
                    Get Started Free
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}