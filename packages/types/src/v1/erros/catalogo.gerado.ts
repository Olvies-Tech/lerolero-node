// Gerado por scripts/gerar-catalogo-de-erros.mjs a partir do backend e da documentação. Não edite à mão.
import type { EntradaDoCatalogo } from './entrada.js'

/** As famílias de erro: `EX` + a sigla do assunto. */
export type FamiliaDoErro = 'EXA' | 'EXC' | 'EXN' | 'EXM' | 'EXTP' | 'EXBV' | 'EXCP' | 'EXW' | 'EXMT' | 'EXF'

/** O nome de cada família, como na documentação. */
export const FAMILIAS_DE_ERRO: Readonly<Record<FamiliaDoErro, string>> = {
  EXA: "Acesso e chave",
  EXC: "Conta e cliente",
  EXN: "Número",
  EXM: "Mensagem",
  EXTP: "Template",
  EXBV: "Boas-vindas",
  EXCP: "Campanha",
  EXW: "Webhook",
  EXMT: "Meta",
  EXF: "Faturamento",
}

/** Todos os códigos que a API devolve hoje. */
export type CodigoConhecido =
  | 'EXA-0001'
  | 'EXA-0002'
  | 'EXA-0003'
  | 'EXA-0004'
  | 'EXA-0005'
  | 'EXA-0006'
  | 'EXA-0007'
  | 'EXA-0008'
  | 'EXA-0009'
  | 'EXA-0010'
  | 'EXA-0011'
  | 'EXC-0001'
  | 'EXC-0002'
  | 'EXC-0003'
  | 'EXC-0004'
  | 'EXC-0005'
  | 'EXC-0006'
  | 'EXC-0007'
  | 'EXC-0008'
  | 'EXC-0009'
  | 'EXC-0010'
  | 'EXN-0001'
  | 'EXN-0002'
  | 'EXN-0003'
  | 'EXN-0004'
  | 'EXN-0005'
  | 'EXN-0006'
  | 'EXN-0007'
  | 'EXN-0008'
  | 'EXN-0009'
  | 'EXN-0010'
  | 'EXN-0011'
  | 'EXN-0012'
  | 'EXM-0001'
  | 'EXM-0002'
  | 'EXM-0003'
  | 'EXM-0004'
  | 'EXM-0005'
  | 'EXM-0006'
  | 'EXM-0007'
  | 'EXM-0008'
  | 'EXM-0009'
  | 'EXM-0010'
  | 'EXM-0011'
  | 'EXM-0012'
  | 'EXTP-0001'
  | 'EXTP-0002'
  | 'EXTP-0003'
  | 'EXTP-0004'
  | 'EXTP-0005'
  | 'EXTP-0006'
  | 'EXTP-0007'
  | 'EXTP-0008'
  | 'EXTP-0009'
  | 'EXTP-0010'
  | 'EXTP-0011'
  | 'EXTP-0012'
  | 'EXTP-0013'
  | 'EXTP-0014'
  | 'EXBV-0001'
  | 'EXBV-0002'
  | 'EXBV-0003'
  | 'EXBV-0004'
  | 'EXBV-0005'
  | 'EXBV-0006'
  | 'EXCP-0001'
  | 'EXCP-0002'
  | 'EXCP-0003'
  | 'EXW-0001'
  | 'EXW-0002'
  | 'EXW-0003'
  | 'EXMT-0001'
  | 'EXMT-0002'
  | 'EXMT-0003'
  | 'EXMT-0004'
  | 'EXMT-0005'
  | 'EXMT-0006'
  | 'EXF-0001'
  | 'EXF-0002'
  | 'EXF-0003'
  | 'EXF-0004'

