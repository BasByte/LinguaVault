"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Download, Upload, FileText, CheckCircle, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, Loader2, X, Eye, RotateCcw, HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: number; question: string; question_type: string;
  options: string[] | null; correct_answer: string;
  explanation: string | null; points: number; order_index: number;
}

interface ParsedRow {
  question: string; question_type: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
  correct_answer: string; explanation: string; points: number;
  _error?: string;
}

interface Props {
  testId: number;
  testTitle: string;
  questions: Question[];
  apiBase?: string;
}

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Multiple Choice",
  fill_blank: "Fill in Blank",
  matching: "Matching",
  translation: "Translation",
  listening: "Listening",
  writing: "Writing",
};

const VALID_TYPES = ["multiple_choice", "fill_blank", "matching", "translation", "listening", "writing"];

const CSV_TEMPLATE = `question,question_type,option_a,option_b,option_c,option_d,correct_answer,explanation,points
"What is the capital of France?",multiple_choice,Paris,London,Berlin,Madrid,Paris,"Paris is the capital and largest city of France.",10
"Water is composed of hydrogen and ____.",fill_blank,,,,,"oxygen","H2O means 2 hydrogen atoms and 1 oxygen atom.",10
"Match the word to its meaning: 'Bonjour'",matching,,,,,"Hello","Bonjour means Hello in French.",10
"Translate: 'Je suis étudiant.'",translation,,,,,"I am a student.","Direct translation from French.",10
"Listen and identify the greeting used.",listening,,,,,"Good morning","Focus on intonation and context.",10
"Write a short paragraph about your hometown.",writing,,,,,"Sample: My hometown is a small city...",,15`;

function questionsToCSV(questions: Question[]): string {
  const header = "question,question_type,option_a,option_b,option_c,option_d,correct_answer,explanation,points";
  const rows = questions.map((q) => {
    const opts = q.options ?? [];
    const cells = [
      q.question, q.question_type,
      opts[0] ?? "", opts[1] ?? "", opts[2] ?? "", opts[3] ?? "",
      q.correct_answer, q.explanation ?? "", String(q.points),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
    return cells.join(",");
  });
  return [header, ...rows].join("\n");
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Skip header row
  const dataLines = lines.slice(1);

  return dataLines.map((line): ParsedRow => {
    // Basic CSV parser that handles quoted fields
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current);

    const [question = "", question_type = "", option_a = "", option_b = "", option_c = "", option_d = "", correct_answer = "", explanation = "", pointsStr = "10"] = fields;
    const points = parseInt(pointsStr) || 10;
    const type = question_type.trim().toLowerCase();

    let error: string | undefined;
    if (!question.trim()) error = "Question text is required";
    else if (!VALID_TYPES.includes(type)) error = `Unknown type "${type}"`;
    else if (!correct_answer.trim()) error = "correct_answer is required";
    else if (type === "multiple_choice" && !option_a.trim() && !option_b.trim()) error = "Multiple choice needs at least 2 options";

    return { question: question.trim(), question_type: type, option_a: option_a.trim(), option_b: option_b.trim(), option_c: option_c.trim(), option_d: option_d.trim(), correct_answer: correct_answer.trim(), explanation: explanation.trim(), points, _error: error };
  });
}

function rowToQuestion(row: ParsedRow) {
  const options = [row.option_a, row.option_b, row.option_c, row.option_d].filter(Boolean);
  return {
    question: row.question,
    question_type: row.question_type,
    options: row.question_type === "multiple_choice" ? options : null,
    correct_answer: row.correct_answer,
    explanation: row.explanation || null,
    points: row.points,
  };
}

