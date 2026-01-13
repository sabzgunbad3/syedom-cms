import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

const CURRENCIES: Record<string, Currency> = {
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee" },
  PKR: { code: "PKR", symbol: "Rs", name: "Pakistani Rupee" },
  USD: { code: "USD", symbol: "$", name: "US Dollar" },
  EUR: { code: "EUR", symbol: "€", name: "Euro" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound" },
  AED: { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  SAR: { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  BDT: { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
  NPR: { code: "NPR", symbol: "रू", name: "Nepalese Rupee" },
  LKR: { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee" },
  MYR: { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  IDR: { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  PHP: { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  THB: { code: "THB", symbol: "฿", name: "Thai Baht" },
  VND: { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
  CNY: { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  KRW: { code: "KRW", symbol: "₩", name: "South Korean Won" },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  CAD: { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  NZD: { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  ZAR: { code: "ZAR", symbol: "R", name: "South African Rand" },
  BRL: { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  MXN: { code: "MXN", symbol: "$", name: "Mexican Peso" },
  RUB: { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  TRY: { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  CHF: { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  SEK: { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  NOK: { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  DKK: { code: "DKK", symbol: "kr", name: "Danish Krone" },
  PLN: { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  EGP: { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
  KES: { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  NGN: { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  GHS: { code: "GHS", symbol: "₵", name: "Ghanaian Cedi" },
};

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  IN: "INR", PK: "PKR", US: "USD", GB: "GBP", DE: "EUR", FR: "EUR", IT: "EUR",
  ES: "EUR", NL: "EUR", BE: "EUR", AT: "EUR", IE: "EUR", PT: "EUR", GR: "EUR",
  FI: "EUR", SK: "EUR", SI: "EUR", EE: "EUR", LV: "EUR", LT: "EUR", CY: "EUR",
  MT: "EUR", LU: "EUR", AE: "AED", SA: "SAR", BD: "BDT", NP: "NPR", LK: "LKR",
  MY: "MYR", ID: "IDR", PH: "PHP", TH: "THB", VN: "VND", CN: "CNY", JP: "JPY",
  KR: "KRW", AU: "AUD", CA: "CAD", NZ: "NZD", ZA: "ZAR", BR: "BRL", MX: "MXN",
  RU: "RUB", TR: "TRY", CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN",
  EG: "EGP", KE: "KES", NG: "NGN", GH: "GHS",
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (code: string) => void;
  formatAmount: (amount: number) => string;
  currencies: Currency[];
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = "dairyflow_currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(CURRENCIES.INR);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectCurrency = async () => {
      // Check localStorage first
      const savedCurrency = localStorage.getItem(STORAGE_KEY);
      if (savedCurrency && CURRENCIES[savedCurrency]) {
        setCurrencyState(CURRENCIES[savedCurrency]);
        setLoading(false);
        return;
      }

      // Detect from IP
      try {
        const response = await fetch("https://ipapi.co/json/", { 
          signal: AbortSignal.timeout(3000) 
        });
        const data = await response.json();
        const countryCode = data.country_code;
        const currencyCode = COUNTRY_TO_CURRENCY[countryCode] || "USD";
        
        if (CURRENCIES[currencyCode]) {
          setCurrencyState(CURRENCIES[currencyCode]);
          localStorage.setItem(STORAGE_KEY, currencyCode);
        }
      } catch (error) {
        console.log("Currency detection failed, using default");
        // Default to INR for dairy app context
      }
      setLoading(false);
    };

    detectCurrency();
  }, []);

  const setCurrency = (code: string) => {
    if (CURRENCIES[code]) {
      setCurrencyState(CURRENCIES[code]);
      localStorage.setItem(STORAGE_KEY, code);
    }
  };

  const formatAmount = (amount: number) => {
    return `${currency.symbol}${amount.toLocaleString()}`;
  };

  return (
    <CurrencyContext.Provider 
      value={{ 
        currency, 
        setCurrency, 
        formatAmount, 
        currencies: Object.values(CURRENCIES),
        loading 
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
