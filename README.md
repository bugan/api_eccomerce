# API E-commerce Node.js

API RESTful modular construída com Node.js, Express, Prisma (PostgreSQL) e Redis.

## Pré-requisitos

- Node.js LTS (v18+)
- Docker e Docker Compose

## Configuração

1. **Instalar Dependências**
   ```bash
   npm install
   ```

2. **Configurar Ambiente**
   O arquivo `.env` já foi criado com defaults. Se necessário, ajuste as credenciais do banco.

3. **Iniciar Infraestrutura (Banco e Redis)**
   ```bash
   docker compose up -d
   ```

4. **Rodar Migrations do Banco**
   ```bash
   npm run migrate
   ```

## Rodando a API

- Desenvolvimento:
  ```bash
  npm run dev
  ```

## Estrutura

- **src/modules**: Contém a lógica de negócio dividida por domínio (Auth, Cart, Users, etc).
- **src/config**: Configurações de DB, Redis, Logger.
- **src/middlewares**: Middlewares globais (Erro, Auth, Logging).

## Endpoints Principais

- `POST /api/v1/auth/register`: Criar conta
- `POST /api/v1/auth/login`: Login
- `GET /api/v1/cart`: Ver carrinho (Requer Auth Header `Authorization: Bearer <token>`)
- `POST /api/v1/cart/items`: Adicionar item ao carrinho
