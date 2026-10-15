import React, { useState } from 'react';
import {
  FileText,
  FileCode,
  Image,
  FileArchive,
  File,
  Eye,
  Download,
  Search,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { getDownloadUrl } from '../api';

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

function getFileIcon(ext) {
  switch (ext?.toLowerCase()) {
    case '.txt':
      return <FileText className="w-5 h-5 text-blue-600" />;
    case '.md':
      return <FileCode className="w-5 h-5 text-purple-600" />;
    case '.json':
      return <FileCode className="w-5 h-5 text-amber-600" />;
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.gif':
    case '.svg':
    case '.webp':
      return <Image className="w-5 h-5 text-emerald-600" />;
    case '.zip':
    case '.tar':
    case '.gz':
      return <FileArchive className="w-5 h-5 text-indigo-600" />;
    default:
      return <File className="w-5 h-5 text-slate-500" />;
  }
}

export default function FileTable({
  files,
  isLoading,
  onRefresh,
  isRefreshing,
  onPreview,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Controls Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-semibold text-slate-900">Shared Files (Read-Only)</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {files.length} {files.length === 1 ? 'file' : 'files'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Viewing files synchronized from <span className="font-semibold text-blue-700">Site 1 (Primary)</span> via shared AWS EFS mount
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files..."
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 w-44 sm:w-56"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh shared EFS file listing"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th scope="col" className="py-3 px-4 sm:px-6">Name</th>
              <th scope="col" className="py-3 px-4">Type</th>
              <th scope="col" className="py-3 px-4">Size</th>
              <th scope="col" className="py-3 px-4">Last Modified (UTC)</th>
              <th scope="col" className="py-3 px-4 sm:px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-400">
                  <div className="inline-flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                    <span>Loading shared files from EFS...</span>
                  </div>
                </td>
              </tr>
            ) : filteredFiles.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FolderOpen className="w-10 h-10 text-slate-300 stroke-1" />
                    <p className="text-sm font-medium text-slate-600">
                      {searchTerm
                        ? 'No files match your search'
                        : 'No files found in shared EFS storage'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {searchTerm
                        ? 'Try adjusting your search criteria'
                        : 'Upload a file via Site 1 (Primary) to see it appear here'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredFiles.map((file) => (
                <tr key={file.name} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-3 px-4 sm:px-6 font-medium text-slate-900">
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 group-hover:border-slate-200">
                        {getFileIcon(file.extension)}
                      </div>
                      <span className="truncate max-w-xs sm:max-w-md font-mono text-xs">
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono uppercase font-semibold text-[11px] text-slate-600 px-2 py-0.5 rounded bg-slate-100">
                      {file.extension ? file.extension.replace('.', '') : 'FILE'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono">
                    {formatBytes(file.size)}
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {formatDate(file.last_modified)}
                  </td>
                  <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => onPreview(file)}
                        className="p-1.5 rounded-md text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                        title="Preview file"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <a
                        href={getDownloadUrl(file.name)}
                        download={file.name}
                        className="p-1.5 rounded-md text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
