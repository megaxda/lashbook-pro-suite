// Configuração completa da Ficha de Anamnese: áreas, procedimentos, perguntas e TCLE.

export type SimNaoNaoSei = "sim" | "nao" | "nao_sei" | "";

export interface Pergunta {
  id: string;
  label: string;
  tipo?: "sim_nao" | "sim_nao_nao_sei" | "texto" | "select";
  opcoes?: string[];
  // Quando true, abre campo de detalhe ao marcar "sim"
  detalheNoSim?: boolean;
}

export interface AreaDef {
  key: string;
  nome: string;
  procedimentos: string[];
  perguntas: Pergunta[];
}

// ===== Saúde Geral (sempre aparece) =====
export const perguntasSaudeGeral: { titulo: string; perguntas: Pergunta[] }[] = [
  {
    titulo: "Condições de saúde",
    perguntas: [
      { id: "saude_gestante", label: "Está gestante ou amamentando?", detalheNoSim: true },
      { id: "saude_diabetes", label: "Tem diabetes?", detalheNoSim: true },
      { id: "saude_hipertensao", label: "Tem hipertensão?", detalheNoSim: true },
      { id: "saude_cardiaco", label: "Tem problemas cardíacos?", detalheNoSim: true },
      { id: "saude_marcapasso", label: "Usa marcapasso ou possui prótese metálica?", detalheNoSim: true },
      { id: "saude_epilepsia", label: "Tem epilepsia ou histórico de convulsões?", detalheNoSim: true },
      { id: "saude_autoimune", label: "Tem doença autoimune (lúpus, psoríase, vitiligo)?", detalheNoSim: true },
      { id: "saude_imuno", label: "É portador(a) de HIV, hepatite ou condição imunossupressora?", detalheNoSim: true },
      { id: "saude_queloide", label: "Tem tendência a formar queloides?", detalheNoSim: true },
      { id: "saude_herpes", label: "Tem histórico de herpes (labial ou genital)?", detalheNoSim: true },
      { id: "saude_cancer", label: "Já teve ou está em tratamento de câncer?", detalheNoSim: true },
      { id: "saude_coagulacao", label: "Tem problemas de coagulação sanguínea?", detalheNoSim: true },
    ],
  },
  {
    titulo: "Medicamentos",
    perguntas: [
      { id: "med_continuo", label: "Usa algum medicamento contínuo?", detalheNoSim: true },
      { id: "med_isotretinoina", label: "Usou isotretinoína (Roacutan) nos últimos 6 meses?", detalheNoSim: true },
      { id: "med_anticoagulantes", label: "Usa anticoagulantes (AAS, Xarelto, varfarina)?", detalheNoSim: true },
      { id: "med_corticoides", label: "Usa corticoides?", detalheNoSim: true },
      { id: "med_acidos", label: "Faz uso de ácidos na pele?", detalheNoSim: true },
    ],
  },
  {
    titulo: "Alergias",
    perguntas: [
      { id: "alerg_medic", label: "Tem alergia a algum medicamento?", detalheNoSim: true },
      { id: "alerg_anestesico", label: "Alergia a anestésicos (lidocaína, benzocaína)?", detalheNoSim: true },
      { id: "alerg_latex", label: "Alergia a látex?", detalheNoSim: true },
      { id: "alerg_cosmeticos", label: "Alergia a cosméticos, perfumes ou produtos químicos?", detalheNoSim: true },
      { id: "alerg_metais", label: "Alergia a níquel ou metais?", detalheNoSim: true },
      { id: "alerg_outras", label: "Outras alergias?", detalheNoSim: true },
    ],
  },
  {
    titulo: "Estilo de vida",
    perguntas: [
      { id: "vida_fuma", label: "Fuma?", tipo: "select", opcoes: ["Não", "Sim", "Ex-fumante"] },
      { id: "vida_alcool", label: "Consome bebida alcoólica com frequência?", detalheNoSim: false },
      { id: "vida_sol", label: "Exposição solar frequente ou recente (últimos 15 dias)?", detalheNoSim: true },
      { id: "vida_atividade", label: "Pratica atividade física regular?" },
    ],
  },
];

