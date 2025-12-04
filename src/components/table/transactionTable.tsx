import { GenericTable } from "./common-table";

//TODO FIX IT WITH AN GENERIC TABLE
type Column = {
    label: string;
    key?: string;
    align?: "left" | "right" | "center";
    render?: (row: unknown, index?: number) => React.ReactNode;
    className?: string;
};

export function PersonalTable({ storedTransactions }: { storedTransactions: any[] }) {
    const columns: Column[] = [
        { label: "#", render: (_: any, i?: number) => (i ?? 0) + 1 },
        { label: "Description", key: "descripcion" },
        { label: "Date & Time", render: (tx: any) => tx.fecha_hora_raw || tx.fecha_hora },
        {
            label: "Amount",
            align: "right",
            render: (tx: any) => (
                <span className={tx.monto > 0 ? "text-green-600" : "text-red-600"}>
                    {tx.monto > 0 ? "+" : ""}
                    {Number(tx.monto).toFixed(2)}
                </span>
            ),
        },
        { label: "Currency", align: "center", render: (tx: any) => tx.currency_raw || tx.currency },
    ];



    return <GenericTable data={storedTransactions} columns={columns} />;

}

export function BusinessTable({ storedTransactions }: { storedTransactions: any[] }) {
    const columns: Column[] = [
        { label: "Operation Date", key: "operation_date" },
        { label: "Process Date", key: "process_date" },
        { label: "Operation #", key: "operation_number" },
        { label: "Movement", key: "movement" },
        { label: "Description", key: "descripcion" },
        { label: "Channel", key: "channel" },
        {
            label: "Amount",
            align: "right",
            render: (tx: any) => (
                <span className={tx.amount > 0 ? "text-green-600" : "text-red-600"}>
                    {tx.amount}
                </span>
            ),
        },
        { label: "Balance", key: "balance", align: "right" },
    ];



    return <GenericTable data={storedTransactions} columns={columns} />;
}