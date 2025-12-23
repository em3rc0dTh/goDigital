"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type EmailSetup = {
  alias: string;
  bank_name: string;
  service_type: string;
  bank_sender: string;
};

type ImapConfig = {
  user: string;
};

export default function EmailsView() {
  const [setup, setSetup] = useState<any[]>([]);
  const [imap, setImap] = useState<any>(null);
  const [emailSetups, setEmailSetups] = useState<EmailSetup[]>([]);
  const [imapConfig, setImapConfig] = useState<ImapConfig | null>(null);

  const IMAP_BASE =
    process.env.NEXT_PUBLIC_IMAP_API_BASE || "/imap";

  // -----------------------------
  // CARGA SETUPS
  // -----------------------------
  const loadEmailSetups = async () => {
    const res = await fetch(`${IMAP_BASE}/email/setup`);
    const data = await res.json();
    setSetup(data);
  };

  // -----------------------------
  // CARGA IMAP CONFIG
  // -----------------------------
  const loadImapConfig = async () => {
    const res = await fetch(`${IMAP_BASE}/imap/config`);
    const data = await res.json();
    setImap(data);
  };

  // ---------------- Load on mount ----------------
  useEffect(() => {
    loadEmailSetups();
    loadImapConfig();
  }, []);

  return (
    <div className="space-y-10 w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold">Emails List</h2>
      <p className="text-sm text-muted-foreground">
        Display all your configured email setups for bank accounts.
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Email Setups</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Alias</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Sender</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {setup.map((s, i) => (
                <TableRow key={i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{s.alias}</TableCell>
                  <TableCell>{s.bank_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{s.service_type}</Badge>
                  </TableCell>
                  <TableCell>{s.bank_sender}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* IMAP */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">IMAP Config</CardTitle>
        </CardHeader>
        <CardContent>
          {imap ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Password</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{imap.user}</TableCell>
                  <TableCell>••••••••••</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No config found</p>
          )}
        </CardContent>
      </Card>
      {/* <Card>
        <CardHeader>
          <CardTitle>Email Setups</CardTitle>
        </CardHeader>
        <CardContent>
          {emailSetups.length === 0 ? (
            <p className="text-muted-foreground">No email setups found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Alias</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Sender</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {emailSetups.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{s.alias || "—"}</TableCell>
                    <TableCell>{s.bank_name}</TableCell>
                    <TableCell>{s.service_type}</TableCell>
                    <TableCell>{s.bank_sender}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card> */}

      {/* ---------------- IMAP CONFIG ---------------- */}
      {/* <Card>
        <CardHeader>
          <CardTitle>IMAP Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {!imapConfig ? (
            <p className="text-muted-foreground">No IMAP configuration found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IMAP User</TableHead>
                  <TableHead>Password</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                <TableRow>
                  <TableCell>{imapConfig.user}</TableCell>
                  <TableCell>••••••••••</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card> */}
    </div>
  );
}
