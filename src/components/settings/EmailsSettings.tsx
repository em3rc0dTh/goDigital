"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import React, { RefObject, useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmailSetup {
  id?: string;
  alias: string;
  bank_name: string;
  service_type: string;
  bank_sender: string;
  tenant_id?: string;
  tenant_detail_id?: string;
  account_id?: string;
  db_name?: string;
}

interface EmailTabProps {
  imapConfig: any;
  accounts: any[];
  emailSetups: EmailSetup[];
  emailUser: RefObject<HTMLInputElement>;
  emailPass: RefObject<HTMLInputElement>;
  aliasEmail: RefObject<HTMLInputElement>;
  bankNameEmail: RefObject<HTMLInputElement>;
  serviceTypeEmail: RefObject<HTMLInputElement>;
  bankEmailSender: RefObject<HTMLInputElement>;
  account: RefObject<HTMLSelectElement>;
  addEmailConfig: (event: React.FormEvent<HTMLFormElement>) => void;
  addSetupToEmail: (event: React.FormEvent<HTMLFormElement>) => void;
  updateImapConfig: (user: string, password: string) => void;
  deleteImapConfig: () => void;
  updateEmailSetup: (id: string, updated: EmailSetup) => void;
  deleteEmailSetup: (id: string) => void;
}

export function EmailTab({
  imapConfig,
  accounts,
  emailSetups,
  emailUser,
  emailPass,
  aliasEmail,
  bankNameEmail,
  serviceTypeEmail,
  bankEmailSender,
  account,
  addEmailConfig,
  addSetupToEmail,
  updateImapConfig,
  deleteImapConfig,
  updateEmailSetup,
  deleteEmailSetup,
}: EmailTabProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EmailSetup | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [imapModalOpen, setImapModalOpen] = useState(false);
  const [newImapPass, setNewImapPass] = useState("");

  const openEditModal = (setup: EmailSetup) => {
    if (!setup.id) {
      console.error("Setup missing ID");
      return;
    }
    setEditId(setup.id);
    setEditData({ ...setup });
    setModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editId !== null && editData) {
      updateEmailSetup(editId, editData);
      setModalOpen(false);
      setEditId(null);
      setEditData(null);
    }
  };

  useEffect(() => {
    if (account.current) {
      account.current.value = selectedAccount;
    }
  }, [selectedAccount]);

  const handleSaveImapPass = () => {
    if (newImapPass.trim() && imapConfig?.user) {
      updateImapConfig(imapConfig.user, newImapPass);
      setImapModalOpen(false);
      setNewImapPass("");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>IMAP Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={addEmailConfig} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                ref={emailUser}
                type="email"
                placeholder="your.email@gmail.com"
                required
                defaultValue={imapConfig?.user || ""}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input
                ref={emailPass}
                type="password"
                placeholder="App password"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Save IMAP Config
            </Button>
          </form>

          {imapConfig && (
            <div className="mt-4 p-3 bg-green-50 rounded flex flex-row justify-between items-center gap-2">
              <p className="text-sm text-green-800">
                Active IMAP: <strong>{imapConfig.user}</strong>
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setImapModalOpen(true)}>
                  Update Password
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={deleteImapConfig}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}

          <div className="mt-4">
            <h4 className="font-semibold mb-2 text-sm">IMAP Config History</h4>
            {imapConfig?.history?.length > 0 ? (
              <div className="space-y-2">
                {imapConfig.history.map((conf: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2 rounded border text-xs bg-gray-50 border-gray-200"
                  >
                    <p>
                      {conf.user} -{" "}
                      {conf.active ? (
                        <span className="text-green-600 font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="text-gray-500">Inactive</span>
                      )}
                    </p>
                    <p className="text-gray-500">
                      Created at: {new Date(conf.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-xs">No history available</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Connector Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              addSetupToEmail(e);
              setSelectedAccount(""); // o ""
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <Input ref={aliasEmail} placeholder="Alias (optional)" />
              <Input ref={bankNameEmail} placeholder="Bank Name" required />
              <Input ref={serviceTypeEmail} placeholder="Service Type (e.g., email)" required />
              <Input ref={bankEmailSender} placeholder="Email Sender (e.g., noreply@bank.com)" required />
              <div>
                <Select
                  value={selectedAccount}
                  onValueChange={setSelectedAccount}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>

                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.bank_name} · {acc.account_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              </div>


            </div>
            <Button type="submit" className="w-full">
              Add Email Setup
            </Button>
          </form>

          {emailSetups.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold text-sm">Configured Email Setups</h4>
              {emailSetups.map((setup) => (
                <div
                  key={setup.id}
                  className="p-3 bg-blue-50 rounded border border-blue-200 flex justify-between items-start text-sm"
                >
                  <div className="flex-1">
                    <p className="font-medium">{setup.bank_name}</p>
                    {setup.alias && (
                      <p className="text-xs text-gray-500">Alias: {setup.alias}</p>
                    )}
                    <p className="text-xs text-gray-600">
                      From: <code className="bg-white px-1 rounded">{setup.bank_sender}</code>
                    </p>
                    <p className="text-xs text-gray-600">
                      Type: {setup.service_type}
                    </p>
                    {setup.account_id && (
                      <p className="text-xs text-gray-500 mt-1">
                        Account: {setup.account_id}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" onClick={() => openEditModal(setup)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setup.id && deleteEmailSetup(setup.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para editar email setup */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Email Setup</DialogTitle>
          </DialogHeader>
          {editData && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Alias</label>
                <Input
                  value={editData.alias}
                  onChange={(e) =>
                    setEditData({ ...editData, alias: e.target.value })
                  }
                  placeholder="Optional alias"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Bank Name</label>
                <Input
                  value={editData.bank_name}
                  onChange={(e) =>
                    setEditData({ ...editData, bank_name: e.target.value })
                  }
                  placeholder="Bank Name"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Service Type</label>
                <Input
                  value={editData.service_type}
                  onChange={(e) =>
                    setEditData({ ...editData, service_type: e.target.value })
                  }
                  placeholder="Service Type"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Bank Email Sender</label>
                <Input
                  value={editData.bank_sender}
                  onChange={(e) =>
                    setEditData({ ...editData, bank_sender: e.target.value })
                  }
                  placeholder="noreply@bank.com"
                  required
                />
              </div>
              <DialogFooter className="flex gap-2">
                <Button onClick={handleSaveEdit}>Save Changes</Button>
                <Button
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para actualizar password IMAP */}
      <Dialog open={imapModalOpen} onOpenChange={setImapModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update IMAP Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Email</label>
              <Input
                value={imapConfig?.user || ""}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                placeholder="New app password"
                value={newImapPass}
                onChange={(e) => setNewImapPass(e.target.value)}
              />
            </div>
            <DialogFooter className="flex gap-2">
              <Button onClick={handleSaveImapPass}>Save Password</Button>
              <Button
                variant="outline"
                onClick={() => setImapModalOpen(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}