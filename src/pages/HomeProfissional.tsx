import { useSearchParams } from "react-router-dom";
import DashboardTab from "@/components/modules/DashboardTab";
import ClientesTab from "@/components/modules/ClientesTab";
import AgendamentosTab from "@/components/modules/AgendamentosTab";
import FinanceiroTab from "@/components/modules/FinanceiroTab";
import ConsultProLashTab from "@/components/modules/ConsultProLashTab";
import EstoqueTab from "@/components/modules/EstoqueTab";
import ServicosTab from "@/components/modules/ServicosTab";
import FichasTab from "@/components/modules/FichasTab";
import ComoUtilizarTab from "@/components/modules/ComoUtilizarTab";

const tabs: Record<string, React.ComponentType> = {
  Clientes: ClientesTab,
  Agendamentos: AgendamentosTab,
  Financeiro: FinanceiroTab,
  ConsultProLash: ConsultProLashTab,
  Estoque: EstoqueTab,
  Servicos: ServicosTab,
  Fichas: FichasTab,
  ComoUtilizar: ComoUtilizarTab,
};

export default function HomeProfissional() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  const TabComponent = tab ? tabs[tab] : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {TabComponent ? <TabComponent /> : <DashboardTab />}
    </div>
  );
}
