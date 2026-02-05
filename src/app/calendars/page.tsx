'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Card, Input, Modal } from '@/components/ui';
import { GHLCalendar, GHLCalendarGroup, GHLAppointment, GHLContact } from '@/types';
import { 
  Plus, RefreshCw, Search, Calendar as CalendarIcon, Edit2, Trash2, 
  ChevronLeft, ChevronRight, Clock, Users, FolderPlus, Settings,
  Check, X, Eye, Copy, Share2, MoreVertical, Filter, ArrowUpDown,
  CalendarDays, List, ChevronDown, ExternalLink, Link2, Pencil, FileText,
  Phone, Mail, MapPin, User
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ==================== TYPES ====================
type MainTab = 'calendar-view' | 'appointment-list' | 'calendar-settings';
type AppointmentListTab = 'upcoming' | 'cancelled' | 'all';
type ViewByType = 'all' | 'appointments' | 'blocked-slots';

interface CalendarFormData {
  name: string;
  description: string;
  slug: string;
  calendarType: 'round_robin' | 'event' | 'class_booking' | 'collective' | 'service_booking' | 'personal';
  widgetType: 'default' | 'classic';
  slotDuration: number;
  slotInterval: number;
  isActive: boolean;
  groupId?: string;
}

interface GroupFormData {
  name: string;
  description: string;
  slug: string;
}

interface BookAppointmentData {
  calendarId: string;
  title: string;
  description: string;
  contactId: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'showed' | 'noshow' | 'invalid';
  assignedUserId?: string;
}

const defaultCalendarFormData: CalendarFormData = {
  name: '',
  description: '',
  slug: '',
  calendarType: 'personal',
  widgetType: 'classic',
  slotDuration: 30,
  slotInterval: 30,
  isActive: true,
};

const defaultGroupFormData: GroupFormData = {
  name: '',
  description: '',
  slug: '',
};

const defaultBookAppointmentData: BookAppointmentData = {
  calendarId: '',
  title: '',
  description: '',
  contactId: '',
  startTime: '',
  endTime: '',
  status: 'confirmed',
};

// ==================== HELPER FUNCTIONS ====================
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatShortDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: '2-digit', 
    year: 'numeric'
  });
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'showed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'noshow': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

