# 0013. Assinaturas das escolas e cobrança recorrente das famílias

- Status: proposta (gateway a confirmar após comparar taxas)
- Data: 2026-11-27

## Contexto

Há 2 cobranças recorrentes diferentes:

1. A Recreio cobra cada escola pelo uso do sistema (assinatura SaaS).
2. Cada escola cobra as famílias pelas mensalidades. O dinheiro é da escola e precisa cair na conta dela, não na da Recreio.

Misturar as duas no mesmo fluxo cria problema fiscal e de responsabilidade sobre o dinheiro de terceiros.

## Decisão

### Separação no código

- **Plataforma** (`apps/api/src/plataforma/`): escolas clientes, planos, assinaturas, faturas da Recreio, módulos liberados, provisionamento. Usada pela equipe da Recreio, fora do isolamento por escola.
- **Escola** (`apps/api/src/modules/`): tudo que a escola usa, isolado por `escola_id` e Row Level Security.

### Assinatura da escola (Recreio cobra a escola)

- Planos por faixa de alunos ativos, com módulos incluídos. Exemplo: Essencial (cadastro, pedagógico, comunicação), Completo (mais financeiro e portaria), adicionais (app próprio, domínio próprio).
- Tabelas `planos`, `assinaturas` (escola, plano, status, ciclo, próxima cobrança) e `faturas_plataforma`.
- Status da assinatura: `teste`, `ativa`, `inadimplente`, `suspensa`, `cancelada`. Inadimplente mostra aviso à direção; suspensa deixa só leitura e exportação de dados.
- Módulos liberados viram permissões: um módulo fora do plano some do menu e a API responde 403 `MODULO_NAO_CONTRATADO`.
- Contagem de alunos ativos mensal, gravada, para o reajuste de faixa.
- Cobrança por boleto, Pix e cartão no gateway, com nota fiscal de serviço emitida pelo mesmo gateway quando possível.

### Mensalidades (escola cobra a família)

- Cada escola tem uma subconta no gateway, com os dados bancários dela. Boleto e Pix saem em nome da escola e o dinheiro cai direto na conta dela.
- A Recreio pode receber uma taxa por transação pelo split do gateway, se o plano previr.
- Mensalidade gerada por contrato do aluno: valor, vencimento, desconto de pontualidade, multa e juros (regras de `prototipo/docs/dados-canonicos.md`).
- Webhooks do gateway assinados, idempotentes e processados pela fila (ADR 0009).
- Valores em centavos. Cada mudança de status de cobrança fica em histórico imutável.

### Gateway

Proposta: Asaas, por ter subcontas, split, boleto, Pix, cartão recorrente, régua de cobrança e emissão de NFS-e na mesma API. Alternativas a comparar antes de fechar: Iugu, Pagar.me e Efí. A integração fica atrás de uma interface (`GatewayPagamento`) para trocar de fornecedor sem mexer nos módulos.

## Consequências

- O dinheiro das famílias nunca passa pela conta da Recreio.
- Liberar ou bloquear módulo é configuração, sem deploy.
- O onboarding de uma escola nova inclui a abertura da subconta no gateway.
