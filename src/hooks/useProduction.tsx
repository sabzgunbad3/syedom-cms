import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Production {
  id: string;
  user_id: string;
  date: string;
  morning_quantity: number;
  evening_quantity: number;
  total_quantity: number;
  notes: string | null;
  created_at: string;
}

export function useProduction() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProduction = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("production")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setEntries(data as Production[]);
    } catch (error: any) {
      console.error("Error fetching production:", error);
      toast.error("Failed to load production data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProduction();
  }, [fetchProduction]);

  const addProduction = async (entry: { date: string; morning_quantity: number; evening_quantity: number; notes?: string }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("production")
        .insert({
          ...entry,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          // Unique violation - update instead
          const { data: updatedData, error: updateError } = await supabase
            .from("production")
            .update({
              morning_quantity: entry.morning_quantity,
              evening_quantity: entry.evening_quantity,
              notes: entry.notes,
            })
            .eq("user_id", user.id)
            .eq("date", entry.date)
            .select()
            .single();
          
          if (updateError) throw updateError;
          
          setEntries(prev => prev.map(e => e.date === entry.date ? (updatedData as Production) : e));
          toast.success("Production record updated");
          return updatedData;
        }
        throw error;
      }
      
      setEntries(prev => [data as Production, ...prev]);
      toast.success("Production record added");
      return data;
    } catch (error: any) {
      console.error("Error adding production:", error);
      toast.error("Failed to save production record");
      return null;
    }
  };

  const getTodayProduction = () => {
    const today = new Date().toISOString().split("T")[0];
    return entries.find(e => e.date === today);
  };

  const getWeeklyStats = () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyEntries = entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= weekAgo && entryDate <= today;
    });
    
    const total = weeklyEntries.reduce((sum, e) => sum + e.total_quantity, 0);
    const average = weeklyEntries.length > 0 ? Math.round(total / weeklyEntries.length) : 0;
    
    return { total, average, count: weeklyEntries.length };
  };

  return {
    entries,
    loading,
    fetchProduction,
    addProduction,
    getTodayProduction,
    getWeeklyStats,
  };
}
