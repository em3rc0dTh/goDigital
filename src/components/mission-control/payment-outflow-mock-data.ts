
export interface Account {
    id: string;
    alias: string; // e.g., "Cta Cte Soles"
    currency: "PEN" | "USD";
    balance: number;
}

export interface Bank {
    id: string;
    name: string;
    color: string; // For UI differentiation if needed
    accounts: Account[];
}

export interface ScheduledPayment {
    id: string;
    description: string;
    amount: number;
    currency: "PEN" | "USD";
    accountId: string; // Links to Account.id
    attentionDate: string; // YYYY-MM-DD
    status: "approved" | "pending" | "authorized" | "paid" | "rejected";
}

// 1. Banks and Accounts
export const MOCK_BANKS: Bank[] = [
    {
        id: "interbank",
        name: "Interbank",
        color: "#0039A6", // Interbank Blue
        accounts: [
            { id: "ibk-pen-01", alias: "Cta Cte Soles ****1234", currency: "PEN", balance: 52000.00 },
            { id: "ibk-usd-01", alias: "Cta Cte Dólares ****5678", currency: "USD", balance: 12500.00 },
        ]
    },
    {
        id: "bbva",
        name: "BBVA",
        color: "#1973B8", // BBVA Blue
        accounts: [
            { id: "bbva-pen-01", alias: "Cta Recaudadora ****9012", currency: "PEN", balance: 18000.00 },
            { id: "bbva-usd-01", alias: "Cta Master ****3456", currency: "USD", balance: 5000.00 },
        ]
    },
    {
        id: "scotia",
        name: "Scotiabank",
        color: "#EC111A", // Scotiabank Red
        accounts: [
            { id: "scotia-pen-01", alias: "Cta Soles ****7890", currency: "PEN", balance: 8500.00 },
        ]
    },
    {
        id: "bcp",
        name: "BCP",
        color: "#002A8F", // BCP Blue
        accounts: [
            { id: "bcp-pen-01", alias: "Cta Cobranzas ****2468", currency: "PEN", balance: 35000.00 },
            { id: "bcp-usd-01", alias: "Cta Exterior ****1357", currency: "USD", balance: 42000.00 },
        ]
    }
];

// 2. Scheduled Payments (Approving for attention dates)
// We'll generate dynamic dates relative to "today" to ensure the dashboard always has data to show.
const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const addDays = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return formatDate(d);
};

export const MOCK_SCHEDULED_PAYMENTS: ScheduledPayment[] = [
    // Today
    { id: "p1", description: "Proveedor ABC - Facturas Feb", amount: 15000.00, currency: "PEN", accountId: "ibk-pen-01", attentionDate: addDays(0), status: "approved" },
    { id: "p2", description: "Servicios Cloud", amount: 2000.00, currency: "USD", accountId: "ibk-usd-01", attentionDate: addDays(0), status: "approved" },

    // Tomorrow
    { id: "p3", description: "Planilla Quincenal", amount: 25000.00, currency: "PEN", accountId: "bcp-pen-01", attentionDate: addDays(1), status: "approved" },
    { id: "p4", description: "Importación China", amount: 10000.00, currency: "USD", accountId: "bcp-usd-01", attentionDate: addDays(1), status: "approved" },

    // Overdraft Scenarios (Intentional)
    // BBVA Pen has 18000. Let's schedule 20000.
    { id: "p5", description: "Pago Proveedor Mayorista", amount: 20000.00, currency: "PEN", accountId: "bbva-pen-01", attentionDate: addDays(0), status: "approved" },

    // Future
    { id: "p6", description: "Alquiler Oficina", amount: 4500.00, currency: "USD", accountId: "ibk-usd-01", attentionDate: addDays(5), status: "approved" },
    { id: "p7", description: "Seguros", amount: 1200.00, currency: "PEN", accountId: "scotia-pen-01", attentionDate: addDays(2), status: "approved" },

    // Not approved (should be ignored by logic, but present in data)
    { id: "p8", description: "Borrador de pago", amount: 5000.00, currency: "PEN", accountId: "ibk-pen-01", attentionDate: addDays(0), status: "pending" },
];
