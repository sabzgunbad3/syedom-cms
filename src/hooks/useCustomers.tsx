import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  payment_type: "monthly" | "daily";
  daily_quantity: number;
  rate_per_liter: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCustomers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    if (!user) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setCustomers(data as Customer[]);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const addCustomer = async (customer: Omit<Customer, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          ...customer,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setCustomers(prev => [...prev, data as Customer]);
      toast.success(`Customer "${customer.name}" added successfully`);
      return data;
    } catch (error: any) {
      console.error("Error adding customer:", error);
      toast.error("Failed to add customer");
      return null;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const { error } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      toast.success("Customer updated successfully");
      return true;
    } catch (error: any) {
      console.error("Error updating customer:", error);
      toast.error("Failed to update customer");
      return false;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setCustomers(prev => prev.filter(c => c.id !== id));
      toast.success("Customer deleted successfully");
      return true;
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
      return false;
    }
  };

  return {
    customers,
    loading,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
