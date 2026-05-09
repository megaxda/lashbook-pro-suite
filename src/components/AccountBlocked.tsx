import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Lock } from "lucide-react";

export default function AccountBlocked() {
  const { signOut, profile } = useAuth();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-foreground">Acesso bloqueado</CardTitle>
          <CardDescription className="text-muted-foreground">
            Olá{profile?.nome ? `, ${profile.nome}` : ""}! Seu período de teste de 7 dias terminou.
            Entre em contato com o administrador para liberar o acesso à sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={signOut} variant="outline" className="w-full">
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
