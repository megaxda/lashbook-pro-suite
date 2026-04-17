import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { demoProfile, DEMO_USER_ID } from '@/data/demoData';

interface Profile {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  foto_url: string | null;
  slug: string | null;
  role: string;
  bio: string | null;
  studio_name: string | null;
  studio_hours: any;
  follow_up_days: number | null;
  pix_key: string | null;
  pix_key_type: string | null;
  cobrar_sinal: boolean | null;
  valor_sinal: number | null;
  instagram: string | null;
  whatsapp: string | null;
  site: string | null;
  outros_links: any;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  enableDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_FLAG_KEY = 'finbeauty_demo_mode';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) setProfile(data as Profile);
  };

  const activateDemo = () => {
    const fakeUser = { id: DEMO_USER_ID, email: demoProfile.email } as unknown as User;
    setUser(fakeUser);
    setSession(null);
    setProfile(demoProfile as Profile);
    setIsDemo(true);
    setLoading(false);
  };

  useEffect(() => {
    // Check demo flag first
    if (typeof window !== 'undefined' && localStorage.getItem(DEMO_FLAG_KEY) === '1') {
      activateDemo();
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const enableDemo = () => {
    localStorage.setItem(DEMO_FLAG_KEY, '1');
    activateDemo();
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error };
  };

  const signOut = async () => {
    if (isDemo) {
      localStorage.removeItem(DEMO_FLAG_KEY);
      setIsDemo(false);
      setUser(null);
      setProfile(null);
      window.location.href = '/auth';
      return;
    }
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (isDemo) return;
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isDemo, signIn, signUp, signOut, refreshProfile, enableDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
