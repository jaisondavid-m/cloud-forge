import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Server,
  HardDrive,
  FolderOpen,
  Clock,
  Shield,
  RefreshCw,
} from 'lucide-react';

export default function VerificationPanel({ health, storageStatus, fileCount, lastRefresh, isRefreshing }) {
  const checks = [
    {
      label: 'Backend Reachable',
      description: 'FastAPI service on Site-2 is responding',
      passed: health && health.status === 'healthy',
      icon: Server,
      detail: health ? `${health.site} (v${health.version})` : 'No response from backend',
    },
    {
      label: 'EFS Mount Available',
      description: 'Shared EFS directory is accessible on this host',
      passed: storageStatus && storageStatus.is_mounted,
      icon: HardDrive,
      detail: storageStatus
        ? storageStatus.mount_status
        : 'Storage status unavailable',
    },
    {
      label: 'Shared Directory Readable',
      description: 'Application can read files from the EFS mount point',
      passed: storageStatus && storageStatus.is_readable,
      icon: FolderOpen,
      detail: storageStatus?.is_readable
        ? 'Read access confirmed'
        : 'Cannot read shared directory',
    },
    {
      label: 'Read-Only Mode Active',
      description: 'Write, upload, edit, and delete operations are disabled',
      passed: health && health.read_only === true,
      icon: Shield,
      detail: 'All modification endpoints return HTTP 403',
    },
  ];

  const allPassed = checks.every((c) => c.passed);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">System Verification Panel</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Live checks against Site-2 backend and shared EFS storage
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
          allPassed
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {allPassed ? 'All Checks Passed' : 'Degraded'}
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {checks.map((check, idx) => {
          const Icon = check.icon;
          return (
            <div key={idx} className="px-5 py-3.5 flex items-center space-x-4">
              <div className={`flex-shrink-0 p-2 rounded-lg ${
                check.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-900">{check.label}</span>
                  {check.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{check.description}</p>
              </div>

              <span className={`text-xs font-medium px-2.5 py-1 rounded-md whitespace-nowrap ${
                check.passed
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}>
                {check.detail}
              </span>
            </div>
          );
        })}

        {/* File Count & Last Refresh — derived from real data */}
        <div className="px-5 py-3.5 flex items-center space-x-4">
          <div className="flex-shrink-0 p-2 rounded-lg bg-blue-50 text-blue-600">
            <FolderOpen className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-slate-900">Visible Shared Files</span>
            <p className="text-xs text-slate-500 mt-0.5">Number of files detected in shared EFS storage</p>
          </div>
          <span className="text-lg font-bold text-slate-900">{fileCount}</span>
        </div>

        <div className="px-5 py-3.5 flex items-center space-x-4">
          <div className="flex-shrink-0 p-2 rounded-lg bg-purple-50 text-purple-600">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-slate-900">Last Successful Refresh</span>
            <p className="text-xs text-slate-500 mt-0.5">Most recent time shared storage was queried</p>
          </div>
          <span className="text-xs font-mono text-slate-700">
            {lastRefresh || '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
