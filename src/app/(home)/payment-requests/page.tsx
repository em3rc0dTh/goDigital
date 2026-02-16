"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Loader2,
    Plus,
    Search,
    FileText,
    Eye,
    MoreHorizontal,
    Filter,
    ArrowUpDown
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PaymentRequest {
    _id: string;
    project_id: { _id: string; name: string } | string;
    provider_id: { _id: string; name: string } | string;
    amount: number;
    tax: number;
    total: number;
    currency: string;
    status: string;
    date: string;
    createdAt: string;
    purchase_order_id?: any;
}

export default function PaymentRequestsPage() {
    const router = useRouter();
    const [data, setData] = useState<PaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const token = Cookies.get("session_token");
                const tenantDetailId = Cookies.get("tenantDetailId");

                // Fetch "my" payment requests
                const response = await fetch(`${API_BASE}/payment-requests?mine=true`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "x-tenant-detail-id": tenantDetailId || "",
                    },
                    credentials: "include",
                });

                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                } else {
                    console.error("Failed to fetch payment requests");
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [API_BASE]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'approved': return "bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200";
            case 'authorized': return "bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-200";
            case 'paid': return "bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 border-purple-200";
            case 'rejected': return "bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-200";
            case 'pending': return "bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 border-yellow-200";
            default: return "bg-gray-500/15 text-gray-700 hover:bg-gray-500/25 border-gray-200";
        }
    };

    const filteredData = data.filter(item => {
        const matchesSearch =
            (typeof item.project_id === 'object' ? item.project_id?.name : item.project_id)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (typeof item.provider_id === 'object' ? item.provider_id?.name : item.provider_id)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item._id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-muted/50 py-8">
            <div className="container max-w-6xl mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">My Payment Requests</h1>
                        <p className="text-muted-foreground mt-1">
                            View and manage your payment requests
                        </p>
                    </div>
                    <Button onClick={() => router.push("/payment-request")} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                        <Plus className="h-4 w-4" />
                        New Request
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by project, provider or ID..."
                            className="pl-9 bg-background"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-[180px]">
                        <select
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="authorized">Authorized</option>
                            <option value="paid">Paid</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <Card className="shadow-sm border-muted-foreground/20">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="w-[100px]">ID</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="w-[120px]">Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                                Loading requests...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                            No payment requests found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredData.map((item) => (
                                        <TableRow key={item._id} className="group hover:bg-muted/5">
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                #{item._id.slice(-6).toUpperCase()}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {typeof item.project_id === 'object' ? item.project_id?.name : 'Unknown Project'}
                                            </TableCell>
                                            <TableCell>
                                                {typeof item.provider_id === 'object' ? item.provider_id?.name : 'Unknown Provider'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {item.date || (item.createdAt ? format(new Date(item.createdAt), "MMM d, yyyy") : "-")}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {item.currency} {item.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`capitalize ${getStatusColor(item.status)}`}>
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => router.push(`/payment-request/${item._id}`)}>
                                                        <Eye className="h-4 w-4" />
                                                        <span className="sr-only">View</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
