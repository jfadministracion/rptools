import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Crown, BarChart3, Users, Zap } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">RPtools</h1>
          </div>
          <Button onClick={() => window.location.href = getLoginUrl()}>
            Iniciar Sesión
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-slate-900 mb-6">
            Panel de Control para Distribuidores
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Gestiona tus datos de Royale Prestige en tiempo real. Sincroniza con HyCite, 
            colabora con tu equipo y exporta reportes con un solo clic.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-primary hover:bg-primary/90"
          >
            Comenzar Ahora
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12 text-slate-900">
            Características Principales
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-bold text-lg mb-2 text-slate-900">Dashboard en Tiempo Real</h4>
              <p className="text-slate-600">
                Visualiza tus ventas, pedidos y métricas actualizadas constantemente
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-bold text-lg mb-2 text-slate-900">Sincronización Automática</h4>
              <p className="text-slate-600">
                Conecta con HyCite y sincroniza datos automáticamente cada minuto
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-bold text-lg mb-2 text-slate-900">Gestión de Equipo</h4>
              <p className="text-slate-600">
                Invita administradores y controla qué datos puede ver cada miembro
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-bold text-lg mb-2 text-slate-900">Exportación Fácil</h4>
              <p className="text-slate-600">
                Descarga reportes en Excel o sincroniza con Google Sheets
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            ¿Listo para optimizar tu negocio?
          </h3>
          <p className="text-primary-foreground/90 mb-8 text-lg">
            Únete a distribuidores que ya están usando RPtools
          </p>
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => window.location.href = getLoginUrl()}
          >
            Iniciar Sesión
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-400">
            RPtools © 2026 - Panel de Control para Distribuidores Royale Prestige
          </p>
        </div>
      </footer>
    </div>
  );
}
