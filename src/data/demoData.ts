// Studio Bella — Dataset completo de demonstração
// Usado quando o usuário ativa o "Modo Demo" via botão na tela de login.

export const DEMO_USER_ID = "demo-user-studio-bella";

export const demoProfile = {
  id: DEMO_USER_ID,
  nome: "Bella Martins",
  email: "demo@finbeauty.com.br",
  telefone: "(11) 98888-7777",
  foto_url: null,
  slug: "studiobella",
  role: "user",
  bio: "Studio Bella — Beleza, cuidado e elegância em cada detalhe ✨",
  studio_name: "Studio Bella",
  studio_hours: { seg: "09:00-19:00", ter: "09:00-19:00", qua: "09:00-19:00", qui: "09:00-19:00", sex: "09:00-20:00", sab: "09:00-17:00" },
  follow_up_days: 30,
  pix_key: "demo@finbeauty.com.br",
  pix_key_type: "email",
  cobrar_sinal: true,
  valor_sinal: 30,
  instagram: "@studiobella",
  whatsapp: "11988887777",
  site: null,
  outros_links: [],
};

const today = new Date();
const dStr = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export const demoClientes = [
  { id: "demo-c1", user_id: DEMO_USER_ID, nome: "Mariana Souza", telefone: "(11) 99100-1010", email: "mariana@email.com", notas: "Cliente VIP, prefere horário pela manhã.", status: "ativa", foto_url: null, birthday: `1992-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`, created_at: dStr(-90) },
  { id: "demo-c2", user_id: DEMO_USER_ID, nome: "Camila Ribeiro", telefone: "(11) 99200-2020", email: "camila@email.com", notas: "Alergia a cola cianoacrilato — usar hipoalergênica.", status: "ativa", foto_url: null, birthday: "1988-07-12", created_at: dStr(-60) },
  { id: "demo-c3", user_id: DEMO_USER_ID, nome: "Fernanda Lima", telefone: "(11) 99300-3030", email: "fernanda@email.com", notas: "", status: "ativa", foto_url: null, birthday: "1995-03-22", created_at: dStr(-45) },
  { id: "demo-c4", user_id: DEMO_USER_ID, nome: "Patrícia Alves", telefone: "(11) 99400-4040", email: "patricia@email.com", notas: "Indicação de Mariana.", status: "ativa", foto_url: null, birthday: "1990-11-05", created_at: dStr(-30) },
  { id: "demo-c5", user_id: DEMO_USER_ID, nome: "Juliana Costa", telefone: "(11) 99500-5050", email: "juliana@email.com", notas: "Não retornou nos últimos meses.", status: "inativa", foto_url: null, birthday: "1993-09-18", created_at: dStr(-180) },
];

export const demoServicos = [
  { id: "demo-s1", user_id: DEMO_USER_ID, nome: "Volume Russo", duracao: 120, preco: 350, descricao: "Extensão de cílios técnica volume russo", ativo: true, created_at: dStr(-100) },
  { id: "demo-s2", user_id: DEMO_USER_ID, nome: "Lash Lifting", duracao: 90, preco: 220, descricao: "Lifting + tintura dos cílios naturais", ativo: true, created_at: dStr(-100) },
  { id: "demo-s3", user_id: DEMO_USER_ID, nome: "Design de Sobrancelhas com Henna", duracao: 60, preco: 90, descricao: "Modelagem + henna", ativo: true, created_at: dStr(-100) },
  { id: "demo-s4", user_id: DEMO_USER_ID, nome: "Limpeza de Pele Profunda", duracao: 90, preco: 180, descricao: "Limpeza facial completa", ativo: true, created_at: dStr(-100) },
  { id: "demo-s5", user_id: DEMO_USER_ID, nome: "Manicure & Pedicure Spa", duracao: 90, preco: 110, descricao: "Mão e pé com hidratação", ativo: true, created_at: dStr(-100) },
];

export const demoAgendamentos = [
  { id: "demo-a1", user_id: DEMO_USER_ID, cliente_id: "demo-c1", servico_id: "demo-s1", data: dStr(0), horario: "09:00", status: "confirmado", notas: "", origem: "interno", forma_pagamento: "PIX", sinal_pago: true, created_at: dStr(-3), comprovante_url: null, clientes: { nome: "Mariana Souza" }, servicos: { nome: "Volume Russo", preco: 350 } },
  { id: "demo-a2", user_id: DEMO_USER_ID, cliente_id: "demo-c2", servico_id: "demo-s2", data: dStr(0), horario: "11:30", status: "confirmado", notas: "Levar produto hipoalergênico.", origem: "link_bio", forma_pagamento: "PIX", sinal_pago: true, created_at: dStr(-2), comprovante_url: null, clientes: { nome: "Camila Ribeiro" }, servicos: { nome: "Lash Lifting", preco: 220 } },
  { id: "demo-a3", user_id: DEMO_USER_ID, cliente_id: "demo-c3", servico_id: "demo-s3", data: dStr(0), horario: "15:00", status: "pendente", notas: "", origem: "interno", forma_pagamento: null, sinal_pago: false, created_at: dStr(-1), comprovante_url: null, clientes: { nome: "Fernanda Lima" }, servicos: { nome: "Design de Sobrancelhas com Henna", preco: 90 } },
  { id: "demo-a4", user_id: DEMO_USER_ID, cliente_id: "demo-c4", servico_id: "demo-s4", data: dStr(1), horario: "10:00", status: "confirmado", notas: "", origem: "interno", forma_pagamento: "Cartão Crédito", sinal_pago: false, created_at: dStr(-1), comprovante_url: null, clientes: { nome: "Patrícia Alves" }, servicos: { nome: "Limpeza de Pele Profunda", preco: 180 } },
  { id: "demo-a5", user_id: DEMO_USER_ID, cliente_id: "demo-c1", servico_id: "demo-s5", data: dStr(2), horario: "14:00", status: "confirmado", notas: "", origem: "link_bio", forma_pagamento: "PIX", sinal_pago: true, created_at: dStr(-1), comprovante_url: null, clientes: { nome: "Mariana Souza" }, servicos: { nome: "Manicure & Pedicure Spa", preco: 110 } },
  { id: "demo-a6", user_id: DEMO_USER_ID, cliente_id: "demo-c2", servico_id: "demo-s1", data: dStr(-3), horario: "09:00", status: "concluido", notas: "", origem: "interno", forma_pagamento: "PIX", sinal_pago: true, created_at: dStr(-10), comprovante_url: null, clientes: { nome: "Camila Ribeiro" }, servicos: { nome: "Volume Russo", preco: 350 } },
  { id: "demo-a7", user_id: DEMO_USER_ID, cliente_id: "demo-c3", servico_id: "demo-s4", data: dStr(-5), horario: "11:00", status: "concluido", notas: "", origem: "interno", forma_pagamento: "Dinheiro", sinal_pago: false, created_at: dStr(-12), comprovante_url: null, clientes: { nome: "Fernanda Lima" }, servicos: { nome: "Limpeza de Pele Profunda", preco: 180 } },
  { id: "demo-a8", user_id: DEMO_USER_ID, cliente_id: "demo-c4", servico_id: "demo-s2", data: dStr(-7), horario: "16:00", status: "concluido", notas: "", origem: "interno", forma_pagamento: "PIX", sinal_pago: true, created_at: dStr(-14), comprovante_url: null, clientes: { nome: "Patrícia Alves" }, servicos: { nome: "Lash Lifting", preco: 220 } },
];