/** O catálogo: família, status HTTP, `type`, o significado e como resolver de cada código. */
export const CATALOGO_DE_ERROS: Readonly<Record<CodigoConhecido, EntradaDoCatalogo>> = {
  'EXA-0001': { familia: 'EXA', status: 401, type: 5, significado: "Chave de API ausente, inválida, expirada ou revogada. No painel: e-mail ou senha incorretos, código de MFA inválido, desafio de MFA vencido, sessão expirada ou encerrada (cada caso com mensagem própria)", comoResolver: "Conferir o cabeçalho `Authorization: Bearer lero_...` e a chave no painel; no painel, seguir a mensagem (conferir os dados ou entrar de novo)", repetivel: false },
  'EXA-0002': { familia: 'EXA', status: 403, type: 6, significado: "Chave de teste usada em recurso que só existe em produção (ou o contrário). Também quando uma chave `lero_live_` é usada em conta que está no modo teste (403, \"A conta está em modo teste. Escolha um plano para usar a chave de produção.\"); a chave não é revogada e volta a funcionar quando a conta sai do modo teste", comoResolver: "Usar `lero_live_` para envio real e `lero_test_` para o simulador; no modo teste, escolher um plano", repetivel: false },
  'EXA-0003': { familia: 'EXA', status: 403, type: 6, significado: "A chave não tem acesso a esse cliente (chave com escopo de outro cliente). Com escopo restrito, também cobre o cliente que não existe, para não revelar quais clientes existem na conta", comoResolver: "Usar uma chave da conta ou do cliente certo", repetivel: false },
  'EXA-0004': { familia: 'EXA', status: 429, type: 0, significado: "Muitas requisições com a mesma chave em pouco tempo. Também cobre o bloqueio do login por tentativas erradas (5 em 15 min, configurável), com `429`", comoResolver: "Esperar o tempo do cabeçalho `Retry-After`; no login, o tempo dito na mensagem", repetivel: true },
  'EXA-0005': { familia: 'EXA', status: 403, type: 6, significado: "A função do usuário (ou a chave) não tem a permissão para essa ação. No painel: usuário desativado, sem conta, não membro da conta escolhida, conta ainda não escolhida ou área só da equipe do LeroLero (cada caso com mensagem própria)", comoResolver: "Pedir a um admin a permissão citada na `description`; no painel, seguir a mensagem", repetivel: false },
  'EXA-0006': { familia: 'EXA', status: 409, type: 3, significado: "Cadastro (`POST /painel/auth/registrar`) com um e-mail que já tem cadastro confirmado (409, type 3). E-mail com cadastro ainda pendente não dá erro: a senha passa a ser a nova e o código é reenviado", comoResolver: "Entrar com o e-mail ou usar \"Esqueci a senha\"", repetivel: false },
  'EXA-0007': { familia: 'EXA', status: 422, type: 2, significado: "Código ou link de acesso inválido, vencido ou já usado: código de 6 números ou link de confirmar o e-mail, link de redefinir a senha (422, cada caso com mensagem própria)", comoResolver: "Pedir um código novo (\"Reenviar código\") ou um link novo (\"Esqueci a senha\")", repetivel: false },
  'EXA-0008': { familia: 'EXA', status: 404, type: 4, significado: "Convite não encontrado (404), vencido (vale 7 dias), já usado (409) ou cancelado", comoResolver: "Pedir um convite novo a um admin da conta; se já foi usado, entrar com e-mail e senha", repetivel: false },
  'EXA-0009': { familia: 'EXA', status: 403, type: 6, significado: "Você já está na lista dos pré-aprovados", comoResolver: "Em breve te liberaremos", repetivel: false },
  'EXA-0010': { familia: 'EXA', status: 403, type: 6, significado: "Seu cadastro não foi aprovado", comoResolver: "Se quiser conversar, fale com o suporte do LeroLero", repetivel: false },
  'EXA-0011': { familia: 'EXA', status: 403, type: 6, significado: "Ative a verificação em duas etapas para entrar no Admin", comoResolver: "Seguir o que a `description` do erro diz", repetivel: false },
  'EXC-0001': { familia: 'EXC', status: 404, type: 4, significado: "Cliente não encontrado", comoResolver: "Conferir o `cliente` enviado (id do LeroLero ou id externo do cadastro)", repetivel: false },
  'EXC-0002': { familia: 'EXC', status: 422, type: 2, significado: "A conta tem mais de um cliente e o campo `cliente` não veio", comoResolver: "Mandar o `cliente` em cada envio, ou usar uma chave com escopo de cliente", repetivel: false },
  'EXC-0003': { familia: 'EXC', status: 403, type: 6, significado: "Cliente pausado pela conta", comoResolver: "Reativar o cliente no painel", repetivel: false },
  'EXC-0004': { familia: 'EXC', status: 429, type: 6, significado: "Limite de mensagens do cliente atingido no período", comoResolver: "Aumentar o limite (`PUT /v1/clientes/{id}/limites`) ou esperar a renovação, informada na `description`", repetivel: false },
  'EXC-0005': { familia: 'EXC', status: 403, type: 6, significado: "Envios bloqueados por mensalidade do LeroLero vencida", comoResolver: "Regularizar a fatura em Faturamento; mensagens recebidas continuam chegando", repetivel: false },
  'EXC-0006': { familia: 'EXC', status: 403, type: 6, significado: "Cliente suspenso pela OliveSTech (\"Cliente suspenso pela OliveSTech. Fale com o suporte.\")", comoResolver: "Falar com o suporte; a conta não consegue reativar sozinha", repetivel: false },
  'EXC-0007': { familia: 'EXC', status: 409, type: 3, significado: "Criar ou converter uma conta com CPF ou CNPJ que já tem conta (409, `field: documento`). A mensagem é neutra e não diz de quem é a conta; no `/admin`, traz o link para a conta existente", comoResolver: "Entrar na conta existente, ou falar com o suporte se não reconhece a conta", repetivel: false },
  'EXC-0008': { familia: 'EXC', status: 409, type: 3, significado: "Cliente com CPF ou CNPJ já usado por outro cliente da mesma conta, ao criar ou ao trocar o documento (409, `field: documento`). Cita o nome e o `cli_` só se o cliente existente estiver no escopo de quem pediu", comoResolver: "Abrir o cadastro existente, ou pedir a um admin para incluir o cliente no seu acesso", repetivel: false },
  'EXC-0009': { familia: 'EXC', status: 422, type: 2, significado: "CPF ou CNPJ inválido: dígito verificador errado ou tamanho que não é de CPF (11) nem de CNPJ (14) (422, `field: documento`)", comoResolver: "Corrigir o documento; com ou sem pontuação, o LeroLero grava só os dígitos", repetivel: false },
  'EXC-0010': { familia: 'EXC', status: 409, type: 3, significado: "O id externo já é de outro cliente desta conta (409, `field: idExterno`)", comoResolver: "Usar outro id externo ou abrir o cadastro existente, citado na `description` quando está no seu acesso", repetivel: false },
  'EXN-0001': { familia: 'EXN', status: 404, type: 4, significado: "Número não encontrado ou não conectado", comoResolver: "Conferir o `numero` enviado ou conectar o número em Números", repetivel: false },
  'EXN-0002': { familia: 'EXN', status: 409, type: 3, significado: "Nome de exibição ainda não aprovado pela Meta", comoResolver: "Esperar a aprovação; o status aparece em Números", repetivel: false },
  'EXN-0003': { familia: 'EXN', status: 403, type: 6, significado: "Limite diário da Meta atingido (pessoas diferentes fora da janela em 24h, ex.: 250 sem verificação)", comoResolver: "Esperar a janela de 24h ou fazer a verificação do negócio para subir o limite", repetivel: false },
  'EXN-0004': { familia: 'EXN', status: 403, type: 6, significado: "Número restrito pela Meta por qualidade baixa", comoResolver: "Pausar o marketing, revisar o conteúdo; o detalhe está em Números", repetivel: false },
  'EXN-0005': { familia: 'EXN', status: 409, type: 3, significado: "Coexistência desconectada (o app WhatsApp Business ficou mais de 14 dias sem abrir, foi desconectado no celular ou a Meta desligou). O LeroLero avisa pelo evento `number.status`, no sino e por e-mail", comoResolver: "Abrir o app no celular e reconectar o número no painel", repetivel: false },
  'EXN-0006': { familia: 'EXN', status: 409, type: 3, significado: "O provedor escolhido para o número ainda não está disponível (hoje, a ponte Chatwoot). `409`", comoResolver: "Usar a Cloud API ou o Simulador; a ponte será avisada quando entrar", repetivel: false },
  'EXN-0007': { familia: 'EXN', status: 409, type: 3, significado: "Outra troca da credencial da Meta desse cliente aconteceu ao mesmo tempo. `409`", comoResolver: "Tentar de novo em instantes; se repetir, reconectar em Números", repetivel: true },
  'EXN-0008': { familia: 'EXN', status: 409, type: 3, significado: "O número (`phone_number_id`) ou a WABA já está ligado a outro cliente. `409`, com `field` no campo repetido. Na mesma conta, a `description` cita o cliente; em outra conta, a mensagem é neutra, sem dizer de quem é", comoResolver: "Desconectar do outro cliente antes, ou falar com o suporte se não for da sua conta", repetivel: false },
  'EXN-0009': { familia: 'EXN', status: 429, type: 6, significado: "A Meta limita quantos clientes novos podem ser conectados por período neste começo, e o limite foi atingido (429)", comoResolver: "Tentar de novo em alguns dias; quem já tem número conectado não conta", repetivel: false },
  'EXN-0010': { familia: 'EXN', status: 403, type: 6, significado: "O plano não permite mais números da Meta: ao conectar, a conta já chegou no total; no envio, o número está além do plano e só recebe", comoResolver: "Trocar de plano em Faturamento ou escolher em Números quais números ficam no plano", repetivel: false },
  'EXN-0011': { familia: 'EXN', status: 422, type: 2, significado: "A escolha dos números que ficam no plano não vale (acima do limite, número do Simulador ou conta sem plano)", comoResolver: "Escolher em Números só números da Meta, dentro do limite do plano; a `description` diz o motivo", repetivel: false },
  'EXN-0012': { familia: 'EXN', status: 404, type: 4, significado: "Esse número usa o app do LeroLero na Meta, sem webhook próprio para configurar", comoResolver: "Para usar o app da empresa, cadastre o número de novo informando o App Secret", repetivel: false },
  'EXM-0001': { familia: 'EXM', status: 422, type: 2, significado: "Telefone inválido", comoResolver: "Usar o formato `+55 DDD número`, ex.: `+5511984213307`", repetivel: false },
  'EXM-0002': { familia: 'EXM', status: 422, type: 2, significado: "Texto livre fora da janela de 24h (o contato não escreveu nas últimas 24h)", comoResolver: "Iniciar a conversa com um template aprovado", repetivel: false },
  'EXM-0003': { familia: 'EXM', status: 403, type: 6, significado: "Contato pediu para sair (opt-out)", comoResolver: "Não enviar; o contato volta só se escrever de novo ou der novo aceite", repetivel: false },
  'EXM-0004': { familia: 'EXM', status: 403, type: 6, significado: "Template de marketing para contato sem aceite (opt-in)", comoResolver: "Registrar o aceite do contato antes de enviar marketing", repetivel: false },
  'EXM-0005': { familia: 'EXM', status: 422, type: 2, significado: "O telefone não tem WhatsApp", comoResolver: "Conferir o número com o contato; o contato fica marcado em Bloqueios", repetivel: false },
  'EXM-0006': { familia: 'EXM', status: 422, type: 2, significado: "Variável do template faltando, sobrando ou vazia", comoResolver: "Mandar todas as variáveis do template, com o nome exato (`{{nome}}` → `\"nome\"`)", repetivel: false },
  'EXM-0007': { familia: 'EXM', status: 422, type: 2, significado: "Mídia não encontrada, expirada ou em formato que a Meta não aceita", comoResolver: "Fazer novo upload em `POST /v1/media`; a `description` traz formatos e tamanhos aceitos", repetivel: false },
  'EXM-0008': { familia: 'EXM', status: 409, type: 3, significado: "`Idempotency-Key` repetida com corpo diferente", comoResolver: "Gerar uma chave nova para cada envio diferente", repetivel: false },
  'EXM-0009': { familia: 'EXM', status: 404, type: 4, significado: "Mensagem não encontrada", comoResolver: "Conferir o id (`msg_...`)", repetivel: false },
  'EXM-0010': { familia: 'EXM', status: 422, type: 2, significado: "Data de agendamento no passado ou além do limite", comoResolver: "Mandar `agendarPara` no futuro, com fuso (`-03:00`)", repetivel: false },
  'EXM-0011': { familia: 'EXM', status: 409, type: 3, significado: "A mensagem já saiu da fila e não pode mais ser cancelada", comoResolver: "Acompanhe o status dela pelo GET ou pelo webhook", repetivel: false },
  'EXM-0012': { familia: 'EXM', status: 404, type: 4, significado: "Contato não encontrado neste cliente", comoResolver: "Confira o telefone em E.164 e o cliente, ou registre o aceite para criar o contato", repetivel: false },
  'EXTP-0001': { familia: 'EXTP', status: 404, type: 4, significado: "Template não encontrado", comoResolver: "Conferir o nome (minúsculo, com `_`) ou criar em Templates", repetivel: false },
  'EXTP-0002': { familia: 'EXTP', status: 422, type: 2, significado: "Template existe, mas ainda não foi aprovado para esse cliente", comoResolver: "Esperar a aprovação; o status por cliente está em Templates", repetivel: false },
  'EXTP-0003': { familia: 'EXTP', status: 409, type: 3, significado: "Template pausado ou desativado pela Meta por qualidade", comoResolver: "Usar outro template; pausado volta em algumas horas, desativado precisa de um novo", repetivel: false },
  'EXTP-0004': { familia: 'EXTP', status: 422, type: 2, significado: "Meta rejeitou o template na criação", comoResolver: "Ler a `description`, que traz o motivo da Meta, corrigir e enviar de novo", repetivel: false },
  'EXTP-0005': { familia: 'EXTP', status: 422, type: 2, significado: "Nome de template inválido", comoResolver: "Usar só letras minúsculas, números e `_`", repetivel: false },
  'EXTP-0006': { familia: 'EXTP', status: 422, type: 2, significado: "Botão inválido (payload faltando, link sem `https`, código de copiar acima de 15 caracteres)", comoResolver: "Ajustar o botão; linha digitável e Pix vão no corpo ou num botão de link", repetivel: false },
  'EXTP-0007': { familia: 'EXTP', status: 409, type: 3, significado: "Já existe template com esse nome e idioma", comoResolver: "Usar outro nome ou criar uma versão (`boleto_disponivel_v2`)", repetivel: false },
  'EXTP-0008': { familia: 'EXTP', status: 403, type: 6, significado: "A Meta não libera template de autenticação para esta conta (falta verificação do negócio, limite de 2.000 ou há restrição)", comoResolver: "Verificar a empresa e subir o limite; reescrever o texto não resolve. Enquanto isso, mandar o código como texto dentro da janela", repetivel: false },
  'EXTP-0009': { familia: 'EXTP', status: 409, type: 3, significado: "O template não pode ser editado agora; a `description` diz o motivo", comoResolver: "Seguir o motivo da `description` ou criar uma versão nova do template", repetivel: false },
  'EXTP-0010': { familia: 'EXTP', status: 409, type: 3, significado: "A Meta limita as edições de um template aprovado e o limite foi atingido", comoResolver: "Esperar a data de `edicao.liberaEm` em `GET /v1/templates/{id}` ou criar uma versão nova", repetivel: false },
  'EXTP-0011': { familia: 'EXTP', status: 404, type: 4, significado: "Modelo não encontrado", comoResolver: "Confira o id (mdl_...) em GET /v1/modelos", repetivel: false },
  'EXTP-0012': { familia: 'EXTP', status: 422, type: 2, significado: "Falta um dado do cliente para criar a cópia do modelo; a `description` diz qual", comoResolver: "Completar o cadastro do cliente com o dado citado e tentar de novo", repetivel: false },
  'EXTP-0013': { familia: 'EXTP', status: 409, type: 3, significado: "Este modelo é travado: todos os clientes recebem o mesmo texto", comoResolver: "Para texto próprio, crie o modelo como personalizável", repetivel: false },
  'EXTP-0014': { familia: 'EXTP', status: 403, type: 6, significado: "Esse template é do LeroLero e só sai pelo número oficial dele", comoResolver: "Use um template da sua conta", repetivel: false },
  'EXBV-0001': { familia: 'EXBV', status: 409, type: 3, significado: "Este celular já recebeu a mensagem de boas-vindas do LeroLero, que sai uma vez só", comoResolver: "Seguir pelo Simulador; a data do envio está na `description`", repetivel: false },
  'EXBV-0002': { familia: 'EXBV', status: 429, type: 0, significado: "O LeroLero já enviou todas as boas-vindas de hoje", comoResolver: "Tente de novo amanhã ou siga pelo simulador", repetivel: false },
  'EXBV-0003': { familia: 'EXBV', status: 409, type: 3, significado: "A mensagem de boas-vindas do LeroLero ainda não foi aprovada pela Meta", comoResolver: "Siga pelo simulador; ela chega quando for aprovada", repetivel: false },
  'EXBV-0004': { familia: 'EXBV', status: 503, type: 0, significado: "O número do LeroLero não está disponível agora", comoResolver: "Tente de novo em alguns minutos ou siga pelo simulador", repetivel: true },
  'EXBV-0005': { familia: 'EXBV', status: 422, type: 2, significado: "A conta não tem celular no cadastro", comoResolver: "Informe o celular em Configurações > Conta para receber as boas-vindas", repetivel: false },
  'EXBV-0006': { familia: 'EXBV', status: 409, type: 3, significado: "Esta é a mensagem de boas-vindas do LeroLero: aparece só para consulta e não se reenvia, duplica nem cancela", comoResolver: "Seguir o que a `description` do erro diz", repetivel: false },
  'EXCP-0001': { familia: 'EXCP', status: 409, type: 3, significado: "Campanha não cabe no limite (do cliente ou diário da Meta)", comoResolver: "Reduzir o público, aumentar o limite ou aceitar envio parcial", repetivel: false },
  'EXCP-0002': { familia: 'EXCP', status: 422, type: 2, significado: "Nenhum contato da lista pode receber (sem aceite ou com opt-out)", comoResolver: "Revisar a lista; a estimativa mostra quantos ficaram de fora e por quê", repetivel: false },
  'EXCP-0003': { familia: 'EXCP', status: 409, type: 3, significado: "Campanha já iniciada ou concluída", comoResolver: "Nada a fazer; para mudar, crie outra campanha", repetivel: false },
  'EXW-0001': { familia: 'EXW', status: 422, type: 2, significado: "URL do webhook inválida ou sem `https`", comoResolver: "Cadastrar uma URL `https` pública", repetivel: false },
  'EXW-0002': { familia: 'EXW', status: 404, type: 4, significado: "Endpoint de webhook não encontrado", comoResolver: "Conferir o id", repetivel: false },
  'EXW-0003': { familia: 'EXW', status: 502, type: 0, significado: "Disparo de teste falhou (o seu servidor não respondeu 2xx)", comoResolver: "Ver a resposta do seu servidor na entrega; o teste pode ser repetido", repetivel: false },
  'EXMT-0001': { familia: 'EXMT', status: 502, type: 0, significado: "A Meta está instável ou limitou a velocidade", comoResolver: "Nada: o LeroLero tenta de novo sozinho (5 s, 30 s, 5 min, 30 min)", repetivel: true },
  'EXMT-0002': { familia: 'EXMT', status: 502, type: 0, significado: "Muitas mensagens para o mesmo contato em pouco tempo", comoResolver: "Nada: o LeroLero tenta de novo mais tarde", repetivel: true },
  'EXMT-0003': { familia: 'EXMT', status: 403, type: 6, significado: "O contato atingiu o limite de mensagens de marketing que a Meta permite receber", comoResolver: "Não reenviar agora; tentar outro dia", repetivel: false },
  'EXMT-0004': { familia: 'EXMT', status: 403, type: 6, significado: "Problema de pagamento na conta Meta do cliente (cartão recusado ou ausente)", comoResolver: "Cadastrar ou trocar o cartão no WhatsApp Manager; o painel mostra o link", repetivel: false },
  'EXMT-0005': { familia: 'EXMT', status: 401, type: 5, significado: "Acesso à conta do WhatsApp do cliente perdido, numa operação já configurada: token inválido, expirado ou revogado, ou permissão removida (códigos 3, 10 e 200 a 299 da Meta). Ou: No cadastro ou na reconexão: a Meta recusou o token que a pessoa acabou de informar", comoResolver: "Reconectar o número em Números, concedendo todas as permissões pedidas. Ou: Gerar um token novo do usuário do sistema, com as permissões `whatsapp_business_messaging` e `whatsapp_business_management`, e colar de novo", repetivel: false },
  'EXMT-0006': { familia: 'EXMT', status: 502, type: 0, significado: "A Meta recusou por outro motivo. Na conexão pelo Embedded Signup: o `code` é inválido, venceu ou já foi usado (`field: code`). Se a Meta estiver fora do ar ou sem resposta, a conexão volta `EXMT-0001` em 502", comoResolver: "Ler a `description`, que traz a mensagem da Meta; na conexão, abrir o popup de novo para gerar outro code", repetivel: false },
  'EXF-0001': { familia: 'EXF', status: 502, type: 0, significado: "O serviço de pagamentos está fora do ar ou não respondeu", comoResolver: "Tente de novo em alguns minutos", repetivel: true },
  'EXF-0002': { familia: 'EXF', status: 422, type: 2, significado: "O serviço de pagamentos recusou o pedido; a `description` traz o motivo", comoResolver: "Corrigir o que o motivo aponta (ex.: dados do cartão) e tentar de novo", repetivel: false },
  'EXF-0003': { familia: 'EXF', status: 502, type: 0, significado: "O serviço de pagamentos ainda não oferece essa operação (502)", comoResolver: "Falar com o suporte", repetivel: false },
  'EXF-0004': { familia: 'EXF', status: 409, type: 3, significado: "O plano ainda não está à venda nessa periodicidade: falta o preço dele no serviço de pagamentos", comoResolver: "Escolher outra periodicidade ou falar com o suporte", repetivel: false },
}

