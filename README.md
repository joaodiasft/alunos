# RMIL Gestão Escolar (Next.js + Prisma + shadcn/ui)

Sistema escolar completo com painel administrativo e portais de aluno/responsável.

## Visão geral

- **Admin**: gestão de alunos, turmas, professores, disciplinas, aulas, frequência, financeiro, relatórios e logs.
- **Aluno**: visão de aulas, frequência e financeiro.
- **Responsável**: visão dos alunos vinculados e financeiro.

## Tecnologias

- Next.js (App Router)
- Prisma + PostgreSQL
- shadcn/ui
- LocalStorage (sessão client-side)

## Pré-requisitos

- Node.js 18+
- PostgreSQL (ou Prisma DB)

## Configuração local

1. Instale dependências:

```bash
npm install
```

2. Configure o banco (arquivo local `.env` já está ignorado pelo Git):

```
DATABASE_URL="postgres://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require&pool=true"
```

3. Gere o Prisma Client e rode migrações:

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Rode o seed:

```bash
npm run prisma:seed
```

5. Suba o projeto:

```bash
npm run dev
```

## Credenciais iniciais

- **Admin**: `redas@rmil.com` / `rmil`
- **Aluno** (seed): token `R001` / telefone `11988887777`
- **Responsável** (seed): nome `Marina Lima` / telefone `11977776666`

## Deploy na Vercel

1. Crie o projeto na Vercel apontando para este repositório.
2. Configure a variável de ambiente `DATABASE_URL` nas Settings do projeto.
3. Execute as migrações em ambiente de produção com `prisma migrate deploy`.

## Estrutura

- `src/app`: rotas e páginas
- `src/components`: componentes UI (shadcn)
- `src/lib`: utilitários, auth, Prisma client
- `prisma`: schema e seed
