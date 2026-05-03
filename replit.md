# AutoGest — Gestão Automotiva

## Visão Geral
Aplicativo de gestão automotiva mobile-first construído com Next.js 15 App Router. Permite que proprietários de veículos controlem manutenções, despesas, combustível, pneus, documentos e permissões de acesso. Suporta múltiplos papéis: proprietário, mecânico e revenda.

## Stack Tecnológico
- **Framework**: Next.js 15 App Router (TypeScript)
- **Autenticação**: Clerk (modo keyless dev — sem configuração necessária)
- **Banco de Dados**: PostgreSQL via Replit + Prisma ORM
- **UI**: Radix UI + Tailwind CSS + shadcn/ui
- **Formulários**: react-hook-form + Zod
- **Notificações**: Sonner (toasts)
- **Fontes**: Geist Sans + Geist Mono

## Estrutura do Projeto
```
src/
├── app/
│   ├── (public)/         # Landing page, sign-in, sign-up
│   ├── (protected)/      # App autenticado
│   │   ├── dashboard/    # Dashboard principal
│   │   ├── vehicles/     # Lista, novo, [id] (detalhe com abas)
│   │   ├── maintenances/ # Todas as manutenções
│   │   ├── fuel/         # Histórico de combustível
│   │   ├── documents/    # Documentos: IPVA, seguro, etc.
│   │   ├── insurance/    # Apólices de seguro
│   │   ├── access-management/ # Gerenciar acessos pendentes
│   │   ├── request-access/    # Solicitar acesso (mecânico/revenda)
│   │   └── settings/     # Configurações da conta
│   └── api/
│       ├── dashboard/    # Métricas do dashboard
│       ├── vehicles/     # CRUD de veículos
│       │   └── [id]/     # Rotas aninhadas: maintenances, expenses,
│       │                 #   fuel-logs, tires, documents, accesses
│       └── access-requests/ # Solicitações de acesso (pending, approve, reject, revoke)
├── components/
│   ├── app/              # sidebar, topbar, mobile-nav, page-header
│   ├── vehicles/         # Tabs: maintenance, expense, fuel, tire, document, access
│   └── ui/               # shadcn/ui components
└── lib/
    ├── auto-utils.ts     # getAuthUser, checkVehicleAccess, helpers de resposta
    ├── auto-format.ts    # formatCurrency, formatDate, labels de enum
    ├── db.ts             # Prisma client singleton
    └── brand-config.ts   # Configuração de marca (AutoGest)
```

## Schema do Banco (Prisma)
Modelos principais:
- **User** (clerkId, role: OWNER/MECHANIC/DEALERSHIP/ADMIN)
- **Vehicle** (brand, model, year, licensePlate, fuelType, mileage, etc.)
- **Maintenance** (type, description, cost, mileage, nextMaintenanceDate)
- **Expense** (category, description, value, date)
- **FuelLog** (fuelType, liters, pricePerLiter, totalCost, mileage)
- **Tire** (position, brand, model, size, purchaseDate, cost)
- **VehicleDocument** (type: IPVA/LICENSING/INSURANCE_POLICY/FINE/CRLV/OTHER, expirationDate)
- **VehicleAccess** (accessLevel: READ_ONLY/EDIT_MAINTENANCE/FULL_ACCESS, status: PENDING/ACTIVE/REVOKED)

## Design Mobile-First
- Navegação inferior (bottom nav) em mobile com 5 itens principais
- Sidebar colapsável visível apenas em md+ (desktop)
- Menu hamburger no topbar para mobile (Sheet/drawer)
- Cards empilhados em coluna no mobile, grid em desktop
- Touch targets mínimo 44px
- Tema claro/escuro suportado

## Fluxo de Acesso a Veículos
1. **Proprietário**: acesso total, pode aprovar/rejeitar/revogar acessos
2. **Mecânico/Revenda**: solicita acesso via placa do veículo, escolhe nível de acesso
3. **Proprietário aprova**: via página `/access-management` ou aba "Acessos" no veículo

## Configurações Importantes
- Porta: 5000 (configurada no workflow)
- Clerk: modo keyless (dev) — requer CLERK_SIGN_IN_URL e CLERK_SIGN_UP_URL definidos
- Prisma: schema em `prisma/schema.prisma`, client em `prisma/generated/client`
- DB: `DATABASE_URL` via variável de ambiente do Replit

## Preferências do Usuário
- Linguagem: português brasileiro em toda a UI
- Design: glass-panel, modo escuro/claro, estilo futurístico já presente no template base
- Mobile: app deve funcionar perfeitamente como PWA
