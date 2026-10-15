import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import StorageStatusCard from './components/StorageStatusCard';
import FileTable from './components/FileTable';
import FilePreviewModal from './components/FilePreviewModal';
import NotificationToast from './components/NotificationToast';
import { fetchHealth, fetchStorageStatus, fetchFiles } from './api';
import { Shield, Eye } from 'lucide-react';

const AUTO_REFRESH_INTERVAL = 5000; // 5 seconds

export default function App() {
  const [health, setHealth] = useState(null);
  const [storageStatus, setStorageStatus] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [countdown, setCountdown] = useState(5);
  const countdownRef = useRef(5);

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setNotifications((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

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
        addNotification('Shared EFS storage refreshed. Latest files from Site 1 loaded.', 'success');
      }
    } catch (err) {
      if (isManualRefresh) {
        addNotification('Failed to refresh shared storage data.', 'error');
      }
    } finally {
      setIsLoadingFiles(false);
      if (isManualRefresh) setIsRefreshing(false);
      countdownRef.current = 5;
      setCountdown(5);
    }
  }, [addNotification]);

  // Initial load + auto-refresh every 5 seconds
  useEffect(() => {
    loadData(false);

    const dataInterval = setInterval(() => {
      loadData(false);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(dataInterval);
  }, [loadData]);

  // Countdown timer for UI display
  useEffect(() => {
    const tickInterval = setInterval(() => {
      countdownRef.current -= 1;
      if (countdownRef.current < 0) countdownRef.current = 5;
      setCountdown(countdownRef.current);
    }, 1000);

    return () => clearInterval(tickInterval);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Header
        health={health}
        storageStatus={storageStatus}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
        countdown={countdown}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Clean DR Workspace Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Recovery Site — Storage Mirror
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                Site 2 (DR Replica)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Read-only secondary node mirroring AWS Elastic File System (EFS) • Auto-syncing from Site 1
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium shadow-xs">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Read-Only Protected</span>
            </span>
          </div>
        </div>

        {/* DR Protection Notice Strip */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Disaster Recovery Mode:</strong> File uploads and edits are restricted to Site 1 (Primary). All changes sync here automatically every 5 seconds.
            </span>
          </div>
          <span className="hidden md:inline-block font-mono text-[11px] text-amber-700/80 bg-amber-100/60 px-2 py-0.5 rounded border border-amber-200">
            HTTP 403 Enforced
          </span>
        </div>

        {/* EFS Storage Status Card */}
        <StorageStatusCard status={storageStatus} />

        {/* Shared Files Table (Read-Only) */}
        <FileTable
          files={files}
          isLoading={isLoadingFiles}
          onRefresh={() => loadData(true)}
          isRefreshing={isRefreshing}
          onPreview={(file) => setPreviewFile(file)}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 CloudForge — Shared Cloud File Storage (Site 2 Recovery)</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <Shield className="w-3 h-3 text-amber-600" />
              <span>Read-Only Mode</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1.5">
              <Eye className="w-3 h-3 text-purple-600" />
              <span>Auto-Refresh: 5s</span>
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
        />
      )}

      {/* Notification Toasts */}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}
