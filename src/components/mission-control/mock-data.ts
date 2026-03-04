
export const mockData = {
    general: {
        totalLiquidity: 124892.45,
        trends: 12.4, // Percentage
        variation: -3.2, // Percentage
        evolution: [
            { month: "JAN", income: 12000, expenses: 8000 },
            { month: "FEB", income: 15000, expenses: 10000 },
            { month: "MAR", income: 18000, expenses: 14000 },
            { month: "APR", income: 25000, expenses: 9000 },
            { month: "MAY", income: 14000, expenses: 18000 },
            { month: "JUN", income: 29000, expenses: 11000 },
        ],
    },
    banks: [
        {
            id: "interbank",
            name: "Interbank",
            totalAssets: 14240500.00,
            treasury: 6400000,
            investments: 3500000,
            distribution: [
                { name: "Treasury", value: 45, fill: "#0ea5e9" }, // Sky 500
                { name: "Investments", value: 25, fill: "#10b981" }, // Emerald 500
                { name: "Fixed Assets", value: 20, fill: "#6366f1" }, // Indigo 500
                { name: "Others", value: 10, fill: "#94a3b8" }, // Slate 400
            ],
            accounts: [
                {
                    id: 1,
                    name: "Cuenta Simple Corriente",
                    number: "**** 8921",
                    type: "OPERATIVA",
                    balance: 4210000.45,
                    trend: 2.4,
                    creationDate: "2019-05-12", // Real opening date
                    serviceDate: "2023-01-15", // Introduced to goDigital
                },
                {
                    id: 2,
                    name: "Depósito a Plazo",
                    number: "**** 4432",
                    type: "INVERSIÓN",
                    balance: 2150000.00,
                    trend: 0,
                    creationDate: "2021-08-20",
                    serviceDate: "2023-03-01",
                    termDays: 180,
                },
                {
                    id: 3,
                    name: "Fondo Mutuo Liquidez",
                    number: "**** 1109",
                    type: "VARIABLE",
                    balance: 840490.12,
                    trend: -0.8,
                    creationDate: "2022-11-05",
                    serviceDate: "2023-06-10",
                },
            ],
        },
        {
            id: "bcp",
            name: "BCP",
            totalAssets: 8500200.50,
            treasury: 4200000,
            investments: 2100000,
            distribution: [
                { name: "Treasury", value: 55, fill: "#f59e0b" }, // Amber 500
                { name: "Investments", value: 30, fill: "#ec4899" }, // Pink 500
                { name: "Fixed Assets", value: 10, fill: "#8b5cf6" }, // Violet 500
                { name: "Others", value: 5, fill: "#64748b" }, // Slate 500
            ],
            accounts: [
                {
                    id: 4,
                    name: "Cuenta Megacash",
                    number: "**** 2201",
                    type: "OPERATIVA",
                    balance: 3100000.20,
                    trend: 1.8,
                    creationDate: "2018-03-10",
                    serviceDate: "2022-12-01",
                },
                {
                    id: 5,
                    name: "Fondo Inversión Soles",
                    number: "**** 9931",
                    type: "INVERSIÓN",
                    balance: 1500000.00,
                    trend: 5.2,
                    creationDate: "2020-07-22",
                    serviceDate: "2023-02-15",
                },
            ],
        },
    ],
};
