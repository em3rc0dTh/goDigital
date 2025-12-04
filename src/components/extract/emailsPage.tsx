"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, RefreshCw } from "lucide-react";

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
  // normalizar
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

  // ====== MONTO ======
  const monto = extract([
    /Monto(?: Total)?:?\s*S\/\s*([\d,.]+)/i,
    /Total del consumo:?\s*S\/\s*([\d,.]+)/i,
    /S\/\s*([\d,.]+)\s*(?:PEN)?/i,
  ]);
  const OPERACION_PATTERNS = [
    /n[°º]?\s*de\s*operación[:\s]*([0-9]+)/i, // "N° de operación 4498092"
    /numero\s*de\s*operacion[:\s]*([0-9]+)/i, // "Número de operación 11173152"
    /num\.?\s*operación[:\s]*([0-9]+)/i, // Variantes abreviadas
    /c[oó]digo\s*de\s*operaci[oó]n[:\s]*([0-9]+)/i, // "Código de operación 5469011"
    /operación[:\s]*([0-9]{4,10})/i, // Respaldo genérico → "operación 7383425"
  ];
  // ====== NÚMERO DE OPERACIÓN ======
  const nroOperacion = extract([
    /N(?:ú|u)mero de operación:?\s*(\d+)/i,
    /N° de operación:?\s*(\d+)/i,
    /Nº de operación:?\s*(\d+)/i,
    /Código de operación:?\s*(\d+)/i,
    /\bOperación[: ]+(\d{5,})/i,
    ...OPERACION_PATTERNS,
  ]);

  // ====== FECHA ======
  const fechaRaw = extract([
    /(\d{1,2}\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+\d{4}\s*-\s*\d{1,2}:\d{2}\s*(a\.?m\.?|p\.?m\.?))/i,
    /\bFecha(?: y hora)?:?\s*(.+)/i,
    /Datos de la operación\s*(.+)/i,
    /Fecha y hora\s*(.+)/i,
    /(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}\s*(AM|PM))/i,
    /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/,
  ]);

  const fecha = normalizarFecha(fechaRaw);
  // ====== YAPERO / REMITENTE ======
  const yapero = extract([
    /Hola[, ]+([A-Za-zÁÉÍÓÚÑáéíóúñ ]+)/i,
    /De: ([A-Za-zÁÉÍÓÚÑáéíóúñ ]+)/i,
    /Titular:?\s*([A-Za-zÁÉÍÓÚÑáéíóúñ ]+)/i,
  ]);

  // ====== ORIGEN ======
  const origen = extract([
    /Cuenta cargo:?\s*([\d ]+)/i,
    /Desde el número:?\s*(\d{6,})/i,
    /Tu número de celular:?\s*(\d{6,})/i,
    /Cuenta origen:?\s*([\d ]{6,})/i,
  ]);

  // ====== BENEFICIARIO (NOMBRE) ======
  const nombreBenef = extract([
    /Nombre del Beneficiario:?\s*(.+)/i,
    /Enviado a:?\s*(.+)/i,
    /Beneficiario:?\s*(.+)/i,
    /Para:?\s*([A-Za-zÁÉÍÓÚÑáéíóúñ ]+)/i,
  ]);

  // ====== BENEFICIARIO (CUENTA/CELULAR) ======
  const cuentaBenef = extract([
    /Cuenta destino:?\s*([\d ]+)/i,
    /Celular del Beneficiario:?\s*(\d{6,})/i,
    /Nro destino:?\s*(\d{6,})/i,
  ]);

  // ====== CELULAR BENEF ======
  const celularBenef = extract([
    /celular del beneficiario[:\s]*([x\d]{6,})/i,
    /celular[:\s]*([x\d]{6,})/i,
    /destinatario[:\s]*([x\d]{6,})/i,
    /cuenta destino[:\s]*([x\d]{6,})/i,
    /Nombre del Beneficiario:?\s*(.+)/i,
    /Enviado a:?\s*(.+)/i,
    /Beneficiario:?\s*(.+)/i,
    /Para:?\s*([A-Za-zÁÉÍÓÚÑáéíóúñ ]+)/i,
  ]);
  // --- MONEDA ---
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

