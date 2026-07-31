"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { downloadAdminExport } from "@/lib/api/exports";

export function ExportDropdownButton({
  pdfPath,
  xlsxPath,
  filenameBase,
}: {
  pdfPath: string;
  xlsxPath: string;
  filenameBase: string;
}) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const runExport = async (kind: "pdf" | "xlsx") => {
    setOpen(false);
    setDownloading(true);
    try {
      await downloadAdminExport(
        kind === "pdf" ? pdfPath : xlsxPath,
        `${filenameBase}.${kind}`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export impossible.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative dropdown-toggle">
      <Button
        variant="outline"
        onClick={() => setOpen((o) => !o)}
        disabled={downloading}
      >
        {downloading ? "Export en cours…" : "Exporter"}
      </Button>
      <Dropdown isOpen={open} onClose={() => setOpen(false)}>
        <DropdownItem onClick={() => void runExport("pdf")}>
          Export PDF
        </DropdownItem>
        <DropdownItem onClick={() => void runExport("xlsx")}>
          Export Excel
        </DropdownItem>
      </Dropdown>
    </div>
  );
}
