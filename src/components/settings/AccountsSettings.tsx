"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import React, { RefObject } from "react";
import { AccountsTable } from "../extract/AccountsTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface AccountsTabProps {
  accounts: any[];
  activeAccount: string | null;
  selectAccount: (id: string) => void;
  addAccount: (event: React.FormEvent<HTMLFormElement>) => void;
  saveAccountUpdates: () => void;
  deleteSelectedAccount: () => void;
  bankAlias: RefObject<HTMLInputElement>;
  bankName: string | null;
  setBankName: (v: string) => void;
  bankHolder: RefObject<HTMLInputElement>;
  bankNumber: RefObject<HTMLInputElement>;
  bankAccountType: string | null;
  setBankAccountType: (v: string) => void;
  bankCurrency: string | null;
  setBankCurrency: (v: string) => void;
  bankType: RefObject<HTMLInputElement>;
  settingsAlias: RefObject<HTMLInputElement>;
  settingsBankName: RefObject<HTMLInputElement>;
  settingsHolder: RefObject<HTMLInputElement>;
  settingsNumber: RefObject<HTMLInputElement>;
  settingsCurrency: RefObject<HTMLInputElement>;
  settingsType: RefObject<HTMLInputElement>;
}

export function AccountsTab({
  accounts,
  activeAccount,
  selectAccount,
  addAccount,
  saveAccountUpdates,
  deleteSelectedAccount,
  bankAlias,
  bankName,
  setBankName,
  bankHolder,
  bankNumber,
  bankAccountType,
  setBankAccountType,
  bankCurrency,
  setBankCurrency,
  bankType,
  settingsAlias,
  settingsBankName,
  settingsHolder,
  settingsNumber,
  settingsCurrency,
  settingsType,
}: AccountsTabProps) {
  const BANKS = [
    "BCP",
    "BBVA",
    "Interbank",
    "Scotiabank",
    "Banco de la Nación",
    "Caja Arequipa",
    "Caja Huancayo",
  ];

  const CURRENCIES = [
    { value: "PEN", label: "PEN" },
    { value: "USD", label: "USD" },
    { value: "EUR", label: "EUR" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Bank Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountsTable
            accounts={accounts}
            activeId={activeAccount}
            onSelect={selectAccount}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addAccount} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input ref={bankAlias} placeholder="Alias (e.g., Main)" />
              <Select value={bankName ?? undefined} onValueChange={setBankName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Bank" />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input ref={bankHolder} placeholder="Account Holder" required />
              <Select
                value={bankAccountType ?? undefined}
                onValueChange={setBankAccountType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Bank Account Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
              </Select>

              <Input ref={bankNumber} placeholder="Account Number" required />
              <Select
                value={bankCurrency ?? undefined}
                onValueChange={setBankCurrency}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                ref={bankType}
                placeholder="Account Type (Savings, Checking...)"
              />
            </div>
            <Button type="submit">Add Account</Button>
          </form>
        </CardContent>
      </Card>

      {activeAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Update Selected Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input ref={settingsAlias} placeholder="Alias" />
              <Select
                onValueChange={(v) => {
                  if (settingsBankName.current) settingsBankName.current.value = v;
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Bank Name" />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input ref={settingsHolder} placeholder="Account Holder" />
              <Input
                ref={settingsNumber}
                placeholder="Account Number"
                readOnly
                className="bg-gray-100"
              />
              <Select
                onValueChange={(v) => {
                  if (settingsCurrency.current) settingsCurrency.current.value = v;
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input ref={settingsType} placeholder="Account Type" />
            </div>
            <Button onClick={saveAccountUpdates}>Save Changes</Button>
          </CardContent>
        </Card>
      )}

      {activeAccount && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800 mb-4">
              Deleting this account will also remove all associated transactions
            </p>
            <Button
              variant="destructive"
              onClick={deleteSelectedAccount}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
