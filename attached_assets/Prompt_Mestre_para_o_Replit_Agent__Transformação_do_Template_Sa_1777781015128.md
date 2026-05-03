## Prompt Mestre para o Replit Agent: Transformação do Template SaaS em App de Gestão Automotiva

**Objetivo Geral:**

Transformar o template SaaS em Next.js existente em um aplicativo completo de gestão automotiva, focado em controle de veículos, manutenções, despesas, consumo de combustível, pneus, impostos e seguro. O desenvolvimento deve priorizar uma **experiência de usuário (UX) excepcional** e um **sistema robusto de perfis e permissões**, garantindo que o aplicativo seja intuitivo, eficiente e atenda às necessidades de proprietários, mecânicas e revendas de veículos.

**Contexto da Base Existente (Next.js SaaS Template):**

O projeto atual é um template SaaS em Next.js com as seguintes características:
*   **Framework:** Next.js (App Router, Server Components).
*   **Autenticação:** Clerk (com rotas protegidas e middleware).
*   **Banco de Dados:** PostgreSQL + Prisma ORM (modelos para usuários, créditos, billing).
*   **UI/UX:** Radix UI + Tailwind CSS.
*   **Linguagem:** TypeScript (end-to-end).
*   **Pagamentos:** Integração com Asaas (para processamento de pagamentos e webhooks).
*   **Créditos:** Sistema de rastreamento e consumo de créditos.
*   **AI Chat:** Integração com Vercel AI SDK usando OpenRouter (streaming, seleção de modelos, geração de imagem).
*   **Uploads de Arquivos:** Vercel Blob / Replit App Storage (para anexos).
*   **Estrutura de Projeto:** `src/app/(public)`, `src/app/(protected)`, `src/app/api`, `src/components`, `src/hooks`, `src/lib` (com camada de queries).

**Instruções Detalhadas para o Replit Agent:**

### Fase 1: Análise e Adaptação da Arquitetura Existente

1.  **Revisão e Limpeza:**
    *   Remover ou adaptar funcionalidades não essenciais para um app automotivo (ex: sistema de billing e créditos Asaas, AI Chat, a menos que uma funcionalidade específica seja identificada para eles). Se o sistema de créditos puder ser adaptado para um modelo de assinatura premium para mecânicas/revendas, considerar essa adaptação.
    *   Manter a estrutura de autenticação Clerk, pois será a base para o sistema de perfis.
    *   Manter a estrutura de UI (Radix + Tailwind) e TypeScript.

