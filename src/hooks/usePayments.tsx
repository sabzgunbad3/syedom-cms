import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Payment {
  id: string;
  user_id: string;
  customer_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
  customer?: {
    name: string;
  };
}

export function usePayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    if (!user) {
      setPayments([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          customer:customers(name)
        `)
        .eq("user_id", user.id)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      setPayments(data as unknown as Payment[]);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const addPayment = async (payment: { customer_id: string; amount: number; payment_date: string; notes?: string }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("payments")
        .insert({
          ...payment,
          user_id: user.id,
        })
        .select(`
          *,
          customer:customers(name)
        `)
        .single();

      if (error) throw error;
      
      setPayments(prev => [data as unknown as Payment, ...prev]);
      toast.success("Payment recorded successfully");
      return data;
    } catch (error: any) {
      console.error("Error adding payment:", error);
      toast.error("Failed to record payment");
      return null;
    }
  };

  const getTotalReceived = () => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  };

  const getMonthlyStats = (year: number, month: number) => {
    const monthlyPayments = payments.filter(p => {
      const date = new Date(p.payment_date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
    
    return {
      total: monthlyPayments.reduce((sum, p) => sum + p.amount, 0),
      count: monthlyPayments.length,
    };
  };

  return {
    payments,
    loading,
    fetchPayments,
    addPayment,
    getTotalReceived,
    getMonthlyStats,
  };
}
