import React from 'react';
import { Cloud, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Header({
  health,
  storageStatus,
  onRefresh,
  isRefreshing,
}) {
  const isHealthy = health && health.status === 'healthy';
  const isMounted = storageStatus && storageStatus.is_mounted;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Master Site Label */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-sm ring-4 ring-blue-50">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Cloud<span className="text-blue-600">Forge</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Primary Node (Master)
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                AWS EFS Shared Cloud Storage • Multi-AZ
              </span>
            </div>
          </div>

          {/* Right Status Indicators & Action */}
          <div className="flex items-center space-x-3">
            {/* Health / Connection Indicator */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
              {isHealthy && isMounted ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>EFS Volume Mounted</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-amber-700">Storage Offline</span>
                </>
              )}
            </div>

            {/* Quick Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh shared storage"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