export const demoFinanceiro = [
  { id: "demo-f1", user_id: DEMO_USER_ID, tipo: "receita", descricao: "Volume Russo — Camila Ribeiro", valor: 350, data: dStr(-3), categoria: "Serviços", agendamento_id: "demo-a6", created_at: dStr(-3) },
  { id: "demo-f2", user_id: DEMO_USER_ID, tipo: "receita", descricao: "Limpeza de Pele — Fernanda Lima", valor: 180, data: dStr(-5), categoria: "Serviços", agendamento_id: "demo-a7", created_at: dStr(-5) },
  { id: "demo-f3", user_id: DEMO_USER_ID, tipo: "receita", descricao: "Lash Lifting — Patrícia Alves", valor: 220, data: dStr(-7), categoria: "Serviços", agendamento_id: "demo-a8", created_at: dStr(-7) },
  { id: "demo-f4", user_id: DEMO_USER_ID, tipo: "receita", descricao: "Sinal Volume Russo — Mariana", valor: 30, data: dStr(-3), categoria: "Sinal", agendamento_id: "demo-a1", created_at: dStr(-3) },
  { id: "demo-f5", user_id: DEMO_USER_ID, tipo: "receita", descricao: "Sinal Lash Lifting — Camila", valor: 30, data: dStr(-2), categoria: "Sinal", agendamento_id: "demo-a2", created_at: dStr(-2) },
  { id: "demo-f6", user_id: DEMO_USER_ID, tipo: "despesa", descricao: "Compra de fios mink", valor: 280, data: dStr(-8), categoria: "Material", agendamento_id: null, created_at: dStr(-8) },
  { id: "demo-f7", user_id: DEMO_USER_ID, tipo: "despesa", descricao: "Aluguel Studio", valor: 1800, data: dStr(-15), categoria: "Fixas", agendamento_id: null, created_at: dStr(-15) },
  { id: "demo-f8", user_id: DEMO_USER_ID, tipo: "despesa", descricao: "Energia elétrica", valor: 240, data: dStr(-12), categoria: "Fixas", agendamento_id: null, created_at: dStr(-12) },
];

export const demoEstoque = [
  { id: "demo-e1", user_id: DEMO_USER_ID, nome: "Fio Mink 0.07 D 11mm", marca: "LashPro", quantidade: 8, quantidade_minima: 5, unidade: "caixa", preco_custo: 35, fornecedor: "Dist. Beauty", created_at: dStr(-30) },
  { id: "demo-e2", user_id: DEMO_USER_ID, nome: "Cola Premium Black", marca: "Sky Glue", quantidade: 2, quantidade_minima: 3, unidade: "frasco", preco_custo: 89, fornecedor: "Dist. Beauty", created_at: dStr(-30) },
  { id: "demo-e3", user_id: DEMO_USER_ID, nome: "Henna Sobrancelha Castanha", marca: "BellaHenna", quantidade: 6, quantidade_minima: 2, unidade: "frasco", preco_custo: 28, fornecedor: "BeautyPro", created_at: dStr(-30) },
  { id: "demo-e4", user_id: DEMO_USER_ID, nome: "Eye Pad Gel", marca: "LashPad", quantidade: 45, quantidade_minima: 20, unidade: "par", preco_custo: 2.5, fornecedor: "Dist. Beauty", created_at: dStr(-30) },
  { id: "demo-e5", user_id: DEMO_USER_ID, nome: "Removedor Gel", marca: "Sky Glue", quantidade: 1, quantidade_minima: 2, unidade: "frasco", preco_custo: 55, fornecedor: "Dist. Beauty", created_at: dStr(-30) },
  { id: "demo-e6", user_id: DEMO_USER_ID, nome: "Esmalte Base Coat", marca: "Risqué", quantidade: 4, quantidade_minima: 2, unidade: "frasco", preco_custo: 12, fornecedor: "Beleza Total", created_at: dStr(-30) },
];

export const demoFichas: any[] = [];
