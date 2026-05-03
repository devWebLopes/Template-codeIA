# AutoGest — Gestão Automotiva

## Visão Geral
Aplicativo de gestão automotiva mobile-first construído com Next.js 15 App Router. Permite que proprietários de veículos controlem manutenções, despesas, combustível, pneus, documentos e permissões de acesso. Suporta múltiplos papéis: proprietário, mecânico e revenda.

## Stack Tecnológico
- **Framework**: Next.js 15 App Router (TypeScript)
- **Autenticação**: Clerk (modo keyless dev — sem configuração necessária)
- **Banco de Dados**: PostgreSQL via Replit + Prisma ORM
- **UI**: Radix UI + Tailwind CSS + shadcn/ui
- **Formulários**: react-hook-form + Zod v4
- **Notificações**: Sonner (toasts)
- **Charts**: Recharts
- **Fontes**: Geist Sans + Geist Mono

## Estrutura do Projeto
```
src/
├── app/
│   ├── (public)/           # Landing page, sign-in, sign-up
│   ├── (protected)/        # App autenticado
│   │   ├── dashboard/      # Dashboard com gráficos e métricas
│   │   ├── vehicles/       # Lista, novo, [id] (detalhe com abas)
│   │   ├── maintenances/   # Todas as manutenções com filtros
│   │   ├── fuel/           # Histórico de combustível
│   │   ├── documents/      # Documentos: IPVA, seguro, etc.
│   │   ├── insurance/      # Apólices de seguro com status
│   │   ├── access-management/ # Solicitar/aprovar/rejeitar acessos
│   │   └── settings/       # Configurações da conta
│   └── api/
│       ├── dashboard/       # Métricas do dashboard
│       ├── vehicles/        # CRUD de veículos + sub-rotas:
│       │   └── [id]/        #   maintenances, expenses, fuel-logs,
│       │                    #   tires, documents, accesses
│       ├── access-requests/ # Solicitações: pending, approve, reject, revoke
│       └── webhooks/clerk/  # Sincronização de usuários Clerk → DB
├── components/
│   ├── app/                 # sidebar, topbar, mobile-nav, page-header, app-shell
│   ├── vehicles/            # Tabs: maintenance, expense, fuel, tire, document, access
│   └── ui/                  # shadcn/ui components + voice-button
├── hooks/
│   ├── use-voice-input.ts   # Entrada de voz via SpeechRecognition API
│   ├── use-mobile.tsx       # Detecção de mobile
│   └── use-toast.ts         # Toast hook
├── contexts/
│   └── page-metadata.tsx    # Contexto de título/breadcrumbs por página
└── lib/
    ├── auto-utils.ts        # getAuthUser, checkVehicleAccess, helpers de resposta
    ├── auto-format.ts       # formatCurrency, formatDate, labels de enum PT-BR
    ├── db.ts                # Prisma client singleton
    └── utils.ts             # cn() e utilitários gerais
```

## Schema do Banco (Prisma)
Modelos principais:
- **User** (clerkId, role: OWNER/MECHANIC/DEALERSHIP/ADMIN)
- **Vehicle** (brand, model, year, licensePlate, fuelType, mileage, etc.)
- **Maintenance** (type, description, cost, mileage, nextMaintenanceDate)
- **Expense** (category: FUEL/TAX/INSURANCE/FINE/WASH/PARKING/MAINTENANCE/OTHER, value)
- **FuelLog** (fuelType, liters, pricePerLiter, totalCost, mileage, stationName)
- **Tire** (position: FRONT_LEFT/FRONT_RIGHT/REAR_LEFT/REAR_RIGHT/SPARE, brand, model, size)
- **VehicleDocument** (type: IPVA/LICENSING/INSURANCE_POLICY/FINE/CRLV/OTHER, expirationDate)
- **VehicleAccess** (accessLevel: READ_ONLY/EDIT_MAINTENANCE/FULL_ACCESS, status: PENDING/ACTIVE/REVOKED)

Prisma schema: `prisma/schema.prisma` | Client gerado: `prisma/generated/client`

## Design Mobile-First
- Navegação inferior (bottom nav) em mobile com 5 itens principais
- Sidebar colapsável visível apenas em md+ (desktop)
- Menu hamburger no topbar para mobile (Sheet/drawer)
- Cards empilhados em coluna no mobile, grid em desktop
- Touch targets mínimo 44px
- Tema claro/escuro suportado via ThemeProvider

## Fluxo de Acesso a Veículos
1. **Proprietário**: acesso total, pode aprovar/rejeitar/revogar acessos via aba "Acessos" no veículo ou `/access-management`
2. **Mecânico/Revenda**: solicita acesso via placa do veículo em `/access-management`, escolhe nível de acesso
3. **Proprietário aprova**: notificação na página `/access-management` com botões Aprovar/Recusar

## Configurações Importantes
- Porta: 5000 (configurada no workflow `npm run dev`)
- Clerk: modo keyless (dev) — não requer NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY em dev
- Prisma: schema em `prisma/schema.prisma`, client em `prisma/generated/client`
- DB: `DATABASE_URL` via variável de ambiente do Replit

## Notas de Implementação
- **Zod v4**: não tem `invalid_type_error` — usar `z.coerce.number()` para inputs numéricos
- **zodResolver**: requer `as any` cast quando schema usa `z.coerce` (incompatibilidade de tipo input/output)
- **SpeechRecognition**: implementado com interfaces customizadas em `use-voice-input.ts` para suporte TS
- **Prisma imports**: sempre usar `from "../../prisma/generated/client"` (path não-padrão)
- **fetch no frontend**: todos os componentes client usam `fetch` direto (sem lib/api-client)

## Preferências do Usuário
- Linguagem: português brasileiro em toda a UI
- Design: glass-panel, modo escuro/claro, estilo futurístico
- Mobile: app deve funcionar perfeitamente como PWA mobile-first
