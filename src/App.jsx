import { useState, useEffect } from 'react';

// ===================
// SUPABASE CONFIG
// ===================
const SUPABASE_URL = 'https://pyshlfqyjmcbqofnbeyu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_IvDKdqp1eIaEdibdL_87SQ__GBiaKOJ';

const supabase = {
  async get(id) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/seller_data?id=eq.${id}&select=data`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const rows = await res.json();
      return rows.length > 0 ? rows[0].data : null;
    } catch (e) { console.error('Supabase get error:', e); return null; }
  },
  async set(id, data) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/seller_data`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({ id, data, updated_at: new Date().toISOString() })
      });
      return true;
    } catch (e) { console.error('Supabase set error:', e); return false; }
  }
};

const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    {toasts.map(toast => (
      <div key={toast.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border ${toast.type === 'success' ? 'bg-green-900 border-green-700 text-green-100' : toast.type === 'error' ? 'bg-red-900 border-red-700 text-red-100' : toast.type === 'warning' ? 'bg-yellow-900 border-yellow-700 text-yellow-100' : 'bg-gray-800 border-gray-600 text-gray-100'}`}>
        <span className="text-sm font-medium">{toast.message}</span>
        <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
      </div>
    ))}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-full bg-red-900/50 text-2xl">⚠️</div>
          <div><h3 className="text-lg font-semibold text-white">{title}</h3><p className="text-gray-400 text-sm mt-1">{message}</p></div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-200">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white">Remove</button>
        </div>
      </div>
    </div>
  );
};

const StatsBar = ({ sellers, listings, notifications }) => {
  const totalProducts = Object.values(listings).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  const newToday = notifications.filter(n => new Date(n.timestamp) >= new Date(new Date().setHours(0,0,0,0))).length;
  return (
    <div className="flex items-center gap-6 px-4 py-3 bg-gray-800/50 rounded-lg border border-gray-700/50 mb-6">
      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-gray-400 text-sm">{sellers.length} Sellers</span></div>
      <div className="w-px h-4 bg-gray-700" />
      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500" /><span className="text-gray-400 text-sm">{totalProducts} Products</
