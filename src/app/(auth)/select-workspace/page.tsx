"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { 
    Building, 
    ChevronRight, 
    LogOut, 
    Sparkles, 
    UserCircle2, 
    LayoutGrid,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface Workspace {
  tenantId: string;
  name: string;
  role: string;
}

export default function SelectWorkspacePage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [filteredWorkspaces, setFilteredWorkspaces] = useState<Workspace[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

  const fetchWorkspaces = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/workspaces`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setWorkspaces(data.workspaces);
        setFilteredWorkspaces(data.workspaces);
      } else {
        toast.error("Error al cargar workspaces", { description: data.error });
        router.push("/login");
      }
    } catch (error) {
      console.error("Fetch workspaces error:", error);
      toast.error("Error de conexión");
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE, router]);

  useEffect(() => {
    const data = sessionStorage.getItem("pending_workspaces");
    if (!data) {
      // Intentar recuperar de API si ya tiene sesión
      fetchWorkspaces();
      return;
    }

    try {
      const parsed = JSON.parse(data);
      setWorkspaces(parsed);
      setFilteredWorkspaces(parsed);
      setIsLoading(false);
    } catch (e) {
      console.error("Error parsing workspaces", e);
      fetchWorkspaces();
    }
  }, [router, fetchWorkspaces]);

  useEffect(() => {
    const filtered = workspaces.filter(ws => 
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredWorkspaces(filtered);
  }, [searchQuery, workspaces]);

  const handleSelect = async (workspace: Workspace) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/auth/select-workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tenantId: workspace.tenantId }),
      });

      const data = await res.json();

      if (data.success) {
        // Establecer cookies finales (JS accesible para el frontend si es necesario)
        Cookies.set("session_token", data.token, { expires: 7, sameSite: "lax" });
        Cookies.set("tenantId", workspace.tenantId, { expires: 7, sameSite: "lax" });
        Cookies.set("workspaceName", workspace.name, { expires: 7, sameSite: "lax" });
        Cookies.set("userRole", data.role, { expires: 7, sameSite: "lax" });

        // Limpiar datos temporales
        Cookies.remove("temp_token");
        sessionStorage.removeItem("pending_workspaces");

        toast.success(`¡Bienvenido a ${workspace.name}!`, {
          description: `Has ingresado como ${data.role}`,
        });

        router.push("/home");
      } else {
        toast.error("Error", { description: data.error });
      }
    } catch (error) {
      console.error("Selection error:", error);
      toast.error("Error", { description: "No se pudo acceder al workspace." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove("session_token");
    Cookies.remove("temp_token");
    Cookies.remove("tenantId");
    sessionStorage.removeItem("pending_workspaces");
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-indigo-200 animate-pulse font-medium">Cargando tus espacios de trabajo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-2xl z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 mb-4">
            <LayoutGrid className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight sm:text-5xl">
            Selecciona tu <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Workspace</span>
          </h1>
          <p className="text-neutral-400 text-lg max-w-md mx-auto">
            Hemos encontrado {workspaces.length} organizaciones vinculadas a tu cuenta. ¿Por dónde empezamos hoy?
          </p>
        </div>

        <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-neutral-500 group-focus-within:text-indigo-400 transition-colors" />
            </div>
            <Input 
                type="text"
                placeholder="Buscar workspace o rol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 h-14 bg-neutral-900/50 border-neutral-800 text-white rounded-2xl focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-neutral-600"
            />
        </div>

        <div className="grid gap-4">
          {filteredWorkspaces.map((ws, idx) => (
            <button
              key={ws.tenantId}
              onClick={() => handleSelect(ws)}
              style={{ animationDelay: `${idx * 100}ms` }}
              className="group relative w-full text-left p-5 rounded-3xl bg-neutral-900/40 border border-neutral-800 hover:border-indigo-500/50 hover:bg-neutral-900/60 transition-all duration-300 animate-in fade-in slide-in-from-right-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-800 flex items-center justify-center border border-neutral-700 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 transition-all duration-500">
                    <Building className="w-7 h-7 text-neutral-400 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors leading-tight">
                      {ws.name}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-800 text-[10px] font-bold uppercase tracking-wider text-neutral-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-all">
                            <UserCircle2 className="w-3 h-3" />
                            {ws.role}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-medium">Organization ID: {ws.tenantId.slice(-6)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-neutral-500 group-hover:text-indigo-400 transition-all transform group-hover:translate-x-1">
                  <span className="text-sm font-semibold hidden sm:inline">Entrar</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </button>
          ))}

          {filteredWorkspaces.length === 0 && (
            <div className="text-center py-12 bg-neutral-900/20 rounded-3xl border border-dashed border-neutral-800">
              <Search className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500 font-medium">No se encontraron resultados para tu búsqueda.</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <p className="text-neutral-500 text-sm font-medium">
            ¿No ves tu organización? <button className="text-indigo-400 hover:text-indigo-300 transition-colors">Solicitar acceso</button>
          </p>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="text-neutral-400 hover:text-white hover:bg-neutral-800/50 gap-2 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      <div className="mt-12 text-neutral-600 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
        <Sparkles className="w-3 h-3" />
        GoDigital Infrastructure System
      </div>
    </div>
  );
}
