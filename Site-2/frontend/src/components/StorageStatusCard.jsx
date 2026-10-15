import React from 'react';
import { HardDrive, Shield, RefreshCw, Layers, FolderCheck } from 'lucide-react';

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function StorageStatusCard({ status }) {
  const isMounted = Boolean(status?.is_mounted && status?.is_readable);
  const usedBytes = status?.used_bytes || 0;
  const fileCount = status?.file_count ?? 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. EFS Replica Mount */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center space-x-3.5">
        <div className={`p-2.5 rounded-lg shrink-0 ${isMounted ? 'bg-purple-50 text-purple-600' : 'bg-rose-50 text-rose-600'}`}>
          <HardDrive className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Replica Mount</p>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${isMounted ? 'bg-purple-600' : 'bg-rose-500'}`} />
            <span className="text-sm font-semibold text-slate-900 truncate">
              {isMounted ? 'Mounted & Readable' : 'Not Connected'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">AWS EFS Secondary Node</p>
        </div>
      </div>

      {/* 2. Synced Files */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center space-x-3.5">
        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
          <FolderCheck className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Synced Files</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5 leading-none">{fileCount}</p>
          <p className="text-[11px] text-slate-400 truncate mt-1">Mirroring Site 1</p>
        </div>
      </div>

      {/* 3. Storage Consumed */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center space-x-3.5">
        <div className="p-2.5 rounded-lg bg-violet-50 text-violet-600 shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Storage Consumed</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5 leading-none">
            {formatBytes(usedBytes)}
          </p>
          <p className="text-[11px] text-purple-600 font-medium truncate mt-1">EFS Shared Volume</p>
        </div>
      </div>

      {/* 4. DR Security & Permission Mode */}
      <div className="bg-white rounded-xl border border-amber-200/80 bg-linear-to-r from-amber-50/40 to-white p-4 shadow-xs flex items-center space-x-3.5">
        <div className="p-2.5 rounded-lg bg-amber-100/70 text-amber-700 shrink-0">
          <Shield className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-amber-800 uppercase tracking-wider">Protection Mode</p>
          <p className="text-sm font-semibold text-amber-900 mt-0.5 truncate">
            Read-Only Protected
          </p>
          <p className="text-[11px] text-amber-700/80 truncate mt-0.5">Modifications Disabled</p>
        </div>
      </div>
    </div>
  );
}