2.  **Modelagem de Dados (Prisma Schema):**
    *   **Usuário:** Manter o modelo `User` existente, adicionando um campo `role` (enum: `OWNER`, `MECHANIC`, `DEALERSHIP`, `ADMIN`) e um campo `associatedEntities` (JSON ou novo modelo para armazenar IDs de mecânicas/revendas associadas, ou carros específicos). Adicionar campos para informações de contato e endereço.
    *   **Veículo (`Vehicle`):**
        *   `id` (String, @id, @default(uuid()))
        *   `ownerId` (String, @relation(fields: [ownerId], references: [id]))
        *   `brand` (String)
        *   `model` (String)
        *   `year` (Int)
        *   `licensePlate` (String, @unique)
        *   `chassisNumber` (String, @unique)
        *   `currentMileage` (Int, @default(0))
        *   `fuelType` (Enum: `GASOLINE`, `ETHANOL`, `DIESEL`, `FLEX`, `ELECTRIC`)
        *   `purchaseDate` (DateTime)
        *   `purchaseValue` (Float)
        *   `color` (String)
        *   `imageUrl` (String?, para foto principal do carro)
        *   `createdAt` (DateTime, @default(now()))
        *   `updatedAt` (DateTime, @updatedAt)
    *   **Manutenção (`Maintenance`):**
        *   `id` (String, @id, @default(uuid()))
        *   `vehicleId` (String, @relation(fields: [vehicleId], references: [id]))
        *   `mechanicId` (String?, @relation(fields: [mechanicId], references: [id])) - Opcional, se a manutenção for feita por uma mecânica associada.
        *   `date` (DateTime)
        *   `type` (String, ex: "Troca de Óleo", "Revisão Geral")
        *   `description` (String)
        *   `cost` (Float)
        *   `partsUsed` (Json?, lista de peças e custos)
        *   `mileage` (Int, quilometragem no momento da manutenção)
        *   `nextMaintenanceDate` (DateTime?, data recomendada)
        *   `nextMaintenanceMileage` (Int?, quilometragem recomendada)
        *   `invoiceUrl` (String?, URL do comprovante/nota fiscal)
        *   `createdAt` (DateTime, @default(now()))
        *   `updatedAt` (DateTime, @updatedAt)
    *   **Despesa (`Expense`):**
        *   `id` (String, @id, @default(uuid()))
        *   `vehicleId` (String, @relation(fields: [vehicleId], references: [id]))
        *   `date` (DateTime)
        *   `category` (Enum: `FUEL`, `TAX`, `INSURANCE`, `FINE`, `WASH`, `PARKING`, `OTHER`)
        *   `description` (String)
        *   `value` (Float)
        *   `receiptUrl` (String?, URL do comprovante)
        *   `createdAt` (DateTime, @default(now()))
        *   `updatedAt` (DateTime, @updatedAt)
    *   **Abastecimento (`FuelLog`):**
        *   `id` (String, @id, @default(uuid()))
        *   `vehicleId` (String, @relation(fields: [vehicleId], references: [id]))
        *   `date` (DateTime)
        *   `fuelType` (Enum: `GASOLINE`, `ETHANOL`, `DIESEL`, `FLEX`)
        *   `liters` (Float)
        *   `pricePerLiter` (Float)
        *   `totalCost` (Float)
        *   `mileage` (Int, quilometragem no momento do abastecimento)
        *   `stationName` (String?)
        *   `createdAt` (DateTime, @default(now()))
        *   `updatedAt` (DateTime, @updatedAt)
    *   **Pneu (`Tire`):**
        *   `id` (String, @id, @default(uuid()))
        *   `vehicleId` (String, @relation(fields: [vehicleId], references: [id]))
        *   `position` (Enum: `FRONT_LEFT`, `FRONT_RIGHT`, `REAR_LEFT`, `REAR_RIGHT`, `SPARE`)
        *   `brand` (String)
        *   `model` (String)
        *   `purchaseDate` (DateTime)
        *   `purchaseMileage` (Int)
        *   `cost` (Float)
        *   `lastRotationDate` (DateTime?)
        *   `lastRotationMileage` (Int?)
        *   `expectedLifespanKm` (Int?, em km)
        *   `expectedLifespanMonths` (Int?, em meses)
        *   `createdAt` (DateTime, @default(now()))
        *   `updatedAt` (DateTime, @updatedAt)
    *   **Documento (`Document`):**
        *   `id` (String, @id, @default(uuid()))
        *   `vehicleId` (String, @relation(fields: [vehicleId], references: [id]))
        *   `type` (Enum: `IPVA`, `LICENSING`, `INSURANCE_POLICY`, `FINE`, `OTHER`)
        *   `description` (String?)
        *   `issueDate` (DateTime?)
        *   `expirationDate` (DateTime?)
        *   `value` (Float?)
        *   `documentUrl` (String, URL do documento)
        *   `createdAt` (DateTime, @default(now()))
        *   `updatedAt` (DateTime, @updatedAt)
    *   **Associação de Veículo/Usuário (`VehicleAccess`):**
        *   `id` (String, @id, @default(uuid()))
        *   `vehicleId` (String, @relation(fields: [vehicleId], references: [id]))
        *   `userId` (String, @relation(fields: [userId], references: [id]))
        *   `accessLevel` (Enum: `READ_ONLY`, `EDIT_MAINTENANCE`, `FULL_ACCESS`)
        *   `status` (Enum: `PENDING`, `ACTIVE`, `REVOKED`)
        *   `requestedBy` (String, @relation(fields: [requestedBy], references: [id])) - Quem solicitou o acesso (mecânica/revenda).
        *   `createdAt` (DateTime, @default(now()))
        *   `updatedAt` (DateTime, @updatedAt)