function parseInterbankEmail(body: any) {
  const extract = (pattern: any) => {
    const m = body.match(pattern);
    return m && m[1] ? m[1].trim() : "-";
  };

  const monto = extract(/Monto Total:\s*S\/\s*([\d,.]+)/i);
  const yapero = extract(/Hola\s+([^\n,]+)/i); // Nombre del remitente
  const origen = extract(
    /Cuenta cargo:\s*Cuenta Simple Soles\s*([\d\s]+)/i
  ).replace(/\s+/g, "");
  const fecha = extract(/(\d{2}\s\w{3}\s\d{4}\s\d{2}:\d{2}\s[AP]M)/i);
  const nombreBenef = extract(/Cuenta destino:\s*([^\n]+)/i);
  const cuentaBenef = extract(/Cuenta destino:[^\n]+\n([\d\s]+)/i).replace(
    /\s+/g,
    ""
  );
  const nroOperacion = extract(/Código de operación:\s*(\d+)/i);
  const tipoOperacion = extract(/Tipo de operación:\s*([^\n]+)/i);
  const comision = extract(/Comisión:\s*S\/\s*([\d,.]+)/i);
  const monedaRaw = extract(/(S\/|USD|\$)\s*[\d,.]+/i);
  let tipo_moneda = "-";
  if (monedaRaw !== "-") tipo_moneda = monedaRaw.includes("S/") ? "PEN" : "USD";

  return {
    monto,
    yapero,
    origen,
    fecha,
    nombreBenef,
    cuentaBenef,
    nroOperacion,
    tipoOperacion,
    comision,
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
    /<strong>Monto de yapeo*\*<\/strong>[\s\S]*?<td.*?style="[^"]*font-size:50px[^"]*">([\d,.]+)<\/td>/,
    /Monto de Yapeo<\/td>\s*<td[^>]*>\s*S\/\s*([\d,.]+)/,
    /Total del consumo<\/td>.*?<b>S\/\s*([\d,.]+)<\/b>/,
    /Moneda y monto:<\/span><\/td>[\s\S]*?<span>S\/<\/span>\s*<span>([\d,.]+)<\/span>/,
    /Total del consumo<\/td>.*?<b>S\/\s*([\d,.]+)<\/b>/,
    /Moneda y monto:<\/span><\/td>[\s\S]*?<span>S\/<\/span>\s*<span>([\d,.]+)<\/span>/,
    /Total del consumo\s*S\/\s*([\d,.]+)/,
    /S\/\s*([\d,.]+)<\/b>/,
    /Moneda y monto:<\/span><\/td>[\s\S]*?<span>S\/<\/span>\s*<span>([\d,.]+)<\/span>/,
    /Monto Total:<\/span><\/td>[\s\S]*?<span>S\/<\/span>\s*<span>([\d,.]+)<\/span>/,
  ]);

  const yapero = extract([
    /Yapero\s*<\/td>\s*<td.*?>(.*?)<\/td>/,
    /Hola <b>(.*?)<\/b>/,
    /Cuenta destino:<\/span><\/td>[\s\S]*?<span>([^<]+)<\/span>/,
    /Hola\s*<span>([^<]+)<\/span>/,
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
    /Nombre del Beneficiario\s*<\/td>\s*<td.*?>(.*?)<\/td>/,
    /Empresa<\/td>[\s\S]*?<b>(.*?)<\/b>/,
    /Cuenta destino:<\/span><\/td>[\s\S]*?<span>(.*?)<\/span>/,
    /Nombre del Beneficiario\s*<\/td>\s*<td.*?>(.*?)<\/td>/,
    /Empresa<\/td>[\s\S]*?<b>(.*?)<\/b>/,
    /Cuenta destino:<\/span><\/td>[\s\S]*?<span>([^<]+)<\/span>/,
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

export default function EmailsPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  const loadEmails = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:8000/emails");
      const data = await res.json();

      const normalized = data.map((mail: any) => {
        let dataParsed;

        if (mail.body) dataParsed = parseEmailBody(mail.body);
        else if (mail.text_body) dataParsed = parseEmailText(mail.text_body);
        else dataParsed = {};

        return { ...mail, parsed: dataParsed };
      });

      setEmails(normalized);
    } catch {
      setEmails([]);
      setStatus("❌ Error loading emails");
    } finally {
      setIsLoading(false);
    }
  };

  const runIngest = async () => {
    setStatus("⏳ Processing emails...");
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/ingest");
      const data = await res.json();
      setStatus(`✅ Processed: ${data.count} emails`);
      await loadEmails();
    } catch {
      setStatus("❌ Error connecting to server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, []);

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
        <Button onClick={runIngest} disabled={isLoading}>
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          {isLoading ? "Processing..." : "Ingest IMAP"}
        </Button>
      </div>

      {/* STATUS */}
      {status && (
        <div
          className={`p-4 rounded text-sm ${
            status.includes("✅")
              ? "bg-green-100 text-green-800"
              : status.includes("⏳")
                ? "bg-blue-100 text-blue-800"
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
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-2 text-sm font-medium truncate">
                          {fromName}
                        </td>
                        <td className="px-4 py-2 text-xs font-mono">
                          {email.parsed.nroOperacion.slice(-6)}
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
                className="text-xl font-bold"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">From</p>
                  <p className="font-semibold">{selectedEmail.from}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Operation #</p>
                  <p className="font-mono text-sm">
                    {selectedEmail.parsed.nroOperacion}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Beneficiary</p>
                  <p className="font-semibold">
                    {selectedEmail.parsed.nombreBenef}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Account/Phone</p>
                  <p className="font-semibold">
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
                  <p className="font-semibold">{selectedEmail.parsed.origen}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-semibold">{selectedEmail.parsed.yapero}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
