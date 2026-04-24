import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    companyName: "",
    hyciteUsername: "",
    hyciteEmail: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const registerDistributor = trpc.distributors.register.useMutation({
    onSuccess: () => {
      setLocation("/dashboard");
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await registerDistributor.mutateAsync(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Bienvenido a RPtools</CardTitle>
          <CardDescription>
            Configura tu cuenta de distribuidor para comenzar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre de la Empresa</label>
              <Input
                type="text"
                placeholder="Tu empresa"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Usuario HyCite</label>
              <Input
                type="text"
                placeholder="Tu usuario en HyCite"
                value={formData.hyciteUsername}
                onChange={(e) =>
                  setFormData({ ...formData, hyciteUsername: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Email HyCite</label>
              <Input
                type="email"
                placeholder="Tu email en HyCite"
                value={formData.hyciteEmail}
                onChange={(e) =>
                  setFormData({ ...formData, hyciteEmail: e.target.value })
                }
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || registerDistributor.isPending}
            >
              {isLoading || registerDistributor.isPending
                ? "Registrando..."
                : "Registrarse"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
