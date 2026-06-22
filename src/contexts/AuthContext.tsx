import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { demoProfile, DEMO_USER_ID } from '@/data/demoData';
import { queryClient, queryKeys } from '@/lib/queryClient';

/**
 * Prefetch leve dos recursos compartilhados logo após o login.
 * Quando o usuário entra na primeira aba, os dados já estão no cache.
 * Falhas são silenciosas — a aba refaz fetch normalmente se precisar.
 */
async function prefetchEssentials(userId: string) {
  const prefetch = (key: readonly unknown[], fn: () => Promise<unknown>) =>
    queryClient.prefetchQuery({ queryKey: key as any, queryFn: fn });

  await Promise.allSettled([
    prefetch(queryKeys.clientes(userId), async () => {
      const { data } = await supabase.from('clientes').select('*').eq('user_id', userId).order('nome');
      return data ?? [];
    }),
    prefetch(queryKeys.servicos(userId, false), async () => {
      const { data } = await supabase.from('servicos').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return data ?? [];
    }),
    prefetch(queryKeys.profissionais(userId), async () => {
      const { data } = await supabase.from('profissionais').select('*').eq('user_id', userId).order('nome');
      return data ?? [];
    }),
    prefetch(queryKeys.estoque(userId), async () => {
      const { data } = await supabase.from('estoque').select('*').eq('user_id', userId).order('nome');
      return data ?? [];
    }),
  ]);
}

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
  access_expires_at: string | null;
  signup_origin: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isDemo: boolean;
  isBlocked: boolean;
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

  const tryAutoPushSubscribe = async (userId: string) => {
    try {
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;
      if (Notification.permission !== "granted") return;
      const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register("/sw.js"));
      const existing = await reg.pushManager.getSubscription();
      if (!existing) return;
      const json = existing.toJSON();
      await supabase.from("push_subscriptions").upsert(
        { user_id: userId, endpoint: existing.endpoint, p256dh: json.keys?.p256dh || "", auth: json.keys?.auth || "" },
        { onConflict: "endpoint" },
      );
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(DEMO_FLAG_KEY) === '1') {
      activateDemo();
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        tryAutoPushSubscribe(session.user.id);
        prefetchEssentials(session.user.id);
      } else setProfile(null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        tryAutoPushSubscribe(session.user.id);
        prefetchEssentials(session.user.id);
      }
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
      queryClient.clear();
      window.location.href = '/auth';
      return;
    }
    queryClient.clear();
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (isDemo) return;
    if (user) await fetchProfile(user.id);
  };

  const isBlocked = !!(
    profile &&
    profile.role !== 'admin' &&
    profile.access_expires_at &&
    new Date(profile.access_expires_at).getTime() < Date.now()
  );

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isDemo, isBlocked, signIn, signUp, signOut, refreshProfile, enableDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