/**
 * Os códigos com nome, por assunto, para comparar sem decorar o número.
 *
 * @example
 * if (resultado.erro?.code === Erros.Mensagens.JanelaFechada) enviarTemplate()
 */
export const Erros = {
  Acesso: {
    /** EXA-0001 · Chave de API ausente, inválida, expirada ou revogada. No painel: e-mail ou senha incorretos, código de MFA inválido, desafio de MFA vencido, sessão expirada ou encerrada (cada caso com mensagem própria). Como resolver: Conferir o cabeçalho `Authorization: Bearer lero_...` e a chave no painel; no painel, seguir a mensagem (conferir os dados ou entrar de novo). */
    ChaveInvalida: 'EXA-0001',
    /** EXA-0002 · Chave de teste usada em recurso que só existe em produção (ou o contrário). Também quando uma chave `lero_live_` é usada em conta que está no modo teste (403, "A conta está em modo teste. Escolha um plano para usar a chave de produção."); a chave não é revogada e volta a funcionar quando a conta sai do modo teste. Como resolver: Usar `lero_live_` para envio real e `lero_test_` para o simulador; no modo teste, escolher um plano. */
    AmbienteDaChave: 'EXA-0002',
    /** EXA-0003 · A chave não tem acesso a esse cliente (chave com escopo de outro cliente). Com escopo restrito, também cobre o cliente que não existe, para não revelar quais clientes existem na conta. Como resolver: Usar uma chave da conta ou do cliente certo. */
    ChaveSemAcessoCliente: 'EXA-0003',
    /** EXA-0004 · Muitas requisições com a mesma chave em pouco tempo. Também cobre o bloqueio do login por tentativas erradas (5 em 15 min, configurável), com `429`. Como resolver: Esperar o tempo do cabeçalho `Retry-After`; no login, o tempo dito na mensagem. */
    MuitasRequisicoes: 'EXA-0004',
    /** EXA-0005 · A função do usuário (ou a chave) não tem a permissão para essa ação. No painel: usuário desativado, sem conta, não membro da conta escolhida, conta ainda não escolhida ou área só da equipe do LeroLero (cada caso com mensagem própria). Como resolver: Pedir a um admin a permissão citada na `description`; no painel, seguir a mensagem. */
    SemPermissao: 'EXA-0005',
    /** EXA-0006 · Cadastro (`POST /painel/auth/registrar`) com um e-mail que já tem cadastro confirmado (409, type 3). E-mail com cadastro ainda pendente não dá erro: a senha passa a ser a nova e o código é reenviado. Como resolver: Entrar com o e-mail ou usar "Esqueci a senha". */
    EmailJaCadastrado: 'EXA-0006',
    /** EXA-0007 · Código ou link de acesso inválido, vencido ou já usado: código de 6 números ou link de confirmar o e-mail, link de redefinir a senha (422, cada caso com mensagem própria). Como resolver: Pedir um código novo ("Reenviar código") ou um link novo ("Esqueci a senha"). */
    CodigoInvalido: 'EXA-0007',
    /** EXA-0008 · Convite não encontrado (404), vencido (vale 7 dias), já usado (409) ou cancelado. Como resolver: Pedir um convite novo a um admin da conta; se já foi usado, entrar com e-mail e senha. */
    ConviteInvalido: 'EXA-0008',
    /** EXA-0009 · Você já está na lista dos pré-aprovados. Como resolver: Em breve te liberaremos. */
    AguardandoAprovacao: 'EXA-0009',
    /** EXA-0010 · Seu cadastro não foi aprovado. Como resolver: Se quiser conversar, fale com o suporte do LeroLero. */
    CadastroRecusado: 'EXA-0010',
    /** EXA-0011 · Ative a verificação em duas etapas para entrar no Admin. Como resolver: Seguir o que a `description` do erro diz. */
    MfaObrigatorio: 'EXA-0011',
  },
  Clientes: {
    /** EXC-0001 · Cliente não encontrado. Como resolver: Conferir o `cliente` enviado (id do LeroLero ou id externo do cadastro). */
    NaoEncontrado: 'EXC-0001',
    /** EXC-0002 · A conta tem mais de um cliente e o campo `cliente` não veio. Como resolver: Mandar o `cliente` em cada envio, ou usar uma chave com escopo de cliente. */
    ClienteObrigatorio: 'EXC-0002',
    /** EXC-0003 · Cliente pausado pela conta. Como resolver: Reativar o cliente no painel. */
    Pausado: 'EXC-0003',
    /** EXC-0004 · Limite de mensagens do cliente atingido no período. Como resolver: Aumentar o limite (`PUT /v1/clientes/{id}/limites`) ou esperar a renovação, informada na `description`. */
    LimiteAtingido: 'EXC-0004',
    /** EXC-0005 · Envios bloqueados por mensalidade do LeroLero vencida. Como resolver: Regularizar a fatura em Faturamento; mensagens recebidas continuam chegando. */
    MensalidadeVencida: 'EXC-0005',
    /** EXC-0006 · Cliente suspenso pela OliveSTech ("Cliente suspenso pela OliveSTech. Fale com o suporte."). Como resolver: Falar com o suporte; a conta não consegue reativar sozinha. */
    Suspenso: 'EXC-0006',
    /** EXC-0007 · Criar ou converter uma conta com CPF ou CNPJ que já tem conta (409, `field: documento`). A mensagem é neutra e não diz de quem é a conta; no `/admin`, traz o link para a conta existente. Como resolver: Entrar na conta existente, ou falar com o suporte se não reconhece a conta. */
    ContaComMesmoDocumento: 'EXC-0007',
    /** EXC-0008 · Cliente com CPF ou CNPJ já usado por outro cliente da mesma conta, ao criar ou ao trocar o documento (409, `field: documento`). Cita o nome e o `cli_` só se o cliente existente estiver no escopo de quem pediu. Como resolver: Abrir o cadastro existente, ou pedir a um admin para incluir o cliente no seu acesso. */
    ClienteComMesmoDocumento: 'EXC-0008',
    /** EXC-0009 · CPF ou CNPJ inválido: dígito verificador errado ou tamanho que não é de CPF (11) nem de CNPJ (14) (422, `field: documento`). Como resolver: Corrigir o documento; com ou sem pontuação, o LeroLero grava só os dígitos. */
    DocumentoInvalido: 'EXC-0009',
    /** EXC-0010 · O id externo já é de outro cliente desta conta (409, `field: idExterno`). Como resolver: Usar outro id externo ou abrir o cadastro existente, citado na `description` quando está no seu acesso. */
    IdExternoEmUso: 'EXC-0010',
  },
  Numeros: {
    /** EXN-0001 · Número não encontrado ou não conectado. Como resolver: Conferir o `numero` enviado ou conectar o número em Números. */
    NaoEncontrado: 'EXN-0001',
    /** EXN-0002 · Nome de exibição ainda não aprovado pela Meta. Como resolver: Esperar a aprovação; o status aparece em Números. */
    NomeNaoAprovado: 'EXN-0002',
    /** EXN-0003 · Limite diário da Meta atingido (pessoas diferentes fora da janela em 24h, ex.: 250 sem verificação). Como resolver: Esperar a janela de 24h ou fazer a verificação do negócio para subir o limite. */
    LimiteDiarioMeta: 'EXN-0003',
    /** EXN-0004 · Número restrito pela Meta por qualidade baixa. Como resolver: Pausar o marketing, revisar o conteúdo; o detalhe está em Números. */
    RestritoPorQualidade: 'EXN-0004',
    /** EXN-0005 · Coexistência desconectada (o app WhatsApp Business ficou mais de 14 dias sem abrir, foi desconectado no celular ou a Meta desligou). O LeroLero avisa pelo evento `number.status`, no sino e por e-mail. Como resolver: Abrir o app no celular e reconectar o número no painel. */
    CoexistenciaDesligada: 'EXN-0005',
    /** EXN-0006 · O provedor escolhido para o número ainda não está disponível (hoje, a ponte Chatwoot). `409`. Como resolver: Usar a Cloud API ou o Simulador; a ponte será avisada quando entrar. */
    ProvedorIndisponivel: 'EXN-0006',
    /** EXN-0007 · Outra troca da credencial da Meta desse cliente aconteceu ao mesmo tempo. `409`. Como resolver: Tentar de novo em instantes; se repetir, reconectar em Números. */
    CredencialEmTroca: 'EXN-0007',
    /** EXN-0008 · O número (`phone_number_id`) ou a WABA já está ligado a outro cliente. `409`, com `field` no campo repetido. Na mesma conta, a `description` cita o cliente; em outra conta, a mensagem é neutra, sem dizer de quem é. Como resolver: Desconectar do outro cliente antes, ou falar com o suporte se não for da sua conta. */
    LigadoAOutroCliente: 'EXN-0008',
    /** EXN-0009 · A Meta limita quantos clientes novos podem ser conectados por período neste começo, e o limite foi atingido (429). Como resolver: Tentar de novo em alguns dias; quem já tem número conectado não conta. */
    LimiteDeOnboardings: 'EXN-0009',
    /** EXN-0010 · O plano não permite mais números da Meta: ao conectar, a conta já chegou no total; no envio, o número está além do plano e só recebe. Como resolver: Trocar de plano em Faturamento ou escolher em Números quais números ficam no plano. */
    LimiteDoPlano: 'EXN-0010',
    /** EXN-0011 · A escolha dos números que ficam no plano não vale (acima do limite, número do Simulador ou conta sem plano). Como resolver: Escolher em Números só números da Meta, dentro do limite do plano; a `description` diz o motivo. */
    EscolhaDoPlano: 'EXN-0011',
    /** EXN-0012 · Esse número usa o app do LeroLero na Meta, sem webhook próprio para configurar. Como resolver: Para usar o app da empresa, cadastre o número de novo informando o App Secret. */
    SemAppProprio: 'EXN-0012',
  },
  Mensagens: {
    /** EXM-0001 · Telefone inválido. Como resolver: Usar o formato `+55 DDD número`, ex.: `+5511984213307`. */
    TelefoneInvalido: 'EXM-0001',
    /** EXM-0002 · Texto livre fora da janela de 24h (o contato não escreveu nas últimas 24h). Como resolver: Iniciar a conversa com um template aprovado. */
    JanelaFechada: 'EXM-0002',
    /** EXM-0003 · Contato pediu para sair (opt-out). Como resolver: Não enviar; o contato volta só se escrever de novo ou der novo aceite. */
    ContatoSaiu: 'EXM-0003',
    /** EXM-0004 · Template de marketing para contato sem aceite (opt-in). Como resolver: Registrar o aceite do contato antes de enviar marketing. */
    MarketingSemAceite: 'EXM-0004',
    /** EXM-0005 · O telefone não tem WhatsApp. Como resolver: Conferir o número com o contato; o contato fica marcado em Bloqueios. */
    SemWhatsApp: 'EXM-0005',
    /** EXM-0006 · Variável do template faltando, sobrando ou vazia. Como resolver: Mandar todas as variáveis do template, com o nome exato (`{{nome}}` → `"nome"`). */
    VariavelInvalida: 'EXM-0006',
    /** EXM-0007 · Mídia não encontrada, expirada ou em formato que a Meta não aceita. Como resolver: Fazer novo upload em `POST /v1/media`; a `description` traz formatos e tamanhos aceitos. */
    MidiaInvalida: 'EXM-0007',
    /** EXM-0008 · `Idempotency-Key` repetida com corpo diferente. Como resolver: Gerar uma chave nova para cada envio diferente. */
    IdempotenciaConflitante: 'EXM-0008',
    /** EXM-0009 · Mensagem não encontrada. Como resolver: Conferir o id (`msg_...`). */
    NaoEncontrada: 'EXM-0009',
    /** EXM-0010 · Data de agendamento no passado ou além do limite. Como resolver: Mandar `agendarPara` no futuro, com fuso (`-03:00`). */
    AgendamentoInvalido: 'EXM-0010',
    /** EXM-0011 · A mensagem já saiu da fila e não pode mais ser cancelada. Como resolver: Acompanhe o status dela pelo GET ou pelo webhook. */
    NaoCancelavel: 'EXM-0011',
    /** EXM-0012 · Contato não encontrado neste cliente. Como resolver: Confira o telefone em E.164 e o cliente, ou registre o aceite para criar o contato. */
    ContatoNaoEncontrado: 'EXM-0012',
  },
  Templates: {
    /** EXTP-0001 · Template não encontrado. Como resolver: Conferir o nome (minúsculo, com `_`) ou criar em Templates. */
    NaoEncontrado: 'EXTP-0001',
    /** EXTP-0002 · Template existe, mas ainda não foi aprovado para esse cliente. Como resolver: Esperar a aprovação; o status por cliente está em Templates. */
    NaoAprovado: 'EXTP-0002',
    /** EXTP-0003 · Template pausado ou desativado pela Meta por qualidade. Como resolver: Usar outro template; pausado volta em algumas horas, desativado precisa de um novo. */
    PausadoOuDesativado: 'EXTP-0003',
    /** EXTP-0004 · Meta rejeitou o template na criação. Como resolver: Ler a `description`, que traz o motivo da Meta, corrigir e enviar de novo. */
    RejeitadoPelaMeta: 'EXTP-0004',
    /** EXTP-0005 · Nome de template inválido. Como resolver: Usar só letras minúsculas, números e `_`. */
    NomeInvalido: 'EXTP-0005',
    /** EXTP-0006 · Botão inválido (payload faltando, link sem `https`, código de copiar acima de 15 caracteres). Como resolver: Ajustar o botão; linha digitável e Pix vão no corpo ou num botão de link. */
    BotaoInvalido: 'EXTP-0006',
    /** EXTP-0007 · Já existe template com esse nome e idioma. Como resolver: Usar outro nome ou criar uma versão (`boleto_disponivel_v2`). */
    NomeEmUso: 'EXTP-0007',
    /** EXTP-0008 · A Meta não libera template de autenticação para esta conta (falta verificação do negócio, limite de 2.000 ou há restrição). Como resolver: Verificar a empresa e subir o limite; reescrever o texto não resolve. Enquanto isso, mandar o código como texto dentro da janela. */
    AutenticacaoNaoLiberada: 'EXTP-0008',
    /** EXTP-0009 · O template não pode ser editado agora; a `description` diz o motivo. Como resolver: Seguir o motivo da `description` ou criar uma versão nova do template. */
    NaoEditavel: 'EXTP-0009',
    /** EXTP-0010 · A Meta limita as edições de um template aprovado e o limite foi atingido. Como resolver: Esperar a data de `edicao.liberaEm` em `GET /v1/templates/{id}` ou criar uma versão nova. */
    LimiteDeEdicoes: 'EXTP-0010',
    /** EXTP-0011 · Modelo não encontrado. Como resolver: Confira o id (mdl_...) em GET /v1/modelos. */
    ModeloNaoEncontrado: 'EXTP-0011',
    /** EXTP-0012 · Falta um dado do cliente para criar a cópia do modelo; a `description` diz qual. Como resolver: Completar o cadastro do cliente com o dado citado e tentar de novo. */
    FaltaDadoDoCliente: 'EXTP-0012',
    /** EXTP-0013 · Este modelo é travado: todos os clientes recebem o mesmo texto. Como resolver: Para texto próprio, crie o modelo como personalizável. */
    ModeloTravado: 'EXTP-0013',
    /** EXTP-0014 · Esse template é do LeroLero e só sai pelo número oficial dele. Como resolver: Use um template da sua conta. */
    Reservado: 'EXTP-0014',
  },
  BoasVindas: {
    /** EXBV-0001 · Este celular já recebeu a mensagem de boas-vindas do LeroLero, que sai uma vez só. Como resolver: Seguir pelo Simulador; a data do envio está na `description`. */
    JaUsada: 'EXBV-0001',
    /** EXBV-0002 · O LeroLero já enviou todas as boas-vindas de hoje. Como resolver: Tente de novo amanhã ou siga pelo simulador. */
    TetoDoDia: 'EXBV-0002',
    /** EXBV-0003 · A mensagem de boas-vindas do LeroLero ainda não foi aprovada pela Meta. Como resolver: Siga pelo simulador; ela chega quando for aprovada. */
    TemplateNaoAprovado: 'EXBV-0003',
    /** EXBV-0004 · O número do LeroLero não está disponível agora. Como resolver: Tente de novo em alguns minutos ou siga pelo simulador. */
    NumeroDaCasaForaDoAr: 'EXBV-0004',
    /** EXBV-0005 · A conta não tem celular no cadastro. Como resolver: Informe o celular em Configurações > Conta para receber as boas-vindas. */
    SemTelefone: 'EXBV-0005',
    /** EXBV-0006 · Esta é a mensagem de boas-vindas do LeroLero: aparece só para consulta e não se reenvia, duplica nem cancela. Como resolver: Seguir o que a `description` do erro diz. */
    SoLeitura: 'EXBV-0006',
  },
  Campanhas: {
    /** EXCP-0001 · Campanha não cabe no limite (do cliente ou diário da Meta). Como resolver: Reduzir o público, aumentar o limite ou aceitar envio parcial. */
    NaoCabeNoLimite: 'EXCP-0001',
    /** EXCP-0002 · Nenhum contato da lista pode receber (sem aceite ou com opt-out). Como resolver: Revisar a lista; a estimativa mostra quantos ficaram de fora e por quê. */
    PublicoVazio: 'EXCP-0002',
    /** EXCP-0003 · Campanha já iniciada ou concluída. Como resolver: Nada a fazer; para mudar, crie outra campanha. */
    JaIniciada: 'EXCP-0003',
  },
  Webhooks: {
    /** EXW-0001 · URL do webhook inválida ou sem `https`. Como resolver: Cadastrar uma URL `https` pública. */
    UrlInvalida: 'EXW-0001',
    /** EXW-0002 · Endpoint de webhook não encontrado. Como resolver: Conferir o id. */
    NaoEncontrado: 'EXW-0002',
    /** EXW-0003 · Disparo de teste falhou (o seu servidor não respondeu 2xx). Como resolver: Ver a resposta do seu servidor na entrega; o teste pode ser repetido. */
    TesteFalhou: 'EXW-0003',
  },
  Meta: {
    /** EXMT-0001 · A Meta está instável ou limitou a velocidade. Como resolver: Nada: o LeroLero tenta de novo sozinho (5 s, 30 s, 5 min, 30 min). */
    Indisponivel: 'EXMT-0001',
    /** EXMT-0002 · Muitas mensagens para o mesmo contato em pouco tempo. Como resolver: Nada: o LeroLero tenta de novo mais tarde. */
    MuitasParaOContato: 'EXMT-0002',
    /** EXMT-0003 · O contato atingiu o limite de mensagens de marketing que a Meta permite receber. Como resolver: Não reenviar agora; tentar outro dia. */
    LimiteMarketingContato: 'EXMT-0003',
    /** EXMT-0004 · Problema de pagamento na conta Meta do cliente (cartão recusado ou ausente). Como resolver: Cadastrar ou trocar o cartão no WhatsApp Manager; o painel mostra o link. */
    PagamentoNaMeta: 'EXMT-0004',
    /** EXMT-0005 · Acesso à conta do WhatsApp do cliente perdido, numa operação já configurada: token inválido, expirado ou revogado, ou permissão removida (códigos 3, 10 e 200 a 299 da Meta). Ou: No cadastro ou na reconexão: a Meta recusou o token que a pessoa acabou de informar. Como resolver: Reconectar o número em Números, concedendo todas as permissões pedidas. Ou: Gerar um token novo do usuário do sistema, com as permissões `whatsapp_business_messaging` e `whatsapp_business_management`, e colar de novo. */
    AcessoPerdido: 'EXMT-0005',
    /** EXMT-0006 · A Meta recusou por outro motivo. Na conexão pelo Embedded Signup: o `code` é inválido, venceu ou já foi usado (`field: code`). Se a Meta estiver fora do ar ou sem resposta, a conexão volta `EXMT-0001` em 502. Como resolver: Ler a `description`, que traz a mensagem da Meta; na conexão, abrir o popup de novo para gerar outro code. */
    Recusou: 'EXMT-0006',
  },
  Faturamento: {
    /** EXF-0001 · O serviço de pagamentos está fora do ar ou não respondeu. Como resolver: Tente de novo em alguns minutos. */
    OlivesPayIndisponivel: 'EXF-0001',
    /** EXF-0002 · O serviço de pagamentos recusou o pedido; a `description` traz o motivo. Como resolver: Corrigir o que o motivo aponta (ex.: dados do cartão) e tentar de novo. */
    OlivesPayRecusou: 'EXF-0002',
    /** EXF-0003 · O serviço de pagamentos ainda não oferece essa operação (502). Como resolver: Falar com o suporte. */
    AindaSemRota: 'EXF-0003',
    /** EXF-0004 · O plano ainda não está à venda nessa periodicidade: falta o preço dele no serviço de pagamentos. Como resolver: Escolher outra periodicidade ou falar com o suporte. */
    PlanoSemPreco: 'EXF-0004',
  },
} as const
