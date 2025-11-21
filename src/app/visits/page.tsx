'use client';

import { useState, useMemo } from 'react';
import { Plus, Calendar, ChevronLeft, ChevronRight, Clock, MapPin, X, Home as HomeIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useVisits } from '@/hooks/useVisits';
import { useApartments } from '@/hooks/useApartments';
import { Visit } from '@/types/visit';
import Link from 'next/link';

type ViewMode = 'upcoming' | 'past' | 'all';

export default function VisitsPage() {
  const { visits, deleteVisit } = useVisits();
  const { apartments } = useApartments();
  const [viewMode, setViewMode] = useState<ViewMode>('upcoming');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
  });

  // Filter visits based on view mode
  const filteredVisits = useMemo(() => {
    const now = new Date();

    switch (viewMode) {
      case 'upcoming':
        return visits.filter(visit => {
          const visitDateTime = new Date(visit.date);
          if (visit.time) {
            const [hours, minutes] = visit.time.split(':').map(Number);
            visitDateTime.setHours(hours, minutes, 0, 0);
          }
          return visitDateTime >= now;
        });
      case 'past':
        return visits.filter(visit => {
          const visitDateTime = new Date(visit.date);
          if (visit.time) {
            const [hours, minutes] = visit.time.split(':').map(Number);
            visitDateTime.setHours(hours, minutes, 0, 0);
          }
          return visitDateTime < now;
        });
      case 'all':
      default:
        return visits;
    }
  }, [visits, viewMode]);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      total: visits.length,
      upcoming: visits.filter(v => {
        const vDate = new Date(v.date);
        if (v.time) {
          const [h, m] = v.time.split(':').map(Number);
          vDate.setHours(h, m, 0, 0);
        }
        return vDate >= now;
      }).length,
      thisWeek: visits.filter(v => {
        const vDate = new Date(v.date);
        return vDate >= now && vDate <= weekFromNow;
      }).length,
    };
  }, [visits]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentWeekStart]);

  const visitsByDay = useMemo(() => {
    const grouped: { [key: string]: Visit[] } = {};

    weekDays.forEach(day => {
      const dateStr = day.toISOString().split('T')[0];
      grouped[dateStr] = [];
    });

    filteredVisits.forEach(visit => {
      const dateStr = visit.date.toISOString().split('T')[0];
      if (grouped[dateStr] !== undefined) {
        grouped[dateStr].push(visit);
      }
    });

    // Sort visits by time within each day
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => a.time.localeCompare(b.time));
    });

    return grouped;
  }, [filteredVisits, weekDays]);

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    setCurrentWeekStart(new Date(today.setDate(diff)));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatDateRange = () => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${currentWeekStart.toLocaleDateString('pt-BR', options)} - ${endDate.toLocaleDateString('pt-BR', options)}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-black" strokeWidth={1.5} />
            <h1 className="text-3xl font-light text-black tracking-tight">Visitas Agendadas</h1>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <HomeIcon className="w-4 h-4" strokeWidth={2} />
            Apartamentos
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-black text-white rounded-xl p-5">
            <div className="text-3xl font-semibold mb-1">{stats.total}</div>
            <div className="text-sm text-gray-300">Total de visitas</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="text-3xl font-semibold mb-1 text-black">{stats.upcoming}</div>
            <div className="text-sm text-gray-600">Próximas visitas</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="text-3xl font-semibold mb-1 text-black">{stats.thisWeek}</div>
            <div className="text-sm text-gray-600">Esta semana</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-8">
            <button
              onClick={() => setViewMode('upcoming')}
              className={`pb-4 px-1 border-b-2 transition-colors whitespace-nowrap ${
                viewMode === 'upcoming'
                  ? 'border-black text-black font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Próximas
              <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{stats.upcoming}</span>
            </button>
            <button
              onClick={() => setViewMode('past')}
              className={`pb-4 px-1 border-b-2 transition-colors whitespace-nowrap ${
                viewMode === 'past'
                  ? 'border-black text-black font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Passadas
              <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{stats.total - stats.upcoming}</span>
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`pb-4 px-1 border-b-2 transition-colors whitespace-nowrap ${
                viewMode === 'all'
                  ? 'border-black text-black font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Todas
              <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{stats.total}</span>
            </button>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-black"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2} />
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-black"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={2} />
            </button>
            <span className="text-lg font-medium text-black">{formatDateRange()}</span>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Hoje
          </button>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day, index) => {
            const dateStr = day.toISOString().split('T')[0];
            const dayVisits = visitsByDay[dateStr] || [];
            const today = isToday(day);

            return (
              <div key={index} className={`border rounded-lg ${today ? 'border-black' : 'border-gray-200'}`}>
                <div className={`p-3 border-b ${today ? 'bg-black text-white border-black' : 'bg-gray-50 border-gray-200'}`}>
                  <div className={`text-xs font-medium uppercase ${today ? 'text-gray-300' : 'text-gray-600'}`}>
                    {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </div>
                  <div className={`text-2xl font-light ${today ? 'text-white' : 'text-black'}`}>
                    {day.getDate()}
                  </div>
                </div>
                <div className="p-2 space-y-2 min-h-[200px]">
                  {dayVisits.map(visit => (
                    <div
                      key={visit.id}
                      className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-all group relative"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-black bg-gray-100 px-2 py-1 rounded">
                          <Clock className="w-3 h-3" strokeWidth={2} />
                          {visit.time}
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('Tem certeza que deseja excluir esta visita?')) {
                              try {
                                await deleteVisit(visit.id!);
                                toast.success('Visita excluída com sucesso!');
                              } catch (error) {
                                console.error('Error deleting visit:', error);
                                toast.error('Erro ao excluir visita. Tente novamente.');
                              }
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                      </div>
                      <div className="text-sm font-semibold text-black mb-1.5 line-clamp-2">
                        {visit.apartmentTitle}
                      </div>
                      <div className="flex items-start gap-1 text-xs text-gray-600 mb-2">
                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" strokeWidth={2} />
                        <span className="line-clamp-1">{visit.apartmentNeighborhood}</span>
                      </div>
                      {visit.notes && (
                        <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 mt-2 line-clamp-2">
                          {visit.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
