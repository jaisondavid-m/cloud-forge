import React from 'react';
import { HardDrive, CheckCircle2, AlertTriangle, ArrowRightLeft, FolderArchive, Layers } from 'lucide-react';

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function StorageStatusCard({ status, loading }) {
  const isMounted = Boolean(status?.is_mounted);
  const isWritable = Boolean(status?.writable);
  const usedBytes = status?.used_bytes || 0;
  const fileCount = status?.file_count ?? 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Volume & Mount */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center space-x-3.5">
        <div className={`p-2.5 rounded-lg shrink-0 ${isMounted ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          <HardDrive className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">EFS Mount Status</p>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${isMounted ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className="text-sm font-semibold text-slate-900 truncate">
              {isMounted ? 'Active & Mounted' : 'Not Connected'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">AWS Elastic File System</p>
        </div>
      </div>

      {/* 2. Total Stored Files */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center space-x-3.5">
        <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
          <FolderArchive className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Shared Files</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5 leading-none">{fileCount}</p>
          <p className="text-[11px] text-slate-400 truncate mt-1">Available to all nodes</p>
        </div>
      </div>

      {/* 3. Storage In Use (Elastic Scaling) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center space-x-3.5">
        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Storage Consumed</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5 leading-none">
            {formatBytes(usedBytes)}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium truncate mt-1">Elastic Auto-Scaling</p>
        </div>
      </div>

      {/* 4. Node Mode & Multi-AZ */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center space-x-3.5">
        <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
          <ArrowRightLeft className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Node Permission</p>
          <p className="text-sm font-semibold text-emerald-700 mt-0.5 truncate">
            {isWritable ? 'Read / Write Active' : 'Read-Only Mode'}
          </p>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">Syncs to Site-2 in real-time</p>
        </div>
      </div>
    </div>
  );
}
