import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Database, Mail, FileText, Users, AlertCircle } from "lucide-react";

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold text-primary">FinBeauty</Link>
          <Badge variant="secondary" className="gap-1">
            <Shield className="w-3 h-3" /> Confiança & Privacidade
          </Badge>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-10 space-y-8">
        <section className="space-y-3">
          <h1 className="text-3xl font-bold">Central de Confiança</h1>
          <p className="text-muted-foreground">
            Esta página é mantida pela equipe da FinBeauty para responder dúvidas comuns sobre segurança, privacidade
            e tratamento de dados na plataforma. Os controles aqui descritos refletem práticas atuais da aplicação
            e podem evoluir — não constituem certificação independente.
          </p>
          <p className="text-xs text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString("pt-BR", { year: "numeric", month: "long" })}.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" /> Responsabilidade compartilhada
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              A FinBeauty é construída sobre a infraestrutura da Lovable Cloud (banco de dados gerenciado e autenticação).
              A Lovable provê controles de plataforma; a FinBeauty é responsável pela lógica do aplicativo, regras de acesso
              e suporte às clientes. As próprias usuárias profissionais respondem pelo uso adequado das credenciais e pelos
              dados que cadastram sobre suas clientes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="w-5 h-5 text-primary" /> Acesso e autenticação
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <ul className="list-disc list-inside space-y-1">
              <li>Login por e-mail e senha gerenciados pelo serviço de autenticação da plataforma.</li>
              <li>Tokens de sessão são armazenados localmente e renovados automaticamente.</li>
              <li>Cada conta enxerga apenas os próprios dados (clientes, agenda, financeiro), aplicado em nível de banco.</li>
              <li>Funções administrativas internas exigem permissão explícita de administrador.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="w-5 h-5 text-primary" /> Dados que coletamos e como usamos
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Para operar o sistema, armazenamos:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Dados da profissional: nome, e-mail, telefone, foto, informações do estúdio.</li>
              <li>Dados das clientes cadastradas pela profissional: contato, agendamentos, fichas e anotações.</li>
              <li>Dados financeiros lançados pela profissional (receitas, despesas, formas de pagamento).</li>
              <li>Comprovantes de pagamento PIX enviados via link de agendamento público.</li>
            </ul>
            <p>
              Esses dados são usados exclusivamente para a operação do app contratado pela profissional.
              Não comercializamos dados pessoais.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" /> Retenção e exclusão
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Os dados de uma conta permanecem disponíveis enquanto a conta estiver ativa. Comprovantes de PIX são
              limpos periodicamente após o uso operacional. Solicitações de exclusão de conta ou de dados pessoais
              podem ser enviadas pelo canal de contato abaixo.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" /> Subprocessadores
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Lovable Cloud</strong> — hospedagem do aplicativo, banco de dados, autenticação e armazenamento de arquivos.</li>
              <li>Provedores de notificação push (quando ativadas pela profissional).</li>
            </ul>
            <p>
              A lista pode ser atualizada conforme o produto evolui. Caso novos subprocessadores sejam adicionados,
              esta página será revisada.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="w-5 h-5 text-primary" /> Relato de vulnerabilidades
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Encontrou algo que parece um problema de segurança? Entre em contato pelo canal abaixo descrevendo o
              comportamento observado. Pedimos que não explore o problema além do necessário para demonstrá-lo.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="w-5 h-5 text-primary" /> Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Dúvidas sobre privacidade, dados ou segurança podem ser enviadas para o suporte da FinBeauty.</p>
            <p className="text-xs">
              Esta página é conteúdo editável mantido pela proprietária do app e não representa certificação,
              auditoria independente ou conformidade regulatória específica.
            </p>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border mt-10">
        <div className="container max-w-4xl mx-auto px-4 py-6 text-xs text-muted-foreground flex items-center justify-between">
          <span>© {new Date().getFullYear()} FinBeauty</span>
          <Link to="/" className="hover:text-primary">Voltar ao app</Link>
        </div>
      </footer>
    </div>
  );
}
