import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { Transaction } from "@/services/transaction.service";

interface ExportOptions {
  filename?: string;
  sheetName?: string;
}

export function exportToExcel(
  transactions: Transaction[],
  options: ExportOptions = {}
) {
  const { filename = "transactions", sheetName = "Transactions" } = options;

  // Prepare data for export
  const data = transactions.map((t) => ({
    Date: new Date(t.date).toLocaleDateString("th-TH"),
    Type: t.type === "income" ? "Income" : "Expense",
    Category: t.category || "Uncategorized",
    Description: t.description || "",
    Amount: t.amount,
    "Amount (Formatted)": `฿${t.amount.toLocaleString()}`,
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const columnWidths = [
    { wch: 12 }, // Date
    { wch: 10 }, // Type
    { wch: 15 }, // Category
    { wch: 30 }, // Description
    { wch: 12 }, // Amount
    { wch: 15 }, // Amount (Formatted)
  ];
  worksheet["!cols"] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate file
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  // Save file
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`);
}

export function exportToCSV(
  transactions: Transaction[],
  options: ExportOptions = {}
) {
  const { filename = "transactions" } = options;

  // Prepare data
  const data = transactions.map((t) => ({
    Date: new Date(t.date).toLocaleDateString("th-TH"),
    Type: t.type === "income" ? "Income" : "Expense",
    Category: t.category || "Uncategorized",
    Description: t.description || "",
    Amount: t.amount,
  }));

  // Create worksheet and convert to CSV
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  // Save file
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
}
