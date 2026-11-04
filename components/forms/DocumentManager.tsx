"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  FileCheck,
  Loader2,
  ExternalLink,
  X,
  Tag,
  CheckCircle2,
  Image as ImageIcon,
  FileCode,
} from "lucide-react";
import api from "@/lib/api";
import {
  generateRentalAgreementPDF,
  generateAccidentClaimPDF,
  generatePreInspectionPDF,
  generateStoragePDF,
  generateCancellationPDF,
} from "@/lib/pdf-generator";

interface DocumentManagerProps {
  claimId: string;
}

const DOCUMENT_CATEGORIES = [
  "General",
  "Hirer Driving Licence",
  "Proof of Address & ID",
  "Taxi / PCO Badge & Paper Licence",
  "Insurance Certificate / Schedule",
  "MOT Certificate / V5C Logbook",
  "Vehicle Damage Photos",
  "Accident Scene & Dashcam Photos",
  "Police Report / Collision Log",
  "Engineer Inspection & Estimate",
  "Storage & Recovery Invoices",
  "Third Party Correspondence",
];

export default function DocumentManager({ claimId }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Document Name Prompt Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [customDocName, setCustomDocName] = useState("");
  const [docCategory, setDocCategory] = useState("General");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/documents/${claimId}`);
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [claimId]);

  // Triggered when staff selects a file from disk
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFile(file);

    // Generate a smart suggested document title
    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
    const cleanSuggestion = nameWithoutExt.replace(/[-_]+/g, " ").trim();
    setCustomDocName(cleanSuggestion || file.name);
    setDocCategory("General");
    setShowUploadModal(true);
  };

  const handleCancelModal = () => {
    setShowUploadModal(false);
    setPendingFile(null);
    setCustomDocName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Submit file upload with custom name and category
  const handleConfirmUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFile) return;

    const docName = customDocName.trim() || pendingFile.name;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", pendingFile);
    formData.append("doc_name", docName);
    formData.append("category", docCategory);

    try {
      await api.post(`/documents/${claimId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setShowUploadModal(false);
      setPendingFile(null);
      setCustomDocName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchDocs();
    } catch (err) {
      alert("Failed to upload document to S3 storage.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: number) => {
    if (!confirm("Are you sure you want to delete this document from S3 and the claim record?")) return;
    try {
      await api.delete(`/documents/${claimId}/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      alert("Failed to delete document");
    }
  };

  // PDF Generators
  const handleDownloadRentalPDF = async () => {
    setGeneratingPdf(true);
    try {
      const res = await api.get(`/forms/${claimId}/rental-agreement`);
      generateRentalAgreementPDF(claimId, res.data);
    } catch {
      alert("Failed to generate Rental Agreement PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadRTAPDF = async () => {
    setGeneratingPdf(true);
    try {
      const res = await api.get(`/forms/${claimId}/accident-claim`);
      generateAccidentClaimPDF(claimId, res.data);
    } catch {
      alert("Failed to generate RTA Accident PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadPreInspectionPDF = async () => {
    setGeneratingPdf(true);
    try {
      const res = await api.get(`/forms/${claimId}/pre-inspection`);
      generatePreInspectionPDF(claimId, res.data);
    } catch {
      alert("Failed to generate Pre-Inspection PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadStoragePDF = async () => {
    setGeneratingPdf(true);
    try {
      const res = await api.get(`/forms/${claimId}/storage-recovery`);
      generateStoragePDF(claimId, res.data);
    } catch {
      alert("Failed to generate Storage & Recovery PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadCancellationPDF = async () => {
    setGeneratingPdf(true);
    try {
      const res = await api.get(`/forms/${claimId}/cancellation`);
      generateCancellationPDF(claimId, res.data);
    } catch {
      alert("Failed to generate Cancellation Notice PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 text-xs font-medium">
      {/* 1. PDF Instant Document Generator */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <FileCheck className="w-4 h-4 text-[#D71920]" />
          <span>Branded PDF Generation (PCH Hire Ltd Theme)</span>
        </h3>
        <p className="text-gray-500 text-xs">
          Generate complete high-resolution printable PDFs styled with PCH Hire Red branding. All form fields, itemized tables, diagrams, and signatures are automatically included.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          <button
            onClick={handleDownloadRentalPDF}
            disabled={generatingPdf}
            className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-red-50 hover:border-red-200 text-gray-800 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[#D71920]" />
              <div className="text-left">
                <div className="font-bold">Hire Agreement PDF</div>
                <div className="text-[10px] text-gray-400">Complete 2-page agreement with financials & 5 signatures</div>
              </div>
            </div>
            <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#D71920] shrink-0 ml-2" />
          </button>

          <button
            onClick={handleDownloadRTAPDF}
            disabled={generatingPdf}
            className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-red-50 hover:border-red-200 text-gray-800 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[#D71920]" />
              <div className="text-left">
                <div className="font-bold">RTA Accident Claim PDF</div>
                <div className="text-[10px] text-gray-400">Circumstances, sketch, comparison & witness log</div>
              </div>
            </div>
            <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#D71920] shrink-0 ml-2" />
          </button>

          <button
            onClick={handleDownloadPreInspectionPDF}
            disabled={generatingPdf}
            className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-red-50 hover:border-red-200 text-gray-800 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[#D71920]" />
              <div className="text-left">
                <div className="font-bold">Pre-Inspection PDF</div>
                <div className="text-[10px] text-gray-400">30-point condition matrix & stamped damage diagram</div>
              </div>
            </div>
            <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#D71920] shrink-0 ml-2" />
          </button>

          <button
            onClick={handleDownloadStoragePDF}
            disabled={generatingPdf}
            className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-red-50 hover:border-red-200 text-gray-800 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[#D71920]" />
              <div className="text-left">
                <div className="font-bold">Storage & Recovery PDF</div>
                <div className="text-[10px] text-gray-400">Movement log, compound charges breakdown & VAT</div>
              </div>
            </div>
            <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#D71920] shrink-0 ml-2" />
          </button>

          <button
            onClick={handleDownloadCancellationPDF}
            disabled={generatingPdf}
            className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-red-50 hover:border-red-200 text-gray-800 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[#D71920]" />
              <div className="text-left">
                <div className="font-bold">Cancellation Notice PDF</div>
                <div className="text-[10px] text-gray-400">Statutory 14-day cancellation notice & declaration</div>
              </div>
            </div>
            <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#D71920] shrink-0 ml-2" />
          </button>
        </div>
      </div>

      {/* 2. Uploaded Documents */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-[#D71920]" />
            <span>Claim File Attachments (AWS S3: pch-hire/{claimId}/*)</span>
          </h3>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelected}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-[#D71920] hover:bg-[#B5141A] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#D71920] mx-auto mb-2" />
            <span>Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="font-bold text-gray-700">No documents uploaded yet</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Click &quot;Upload Document&quot; to attach driving licences, V5C logbooks, police reports, or vehicle photos.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 flex items-center justify-between hover:bg-gray-50/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-[#D71920]" />
                  </div>
                  <div>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-gray-900 hover:text-[#D71920] hover:underline flex items-center gap-1"
                    >
                      <span>{doc.doc_name}</span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </a>
                    <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                        {doc.category || "General"}
                      </span>
                      <span>•</span>
                      <span>
                        {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : "S3 Upload"}
                      </span>
                      {doc.uploaded_at && (
                        <>
                          <span>•</span>
                          <span>{new Date(doc.uploaded_at).toLocaleDateString("en-GB")}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    download
                    className="p-1.5 text-gray-500 hover:text-[#D71920] hover:bg-red-50 rounded transition-colors"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Document Name & Category Modal */}
      {showUploadModal && pendingFile && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-gray-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={handleCancelModal}
              disabled={uploading}
              className="absolute top-5 right-5 p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-5 h-5 text-[#D71920]" />
              <h3 className="text-base font-bold text-gray-900">Name Your Document</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Enter a clear document name and select a category before saving to S3.
            </p>

            {/* Selected File Details Box */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                <FileCode className="w-4 h-4 text-gray-600" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-gray-800 truncate" title={pendingFile.name}>
                  {pendingFile.name}
                </div>
                <div className="text-[10px] text-gray-400">
                  {Math.round(pendingFile.size / 1024)} KB • {pendingFile.type || "File"}
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Document Display Name <span className="text-[#D71920]">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={customDocName}
                  onChange={(e) => setCustomDocName(e.target.value)}
                  placeholder="e.g. Hirer Driving Licence Front"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#D71920] focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  <span>Category</span>
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#D71920] focus:border-transparent transition"
                >
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelModal}
                  disabled={uploading}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={uploading || !customDocName.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg text-white bg-[#D71920] hover:bg-[#B5141A] transition shadow-xs disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading to S3...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload & Save</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
