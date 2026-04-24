import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const mockData = [
  { name: "Lun", ventas: 4000, pedidos: 2400 },
  { name: "Mar", ventas: 3000, pedidos: 1398 },
  { name: "Mié", ventas: 2000, pedidos: 9800 },
  { name: "Jue", ventas: 2780, pedidos: 3908 },
  { name: "Vie", ventas: 1890, pedidos: 4800 },
  { name: "Sab", ventas: 2390, pedidos: 3800 },
  { name: "Dom", ventas: 2490, pedidos: 4300 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const distributorQuery = trpc.distributors.getCurrent.useQuery();
  const distributor = distributorQuery.data;

  if (distributorQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!distributor) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p>No tienes una cuenta de distribuidor configurada</p>
        <Button onClick={() => setLocation("/onboarding")}>
          Configurar Cuenta
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Bienvenido, {distributor.companyName}</h1>
        <p className="text-gray-600">Panel de control de RPtools</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,500</div>
            <p className="text-xs text-gray-500">+5% desde ayer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-gray-500">3 urgentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-gray-500">+12 este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estado HyCite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Conectado</div>
            <p className="text-xs text-gray-500">Última sincronización hace 5 min</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas y Pedidos (Últimos 7 días)</CardTitle>
          <CardDescription>Gráfico de actividad semanal</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="ventas" fill="#8884d8" />
              <Bar dataKey="pedidos" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline">Conectar HyCite</Button>
          <Button variant="outline">Descargar Reportes</Button>
          <Button variant="outline">Gestionar Equipo</Button>
          <Button variant="outline">Sincronizar Google Sheets</Button>
        </CardContent>
      </Card>
    </div>
  );
}
