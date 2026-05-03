export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export function formatMileage(km: number): string {
  return `${new Intl.NumberFormat("pt-BR").format(km)} km`;
}

export function fuelTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    GASOLINE: "Gasolina",
    ETHANOL: "Etanol",
    DIESEL: "Diesel",
    FLEX: "Flex",
    ELECTRIC: "Elétrico",
  };
  return labels[type] ?? type;
}

export function expenseCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    FUEL: "Combustível",
    TAX: "Imposto",
    INSURANCE: "Seguro",
    FINE: "Multa",
    WASH: "Lavagem",
    PARKING: "Estacionamento",
    MAINTENANCE: "Manutenção",
    OTHER: "Outro",
  };
  return labels[cat] ?? cat;
}

export function tirePositionLabel(pos: string): string {
  const labels: Record<string, string> = {
    FRONT_LEFT: "Dianteiro Esquerdo",
    FRONT_RIGHT: "Dianteiro Direito",
    REAR_LEFT: "Traseiro Esquerdo",
    REAR_RIGHT: "Traseiro Direito",
    SPARE: "Estepe",
  };
  return labels[pos] ?? pos;
}

export function documentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    IPVA: "IPVA",
    LICENSING: "Licenciamento",
    INSURANCE_POLICY: "Apólice de Seguro",
    FINE: "Multa",
    CRLV: "CRLV",
    OTHER: "Outro",
  };
  return labels[type] ?? type;
}

export function accessLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    READ_ONLY: "Somente Leitura",
    EDIT_MAINTENANCE: "Editar Manutenções",
    FULL_ACCESS: "Acesso Total",
  };
  return labels[level] ?? level;
}

export function accessStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Pendente",
    ACTIVE: "Ativo",
    REVOKED: "Revogado",
  };
  return labels[status] ?? status;
}

export function daysUntil(date: string | Date): number {
  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isExpiringSoon(date: string | Date, days = 30): boolean {
  return daysUntil(date) <= days && daysUntil(date) >= 0;
}

export function isExpired(date: string | Date): boolean {
  return daysUntil(date) < 0;
}
