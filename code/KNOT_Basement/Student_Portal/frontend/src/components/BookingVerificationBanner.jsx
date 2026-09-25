import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, XCircle, Clock, Calendar, MapPin, Building, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function BookingVerificationBanner({ user, onActionComplete }) {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.id || user?.username) {
      fetchVerifications();
    }
  }, [user]);

  const fetchVerifications = async () => {
    try {
      const identifier = user?.id || user?.username;
      const res = await axios.get(`${API_BASE_URL}/api/bookings/verifications/${identifier}`);
      setVerifications(res.data || []);
    } catch (err) {
      console.error("Error fetching 2-step verifications:", err);
    }
  };

  const handleVerifyAction = async (bookingId, action) => {
    setLoading(true);
    try {
      const res = await axios.put(`${API_BASE_URL}/api/bookings/${bookingId}/verify`, { action });
      setActionNotice(res.data.message);
      await fetchVerifications();
      if (onActionComplete) onActionComplete();
      setTimeout(() => setActionNotice(''), 3000);
    } catch (err) {
      console.error("Error responding to 2-step verification:", err);
      alert("Failed to process verification response.");
    } finally {
      setLoading(false);
    }
  };

  if (!verifications || verifications.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 mb-6 w-full font-sans">
      {actionNotice && (
        <div className="bg-emerald-600 text-white p-3 rounded-xl text-center text-xs font-bold shadow-md animate-bounce">
          ✓ {actionNotice}
        </div>
      )}

      {verifications.map((b) => {
        const deadline = b.verification_deadline ? new Date(b.verification_deadline) : null;
        let diffSecs = deadline ? Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000)) : 0;
        const hours = Math.floor(diffSecs / 3600);
        const mins = Math.floor((diffSecs % 3600) / 60);
        const secs = diffSecs % 60;
        const timeRemainingStr = `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;

        return (
          <div 
            key={b.id} 
            className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 dark:from-amber-950/40 dark:to-amber-900/20 border-2 border-amber-400/60 dark:border-amber-700/60 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-sm"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md animate-pulse">
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-amber-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1">
                      <AlertTriangle size={12} /> 2-Step Verification Required
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      #BKG-{String(b.id).padStart(4, '0')}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 leading-tight">
                    Confirm Lecture Hall Booking: <span className="text-primary">{b.title}</span>
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-600 dark:text-slate-300 flex-wrap font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} className="text-amber-600 dark:text-amber-400" />
                      {b.time_display}
                    </span>
                    {b.purpose && (
                      <span className="bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        Purpose: {b.purpose}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action & Deadline Counter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 border-amber-200 dark:border-amber-900/60 pt-3 md:pt-0">
                <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 px-3.5 py-2 rounded-xl flex flex-col items-center justify-center min-w-[140px] shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <Clock size={12} className="text-amber-500" /> Response Deadline
                  </span>
                  <span className="text-sm font-extrabold font-mono text-red-600 dark:text-red-400 mt-0.5">
                    {diffSecs > 0 ? timeRemainingStr : 'EXPIRED'}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleVerifyAction(b.id, 'confirm')}
                    disabled={loading}
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle size={16} />
                    Confirm & Keep Slot
                  </button>

                  <button
                    onClick={() => handleVerifyAction(b.id, 'cancel')}
                    disabled={loading}
                    className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <XCircle size={16} />
                    Cancel & Free Slot
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
