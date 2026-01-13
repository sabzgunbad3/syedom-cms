import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Milk,
  Users,
  Truck,
  Smartphone,
  Cloud,
  ArrowRight,
  Check,
  Star,
  Shield,
  Zap,
} from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();

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
      icon: Shield,
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
    "Print invoices and receipts anytime",
  ];

  const testimonials = [
    {
      name: "Ramesh Kumar",
      role: "Dairy Farmer, Punjab",
      quote: "DairyFlow has simplified my daily operations. No more paper registers!",
      rating: 5,
    },
    {
      name: "Suresh Patel",
      role: "Farm Owner, Gujarat",
      quote: "The offline feature is amazing. Works perfectly in my village.",
      rating: 5,
    },
    {
      name: "Mohammed Ali",
      role: "Dairy Business, Karnataka",
      quote: "Managing 50+ customers is now a breeze. Highly recommended!",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />

        <div className="relative container py-20 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6">
              <Zap className="h-4 w-4 text-primary-foreground" />
              <span className="text-sm font-medium text-primary-foreground">
                100% Free • No Credit Card Required
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

            <p className="text-sm text-primary-foreground/60 mt-4">
              Join 1000+ farmers already using DairyFlow
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-secondary/30">
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
      <section id="benefits" className="py-20">
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
                      <Shield className="h-5 w-5 text-accent" />
                      <span className="font-medium">This Month</span>
                    </div>
                    <span className="text-2xl font-bold text-accent">{formatAmount(84500)}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-serif mb-4">
              Trusted by Farmers
            </h2>
            <p className="text-lg text-muted-foreground">
              See what other dairy farmers are saying about DairyFlow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} variant="elevated" className="p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">"{testimonial.quote}"</p>
                <div>
                  <p className="font-medium">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-serif mb-4">
              Simple Pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              DairyFlow is completely free to use
            </p>
          </div>

          <Card variant="elevated" className="p-8 text-center border-2 border-primary">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Zap className="h-4 w-4" />
              Free Forever
            </div>
            <h3 className="text-2xl font-bold mb-2">Free Plan</h3>
            <p className="text-4xl font-bold mb-6">{formatAmount(0)}<span className="text-lg text-muted-foreground">/month</span></p>
            <ul className="text-left space-y-3 mb-8">
              {[
                "Unlimited customers",
                "Unlimited deliveries",
                "Payment tracking",
                "Monthly reports & PDF export",
                "Offline support",
                "Works on all devices",
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button variant="hero" size="lg" className="w-full" onClick={() => navigate("/auth")}>
              Get Started Free
            </Button>
          </Card>
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

      <Footer />
    </div>
  );
}
