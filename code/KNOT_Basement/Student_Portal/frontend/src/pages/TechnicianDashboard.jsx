import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  AlertTriangle, 
  X, 
  ChevronRight, 
  LogOut, 
  Coffee, 
  ClipboardList,
  Save,
  QrCode,
  Camera,
  Package,
  Search,
  Building,
  UploadCloud,
  Check,
  RefreshCw,
  Navigation,
  FileText,
  Zap,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon rendering issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

export default function TechnicianDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [workerPhoto, setWorkerPhoto] = useState(null);
  const [saving, setSaving] = useState(false);

  // Tab & Filter States
  const [activeTab, setActiveTab] = useState('all'); // all | in_progress | urgent | resolved
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [scannedAsset, setScannedAsset] = useState(null);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // Multi-Slot Break Schedule State (Configured by Maintenance Manager)
  const [breakSlots, setBreakSlots] = useState([
    { title: 'Morning Tea', start: '10:15 AM', end: '10:30 AM' },
    { title: 'Lunch Break', start: '12:30 PM', end: '01:15 PM' },
    { title: 'Evening Break', start: '03:30 PM', end: '03:45 PM' }
  ]);
  const [currentActiveBreak, setCurrentActiveBreak] = useState(null);

  // Inventory Mock Data
  const [inventory, setInventory] = useState([
    { id: 1, name: 'HVAC Heavy Duty Air Filter', category: 'HVAC', stock: 4, unit: 'pcs', code: 'FILT-88' },
    { id: 2, name: 'Projector Lamp (10W-LED)', category: 'AV Equipment', stock: 2, unit: 'pcs', code: 'LAMP-40' },
    { id: 3, name: 'Cat6 Ethernet Cable 10m', category: 'Networking', stock: 15, unit: 'm', code: 'CAB-610' },
    { id: 4, name: 'Fluorescent Tube 40W', category: 'Electrical', stock: 8, unit: 'tubes', code: 'TUBE-40' },
    { id: 5, name: 'HDMI Matrix 4K Switch', category: 'AV Equipment', stock: 1, unit: 'unit', code: 'HDMI-4K' },
    { id: 6, name: 'Plumbing Rubber Gaskets', category: 'Plumbing', stock: 24, unit: 'set', code: 'SEAL-12' }
  ]);

  const navigate = useNavigate();
  const userString = localStorage.getItem('knot_user');
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    if (!user || (user.role !== 'Technician' && user.role !== 'technician')) {
      navigate('/login');
      return;
    }
    fetchTickets();
    fetchTechnicianProfile();
  }, []);

  // Check if current time falls inside ANY of the assigned break slots
  useEffect(() => {
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

    const checkBreakSlotsStatus = () => {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();

      let activeBreakFound = null;

      for (const slot of breakSlots) {
        const startMins = parseTimeToMinutes(slot.start);
        const endMins = parseTimeToMinutes(slot.end);

        if (startMins !== null && endMins !== null) {
          if (startMins <= endMins) {
            if (nowMins >= startMins && nowMins <= endMins) {
              activeBreakFound = slot;
              break;
            }
          } else {
            if (nowMins >= startMins || nowMins <= endMins) {
              activeBreakFound = slot;
              break;
            }
          }
        }
      }

      setCurrentActiveBreak(activeBreakFound);
    };

    checkBreakSlotsStatus();
    const timer = setInterval(checkBreakSlotsStatus, 5000);
    return () => clearInterval(timer);
  }, [breakSlots]);

  const fetchTechnicianProfile = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/admin/technicians');
      if (res.data && Array.isArray(res.data)) {
        const me = res.data.find(t => t.id === user.id || t.username === user.username);
        if (me && me.break_slots && Array.isArray(me.break_slots) && me.break_slots.length > 0) {
          setBreakSlots(me.break_slots);
        }
      }
    } catch (err) {
      console.error("Error fetching technician profile:", err);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const techIdentifier = user?.id || user?.username || 'alex';
      const res = await axios.get(`http://localhost:5001/api/technician/tickets/${techIdentifier}`);
      setTickets(res.data);
    } catch (err) {
      console.error("Error fetching technician tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('knot_user');
    navigate('/login');
  };

  const openTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setUpdateStatus(ticket.status || 'Open');
    setUpdateNotes(ticket.maintenance_notes || '');
    setWorkerPhoto(ticket.worker_photo || null);
    setModalOpen(true);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setWorkerPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProgress = async () => {
    if (!selectedTicket) return;
    setSaving(true);
    try {
      await axios.put(`http://localhost:5001/api/technician/tickets/${selectedTicket.id}`, {
        status: updateStatus,
        maintenance_notes: updateNotes,
        worker_photo: workerPhoto
      });
      setModalOpen(false);
      fetchTickets();
    } catch (err) {
      console.error("Error updating ticket progress:", err);
      alert("Failed to update ticket progress.");
    } finally {
      setSaving(false);
    }
  };

  // Quick asset scanning simulation
  const handleScanCode = (codeToScan) => {
    const target = codeToScan || qrInput;
    if (!target.trim()) return;
    
    // Search matching ticket or mock asset
    const foundTicket = tickets.find(t => 
      (t.title || '').toLowerCase().includes(target.toLowerCase()) || 
      (t.location || '').toLowerCase().includes(target.toLowerCase()) ||
      String(t.id) === target ||
      t.ticket_number?.toLowerCase().includes(target.toLowerCase())
    );

    setScannedAsset({
      tag: target.toUpperCase(),
      name: foundTicket ? foundTicket.title : `Equipment Unit ${target}`,
      location: foundTicket ? foundTicket.location : 'Building A - Precinct West',
      status: foundTicket ? foundTicket.status : 'Operational',
      lastServiced: '2026-08-14',
      ticket: foundTicket || null
    });
  };

  const logInventoryUse = (part) => {
    if (part.stock <= 0) {
      alert("Part out of stock!");
      return;
    }
    setInventory(prev => prev.map(item => item.id === part.id ? { ...item, stock: item.stock - 1 } : item));
    if (selectedTicket) {
      setUpdateNotes(prev => (prev ? `${prev}\n• Logged 1x ${part.name} [${part.code}]` : `• Logged 1x ${part.name} [${part.code}]`));
      alert(`Used 1x ${part.name}. Appended to current maintenance notes.`);
    } else {
      alert(`Logged 1x ${part.name} used in operations.`);
    }
  };

  // KPIs
  const urgentTickets = tickets.filter(t => t.priority === 'High' && t.status !== 'Resolved');
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved');

  // Filtered Tickets
  const filteredTickets = tickets.filter(ticket => {
    const titleStr = ticket.title || '';
    const locStr = ticket.location || '';
    const matchesSearch = titleStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          locStr.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'in_progress') return matchesSearch && ticket.status === 'In Progress';
    if (activeTab === 'urgent') return matchesSearch && ticket.priority === 'High' && ticket.status !== 'Resolved';
    if (activeTab === 'resolved') return matchesSearch && ticket.status === 'Resolved';
    return matchesSearch;
  });

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen pb-28 font-sans">
      
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 bg-slate-900 backdrop-blur-md border-b border-slate-800 px-4 py-3 text-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/knot_logo_white.png" alt="KNOT Logo" className="h-20 scale-[1.7] origin-left object-contain -ml-2 -my-4" />
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { fetchTickets(); fetchTechnicianProfile(); }}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh Tickets"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-full text-red-400 hover:bg-red-500/20 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
            <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md hover:opacity-90 transition-opacity" title="My Profile">
              {user?.name?.charAt(0) || 'A'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
        
        {/* Welcome Header */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">{user?.department || 'Facilities Management'}</span>
            <h2 className="text-2xl font-bold mt-2">Welcome, {user?.name || 'Alex Johnson'}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentActiveBreak ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${currentActiveBreak ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              </span>
              <span className={`text-xs font-bold ${currentActiveBreak ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {currentActiveBreak ? `On Scheduled Break: ${currentActiveBreak.title} (${currentActiveBreak.start} – ${currentActiveBreak.end})` : 'Shift Active • Engineering Precinct'}
              </span>
            </div>
          </div>

          {/* Everyday Configured Break Slots Display */}
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl flex flex-col gap-1.5 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <Coffee size={15} className="text-amber-500" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Manager Scheduled Break Slots</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {breakSlots.map((slot, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <span className="text-primary">{slot.title}:</span>
                  <span>{slot.start} – {slot.end}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Status Cards: Bento Layout */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            onClick={() => setActiveTab('all')}
            className={`cursor-pointer bg-white dark:bg-slate-900 border p-5 rounded-2xl shadow-sm flex flex-col justify-between transition-all ${
              activeTab === 'all' ? 'border-primary ring-2 ring-primary/20' : 'border-slate-100 dark:border-slate-800'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-primary flex items-center justify-center mb-2">
              <Wrench size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Tasks</p>
              <p className="text-3xl font-extrabold mt-1 text-slate-800 dark:text-slate-200">
                {String(tickets.length).padStart(2, '0')}
              </p>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('in_progress')}
            className={`cursor-pointer bg-white dark:bg-slate-900 border p-5 rounded-2xl shadow-sm flex flex-col justify-between transition-all ${
              activeTab === 'in_progress' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-100 dark:border-slate-800'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-500 flex items-center justify-center mb-2">
              <Zap size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">In Progress</p>
              <p className="text-3xl font-extrabold mt-1 text-blue-600 dark:text-blue-400">
                {String(tickets.filter(t => t.status === 'In Progress').length).padStart(2, '0')}
              </p>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('urgent')}
            className={`cursor-pointer bg-white dark:bg-slate-900 border p-5 rounded-2xl shadow-sm flex flex-col justify-between transition-all ${
              activeTab === 'urgent' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-100 dark:border-slate-800'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-500 flex items-center justify-center mb-2">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Urgent Tasks</p>
              <p className="text-3xl font-extrabold mt-1 text-red-600 dark:text-red-400">
                {String(urgentTickets.length).padStart(2, '0')}
              </p>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('resolved')}
            className={`cursor-pointer bg-white dark:bg-slate-900 border p-5 rounded-2xl shadow-sm flex flex-col justify-between transition-all ${
              activeTab === 'resolved' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-100 dark:border-slate-800'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center mb-2">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Resolved</p>
              <p className="text-3xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">
                {String(resolvedTickets.length).padStart(2, '0')}
              </p>
            </div>
          </div>
        </section>

        {/* Quick Tools Row */}
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Quick Action Tools</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button 
              onClick={() => setQrModalOpen(true)}
              className="flex items-center justify-center gap-3 bg-primary text-white py-3.5 px-6 rounded-2xl shadow-md hover:bg-primary/95 active:scale-95 transition-all text-xs font-bold"
            >
              <QrCode size={18} />
              <span>Scan QR / Asset Lookup</span>
            </button>
            <button 
              onClick={() => setInventoryModalOpen(true)}
              className="flex items-center justify-center gap-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 py-3.5 px-6 rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all text-xs font-bold"
            >
              <Package size={18} className="text-blue-500" />
              <span>Check Spares Inventory</span>
            </button>
            <button 
              onClick={() => setLocationModalOpen(true)}
              className="flex items-center justify-center gap-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 py-3.5 px-6 rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all text-xs font-bold"
            >
              <Navigation size={18} className="text-emerald-500" />
              <span>Precinct Map & Location</span>
            </button>
          </div>
        </section>

        {/* Work Orders List & Search */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-lg font-bold">Assigned Work Orders</h3>
              <p className="text-xs text-slate-400 font-medium">Click on any ticket to update maintenance progress & photo proof</p>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Work Status Filter Tabs */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
            {[
              { id: 'all', label: 'All Tasks', count: tickets.length },
              { id: 'in_progress', label: 'In Progress', count: tickets.filter(t => t.status === 'In Progress').length },
              { id: 'urgent', label: 'Urgent (High)', count: urgentTickets.length },
              { id: 'resolved', label: 'Resolved', count: resolvedTickets.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-12 flex justify-center items-center">
              <span className="animate-pulse text-slate-400 font-semibold text-xs flex items-center gap-2">
                <RefreshCw size={16} className="animate-spin text-primary" /> Retrieving work orders...
              </span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm">No tasks found</h4>
                <p className="text-xs text-slate-400 mt-1">No maintenance tickets matching your filter criteria.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredTickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  onClick={() => openTicketModal(ticket)}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex gap-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer shadow-sm relative overflow-hidden"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    ticket.status === 'Resolved' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500' :
                    ticket.status === 'In Progress' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-500' :
                    'bg-amber-50 dark:bg-amber-950/20 text-amber-500'
                  }`}>
                    <Wrench size={22} />
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{ticket.title}</h4>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                        ticket.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                        ticket.priority === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {ticket.priority} Priority
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-400 font-semibold">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        <span className="truncate max-w-[180px]">{ticket.location?.split('\n')[0] || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        <span>{ticket.reported_at ? new Date(ticket.reported_at).toLocaleDateString() : 'Today'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${
                          ticket.status === 'Resolved' ? 'bg-emerald-500' :
                          ticket.status === 'In Progress' ? 'bg-blue-500' :
                          'bg-amber-500'
                        }`}></span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{ticket.status}</span>
                      </div>
                      {ticket.worker_photo && (
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded">
                          ✓ Photo Proof Uploaded
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={18} className="text-slate-300 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Ticket Details & Update Progress Modal */}
      {modalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">#{selectedTicket.ticket_number || `TKT-${selectedTicket.id}`}</span>
                <h3 className="text-lg font-bold mt-1.5 text-slate-900 dark:text-slate-100">{selectedTicket.title}</h3>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Ticket Info & Interactive Map Location Pin */}
            <div className="flex flex-col gap-2.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-primary shrink-0" />
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{formatLocationForDashboard(selectedTicket.location)}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={14} className="text-slate-400 shrink-0" />
                <span>Reported by: <span className="font-semibold">{selectedTicket.reported_by}</span></span>
              </div>
              {selectedTicket.description && (
                <div className="mt-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Description</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{selectedTicket.description}</p>
                </div>
              )}

              {/* Interactive Map Location View for Technician */}
              {selectedTicket.location && (() => {
                let lat = 7.2543;
                let lng = 80.5921;
                let hasExactCoords = false;

                if (selectedTicket.location.includes('Map Coordinates: ')) {
                  const coordsString = selectedTicket.location.split('Map Coordinates: ')[1];
                  const parts = coordsString.split(',').map(Number);
                  if (parts[0] && parts[1]) {
                    lat = parts[0];
                    lng = parts[1];
                    hasExactCoords = true;
                  }
                }

                return (
                  <div className="mt-2 flex flex-col gap-1 border-t border-slate-200 dark:border-slate-800 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <MapPin size={12} className="text-primary" /> Interactive Map Location Pin {hasExactCoords ? '(GPS Coordinates Pin)' : '(Campus Precinct Pin)'}
                      </span>
                      <span className="text-[9px] bg-primary/10 text-primary font-mono font-bold px-2 py-0.5 rounded">
                        {lat.toFixed(4)}°, {lng.toFixed(4)}°
                      </span>
                    </div>
                    <div className="h-44 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative z-0 mt-1 block shadow-sm">
                      <MapContainer key={`tech-map-${selectedTicket.id}`} center={[lat, lng]} zoom={16} scrollWheelZoom={false} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                        <TileLayer
                          attribution='&copy; OpenStreetMap contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[lat, lng]} />
                      </MapContainer>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Manager Instructions / Next Resolving Step from Manager */}
            {selectedTicket.manager_notes && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 p-4 rounded-xl flex flex-col gap-1.5 shadow-sm">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-amber-600" />
                  Manager Instructions & Next Resolving Step
                </span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-amber-200 dark:border-amber-800/40 font-sans">
                  {selectedTicket.manager_notes}
                </p>
              </div>
            )}

            {/* Reported Photo if available */}
            {selectedTicket.photo_url && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reported Issue Photo</span>
                <img 
                  src={selectedTicket.photo_url} 
                  alt="Issue" 
                  className="w-full h-36 object-cover rounded-xl border border-slate-200 dark:border-slate-800" 
                />
              </div>
            )}

            {/* Status Selector */}
            <div className="flex flex-col gap-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Update Work Status</h4>
              <div className="flex gap-2">
                {['Open', 'In Progress', 'Resolved'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setUpdateStatus(s)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                      updateStatus === s
                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Maintenance Notes */}
            <div className="flex flex-col gap-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Maintenance Notes & Actions Taken</h4>
              <textarea
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                placeholder="Log actions taken, materials used, or diagnosis details..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none min-h-[80px] resize-none"
              />
            </div>

            {/* Upload Proof of Work Photo */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proof of Completion Photo</h4>
                <button
                  type="button"
                  onClick={() => setInventoryModalOpen(true)}
                  className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                >
                  + Add Spares Used
                </button>
              </div>

              {workerPhoto ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <img src={workerPhoto} alt="Work Proof" className="w-full h-40 object-cover" />
                  <button 
                    onClick={() => setWorkerPhoto(null)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow-md hover:bg-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-950/50">
                  <Camera size={24} className="text-primary mb-1" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Upload Completion Photo</span>
                  <span className="text-[10px] text-slate-400">Click to capture or upload image proof</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSaveProgress}
                disabled={saving}
                className="flex-1 bg-primary text-white py-3.5 rounded-xl font-bold text-xs shadow-lg shadow-primary/10 flex items-center justify-center gap-2 hover:bg-primary/95 transition-all disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Updates'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code / Asset Lookup Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <QrCode size={20} className="text-primary" />
                <h3 className="text-base font-bold">QR / Asset Tag Scanner</h3>
              </div>
              <button onClick={() => setQrModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Simulated Camera Viewfinder */}
            <div className="bg-slate-900 rounded-2xl h-48 relative overflow-hidden flex flex-col items-center justify-center border-2 border-primary/40">
              <div className="absolute inset-8 border-2 border-dashed border-primary/80 rounded-xl animate-pulse flex items-center justify-center">
                <div className="w-full h-0.5 bg-primary/80 animate-bounce"></div>
              </div>
              <Camera size={36} className="text-primary/40 mb-2" />
              <p className="text-xs font-bold text-slate-300">Align QR Code within frame</p>
            </div>

            {/* Manual Asset Tag Input */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Or Enter Asset Tag / Equipment Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. AC-402, PRJ-01, HVAC-B4"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={() => handleScanCode(qrInput)}
                  className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Lookup
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex gap-2">
              {['Projector', 'HVAC', 'AC-402'].map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setQrInput(tag);
                    handleScanCode(tag);
                  }}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-bold"
                >
                  Tag: {tag}
                </button>
              ))}
            </div>

            {/* Scanned Asset Details */}
            {scannedAsset && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 p-4 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-xs text-primary">{scannedAsset.name}</h4>
                  <span className="text-[9px] bg-primary text-white font-bold px-2 py-0.5 rounded-full">{scannedAsset.tag}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">📍 Location: {scannedAsset.location}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">🔧 Status: <span className="font-bold">{scannedAsset.status}</span></p>
                {scannedAsset.ticket && (
                  <button 
                    onClick={() => {
                      setQrModalOpen(false);
                      openTicketModal(scannedAsset.ticket);
                    }}
                    className="mt-1 bg-primary text-white py-1.5 px-3 rounded-lg text-xs font-bold"
                  >
                    Open Active Work Order #{scannedAsset.ticket.id}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spares Inventory Modal */}
      {inventoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Package size={20} className="text-blue-500" />
                <h3 className="text-base font-bold">Facilities Spares Inventory</h3>
              </div>
              <button onClick={() => setInventoryModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-500">Log materials and spare parts used during maintenance jobs.</p>

            <div className="flex flex-col gap-2">
              {inventory.map(item => (
                <div 
                  key={item.id}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3 rounded-xl flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">{item.name}</h4>
                    <p className="text-[10px] text-slate-400">Code: {item.code} • Category: {item.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                      item.stock <= 2 ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    }`}>
                      {item.stock} {item.unit} left
                    </span>
                    <button
                      onClick={() => logInventoryUse(item)}
                      className="bg-primary text-white px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-primary/90"
                    >
                      Use Part
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Precinct Map / Location Guide Modal */}
      {locationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Navigation size={20} className="text-emerald-500" />
                <h3 className="text-base font-bold">Campus Precinct & Key Location</h3>
              </div>
              <button onClick={() => setLocationModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative flex flex-col">
              <div className="h-44 w-full relative z-0">
                <MapContainer center={[7.2543, 80.5921]} zoom={16} scrollWheelZoom={false} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[7.2543, 80.5921]} />
                </MapContainer>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200">University Faculty of Engineering</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Building A • Drawing Offices • EOE Hall • Computer Labs</p>
                <div className="mt-2 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <MapPin size={11} /> Live Coordinates: 7.2543° N, 80.5921° E
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">Keycard & Access Notes:</p>
              <p>Master Keycard #TECH-04 grants access to Electrical Racks, HVAC Roof Deck, and Server Room A.</p>
            </div>
          </div>
        </div>
      )}

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-45 flex justify-around items-center px-2 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-lg">
        <button 
          onClick={() => {
            setActiveTab('all');
            setSearchQuery('');
          }}
          className={`flex flex-col items-center justify-center px-4 py-1 ${activeTab === 'all' ? 'text-primary font-bold' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Wrench size={18} />
          <span className="text-[9px] mt-1">Dashboard</span>
        </button>
        <button 
          onClick={() => {
            setActiveTab('in_progress');
          }}
          className={`flex flex-col items-center justify-center px-4 py-1 ${activeTab === 'in_progress' ? 'text-primary font-bold' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <CheckCircle2 size={18} />
          <span className="text-[9px] mt-1">My Tasks</span>
        </button>
        <button 
          onClick={() => setInventoryModalOpen(true)}
          className="flex flex-col items-center justify-center text-slate-400 hover:text-primary px-4 py-1"
        >
          <Package size={18} />
          <span className="text-[9px] mt-1">Inventory</span>
        </button>
        <button 
          onClick={() => navigate('/profile')}
          className="flex flex-col items-center justify-center text-slate-400 hover:text-primary px-4 py-1"
        >
          <User size={18} />
          <span className="text-[9px] mt-1">Profile</span>
        </button>
      </nav>
    </div>
  );
}
