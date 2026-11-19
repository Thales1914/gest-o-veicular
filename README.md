# Gestão Veicular

Aplicativo mobile para organizar veículos, abastecimentos, manutenções, gastos, documentos, IPVA, vencimentos e lembretes. O projeto usa uma API Node.js/Express, PostgreSQL e um app React Native com Expo.

## Funcionalidades

- cadastro, login e autenticação JWT;
- cadastro, edição e exclusão de veículos;
- abastecimentos, manutenções e histórico consolidado;
- controle de gastos por período;
- cuidados por quilometragem;
- documentos com foto ou arquivo protegido;
- IPVA com parcelas e controle individual de pagamento;
- vencimentos de documentos e IPVA;
- lembretes locais no celular.

## Estrutura

```text
backend/              API, migrations e testes de integração
mobile/               aplicativo Expo para iOS, Android e web
docs/                 apresentação e roteiro de validação final
docker-compose.yml    PostgreSQL local na porta 5433
```

## Requisitos

- Node.js 22 ou superior;
- npm;
- Docker Desktop com o mecanismo Linux iniciado;
- Expo Go no celular;
- computador e celular na mesma rede para o modo LAN.

## 1. Instalação

Na raiz do projeto:

```powershell
npm install
```

Crie os arquivos locais de ambiente sem versionar credenciais:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item mobile/.env.example mobile/.env
```

O backend já vem preparado para:

```env
PORT=3333
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/gestao_veicular
```

No `mobile/.env`, substitua o IP de exemplo pelo IPv4 do computador:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:3333
```

No Windows, descubra o endereço com `ipconfig`. Use o IPv4 do adaptador Wi-Fi ativo; `localhost` no iPhone aponta para o próprio iPhone, não para o computador.

## 2. Banco e migrations

Abra o Docker Desktop e aguarde o status do mecanismo ficar ativo. Depois, na raiz:

```powershell
docker compose up -d database
docker compose ps
npm run backend:migrate
```

O PostgreSQL fica disponível em `localhost:5433`. As migrations são idempotentes e registradas em `schema_migrations`.

Para encerrar o banco sem apagar os dados:

```powershell
docker compose stop database
```

## 3. Backend

Em um terminal do VS Code, na raiz:

```powershell
npm run backend:dev
```

A API fica em `http://localhost:3333`. Confirme:

```powershell
Invoke-RestMethod http://localhost:3333/health
Invoke-RestMethod http://localhost:3333/health/ready
```

O segundo endpoint também confirma a conexão com o PostgreSQL.

## 4. Aplicativo no iPhone

Mantenha o backend rodando e abra outro terminal:

```powershell
cd mobile
npx expo start --lan --clear
```

Leia o QR Code com a câmera do iPhone e escolha abrir no Expo Go. Se a rede bloquear o modo LAN, instale o túnel uma vez e tente novamente:

```powershell
npm install --global @expo/ngrok@4.1.0
npx expo start --tunnel --clear
```

Se a porta `8081` estiver ocupada, aceite a porta seguinte ou encerre o processo antigo com `Ctrl+C` no terminal onde o Expo já está aberto.

## Testes e validações

Na raiz:

```powershell
npm test
npm run check
```

Os testes do backend cobrem autenticação, veículos, abastecimentos, manutenções, gastos, documentos e arquivos, IPVA e parcelas, vencimentos, histórico e cuidados. Os testes mobile cobrem períodos, datas, parcelas e planejamento dos lembretes.

Para validar o fluxo completo no aparelho, siga [docs/ROTEIRO_TESTE_CELULAR.md](docs/ROTEIRO_TESTE_CELULAR.md). A notificação local precisa ser confirmada em um celular físico.

## Rotas principais

Todas as rotas abaixo, exceto autenticação e saúde, exigem `Authorization: Bearer <token>`.

| Recurso | Rotas |
|---|---|
| Saúde | `GET /health`, `GET /health/ready` |
| Autenticação | `POST /auth/register`, `POST /auth/login` |
| Veículos | CRUD em `/vehicles` |
| Abastecimentos | CRUD em `/vehicles/:vehicleId/fuel-records` |
| Manutenções | CRUD em `/vehicles/:vehicleId/maintenance-records` |
| Documentos | CRUD em `/vehicles/:vehicleId/documents` e `GET/PUT .../:id/file` |
| IPVA | CRUD em `/vehicles/:vehicleId/ipva` |
| Gastos | `GET /vehicles/:vehicleId/expenses` |
| Vencimentos | `GET /vehicles/:vehicleId/deadlines` |
| Histórico | `GET /vehicles/:vehicleId/history` |
| Cuidados | `GET /vehicles/:vehicleId/care` |

## Solução de problemas

- `ECONNREFUSED ...:5433`: inicie o Docker Desktop e rode `docker compose up -d database`.
- O app não conecta à API: confira o IPv4 no `mobile/.env`, reinicie o Expo com `--clear` e permita Node.js na rede privada do Firewall do Windows.
- QR Code demora ou não abre: confirme que celular e PC estão na mesma rede ou use `--tunnel`.
- Alterações não aparecem: encerre instâncias antigas do Expo e do backend, depois inicie novamente.
- Lembretes não aparecem: permita notificações no iPhone, ative os lembretes na tela Vencimentos e mantenha data/hora automáticas.
