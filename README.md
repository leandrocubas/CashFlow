# FluxoControl - Sistema de Controle de Fluxo de Caixa

## Visão Geral
Sistema completo de controle de fluxo de caixa empresarial com dashboard interativo, gestão de receitas e despesas, relatórios financeiros e análise com inteligência artificial.

## Tecnologias
- **Backend:** FastAPI + MongoDB
- **Frontend:** React + Shadcn UI + Tailwind CSS
- **Autenticação:** JWT
- **IA:** OpenAI GPT-5.2 via Emergent LLM Key
- **Gráficos:** Recharts

## Funcionalidades Principais

### Dashboard
- Visão geral do saldo atual
- Cards de receitas a receber e despesas a pagar
- Itens atrasados com alertas
- Gráfico de fluxo de caixa mensal
- Card DRE (Demonstrativo de Resultado)
- Histórico de atividades recentes
- Análise com IA

### Receitas
- Cadastro completo com nome, descrição, valor, categoria
- Múltiplos tipos de pagamento (PIX, TED, Cartão, Parcelado)
- Cálculo automático de parcelas
- Marcação de recebimento
- Filtros por status

### Despesas
- Cadastro de despesas fixas e variáveis
- Suporte a pagamento parcial
- Tipos de pagamento variados
- Filtros por tipo e status

### Relatórios
- Evolução mensal
- Análise por categoria
- Análise por cliente/fornecedor
- DRE detalhado
- Análises IA (Projeções, Tendências, Recomendações)

### Configurações
- Gestão de categorias (receitas/despesas)
- Gestão de contatos (clientes/fornecedores)
- Criação dinâmica durante cadastro

## Como Iniciar

### Requisitos
- Python 3.11+
- Node.js 18+
- MongoDB

### Backend
```bash
cd backend
pip install -r requirements.txt
python server.py
```

### Frontend
```bash
cd frontend
yarn install
yarn start
```

## Variáveis de Ambiente

### Backend (.env)
| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `MONGO_URL` | URL de conexão MongoDB | `mongodb://localhost:27017` |
| `DB_NAME` | Nome do banco de dados | `fluxocontrol` |
| `JWT_SECRET` | Chave secreta para tokens JWT | `sua-chave-secreta-aqui` |
| `EMERGENT_LLM_KEY` | Chave API para análises IA | `sk-emergent-xxx` |
| `CORS_ORIGINS` | Origens permitidas | `*` |

### Frontend (.env)
| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `REACT_APP_BACKEND_URL` | URL do backend | `https://seu-backend.com` |

## Estrutura de Dados

### Receita
- Nome, descrição
- Cliente (contato)
- Categoria
- Valor total
- Tipo de pagamento
- Parcelas (se parcelado)
- Data de vencimento
- Status de pagamento

### Despesa
- Nome, descrição
- Fornecedor (contato)
- Categoria
- Tipo (fixa/variável)
- Valor total
- Tipo de pagamento
- Suporte a pagamento parcial
- Data de vencimento
- Status de pagamento

## API Endpoints

### Autenticação
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Usuário atual

### Dashboard
- `GET /api/dashboard/summary` - Resumo financeiro
- `GET /api/dashboard/cashflow` - Fluxo de caixa
- `GET /api/dashboard/dre` - DRE

### CRUD
- `/api/revenues` - Receitas
- `/api/expenses` - Despesas
- `/api/categories` - Categorias
- `/api/contacts` - Contatos
- `/api/activities` - Log de atividades

### Relatórios
- `/api/reports/by-category` - Por categoria
- `/api/reports/by-contact` - Por contato
- `/api/reports/monthly` - Mensal
- `/api/analysis/ai` - Análise IA

## Credenciais de Teste
- **Email:** admin@fluxocontrol.com
- **Senha:** admin123
