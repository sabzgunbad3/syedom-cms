import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isFirstLogin: boolean;
  setIsFirstLogin: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FIRST_LOGIN_KEY = "dairyflow_setup_complete";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  const checkAdminRole = useCallback(async (userId: string) => {
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      return roles?.some((r) => r.role === "admin") ?? false;
    } catch {
      return false;
    }
  }, []);

  const checkFirstLogin = useCallback((userId: string) => {
    const setupComplete = localStorage.getItem(FIRST_LOGIN_KEY);
    return !setupComplete;
  }, []);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(async () => {
            if (!mounted) return;
            const adminStatus = await checkAdminRole(currentSession.user.id);
            setIsAdmin(adminStatus);
            
            const firstLogin = checkFirstLogin(currentSession.user.id);
            setIsFirstLogin(firstLogin);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsFirstLogin(false);
        }

        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mounted) return;

      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        checkAdminRole(initialSession.user.id).then((adminStatus) => {
          if (mounted) setIsAdmin(adminStatus);
        });
        
        const firstLogin = checkFirstLogin(initialSession.user.id);
        setIsFirstLogin(firstLogin);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkAdminRole, checkFirstLogin]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (!error) {
      setIsFirstLogin(true);
    }
    
    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsFirstLogin(false);
    // Clear any cached data
    localStorage.removeItem("dairyflow_offline_data");
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session, 
        loading, 
        signUp, 
        signIn, 
        signOut, 
        isAdmin,
        isFirstLogin,
        setIsFirstLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
