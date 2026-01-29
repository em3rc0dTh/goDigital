"use client";

import { useEffect, useState } from "react";
import { RawTransaction, fetchRawTransactions } from "@/services/transactions";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { MoreVertical, RefreshCcw } from "lucide-react";

export default function RawDataPage() {
    const [transactions, setTransactions] = useState<RawTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isReconciling, setIsReconciling] = useState(false);
    const API_BASE =
        process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const data = await fetchRawTransactions();
            setTransactions(data.transactions);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Failed to load raw transactions");
        } finally {
            setLoading(false);
        }
    }

    const handleReconcile = async () => {
        setIsReconciling(true);
        try {
            const tenantDetailId = Cookies.get('tenantDetailId') || "";
            const result = await reconcileGmailEmails(tenantDetailId);

            toast.success('Reconciliation completed!', {
                description: `Processed: ${result.processed}, Matched: ${result.matched}, Not Matched: ${result.notMatched}`,
            });

            // Refresh the data
            await loadData();
        } catch (error) {
            toast.error('Failed to reconcile emails', {
                description: 'Please try again later',
            });
        } finally {
            setIsReconciling(false);
        }
    };

    async function reconcileGmailEmails(entityId: string) {
        try {
            const response = await fetch(
                `${API_BASE}/reconcile/${entityId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        "Authorization": `Bearer ${Cookies.get('token')}`,
                    },
                    credentials: 'include',
                }
            );
            if (!response.ok) {
                throw new Error('Failed to reconcile emails');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error reconciling emails:', error);
            throw error;
        }
    }

    // Helper function to format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Helper function to format time
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    if (loading) {
        return <div className="p-8">Loading raw transactions...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-500">{error}</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Raw Reconciled (Draft)</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        <div className="flex flex-row justify-between items-center">
                            <div>Unified Transaction Stream (RECO v2)</div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <MoreVertical className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={handleReconcile}
                                        disabled={isReconciling}
                                    >
                                        <RefreshCcw className="mr-2 h-4 w-4" />
                                        {isReconciling ? "Reconciling..." : "Reconcile Gmail Emails"}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Origin</TableHead>
                                <TableHead>Destination</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>RECO</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                                        No transactions found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => {
                                    const dateToUse = tx.transactionVariables.operationDate || tx.receivedAt;

                                    return (
                                        <TableRow key={tx._id}>
                                            <TableCell className="font-medium">
                                                {formatDate(dateToUse)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatTime(dateToUse)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {tx.subject || tx.transactionVariables.originAccount || "N/A"}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {tx.from || tx.externalId || ""}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={tx.transactionVariables.amount && tx.transactionVariables.amount < 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                                                    {tx.transactionVariables.currency} {tx.transactionVariables.amount?.toFixed(2)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {tx.transactionVariables.originAccount || "—"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {tx.transactionVariables.destinationAccount || "—"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={tx.source === 'GMAIL' ? 'secondary' : 'outline'}>
                                                    {tx.source}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {
                                                    tx.linkedSources?.map((source) => (
                                                        <Badge key={source.sourceId} variant="outline" className="mr-2 bg-gray-200 text-gray-800">
                                                            {source.source}
                                                        </Badge>
                                                    ))
                                                }
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={tx.processed ? "secondary" : "default"}>
                                                    {tx.processed ? "Processed" : "Pending"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
} 