3.  **Executar Migrações do Prisma:**
    *   Após a definição do novo `schema.prisma`, executar `npm run db:migrate` para aplicar as mudanças no banco de dados.

### Fase 2: Desenvolvimento do Frontend (Next.js, Radix UI, Tailwind CSS)

1.  **Páginas Principais:**
    *   **Dashboard do Proprietário (`/dashboard`):** Visão geral dos carros, próximas manutenções, despesas recentes, consumo médio. Gráficos simples (Tailwind + Chart.js ou similar).
    *   **Detalhes do Veículo (`/vehicles/[id]`):** Página dedicada para cada carro com abas:
        *   **Visão Geral:** Informações básicas, quilometragem atual, foto.
        *   **Manutenções:** Lista de manutenções, opção para adicionar nova, editar, ver detalhes.
        *   **Despesas:** Lista de despesas, opção para adicionar nova, editar, filtrar por categoria.
        *   **Combustível:** Lista de abastecimentos, adicionar novo, gráficos de consumo/custo.
        *   **Pneus:** Detalhes dos pneus, histórico de trocas/rodízios.
        *   **Documentos:** Lista de documentos (IPVA, seguro, multas), adicionar novo, alertas de vencimento.
        *   **Acessos:** Gerenciar permissões de mecânicas/revendas para este veículo.
    *   **Página de Cadastro de Veículo (`/vehicles/new`):** Formulário completo para adicionar um novo carro.
    *   **Página de Gerenciamento de Acessos (`/access-management`):** Para proprietários gerenciarem todas as solicitações e permissões de acesso aos seus veículos.

2.  **Páginas para Mecânicas/Revendas:**
    *   **Dashboard da Mecânica/Revenda (`/mechanic-dashboard` ou `/dealership-dashboard`):** Listar veículos aos quais têm acesso, próximas manutenções agendadas, histórico de serviços prestados.
    *   **Detalhes do Veículo (Mecânica/Revenda):** Versão da página de detalhes do veículo com funcionalidades limitadas pelas permissões concedidas pelo proprietário (ex: apenas adicionar manutenções, sem acesso a custos de seguro/impostos).
    *   **Página de Solicitação de Acesso (`/request-access`):** Mecânicas/revendas podem solicitar acesso a um veículo específico (via placa/chassi), que gerará uma notificação para o proprietário.

3.  **Componentes de UI Reutilizáveis:**
    *   Formulários robustos com validação (usar bibliotecas como `react-hook-form` e `zod`).
    *   Tabelas paginadas e filtráveis para listas de manutenções, despesas, etc.
    *   Gráficos para consumo de combustível e despesas (ex: Chart.js).
    *   Componentes de upload de arquivos (integrando com o sistema de uploads existente).
    *   Componentes de notificação (para alertas de manutenção, solicitações de acesso).

4.  **Navegação e Layout:**
    *   Adaptar o layout existente para incluir uma navegação clara entre os módulos (Meus Carros, Manutenções, Despesas, etc.).
    *   Menu lateral ou superior responsivo.
    *   Indicadores visuais para o perfil do usuário logado.

### Fase 3: Desenvolvimento do Backend (API Routes, Server Actions, Prisma)

1.  **APIs para Veículos:**
    *   `POST /api/vehicles`: Criar novo veículo.
    *   `GET /api/vehicles`: Listar veículos do usuário logado.
    *   `GET /api/vehicles/[id]`: Obter detalhes de um veículo (com validação de acesso).
    *   `PUT /api/vehicles/[id]`: Atualizar informações do veículo.
    *   `DELETE /api/vehicles/[id]`: Excluir veículo (com validação de permissão).

