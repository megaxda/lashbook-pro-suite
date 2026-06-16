import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { signInSchema, signUpSchema, firstError } from '@/lib/validation';

export default function Auth() {
  const { user, signIn, loading, enableDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // signup state
  const [suNome, setSuNome] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suSubmitting, setSuSubmitting] = useState(false);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-primary text-lg">Carregando...</div></div>;
  if (user) return <Navigate to="/home_profissional" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) { toast.error(firstError(parsed)); return; }
    setIsSubmitting(true);
    try {
      const { error } = await signIn(parsed.data.email, parsed.data.password);
      if (error) toast.error(error.message);
      else toast.success('Bem-vinda de volta!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse({ nome: suNome, email: suEmail, password: suPassword });
    if (!parsed.success) { toast.error(firstError(parsed)); return; }
    setSuSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: parsed.data.nome, signup_origin: 'public' },
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      // If session already returned (auto-confirm enabled), user is logged in
      if (data.session) {
        toast.success('Conta criada! Você tem 7 dias de acesso gratuito.');
        // Navigate handled by <Navigate> when user becomes truthy
      } else {
        // Try sign-in immediately as fallback
        const { error: siErr } = await signIn(suEmail, suPassword);
        if (siErr) {
          toast.success('Conta criada! Verifique seu email para ativar.');
        } else {
          toast.success('Conta criada! Bem-vinda — você tem 7 dias grátis.');
        }
      }
      setSuNome(''); setSuEmail(''); setSuPassword('');
    } finally {
      setSuSubmitting(false);
    }
  };

  const handleDemo = () => {
    enableDemo();
    toast.success('Bem-vinda ao Modo Demonstração — Studio Bella!');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient-brand">FinBeauty</h1>
          <p className="text-muted-foreground mt-2">Sistema de gestão para profissionais de estética</p>
        </div>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Acesso</CardTitle>
            <CardDescription className="text-muted-foreground">Entre ou crie uma conta com 7 dias grátis</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid grid-cols-2 w-full bg-secondary">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Email</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="bg-secondary border-border" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Senha</Label>
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="bg-secondary border-border" required minLength={6} />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full gradient-brand text-primary-foreground">
                    {isSubmitting ? 'Aguarde...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Nome completo</Label>
                    <Input value={suNome} onChange={e => setSuNome(e.target.value)} placeholder="Seu nome" className="bg-secondary border-border" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Email</Label>
                    <Input type="email" value={suEmail} onChange={e => setSuEmail(e.target.value)} placeholder="seu@email.com" className="bg-secondary border-border" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Senha</Label>
                    <Input type="password" value={suPassword} onChange={e => setSuPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="bg-secondary border-border" required minLength={6} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ao criar sua conta, você terá <strong className="text-foreground">7 dias de acesso gratuito</strong>. Após esse período, será necessário entrar em contato com o administrador para liberar o uso.
                  </p>
                  <Button type="submit" disabled={suSubmitting} className="w-full gradient-brand text-primary-foreground">
                    {suSubmitting ? 'Criando...' : 'Criar conta grátis'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-4">
              <Button variant="outline" disabled={isSubmitting} onClick={handleDemo} className="w-full border-border text-muted-foreground hover:text-foreground">
                Acessar Demonstração
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
