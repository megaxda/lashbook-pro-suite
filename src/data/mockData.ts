// Mock data for LASH BOOK

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  photo: string;
  lastVisit: string;
  status: "Ativa" | "Inativa";
  totalSpent: number;
  birthDate: string;
  address: string;
  notes: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientId: string;
  date: string;
  time: string;
  duration: number;
  service: string;
  price: number;
  status: "Confirmado" | "Pendente" | "Em atendimento" | "Concluído" | "Cancelado" | "No-show" | "Bloqueio";
  paymentStatus: "Pago" | "Pendente" | "Parcial";
  notes: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  currentQuantity: number;
  minIdealQuantity: number;
  costPrice: number;
  brand: string;
  supplier: string;
  expirationDate: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  discountPrice?: number;
  description: string;
  active: boolean;
  onlineBooking: boolean;
}

export interface Transaction {
  id: string;
  type: "receita" | "despesa";
  description: string;
  amount: number;
  date: string;
  category: string;
  paymentMethod: string;
}

export const mockClients: Client[] = [
  { id: "1", name: "Maria Silva", phone: "(11) 99876-5432", email: "maria@email.com", photo: "", lastVisit: "2026-04-08", status: "Ativa", totalSpent: 2850, birthDate: "1992-05-15", address: "Rua das Flores, 123 - SP", notes: "Prefere fios 0.07" },
  { id: "2", name: "Ana Oliveira", phone: "(11) 98765-4321", email: "ana@email.com", photo: "", lastVisit: "2026-04-05", status: "Ativa", totalSpent: 1920, birthDate: "1988-11-20", address: "Av. Paulista, 456 - SP", notes: "Alergia a cola cianoacrilato" },
  { id: "3", name: "Juliana Santos", phone: "(11) 97654-3210", email: "juliana@email.com", photo: "", lastVisit: "2026-03-20", status: "Ativa", totalSpent: 3450, birthDate: "1995-03-10", address: "Rua Augusta, 789 - SP", notes: "" },
  { id: "4", name: "Fernanda Costa", phone: "(11) 96543-2109", email: "fernanda@email.com", photo: "", lastVisit: "2026-02-14", status: "Inativa", totalSpent: 680, birthDate: "1990-07-22", address: "Rua Oscar Freire, 321 - SP", notes: "Não retornou" },
  { id: "5", name: "Camila Pereira", phone: "(11) 95432-1098", email: "camila@email.com", photo: "", lastVisit: "2026-04-10", status: "Ativa", totalSpent: 4200, birthDate: "1993-09-30", address: "Al. Santos, 654 - SP", notes: "Cliente VIP" },
  { id: "6", name: "Beatriz Lima", phone: "(11) 94321-0987", email: "beatriz@email.com", photo: "", lastVisit: "2026-04-09", status: "Ativa", totalSpent: 1560, birthDate: "1997-01-18", address: "Rua Consolação, 987 - SP", notes: "" },
  { id: "7", name: "Larissa Mendes", phone: "(11) 93210-9876", email: "larissa@email.com", photo: "", lastVisit: "2026-01-05", status: "Inativa", totalSpent: 450, birthDate: "1991-12-03", address: "Av. Rebouças, 159 - SP", notes: "Mudou de cidade" },
  { id: "8", name: "Patricia Alves", phone: "(11) 92109-8765", email: "patricia@email.com", photo: "", lastVisit: "2026-04-07", status: "Ativa", totalSpent: 2100, birthDate: "1994-06-25", address: "Rua Haddock Lobo, 753 - SP", notes: "" },
];

export const mockAppointments: Appointment[] = [
  { id: "1", clientName: "Maria Silva", clientId: "1", date: "2026-04-11", time: "09:00", duration: 120, service: "Volume Russo", price: 350, status: "Confirmado", paymentStatus: "Pendente", notes: "" },
  { id: "2", clientName: "Camila Pereira", clientId: "5", date: "2026-04-11", time: "11:30", duration: 90, service: "Manutenção Volume", price: 200, status: "Pendente", paymentStatus: "Pendente", notes: "Chegará 10min atrasada" },
  { id: "3", clientName: "Beatriz Lima", clientId: "6", date: "2026-04-11", time: "14:00", duration: 150, service: "Mega Volume", price: 450, status: "Confirmado", paymentStatus: "Pendente", notes: "" },
  { id: "4", clientName: "Patricia Alves", clientId: "8", date: "2026-04-11", time: "17:00", duration: 60, service: "Remoção", price: 80, status: "Pendente", paymentStatus: "Pendente", notes: "" },
  { id: "5", clientName: "Ana Oliveira", clientId: "2", date: "2026-04-12", time: "10:00", duration: 120, service: "Fio a Fio Clássico", price: 280, status: "Confirmado", paymentStatus: "Pago", notes: "" },
  { id: "6", clientName: "Juliana Santos", clientId: "3", date: "2026-04-12", time: "14:00", duration: 120, service: "Volume Brasileiro", price: 380, status: "Confirmado", paymentStatus: "Pendente", notes: "" },
  { id: "7", clientName: "Maria Silva", clientId: "1", date: "2026-04-10", time: "09:00", duration: 90, service: "Manutenção Clássico", price: 180, status: "Concluído", paymentStatus: "Pago", notes: "" },
  { id: "8", clientName: "Camila Pereira", clientId: "5", date: "2026-04-09", time: "15:00", duration: 120, service: "Volume Russo", price: 350, status: "Concluído", paymentStatus: "Pago", notes: "" },
];