// ===== Áreas (Seção 1, 3, 7 — TCLE) =====
export const areas: AreaDef[] = [
  {
    key: "cilios",
    nome: "Cílios",
    procedimentos: ["Volume Russo", "Fio a Fio", "Volume Brasileiro", "Híbrido", "Mega Volume", "Lash Lifting", "Tintura de Cílios", "Manutenção"],
    perguntas: [
      { id: "cilios_lente", label: "Usa lente de contato?", tipo: "select", opcoes: ["Não", "Gelatinosa", "Rígida"] },
      { id: "cilios_ja_fez", label: "Já fez extensão antes?", detalheNoSim: true },
      { id: "cilios_olho_seco", label: "Tem olho seco ou sensibilidade ocular?", detalheNoSim: true },
      { id: "cilios_conjuntivite", label: "Teve conjuntivite nos últimos 30 dias?", detalheNoSim: true },
      { id: "cilios_cirurgia", label: "Fez cirurgia ocular recente (catarata, LASIK)?", detalheNoSim: true },
      { id: "cilios_blefarite", label: "Tem blefarite, terçol ou calázio recorrente?", detalheNoSim: true },
      { id: "cilios_colirio", label: "Usa colírio de uso contínuo?", detalheNoSim: true },
      { id: "cilios_quimio", label: "Fez quimioterapia nos últimos 12 meses?", detalheNoSim: true },
    ],
  },
  {
    key: "sobrancelhas",
    nome: "Sobrancelhas",
    procedimentos: ["Design", "Henna", "Brow Lamination", "Micropigmentação", "Microblading", "Nano Blading"],
    perguntas: [
      { id: "sob_micro", label: "Já fez micropigmentação antes?", detalheNoSim: true },
      { id: "sob_henna", label: "Já usou henna?", detalheNoSim: true },
      { id: "sob_acidos", label: "Usa ácidos na região da testa?", detalheNoSim: true },
      { id: "sob_peeling", label: "Fez peeling ou laser na região recentemente?", detalheNoSim: true },
      { id: "sob_foliculite", label: "Tem pelos encravados ou foliculite na área?", detalheNoSim: true },
      { id: "sob_lesao", label: "Tem cicatriz, pinta ou lesão na sobrancelha?", detalheNoSim: true },
      { id: "sob_botox", label: "Fez botox na testa?", detalheNoSim: true },
      { id: "sob_tinta", label: "Teve reação a tintas de tatuagem? (micropigmentação)", detalheNoSim: true },
    ],
  },
  {
    key: "estetica_facial",
    nome: "Estética Facial",
    procedimentos: ["Limpeza de Pele", "Peeling Químico", "Microagulhamento", "Radiofrequência Facial", "LED", "Hidratação Facial", "Drenagem Facial"],
    perguntas: [
      { id: "ef_tipo_pele", label: "Tipo de pele", tipo: "select", opcoes: ["Oleosa", "Seca", "Mista", "Sensível"] },
      { id: "ef_acne", label: "Tem acne ativa?", tipo: "select", opcoes: ["Não", "Leve", "Moderada", "Severa"] },
      { id: "ef_acidos", label: "Usa ácidos atualmente?", detalheNoSim: true },
      { id: "ef_peeling", label: "Fez peeling químico nos últimos 30 dias?", detalheNoSim: true },
      { id: "ef_rosacea", label: "Tem rosácea ou dermatite?", detalheNoSim: true },
      { id: "ef_melasma", label: "Tem melasma ou manchas?", detalheNoSim: true },
      { id: "ef_botox", label: "Fez botox ou preenchimento?", detalheNoSim: true },
      { id: "ef_harmonizacao", label: "Fez harmonização facial (fios, bioestimuladores)?", detalheNoSim: true },
      { id: "ef_piercing", label: "Tem piercing no rosto?", detalheNoSim: true },
      { id: "ef_diu", label: "Usa DIU de cobre ou tem prótese metálica? (radiofrequência)", detalheNoSim: true },
      { id: "ef_herpes", label: "Herpes ativo ou recorrente? (microagulhamento)", detalheNoSim: true },
    ],
  },
  {
    key: "estetica_corporal",
    nome: "Estética Corporal",
    procedimentos: ["Drenagem Linfática", "Massagem Modeladora", "Radiofrequência Corporal", "Criolipólise", "Ultrassom", "Lipocavitação"],
    perguntas: [
      { id: "ec_queixa", label: "Queixa principal", tipo: "select", opcoes: ["Gordura localizada", "Celulite", "Flacidez", "Retenção", "Outra"] },
      { id: "ec_varizes", label: "Tem varizes?", tipo: "select", opcoes: ["Não", "Leve", "Moderado", "Severo"] },
      { id: "ec_trombose", label: "Tem trombose ou histórico de trombose?", detalheNoSim: true },
      { id: "ec_hernia", label: "Tem hérnia abdominal ou inguinal?", detalheNoSim: true },
      { id: "ec_cirurgia", label: "Fez cirurgia recente?", detalheNoSim: true },
      { id: "ec_proteses", label: "Tem próteses, pinos ou placas metálicas?", detalheNoSim: true },
      { id: "ec_diu", label: "Usa DIU?", tipo: "select", opcoes: ["Não", "Cobre", "Hormonal"] },
      { id: "ec_renais", label: "Tem problemas renais ou hepáticos?", detalheNoSim: true },
      { id: "ec_colesterol", label: "Colesterol ou triglicerídeos alterados?", detalheNoSim: true },
      { id: "ec_urticaria_frio", label: "Tem urticária ao frio ou crioglobulinemia? (criolipólise)", detalheNoSim: true },
      { id: "ec_dieta", label: "Dieta atual", tipo: "texto" },
    ],
  },
  {
    key: "depilacao",
    nome: "Depilação",
    procedimentos: ["Cera Quente", "Cera Fria", "Laser Diodo", "Luz Pulsada", "Linha"],
    perguntas: [
      { id: "dep_metodo", label: "Método atual", tipo: "select", opcoes: ["Lâmina", "Cera", "Creme", "Laser", "Nenhum"] },
      { id: "dep_foliculite", label: "Tem pelos encravados ou foliculite frequente?", detalheNoSim: true },
      { id: "dep_varizes", label: "Tem varizes na região?", detalheNoSim: true },
      { id: "dep_tatuagem", label: "Tem tatuagem na área?", detalheNoSim: true },
      { id: "dep_bronz", label: "Tomou sol ou bronzeou nos últimos 15 dias?", detalheNoSim: true },
      { id: "dep_autobronz", label: "Usa autobronzeador?", detalheNoSim: true },
      { id: "dep_roacutan", label: "Usou Roacutan nos últimos 6 meses? (laser)", detalheNoSim: true },
      { id: "dep_melasma", label: "Tem melasma ou manchas na área? (laser)", detalheNoSim: true },
      { id: "dep_ferida", label: "Tem ferida aberta ou lesão na região?", detalheNoSim: true },
      { id: "dep_intima", label: "Está menstruada? Tem corrimento ou infecção? (íntima)", detalheNoSim: true },
    ],
  },
  {
    key: "unhas",
    nome: "Unhas",
    procedimentos: ["Manicure", "Pedicure", "Spa dos Pés", "Alongamento em Gel", "Alongamento em Fibra", "Banho de Gel", "Esmaltação Comum"],
    perguntas: [
      { id: "un_diabetes", label: "Tem diabetes? (crítico para pedicure)", detalheNoSim: true },
      { id: "un_micose", label: "Tem micose nas unhas ou pele?", detalheNoSim: true },
      { id: "un_psoriase", label: "Tem psoríase ungueal?", detalheNoSim: true },
      { id: "un_fragil", label: "Tem unhas frágeis ou descamando?", detalheNoSim: true },
      { id: "un_reacao", label: "Já teve reação a acetona, acrílico ou gel?", detalheNoSim: true },
      { id: "un_alongamento", label: "Já fez alongamento antes?", detalheNoSim: true },
      { id: "un_cuticula", label: "Tem cutícula inflamada ou ferida?", detalheNoSim: true },
      { id: "un_calos", label: "Tem calos, joanete ou unha encravada? (pedicure)", detalheNoSim: true },
      { id: "un_alerg_esmalte", label: "Alergia a esmaltes?", detalheNoSim: true },
    ],
  },
  {
    key: "cabelo",
    nome: "Cabelo",
    procedimentos: ["Coloração", "Mechas / Luzes", "Botox Capilar", "Progressiva", "Selagem", "Hidratação", "Reconstrução", "Corte"],
    perguntas: [
      { id: "cab_tipo", label: "Tipo de cabelo", tipo: "select", opcoes: ["Liso", "Ondulado", "Cacheado", "Crespo"] },
      { id: "cab_quimica", label: "Última química realizada (o quê e quando)", tipo: "texto" },
      { id: "cab_reacao_color", label: "Já teve reação a coloração?", detalheNoSim: true },
      { id: "cab_ppd", label: "Alergia a PPD (parafenilenodiamina)?", detalheNoSim: true },
      { id: "cab_couro", label: "Couro cabeludo com coceira, feridas ou caspa intensa?", detalheNoSim: true },
      { id: "cab_psoriase", label: "Tem psoríase ou dermatite seborreica?", detalheNoSim: true },
      { id: "cab_queda", label: "Está em tratamento de queda?", detalheNoSim: true },
      { id: "cab_caseira", label: "Fez química em casa recentemente?", detalheNoSim: true },
      { id: "cab_gestante", label: "Gestante ou lactante? (progressiva — formol)", detalheNoSim: true },
      { id: "cab_danificado", label: "Cabelo muito danificado ou com elasticidade comprometida?", detalheNoSim: true },
    ],
  },
];

