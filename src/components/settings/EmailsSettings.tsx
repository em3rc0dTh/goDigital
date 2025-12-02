"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import React, { RefObject, useState } from "react";

interface EmailSetup {
  alias: string;
  bank_name: string;
  service_type: string;
  bank_sender: string;
}

interface EmailTabProps {
  imapConfig: any;
  emailSetups: EmailSetup[];
  emailUser: RefObject<HTMLInputElement>;
  emailPass: RefObject<HTMLInputElement>;
  aliasEmail: RefObject<HTMLInputElement>;
  bankNameEmail: RefObject<HTMLInputElement>;
  serviceTypeEmail: RefObject<HTMLInputElement>;
  bankEmailSender: RefObject<HTMLInputElement>;
  addEmailConfig: (event: React.FormEvent<HTMLFormElement>) => void;
  addSetupToEmail: (event: React.FormEvent<HTMLFormElement>) => void;
  updateImapConfig: (user: string, password: string) => void;
  deleteImapConfig: () => void;
  updateEmailSetup: (idx: number, updated: EmailSetup) => void;
  deleteEmailSetup: (idx: number) => void;
}

export function EmailTab({
  imapConfig,
  emailSetups,
  emailUser,
  emailPass,
  aliasEmail,
  bankNameEmail,
  serviceTypeEmail,
  bankEmailSender,
  addEmailConfig,
  addSetupToEmail,
  updateImapConfig,
  deleteImapConfig,
  updateEmailSetup,
  deleteEmailSetup,
}: EmailTabProps) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editData, setEditData] = useState<EmailSetup | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [imapModalOpen, setImapModalOpen] = useState(false);
  const [newImapPass, setNewImapPass] = useState("");

  const openEditModal = (idx: number) => {
    setEditIdx(idx);
    setEditData({ ...emailSetups[idx] });
    setModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editIdx !== null && editData) {
      updateEmailSetup(editIdx, editData);
      setModalOpen(false);
      setEditIdx(null);
      setEditData(null);
    }
  };

  const handleSaveImapPass = () => {
    if (newImapPass.trim() && imapConfig?.user) {
      updateImapConfig(imapConfig.user, newImapPass);
      setImapModalOpen(false);
      setNewImapPass("");
    }
  };

  return (
    <div className="space-y-6">
      {/* IMAP Config */}
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
                <Button size="sm" variant="destructive" onClick={deleteImapConfig}>
                  Delete
                </Button>
              </div>
            </div>
          )}

          {/* Optional: History */}
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
                        <span className="text-green-600 font-semibold">Active</span>
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

      {/* Email Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Email Connector Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={addSetupToEmail} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input ref={aliasEmail} placeholder="Alias" />
              <Input ref={bankNameEmail} placeholder="Bank Name" />
              <Input ref={serviceTypeEmail} placeholder="Service Type" />
              <Input ref={bankEmailSender} placeholder="Email Sender" />
            </div>
            <Button type="submit" className="w-full">
              Add Email Setup
            </Button>
          </form>

          {emailSetups.length > 0 && (
            <div className="mt-4 space-y-2">
              {emailSetups.map((setup, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-blue-50 rounded border border-blue-200 flex justify-between items-center text-sm"
                >
                  <div>
                    <p className="font-medium">{setup.bank_name}</p>
                    <p className="text-xs text-gray-600">
                      From: {setup.bank_sender} • Type: {setup.service_type}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => openEditModal(idx)}>
                      Update
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteEmailSetup(idx)}
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

      {/* Edit Email Setup Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Email Setup</DialogTitle>
          </DialogHeader>
          {editData && (
            <div className="space-y-4">
              <Input
                value={editData.alias}
                onChange={(e) => setEditData({ ...editData, alias: e.target.value })}
                placeholder="Alias"
              />
              <Input
                value={editData.bank_name}
                onChange={(e) => setEditData({ ...editData, bank_name: e.target.value })}
                placeholder="Bank Name"
              />
              <Input
                value={editData.service_type}
                onChange={(e) =>
                  setEditData({ ...editData, service_type: e.target.value })
                }
                placeholder="Service Type"
              />
              <Input
                value={editData.bank_sender}
                onChange={(e) =>
                  setEditData({ ...editData, bank_sender: e.target.value })
                }
                placeholder="Email Sender"
              />
              <DialogFooter className="flex gap-2">
                <Button onClick={handleSaveEdit}>Save</Button>
                <Button variant="destructive" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* IMAP Password Modal */}
      <Dialog open={imapModalOpen} onOpenChange={setImapModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update IMAP Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="New Password"
              value={newImapPass}
              onChange={(e) => setNewImapPass(e.target.value)}
            />
            <DialogFooter className="flex gap-2">
              <Button onClick={handleSaveImapPass}>Save</Button>
              <Button variant="destructive" onClick={() => setImapModalOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
