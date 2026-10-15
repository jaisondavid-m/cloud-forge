import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StorageStatusCard from './components/StorageStatusCard';
import FileUpload from './components/FileUpload';
import FileTable from './components/FileTable';
import FilePreviewModal from './components/FilePreviewModal';
import FileEditorModal from './components/FileEditorModal';
import NotificationToast from './components/NotificationToast';
import { fetchHealth, fetchStorageStatus, fetchFiles } from './api';
// No unused lucide-react imports needed

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
        {/* Clean Workspace Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Primary Storage Manager
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                Site 1 (Primary)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active read/write master volume on AWS Elastic File System (EFS) • Propagates to Site 2 in real-time
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Read / Write Active</span>
            </span>
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
