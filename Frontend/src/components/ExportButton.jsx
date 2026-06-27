import { useState, useRef, useEffect, useCallback } from "react";
import {
  RiShareLine,
  RiArrowDownSLine,
  RiFilePdfLine,
  RiFileExcel2Line,
} from "react-icons/ri";

// ── Dropdown item ────────────────────────────────────────────────────────────
function DropItem({ icon, label, disabled, onClick }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "11px 16px",
        background: "transparent",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.38 : 1,
        fontFamily: "'Hanken Grotesk', sans-serif",
        fontWeight: 500,
        fontSize: 13,
        color: "#16233C",
        textAlign: "left",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "#F5F7FC"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ExportButton({
  filename = "export",
  label = "Export",
  disabled = false,
  style = {},
  // PDF
  pdfRef = null,
  pdfOrientation = "portrait",
  // CSV / Excel
  data = null,
  columns = null,
}) {
  const [open, setOpen]         = useState(false);
  const [exporting, setExporting] = useState(null); // "pdf" | "csv" | "xlsx" | null
  const wrapRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasPdf  = !!pdfRef;
  const hasData = !!(data && columns && data.length > 0);

  // ── PDF export ─────────────────────────────────────────────────────────────
  const exportPdf = useCallback(async () => {
    if (!pdfRef?.current) return;
    setOpen(false);
    setExporting("pdf");
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#F3F5FA",
        logging: false,
      });

      const isLandscape = pdfOrientation === "landscape";
      const pageW = isLandscape ? 297 : 210;  // A4 mm
      const pageH = isLandscape ? 210 : 297;
      const imgH  = (canvas.height * pageW) / canvas.width;

      const pdf = new jsPDF({ orientation: pdfOrientation, unit: "mm", format: "a4" });

      let yOffset = 0;
      while (yOffset < imgH) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(
          canvas.toDataURL("image/jpeg", 0.95),
          "JPEG",
          0, -yOffset,
          pageW, imgH,
        );
        yOffset += pageH;
      }

      pdf.save(`${filename}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("[ExportButton] PDF export failed:", err);
      // Graceful fallback to browser print dialog
      window.print();
    } finally {
      setExporting(null);
    }
  }, [pdfRef, pdfOrientation, filename]);

  // ── Excel export ───────────────────────────────────────────────────────────
  const exportXlsx = useCallback(async () => {
    if (!data || !columns) return;
    setOpen(false);
    setExporting("xlsx");
    try {
      const XLSX = await import("xlsx");

      // Build sheet: first row = headers, rest = data
      const wsData = [
        columns.map((c) => c.label),
        ...data.map((row) => columns.map((c) => row[c.key] ?? "")),
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Auto-width: set each column width to the max content length
      const colWidths = columns.map((c, i) => {
        const maxLen = Math.max(
          c.label.length,
          ...data.map((row) => String(row[c.key] ?? "").length),
        );
        return { wch: Math.min(maxLen + 2, 50) };
      });
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");
      XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("[ExportButton] Excel export failed (xlsx package missing?).", err);
    } finally {
      setExporting(null);
    }
  }, [data, columns, filename]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const isDisabled  = disabled || exporting !== null;
  const buttonLabel = exporting ? "Exporting…" : label;

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-flex", ...style }}>
      {/* Trigger button */}
      <button
        onClick={() => { if (!isDisabled) setOpen((v) => !v); }}
        disabled={isDisabled}
        style={{
          height: 44,
          background: isDisabled ? "#F3F5FA" : "#fff",
          border: `1px solid ${open ? "#2B5BD7" : "#E1E6F0"}`,
          borderRadius: 13,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 15px",
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: isDisabled ? 0.7 : 1,
          outline: "none",
          fontFamily: "'Hanken Grotesk', sans-serif",
          fontWeight: 600,
          fontSize: 14,
          color: "#16233C",
          whiteSpace: "nowrap",
          transition: "border-color .15s",
        }}
      >
        <RiShareLine style={{ fontSize: 18, color: "#5A6678", flexShrink: 0 }} />
        <span>{buttonLabel}</span>
        <RiArrowDownSLine
          style={{
            fontSize: 17,
            color: "#9AA3B5",
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .2s",
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: 50,
            right: 0,
            zIndex: 300,
            background: "#fff",
            border: "1px solid #E1E6F0",
            borderRadius: 14,
            boxShadow: "0 8px 28px rgba(20,35,60,.13)",
            minWidth: 180,
            overflow: "hidden",
          }}
        >
          <DropItem
            icon={<RiFilePdfLine style={{ fontSize: 18, color: "#C8453A" }} />}
            label="Export as PDF"
            disabled={!hasPdf}
            onClick={exportPdf}
          />
          <div style={{ height: 1, background: "#F0F2F7", margin: "0 12px" }} />
          <DropItem
            icon={<RiFileExcel2Line style={{ fontSize: 18, color: "#1E7A50" }} />}
            label="Export as Excel"
            disabled={!hasData}
            onClick={exportXlsx}
          />
        </div>
      )}
    </div>
  );
}
