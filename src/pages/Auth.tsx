import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Auth() {
  const { user, signIn, signUp, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-primary text-lg">Carregando...</div></div>;
  if (user) return <Navigate to="/home_profissional" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) toast.error(error.message);
        else toast.success('Bem-vinda de volta!');
      } else {
        if (!fullName.trim()) { toast.error('Digite seu nome completo'); return; }
        const { error } = await signUp(email, password, fullName);
        if (error) toast.error(error.message);
        else toast.success('Conta criada! Verifique seu email para confirmar.');
      }
    } finally {
      setIsSubmitting(false);
    }
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
            <CardTitle className="text-foreground">{isLogin ? 'Entrar' : 'Criar conta'}</CardTitle>
            <CardDescription className="text-muted-foreground">{isLogin ? 'Acesse sua conta FinBeauty' : 'Crie sua conta gratuitamente'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Nome completo</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome" className="bg-secondary border-border" required />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="bg-secondary border-border" required />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Senha</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="bg-secondary border-border" required minLength={6} />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full gradient-brand text-primary-foreground">
                {isSubmitting ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar conta'}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:text-primary/80 text-sm">
                {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
