"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, RefreshCw } from "lucide-react";
import Cookies from "js-cookie";

// ============================================================================
// PARSING FUNCTIONS (sin cambios)
// ============================================================================

function normalizarFecha(raw: any) {
  if (!raw || raw === "-") return "-";

  const meses: any = {
    enero: "01",
    febrero: "02",
    marzo: "03",
    abril: "04",
    mayo: "05",
    junio: "06",
    julio: "07",
    agosto: "08",
    septiembre: "09",
    setiembre: "09",
    octubre: "10",
    noviembre: "11",
    diciembre: "12",
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
    monto,
    yapero,
    origen,
    fecha,
    nombreBenef,
    cuentaBenef,
    nroOperacion,
    celularBenef,
    tipo_moneda,
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
    monto,
    yapero,
    origen,
    fecha,
    nombreBenef,
    cuentaBenef,
    nroOperacion,
    celularBenef,
    tipo_moneda,
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

  // 🆕 Estado para tenant DB name
  const [tenantDbName, setTenantDbName] = useState<string>("");

  // 🆕 Cargar dbName del tenant activo
  useEffect(() => {
    loadTenantDbName();
  }, []);

  useEffect(() => {
    if (tenantDbName) {
      loadEmails();
    }
  }, [activeDatabase, tenantDbName]);

  async function loadTenantDbName() {
    try {
      const token = Cookies.get("session_token");
      const tenantId = Cookies.get("tenantId");
      const tenantDetailId = Cookies.get("tenantDetailId");

      if (!tenantId || !tenantDetailId) {
        console.error("Missing tenantId or tenantDetailId in cookies");
        setStatus("❌ Missing tenant information");
        return;
      }

      const res = await fetch(
        `http://localhost:4000/api/tenants/details/${tenantId}`,
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

      // Buscar el detail activo
      const activeDetail = data.details.find(
        (d: any) => d.detailId === tenantDetailId
      );

      if (activeDetail?.dbName) {
        setTenantDbName(activeDetail.dbName);
        console.log("✅ Loaded tenant DB name for emails:", activeDetail.dbName);
      } else {
        console.error("No dbName found for active tenant detail");
        setStatus("❌ Could not load database name");
      }
    } catch (error) {
      console.error("Error loading tenant DB name:", error);
      setStatus("❌ Error loading tenant information");
    }
  }

  const loadEmails = async () => {
    if (!tenantDbName) {
      console.warn("No tenantDbName available, skipping email load");
      setStatus("⚠️ Database name not loaded yet");
      return;
    }

    try {
      setIsLoading(true);
      setStatus("⏳ Loading emails...");

      const res = await fetch("http://localhost:8000/emails", {
        headers: {
          "X-Database-Name": tenantDbName,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      const normalized = data.map((mail: any) => {
        let dataParsed;

        if (mail.body) dataParsed = parseEmailBody(mail.body);
        else if (mail.text_body) dataParsed = parseEmailText(mail.text_body);
        else dataParsed = {};

        return { ...mail, parsed: dataParsed };
      });

      setEmails(normalized);
      setStatus(normalized.length > 0 ? "" : "ℹ️ No emails found");
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
      const res = await fetch("http://localhost:8000/ingest?limit=50", {
        headers: {
          "X-Database-Name": tenantDbName,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setStatus(`✅ Processed: ${data.count} emails`);

      // Recargar emails después de ingest
      await loadEmails();
    } catch (error) {
      console.error("Error running ingest:", error);
      setStatus("❌ Error connecting to server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-10">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold">Emails</h1>
          <p className="text-muted-foreground">
            Parsed bank transaction emails from IMAP
          </p>
        </div>
        <Button onClick={runIngest} disabled={isLoading || !tenantDbName}>
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          {isLoading ? "Processing..." : "Ingest IMAP"}
        </Button>
      </div>

      {/* STATUS */}
      {status && (
        <div
          className={`p-4 rounded text-sm ${status.includes("✅")
            ? "bg-green-100 text-green-800"
            : status.includes("⏳")
              ? "bg-blue-100 text-blue-800"
              : status.includes("⚠️")
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
        >
          {status}
        </div>
      )}

      {/* EMAILS TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Processed Emails ({emails.length})</CardTitle>
        </CardHeader>

        <CardContent>
          {emails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No emails found. Click "Ingest IMAP" to load emails.</p>
              {!tenantDbName && (
                <p className="text-xs text-red-500 mt-2">
                  ⚠️ Database name not loaded. Please refresh the page.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">From</th>
                    <th className="px-4 py-2 text-left">Operation</th>
                    <th className="px-4 py-2 text-left">Beneficiary</th>
                    <th className="px-4 py-2 text-left">Subject</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-center">Currency</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((email, idx) => {
                    const fromName = email.from?.split(" ")[0] || "Unknown";
                    return (
                      <tr key={email._id || idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-2 text-sm font-medium truncate">
                          {fromName}
                        </td>
                        <td className="px-4 py-2 text-xs font-mono">
                          {email.parsed.nroOperacion !== "-"
                            ? email.parsed.nroOperacion.slice(-6)
                            : "-"}
                        </td>
                        <td className="px-4 py-2 text-sm truncate max-w-xs">
                          {email.parsed.nombreBenef}
                        </td>
                        <td className="px-4 py-2 text-sm truncate max-w-sm">
                          {email.subject}
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-600 whitespace-nowrap">
                          {email.parsed.fecha}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Badge variant="outline" className="text-xs">
                            {email.parsed.tipo_moneda}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {email.parsed.monto}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => setSelectedEmail(email)}
                            className="hover:bg-gray-200 p-1 rounded transition"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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

              {/* Debug info (opcional) */}
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Raw Email Data
                </summary>
                <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto max-h-40 text-xs">
                  {JSON.stringify(selectedEmail.parsed, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}