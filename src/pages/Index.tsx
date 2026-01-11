import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Milk,
  Users,
  Truck,
  IndianRupee,
  Smartphone,
  Cloud,
  ArrowRight,
  Check,
} from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Milk,
      title: "Production Tracking",
      description: "Record daily milk production with morning and evening entries",
    },
    {
      icon: Users,
      title: "Customer Management",
      description: "Manage monthly subscribers and daily customers in one place",
    },
    {
      icon: Truck,
      title: "Delivery Tracking",
      description: "Track deliveries, handle shortages, and manage routes",
    },
    {
      icon: IndianRupee,
      title: "Payment Records",
      description: "Maintain complete payment history and pending dues",
    },
    {
      icon: Smartphone,
      title: "Works Offline",
      description: "Access your data even without internet connection",
    },
    {
      icon: Cloud,
      title: "Cloud Sync",
      description: "Your data is safely stored and synced across devices",
    },
  ];

  const benefits = [
    "Replace paper registers with digital records",
    "Calculate milk shortages automatically",
    "Track customer-wise delivery history",
    "Generate payment summaries instantly",
    "Works on phone, tablet, or computer",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
        
        <div className="relative container py-20 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6">
              <Milk className="h-5 w-5 text-primary-foreground" />
              <span className="text-sm font-medium text-primary-foreground">
                Digital Farm Management
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif text-primary-foreground mb-6 leading-tight">
              Modern Dairy Farm Management
            </h1>
            
            <p className="text-lg sm:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Replace paper registers with a simple, reliable digital system. 
              Track production, manage deliveries, and handle payments — all from your phone.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="xl"
                className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg"
                onClick={() => navigate("/auth")}
              >
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="border-2 border-white/30 text-primary-foreground hover:bg-white/10"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-serif mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete solution designed specifically for dairy farmers
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                variant="stat"
                className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-0">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold font-serif mb-6">
                Why Choose DairyFlow?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Built by understanding the real challenges faced by dairy farmers. 
                Simple, reliable, and works even in areas with poor connectivity.
              </p>
              
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                      <Check className="h-4 w-4 text-success" />
                    </div>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                variant="hero"
                size="lg"
                className="mt-8"
                onClick={() => navigate("/auth")}
              >
                Start Managing Your Farm
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            <div className="relative">
              <Card variant="elevated" className="p-6 sm:p-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center gap-3">
                      <Milk className="h-5 w-5 text-success" />
                      <span className="font-medium">Today's Production</span>
                    </div>
                    <span className="text-2xl font-bold text-success">450L</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-primary" />
                      <span className="font-medium">Active Customers</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">48</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <div className="flex items-center gap-3">
                      <IndianRupee className="h-5 w-5 text-accent" />
                      <span className="font-medium">This Month</span>
                    </div>
                    <span className="text-2xl font-bold text-accent">₹84,500</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 gradient-hero">
        <div className="container text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-primary-foreground mb-4">
            Ready to Go Paperless?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join hundreds of farmers who have simplified their daily operations with DairyFlow.
          </p>
          <Button
            size="xl"
            className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg"
            onClick={() => navigate("/auth")}
          >
            Create Free Account
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Milk className="h-5 w-5 text-primary" />
            <span className="font-serif font-bold">DairyFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            A modern digital solution for dairy farmers
          </p>
        </div>
      </footer>
    </div>
  );
}
