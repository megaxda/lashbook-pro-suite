import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function CreateFinPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || password.length < 6) {
      toast.error('Preencha todos os campos (senha mín. 6 caracteres)');
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nome } },
    });
    setIsSubmitting(false);
    if (error) toast.error(error.message);
    else {
      toast.success('Conta criada com sucesso! Verifique o email para confirmar.');
      setNome(''); setEmail(''); setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Criar Conta Interna</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Nome completo</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome" className="bg-secondary border-border" required />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@email.com" className="bg-secondary border-border" required />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Senha</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="bg-secondary border-border" required minLength={6} />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full gradient-brand text-primary-foreground">
              {isSubmitting ? 'Criando...' : 'Criar Conta'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
