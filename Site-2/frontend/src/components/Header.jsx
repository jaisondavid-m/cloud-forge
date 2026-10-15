import React from 'react';
import { Cloud, Shield, RefreshCw, CheckCircle2, AlertCircle, Eye } from 'lucide-react';

export default function Header({
  health,
  storageStatus,
  onRefresh,
  isRefreshing,
  countdown,
}) {
  const isHealthy = health && health.status === 'healthy';
  const isMounted = storageStatus && storageStatus.is_mounted && storageStatus.is_readable;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Site Label */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-600 text-white shadow-sm ring-4 ring-purple-50">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Cloud<span className="text-purple-600">Forge</span>
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                  Recovery Site
                </span>
                <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
                  CF-PS-44
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                AWS EFS Shared Cloud File Storage (Secondary Node)
              </span>
            </div>
          </div>

          {/* Right Status Indicators */}
          <div className="flex items-center space-x-3">
            {/* Auto-sync indicator */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span>Syncing every 5s ({countdown}s)</span>
            </div>

            {/* Health / Storage Status Indicator */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
              {isHealthy && isMounted ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>EFS Replica Online</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-amber-700">Storage Offline</span>
                </>
              )}
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Manually query shared EFS for updates from Site 1"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
