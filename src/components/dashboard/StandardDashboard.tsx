"use client"
import { useEffect, useState } from "react";
import {
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Wallet
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import Cookies from "js-cookie";

interface StandardDashboardProps {
  workspaceName: string | null;
  userRole: string | null;
}

export function StandardDashboard({ workspaceName, userRole }: StandardDashboardProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, paid: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const token = Cookies.get("session_token");
      const tenantDetailId = Cookies.get("tenantDetailId");

      const res = await fetch(`${API_BASE}/payment-requests`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-tenant-detail-id": tenantDetailId || ""
        },
        credentials: "include"
      });

      if (res.ok) {
        const data = await res.json();
        const sorted = Array.isArray(data) ? data.sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ) : [];

        setRecentRequests(sorted.slice(0, 5));

        // Calculate stats
        const counts = sorted.reduce((acc: any, curr: any) => {
          const status = curr.status.toLowerCase();
          if (status === 'pending') acc.pending++;
          if (status === 'approved' || status === 'authorized') acc.approved++;
          if (status === 'paid') acc.paid++;
          return acc;
        }, { pending: 0, approved: 0, paid: 0 });

        setStats(counts);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statusMap: any = {
    pending: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
    approved: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
    authorized: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle2 },
    paid: { color: "bg-purple-100 text-purple-700 border-purple-200", icon: Wallet },
    rejected: { color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
  };

  return (
    <div className="px-4 py-8 max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            ¡Hola, {(workspaceName || "User").split(' ').pop()}! 👋
          </h1>
          <p className="text-slate-500 text-lg">
            Bienvenido de nuevo a tu espacio de trabajo en <span className="font-semibold text-slate-700">{workspaceName}</span>.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push('/payment-request')}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 gap-2 h-12 px-6 rounded-xl transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={20} />
            Nueva Solicitud
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none bg-gradient-to-br from-yellow-50 to-orange-50 shadow-sm overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-4 right-4 text-yellow-500/20">
              <Clock size={64} />
            </div>
            <p className="text-yellow-700 font-medium text-sm mb-1 uppercase tracking-wider">Pendientes</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-bold text-slate-900">{stats.pending}</h3>
              <span className="text-slate-400 text-sm">solicitudes</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-gradient-to-br from-blue-50 to-cyan-50 shadow-sm overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-4 right-4 text-blue-500/20">
              <CheckCircle2 size={64} />
            </div>
            <p className="text-blue-700 font-medium text-sm mb-1 uppercase tracking-wider">Aprobadas</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-bold text-slate-900">{stats.approved}</h3>
              <span className="text-slate-400 text-sm">por pagar</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-gradient-to-br from-purple-50 to-pink-50 shadow-sm overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-4 right-4 text-purple-500/20">
              <Wallet size={64} />
            </div>
            <p className="text-purple-700 font-medium text-sm mb-1 uppercase tracking-wider">Pagadas</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-bold text-slate-900">{stats.paid}</h3>
              <span className="text-slate-400 text-sm">este mes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              Solicitudes Recientes
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 gap-1 font-semibold"
              onClick={() => router.push('/payment-requests')}
            >
              Ver todas
              <ArrowRight size={16} />
            </Button>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-2xl" />
              ))
            ) : recentRequests.length > 0 ? (
              recentRequests.map((req) => {
                const status = req.status.toLowerCase();
                const config = statusMap[status] || statusMap.pending;
                const StatusIcon = config.icon;

                return (
                  <div
                    key={req._id}
                    onClick={() => router.push(`/payment-request/${req._id}`)}
                    className="group bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${config.color.split(' ')[0]} ${config.color.split(' ')[1].replace('text-', 'text-')}`}>
                        <StatusIcon size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {typeof req.provider_id === 'object' ? req.provider_id?.name : 'Proveedor'}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <span>{req.currency} {req.total?.toLocaleString()}</span>
                          <span>•</span>
                          <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`rounded-lg px-2.5 py-1 ${config.color} border-none`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>
                )
              })
            ) : (
              <div className="bg-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-slate-900 font-bold mb-1">No hay solicitudes aún</h3>
                <p className="text-slate-500 mb-6">Comienza creando tu primera solicitud de pago.</p>
                <Button onClick={() => router.push('/payment-request')} variant="outline">Crear ahora</Button>
              </div>
            )}
          </div>
        </div>
        {/* Panel de Resumen de Montos */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-2">
            <TrendingUp size={20} className="text-blue-600" />
            Resumen de Montos
          </h2>

          <Card className="border-none bg-white shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-0 divide-y divide-slate-100">

              {/* Total pendiente */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-yellow-50">
                    <Clock size={18} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Por pagar</p>
                    <p className="text-sm font-bold text-slate-900">
                      {recentRequests
                        .filter(r => r.status.toLowerCase() === 'pending')
                        .reduce((acc, r) => acc + (r.total || 0), 0)
                        .toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-none rounded-lg">
                  {stats.pending}
                </Badge>
              </div>

              {/* Total aprobado */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50">
                    <CheckCircle2 size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Aprobado</p>
                    <p className="text-sm font-bold text-slate-900">
                      {recentRequests
                        .filter(r => ['approved', 'authorized'].includes(r.status.toLowerCase()))
                        .reduce((acc, r) => acc + (r.total || 0), 0)
                        .toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-none rounded-lg">
                  {stats.approved}
                </Badge>
              </div>

              {/* Total pagado */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-50">
                    <Wallet size={18} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Pagado</p>
                    <p className="text-sm font-bold text-slate-900">
                      {recentRequests
                        .filter(r => r.status.toLowerCase() === 'paid')
                        .reduce((acc, r) => acc + (r.total || 0), 0)
                        .toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-none rounded-lg">
                  {stats.paid}
                </Badge>
              </div>

            </CardContent>
          </Card>

          {/* Total general */}
          <Card className="border-none bg-gradient-to-br from-slate-800 to-slate-900 shadow-sm rounded-2xl">
            <CardContent className="p-5">
              <p className="text-slate-400 text-xs uppercase tracking-wider font-medium mb-1">Total en circulación</p>
              <p className="text-white text-2xl font-bold">
                {recentRequests
                  .filter(r => r.status.toLowerCase() !== 'rejected')
                  .reduce((acc, r) => acc + (r.total || 0), 0)
                  .toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
              </p>
              <p className="text-slate-500 text-xs mt-1">Basado en tus últimas solicitudes</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
