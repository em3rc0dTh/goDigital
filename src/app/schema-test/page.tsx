"use client";

import React, { useEffect, useState } from "react";
import { SchemaForm } from "@/components/schema-form/SchemaForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner"; // Assuming sonner is installed as per package.json
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PROVIDER_FORM_SCHEMA = {
    name: "provider_form",
    description: "Form to register a new supplier/provider",
    isActive: true,
    schema: {
        type: "object",
        title: "Register New Provider",
        required: ["name", "taxId", "email", "type"],
        properties: {
            name: { type: "string", title: "Provider Name" },
            taxId: { type: "string", title: "Tax ID / NIT / RFC" },
            contactName: { type: "string", title: "Contact Person" },
            email: { type: "string", title: "Email Address", format: "email" },
            type: {
                type: "string",
                title: "Provider Type",
                enum: ["Corporation", "LLC", "Individual", "Government"],
                default: "Corporation",
            },
            paymentTerms: {
                type: "string",
                title: "Payment Terms",
                enum: ["Immediate", "Net 30", "Net 60"],
                default: "Net 30",
            },
            address: { type: "string", title: "Billing Address" },
        },
    },
    uiSchema: {
        name: {
            "ui:widget": "text",
            "ui:placeholder": "e.g. Acme Corp",
            "ui:autofocus": true,
        },
        taxId: { "ui:widget": "text", "ui:placeholder": "e.g. 123456789-0" },
        contactName: { "ui:widget": "text" },
        email: {
            "ui:widget": "email",
            "ui:help": "We will send the PO to this email",
        },
        type: { "ui:widget": "select", "ui:placeholder": "Select provider type" },
        paymentTerms: { "ui:widget": "radio", "ui:options": { inline: true } },
        address: { "ui:widget": "textarea", "ui:options": { rows: 4 } },
    },
};

const PO_FORM_SCHEMA = {
    name: "purchase_order_form",
    description: "Form to create a new Purchase Order",
    isActive: true,
    schema: {
        type: "object",
        title: "New Purchase Order",
        required: ["providerId", "date", "currency", "items"],
        properties: {
            providerId: { type: "string", title: "Select Provider" },
            date: { type: "string", title: "Issue Date", format: "date" },
            currency: {
                type: "string",
                title: "Currency",
                enum: ["USD", "EUR", "COP", "MXN"],
                default: "USD",
            },
            notes: { type: "string", title: "Internal Notes" },
            items: {
                type: "array",
                title: "Order Items",
                minItems: 1,
                items: {
                    type: "object",
                    required: ["description", "quantity", "unitPrice"],
                    properties: {
                        description: { type: "string", title: "Description" },
                        quantity: { type: "number", title: "Quantity", minimum: 1 },
                        unitPrice: { type: "number", title: "Unit Price", minimum: 0 },
                    },
                },
            },
        },
    },
    uiSchema: {
        providerId: {
            "ui:widget": "select",
            "ui:placeholder": "Search provider...",
            "ui:options": {
                apiSource: "/api/providers",
                labelField: "name",
                valueField: "_id",
            },
        },
        date: { "ui:widget": "date" },
        currency: { "ui:widget": "select" },
        notes: { "ui:widget": "textarea" },
        items: {
            "ui:options": { orderable: true, addable: true, removable: true },
            items: {
                description: {
                    "ui:widget": "text",
                    "ui:placeholder": "Item name or service",
                },
                quantity: { "ui:widget": "updown" },
                unitPrice: {
                    "ui:widget": "text",
                    "ui:options": { inputType: "number", startAdornment: "$" },
                },
            },
        },
    },
};

export default function SchemaTestPage() {
    const [activeSchemaName, setActiveSchemaName] = useState("provider_form");
    const [schemaData, setSchemaData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({});

    const fetchSchema = async (name: string) => {
        setLoading(true);
        setSchemaData(null);
        try {
            const res = await fetch(`/api/form-schemas/by-name/${name}`);
            if (res.ok) {
                const data = await res.json();
                setSchemaData(data);
            } else {
                toast.error("Schema not found in DB");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch schema");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchema(activeSchemaName);
        setFormData({}); // Reset form data on switch
    }, [activeSchemaName]);

    const seedDatabase = async () => {
        try {
            // 1. Create Provider Form
            await fetch("/api/form-schemas", {
                method: "POST",
                body: JSON.stringify(PROVIDER_FORM_SCHEMA),
            });

            // 2. Create PO Form
            await fetch("/api/form-schemas", {
                method: "POST",
                body: JSON.stringify(PO_FORM_SCHEMA),
            });

            toast.success("Database seeded! Reloading schema...");
            fetchSchema(activeSchemaName);
        } catch (error) {
            toast.error("Failed to seed database");
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-3xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Form Schema Test</h1>
                <Button variant="outline" onClick={seedDatabase}>
                    Seed Database (Refrest Defaults)
                </Button>
            </div>

            <Tabs value={activeSchemaName} onValueChange={setActiveSchemaName} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="provider_form">Provider Form</TabsTrigger>
                    <TabsTrigger value="purchase_order_form">Purchase Order</TabsTrigger>
                </TabsList>
            </Tabs>

            {loading && <div>Loading schema...</div>}

            {!loading && !schemaData && (
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="mb-4 text-muted-foreground">Schema not found in database.</p>
                        <Button onClick={seedDatabase}>Click here to Seed Database</Button>
                    </CardContent>
                </Card>
            )}

            {!loading && schemaData && (
                <Card>
                    <CardHeader>
                        <CardTitle>{schemaData.schema.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SchemaForm
                            schema={schemaData.schema}
                            uiSchema={schemaData.uiSchema}
                            formData={formData}
                            onChange={(e) => setFormData(e.formData)}
                            onSubmit={(e) => {
                                console.log("Form submitted:", e.formData);
                                toast.success("Form submitted! Check console.");
                            }}
                        />
                    </CardContent>
                </Card>
            )}

            <div className="mt-8">
                <h3 className="text-sm font-medium mb-2">Current Form Data:</h3>
                <pre className="bg-slate-100 p-4 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(formData, null, 2)}
                </pre>
            </div>
        </div>
    );
}
