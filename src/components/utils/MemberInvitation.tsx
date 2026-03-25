"use client";

import { useState, useEffect } from "react";
import { 
    UserPlus, 
    Mail, 
    Shield, 
    Trash2, 
    Loader2, 
    CheckCircle2, 
    Clock,
    MoreVertical,
    UserCircle,
    UserCheck,
    Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { useCallback } from "react";

interface Member {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
        status: string;
        lastLogin?: string;
    };
    role: string;
    status: string;
    createdAt: string;
}

export default function MemberInvitation() {
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInviting, setIsInviting] = useState(false);
    const [inviteForm, setInviteForm] = useState({
        email: "",
        role: "standard",
        name: ""
    });

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

    const fetchMembers = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = Cookies.get("session_token");
            const res = await fetch(`${API_BASE}/members`, {
                headers: { "Authorization": `Bearer ${token}` },
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setMembers(data.members);
            }
        } catch (error) {
            console.error("Error fetching members:", error);
            toast.error("Error al cargar miembros");
        } finally {
            setIsLoading(false);
        }
    }, [API_BASE]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleUpdateRole = async (memberId: string, newRole: string) => {
        try {
            const token = Cookies.get("session_token");
            const res = await fetch(`${API_BASE}/members/${memberId}`, {
                method: "PUT",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ role: newRole }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Rol actualizado");
                fetchMembers();
            } else {
                toast.error("Error al actualizar rol", { description: data.error });
            }
        } catch (error) {
            console.error("Update role error:", error);
            toast.error("Error de red");
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteForm.email || !inviteForm.role) {
            toast.error("Email y Rol son requeridos");
            return;
        }

        setIsInviting(true);
        try {
            const token = Cookies.get("session_token");
            const res = await fetch(`${API_BASE}/members/invite`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(inviteForm),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Invitación enviada", {
                    description: `Se ha enviado un correo a ${inviteForm.email}`
                });
                setInviteForm({ email: "", role: "standard", name: "" });
                fetchMembers();
            } else {
                toast.error("Fallo al invitar", { description: data.error });
            }
        } catch (error) {
            console.error("Invite error:", error);
            toast.error("Error de red");
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemove = async (memberId: string) => {
        try {
            const token = Cookies.get("session_token");
            const res = await fetch(`${API_BASE}/members/${memberId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` },
                credentials: "include",
            });

            if (res.ok) {
                toast.success("Miembro eliminado");
                fetchMembers();
            } else {
                toast.error("Error al eliminar miembro");
            }
        } catch (error) {
            console.error("Remove error:", error);
            toast.error("Error de red");
        }
    };

    const getStatusBadge = (status: string, userStatus: string) => {
        if (userStatus === "invited") {
            return (
                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 gap-1 font-bold uppercase text-[10px]">
                    <Clock className="w-3 h-3" /> Pendiente
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 gap-1 font-bold uppercase text-[10px]">
                <CheckCircle2 className="w-3 h-3" /> Activo
            </Badge>
        );
    };

    const getRoleIcon = (role: string) => {
        switch (role.toLowerCase()) {
            case "admin":
            case "superadmin":
                return <Shield className="w-3 h-3" />;
            case "treasurer":
                return <Shield className="w-3 h-3 text-indigo-500" />;
            default:
                return <UserCircle className="w-3 h-3" />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* INVITATION FORM */}
            <Card className="border-neutral-200 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                            <UserPlus className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Invitar Colaboradores</CardTitle>
                            <CardDescription>Añade nuevos miembros a tu equipo de trabajo.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-5 space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-neutral-500 ml-1">Correo Electrónico</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-indigo-500 transition-colors" />
                                <Input 
                                    placeholder="ejemplo@empresa.com"
                                    type="email"
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                                    className="pl-10 h-11 border-neutral-200 focus:ring-indigo-500/20"
                                    required
                                />
                            </div>
                        </div>
                        <div className="md:col-span-4 space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-neutral-500 ml-1">Rol / Permisos</label>
                            <div className="relative group">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-indigo-500 transition-colors" />
                                <select 
                                    className="w-full h-11 pl-10 pr-4 border border-neutral-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
                                    value={inviteForm.role}
                                    onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})}
                                >
                                    <option value="standard">Estandar (Standard)</option>
                                    <option value="treasurer">Tesorero (Treasurer)</option>
                                    <option value="admin">Administrador (Admin)</option>
                                    <option value="superadmin">Super Administrador (Superadmin)</option>
                                </select>
                            </div>
                        </div>
                        <div className="md:col-span-3 flex items-end">
                            <Button 
                                type="submit" 
                                disabled={isInviting}
                                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                            >
                                {isInviting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                <span>Enviar Invitación</span>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* MEMBER LIST */}
            <Card className="border-neutral-200 shadow-sm overflow-hidden">
                <CardHeader className="pb-2 border-b border-neutral-50 bg-neutral-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-bold">Equipo Actual</CardTitle>
                            <Badge variant="secondary" className="bg-neutral-200 text-neutral-700 text-[10px]">
                                {members.length} Miembros
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-8 h-8 text-neutral-300 animate-spin" />
                            <p className="text-sm text-neutral-500 font-medium">Cargando miembros...</p>
                        </div>
                    ) : members.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-2">
                             <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-2">
                                <UserCircle className="w-8 h-8 text-neutral-400" />
                            </div>
                            <p className="text-neutral-900 font-bold">No hay otros miembros</p>
                            <p className="text-neutral-500 text-sm max-w-xs">Tu workspace está solo todavía. ¡Invita a alguien!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-100">
                            {members.map((member) => (
                                <div key={member._id} className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 overflow-hidden">
                                                {member.userId.avatar ? (
                                                    <img src={member.userId.avatar} alt={member.userId.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserCircle className="w-6 h-6 text-indigo-500" />
                                                )}
                                            </div>
                                            {member.userId.status === "active" && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                                            )}
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors">
                                                    {member.userId.name}
                                                </p>
                                                {getStatusBadge(member.status, member.userId.status)}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-neutral-500 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {member.userId.email}
                                                </span>
                                                <span className="text-neutral-300">•</span>
                                                <Badge variant="secondary" className="gap-1 px-1.5 py-0 bg-neutral-100 text-neutral-600 border-transparent text-[10px] font-bold uppercase">
                                                    {getRoleIcon(member.role)} {member.role}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 bg-white border-neutral-200">
                                                 <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger className="text-xs font-bold gap-2 cursor-pointer">
                                                        <Shield className="w-4 h-4" /> Cambiar Rol
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuPortal>
                                                        <DropdownMenuSubContent className="bg-white border-neutral-200">
                                                            <DropdownMenuItem 
                                                                className="text-xs font-bold cursor-pointer transition-colors hover:bg-indigo-50"
                                                                onClick={() => handleUpdateRole(member._id, "standard")}
                                                            >
                                                                Estandar (Standard)
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                className="text-xs font-bold cursor-pointer transition-colors hover:bg-indigo-50"
                                                                onClick={() => handleUpdateRole(member._id, "treasurer")}
                                                            >
                                                                Tesorero (Treasurer)
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                className="text-xs font-bold cursor-pointer transition-colors hover:bg-indigo-50"
                                                                onClick={() => handleUpdateRole(member._id, "admin")}
                                                            >
                                                                Administrador (Admin)
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                className="text-xs font-bold cursor-pointer transition-colors hover:bg-indigo-50"
                                                                onClick={() => handleUpdateRole(member._id, "superadmin")}
                                                            >
                                                                Super Administrador (Superadmin)
                                                            </DropdownMenuItem>
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuPortal>
                                                 </DropdownMenuSub>
                                                 <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    className="text-xs font-bold gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer"
                                                    onClick={() => handleRemove(member._id)}
                                                >
                                                    <Trash2 className="w-4 h-4" /> Eliminar Acceso
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex items-center gap-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                <div className="p-2 bg-indigo-600 rounded-lg">
                    <UserCheck className="w-4 h-4 text-white" />
                </div>
                <div className="text-xs text-indigo-900 font-medium leading-relaxed">
                    <strong>Consejo:</strong> Los administradores pueden ver y gestionar todos los gastos, mientras que los colaboradores solo pueden ver sus propias subidas de archivos y solicitudes.
                </div>
            </div>
        </div>
    );
}