// ==================== MAIN COMPONENT ====================
export default function CalendarsPage() {
  // Main State
  const [mainTab, setMainTab] = useState<MainTab>('calendar-view');
  const [calendars, setCalendars] = useState<GHLCalendar[]>([]);
  const [groups, setGroups] = useState<GHLCalendarGroup[]>([]);
  const [appointments, setAppointments] = useState<GHLAppointment[]>([]);
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Calendar View State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [viewByType, setViewByType] = useState<ViewByType>('all');
  const [showManageView, setShowManageView] = useState(true);
  
  // Appointment List State
  const [appointmentListTab, setAppointmentListTab] = useState<AppointmentListTab>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<GHLAppointment | null>(null);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState<string | null>(null);
  
  // Calendar Settings State
  const [settingsStatusFilter, setSettingsStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [settingsTypeFilter, setSettingsTypeFilter] = useState<string>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  // Modals
  const [showCalendarForm, setShowCalendarForm] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<GHLCalendar | null>(null);
  const [calendarFormData, setCalendarFormData] = useState<CalendarFormData>(defaultCalendarFormData);
  
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GHLCalendarGroup | null>(null);
  const [groupFormData, setGroupFormData] = useState<GroupFormData>(defaultGroupFormData);
  
  const [showBookAppointment, setShowBookAppointment] = useState(false);
  const [bookAppointmentData, setBookAppointmentData] = useState<BookAppointmentData>(defaultBookAppointmentData);
  const [bookAppointmentTab, setBookAppointmentTab] = useState<'appointment' | 'blocked'>('appointment');
  
  const [showShareCalendar, setShowShareCalendar] = useState(false);
  const [sharingCalendar, setSharingCalendar] = useState<GHLCalendar | null>(null);
  const [shareTab, setShareTab] = useState<'scheduling' | 'onetime' | 'embed'>('scheduling');
  
  const [saving, setSaving] = useState(false);

  // ==================== FETCH FUNCTIONS ====================
  const fetchCalendars = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/calendars', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.error) {
        setCalendars(data.calendars || []);
        // Select all calendars by default
        if (selectedCalendarIds.length === 0 && data.calendars?.length > 0) {
          setSelectedCalendarIds(data.calendars.map((c: GHLCalendar) => c.id));
        }
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
    }
  }, [selectedCalendarIds.length]);

  const fetchGroups = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/calendars/groups', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.error) {
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);
      
      let allEvents: GHLAppointment[] = [];
      
      // Fetch events for each selected calendar
      const calendarsToFetch = selectedCalendarIds.length > 0 
        ? calendars.filter(c => selectedCalendarIds.includes(c.id))
        : calendars;
      
      if (calendarsToFetch.length > 0) {
        const eventPromises = calendarsToFetch.map(async (calendar) => {
          try {
            const res = await fetch(
              `/api/calendars/events?startTime=${startOfMonth.getTime()}&endTime=${endOfMonth.getTime()}&calendarId=${calendar.id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) return [];
            const data = await res.json();
            return (data.events || []).map((e: GHLAppointment) => ({ ...e, calendarName: calendar.name }));
          } catch {
            return [];
          }
        });
        
        const eventsArrays = await Promise.all(eventPromises);
        allEvents = eventsArrays.flat();
      }
      
      setAppointments(allEvents);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    }
  }, [currentMonth, selectedCalendarIds, calendars]);

  const fetchContacts = useCallback(async (searchTerm?: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const query = searchTerm ? `&query=${encodeURIComponent(searchTerm)}` : '';
      const res = await fetch(`/api/contacts?limit=20${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.error) {
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCalendars(), fetchGroups()]);
    setLoading(false);
  }, [fetchCalendars, fetchGroups]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (calendars.length > 0) {
      fetchAppointments();
    }
  }, [currentMonth, selectedCalendarIds, calendars.length, fetchAppointments]);

  // ==================== CALENDAR VIEW HELPERS ====================
  const getDaysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  }, [currentMonth]);

  const getEventsForDay = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    return appointments.filter(apt => {
      const aptDate = new Date(apt.startTime);
      return aptDate.getDate() === day && 
             aptDate.getMonth() === month && 
             aptDate.getFullYear() === year;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // ==================== FILTERED DATA ====================
  const filteredAppointments = useMemo(() => {
    let filtered = appointments;
    
    // Filter by appointment list tab
    if (appointmentListTab === 'upcoming') {
      filtered = filtered.filter(apt => new Date(apt.startTime) >= new Date() && apt.appointmentStatus !== 'cancelled');
    } else if (appointmentListTab === 'cancelled') {
      filtered = filtered.filter(apt => apt.appointmentStatus === 'cancelled');
    }
    
    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.title?.toLowerCase().includes(searchLower) ||
        apt.contactId?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [appointments, appointmentListTab, search]);

  const filteredCalendars = useMemo(() => {
    let filtered = calendars;
    
    // Filter by status
    if (settingsStatusFilter === 'active') {
      filtered = filtered.filter(c => c.isActive);
    } else if (settingsStatusFilter === 'inactive') {
      filtered = filtered.filter(c => !c.isActive);
    }
    
    // Filter by type
    if (settingsTypeFilter !== 'all') {
      filtered = filtered.filter(c => c.calendarType === settingsTypeFilter);
    }
    
    // Filter by group
    if (selectedGroupId) {
      if (selectedGroupId === 'ungrouped') {
        filtered = filtered.filter(c => !c.groupId);
      } else {
        filtered = filtered.filter(c => c.groupId === selectedGroupId);
      }
    }
    
    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(searchLower) ||
        c.id?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [calendars, settingsStatusFilter, settingsTypeFilter, selectedGroupId, search]);

  // ==================== CALENDAR CRUD ====================
  const handleCreateCalendar = () => {
    setEditingCalendar(null);
    setCalendarFormData(defaultCalendarFormData);
    setShowCalendarForm(true);
  };

  const handleEditCalendar = (calendar: GHLCalendar) => {
    setEditingCalendar(calendar);
    setCalendarFormData({
      name: calendar.name || '',
      description: calendar.description || '',
      slug: calendar.slug || '',
      calendarType: calendar.calendarType || 'personal',
      widgetType: calendar.widgetType || 'classic',
      slotDuration: calendar.slotDuration || 30,
      slotInterval: calendar.slotInterval || 30,
      isActive: calendar.isActive ?? true,
      groupId: calendar.groupId,
    });
    setShowCalendarForm(true);
  };

  const handleSaveCalendar = async () => {
    if (!calendarFormData.name.trim()) {
      toast.error('Calendar name is required');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const url = editingCalendar ? `/api/calendars/${editingCalendar.id}` : '/api/calendars';
      const method = editingCalendar ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(calendarFormData),
      });

      if (!res.ok) throw new Error('Failed to save calendar');

      toast.success(editingCalendar ? 'Calendar updated' : 'Calendar created');
      setShowCalendarForm(false);
      fetchCalendars();
    } catch (error) {
      toast.error('Failed to save calendar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCalendar = async (calendar: GHLCalendar) => {
    if (!confirm(`Delete calendar "${calendar.name}"?`)) return;

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/calendars/${calendar.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete calendar');

      toast.success('Calendar deleted');
      fetchCalendars();
    } catch (error) {
      toast.error('Failed to delete calendar');
    }
  };

  const handleShareCalendar = (calendar: GHLCalendar) => {
    setSharingCalendar(calendar);
    setShareTab('scheduling');
    setShowShareCalendar(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // ==================== GROUP CRUD ====================
  const handleCreateGroup = () => {
    setEditingGroup(null);
    setGroupFormData(defaultGroupFormData);
    setShowGroupForm(true);
  };

  const handleSaveGroup = async () => {
    if (!groupFormData.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const url = editingGroup ? `/api/calendars/groups/${editingGroup.id}` : '/api/calendars/groups';
      const method = editingGroup ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(groupFormData),
      });

      if (!res.ok) throw new Error('Failed to save group');

      toast.success(editingGroup ? 'Group updated' : 'Group created');
      setShowGroupForm(false);
      fetchGroups();
    } catch (error) {
      toast.error('Failed to save group');
    } finally {
      setSaving(false);
    }
  };

  // ==================== APPOINTMENT ACTIONS ====================
  const handleNewAppointment = () => {
    setBookAppointmentData({
      ...defaultBookAppointmentData,
      calendarId: calendars[0]?.id || '',
    });
    setBookAppointmentTab('appointment');
    setShowBookAppointment(true);
    fetchContacts();
  };

  const handleBookAppointment = async () => {
    if (!bookAppointmentData.calendarId || !bookAppointmentData.startTime || !bookAppointmentData.contactId) {
      toast.error('Please fill in required fields (Calendar, Contact, Date & Time)');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Convert datetime-local value to ISO 8601 format with timezone offset
      // GHL API expects format like: 2021-06-23T03:30:00+05:30
      const startDate = new Date(bookAppointmentData.startTime);
      const endDate = bookAppointmentData.endTime 
        ? new Date(bookAppointmentData.endTime)
        : new Date(startDate.getTime() + 30 * 60 * 1000); // Default 30 min duration
      
      // Format date with timezone offset (GHL requires this format)
      const formatDateForGHL = (date: Date): string => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        
        // Get timezone offset in ±HH:MM format
        const tzOffset = -date.getTimezoneOffset();
        const tzSign = tzOffset >= 0 ? '+' : '-';
        const tzHours = pad(Math.floor(Math.abs(tzOffset) / 60));
        const tzMins = pad(Math.abs(tzOffset) % 60);
        
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${tzSign}${tzHours}:${tzMins}`;
      };
      
      // Map frontend status to valid GHL appointmentStatus
      // Valid values: new, confirmed, cancelled, showed, noshow, invalid
      const statusMap: Record<string, string> = {
        'confirmed': 'confirmed',
        'cancelled': 'cancelled',
        'showed': 'showed',
        'noshow': 'noshow',
        'invalid': 'invalid',
      };
      
      // Map frontend fields to GHL API fields
      const appointmentPayload = {
        calendarId: bookAppointmentData.calendarId,
        contactId: bookAppointmentData.contactId,
        startTime: formatDateForGHL(startDate),
        endTime: formatDateForGHL(endDate),
        title: bookAppointmentData.title || undefined,
        description: bookAppointmentData.description || undefined,
        appointmentStatus: statusMap[bookAppointmentData.status] || 'confirmed',
        assignedUserId: bookAppointmentData.assignedUserId || undefined,
        ignoreDateRange: true, // Allow booking outside normal date range
        ignoreFreeSlotValidation: true, // Allow booking even if slot is not available
        toNotify: true, // Send notifications
      };
      
      const res = await fetch('/api/calendars/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(appointmentPayload),
      });

      if (!res.ok) throw new Error('Failed to book appointment');

      toast.success('Appointment booked');
      setShowBookAppointment(false);
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to book appointment');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/calendars/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appointmentStatus: status }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast.success('Status updated');
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // ==================== RENDER FUNCTIONS ====================

  // Calendar View Tab
  const renderCalendarView = () => (
    <div className="flex gap-6">
      {/* Main Calendar */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold min-w-[140px] text-center">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowManageView(!showManageView)}>
              <Filter className="h-4 w-4 mr-2" />
              Manage View
            </Button>
            <Button size="sm" onClick={handleNewAppointment}>
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card className="p-0 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b bg-muted/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {getDaysInMonth.map((day, index) => {
              const events = day ? getEventsForDay(day) : [];
              const isToday = day === new Date().getDate() && 
                currentMonth.getMonth() === new Date().getMonth() &&
                currentMonth.getFullYear() === new Date().getFullYear();
              
              return (
                <div 
                  key={index} 
                  className={cn(
                    "min-h-[100px] p-2 border-b border-r",
                    !day && "bg-muted/30",
                    isToday && "bg-primary/5"
                  )}
                >
                  {day && (
                    <>
                      <div className={cn(
                        "text-sm mb-1",
                        isToday && "w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                      )}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {events.slice(0, 3).map((event, i) => (
                          <div 
                            key={i}
                            className="text-xs p-1 rounded bg-primary/20 text-primary truncate cursor-pointer hover:bg-primary/30"
                            title={event.title}
                          >
                            {event.title || 'Appointment'}
                          </div>
                        ))}
                        {events.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{events.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Manage View Sidebar */}
      {showManageView && (
        <div className="w-80 shrink-0">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Manage View</h3>
            
            {/* View By Type */}
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-2">View By Type</h4>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'appointments', label: 'Appointments' },
                  { value: 'blocked-slots', label: 'Blocked Slots' },
                ].map(option => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="viewType"
                      checked={viewByType === option.value}
                      onChange={() => setViewByType(option.value as ViewByType)}
                      className="text-primary"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Filters</h4>
                <button 
                  className="text-xs text-destructive hover:underline"
                  onClick={() => setSelectedCalendarIds(calendars.map(c => c.id))}
                >
                  × Clear
                </button>
              </div>
              <Input 
                placeholder="Search Users, Calendars or Groups"
                className="mb-3"
              />
            </div>

            {/* Users */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <ChevronDown className="h-4 w-4" />
                Users
              </h4>
            </div>

            {/* Calendars */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <ChevronDown className="h-4 w-4" />
                Calendars
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{calendars.length}</span>
              </h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {calendars.map(calendar => (
                  <label key={calendar.id} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={selectedCalendarIds.includes(calendar.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCalendarIds([...selectedCalendarIds, calendar.id]);
                        } else {
                          setSelectedCalendarIds(selectedCalendarIds.filter(id => id !== calendar.id));
                        }
                      }}
                      className="rounded text-primary"
                    />
                    <span className="text-sm truncate">{calendar.name}</span>
                  </label>
                ))}
              </div>
              {calendars.length > 5 && (
                <button className="text-xs text-primary hover:underline mt-2">
                  See More (+{calendars.length - 5})
                </button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  // View Details Sidebar Panel
  const renderViewDetailsPanel = () => {
    if (!selectedAppointment || !showViewDetails) return null;
    
    const apt = selectedAppointment;
    const calendar = calendars.find(c => c.id === apt.calendarId);
    
    return (
      <div className="w-96 border-l bg-background flex flex-col h-[calc(100vh-140px)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">View Details</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => {
              // Edit appointment
            }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-red-600" onClick={() => {
              handleUpdateAppointmentStatus(apt.id, 'cancelled');
            }}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowViewDetails(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Appointment Time */}
          <div>
            <label className="text-sm text-muted-foreground">Appointment Time</label>
            <div className="flex items-center gap-2 mt-1">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{formatDate(apt.startTime)}</span>
            </div>
            {apt.endTime && (
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  to {new Date(apt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
          
          {/* Name */}
          <div>
            <label className="text-sm text-muted-foreground">Name</label>
            <div className="flex items-center gap-2 mt-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{apt.title || 'Untitled Appointment'}</span>
            </div>
          </div>
          
          {/* Phone */}
          <div>
            <label className="text-sm text-muted-foreground">Phone</label>
            <div className="flex items-center gap-2 mt-1">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{(apt as any).phone || 'Not provided'}</span>
            </div>
          </div>
          
          {/* Email */}
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{(apt as any).email || 'Not provided'}</span>
            </div>
          </div>
          
          {/* Appointment Owner */}
          <div>
            <label className="text-sm text-muted-foreground">Appointment Owner</label>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                {apt.assignedUserId?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm">{apt.assignedUserId || 'Unassigned'}</span>
            </div>
          </div>
          
          {/* Location */}
          <div>
            <label className="text-sm text-muted-foreground">Location</label>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{(apt as any).location || 'Not specified'}</span>
            </div>
          </div>
          
          {/* Calendar */}
          <div>
            <label className="text-sm text-muted-foreground">Calendar</label>
            <div className="flex items-center gap-2 mt-1">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{calendar?.name || 'Unknown Calendar'}</span>
            </div>
          </div>
          
          {/* Attendees */}
          <div>
            <label className="text-sm text-muted-foreground">Attendees</label>
            <div className="flex items-center gap-2 mt-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{(apt as any).attendees?.length || 1} attendee(s)</span>
            </div>
          </div>
          
          {/* Booked By */}
          <div>
            <label className="text-sm text-muted-foreground">Booked By</label>
            <div className="mt-1">
              <span className="text-sm">{(apt as any).bookedBy || 'Direct booking'}</span>
            </div>
          </div>
          
          {/* Source */}
          <div>
            <label className="text-sm text-muted-foreground">Source</label>
            <div className="mt-1">
              <span className="text-sm">{(apt as any).source || 'Calendar link'}</span>
            </div>
          </div>
          
          {/* Appointment Description */}
          <div>
            <label className="text-sm text-muted-foreground">Appointment Description</label>
            <div className="mt-1 p-3 bg-muted/30 rounded-md min-h-15">
              <span className="text-sm">{(apt as unknown as {notes?: string}).notes || 'No description'}</span>
            </div>
          </div>
        </div>
        
        {/* Footer Status */}
        <div className="p-4 border-t">
          <label className="text-sm text-muted-foreground mb-2 block">Status</label>
          <select 
            className={cn(
              "w-full text-sm px-3 py-2 rounded border",
              getStatusColor(apt.appointmentStatus || 'confirmed')
            )}
            value={apt.appointmentStatus || 'confirmed'}
            onChange={(e) => {
              handleUpdateAppointmentStatus(apt.id, e.target.value);
              setSelectedAppointment({...apt, appointmentStatus: e.target.value as GHLAppointment['appointmentStatus']});
            }}
          >
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="showed">Showed</option>
            <option value="noshow">No Show</option>
          </select>
        </div>
      </div>
    );
  };

  // Appointment List View Tab
  const renderAppointmentListView = () => (
    <div className="flex">
      {/* Main Content */}
      <div className={cn("flex-1", showViewDetails && "mr-0")}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Appointments</h1>
          <Button onClick={handleNewAppointment}>
            <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-4 mb-4 border-b">
        {[
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'cancelled', label: 'Cancelled' },
          { value: 'all', label: 'All' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setAppointmentListTab(tab.value as AppointmentListTab)}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              appointmentListTab === tab.value 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
        <button className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
          + Smart list
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
          <Button variant="outline" size="sm">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Sort by
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by title"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            Manage Columns
          </Button>
          <Button variant="outline" size="sm">
            Customize List
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">#</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Contact</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Appointment Time</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Calendar</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Appointment Owner</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No appointments found
                </td>
              </tr>
            ) : (
              filteredAppointments.map((apt, index) => (
                <tr 
                  key={apt.id} 
                  className={cn(
                    "hover:bg-muted/30 cursor-pointer",
                    selectedAppointment?.id === apt.id && "bg-muted/50"
                  )}
                  onClick={() => {
                    setSelectedAppointment(apt);
                    setShowViewDetails(true);
                  }}
                >
                  <td className="px-4 py-3 text-sm">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{apt.title || 'Untitled'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                        {apt.contactId?.charAt(0) || '?'}
                      </div>
                      <span className="text-sm">{apt.contactId || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select 
                      className={cn(
                        "text-sm px-2 py-1 rounded border-0",
                        getStatusColor(apt.appointmentStatus || 'confirmed')
                      )}
                      value={apt.appointmentStatus || 'confirmed'}
                      onChange={(e) => handleUpdateAppointmentStatus(apt.id, e.target.value)}
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="showed">Showed</option>
                      <option value="noshow">No Show</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatDate(apt.startTime)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {(apt as any).calendarName || calendars.find(c => c.id === apt.calendarId)?.name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {apt.assignedUserId || 'Unassigned'}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setActionsMenuOpen(actionsMenuOpen === apt.id ? null : apt.id)}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      {actionsMenuOpen === apt.id && (
                        <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-background border rounded-md shadow-lg py-1">
                          <button
                            className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setShowViewDetails(true);
                              setActionsMenuOpen(null);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </button>
                          <button
                            className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                            onClick={() => {
                              setActionsMenuOpen(null);
                            }}
                          >
                            <FileText className="h-4 w-4" />
                            View Consent
                          </button>
                          <button
                            className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                            onClick={() => {
                              // Edit appointment
                              setActionsMenuOpen(null);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                            onClick={() => {
                              // Reschedule appointment
                              setActionsMenuOpen(null);
                            }}
                          >
                            <Clock className="h-4 w-4" />
                            Reschedule
                          </button>
                          <button
                            className="w-full px-4 py-2 text-left text-sm hover:bg-muted text-red-600 flex items-center gap-2"
                            onClick={() => {
                              handleUpdateAppointmentStatus(apt.id, 'cancelled');
                              setActionsMenuOpen(null);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing 1 to {filteredAppointments.length} of {filteredAppointments.length} results
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
            <select className="text-sm border rounded px-2 py-1">
              <option>10 / page</option>
              <option>25 / page</option>
              <option>50 / page</option>
            </select>
          </div>
        </div>
      </Card>
      </div>
      
      {/* View Details Sidebar */}
      {renderViewDetailsPanel()}
    </div>
  );

  // Calendar Settings Tab
  const renderCalendarSettings = () => (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-64 shrink-0">
        <Card className="p-4">
          <div 
            className={cn(
              "px-3 py-2 rounded cursor-pointer mb-4",
              !selectedGroupId && "bg-primary/10 text-primary"
            )}
            onClick={() => setSelectedGroupId(null)}
          >
            All Calendars ({calendars.length})
          </div>

          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Groups</h4>
          <div 
            className={cn(
              "px-3 py-2 rounded cursor-pointer mb-2",
              selectedGroupId === 'ungrouped' && "bg-muted"
            )}
            onClick={() => setSelectedGroupId('ungrouped')}
          >
            Not Grouped
            <span className="text-muted-foreground text-sm ml-2">
              {calendars.filter(c => !c.groupId).length}
            </span>
          </div>

          {groups.map(group => (
            <div 
              key={group.id}
              className={cn(
                "px-3 py-2 rounded cursor-pointer flex items-center justify-between",
                selectedGroupId === group.id && "bg-muted"
              )}
              onClick={() => setSelectedGroupId(group.id)}
            >
              <span className="truncate">{group.name}</span>
              <span className="text-muted-foreground text-sm">
                {calendars.filter(c => c.groupId === group.id).length}
              </span>
            </div>
          ))}

          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={handleCreateGroup}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Group
          </Button>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Filters */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <select 
              className="text-sm border rounded px-3 py-2"
              value={settingsStatusFilter}
              onChange={(e) => setSettingsStatusFilter(e.target.value as any)}
            >
              <option value="all">Status: All</option>
              <option value="active">Status: Active</option>
              <option value="inactive">Status: Inactive</option>
            </select>
            <select 
              className="text-sm border rounded px-3 py-2"
              value={settingsTypeFilter}
              onChange={(e) => setSettingsTypeFilter(e.target.value)}
            >
              <option value="all">Type: All</option>
              <option value="personal">Personal</option>
              <option value="event">Event</option>
              <option value="round_robin">Round Robin</option>
              <option value="class_booking">Class</option>
              <option value="collective">Collective</option>
              <option value="service_booking">Service</option>
            </select>
            <select className="text-sm border rounded px-3 py-2">
              <option>Owned by: Anyone</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Calendar/Group Name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button onClick={handleCreateCalendar}>
              <Plus className="h-4 w-4 mr-2" />
              New Calendar
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Calendar Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Group</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Duration</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date Updated</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : filteredCalendars.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No calendars found
                  </td>
                </tr>
              ) : (
                filteredCalendars.map(calendar => (
                  <tr key={calendar.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{calendar.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          Id: {calendar.id}
                          <button 
                            onClick={() => copyToClipboard(calendar.id)}
                            className="hover:text-foreground"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {groups.find(g => g.id === calendar.groupId)?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {calendar.slotDuration || 30} mins
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">
                      {calendar.calendarType?.replace('_', ' ') || 'Personal'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded",
                        calendar.isActive 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {calendar.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {calendar.updatedAt ? formatShortDate(calendar.updatedAt) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditCalendar(calendar)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleShareCalendar(calendar)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteCalendar(calendar)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </Card>
      </div>
    </div>
  );

  // ==================== MODALS ====================

  // Calendar Form Modal
  const renderCalendarFormModal = () => (
    <Modal
      isOpen={showCalendarForm}
      onClose={() => setShowCalendarForm(false)}
      title={editingCalendar ? `Edit - ${editingCalendar.name}` : 'New Calendar'}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Calendar name *</label>
          <Input 
            value={calendarFormData.name}
            onChange={(e) => setCalendarFormData({ ...calendarFormData, name: e.target.value })}
            placeholder="Enter calendar name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea 
            className="w-full border rounded-md p-2 min-h-[100px] bg-background"
            value={calendarFormData.description}
            onChange={(e) => setCalendarFormData({ ...calendarFormData, description: e.target.value })}
            placeholder="Write description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Group</label>
          <select 
            className="w-full border rounded-md p-2 bg-background"
            value={calendarFormData.groupId || ''}
            onChange={(e) => setCalendarFormData({ ...calendarFormData, groupId: e.target.value || undefined })}
          >
            <option value="">No Group</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
            <Input 
              type="number"
              value={calendarFormData.slotDuration}
              onChange={(e) => setCalendarFormData({ ...calendarFormData, slotDuration: parseInt(e.target.value) || 30 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select 
              className="w-full border rounded-md p-2 bg-background"
              value={calendarFormData.calendarType}
              onChange={(e) => setCalendarFormData({ ...calendarFormData, calendarType: e.target.value as any })}
            >
              <option value="personal">Personal</option>
              <option value="event">Event</option>
              <option value="round_robin">Round Robin</option>
              <option value="class_booking">Class Booking</option>
              <option value="collective">Collective</option>
              <option value="service_booking">Service Booking</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Custom URL</label>
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground mr-2">/widget/bookings/</span>
            <Input 
              value={calendarFormData.slug}
              onChange={(e) => setCalendarFormData({ ...calendarFormData, slug: e.target.value })}
              placeholder="calendar-slug"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => setShowCalendarForm(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveCalendar} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );

  // Group Form Modal
  const renderGroupFormModal = () => (
    <Modal
      isOpen={showGroupForm}
      onClose={() => setShowGroupForm(false)}
      title="Add New Calendar Group"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Use calendar groups to effectively organize and group multiple calendars together.
        </p>

        <div>
          <label className="block text-sm font-medium mb-1">
            Group Name <span className="text-destructive">*</span>
          </label>
          <Input 
            value={groupFormData.name}
            onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
            placeholder="Group Name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Group Description</label>
          <textarea 
            className="w-full border rounded-md p-2 min-h-[100px] bg-background"
            value={groupFormData.description}
            onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
            placeholder="Group Description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Template</label>
          <select className="w-full border rounded-md p-2 bg-background">
            <option value="neo">Neo</option>
            <option value="classic">Classic</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            You now have the choice to select either the Classic or Neo templates for the Group view
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Group URL</label>
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground mr-2">/widget/groups/</span>
            <Input 
              value={groupFormData.slug}
              onChange={(e) => setGroupFormData({ ...groupFormData, slug: e.target.value })}
              placeholder="group-slug"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowGroupForm(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveGroup} disabled={saving}>
            {saving ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  );

  // Book Appointment Modal
  const renderBookAppointmentModal = () => (
    <Modal
      isOpen={showBookAppointment}
      onClose={() => setShowBookAppointment(false)}
      title="Book Appointment"
    >
      <div>
        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            onClick={() => setBookAppointmentTab('appointment')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px",
              bookAppointmentTab === 'appointment' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground"
            )}
          >
            Appointment
          </button>
          <button
            onClick={() => setBookAppointmentTab('blocked')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px",
              bookAppointmentTab === 'blocked' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground"
            )}
          >
            Blocked off time
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Calendar</label>
              <select 
                className="w-full border rounded-md p-2 bg-background"
                value={bookAppointmentData.calendarId}
                onChange={(e) => setBookAppointmentData({ ...bookAppointmentData, calendarId: e.target.value })}
              >
                {calendars.map(cal => (
                  <option key={cal.id} value={cal.id}>{cal.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Appointment Title</label>
              <Input 
                value={bookAppointmentData.title}
                onChange={(e) => setBookAppointmentData({ ...bookAppointmentData, title: e.target.value })}
                placeholder="(eg) Appointment with Bob"
              />
            </div>

            <button className="text-sm text-primary hover:underline">
              Add Description
            </button>

            <div>
              <label className="block text-sm font-medium mb-1">Team Member</label>
              <select className="w-full border rounded-md p-2 bg-background">
                <option>Select team member</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date & Time</label>
              <Input 
                type="datetime-local"
                value={bookAppointmentData.startTime}
                onChange={(e) => setBookAppointmentData({ ...bookAppointmentData, startTime: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select 
                className="w-full border rounded-md p-2 bg-background"
                value={bookAppointmentData.status}
                onChange={(e) => setBookAppointmentData({ ...bookAppointmentData, status: e.target.value as any })}
              >
                <option value="confirmed">✓ Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="showed">Showed</option>
                <option value="noshow">No Show</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Select Contact <span className="text-destructive">*</span>
              </label>
              <select 
                className="w-full border rounded-md p-2 bg-background"
                value={bookAppointmentData.contactId}
                onChange={(e) => setBookAppointmentData({ ...bookAppointmentData, contactId: e.target.value })}
              >
                <option value="">Search by name, email or phone</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName} - {contact.email || contact.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Internal Notes</label>
              <Button variant="outline" size="sm">
                + Add Internal Note
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t">
          <Button variant="outline" onClick={() => setShowBookAppointment(false)}>
            Cancel
          </Button>
          <Button onClick={handleBookAppointment} disabled={saving}>
            {saving ? 'Booking...' : 'Book Appointment'}
          </Button>
        </div>
      </div>
    </Modal>
  );

  // Share Calendar Modal
  const renderShareCalendarModal = () => (
    <Modal
      isOpen={showShareCalendar}
      onClose={() => setShowShareCalendar(false)}
      title="Share Calendar"
    >
      {sharingCalendar && (
        <div>
          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {sharingCalendar.slotDuration || 30} mins
            </span>
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              {sharingCalendar.calendarType === 'personal' ? 'Personal Booking' : sharingCalendar.calendarType}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex border-b mb-4">
            {[
              { value: 'scheduling', label: 'Scheduling Link' },
              { value: 'onetime', label: 'One Time Link' },
              { value: 'embed', label: 'Embed Code' },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setShareTab(tab.value as any)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px",
                  shareTab === tab.value 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {shareTab === 'scheduling' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Scheduling Link</label>
                <div className="flex gap-2">
                  <Input 
                    value={`https://api.leadconnectorhq.com/widget/bookings/${sharingCalendar.slug || sharingCalendar.id}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button onClick={() => copyToClipboard(`https://api.leadconnectorhq.com/widget/bookings/${sharingCalendar.slug || sharingCalendar.id}`)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  The scheduling link is determined by the slug. Adjust the slug, and the scheduling link automatically adapts to the modification.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Permanent Link</label>
                <div className="flex gap-2">
                  <Input 
                    value={`https://api.leadconnectorhq.com/widget/booking/${sharingCalendar.id}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button onClick={() => copyToClipboard(`https://api.leadconnectorhq.com/widget/booking/${sharingCalendar.id}`)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Ideal for funnels, website redirects, or ads, the permanent link remains constant, unaffected by slug changes.
                </p>
              </div>
            </div>
          )}

          {shareTab === 'onetime' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate a one-time use link that expires after booking.
              </p>
              <Button variant="outline">
                Generate One Time Link
              </Button>
            </div>
          )}

          {shareTab === 'embed' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Copy this code to embed the calendar on your website.
              </p>
              <textarea 
                className="w-full border rounded-md p-2 font-mono text-xs bg-background"
                rows={4}
                readOnly
                value={`<iframe src="https://api.leadconnectorhq.com/widget/booking/${sharingCalendar.id}" style="width: 100%; border: none; overflow: hidden;" scrolling="no" id="${sharingCalendar.id}"></iframe>`}
              />
              <Button onClick={() => copyToClipboard(`<iframe src="https://api.leadconnectorhq.com/widget/booking/${sharingCalendar.id}" style="width: 100%; border: none; overflow: hidden;" scrolling="no" id="${sharingCalendar.id}"></iframe>`)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Embed Code
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );

  // ==================== MAIN RENDER ====================
  return (
    <div className="p-6">
      {/* Header Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b pb-4">
        <h1 className="text-xl font-semibold mr-4">Calendars</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMainTab('calendar-view')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              mainTab === 'calendar-view' 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <CalendarDays className="h-4 w-4 inline-block mr-2" />
            Calendar View
          </button>
          <button
            onClick={() => setMainTab('appointment-list')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              mainTab === 'appointment-list' 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <List className="h-4 w-4 inline-block mr-2" />
            Appointment List View
          </button>
          <button
            onClick={() => setMainTab('calendar-settings')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              mainTab === 'calendar-settings' 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Settings className="h-4 w-4 inline-block mr-2" />
            Calendar Settings
          </button>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      {mainTab === 'calendar-view' && renderCalendarView()}
      {mainTab === 'appointment-list' && renderAppointmentListView()}
      {mainTab === 'calendar-settings' && renderCalendarSettings()}

      {/* Modals */}
      {renderCalendarFormModal()}
      {renderGroupFormModal()}
      {renderBookAppointmentModal()}
      {renderShareCalendarModal()}
    </div>
  );
}