export const findArea = (key: string) => areas.find(a => a.key === key);

// ===== Consentimentos LGPD =====
export const consentimentosLgpd = [
  { id: "lgpd_lembretes", label: "Autorizo receber lembretes de horário por WhatsApp/SMS" },
  { id: "lgpd_promocoes", label: "Autorizo receber promoções e campanhas" },
  { id: "lgpd_pesquisa", label: "Autorizo receber pesquisa de satisfação" },
];

export const consentimentosImagem = [
  { id: "img_prontuario", label: "Autorizo fotos/vídeos do procedimento para prontuário interno" },
  { id: "img_redes", label: "Autorizo uso em redes sociais do estabelecimento" },
  { id: "img_publicidade", label: "Autorizo uso em material publicitário (site, anúncios, impressos)" },
  { id: "img_rosto", label: "Autorizo exibição do meu rosto identificável" },
  { id: "img_marcacao", label: "Autorizo marcação do meu @ nas publicações" },
];

// ===== TCLE por área =====
export interface TcleBlock {
  titulo: string;
  ciencia: string[];
  confirmacoes?: string[];
  compromissos?: string[];
  rodape?: string;
}

export const tcleByArea: Record<string, TcleBlock> = {
  cilios: {
    titulo: "Termo de Consentimento — Extensão de Cílios",
    ciencia: [
      "Irritação ou lacrimejamento durante a aplicação",
      "Vermelhidão ou inchaço nas pálpebras nas primeiras horas",
      "Reação alérgica à cola (rara, mas possível)",
      "Desconforto temporário ao piscar nos primeiros dias",
      "Queda natural dos fios acompanhando o ciclo dos cílios naturais",
      "Enfraquecimento dos cílios em caso de mau uso",
    ],
    confirmacoes: [
      "Não uso lente rígida (ou removi para a aplicação)",
      "Não tenho conjuntivite, terçol ou infecção ocular ativa",
      "Informei sobre cirurgias oculares recentes",
      "Informei sobre alergias, especialmente a cianoacrilato",
    ],
    compromissos: [
      "Não molhar os cílios nas primeiras 24h",
      "Evitar sauna, vapor e piscina nas primeiras 48h",
      "Não usar removedor oleoso, máscara de cílios ou curvex",
      "Higienizar diariamente com shampoo próprio",
      "Não puxar, esfregar ou coçar os olhos",
      "Voltar para manutenção em 15 a 25 dias",
      "Procurar atendimento médico em caso de dor, secreção ou inchaço persistente",
    ],
    rodape: "A durabilidade depende do meu cuidado e do ciclo natural dos cílios. A queda gradual é natural e não constitui defeito do serviço.",
  },
  sobrancelhas: {
    titulo: "Termo de Consentimento — Sobrancelhas",
    ciencia: [
      "Vermelhidão, inchaço e sensibilidade nas horas seguintes",
      "Reação alérgica a henna, pigmentos ou anestésico tópico",
      "Desbote e mudança de tom ao longo do tempo (micropigmentação)",
      "Necessidade de retoque em 30-45 dias (micropigmentação)",
      "Resultado de cor e formato pode variar de pessoa para pessoa",
      "Risco de infecção se cuidados pós não forem seguidos",
    ],
    confirmacoes: [
      "Informei alergias conhecidas (henna, níquel, anestésicos)",
      "Não fiz peeling ou laser na região recentemente",
      "Não usei ácidos na área nos últimos 7 dias",
      "Estou ciente de que Botox recente pode alterar o resultado",
    ],
    compromissos: [
      "Manter a área seca por 24-48h (micropigmentação)",
      "Não coçar, remover casquinhas ou manipular a área",
      "Usar protetor solar após a cicatrização",
      "Evitar piscina, sauna e exposição solar nos prazos orientados",
      "Comparecer à sessão de retoque, quando indicada",
    ],
    rodape: "O resultado final depende da cicatrização individual. Pequenas assimetrias são naturais e podem ser ajustadas no retoque.",
  },
  estetica_facial: {
    titulo: "Termo de Consentimento — Estética Facial",
    ciencia: [
      "Vermelhidão, inchaço e ardência por horas ou dias",
      "Descamação nos dias seguintes (esperado em peelings)",
      "Pequenos pontos de sangramento (microagulhamento)",
      "Escurecimento temporário da área",
      "Reação alérgica aos ativos aplicados",
      "Resultado gradual, visível após várias sessões",
    ],
    compromissos: [
      "Usar protetor solar FPS 50+ diariamente por no mínimo 30 dias",
      "Evitar sol direto, sauna e piscina nos prazos orientados",
      "Não aplicar ácidos, esfoliantes ou maquiagem sem liberação",
      "Não coçar, remover cascas ou manipular a pele",
      "Informar qualquer reação não prevista",
    ],
    rodape: "Resultados variam conforme tipo de pele, idade, genética, exposição solar e adesão aos cuidados. O profissional aplicou a técnica indicada, mas não garante resultado específico.",
  },
  estetica_corporal: {
    titulo: "Termo de Consentimento — Estética Corporal",
    ciencia: [
      "Vermelhidão, hematomas ou sensibilidade local",
      "Formigamento, dormência e inchaço por dias/semanas (criolipólise)",
      "Calor intenso e sensibilidade (radiofrequência/ultrassom)",
      "Resultado gradual, geralmente visível após várias sessões",
      "Resposta individual — redução de medidas varia de pessoa para pessoa",
      "Necessidade de manutenção para preservar resultados",
    ],
    confirmacoes: [
      "Informei cirurgias, próteses e condições de saúde relevantes",
      "Não tenho trombose ou condição contraindicada para o procedimento",
      "Não tenho urticária ao frio ou crioglobulinemia (criolipólise)",
      "Estou ciente de que este procedimento não substitui dieta e atividade física",
    ],
    compromissos: [
      "Manter hidratação adequada (mínimo 2L de água/dia)",
      "Seguir orientações de alimentação e atividade física",
      "Comparecer às sessões nos intervalos recomendados",
      "Informar qualquer reação ou desconforto persistente",
    ],
    rodape: "O resultado depende de estilo de vida, metabolismo e adesão ao protocolo. Não há garantia de redução de medidas específica.",
  },
  depilacao: {
    titulo: "Termo de Consentimento — Depilação",
    ciencia: [
      "Vermelhidão e inchaço logo após a aplicação",
      "Sensação de calor ou queimação leve",
      "Pequenas crostas ou bolhas em casos raros (laser/luz pulsada)",
      "Escurecimento ou clareamento temporário da pele",
      "Foliculite nos dias seguintes",
      "Queimaduras se orientações não forem seguidas",
      "Redução progressiva, não eliminação total dos pelos (laser)",
    ],
    confirmacoes: [
      "Não estou bronzeado(a) nem tomei sol nos últimos 15 dias",
      "Não usei isotretinoína nos últimos 6 meses (laser)",
      "Não aplicarei ácidos ou perfume na área 48h antes e depois",
      "Preparei a área corretamente (raspagem com lâmina, sem cera)",
      "Informei medicamentos fotossensibilizantes em uso",
    ],
    compromissos: [
      "Usar protetor solar FPS 50+ na área tratada",
      "Evitar sol direto, piscina, sauna e atividade intensa por 48h",
      "Não depilar com cera ou pinça entre sessões (apenas lâmina)",
      "Comparecer nas sessões nos intervalos recomendados",
    ],
  },
  unhas: {
    titulo: "Termo de Consentimento — Unhas",
    ciencia: [
      "Sensibilidade ou leve descamação da cutícula",
      "Reação alérgica a esmaltes, acrílico ou gel",
      "Enfraquecimento temporário da unha natural (alongamento)",
      "Ressecamento com uso prolongado de produtos químicos",
      "Risco de infecção em caso de ferimentos não comunicados",
    ],
    confirmacoes: [
      "Não tenho micose, ferida aberta ou infecção na área",
      "Informei sobre diabetes ou problemas de circulação",
      "Informei alergias conhecidas a produtos de unha",
    ],
    compromissos: [
      "Não arrancar ou quebrar o alongamento manualmente",
      "Hidratar cutículas regularmente",
      "Usar luvas em produtos de limpeza",
      "Comparecer para manutenção nos prazos recomendados",
      "Informar qualquer dor, vermelhidão ou descolamento",
    ],
  },
  cabelo: {
    titulo: "Termo de Consentimento — Cabelo",
    ciencia: [
      "Coceira, ardência ou sensibilidade no couro cabeludo",
      "Reação alérgica a colorações ou produtos químicos",
      "Ressecamento, porosidade ou quebra do fio",
      "Resultado de cor pode variar conforme base natural e histórico químico",
      "Possibilidade de não atingir 100% de liso (alisamentos)",
      "Risco de danos em cabelo com química anterior incompatível",
    ],
    confirmacoes: [
      "Informei todas as químicas anteriores realizadas",
      "Fiz teste de mecha quando solicitado",
      "Informei alergias conhecidas (PPD, amônia, formol)",
      "Não estou gestante ou amamentando (progressiva)",
      "Estou ciente de que cabelo muito danificado tem maior risco de quebra",
    ],
    compromissos: [
      "Usar produtos recomendados pelo profissional",
      "Evitar lavagens excessivas nos primeiros dias",
      "Comparecer para manutenções nos prazos recomendados",
      "Informar qualquer reação ou desconforto",
    ],
    rodape: "O resultado final depende da base capilar, histórico químico e cuidados pós. Pequenas variações de cor ou textura são naturais.",
  },
};

export const declaracaoFinal =
  "Declaro que as informações prestadas são verdadeiras, que li e compreendi o termo de consentimento acima, que tive oportunidade de esclarecer dúvidas e que autorizo a realização do procedimento.";
