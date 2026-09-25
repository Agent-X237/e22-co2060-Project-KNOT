import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, Filter, ChevronLeft, ChevronRight, ClipboardList, RefreshCcw, CheckCircle2, Clock, Wrench, Shield, Camera, Coffee, X, Save, Calendar, Plus, Trash2, Mail } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

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

const formatLocationForDashboard = (loc) => {
  if (!loc) return 'Unspecified Location';
  let clean = String(loc).split('\n')[0].trim();
  clean = clean.replace(/Map Coordinates:.*$/i, '').trim();
  if (/^Map Coordinates:/i.test(clean)) {
    return 'Pinned Map Location';
  }
  clean = clean.replace(/[,-\s]+$/, '').trim();
  if (clean.length > 45 && clean.includes(',')) {
    const parts = clean.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length > 2) {
      clean = parts.slice(0, 2).join(', ');
    }
  }
  return clean || 'Unspecified Location';
};

export default function MaintenanceDashboard() {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [technicians, setTechnicians] = useState([]);
  
  // Email Notifications Log Modal State
  const [emailLogsModalOpen, setEmailLogsModalOpen] = useState(false);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loadingEmailLogs, setLoadingEmailLogs] = useState(false);

  // Technician Profile & Break Slots Modal State
  const [selectedTechProfile, setSelectedTechProfile] = useState(null);
  const [breakSlots, setBreakSlots] = useState([
    { title: 'Morning Tea', start: '10:15 AM', end: '10:30 AM' },
    { title: 'Lunch Break', start: '12:30 PM', end: '01:15 PM' },
    { title: 'Evening Break', start: '03:30 PM', end: '03:45 PM' }
  ]);
  const [savingBreak, setSavingBreak] = useState(false);
  const [breakSaveSuccess, setBreakSaveSuccess] = useState(false);

  const timeOptions = [
    '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:15 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:15 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '03:45 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
  ];

  const navigate = useNavigate();

  useEffect(() => {
    fetchData('all', search);
    fetchTechnicians();
  }, []);

  const fetchEmailLogs = async () => {
    setLoadingEmailLogs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/email-logs`);
      if (res.ok) {
        const data = await res.json();
        setEmailLogs(data);
      }
    } catch (err) {
      console.error("Error fetching email logs:", err);
    } finally {
      setLoadingEmailLogs(false);
    }
  };

  const openEmailLogsModal = () => {
    fetchEmailLogs();
    setEmailLogsModalOpen(true);
  };

  const fetchTechnicians = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/technicians`);
      if (res.ok) {
        const data = await res.json();
        setTechnicians(data);
      }
    } catch (err) {
      console.error("Failed to fetch technicians list:", err);
    }
  };

  const fetchData = async (currentStatus = statusFilter, currentSearch = search) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/tickets?limit=10`;
      if (currentStatus !== 'all') {
        url += `&status=${encodeURIComponent(currentStatus)}`;
      }
      if (currentSearch) {
        url += `&search=${encodeURIComponent(currentSearch)}`;
      }

      const [statsRes, ticketsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tickets/stats`),
        fetch(url)
      ]);
      const statsData = await statsRes.json();
      const ticketsData = await ticketsRes.json();

      setStats(statsData);
      setTickets(ticketsData.data);
      setPagination(ticketsData.pagination);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (status) => {
    setStatusFilter(status);
    fetchData(status, search);
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchData(statusFilter, val);
  };

  const handleLogout = () => {
    localStorage.removeItem('knot_user');
    navigate('/login');
  };

  const openTechProfile = (tech) => {
    setSelectedTechProfile(tech);
    const slots = tech.break_slots && Array.isArray(tech.break_slots) && tech.break_slots.length > 0
      ? tech.break_slots
      : [
          { title: 'Morning Tea', start: '10:15 AM', end: '10:30 AM' },
          { title: 'Lunch Break', start: '12:30 PM', end: '01:15 PM' },
          { title: 'Evening Break', start: '03:30 PM', end: '03:45 PM' }
        ];
    setBreakSlots(slots);
    setBreakSaveSuccess(false);
  };

  const handleAddBreakSlot = (preset) => {
    if (preset) {
      setBreakSlots(prev => [...prev, preset]);
    } else {
      setBreakSlots(prev => [
        ...prev,
        { title: `Break ${prev.length + 1}`, start: '01:00 PM', end: '01:30 PM' }
      ]);
    }
  };

  const handleRemoveBreakSlot = (index) => {
    setBreakSlots(prev => prev.filter((_, i) => i !== index));
  };

  const handleSlotChange = (index, field, value) => {
    setBreakSlots(prev => prev.map((slot, i) => i === index ? { ...slot, [field]: value } : slot));
  };

  const handleSaveBreakSchedule = async () => {
    if (!selectedTechProfile) return;
    setSavingBreak(true);
    try {
      const firstSlot = breakSlots[0] || { start: '12:30 PM', end: '01:15 PM' };
      const res = await fetch(`${API_BASE_URL}/api/admin/technicians/${selectedTechProfile.id}/break`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          break_start: firstSlot.start,
          break_end: firstSlot.end,
          break_slots: breakSlots
        })
      });
      if (res.ok) {
        setBreakSaveSuccess(true);
        // update local state
        setTechnicians(prev => prev.map(t => t.id === selectedTechProfile.id ? { 
          ...t, 
          break_start: firstSlot.start, 
          break_end: firstSlot.end,
          break_slots: breakSlots
        } : t));
        setTimeout(() => setBreakSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error("Failed to save break schedule:", err);
      alert("Failed to save break schedule.");
    } finally {
      setSavingBreak(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCcw className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col w-full font-display">
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-slate-900 backdrop-blur-md border-b border-slate-800 px-4 py-3 text-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
             <img src="/knot_logo_white.png" alt="KNOT Logo" className="h-20 scale-[1.7] origin-left object-contain -ml-2 -my-4" />
          </div>
          <div className="flex items-center gap-4">
             <button onClick={openEmailLogsModal} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors shadow-sm" title="Email Dispatch Logs">
               <Mail size={15} className="text-primary" />
               <span>Email Logs</span>
             </button>
             <button onClick={() => { fetchData(statusFilter, search); fetchTechnicians(); }} className="p-2 text-slate-400 hover:text-white transition-colors" title="Refresh">
               <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
             </button>
             <button onClick={handleLogout} className="p-2 text-red-400 rounded-full hover:bg-red-500/20 transition-colors" title="Logout">
               <span className="material-symbols-outlined">logout</span>
             </button>
             <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-md hover:opacity-90 transition-opacity" title="My Profile">
                 <User size={20} />
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pb-24 pt-8">
        <section className="py-2 mb-4">
          <span className="text-[10px] bg-primary/10 text-primary font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">Facilities Management Control</span>
          <h1 className="text-3xl font-bold leading-tight mt-1">Maintenance<br />Management Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Click technician names below to manage everyday break slots and view technician profiles.</p>
        </section>

        {/* Top Summary Stat Cards */}
        {stats && (
          <section className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div 
                onClick={() => handleTabChange('Open')}
                className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-5 flex items-center gap-4 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'Open' ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-slate-100 dark:border-slate-700'
                }`}
              >
                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center shrink-0">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Open Tickets</h3>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{stats.open}</p>
                </div>
              </div>
              
              <div 
                onClick={() => handleTabChange('In Progress')}
                className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-5 flex items-center gap-4 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'In Progress' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-100 dark:border-slate-700'
                }`}
              >
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center shrink-0">
                  <RefreshCcw size={24} className="animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">In Progress Work</h3>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{stats.inProgress}</p>
                </div>
              </div>

              <div 
                onClick={() => handleTabChange('Resolved')}
                className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-5 flex items-center gap-4 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'Resolved' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-slate-100 dark:border-slate-700'
                }`}
              >
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-950/40 text-green-500 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Done / Resolved Work</h3>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{stats.resolvedToday}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Active Duty Technicians Roster Card (Click to open profile & break slots modal) */}
        {technicians.length > 0 && (
          <section className="mb-8">
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Wrench size={16} className="text-primary" /> Active Duty Technicians & Workers (Click name to add/edit break slots)
                </h3>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                  {technicians.length} Duty Technicians
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {technicians.map(tech => (
                  <div 
                    key={tech.id} 
                    onClick={() => openTechProfile(tech)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 rounded-xl flex items-center justify-between cursor-pointer hover:border-primary/50 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20">
                        {tech.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5 hover:text-primary transition-colors">
                          <span>{tech.name}</span>
                          <span className="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 px-1.5 py-0.2 rounded font-mono">
                            #KN-{1000 + tech.id}
                          </span>
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-medium">{tech.department || 'Facilities'}</span>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded">
                            <Coffee size={10} /> {tech.break_slots ? `${tech.break_slots.length} Break Slots` : `${tech.break_start || '12:30 PM'}–${tech.break_end || '01:15 PM'}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      {(() => {
                        const breakInfo = isTechnicianOnBreak(tech);
                        if (breakInfo.isOnBreak) {
                          return (
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> On Break ({breakInfo.activeSlot?.title || 'Break'})
                            </span>
                          );
                        }
                        return (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Active Shift
                          </span>
                        );
                      })()}
                      <span className="text-[9px] text-primary font-bold hover:underline">+ Add / Edit Break Slots →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Maintenance Work Items Table */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold">Maintenance Work Items</h2>
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => handleTabChange('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                All Work
              </button>

              <button
                onClick={() => handleTabChange('In Progress')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border whitespace-nowrap ${
                  statusFilter === 'In Progress'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100'
                }`}
              >
                <RefreshCcw size={13} className={statusFilter === 'In Progress' ? 'animate-spin' : ''} />
                In Progress Work ({stats?.inProgress || 0})
              </button>

              <button
                onClick={() => handleTabChange('Resolved')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border whitespace-nowrap ${
                  statusFilter === 'Resolved'
                    ? 'bg-green-600 text-white border-green-600 shadow-sm'
                    : 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-100'
                }`}
              >
                <CheckCircle2 size={13} />
                Done Work ({stats?.resolvedToday || 0})
              </button>

              <button
                onClick={() => handleTabChange('Open')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border whitespace-nowrap ${
                  statusFilter === 'Open'
                    ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                    : 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200 dark:border-orange-800 hover:bg-orange-100'
                }`}
              >
                <ClipboardList size={13} />
                Open ({stats?.open || 0})
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                className="w-full border border-slate-200 bg-white rounded-xl py-3 pl-4 pr-10 text-sm focus:border-primary shadow-sm outline-none transition-colors dark:bg-slate-800 dark:border-slate-700"
                placeholder="Search locations, issues, technicians, or status..."
                value={search}
                onChange={handleSearch}
              />
            </div>
          </div>

          {/* Tickets List */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="hidden sm:flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div className="flex-[2]">Location & Issue</div>
              <div className="flex-1 text-center">Duty Technician</div>
              <div className="flex-1 text-center">Work Status</div>
              <div className="flex-1 text-right">Reported By</div>
            </div>

            {tickets.map((ticket, index) => (
              <Link to={`/admin/ticket/${ticket.id}`} key={ticket.id} className={`block p-4 sm:flex items-center justify-between transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${index !== tickets.length - 1 ? 'border-b border-slate-50 dark:border-slate-700' : ''}`}>
                <div className="flex-[2] mb-3 sm:mb-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span> {formatLocationForDashboard(ticket.location)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      ticket.priority === 'High' ? 'bg-red-100 text-red-700' :
                      ticket.priority === 'Medium' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {ticket.priority}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{ticket.title}</h3>
                  
                  {ticket.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                       <span className="font-bold text-slate-500">Issue:</span> {ticket.description}
                    </p>
                  )}

                  {/* Technician proof photo pill */}
                  {ticket.worker_photo && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Camera size={11} /> Photo Proof Uploaded by Tech
                      </span>
                      {ticket.admin_verified && (
                        <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Shield size={11} /> Admin Verified
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Technician Assignment */}
                <div className="flex-1 flex sm:justify-center mb-2 sm:mb-0">
                  {ticket.assigned_technician_name ? (
                    <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-bold rounded-lg flex items-center gap-1 border border-blue-100 dark:border-blue-900/40">
                      <Wrench size={12} /> {ticket.assigned_technician_name}
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 text-[11px] font-bold rounded-lg">
                      Unassigned
                    </span>
                  )}
                </div>

                {/* Work Status */}
                <div className="flex-1 flex sm:justify-center mb-2 sm:mb-0">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    ticket.status === 'Resolved' ? 'bg-green-100 text-green-700 border border-green-200' :
                    ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                    'bg-orange-100 text-orange-700 border border-orange-200'
                  }`}>
                    {ticket.status === 'Resolved' && <CheckCircle2 size={13} />}
                    {ticket.status === 'In Progress' && <RefreshCcw size={13} className="animate-spin" />}
                    {ticket.status === 'Open' && <Clock size={13} />}
                    {ticket.status === 'Resolved' ? 'Done Work' : (ticket.status || 'Open')}
                  </span>
                </div>
                
                <div className="flex-1 flex flex-col sm:items-end text-left sm:text-right">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{ticket.reported_by}</span>
                  <span className="text-[11px] font-medium text-slate-500 mt-0.5">{new Date(ticket.reported_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </Link>
            ))}
            
            {tickets.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  No tickets found matching your selection ({statusFilter !== 'all' ? statusFilter : 'all tickets'}).
                </div>
            )}
          </div>

          {pagination && tickets.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
              <span className="text-xs font-bold text-slate-500">Showing {tickets.length} of {pagination.total} tickets</span>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <button className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-50" disabled><ChevronLeft size={16} /></button>
                <button className="w-8 h-8 rounded-md bg-primary text-white text-sm font-bold flex items-center justify-center">1</button>
                <button className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </section>

        <div className="text-center text-xs font-medium text-slate-400 py-6">
          © 2026 KNOT Platform - Maintenance Management Portal.<br />All rights reserved.
        </div>
      </main>

      {/* Technician Profile & Break Slots Management Popup Window */}
      {selectedTechProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary border-2 border-primary/20 flex items-center justify-center text-lg font-bold">
                  {selectedTechProfile.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{selectedTechProfile.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono font-bold px-2 py-0.5 rounded">
                      Worker ID: #KN-{1000 + selectedTechProfile.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Technician</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTechProfile(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Department & Shift Status */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Department</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTechProfile.department || 'Facilities Management'}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Shift Active
              </div>
            </div>

            {/* Multi Break Slots Schedule Section */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Coffee size={16} className="text-amber-500" />
                  <span>Configured Everyday Break Slots ({breakSlots.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddBreakSlot()}
                  className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <Plus size={14} /> Add Break Slot
                </button>
              </div>

              {/* Break Slots List */}
              <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
                {breakSlots.map((slot, index) => (
                  <div key={index} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl flex flex-col gap-2 relative">
                    <div className="flex justify-between items-center gap-2">
                      <input
                        type="text"
                        placeholder="Break Name (e.g. Lunch Break, Tea Break)"
                        value={slot.title}
                        onChange={(e) => handleSlotChange(index, 'title', e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveBreakSlot(index)}
                        className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Remove Break Slot"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Start Time</label>
                        <select
                          value={slot.start}
                          onChange={(e) => handleSlotChange(index, 'start', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                        >
                          {timeOptions.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">End Time</label>
                        <select
                          value={slot.end}
                          onChange={(e) => handleSlotChange(index, 'end', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                        >
                          {timeOptions.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Preset Quick Addition Buttons */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => handleAddBreakSlot({ title: 'Morning Tea', start: '10:15 AM', end: '10:30 AM' })}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                >
                  + Morning Tea (10:15 AM)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBreakSlot({ title: 'Lunch Break', start: '12:30 PM', end: '01:15 PM' })}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100"
                >
                  + Lunch Break (12:30 PM)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBreakSlot({ title: 'Evening Break', start: '03:30 PM', end: '03:45 PM' })}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                >
                  + Evening Break (03:30 PM)
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveBreakSchedule}
              disabled={savingBreak}
              className="w-full bg-primary text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:bg-primary/95 transition-all disabled:opacity-50"
            >
              <Save size={16} />
              {savingBreak ? 'Saving Break Slots...' : breakSaveSuccess ? '✓ Break Slots Schedule Saved!' : 'Save Everyday Break Slots'}
            </button>
          </div>
        </div>
      )}

      {/* Email Notification Activity Log Modal */}
      {emailLogsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Email Notification Dispatches</h3>
                  <p className="text-xs text-slate-500">Live logs of all emails sent for maintenance requests, assignments, and updates.</p>
                </div>
              </div>
              <button 
                onClick={() => setEmailLogsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {loadingEmailLogs ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCcw size={24} className="animate-spin text-primary" />
                </div>
              ) : emailLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Mail size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold">No email dispatches recorded yet.</p>
                  <p className="text-xs text-slate-500 mt-1">Emails will appear here automatically when tickets are created, assigned, or updated.</p>
                </div>
              ) : (
                emailLogs.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          log.event_type === 'TICKET_CREATED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-300 dark:border-amber-800' :
                          log.event_type === 'TECHNICIAN_ASSIGNED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-300 dark:border-blue-800' :
                          log.event_type === 'NEXT_STEP_SENT' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-300 dark:border-purple-800' :
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                        }`}>
                          {log.event_type?.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{log.recipient_email}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(log.sent_at).toLocaleString()}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">{log.subject}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80 font-mono text-[11px]">
                      {log.message_body}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
              <button 
                onClick={fetchEmailLogs}
                className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
              >
                <RefreshCcw size={12} /> Refresh Activity Logs
              </button>
              <button 
                onClick={() => setEmailLogsModalOpen(false)}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