export const mockProducts: Product[] = [
  { id: "1", name: "Fio Mink 0.07 C 10mm", sku: "FIO-007C10", category: "Fios", unit: "caixa", currentQuantity: 8, minIdealQuantity: 5, costPrice: 35, brand: "LashPro", supplier: "Dist. Beauty", expirationDate: "2027-06-15" },
  { id: "2", name: "Fio Mink 0.07 D 12mm", sku: "FIO-007D12", category: "Fios", unit: "caixa", currentQuantity: 3, minIdealQuantity: 5, costPrice: 35, brand: "LashPro", supplier: "Dist. Beauty", expirationDate: "2027-06-15" },
  { id: "3", name: "Cola Premium Black", sku: "COL-PB01", category: "Colas", unit: "frasco", currentQuantity: 2, minIdealQuantity: 3, costPrice: 89, brand: "Sky Glue", supplier: "Dist. Beauty", expirationDate: "2026-08-20" },
  { id: "4", name: "Primer Lash", sku: "PRI-01", category: "Preparação", unit: "frasco", currentQuantity: 4, minIdealQuantity: 2, costPrice: 42, brand: "LashClean", supplier: "BeautyPro", expirationDate: "2027-01-10" },
  { id: "5", name: "Micropore 2,5cm", sku: "MIC-25", category: "Consumíveis", unit: "rolo", currentQuantity: 12, minIdealQuantity: 6, costPrice: 8, brand: "3M", supplier: "Farmácia", expirationDate: "2028-12-31" },
  { id: "6", name: "Eye Pad Gel", sku: "EPG-01", category: "Consumíveis", unit: "par", currentQuantity: 45, minIdealQuantity: 20, costPrice: 2.5, brand: "LashPad", supplier: "Dist. Beauty", expirationDate: "2027-09-01" },
  { id: "7", name: "Removedor Gel", sku: "REM-GEL", category: "Remoção", unit: "frasco", currentQuantity: 1, minIdealQuantity: 2, costPrice: 55, brand: "Sky Glue", supplier: "Dist. Beauty", expirationDate: "2026-12-15" },
  { id: "8", name: "Escovinha Descartável", sku: "ESC-DESC", category: "Consumíveis", unit: "pacote", currentQuantity: 3, minIdealQuantity: 5, costPrice: 15, brand: "Generic", supplier: "BeautyPro", expirationDate: "2029-01-01" },
];

export const mockServices: Service[] = [
  { id: "1", name: "Fio a Fio Clássico", category: "Extensão", duration: 120, price: 280, description: "Extensão fio a fio clássica", active: true, onlineBooking: true },
  { id: "2", name: "Volume Russo", category: "Extensão", duration: 120, price: 350, discountPrice: 320, description: "Técnica de volume russo com leques artesanais", active: true, onlineBooking: true },
  { id: "3", name: "Mega Volume", category: "Extensão", duration: 150, price: 450, description: "Volume com leques de 6+ fios", active: true, onlineBooking: true },
  { id: "4", name: "Volume Brasileiro", category: "Extensão", duration: 120, price: 380, description: "Técnica exclusiva brasileira", active: true, onlineBooking: true },
  { id: "5", name: "Manutenção Clássico", category: "Manutenção", duration: 90, price: 180, description: "Retoque de extensão clássica", active: true, onlineBooking: true },
  { id: "6", name: "Manutenção Volume", category: "Manutenção", duration: 90, price: 200, description: "Retoque de extensão volume", active: true, onlineBooking: true },
  { id: "7", name: "Remoção", category: "Remoção", duration: 60, price: 80, description: "Remoção completa de extensão", active: true, onlineBooking: false },
  { id: "8", name: "Lash Lifting", category: "Lifting", duration: 90, price: 250, description: "Lifting e tintura de cílios naturais", active: true, onlineBooking: true },
];

export const mockTransactions: Transaction[] = [
  { id: "1", type: "receita", description: "Volume Russo - Maria Silva", amount: 350, date: "2026-04-10", category: "Serviços", paymentMethod: "PIX" },
  { id: "2", type: "receita", description: "Mega Volume - Camila Pereira", amount: 450, date: "2026-04-09", category: "Serviços", paymentMethod: "Cartão Crédito" },
  { id: "3", type: "receita", description: "Manutenção - Beatriz Lima", amount: 200, date: "2026-04-08", category: "Serviços", paymentMethod: "PIX" },
  { id: "4", type: "receita", description: "Fio a Fio - Ana Oliveira", amount: 280, date: "2026-04-07", category: "Serviços", paymentMethod: "Dinheiro" },
  { id: "5", type: "despesa", description: "Compra de fios - Dist. Beauty", amount: 420, date: "2026-04-06", category: "Material", paymentMethod: "Boleto" },
  { id: "6", type: "receita", description: "Lash Lifting - Patricia Alves", amount: 250, date: "2026-04-05", category: "Serviços", paymentMethod: "Cartão Débito" },
  { id: "7", type: "despesa", description: "Aluguel do Studio", amount: 1800, date: "2026-04-01", category: "Fixas", paymentMethod: "Transferência" },
  { id: "8", type: "despesa", description: "Cola Premium - Sky Glue", amount: 178, date: "2026-04-03", category: "Material", paymentMethod: "PIX" },
  { id: "9", type: "receita", description: "Volume Brasileiro - Juliana Santos", amount: 380, date: "2026-04-04", category: "Serviços", paymentMethod: "PIX" },
  { id: "10", type: "despesa", description: "Energia elétrica", amount: 220, date: "2026-04-02", category: "Fixas", paymentMethod: "Débito automático" },
];

export const statusColors: Record<string, string> = {
  Confirmado: "bg-success",
  Pendente: "bg-warning",
  "Em atendimento": "bg-info",
  Concluído: "bg-muted",
  Cancelado: "bg-destructive",
  "No-show": "bg-destructive/80",
  Bloqueio: "bg-muted-foreground",
};
