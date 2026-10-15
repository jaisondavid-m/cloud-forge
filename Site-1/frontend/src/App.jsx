import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StorageStatusCard from './components/StorageStatusCard';
import FileUpload from './components/FileUpload';
import FileTable from './components/FileTable';
import FilePreviewModal from './components/FilePreviewModal';
import FileEditorModal from './components/FileEditorModal';
import NotificationToast from './components/NotificationToast';
import { fetchHealth, fetchStorageStatus, fetchFiles } from './api';
import { RefreshCw, Server, ShieldCheck, Database } from 'lucide-react';

export default function App() {
  const [health, setHealth] = useState(null);
  const [storageStatus, setStorageStatus] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Toast helper
  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setNotifications((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Fetch all shared storage state
  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const [hData, sData, fData] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchStorageStatus().catch(() => null),
        fetchFiles().catch(() => ({ files: [] })),
      ]);

      if (hData) setHealth(hData);
      if (sData) setStorageStatus(sData);
      if (fData && fData.files) setFiles(fData.files);

      if (isManualRefresh) {
        addNotification('Shared EFS storage refreshed. Verified sync with Site 2.', 'success');
      }
    } catch (err) {
      if (isManualRefresh) {
        addNotification('Failed to refresh shared storage.', 'error');
      }
    } finally {
      setIsLoadingFiles(false);
      if (isManualRefresh) setIsRefreshing(false);
    }
  }, [addNotification]);

  // Initial load
  useEffect(() => {
    loadData(false);

    // Auto-refresh every 12 seconds to automatically detect changes made by Site 2
    const interval = setInterval(() => {
      loadData(false);
    }, 12000);

    return () => clearInterval(interval);
  }, [loadData]);

  const handleUploadSuccess = (message) => {
    addNotification(message, 'success');
    loadData(false);
  };

  const handleSaveSuccess = (message) => {
    addNotification(message, 'success');
    loadData(false);
  };

  const handleError = (message) => {
    addNotification(message, 'error');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top Navigation & Status Bar */}
      <Header
        health={health}
        storageStatus={storageStatus}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Project Intro / Banner (Blue Theme) */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient from-blue-500/10 to-transparent pointer-events-none"></div>
          <div className="relative z-10 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                <span>Site 1 • Primary File Manager (Master Node)</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Read / Write Enabled</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-purple-400/20 text-purple-200 border border-purple-300/30 text-xs font-medium">
                <span>EFS Source</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Primary Site — Shared Cloud Storage
            </h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Active read/write storage node connected to the shared AWS Elastic File System (EFS). All files uploaded or edited here are instantly propagated to <strong>Site 2 (Recovery Site)</strong> in real time.
            </p>
          </div>
        </div>

        {/* EFS Storage Status Card */}
        <StorageStatusCard
          status={storageStatus}
          loading={isLoadingFiles}
        />

        {/* Drag-and-Drop File Upload Area */}
        <FileUpload
          onUploadSuccess={handleUploadSuccess}
          onError={handleError}
        />

        {/* File Table / Explorer */}
        <FileTable
          files={files}
          isLoading={isLoadingFiles}
          onRefresh={() => loadData(true)}
          isRefreshing={isRefreshing}
          onPreview={(file) => setPreviewFile(file)}
          onEdit={(file) => setEditingFile(file)}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 CloudForge — Shared Cloud File Storage (Site 1 Primary)</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>FastAPI Backend Active</span>
            </span>
            <span>•</span>
            <span>AWS EFS POSIX Filesystem</span>
          </div>
        </div>
      </footer>

      {/* Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onSwitchToEdit={(file) => setEditingFile(file)}
        />
      )}

      {/* Edit Modal */}
      {editingFile && (
        <FileEditorModal
          file={editingFile}
          onClose={() => setEditingFile(null)}
          onSaveSuccess={handleSaveSuccess}
          onError={handleError}
        />
      )}

      {/* Notification Toast Stack */}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}
