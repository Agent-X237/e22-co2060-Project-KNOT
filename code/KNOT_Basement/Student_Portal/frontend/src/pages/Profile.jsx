import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  BadgeCheck, 
  IdCard, 
  Briefcase, 
  ArrowLeft, 
  LogOut, 
  ShieldCheck, 
  Calendar, 
  Wrench,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export default function Profile() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ bookings: 0, faults: 0 });
  const [loading, setLoading] = useState(false);

  const userString = localStorage.getItem('knot_user');
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const [faultsRes, bookingsRes] = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/api/faults/${user.id}`),
          axios.get(`${API_BASE_URL}/api/bookings/${user.id}`)
        ]);
        const faultCount = faultsRes.status === 'fulfilled' ? (Array.isArray(faultsRes.value.data) ? faultsRes.value.data.length : 0) : 0;
        const bookingCount = bookingsRes.status === 'fulfilled' ? (Array.isArray(bookingsRes.value.data) ? bookingsRes.value.data.length : 0) : 0;
        setStats({ faults: faultCount, bookings: bookingCount });
      } catch (err) {
        console.error("Error fetching user profile stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <p className="text-slate-400 mb-4">No active user session found.</p>
        <button onClick={() => navigate('/login')} className="bg-primary px-6 py-2.5 rounded-xl text-sm font-bold">
          Go to Login
        </button>
      </div>
    );
  }

  // Derive detailed profile attributes cleanly for any role
  const getProfileDetails = () => {
    const role = user.role || 'User';
    const username = user.username || '';

    let idLabel = 'ID Number';
    let idValue = user.id_number || user.employee_no || user.reg_no || '';
    let position = user.department || 'University Staff Member';
    let phone = user.phone || '+94 81 239 3300';
    let address = user.address || 'Faculty of Engineering, University of Peradeniya, Peradeniya 20400, Sri Lanka';
    let email = user.email || '';
    let roleBadgeColor = 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300';
    let portalPath = '/';

    if (role === 'Student' || username.startsWith('e22') || username.startsWith('e20')) {
      idLabel = 'Student Registration No.';
      idValue = idValue || (username ? username.toUpperCase().replace(/^E(\d{2})(\d+)$/, 'E/$1/$2') : 'E/22/237');
      position = 'Undergraduate Student (Faculty of Engineering)';
      email = email || `${username}@eng.pdn.ac.lk`;
      phone = user.phone || '+94 77 123 4567';
      roleBadgeColor = 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
      portalPath = '/';
    } else if (role === 'Lecturer' || username === 'lecturer1') {
      idLabel = 'Lecturer ID No.';
      idValue = idValue || 'LEC-88210';
      position = 'Senior Lecturer (Dept. of Computer Engineering)';
      email = email || 'minhajchamodya@gmail.com';
      phone = user.phone || '+94 81 239 3344';
      address = 'Department of Computer Engineering, Faculty of Engineering, Peradeniya';
      roleBadgeColor = 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300';
      portalPath = '/lecturer';
    } else if (role === 'Technician' || username === 'alex') {
      idLabel = 'Employee No.';
      idValue = idValue || `EMP-${1000 + (user.id || 4)}`;
      position = 'Duty Maintenance Technician (Facilities Division)';
      email = email || 'slminsgaming@gmail.com';
      phone = user.phone || '+94 71 889 4422';
      address = 'Facilities & Works Division, Engineering Precinct, Peradeniya';
      roleBadgeColor = 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
      portalPath = '/technician';
    } else if (role === 'maintenance_admin' || username === 'admin') {
      idLabel = 'Employee No.';
      idValue = idValue || 'EMP-0001';
      position = 'Head Maintenance Manager';
      email = email || 'minhaj.dssc1@gmail.com';
      phone = user.phone || '+94 81 239 1000';
      address = 'Facilities Management Division, Main Admin Block, Peradeniya';
      roleBadgeColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
      portalPath = '/admin';
    } else if (role === 'booking_admin' || username === 'bookadmin') {
      idLabel = 'Employee No.';
      idValue = idValue || 'EMP-0002';
      position = 'Assistant Registrar (AR Office - Space Allocation)';
      email = email || 'minhaj.dssc3@gmail.com';
      phone = user.phone || '+94 81 239 2000';
      address = 'Assistant Registrar Office, Administrative Complex, Peradeniya';
      roleBadgeColor = 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
      portalPath = '/booking-admin';
    }

    return {
      fullName: user.name || username || 'User Profile',
      idLabel,
      idValue,
      position,
      email,
      phone,
      address,
      roleDisplay: role === 'maintenance_admin' ? 'Maintenance Manager' : role === 'booking_admin' ? 'AR Booking Admin' : role,
      roleBadgeColor,
      portalPath
    };
  };

  const profile = getProfileDetails();

  const handleLogout = () => {
    localStorage.removeItem('knot_user');
    navigate('/login');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col w-full font-display">
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 px-4 py-3 text-white flex items-center justify-between shadow-md">
        <button 
          onClick={() => navigate(profile.portalPath)} 
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={18} />
          <span className="font-bold text-sm">Back to Portal</span>
        </button>

        <img src="/knot_logo_white.png" alt="KNOT Logo" className="h-20 scale-[1.7] origin-center object-contain -my-4" />

        <button 
          onClick={handleLogout} 
          className="p-2 text-red-400 hover:bg-red-500/20 rounded-full transition-colors flex items-center gap-1.5 text-xs font-bold"
          title="Logout"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 pt-6 pb-24 flex flex-col gap-6">
        
        {/* Profile Card Header Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-blue-500 to-indigo-600"></div>

          {/* User Photo / Avatar */}
          <div className="relative shrink-0 mt-2 sm:mt-0">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary to-blue-600 text-white flex items-center justify-center text-4xl font-black shadow-xl border-4 border-white dark:border-slate-800">
              {profile.fullName.charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm" title="Active Account">
              <ShieldCheck size={14} />
            </div>
          </div>

          {/* Core Info */}
          <div className="flex-1 flex flex-col items-center sm:items-start">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${profile.roleBadgeColor}`}>
                {profile.roleDisplay}
              </span>
              <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                {profile.idValue}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{profile.fullName}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{profile.position}</p>

            <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
              <button 
                onClick={() => navigate(profile.portalPath)}
                className="bg-primary hover:bg-primary/95 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
              >
                <span>Open Dashboard</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* User Information Details Card (Requested Suitable Order) */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <User size={16} className="text-primary" /> User Profile Information
            </h2>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <BadgeCheck size={11} /> Verified Member
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Full Name */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <User size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Full Name</label>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate">{profile.fullName}</p>
              </div>
            </div>

            {/* 2. Reg No / Employee No / Lecturer ID */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 shrink-0 mt-0.5 flex items-center justify-center">
                <IdCard size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. {profile.idLabel}</label>
                <p className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5">{profile.idValue}</p>
              </div>
            </div>

            {/* 3. Position / Designation */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 shrink-0 mt-0.5 flex items-center justify-center">
                <Briefcase size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">3. Position / Role</label>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">{profile.position}</p>
              </div>
            </div>

            {/* 4. Email Address */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 shrink-0 mt-0.5 flex items-center justify-center">
                <Mail size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">4. Email Address</label>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate">{profile.email}</p>
              </div>
            </div>

            {/* 5. Phone Number */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 shrink-0 mt-0.5 flex items-center justify-center">
                <Phone size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">5. Phone Number</label>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{profile.phone}</p>
              </div>
            </div>

            {/* 6. Physical Address / Department */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 shrink-0 mt-0.5 flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">6. Address & Department</label>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 leading-snug">{profile.address}</p>
              </div>
            </div>

          </div>
        </section>

        {/* Portal Activity Summary */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Calendar size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bookings Activity</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none mt-1">{stats.bookings}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 flex items-center justify-center shrink-0">
              <Wrench size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Maintenance Reports</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none mt-1">{stats.faults}</p>
            </div>
          </div>
        </section>

        <div className="text-center text-xs font-medium text-slate-400 pt-4">
          KNOT Resource & Facilities Management System • Profile Details
        </div>
      </main>
    </div>
  );
}
