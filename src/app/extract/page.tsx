"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AccountsView from "../../components/extract/accountsView";
import Transactions from "../../components/extract/transactions";
import SettingsView from "../../components/extract/settings";
import EmailsView from "../../components/extract/emails";
import EmailsPage from "../../components/extract/emailsPage";

export default function Extract() {
  return (
    <div className="w-full max-w-6xl mx-auto py-10 px-4 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Bank Transactions Parser MVP
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your bank accounts and parsed transactions easily.
        </p>
      </header>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="flex flex-row w-full  rounded-xl bg-card p-1 shadow-sm items-center justify-center justify-around">
          {/* <TabsTrigger
            value="bankAccount"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
          >
            Bank Accounts
          </TabsTrigger> */}

          <TabsTrigger
            value="transactions"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
          >
            Transaction Capture
          </TabsTrigger>

          {/* <TabsTrigger
            value="emails"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
          >
            Emails
          </TabsTrigger> */}
          <TabsTrigger
            value="email-connector"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
          >
            Email Capture
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
          >
            Settings
          </TabsTrigger>
        </TabsList>

        {/* <TabsContent value="bankAccount" className="mt-6">
          <AccountsView />
        </TabsContent> */}

        <TabsContent value="transactions" className="mt-6">
          <Transactions />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SettingsView />
        </TabsContent>

        {/* <TabsContent value="emails" className="mt-6">
          <EmailsView />
        </TabsContent> */}

        <TabsContent value="email-connector" className="mt-6">
          <EmailsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
