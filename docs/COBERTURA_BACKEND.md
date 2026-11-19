# Cobertura das rotas do backend

| Grupo de rotas | Teste principal |
|---|---|
| `/health`, `/auth` e cadastro/listagem de veículos | `backend/test/api.test.js` |
| `PUT/DELETE /vehicles/:id` | `backend/test/vehicleMutations.test.js` |
| `/fuel-records` | `backend/test/fuelRecords.test.js` |
| `/maintenance-records` | `backend/test/maintenanceRecords.test.js` |
| `/expenses` | `backend/test/expenses.test.js` |
| `/documents` | `backend/test/documents.test.js` |
| `/documents/:id/file` | `backend/test/documentFiles.test.js` |
| `/ipva` e parcelas | `backend/test/ipva.test.js`, `backend/test/ipvaInstallments.test.js` |
| `/deadlines` | `backend/test/deadlines.test.js` |
| `/history` | `backend/test/history.test.js` |
| `/care` | `backend/test/care.test.js` |

A suíte cobre sucesso, validações, autenticação, isolamento entre usuários e exclusões. Execute:

```powershell
npm run test --workspace backend
```

A auditoria final usa PostgreSQL e transporte HTTP reais em um schema temporário:

```powershell
npm run audit:final --workspace backend
```
