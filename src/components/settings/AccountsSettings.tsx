"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import React, { RefObject, useState, useEffect } from "react";
import { AccountsTable } from "../extract/AccountsTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useI18n } from "@/i18n/I18nProvider";

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
  // Update form state
  updateBankName: string | null;
  setUpdateBankName: (v: string) => void;
  updateCurrency: string | null;
  setUpdateCurrency: (v: string) => void;
  updateAccountType: string | null;
  setUpdateAccountType: (v: string) => void;
  updateAlias: string;
  setUpdateAlias: (v: string) => void;
  updateHolder: string;
  setUpdateHolder: (v: string) => void;
  updateNumber: string;
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
  updateBankName,
  setUpdateBankName,
  updateCurrency,
  setUpdateCurrency,
  updateAccountType,
  setUpdateAccountType,
  updateAlias,
  setUpdateAlias,
  updateHolder,
  setUpdateHolder,
  updateNumber,
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
  const [formKey, setFormKey] = useState(0);
  const { t } = useI18n(); // Hook usage

  useEffect(() => {
    console.log('[AccountsSettings] Update values changed:', { updateBankName, updateCurrency, updateAccountType });
  }, [updateBankName, updateCurrency, updateAccountType]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("Extract.Settings.Accounts.list")}</CardTitle>
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
            {t("Extract.Settings.Accounts.add")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            key={formKey}
            onSubmit={(e) => {
              e.preventDefault();
              addAccount(e);
              setFormKey(formKey + 1);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <Input ref={bankAlias} placeholder={t("Extract.Settings.Accounts.alias")} />
              <Select value={bankName ?? undefined} onValueChange={setBankName}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Extract.Settings.Accounts.bank")} />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input ref={bankHolder} placeholder={t("Extract.Settings.Accounts.holder")} required />
              <Select
                value={bankAccountType ?? undefined}
                onValueChange={setBankAccountType}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Extract.Settings.Accounts.type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Personal">{t("GettingStarted.form.natural")}</SelectItem>
                  <SelectItem value="Business">{t("GettingStarted.form.legal")}</SelectItem>
                </SelectContent>
              </Select>

              <Input ref={bankNumber} placeholder={t("Extract.Settings.Accounts.number")} required />
              <Select
                value={bankCurrency ?? undefined}
                onValueChange={setBankCurrency}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Extract.Settings.Accounts.currency")} />
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
                placeholder={t("Extract.Settings.Accounts.accountTypePlaceholder")}
              />
            </div>
            <Button type="submit">{t("Extract.Settings.Accounts.submit")}</Button>
          </form>
        </CardContent>
      </Card>

      {activeAccount && (
        <Card>
          <CardHeader>
            <CardTitle>{t("Extract.Settings.Accounts.update")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                value={updateAlias}
                onChange={(e) => setUpdateAlias(e.target.value)}
                placeholder={t("Extract.Settings.Accounts.alias")}
              />
              <Select
                key={`bank-${activeAccount}`}
                value={updateBankName ?? undefined}
                onValueChange={(v) => {
                  setUpdateBankName(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Extract.Settings.Accounts.bank")} />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={updateHolder}
                onChange={(e) => setUpdateHolder(e.target.value)}
                placeholder={t("Extract.Settings.Accounts.holder")}
              />
              <Input
                value={updateNumber}
                placeholder={t("Extract.Settings.Accounts.number")}
                readOnly
                className="bg-gray-100"
              />
              <Select
                key={`currency-${activeAccount}`}
                value={updateCurrency ?? undefined}
                onValueChange={(v) => {
                  setUpdateCurrency(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Extract.Settings.Accounts.currency")} />
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
                value={updateAccountType || ""}
                onChange={(e) => setUpdateAccountType(e.target.value)}
                placeholder={t("Extract.Settings.Accounts.type")}
              />
            </div>
            <Button onClick={saveAccountUpdates}>{t("Extract.Settings.Accounts.save")}</Button>
          </CardContent>
        </Card>
      )}

      {activeAccount && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">{t("Extract.Settings.Accounts.danger")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800 mb-4">
              {t("Extract.Settings.Accounts.dangerDesc")}
            </p>
            <Button
              variant="destructive"
              onClick={deleteSelectedAccount}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("Extract.Settings.Accounts.delete")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
