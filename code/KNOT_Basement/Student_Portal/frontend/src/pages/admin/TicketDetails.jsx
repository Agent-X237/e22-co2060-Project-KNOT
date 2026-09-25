import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, MapPin, User, Check, Users, CheckCircle2, Save, RefreshCcw, Shield, Eye, Camera, Clock, Wrench, Send, AlertCircle, FileText } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { API_BASE_URL } from '../../config/api';

// Fix Leaflet's default icon rendering issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const str = String(timeStr).trim();

  const matchColon = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (matchColon) {
    let hours = parseInt(matchColon[1], 10);
    const mins = parseInt(matchColon[2], 10);
    const period = matchColon[3];

    if (period) {
      if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    } else if (hours < 7) {
      hours += 12;
    }
    return hours * 60 + mins;
  }

  const matchHour = str.match(/^(\d{1,2})\s*(AM|PM)?$/i);
  if (matchHour) {
    let hours = parseInt(matchHour[1], 10);
    const period = matchHour[2];
    if (period) {
      if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    } else if (hours < 7) {
      hours += 12;
    }
    return hours * 60;
  }

  return null;
};

const isTechnicianOnBreak = (tech) => {
  if (!tech) return { isOnBreak: false };

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const slots = Array.isArray(tech.break_slots) && tech.break_slots.length > 0
    ? tech.break_slots
    : [{ title: 'Break', start: tech.break_start || '12:30 PM', end: tech.break_end || '01:15 PM' }];

  for (const slot of slots) {
    const startMins = parseTimeToMinutes(slot.start);
    const endMins = parseTimeToMinutes(slot.end);

    if (startMins !== null && endMins !== null) {
      if (startMins <= endMins) {
        if (nowMins >= startMins && nowMins <= endMins) {
          return { isOnBreak: true, activeSlot: slot };
        }
      } else {
        if (nowMins >= startMins || nowMins <= endMins) {
          return { isOnBreak: true, activeSlot: slot };
        }
      }
    }
  }

  return { isOnBreak: false };
};

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [managerNotes, setManagerNotes] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [assignedTechId, setAssignedTechId] = useState('');
  const [adminVerified, setAdminVerified] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  useEffect(() => {
    fetchTicket();
    fetchTechnicians();
  }, [id]);

  const fetchTechnicians = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/technicians`);
      const data = await res.json();
      setTechnicians(data);
    } catch (err) {
      console.error("Error fetching technicians:", err);
    }
  };

  const fetchTicket = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${id}`);
      const data = await res.json();
      setTicket(data);
      setStatus(data.status);
      setNotes(data.maintenance_notes || '');
      setManagerNotes(data.manager_notes || '');
      setAssignedTechId(data.assigned_technician_id || '');
      setAdminVerified(data.admin_verified || false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTechnicianSelect = async (newTechId) => {
    setAssignedTechId(newTechId);
    setSaving(true);
    setSaveSuccess(false);
    try {
      const targetTechId = newTechId === '' ? null : Number(newTechId);
      const newStatus = (targetTechId && status === 'Open') ? 'In Progress' : status;

      const res = await fetch(`${API_BASE_URL}/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus, 
          assigned_technician_id: targetTechId,
          maintenance_notes: notes,
          manager_notes: managerNotes,
          admin_verified: adminVerified
        })
      });
      if (res.ok) {
        if (newStatus !== status) setStatus(newStatus);
        setSaveSuccess(true);
        setActionNotice(targetTechId ? 'Duty technician assigned & notified via email!' : 'Technician assignment cleared.');
        await fetchTicket();
        setTimeout(() => { setSaveSuccess(false); setActionNotice(''); }, 2500);
      }
    } catch (err) {
      console.error("Error saving technician assignment", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          maintenance_notes: notes,
          manager_notes: managerNotes,
          assigned_technician_id: assignedTechId === '' ? null : Number(assignedTechId),
          admin_verified: adminVerified
        })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setActionNotice('Manager changes saved successfully!');
        await fetchTicket();
        setTimeout(() => { setSaveSuccess(false); setActionNotice(''); }, 2500);
      }
    } catch (err) {
      console.error("Error saving ticket", err);
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyCompletion = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Resolved',
          admin_verified: true,
          manager_notes: managerNotes,
          assigned_technician_id: assignedTechId === '' ? null : Number(assignedTechId)
        })
      });
      if (res.ok) {
        setAdminVerified(true);
        setStatus('Resolved');
        setSaveSuccess(true);
        setActionNotice('Ticket confirmed & verified as solved!');
        await fetchTicket();
        setTimeout(() => { setSaveSuccess(false); setActionNotice(''); }, 2500);
      }
    } catch (err) {
      console.error("Error verifying ticket", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSendNextStep = async () => {
    if (!managerNotes.trim()) {
      alert("Please enter instructions in the 'Manager Instructions & Next Steps' box below before sending to the technician.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'In Progress',
          manager_notes: managerNotes,
          admin_verified: false,
          assigned_technician_id: assignedTechId === '' ? null : Number(assignedTechId)
        })
      });
      if (res.ok) {
        setStatus('In Progress');
        setAdminVerified(false);
        setSaveSuccess(true);
        setActionNotice('Next resolving step sent to technician!');
        await fetchTicket();
        setTimeout(() => { setSaveSuccess(false); setActionNotice(''); }, 2500);
      }
    } catch (err) {
      console.error("Error sending next resolving step", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCcw className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!ticket) {
    return <div className="p-8 text-center text-slate-500">Ticket not found</div>;
  }

  const steps = ['Open', 'In Progress', 'Resolved'];
  const currentStepIndex = steps.indexOf(status);

  // Determine if initial work circle is complete (technician has submitted solvation notes/photo or ticket is resolved)
  const isSolvationSubmitted = Boolean(
    ticket.maintenance_notes || 
    ticket.worker_photo || 
    ticket.admin_verified || 
    ticket.status === 'Resolved'
  );

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col w-full font-display">
      <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 px-4 py-4 flex items-center justify-between text-white shadow-md">
        <button className="flex items-center gap-2 hover:opacity-80 transition-opacity" onClick={() => navigate('/admin')}>
          <ArrowLeft size={20} />
          <span className="font-bold">Ticket Details</span>
        </button>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
            ticket.priority === 'High' ? 'bg-red-500/20 text-red-400' :
            ticket.priority === 'Medium' ? 'bg-orange-500/20 text-orange-400' :
            'bg-slate-700 text-slate-300'
          }`}>
            {ticket.priority} PRIORITY
          </span>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-6 pb-24">
        
        {actionNotice && (
          <div className="mb-4 bg-emerald-500 text-white font-bold p-3 rounded-xl text-center text-sm shadow-md animate-bounce">
            ✓ {actionNotice}
          </div>
        )}

        {/* Phase Banner */}
        {!isSolvationSubmitted ? (
          <div className="mb-6 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Wrench size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200">Initial Work Circle: Assign Duty Technician</h3>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                This maintenance request is in the initial stage. Please assign an available duty technician below to dispatch this task. Once the technician completes the work and submits their solvation proof, the Manager Review & Verification options will be unlocked.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Technician Solvation Submitted for Manager Review</h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">
                Technician <strong>{ticket.assigned_technician_name || 'duty technician'}</strong> has submitted work notes and solvation proof. Compare the Before & After results below and either confirm verification or send next step instructions.
              </p>
            </div>
          </div>
        )}

        {/* Ticket Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-sm font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 rounded uppercase">
              #{ticket.ticket_number || `TKT-${ticket.id}`}
            </span>
            <div className="text-xs font-bold text-slate-400 uppercase">
              Reported on <span className="text-primary">{new Date(ticket.reported_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {adminVerified && (
              <span className="bg-emerald-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1">
                <Shield size={10} /> Verified by Admin
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold leading-tight mt-1">{ticket.title}</h1>
        </div>

        {/* Reporter & Location Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 text-primary flex items-center justify-center">
              <MapPin size={16} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location</label>
              <p className="text-sm font-bold leading-snug mt-0.5 whitespace-pre-line">{ticket.location}</p>
              
              {ticket.location && ticket.location.includes('Map Coordinates: ') && (() => {
                const coordsString = ticket.location.split('Map Coordinates: ')[1];
                const [lat, lng] = coordsString.split(',').map(Number);
                if (lat && lng) {
                  return (
                    <div className="h-40 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative z-0 mt-3 block">
                      <MapContainer center={[lat, lng]} zoom={16} scrollWheelZoom={false} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[lat, lng]} />
                      </MapContainer>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <User size={16} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reported By</label>
              <p className="text-sm font-bold leading-snug mt-0.5">{ticket.reported_by}</p>
            </div>
          </div>
        </div>

        {/* Initial Reported Issue Details */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <h2 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            <AlertCircle size={16} className="text-amber-500" />
            Reported Issue Details & Photo
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Camera size={12} /> Initial Photo (Reported Issue)
              </span>
              {ticket.photo_url ? (
                <div className="h-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 overflow-hidden flex items-center justify-center">
                  <img src={ticket.photo_url} alt="Reported Issue" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-xs text-slate-400 font-semibold border border-slate-200 dark:border-slate-700 rounded-xl italic">
                  No photo uploaded with initial report
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <FileText size={12} /> Reported Description
              </span>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-medium h-48 overflow-y-auto">
                {ticket.description || 'No initial description provided.'}
              </p>
            </div>
          </div>
        </section>

        {/* ─── TECHNICIAN ASSIGNMENT SECTION (PRIMARY IN INITIAL WORK CIRCLE) ─── */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <h2 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            <Wrench size={16} className="text-primary" />
            Assign Duty Technician
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Select a qualified technician from the directory below to assign and dispatch this maintenance work order.
          </p>
          <select
            value={assignedTechId}
            onChange={(e) => handleTechnicianSelect(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium mb-3"
          >
            <option value="">— Select Technician to Assign —</option>
            {technicians.map(t => {
              const breakCheck = isTechnicianOnBreak(t);
              return (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.department || 'Facilities Management'}) {breakCheck.isOnBreak ? `[☕ ON BREAK: ${breakCheck.activeSlot?.title || 'Break'}]` : '— ⚡ Active Shift'}
                </option>
              );
            })}
          </select>

          {ticket.assigned_technician_name && (
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl px-4 py-3">
              <span className="flex items-center gap-2 text-primary font-bold">
                <Users size={16} /> Assigned Technician: {ticket.assigned_technician_name}
              </span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold px-2.5 py-1 rounded-md">
                Active Technician
              </span>
            </div>
          )}
        </section>

        {/* ─── SECOND STAGE: TECHNICIAN SOLVATION REVIEW & MANAGER VERIFICATION ─── */}
        {isSolvationSubmitted ? (
          <>
            {/* Side-by-side comparison */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-700 pb-3 flex-wrap gap-2">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  <Eye size={18} className="text-primary" />
                  Before & After Resolution Comparison
                </h2>
                {adminVerified ? (
                  <span className="bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Shield size={12} /> Work Verified & Confirmed
                  </span>
                ) : (
                  <span className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Clock size={12} /> Pending Manager Verification
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Before Solved */}
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-amber-500" />
                      BEFORE SOLVED (Initial Request)
                    </span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-2 py-0.5 rounded">
                      Reported Issue
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Camera size={12} /> Initial Photo (Before Solved)
                    </span>
                    {ticket.photo_url ? (
                      <div className="h-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 overflow-hidden flex items-center justify-center">
                        <img src={ticket.photo_url} alt="Before Solved" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-xs text-slate-400 font-semibold border border-slate-200 dark:border-slate-700 rounded-xl italic">
                        No photo uploaded with initial report
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <FileText size={12} /> Initial Note (Before Solved)
                    </span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 font-medium min-h-[70px]">
                      {ticket.description || 'No initial description provided.'}
                    </p>
                  </div>
                </div>

                {/* Column 2: After Solved */}
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/60 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800/60 pb-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      AFTER SOLVED (Technician Solvation)
                    </span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded">
                      Resolved Proof
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <Camera size={12} /> Resolved Photo (After Solved)
                    </span>
                    {ticket.worker_photo ? (
                      <div className="h-48 rounded-xl border-2 border-emerald-400 dark:border-emerald-600 bg-slate-900 overflow-hidden flex items-center justify-center shadow-sm">
                        <img src={ticket.worker_photo} alt="After Solved" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center bg-emerald-50/50 dark:bg-emerald-950/30 text-xs text-slate-400 font-semibold border border-dashed border-emerald-300 dark:border-emerald-800 rounded-xl italic">
                        No technician resolved photo uploaded
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 mt-1">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <FileText size={12} /> Resolved Note (After Solved)
                    </span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-800 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/60 font-mono min-h-[70px]">
                      {ticket.maintenance_notes || 'No technician work notes logged yet.'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Manager Evaluation & Action Buttons */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
              <h2 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                <Wrench size={16} className="text-primary" />
                Manager Review & Verification Options
              </h2>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Enter manager instructions or feedback below. Confirm & verify the task as completed, or send next step instructions back to the technician if further work is required.
              </p>

              <textarea 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-200 min-h-[100px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400 resize-y mb-4"
                value={managerNotes}
                onChange={(e) => setManagerNotes(e.target.value)}
                placeholder="Type manager feedback or next resolving step instructions for the technician here..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleVerifyCompletion}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  <Shield size={16} />
                  {saving ? 'Processing...' : '✓ Confirm & Verify Resolved'}
                </button>

                <button
                  onClick={handleSendNextStep}
                  disabled={saving}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
                >
                  <Send size={16} />
                  {saving ? 'Sending...' : '💬 Send Next Resolving Step'}
                </button>
              </div>
            </section>
          </>
        ) : (
          /* Locked State Banner when technician hasn't submitted solvation yet */
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 mb-6 text-center text-slate-500">
            <Shield size={28} className="mx-auto text-slate-400 mb-2" />
            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">Manager Verification Controls Locked</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              Options to <strong>Confirm & Verify Resolved</strong> or <strong>Send Next Resolving Step</strong> will activate here automatically once the assigned technician completes work and submits their solvation proof.
            </p>
          </div>
        )}

        {/* Current Work Status Stepper */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">Work Order Progress</h2>
          
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-100 dark:bg-slate-700 -z-10 rounded-full"></div>
            {steps.map((s, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={s} className="flex flex-col items-center gap-2 bg-white dark:bg-slate-800 px-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-sm transition-all ${
                    isCompleted ? 'bg-primary text-white' : 
                    isCurrent ? 'bg-white dark:bg-slate-800 border-2 border-primary text-primary' : 
                    'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  }`}>
                    {isCompleted ? <Check size={16} /> : (idx === 1 ? <Users size={16} /> : <CheckCircle2 size={16} />)}
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider font-bold ${isCurrent || isCompleted ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>{s}</span>
                </div>
              );
            })}
          </div>

          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Update Status</h2>
          <div className="flex flex-wrap gap-2">
            {steps.map(s => (
              <button 
                key={s} 
                className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                  status === s 
                    ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 transform scale-105' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
                onClick={() => setStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Save Button */}
        <button 
          className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50" 
          onClick={handleSave} 
          disabled={saving}
        >
          <Save size={20} />
          {saving ? 'Saving...' : saveSuccess ? '✓ Changes Saved!' : (!isSolvationSubmitted ? 'Save & Assign Technician' : 'Save Manager Changes')}
        </button>
      </main>
    </div>
  );
}

