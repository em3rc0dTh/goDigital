"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Mail, RefreshCw } from "lucide-react";
import Cookies from "js-cookie";
import { format } from 'date-fns';
import { createPortal } from "react-dom";
// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

function normalizarFecha(raw: any) {
  if (!raw || raw === "-") return "-";

  const meses: any = {
    enero: "01", febrero: "02", marzo: "03", abril: "04",
    mayo: "05", junio: "06", julio: "07", agosto: "08",
    septiembre: "09", setiembre: "09", octubre: "10",
    noviembre: "11", diciembre: "12",
  };

  let f = raw
    .toLowerCase()
    .replace(/\*/g, "")
    .replace(/de la operación/gi, "")
    .replace(/fecha y hora:?/gi, "")
    .replace(/fecha:?/gi, "")
    .replace(/datos de la operación/gi, "")
    .trim();

  f = f.replace(/\s*p\.?\s*m\.?/g, " pm");
  f = f.replace(/\s*a\.?\s*m\.?/g, " am");

  let m1 = f.match(
    /(\d{1,2})\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(\d{4})\s*[-–]?\s*(\d{1,2}):(\d{2})\s*(am|pm)/
  );

  if (m1) {
    let [_, d, mesTxt, y, hh, mm, ampm] = m1;
    let mes = meses[mesTxt];
    let h = parseInt(hh);

    if (ampm === "pm" && h < 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;

    return `${y}-${mes}-${d.padStart(2, "0")} ${String(h).padStart(2, "0")}:${mm}:00`;
  }

  let m2 = f.match(
    /(\d{1,2})\/(\d{1,2})\/(\d{4})\s*[-–]?\s*(\d{1,2}):(\d{2})\s*(am|pm)/
  );

  if (m2) {
    let [_, d, m, y, hh, mm, ampm] = m2;
    let h = parseInt(hh);

    if (ampm === "pm" && h < 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;

    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")} ${String(h).padStart(2, "0")}:${mm}:00`;
  }

  let m3 = f.match(/(\d{4})-(\d{2})-(\d{2})\s*(\d{2}):(\d{2})/);
  if (m3) {
    let [_, y, m, d, hh, mm] = m3;
    return `${y}-${m}-${d} ${hh}:${mm}:00`;
  }

  return raw;
}

function parseEmailText(body: any) {
  body = body
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .trim();

  const extract = (patterns: any) => {
    for (let p of patterns) {
      const m = body.match(p);
      if (m && m[1]) return m[1].trim();
    }
    return "-";
  };

  const monto = extract([
    /Monto(?: Total)?:?\s*S\/\s*([\d,.]+)/i,
    /Total del consumo:?\s*S\/\s*([\d,.]+)/i,
    /S\/\s*([\d,.]+)\s*(?:PEN)?/i,
  ]);

  const OPERACION_PATTERNS = [
    /n[°º]?\s*de\s*operación[:\s]*([0-9]+)/i,
    /numero\s*de\s*operacion[:\s]*([0-9]+)/i,
    /num\.?\s*operación[:\s]*([0-9]+)/i,
    /c[oó]digo\s*de\s*operaci[oó]n[:\s]*([0-9]+)/i,
    /operación[:\s]*([0-9]{4,10})/i,
  ];

  const nroOperacion = extract([
    /N(?:ú|u)mero de operación:?\s*(\d+)/i,
    /N° de operación:?\s*(\d+)/i,
    /Nº de operación:?\s*(\d+)/i,
    /Código de operación:?\s*(\d+)/i,
    /\bOperación[: ]+(\d{5,})/i,
    ...OPERACION_PATTERNS,
  ]);

  const fechaRaw = extract([
    /(\d{1,2}\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+\d{4}\s*-\s*\d{1,2}:\d{2}\s*(a\.?m\.?|p\.?m\.?))/i,
    /\bFecha(?: y hora)?:?\s*(.+)/i,
    /Datos de la operación\s*(.+)/i,
    /Fecha y hora\s*(.+)/i,
    /(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}\s*(AM|PM))/i,
    /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/,
  ]);

  const fecha = normalizarFecha(fechaRaw);

  const yapero = extract([
    /Hola[, ]+([A-Za-zÁÉÍÓÚÑáéíóúñ ]+)/i,
    /De: ([A-Za-zÁÉÍÓÚÑáéíóúñ ]+)/i,
    /Titular:?\s*([A-Za-zÁÉÍÓÚÑáéíóúñ ]+)/i,
  ]);

  const origen = extract([
    /Cuenta cargo:?\s*([\d ]+)/i,
    /Desde el número:?\s*(\d{6,})/i,
    /Tu número de celular:?\s*(\d{6,})/i,
    /Cuenta origen:?\s*([\d ]{6,})/i,
  ]);

  const nombreBenef = extract([
    /Nombre del Beneficiario:?\s*(.+)/i,
    /Enviado a:?\s*(.+)/i,
    /Beneficiario:?\s*(.+)/i,
    /Para:?\s*([A-Za-zÁÉÍÓÚÑáéíóúñ ]+)/i,
  ]);

  const cuentaBenef = extract([
    /Cuenta destino:?\s*([\d ]+)/i,
    /Celular del Beneficiario:?\s*(\d{6,})/i,
    /Nro destino:?\s*(\d{6,})/i,
  ]);

  const celularBenef = extract([
    /celular del beneficiario[:\s]*([x\d]{6,})/i,
    /celular[:\s]*([x\d]{6,})/i,
    /destinatario[:\s]*([x\d]{6,})/i,
    /cuenta destino[:\s]*([x\d]{6,})/i,
  ]);

  const monedaRaw = extract([
    /(S\/)\s*[\d,.]+/i,
    /(USD)\s*[\d,.]+/i,
    /(\$)\s*[\d,.]+/i,
  ]);

  let tipo_moneda = "-";
  if (monedaRaw !== "-") {
    if (monedaRaw.includes("S/")) tipo_moneda = "PEN";
    else tipo_moneda = "USD";
  }

  return {
    monto, yapero, origen, fecha, nombreBenef,
    cuentaBenef, nroOperacion, celularBenef, tipo_moneda,
  };
}

function parseEmailBody(body: any) {
  const extract = (patterns: any) => {
    for (let p of patterns) {
      const m = body.match(p);
      if (m && m[1]) return m[1].trim();
    }
    return "-";
  };

  const monedaRaw = extract([
    /(S\/)\s*[\d,.]+/,
    /(USD)\s*[\d,.]+/,
    /(\$)\s*[\d,.]+/,
  ]);

  let tipo_moneda = "-";
  if (monedaRaw !== "-") {
    if (monedaRaw.includes("S/")) tipo_moneda = "PEN";
    else tipo_moneda = "USD";
  }

  const monto = extract([
    /<td[^>]*class="soles-amount"[^>]*>\s*([\d.]+)\s*<\/td>/,
    /<strong>Monto de yapeo\*<\/strong>[\s\S]*?<td.*?style="[^"]*font-size:50px[^"]*">([\d,.]+)<\/td>/,
    /Monto de Yapeo<\/td>\s*<td[^>]*>\s*S\/\s*([\d,.]+)/,
    /Total del consumo<\/td>.*?<b>S\/\s*([\d,.]+)<\/b>/,
    /Moneda y monto:<\/span><\/td>[\s\S]*?<span>S\/<\/span>\s*<span>([\d,.]+)<\/span>/,
    /Monto Total:<\/span><\/td>[\s\S]*?<span>S\/<\/span>\s*<span>([\d,.]+)<\/span>/,
  ]);

  const yapero = extract([
    /Yapero\s*<\/td>\s*<td.*?>(.*?)<\/td>/,
    /Hola <b>(.*?)<\/b>/,
    /Hola\s*<span>([^<]+)<\/span>/,
    /Cuenta destino:<\/span><\/td>[\s\S]*?<span>([^<]+)<\/span>/,
  ]);

  const origen = extract([
    /Tu número de celular\s*<\/td>\s*<td.*?>(.*?)<\/td>/,
    /Número de Tarjeta de Crédito<\/td>[\s\S]*?<b>(.*?)<\/b>/,
    /Cuenta cargo:<\/span><\/td>[\s\S]*?<span>.*?<\/span><br clear="none"><span>(.*?)<\/span>/,
    /Cuenta cargo:<\/span><\/td>[\s\S]*?<span>(?:Cuenta Simple|Cuenta Corriente|Cuenta Interbank)<\/span> <span>Soles<\/span><br clear="none"><span>([\d\s]+)<\/span>/,
  ]);

  const fechaRaw = extract([
    /Fecha y Hora de la operación\s*<\/td>\s*<td.*?>(.*?)<\/td>/i,
    /Fecha y hora<\/td>[\s\S]*?<b><a.*?>(.*?)<\/a><\/b>/i,
    /Date:<\/td>[\s\S]*?<b><a.*?>(.*?)<\/a><\/b>/i,
    /Fecha y hora\s*[:\-]?\s*([\d]{1,2}.*?\d{4}\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM))/i,
  ]);

  const fechaFinal = () => {
    const f = normalizarFecha(fechaRaw || "");
    if (!f || f.trim() === "" || f.includes("@")) return "-";
    return f;
  };
  const fecha = fechaFinal();

  const nombreBenef = extract([
    /Nombre del Beneficiario\s*<\/td>\s*<td.*?>(.*?)<\/td>/,
    /Empresa<\/td>[\s\S]*?<b>(.*?)<\/b>/,
    /Cuenta destino:<\/span><\/td>[\s\S]*?<span>([^<]+)<\/span>/,
  ]);

  const cuentaBenef = extract([
    /Celular del Beneficiario\s*<\/td>\s*<td.*?>(.*?)<\/td>/,
    /Cuenta destino:<\/span><\/td>[\s\S]*?<span>.*?<\/span><br clear="none"><span>(.*?)<\/span>/,
  ]);

  const nroOperacionRaw = extract([
    /Nº de operación\s*<\/td>\s*<td.*?>(.*?)<\/td>/,
    /Número de operación<\/td>[\s\S]*?<b><a.*?>(.*?)<\/a><\/b>/,
    /Código de operación:<\/span><\/td>[\s\S]*?<span>([\d]+)<\/span>/,
    /Código de operación:\s+(\d+)/,
    /N° de operación<\/td>[\s\S]*?<td[^>]*>\s*([\d]+)\s*<\/td>/,
  ]);
  const nroOperacion = nroOperacionRaw.includes("@") ? "-" : nroOperacionRaw;

  const celularBenef = extract([
    /Celular del Beneficiario\s*<\/td>\s*<td.*?>(.*?)<\/td>/,
    /Cuenta destino:<\/span><\/td>[\s\S]*?<span>(?:.*?)<\/span><br clear="none"><span>(.*?)<\/span>/,
  ]);

  return {
    monto, yapero, origen, fecha, nombreBenef,
    cuentaBenef, nroOperacion, celularBenef, tipo_moneda,
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

interface EmailsPageProps {
  activeDatabase: string;
}

export default function EmailsPage({ activeDatabase }: EmailsPageProps) {
  const [emails, setEmails] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [forwardingConfig, setForwardingConfig] = useState<any>(null);
  const [tenantDbName, setTenantDbName] = useState<string>("");
  const [tenantDetailId, setTenantDetailId] = useState<string>("");
  const [showSourceColumn, setShowSourceColumn] = useState(false);
  const [selectedHtml, setSelectedHtml] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);


  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";
  const IMAP_BASE =
    process.env.NEXT_PUBLIC_IMAP_API_BASE || "/imap";
  useEffect(() => {
    loadTenantInfo();
  }, []);

  useEffect(() => {
    if (tenantDbName && tenantDetailId) {
      loadEmails();
    }
  }, [activeDatabase, tenantDbName, tenantDetailId]);

  async function loadTenantInfo() {
    try {
      const token = Cookies.get("session_token");
      const tenantId = Cookies.get("tenantId");
      const detailId = Cookies.get("tenantDetailId");

      if (!tenantId || !detailId) {
        console.error("Missing tenantId or tenantDetailId in cookies");
        setStatus("❌ Missing tenant information");
        return;
      }

      setTenantDetailId(detailId);

      const res = await fetch(
        `${API_BASE}/tenants/details/${tenantId}`,
        {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to load tenant details");
      }

      const data = await res.json();
      const activeDetail = data.details.find(
        (d: any) => d.detailId === detailId
      );

      if (activeDetail?.dbName) {
        setTenantDbName(activeDetail.dbName);
        console.log("✅ Loaded tenant info:", {
          dbName: activeDetail.dbName,
          detailId: detailId
        });
      } else {
        console.error("No dbName found for active tenant detail");
        setStatus("❌ Could not load database name");
      }
    } catch (error) {
      console.error("Error loading tenant info:", error);
      setStatus("❌ Error loading tenant information");
    }
  }

  const loadEmails = async () => {
    if (!tenantDbName || !tenantDetailId) {
      console.warn("Missing tenant info, skipping email load");
      setStatus("⚠️ Tenant information not loaded yet");
      return;
    }

    try {
      setIsLoading(true);
      setStatus("⏳ Loading emails from both sources...");

      // 🔥 Cargar emails de IMAP (puerto 8000)
      let imapEmails: any[] = [];
      try {
        const imapRes = await fetch(`${IMAP_BASE}/emails`, {
          headers: {
            "X-Database-Name": tenantDbName,
          },
        });

        if (imapRes.ok) {
          imapEmails = await imapRes.json();
          console.log(`✅ Loaded ${imapEmails.length} emails from IMAP`);
        } else {
          console.warn("IMAP endpoint failed, continuing with Gmail only");
        }
      } catch (imapError) {
        console.warn("IMAP fetch error:", imapError);
      }

      // 🔥 Cargar emails de Gmail (puerto 4000)
      let gmailEmails: any[] = [];
      try {
        const gmailRes = await fetch(
          `${API_BASE}/gmail/emails-list/${tenantDetailId}`
        );

        if (gmailRes.ok) {
          const gmailData = await gmailRes.json();
          gmailEmails = gmailData.emails || [];
          console.log(`✅ Loaded ${gmailEmails.length} emails from Gmail`);
        } else {
          console.warn("Gmail endpoint failed");
        }
      } catch (gmailError) {
        console.warn("Gmail fetch error:", gmailError);
      }

      // 🔥 Combinar emails
      const allEmails = [...imapEmails, ...gmailEmails];

      // 🔥 Decidir si mostrar columna "Source"
      const hasImapData = imapEmails.length > 0;
      const hasGmailData = gmailEmails.length > 0;
      setShowSourceColumn(hasImapData && hasGmailData);

      // 🔥 Parsear emails
      const normalized = allEmails.map((mail: any) => {
        let dataParsed;

        if (mail.body) dataParsed = parseEmailBody(mail.body);
        else if (mail.text_body) dataParsed = parseEmailText(mail.text_body);
        else dataParsed = {};

        return { ...mail, parsed: dataParsed };
      });

      // 🔥 Ordenar por fecha (más reciente primero)
      normalized.sort((a, b) => {
        const dateA = new Date(a.date || a.receivedAt || 0);
        const dateB = new Date(b.date || b.receivedAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      setCurrentPage(1);

      setEmails(normalized);

      if (normalized.length === 0) {
        setStatus("ℹ️ No emails found in either source");
      } else {
        setStatus(
          `✅ Loaded ${normalized.length} emails (IMAP: ${imapEmails.length}, Gmail: ${gmailEmails.length})`
        );
      }
    } catch (error) {
      console.error("Error loading emails:", error);
      setEmails([]);
      setStatus("❌ Error loading emails");
    } finally {
      setIsLoading(false);
    }
  };

  const runIngest = async () => {
    if (!tenantDbName) {
      setStatus("❌ Database name not loaded");
      return;
    }

    setStatus("⏳ Processing emails from IMAP...");
    setIsLoading(true);

    try {
      const res = await fetch(`${IMAP_BASE}/ingest?limit=50`, {
        headers: {
          "X-Database-Name": tenantDbName,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setStatus(`✅ IMAP processed: ${data.summary?.processed || 0} emails`);
      await loadEmails();
    } catch (error) {
      console.error("Error running IMAP ingest:", error);
      setStatus("❌ Error connecting to IMAP server");
    } finally {
      setIsLoading(false);
    }
  };

  const loadForwardingConfig = async () => {
    try {
      if (!tenantDetailId) throw new Error("tenantDetailId not found");

      const res = await fetch(`${API_BASE}/gmail/${tenantDetailId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setForwardingConfig(data.config);
      return data.config;
    } catch (err) {
      console.error("Error loading forwarding config:", err);
      setStatus("❌ Error loading forwarding config");
      return null;
    }
  };

  const runIngestGmail = async () => {
    if (!tenantDetailId) {
      setStatus("❌ Tenant detail ID not loaded");
      return;
    }

    setStatus("⏳ Processing emails from Gmail API...");
    setIsLoading(true);

    try {
      const config = forwardingConfig ?? await loadForwardingConfig();

      if (!config?.id) {
        throw new Error("Forwarding config ID not available");
      }

      const res = await fetch(`${API_BASE}/gmail/fetch-emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idFetching: config.id,
          routing: {
            entityId: config.entityId,
            account: config.forwardingData[0].accounts[0],
          },
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setStatus(`✅ Gmail processed: ${data.count || 0} emails`);
      await loadEmails();
    } catch (error) {
      console.error("Error running Gmail ingest:", error);
      setStatus("❌ Error connecting to Gmail API");
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(emails.length / pageSize);

  const paginatedEmails = emails.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="w-full space-y-6 pb-10">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold">Email Capture</h1>
          <p className="text-muted-foreground">
            Bank transaction emails from IMAP and Gmail API
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runIngest} disabled={isLoading || !tenantDbName}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Processing..." : "Ingest IMAP"}
          </Button>

          <Button onClick={runIngestGmail} disabled={isLoading || !tenantDetailId}>
            <Mail
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Processing..." : "Ingest Gmail"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* IZQUIERDA */}
          <CardTitle className="flex items-center gap-2">
            Emails
            <span className="text-muted-foreground text-sm">
              ({emails.length})
            </span>
          </CardTitle>

          {/* DERECHA */}
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            {/* STATUS */}
            {status && (
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap
          ${status.includes("✅")
                    ? "bg-green-50 text-green-700"
                    : status.includes("⏳")
                      ? "bg-blue-50 text-blue-700"
                      : status.includes("⚠️")
                        ? "bg-yellow-50 text-yellow-700"
                        : "bg-red-50 text-red-700"
                  }`}
              >
                {status.replace(/[✅⏳⚠️❌]/g, "").trim()}
              </span>
            )}

            {/* SELECTOR FILAS */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Rows:</span>
              {[15, 30, 50].map(size => (
                <Button
                  key={size}
                  size="sm"
                  variant={pageSize === size ? "default" : "outline"}
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>



        <CardContent>
          {emails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No emails found. Use the ingest buttons above to load emails.</p>
              {(!tenantDbName || !tenantDetailId) && (
                <p className="text-xs text-red-500 mt-2">
                  ⚠️ Tenant information not loaded. Please refresh the page.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    {showSourceColumn && (
                      <th className="px-4 py-2 text-left">Source</th>
                    )}
                    <th className="px-4 py-2 text-left">From</th>
                    <th className="px-4 py-2 text-left">Operation</th>
                    <th className="px-4 py-2 text-left">Beneficiary</th>
                    {/* <th className="px-4 py-2 text-left">Subject</th> */}
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-center">Currency</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    {/* <th className="px-4 py-2 text-center">Actions</th> */}
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmails.map((email, idx) => {
                    const globalIndex = (currentPage - 1) * pageSize + idx;

                    const fromName = email.from?.split(" ")[0] || "Unknown";
                    const emailDate = email.date || email.receivedAt;
                    return (
                      <tr key={email._id || idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-500">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 m-0"
                            onClick={() => setSelectedHtml(email.html_body)}
                          >
                            {globalIndex + 1}
                          </Button>
                        </td>

                        {showSourceColumn && (
                          <td className="px-4 py-2">
                            <Badge
                              variant={email.source === "gmail" ? "default" : "secondary"}
                            >
                              {email.source?.toUpperCase() || "UNKNOWN"}
                            </Badge>
                          </td>
                        )}
                        <td className="px-4 py-2 text-sm font-medium truncate">
                          {fromName.length > 10 ? fromName.slice(0, 10) + "..." : fromName}
                        </td>
                        <td className="px-4 py-2 text-xs font-mono">
                          {email.transactionVariables?.operationNumber ? email.transactionVariables.operationNumber
                            : email.parsed.nroOperacion}
                        </td>
                        <td className="px-4 py-2 text-sm truncate max-w-xs">
                          {email.transactionVariables?.destinationAccount ? email.transactionVariables.destinationAccount : (email.parsed.nombreBenef.slice(0, 15))}
                        </td>
                        {/* <td className="px-4 py-2 text-sm truncate max-w-sm">
                          {email.subject}
                        </td> */}
                        <td className="px-4 py-2 text-xs text-gray-600 whitespace-nowrap">
                          {email.transactionVariables?.operationDate
                            ? format(
                              new Date(email.transactionVariables.operationDate),
                              "dd/MM/yyyy HH:mm"
                            )
                            : format(new Date(emailDate), "dd/MM/yyyy HH:mm")}
                        </td>

                        <td className="px-4 py-2 text-center">
                          <Badge variant="outline" className="text-xs">
                            {email.transactionVariables?.currency ? email.transactionVariables.currency : email.parsed.tipo_moneda}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {email.transactionVariables?.amount != null
                            ? Number(email.transactionVariables.amount).toFixed(2)
                            : email.parsed?.monto}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex justify-center items-center gap-1 mt-4 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  ‹
                </Button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  const isActive = page === currentPage;

                  // mostrar solo páginas cercanas
                  if (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 2
                  ) {
                    return (
                      <Button
                        key={page}
                        size="sm"
                        variant={isActive ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  }

                  // puntos suspensivos
                  if (
                    page === currentPage - 3 ||
                    page === currentPage + 3
                  ) {
                    return <span key={page} className="px-2 text-gray-400">…</span>;
                  }

                  return null;
                })}

                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  ›
                </Button>
              </div>


            </div>
          )}
        </CardContent>
      </Card>
      {selectedHtml &&
        createPortal(
          <div className="fixed top-0 left-0 w-screen h-screen z-[9999] bg-black/50 flex items-center justify-center">
            <div className="bg-white w-[90%] max-w-4xl max-h-[90vh] overflow-auto rounded-lg p-4">

              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-sm">Contenido del correo</h2>
                <Button size="sm" variant="ghost" onClick={() => setSelectedHtml(null)}>
                  Cerrar
                </Button>
              </div>

              <div
                className="border p-3 text-sm"
                dangerouslySetInnerHTML={{ __html: selectedHtml }}
              />
            </div>
          </div>,
          document.body
        )
      }

      {/* EMAIL DETAILS MODAL */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{selectedEmail.subject}</CardTitle>
              <button
                onClick={() => setSelectedEmail(null)}
                className="text-xl font-bold hover:bg-gray-100 px-3 py-1 rounded"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Source</p>
                  <Badge
                    variant={selectedEmail.source === "gmail" ? "default" : "secondary"}
                  >
                    {selectedEmail.source?.toUpperCase() || "UNKNOWN"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">From</p>
                  <p className="font-semibold text-sm">{selectedEmail.from}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Operation #</p>
                  <p className="font-mono text-sm">
                    {selectedEmail.parsed.nroOperacion}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Beneficiary</p>
                  <p className="font-semibold text-sm">
                    {selectedEmail.parsed.nombreBenef}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Account/Phone</p>
                  <p className="font-semibold text-sm">
                    {selectedEmail.parsed.cuentaBenef}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date & Time</p>
                  <p className="font-mono text-sm">
                    {selectedEmail.parsed.fecha}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-lg font-bold">
                    {selectedEmail.parsed.tipo_moneda}{" "}
                    {selectedEmail.parsed.monto}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">From Account</p>
                  <p className="font-semibold text-sm">
                    {selectedEmail.parsed.origen}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-semibold text-sm">
                    {selectedEmail.parsed.yapero}
                  </p>
                </div>
              </div>

              {/* Debug info */}
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Raw Email Data
                </summary>
                <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto max-h-40 text-xs">
                  {JSON.stringify(selectedEmail, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}