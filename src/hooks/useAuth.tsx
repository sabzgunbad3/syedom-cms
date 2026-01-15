import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import {
  initDB,
  saveLocalSession,
  getLocalSession,
  clearLocalSession,
  getLocalProfile,
  isSetupComplete,
  isAppSetupComplete,
  clearAllData,
  LocalSession,
} from "@/lib/offlineDB";

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
  isOfflineSession: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isOfflineSession, setIsOfflineSession] = useState(false);
  const initialized = useRef(false);

  // Check admin role (only when online)
  const checkAdminRole = useCallback(async (userId: string) => {
    if (!navigator.onLine) return false;
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

  // Restore session from local storage (OFFLINE-FIRST)
  const restoreLocalSession = useCallback(async (): Promise<boolean> => {
    try {
      await initDB();
      
      // STEP 1: Check GLOBAL app state first (before any user-specific data)
      const globalSetupDone = await isAppSetupComplete();
      
      const localSession = await getLocalSession();
      
      if (localSession && localSession.userId) {
        // Check if session is still valid (not expired)
        if (localSession.expiresAt > Date.now()) {
          // Create a minimal user object for offline mode
          const offlineUser: User = {
            id: localSession.userId,
            email: localSession.email,
            app_metadata: {},
            user_metadata: {},
            aud: "authenticated",
            created_at: new Date(localSession.createdAt).toISOString(),
          } as User;
          
          setUser(offlineUser);
          setIsOfflineSession(true);
          
          // Use global app state for setup check (most reliable)
          // Falls back to user profile check if global state missing
          const setupDone = globalSetupDone || await isSetupComplete(localSession.userId);
          setIsFirstLogin(!setupDone);
          
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Failed to restore local session:", error);
      return false;
    }
  }, []);

  // Save session to local storage
  const persistSession = useCallback(async (currentSession: Session) => {
    const localSession: LocalSession = {
      userId: currentSession.user.id,
      email: currentSession.user.email || "",
      accessToken: currentSession.access_token,
      refreshToken: currentSession.refresh_token,
      expiresAt: currentSession.expires_at ? currentSession.expires_at * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
    };
    await saveLocalSession(localSession);
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let mounted = true;

    const initAuth = async () => {
      // STEP 1: Try to restore from local session first (OFFLINE-FIRST)
      const hasLocalSession = await restoreLocalSession();
      
      if (!navigator.onLine) {
        // Offline: use local session if available
        if (!hasLocalSession) {
          setLoading(false);
        } else {
          setLoading(false);
        }
        return;
      }

      // STEP 2: Online - Set up Supabase auth listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          if (!mounted) return;

          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
            setIsOfflineSession(false);

            // Persist session locally for offline use
            await persistSession(currentSession);

            // Check admin status (defer to avoid blocking)
            setTimeout(async () => {
              if (!mounted) return;
              const adminStatus = await checkAdminRole(currentSession.user.id);
              setIsAdmin(adminStatus);
              
              // Check setup status - GLOBAL first, then user-specific
              const globalSetupDone = await isAppSetupComplete();
              const setupDone = globalSetupDone || await isSetupComplete(currentSession.user.id);
              setIsFirstLogin(!setupDone);
            }, 0);
          } else if (event === "SIGNED_OUT") {
            setSession(null);
            setUser(null);
            setIsAdmin(false);
            setIsFirstLogin(false);
            setIsOfflineSession(false);
          }

          setLoading(false);
        }
      );

      // STEP 3: Get initial session from Supabase
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          setIsOfflineSession(false);
          
          // Persist session locally
          await persistSession(initialSession);

          // Check admin and setup status
          checkAdminRole(initialSession.user.id).then((adminStatus) => {
            if (mounted) setIsAdmin(adminStatus);
          });
          
          // Check setup status - GLOBAL first
          const globalSetupDone = await isAppSetupComplete();
          const setupDone = globalSetupDone || await isSetupComplete(initialSession.user.id);
          setIsFirstLogin(!setupDone);
        } else if (!hasLocalSession) {
          // No session anywhere - user needs to log in
          setUser(null);
          setSession(null);
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to get session:", error);
        // If online check fails but we have local session, use that
        if (!hasLocalSession) {
          setLoading(false);
        }
      }

      return () => {
        subscription.unsubscribe();
      };
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [restoreLocalSession, persistSession, checkAdminRole]);

  // Handle online/offline transitions
  useEffect(() => {
    const handleOnline = async () => {
      if (isOfflineSession && user) {
        // Try to refresh session with server
        try {
          const { data: { session: freshSession } } = await supabase.auth.getSession();
          if (freshSession) {
            setSession(freshSession);
            setUser(freshSession.user);
            setIsOfflineSession(false);
            await persistSession(freshSession);
          }
        } catch (error) {
          console.error("Failed to refresh session:", error);
        }
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [isOfflineSession, user, persistSession]);

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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.session) {
      // Persist session immediately for offline use
      await persistSession(data.session);
      
      // Check if first login - GLOBAL first
      const globalSetupDone = await isAppSetupComplete();
      const setupDone = globalSetupDone || await isSetupComplete(data.user.id);
      setIsFirstLogin(!setupDone);
    }
    
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    // Clear all local data first
    await clearAllData();
    await clearLocalSession();
    
    // Then sign out from Supabase (if online)
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Failed to sign out from server:", error);
    }
    
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsFirstLogin(false);
    setIsOfflineSession(false);
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
        isOfflineSession,
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
