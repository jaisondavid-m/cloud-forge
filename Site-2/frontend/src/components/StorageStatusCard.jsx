import React from 'react';
import { HardDrive, CheckCircle2, AlertTriangle, ArrowRightLeft, Shield } from 'lucide-react';

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function StorageStatusCard({ status }) {
  const isMounted = status && status.is_mounted;
  const isReadable = status && status.is_readable;
  const totalBytes = status?.total_bytes || 0;
  const usedBytes = status?.used_bytes || 0;
  const freeBytes = status?.free_bytes || 0;
  const usagePercent = status?.usage_percent || 0;
  const fileCount = status?.file_count ?? 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-lg ${isMounted ? 'bg-purple-50 text-purple-600' : 'bg-red-50 text-red-600'}`}>
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-slate-900">EFS Read-Only Replica</h2>
              <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isMounted
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {isMounted ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Mounted & Readable</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    <span>Not Mounted</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Target: <span className="font-medium text-slate-700">AWS Elastic File System</span> • Access: Read-Only
            </p>
          </div>
        </div>

        {/* Read-Only Notice + Sync Indicator */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 font-medium">
            <Shield className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>Read-only — modifications disabled</span>
          </div>
          <div className="hidden sm:flex items-center space-x-1.5 bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs text-slate-600">
            <ArrowRightLeft className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span>Synced from <strong>Site 1</strong></span>
          </div>
        </div>
      </div>

      {/* Storage Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
          <span className="text-xs font-medium text-slate-500">Shared Files</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">{fileCount}</span>
            <span className="text-xs text-slate-500 font-medium">files detected</span>
          </div>
        </div>

        <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100 col-span-1 sm:col-span-2">
          <div className="flex justify-between items-center text-xs font-medium mb-1.5">
            <span className="text-slate-500">Storage Capacity ({usagePercent}%)</span>
            <span className="text-slate-700 font-semibold">
              {formatBytes(usedBytes)} used of {formatBytes(totalBytes)}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Math.max(usagePercent, 1), 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1.5">
            <span>Free Space: {formatBytes(freeBytes)}</span>
            <span className="text-slate-400">AWS EFS Elastic Scaling</span>
          </div>
        </div>
      </div>
    </div>
  );
}
