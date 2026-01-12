import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Delivery {
  id: string;
  user_id: string;
  customer_id: string;
  date: string;
  quantity: number;
  is_delivered: boolean;
  shortage_reason: string | null;
  created_at: string;
  customer?: {
    name: string;
    daily_quantity: number;
  };
}

export function useDeliveries() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = useCallback(async (date?: string) => {
    if (!user) {
      setDeliveries([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("deliveries")
        .select(`
          *,
          customer:customers(name, daily_quantity)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (date) {
        query = query.eq("date", date);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDeliveries(data as unknown as Delivery[]);
    } catch (error: any) {
      console.error("Error fetching deliveries:", error);
      toast.error("Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const addDelivery = async (delivery: { customer_id: string; date: string; quantity: number; is_delivered: boolean; shortage_reason?: string }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("deliveries")
        .insert({
          ...delivery,
          user_id: user.id,
        })
        .select(`
          *,
          customer:customers(name, daily_quantity)
        `)
        .single();

      if (error) {
        if (error.code === "23505") {
          // Update existing delivery
          const { data: updatedData, error: updateError } = await supabase
            .from("deliveries")
            .update({
              quantity: delivery.quantity,
              is_delivered: delivery.is_delivered,
              shortage_reason: delivery.shortage_reason,
            })
            .eq("customer_id", delivery.customer_id)
            .eq("date", delivery.date)
            .select(`
              *,
              customer:customers(name, daily_quantity)
            `)
            .single();
          
          if (updateError) throw updateError;
          
          setDeliveries(prev => prev.map(d => 
            (d.customer_id === delivery.customer_id && d.date === delivery.date) 
              ? (updatedData as unknown as Delivery) 
              : d
          ));
          return updatedData;
        }
        throw error;
      }
      
      setDeliveries(prev => [data as unknown as Delivery, ...prev]);
      return data;
    } catch (error: any) {
      console.error("Error adding delivery:", error);
      toast.error("Failed to save delivery");
      return null;
    }
  };

  const getDeliveriesForDate = (date: string) => {
    return deliveries.filter(d => d.date === date);
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split("T")[0];
    const todayDeliveries = deliveries.filter(d => d.date === today);
    
    return {
      total: todayDeliveries.length,
      delivered: todayDeliveries.filter(d => d.is_delivered).length,
      totalQuantity: todayDeliveries.reduce((sum, d) => sum + d.quantity, 0),
    };
  };

  return {
    deliveries,
    loading,
    fetchDeliveries,
    addDelivery,
    getDeliveriesForDate,
    getTodayStats,
  };
}
