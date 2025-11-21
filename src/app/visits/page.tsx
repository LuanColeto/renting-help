'use client';

import { useState, useMemo } from 'react';
import { Plus, Calendar, ChevronLeft, ChevronRight, Clock, MapPin, X, Home as HomeIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useVisits } from '@/hooks/useVisits';
import { useApartments } from '@/hooks/useApartments';
import { Visit } from '@/types/visit';
import Link from 'next/link';

export default function VisitsPage() {
  const { visits, addVisit, updateVisit, deleteVisit } = useVisits();
  const { apartments } = useApartments();
  const [showForm, setShowForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
  });

  const [formData, setFormData] = useState({
    apartmentId: '',
    date: '',
    time: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      apartmentId: '',
      date: '',
      time: '',
      notes: '',
    });
    setEditingVisit(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const selectedApartment = apartments.find(apt => apt.id === formData.apartmentId);
      if (!selectedApartment) {
        toast.error('Apartamento não encontrado');
        return;
      }

      const visitDate = new Date(formData.date + 'T' + formData.time);

      const visitData = {
        apartmentId: formData.apartmentId,
        apartmentTitle: selectedApartment.title,
        apartmentAddress: selectedApartment.address,
        apartmentNeighborhood: selectedApartment.neighborhood,
        date: visitDate,
        time: formData.time,
        notes: formData.notes,
      };

      if (editingVisit) {
        await updateVisit(editingVisit.id!, visitData);
        toast.success('Visita atualizada com sucesso!');
      } else {
        await addVisit(visitData);
        toast.success('Visita agendada com sucesso!');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving visit:', error);
      toast.error('Erro ao salvar visita. Tente novamente.');
    }
  };

  const handleEdit = (visit: Visit) => {
    const dateStr = visit.date.toISOString().split('T')[0];
    setFormData({
      apartmentId: visit.apartmentId,
      date: dateStr,
      time: visit.time,
      notes: visit.notes || '',
    });
    setEditingVisit(visit);
    setShowForm(true);
  };

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

    visits.forEach(visit => {
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
  }, [visits, weekDays]);

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
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <HomeIcon className="w-4 h-4" strokeWidth={2} />
              Apartamentos
            </Link>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              Agendar visita
            </button>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2} />
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={2} />
            </button>
            <span className="text-lg font-medium text-black">{formatDateRange()}</span>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
                  <div className="text-xs font-medium uppercase">
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
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer group"
                      onClick={() => handleEdit(visit)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Clock className="w-3 h-3" strokeWidth={2} />
                          {visit.time}
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await deleteVisit(visit.id!);
                              toast.success('Visita excluída com sucesso!');
                            } catch (error) {
                              console.error('Error deleting visit:', error);
                              toast.error('Erro ao excluir visita. Tente novamente.');
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                      </div>
                      <div className="text-sm font-medium text-black mb-1 line-clamp-2">
                        {visit.apartmentTitle}
                      </div>
                      <div className="flex items-start gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" strokeWidth={2} />
                        <span className="line-clamp-1">{visit.apartmentNeighborhood}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-light text-black">
                  {editingVisit ? 'Editar visita' : 'Agendar visita'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">APARTAMENTO</label>
                  <select
                    value={formData.apartmentId}
                    onChange={(e) => setFormData({ ...formData, apartmentId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    required
                  >
                    <option value="">Selecione um apartamento</option>
                    {apartments.map(apt => (
                      <option key={apt.id} value={apt.id}>
                        {apt.title} - {apt.neighborhood}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">DATA</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">HORÁRIO</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">OBSERVAÇÕES</label>
                  <textarea
                    placeholder="Adicione observações sobre a visita..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all h-24 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 font-medium transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-900 font-medium transition-all"
                  >
                    {editingVisit ? 'Atualizar' : 'Agendar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