export default function BulkQuestionsIO({ testId, testTitle, questions, apiBase = "/api/admin" }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

  // Import state
  const [parsedRows, setParsedRows] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Export
  const handleExport = () => {
    if (questions.length === 0) { alert("No questions to export."); return; }
    const csv = questionsToCSV(questions);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${testTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_questions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTemplateDownload = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "question_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) { alert("Please upload a .csv file"); return; }
    setFileName(file.name);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      setParsedRows(rows);
    };
    reader.readAsText(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    if (!parsedRows) return;
    const validRows = parsedRows.filter((r) => !r._error);
    if (validRows.length === 0) { alert("No valid rows to import."); return; }
    if (importMode === "replace" && !confirm(`This will DELETE all ${questions.length} existing questions and replace them with ${validRows.length} new ones. Continue?`)) return;

    setImporting(true);
    setImportResult(null);
    const res = await fetch(`${apiBase}/questions/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test_id: testId, questions: validRows.map(rowToQuestion), mode: importMode }),
    });
    setImporting(false);

    if (res.ok) {
      const data = await res.json();
      setImportResult({ success: true, message: `Successfully imported ${data.imported} question${data.imported !== 1 ? "s" : ""}${importMode === "replace" ? " (replaced all existing)" : ""}.` });
      setParsedRows(null);
      setFileName("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      const errorMsg = data.errors ? data.errors.map((e: { row: number; message: string }) => `Row ${e.row}: ${e.message}`).join("; ") : (data.error || "Import failed");
      setImportResult({ success: false, message: errorMsg });
    }
  };

  const errorCount = parsedRows?.filter((r) => r._error).length ?? 0;
  const validCount = parsedRows?.filter((r) => !r._error).length ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
            <FileText className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Bulk Import / Export</p>
            <p className="text-xs text-gray-500">{questions.length} question{questions.length !== 1 ? "s" : ""} · CSV format</p>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 p-5 space-y-5">
          {/* Export section */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-2">
                <Download className="h-4 w-4 text-green-600" /> Export Questions
              </h3>
              <p className="text-xs text-gray-500 mb-3">Download all {questions.length} questions as a CSV file for backup or reuse.</p>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  disabled={questions.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export {questions.length > 0 ? `(${questions.length})` : ""} CSV
                </button>
                <button
                  onClick={handleTemplateDownload}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 hover:bg-white rounded-xl text-xs font-semibold transition-colors"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Template
                </button>
              </div>
            </div>

            {/* CSV format guide toggle */}
            <div className="sm:w-64">
              <button
                onClick={() => setShowTemplate((v) => !v)}
                className="w-full text-left bg-indigo-50 rounded-xl p-4 hover:bg-indigo-100 transition-colors"
              >
                <p className="font-bold text-indigo-800 text-xs mb-1 flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5" /> CSV Column Reference
                  {showTemplate ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                </p>
                {!showTemplate && <p className="text-xs text-indigo-600">Click to view column format</p>}
              </button>
              {showTemplate && (
                <div className="mt-2 bg-gray-900 rounded-xl p-3 text-xs font-mono text-gray-300 overflow-x-auto">
                  <p className="text-yellow-400 mb-1"># Required columns:</p>
                  {[
                    ["question", "The question text"],
                    ["question_type", "multiple_choice | true_false | fill_blank | essay"],
                    ["option_a..d", "Options (MC only)"],
                    ["correct_answer", "The correct answer"],
                    ["explanation", "Optional explanation"],
                    ["points", "Point value (default 10)"],
                  ].map(([col, desc]) => (
                    <div key={col} className="flex gap-2">
                      <span className="text-sky-400 shrink-0">{col}</span>
                      <span className="text-gray-500">{desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Import section */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Upload className="h-4 w-4 text-indigo-600" /> Import Questions from CSV
            </h3>

            {/* Import result */}
            {importResult && (
              <div className={cn("flex items-start gap-2 px-4 py-3 rounded-xl text-sm", importResult.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
                {importResult.success ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                <span>{importResult.message}</span>
                <button onClick={() => setImportResult(null)} className="ml-auto shrink-0 opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button>
              </div>
            )}

            {/* Drop zone */}
            {!parsedRows && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
                  dragOver ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                )}
              >
                <Upload className={cn("h-8 w-8 mx-auto mb-2", dragOver ? "text-indigo-500" : "text-gray-300")} />
                <p className="font-semibold text-gray-700 text-sm">Drop a CSV file here, or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">Accepts .csv files · Use the Template button above to get started</p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              </div>
            )}

            {/* Preview table */}
            {parsedRows && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-800">{fileName}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold", validCount > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                      {validCount} valid
                    </span>
                    {errorCount > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700">
                        {errorCount} error{errorCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <button onClick={() => { setParsedRows(null); setFileName(""); }} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                    <RotateCcw className="h-3 w-3" /> Clear
                  </button>
                </div>

                {/* Mode selector */}
                <div className="flex gap-2">
                  {(["append", "replace"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setImportMode(m)}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-colors text-center",
                        importMode === m ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                      )}
                    >
                      {m === "append" ? `Append to existing (${questions.length} + ${validCount})` : `Replace all (delete ${questions.length} → add ${validCount})`}
                    </button>
                  ))}
                </div>

                {importMode === "replace" && questions.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Replace mode will permanently delete all {questions.length} existing questions before importing.
                  </div>
                )}

                {/* Preview rows */}
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold text-gray-600 w-6">#</th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-600 min-w-52">Question</th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-600 w-28">Type</th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-600 w-36 hidden sm:table-cell">Answer</th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-600 w-12">Pts</th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-600 w-20">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {parsedRows.map((row, i) => (
                          <tr key={i} className={cn(row._error ? "bg-red-50" : "hover:bg-gray-50")}>
                            <td className="px-3 py-2 text-gray-400 font-mono">{i + 1}</td>
                            <td className="px-3 py-2">
                              <p className="text-gray-800 font-medium line-clamp-2">{row.question || <span className="text-red-400 italic">empty</span>}</p>
                              {row._error && (
                                <p className="text-red-500 mt-0.5 flex items-center gap-1"><XCircle className="h-3 w-3 shrink-0" />{row._error}</p>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <span className={cn("px-1.5 py-0.5 rounded font-semibold", row.question_type === "multiple_choice" ? "bg-indigo-50 text-indigo-700" : row.question_type === "fill_blank" ? "bg-amber-50 text-amber-700" : row.question_type === "matching" ? "bg-sky-50 text-sky-700" : row.question_type === "translation" ? "bg-violet-50 text-violet-700" : row.question_type === "listening" ? "bg-teal-50 text-teal-700" : row.question_type === "writing" ? "bg-rose-50 text-rose-700" : "bg-gray-50 text-gray-600")}>
                                {TYPE_LABELS[row.question_type] ?? row.question_type}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-600 hidden sm:table-cell max-w-36 truncate">{row.correct_answer}</td>
                            <td className="px-3 py-2 font-bold text-gray-700">{row.points}</td>
                            <td className="px-3 py-2">
                              {row._error
                                ? <span className="flex items-center gap-1 text-red-600"><XCircle className="h-3.5 w-3.5" /> Skip</span>
                                : <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3.5 w-3.5" /> Valid</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 items-center">
                  <button
                    onClick={handleImport}
                    disabled={importing || validCount === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {importing ? "Importing…" : `Import ${validCount} Question${validCount !== 1 ? "s" : ""}`}
                  </button>
                  {errorCount > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {errorCount} row{errorCount !== 1 ? "s" : ""} with errors will be skipped
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick format cheatsheet */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { type: "multiple_choice", color: "bg-indigo-50 text-indigo-700 border-indigo-100", note: "Needs option_a–d; correct = one option text" },
              { type: "fill_blank", color: "bg-amber-50 text-amber-700 border-amber-100", note: "correct_answer = expected word/phrase" },
              { type: "matching", color: "bg-sky-50 text-sky-700 border-sky-100", note: "correct_answer = the matching pair" },
              { type: "translation", color: "bg-violet-50 text-violet-700 border-violet-100", note: "correct_answer = translated text" },
              { type: "listening", color: "bg-teal-50 text-teal-700 border-teal-100", note: "correct_answer = expected response" },
              { type: "writing", color: "bg-rose-50 text-rose-700 border-rose-100", note: "correct_answer = model/sample answer" },
            ].map((t) => (
              <div key={t.type} className={cn("rounded-xl border p-2.5", t.color)}>
                <p className="font-bold text-xs mb-0.5">{TYPE_LABELS[t.type]}</p>
                <p className="text-xs opacity-80 leading-relaxed">{t.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