2.  **APIs para Manutenções, Despesas, Abastecimentos, Pneus, Documentos:**
    *   Criar rotas CRUD (`GET`, `POST`, `PUT`, `DELETE`) para cada um desses modelos, sempre associados a um `vehicleId` e com validação de permissão do usuário logado (proprietário ou mecânica/revenda com acesso).
    *   Exemplo: `POST /api/vehicles/[vehicleId]/maintenances`, `GET /api/vehicles/[vehicleId]/expenses`.

3.  **APIs para Sistema de Acessos:**
    *   `POST /api/access-requests`: Mecânica/revenda solicita acesso a um veículo.
    *   `GET /api/access-requests/pending`: Proprietário vê solicitações pendentes.
    *   `PUT /api/access-requests/[id]/approve`: Proprietário aprova acesso.
    *   `PUT /api/access-requests/[id]/reject`: Proprietário rejeita acesso.
    *   `PUT /api/access-requests/[id]/revoke`: Proprietário revoga acesso existente.
    *   `GET /api/vehicles/[id]/accesses`: Proprietário vê quem tem acesso ao seu veículo.

4.  **Lógica de Permissões (Middleware/Server Actions):**
    *   Implementar lógica de autorização robusta em todas as rotas de API e Server Actions para garantir que apenas usuários com as permissões corretas possam acessar ou modificar dados.
    *   Utilizar o campo `role` do `User` e o modelo `VehicleAccess` para controlar o acesso.

5.  **Integração de Uploads:**
    *   Garantir que as APIs de criação/edição de Manutenções, Despesas e Documentos possam receber URLs de arquivos (obtidos do endpoint de upload existente).

### Fase 4: Experiência do Usuário (UX) e Otimizações

1.  **Fluxos de Usuário Otimizados:**
    *   **Cadastro de Carro:** Simplificar o formulário, talvez com um assistente passo a passo.
    *   **Registro de Manutenção/Despesa:** Tornar o processo rápido, com campos auto-sugestivos e validação clara.
    *   **Visualização de Dados:** Utilizar gráficos e resumos visuais para apresentar informações de consumo e gastos de forma compreensível.

2.  **Alertas e Notificações:**
    *   Implementar um sistema de notificações (in-app ou via e-mail/push, se possível) para:
        *   Próximas manutenções (baseado em data/quilometragem).
        *   Vencimento de impostos/seguro.
        *   Novas solicitações de acesso a veículos.
        *   Atualizações de status de acesso.

3.  **Controle de Quilometragem:**
    *   **Entrada Manual:** Campo claro para o motorista informar a quilometragem.
    *   **Sugestão de Integração (Futura):** Pesquisar APIs de mapas (Waze, Google Maps) para calcular quilometragem percorrida entre pontos, ou APIs de telemetria veicular (se viável e com consentimento do usuário). Por enquanto, focar na entrada manual e na atualização a cada registro de manutenção/abastecimento.

4.  **Responsividade:**
    *   Garantir que todo o aplicativo seja totalmente responsivo e funcione bem em dispositivos móveis e desktops, utilizando as classes do Tailwind CSS.

### Fase 5: Documentação e Testes

1.  **Documentação Interna:**
    *   Atualizar o `README.md` e a documentação interna (`.context/docs/`) para refletir a nova arquitetura e funcionalidades do app automotivo.
    *   Detalhar os novos modelos do Prisma, as rotas de API e a lógica de permissões.

2.  **Testes:**
    *   Implementar testes unitários e de integração para as principais funcionalidades (autenticação, CRUD de veículos, permissões).

**Considerações Adicionais:**

*   **Internacionalização (i18n):** Se o template já tiver suporte, manter e adaptar os textos para o contexto automotivo.
*   **Otimização de Performance:** Garantir que as queries do Prisma sejam eficientes e que o carregamento das páginas seja rápido.
*   **Segurança:** Revisar todas as entradas de usuário e saídas de dados para prevenir vulnerabilidades (XSS, SQL Injection, etc.).

Este prompt detalhado deve guiar o Replit Agent na transformação do seu template em um aplicativo robusto e funcional. Comece pela modelagem de dados e migrações, e então avance para o desenvolvimento do frontend e backend, sempre com a UX e o sistema de perfis em mente.
