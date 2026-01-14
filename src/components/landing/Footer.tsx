import { Mail } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Mobile App", href: "/install" },
    ],
    support: [
      { label: "Help Center", href: "#" },
      { label: "Contact Us", href: "#" },
      { label: "FAQs", href: "#" },
    ],
    legal: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  };

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img 
                src="/logo.png" 
                alt="Syedom DFMS Logo" 
                className="h-10 w-10 rounded-lg object-contain"
              />
              <div className="flex flex-col">
                <span className="font-serif font-bold text-lg leading-tight">Syedom.com</span>
                <span className="text-[10px] text-muted-foreground leading-tight">DFMS</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              A free and simple dairy farm management system. Track production, deliveries, and payments effortlessly.
            </p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="mailto:support@syedom.com" className="flex items-center gap-2 hover:text-primary">
                <Mail className="h-4 w-4" />
                support@syedom.com
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Syedom.com – DFMS. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Made with ❤️ for dairy farmers worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}