import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import StorageStatusCard from './components/StorageStatusCard';
import VerificationPanel from './components/VerificationPanel';
import FileTable from './components/FileTable';
import FilePreviewModal from './components/FilePreviewModal';
import NotificationToast from './components/NotificationToast';
import { fetchHealth, fetchStorageStatus, fetchFiles } from './api';
import { Shield, ShieldCheck, Eye } from 'lucide-react';

const AUTO_REFRESH_INTERVAL = 5000; // 5 seconds

export default function App() {
  const [health, setHealth] = useState(null);
  const [storageStatus, setStorageStatus] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const countdownRef = useRef(5);

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setNotifications((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const formatTimestamp = () => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date());
  };

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

      setLastRefresh(formatTimestamp());

      if (isManualRefresh) {
        addNotification('Shared EFS storage refreshed. Latest data from Site 1 loaded.', 'success');
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
        {/* Recovery Site Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient from-purple-500/10 to-transparent pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-purple-200 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>CF-PS-44 • Recovery Node (Read-Only)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Recovery Site — Shared Cloud Storage
            </h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Read-only access to files synchronized via AWS Elastic File System (EFS). Files uploaded or edited on Site 1 (Primary) are visible here in real-time. This instance auto-refreshes every 5 seconds.
            </p>
          </div>
        </div>

        {/* Read-Only Warning Banner */}
        <div className="flex items-center space-x-3 px-5 py-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Read-only Recovery Site — file modifications are disabled.
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Upload, edit, delete, rename, and overwrite operations are blocked at both the UI and API level. All modification endpoints return HTTP 403 Forbidden.
            </p>
          </div>
        </div>

        {/* EFS Storage Status Card */}
        <StorageStatusCard status={storageStatus} />

        {/* Verification Panel */}
        <VerificationPanel
          health={health}
          storageStatus={storageStatus}
          fileCount={files.length}
          lastRefresh={lastRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Shared Files Table */}
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
