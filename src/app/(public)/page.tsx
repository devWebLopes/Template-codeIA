import Link from "next/link";
import { Car, Wrench, Fuel, FileText, Shield, BarChart3, Bell, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Car,
    title: "Gestão de Veículos",
    description: "Cadastre e acompanhe todos os seus veículos com fotos, dados técnicos e histórico completo.",
  },
  {
    icon: Wrench,
    title: "Controle de Manutenções",
    description: "Registre revisões, trocas de óleo e qualquer serviço. Receba alertas de próximas manutenções.",
  },
  {
    icon: Fuel,
    title: "Histórico de Combustível",
    description: "Acompanhe o consumo médio, custo por litro e gráficos de evolução de gastos com combustível.",
  },
  {
    icon: FileText,
    title: "Documentos & IPVA",
    description: "Armazene IPVA, seguro, multas e licenciamento. Alertas automáticos de vencimento.",
  },
  {
    icon: Shield,
    title: "Seguro & Proteção",
    description: "Controle apólices de seguro, vencimentos e coberturas de todos os seus veículos.",
  },
  {
    icon: BarChart3,
    title: "Relatórios & Gastos",
    description: "Visualize despesas por categoria, mês e veículo em gráficos claros e detalhados.",
  },
  {
    icon: Bell,
    title: "Alertas Inteligentes",
    description: "Notificações proativas para manutenções, documentos a vencer e quilometragem.",
  },
  {
    icon: Users,
    title: "Acesso para Mecânicas",
    description: "Compartilhe o histórico do veículo com mecânicas e revendas de forma segura e controlada.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Car className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm md:text-base">AutoGest</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs text-primary font-medium mb-6">
          <Car className="h-3 w-3" />
          Gestão automotiva inteligente
        </div>
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
          Controle total sobre
          <span className="text-primary block md:inline"> seus veículos</span>
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-8">
          Manutenções, despesas, combustível, documentos e muito mais — tudo organizado em um único lugar. Para proprietários, mecânicas e revendas.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/sign-up">
            <Button size="lg" className="w-full sm:w-auto">
              Começar Gratuitamente
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Já tenho uma conta
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Tudo que você precisa</h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Uma plataforma completa para gerenciar a vida útil dos seus veículos com praticidade e eficiência.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm p-5 hover:border-primary/30 hover:bg-card/60 transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Pronto para organizar sua frota?
          </h2>
          <p className="text-muted-foreground mb-6 text-sm md:text-base max-w-xl mx-auto">
            Crie sua conta gratuitamente e comece a controlar seus veículos hoje mesmo.
          </p>
          <Link href="/sign-up">
            <Button size="lg">
              <Car className="h-4 w-4 mr-2" />
              Criar Conta Grátis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6">
        <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-primary" />
            <span>AutoGest © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="hover:text-foreground transition-colors">Entrar</Link>
            <Link href="/sign-up" className="hover:text-foreground transition-colors">Cadastrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
