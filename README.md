# UNINASSAU — Performance Dashboard

Dashboard de performance de campanhas Pós ao Vivo — Google Ads & Meta Ads.

## Stack
- **Next.js 14** (App Router)
- **Recharts** — gráficos
- **Google Sheets** — fonte de dados via CSV export

## Estrutura de Dados

O dashboard lê **3 abas** da planilha:

| Aba | Colunas |
|-----|---------|
| `Base Looker` | Data_Conversao, Hora_Conversao, Ano, Mes_Num, Mes_Ano, Semana_Ano, Dia_Semana_Num, Dia_Semana, Hora, Plataforma, Placement, Campanha, Anuncio, Keyword_Term, Curso, Fonte, Titulo_LP, Leads, URL |
| `Custo_Campanha-Googleads` | Data, Nome da campanha, ID da Campanha, Valor gasto |
| `Custo_Campanha-Metaads` | Data, Nome da campanha, ID da Campanha, Valor gasto |

## Deploy no Vercel

### 1. Configurar o Google Sheets como público

1. Abra sua planilha no Google Sheets
2. Clique em **Compartilhar** → **Alterar para qualquer pessoa com o link**
3. Defina como **Visualizador**

### 2. Deploy

```bash
# Instalar Vercel CLI (se não tiver)
npm i -g vercel

# Na pasta do projeto
npm install
vercel
```

### 3. Variáveis de ambiente no Vercel

No painel do Vercel → seu projeto → **Settings → Environment Variables**, adicione:

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_SHEET_ID` | `1dLYFQwKQK_sbeZ7onn8V7IffIkt0TBeot9HPhb6i2Ow` |
| `DASHBOARD_PASSWORD` | sua senha desejada |

### 4. Desenvolvimento local

```bash
cp .env.example .env.local
# Edite .env.local com suas variáveis
npm install
npm run dev
```

Acesse: http://localhost:3000

## Autenticação

Login simples com senha única. A senha é configurada na variável `DASHBOARD_PASSWORD`.

**Senha padrão:** `uninassau2024` (altere antes de publicar)

## Atualização dos dados

- A planilha atualiza automaticamente via Stract (a cada 3h)
- O dashboard faz cache de 15 minutos no servidor
- Clique em **↻ Atualizar** no sidebar para forçar atualização

## Páginas

- **Visão Geral** — KPIs consolidados, leads por dia, CPL, por plataforma, por curso
- **Google Ads** — Leads, investimento, CPL, campanhas, keywords, anúncios
- **Meta Ads** — Leads, investimento, CPL, campanhas, placements, cursos
