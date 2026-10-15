import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function NotificationToast({ notifications, onDismiss }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-md w-full pointer-events-none">
      {notifications.map((item) => (
        <ToastItem key={item.id} notification={item} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ notification, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  const isSuccess = notification.type === 'success';
  const isError = notification.type === 'error';

  return (
    <div
      className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-xl border shadow-lg transition-all animate-in slide-in-from-bottom-3 duration-200 ${
        isSuccess
          ? 'bg-white border-emerald-200 text-emerald-950'
          : isError
          ? 'bg-white border-rose-200 text-rose-950'
          : 'bg-white border-blue-200 text-blue-950'
      }`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        ) : isError ? (
          <AlertCircle className="w-5 h-5 text-rose-600" />
        ) : (
          <Info className="w-5 h-5 text-blue-600" />
        )}
      </div>

      <div className="flex-1 text-xs">
        <p className="font-semibold mb-0.5">
          {isSuccess ? 'Success' : isError ? 'Error' : 'Notification'}
        </p>
        <p className="text-slate-600 leading-normal">{notification.message}</p>
      </div>

      <button
        onClick={() => onDismiss(notification.id)}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
