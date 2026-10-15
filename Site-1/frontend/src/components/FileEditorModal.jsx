import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, AlertCircle, CheckCircle2, FileEdit, Undo } from 'lucide-react';
import { fetchFileContent, updateFileContent } from '../api';

export default function FileEditorModal({ file, onClose, onSaveSuccess, onError }) {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const ext = file?.extension?.toLowerCase();

  useEffect(() => {
    if (!file) return;
    setIsLoading(true);
    setLoadError(null);

    fetchFileContent(file.name)
      .then((text) => {
        setContent(text);
        setOriginalContent(text);
        setIsLoading(false);
      })
      .catch((err) => {
        setLoadError(err.message || 'Could not load file for editing');
        setIsLoading(false);
      });
  }, [file]);

  const hasChanges = content !== originalContent;

  const handleSave = async () => {
    // Optional JSON syntax check warning
    if (ext === '.json') {
      try {
        JSON.parse(content);
      } catch (jsonErr) {
        if (!window.confirm(`Warning: The content does not appear to be valid JSON (${jsonErr.message}). Do you still want to save?`)) {
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      await updateFileContent(file.name, content);
      setOriginalContent(content);
      onSaveSuccess(`Changes saved to '${file.name}' on EFS shared storage.`);
      onClose();
    } catch (err) {
      onError(err.message || `Failed to save changes to '${file.name}'.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Editor Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-slate-900 font-mono">
                  {file.name}
                </h3>
                {hasChanges && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Unsaved Changes
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Format: <span className="font-semibold uppercase">{ext?.replace('.', '')}</span> • Writes directly to shared EFS storage
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving to EFS...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-xs text-slate-500">Loading file content for editing...</p>
            </div>
          ) : loadError ? (
            <div className="p-6">
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{loadError}</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-[60vh]">
              <div className="bg-slate-50 px-4 py-1.5 border-b border-slate-200 flex justify-between text-[11px] font-mono text-slate-500">
                <span>Lines: {content.split('\n').length} | Characters: {content.length}</span>
                <span>UTF-8 Monospace</span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your text content here..."
                spellCheck={false}
                className="w-full flex-1 p-4 font-mono text-xs text-slate-800 bg-white border-none focus:outline-none focus:ring-0 resize-none leading-relaxed"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
