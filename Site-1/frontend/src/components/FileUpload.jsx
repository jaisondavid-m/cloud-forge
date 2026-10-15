import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { uploadFile } from '../api';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export default function FileUpload({ onUploadSuccess, onError }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentFileName, setCurrentFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleFiles = async (file) => {
    if (!file) return;

    // Check size limit (10MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      onError(`File '${file.name}' exceeds the 10 MB upload limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setCurrentFileName(file.name);

    try {
      const response = await uploadFile(file);
      onUploadSuccess(response.message || `File '${file.name}' uploaded successfully.`);
    } catch (err) {
      onError(err.message || `Failed to upload '${file.name}'.`);
    } finally {
      setIsUploading(false);
      setCurrentFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Upload to Shared Storage</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Files uploaded here are stored directly on AWS EFS and instantly available on Site 2.
          </p>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
          Max: 10 MB
        </span>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
            : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/60'
        } ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          {isUploading ? (
            <div>
              <p className="text-sm font-medium text-slate-800">
                Uploading <span className="font-semibold text-blue-600">{currentFileName}</span>...
              </p>
              <p className="text-xs text-slate-500 mt-1">Writing directly to EFS shared volume</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-slate-800">
                <span className="text-blue-600 font-semibold hover:underline">Click to browse</span> or drag & drop files here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Any file type up to 10 MB • Overwriting existing files is prevented
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
