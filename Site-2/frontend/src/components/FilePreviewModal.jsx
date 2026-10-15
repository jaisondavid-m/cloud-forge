import React, { useState, useEffect } from 'react';
import { X, Download, Loader2, FileText, AlertCircle, Copy, Check, Shield } from 'lucide-react';
import { fetchFilePreview, getDownloadUrl, getRawFileUrl } from '../api';

export default function FilePreviewModal({ file, onClose }) {
  const [content, setContent] = useState('');
  const [isTruncated, setIsTruncated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const ext = file?.extension?.toLowerCase();
  const isImage = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'].includes(ext);
  const isPreviewable = file?.is_previewable;

  useEffect(() => {
    if (!file) return;

    if (isPreviewable) {
      setIsLoading(true);
      setError(null);
      fetchFilePreview(file.name)
        .then((data) => {
          setContent(data.content || '');
          setIsTruncated(data.is_truncated || false);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load preview');
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [file]);

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 font-mono">{file.name}</h3>
              <p className="text-xs text-slate-500">
                Type: {file.mime_type} • Size: {(file.size / 1024).toFixed(1)} KB • Source: Shared EFS
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Read-Only Badge */}
            <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Shield className="w-3 h-3" />
              <span>Read-Only</span>
            </span>

            {isPreviewable && content && (
              <button
                onClick={handleCopy}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                title="Copy content to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            <a
              href={getDownloadUrl(file.name)}
              download={file.name}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Download</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-xs text-slate-500">Reading file from shared EFS storage...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : isImage ? (
            <div className="flex justify-center items-center py-4 bg-slate-100 rounded-lg p-2">
              <img
                src={getRawFileUrl(file.name)}
                alt={file.name}
                className="max-h-[60vh] object-contain rounded border border-slate-200 shadow-sm"
              />
            </div>
          ) : isPreviewable ? (
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="bg-slate-100/70 px-4 py-2 text-[11px] font-mono text-slate-500 border-b border-slate-200 flex justify-between">
                <span>Lines: {content.split('\n').length}{isTruncated ? ' (truncated)' : ''}</span>
                <span>Encoding: UTF-8 (Read-Only)</span>
              </div>
              <pre className="p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap break-words leading-relaxed overflow-x-auto max-h-[55vh]">
                {content || <span className="text-slate-400 italic">File is empty</span>}
              </pre>
              {isTruncated && (
                <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-[11px] text-amber-700 font-medium">
                  Content truncated — download the full file for complete viewing
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-slate-800">Binary or unsupported format</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                In-browser preview is not available for this file type ({file.mime_type}). You can download it.
              </p>
              <a
                href={getDownloadUrl(file.name)}
                download={file.name}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download {file.name}</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
