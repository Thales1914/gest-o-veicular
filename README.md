# Gestão Veicular

Backend da Sprint 01 do aplicativo de gestão e manutenção veicular, construído com Node.js, Express e PostgreSQL.

## Estrutura do backend

```text
backend/
├── src/
│   ├── config/          # ambiente, banco e migrations
│   ├── controllers/     # entrada e saída HTTP
│   ├── database/        # migrations PostgreSQL
│   ├── middlewares/     # autenticação e erros
│   ├── repositories/    # consultas ao banco
│   ├── routes/          # endpoints Express
│   ├── services/        # regras de negócio
│   ├── utils/
│   └── validators/      # validações Zod
└── test/                # testes de integração
```

## Configuração

Instale as dependências:

```bash
npm install
```

Copie `backend/.env.example` para `backend/.env` e configure:

```env
NODE_ENV=development
PORT=3333
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/gestao_veicular
JWT_SECRET=uma-chave-segura-com-pelo-menos-32-caracteres
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

Suba o PostgreSQL e execute a migration:

```bash
docker compose up -d database
npm run backend:migrate
```

Inicie a API:

```bash
npm run backend:dev
```

## Endpoints

| Método | Rota | Autenticação | Descrição |
|---|---|---:|---|
| `GET` | `/health` | Não | Verifica a API |
| `POST` | `/auth/register` | Não | Cadastra usuário |
| `POST` | `/auth/login` | Não | Retorna token JWT |
| `POST` | `/vehicles` | Bearer JWT | Cadastra veículo |
| `GET` | `/vehicles` | Bearer JWT | Lista os veículos do usuário |
| `GET` | `/vehicles/:id` | Bearer JWT | Exibe um veículo do usuário |

## Testes

```bash
npm test
npm run check
```

Os testes validam cadastro, login, emissão de JWT, senha com bcrypt, cadastro e listagem de veículos, isolamento entre usuários, credenciais inválidas e acesso sem token.

## Banco de dados

O Docker publica o PostgreSQL na porta `5433` para evitar conflito com instalações locais na porta `5432`.

- `users`: dados do usuário e hash da senha;
- `vehicles`: veículo vinculado ao usuário autenticado;
- `schema_migrations`: controle das migrations aplicadas.

Funcionalidades de manutenção, abastecimento, gastos e edição de veículos não fazem parte deste backend da Sprint 01.
