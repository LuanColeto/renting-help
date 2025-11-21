'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus, Home, MapPin, Eye, Heart, X, Filter, Calendar, Edit2, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useApartments } from '@/hooks/useApartments';
import { useVisits } from '@/hooks/useVisits';
import { Apartment } from '@/types/apartment';
import Link from 'next/link';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale/pt-BR';
import 'react-datepicker/dist/react-datepicker.css';
import Slider from '@mui/material/Slider';

registerLocale('pt-BR', ptBR);

type FilterTab = 'all' | 'visited' | 'not-visited' | 'discarded';

export default function HomePage() {
  const { apartments, loading, addApartment, updateApartment, deleteApartment } = useApartments();
  const { visits, addVisit, updateVisit } = useVisits();
  const [showForm, setShowForm] = useState(false);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 10000 });

  const [formData, setFormData] = useState({
    title: '',
    address: '',
    neighborhood: '',
    rent: '',
    condo: '',
    iptu: '',
    insurance: '',
    visited: false,
    discarded: false,
    notes: '',
    images: [] as string[],
    url: '',
  });

  const [scrapingUrl, setScrapingUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedApartmentForVisit, setSelectedApartmentForVisit] = useState<Apartment | null>(null);
  const [visitFormData, setVisitFormData] = useState<{
    date: Date | null;
    time: string;
    notes: string;
  }>({
    date: null,
    time: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      address: '',
      neighborhood: '',
      rent: '',
      condo: '',
      iptu: '',
      insurance: '',
      visited: false,
      discarded: false,
      notes: '',
      images: [],
      url: '',
    });
    setScrapingUrl('');
    setShowManualForm(false);
    setEditingApartment(null);
    setShowForm(false);
  };

  const handleContinueWithoutUrl = () => {
    setShowManualForm(true);
  };

  const handleScrapeUrl = async () => {
    if (!scrapingUrl) {
      toast.error('Digite a URL do anúncio');
      return;
    }

    setIsScraping(true);
    try {
      // Determine which API endpoint to use
      const needsBrowser = scrapingUrl.includes('vivareal.com.br') || scrapingUrl.includes('imovelweb.com.br');
      const endpoint = needsBrowser ? '/api/scrape-browser' : '/api/scrape';

      if (needsBrowser) {
        toast.info('Abrindo navegador para contornar proteções... isso pode levar alguns segundos.');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapingUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erro ao buscar dados do anúncio');
        setShowManualForm(true);
        return;
      }

      setFormData({
        title: data.title || '',
        address: data.address || '',
        neighborhood: data.neighborhood || '',
        rent: data.rent?.toString() || '',
        condo: data.condo?.toString() || '',
        iptu: data.iptu?.toString() || '',
        insurance: data.insurance?.toString() || '',
        visited: false,
        discarded: false,
        notes: data.notes || '',
        images: data.images || [],
        url: data.url || scrapingUrl,
      });

      toast.success('Dados extraídos com sucesso! Revise e preencha os campos faltantes.');
      setShowManualForm(true);
    } catch (error) {
      console.error('Error scraping:', error);
      toast.error('Erro ao buscar dados do anúncio. Preencha manualmente.');
      setShowManualForm(true);
    } finally {
      setIsScraping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const apartmentData = {
        title: formData.title,
        address: formData.address,
        neighborhood: formData.neighborhood,
        rent: Number(formData.rent),
        condo: Number(formData.condo),
        iptu: Number(formData.iptu),
        insurance: formData.insurance ? Number(formData.insurance) : undefined,
        visited: formData.visited,
        discarded: formData.discarded,
        notes: formData.notes,
        images: formData.images.length > 0 ? formData.images : undefined,
        url: formData.url || undefined,
      };

      if (editingApartment) {
        await updateApartment(editingApartment.id!, apartmentData);
        toast.success('Apartamento atualizado com sucesso!');
      } else {
        await addApartment(apartmentData);
        toast.success('Apartamento adicionado com sucesso!');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving apartment:', error);
      toast.error('Erro ao salvar apartamento. Tente novamente.');
    }
  };

  const handleEdit = (apartment: Apartment) => {
    setFormData({
      title: apartment.title,
      address: apartment.address,
      neighborhood: apartment.neighborhood,
      rent: apartment.rent.toString(),
      condo: apartment.condo.toString(),
      iptu: apartment.iptu.toString(),
      insurance: apartment.insurance?.toString() || '',
      visited: apartment.visited,
      discarded: apartment.discarded,
      notes: apartment.notes || '',
      images: apartment.images || [],
      url: apartment.url || '',
    });
    if (apartment.url) {
      setScrapingUrl(apartment.url);
    }
    setShowManualForm(true); // Ao editar, vai direto para o formulário
    setEditingApartment(apartment);
    setShowForm(true);
  };

  const getTotalCost = (apartment: Apartment) => {
    return apartment.rent + apartment.condo + apartment.iptu + (apartment.insurance || 0);
  };

  const handleOpenVisitModal = (apartment: Apartment) => {
    setSelectedApartmentForVisit(apartment);

    // Pre-fill with existing visit if there's one
    const existingVisit = getUpcomingVisit(apartment.id!);
    if (existingVisit) {
      setVisitFormData({
        date: existingVisit.date,
        time: existingVisit.time || '',
        notes: existingVisit.notes || '',
      });
    } else {
      setVisitFormData({
        date: null,
        time: '',
        notes: '',
      });
    }

    setShowVisitModal(true);
  };

  const handleScheduleVisit = async () => {
    if (!selectedApartmentForVisit || !visitFormData.date || !visitFormData.time) {
      toast.error('Preencha data e horário da visita');
      return;
    }

    try {
      // Combine date and time
      const visitDateTime = new Date(visitFormData.date);
      const [hours, minutes] = visitFormData.time.split(':').map(Number);
      visitDateTime.setHours(hours, minutes, 0, 0);

      // Check if there's already a visit for this apartment
      const existingVisit = visits.find(v => v.apartmentId === selectedApartmentForVisit.id);

      if (existingVisit) {
        // Update existing visit
        await updateVisit(existingVisit.id!, {
          date: visitDateTime,
          time: visitFormData.time,
          notes: visitFormData.notes,
        });
        toast.success('Visita atualizada com sucesso!');
      } else {
        // Create new visit
        await addVisit({
          apartmentId: selectedApartmentForVisit.id!,
          apartmentTitle: selectedApartmentForVisit.title,
          apartmentAddress: selectedApartmentForVisit.address,
          apartmentNeighborhood: selectedApartmentForVisit.neighborhood,
          date: visitDateTime,
          time: visitFormData.time,
          notes: visitFormData.notes,
        });
        toast.success('Visita agendada com sucesso!');
      }

      setShowVisitModal(false);
      setSelectedApartmentForVisit(null);
      setVisitFormData({ date: null, time: '', notes: '' });
    } catch (error) {
      console.error('Error scheduling visit:', error);
      toast.error('Erro ao agendar visita. Tente novamente.');
    }
  };

  const getUpcomingVisit = useCallback((apartmentId: string) => {
    const now = new Date();
    return visits.find(visit => {
      if (visit.apartmentId !== apartmentId) return false;

      // Create a full datetime for the visit
      const visitDateTime = new Date(visit.date);
      if (visit.time) {
        const [hours, minutes] = visit.time.split(':').map(Number);
        visitDateTime.setHours(hours, minutes, 0, 0);
      }

      return visitDateTime >= now;
    });
  }, [visits]);

  // Extract unique neighborhoods and price range from apartments
  const availableNeighborhoods = useMemo(() => {
    const neighborhoods = new Set<string>();
    apartments.forEach(apt => {
      if (apt.neighborhood) {
        neighborhoods.add(apt.neighborhood);
      }
    });
    return Array.from(neighborhoods).sort();
  }, [apartments]);

  const actualPriceRange = useMemo(() => {
    const rents = apartments
      .map(apt => apt.rent)
      .filter(rent => rent > 0);

    if (rents.length === 0) return { min: 0, max: 10000 };

    return {
      min: Math.floor(Math.min(...rents) / 100) * 100,
      max: Math.ceil(Math.max(...rents) / 100) * 100,
    };
  }, [apartments]);

  const filteredApartments = useMemo(() => {
    // First, separate discarded from non-discarded
    const nonDiscarded = apartments.filter(apt => !apt.discarded);

    let filtered = nonDiscarded;

    // Apply tab filter
    switch (activeFilter) {
      case 'visited':
        filtered = nonDiscarded.filter(apt => apt.visited);
        break;
      case 'not-visited':
        filtered = nonDiscarded.filter(apt => !apt.visited);
        break;
      case 'discarded':
        filtered = apartments.filter(apt => apt.discarded);
        break;
      case 'all':
      default:
        filtered = nonDiscarded;
    }

    // Apply neighborhood filter
    if (selectedNeighborhoods.length > 0) {
      filtered = filtered.filter(apt =>
        apt.neighborhood && selectedNeighborhoods.includes(apt.neighborhood)
      );
    }

    // Apply price range filter
    filtered = filtered.filter(apt =>
      apt.rent >= priceRange.min && apt.rent <= priceRange.max
    );

    return filtered;
  }, [apartments, activeFilter, selectedNeighborhoods, priceRange]);

  const stats = useMemo(() => {
    const nonDiscarded = apartments.filter(apt => !apt.discarded);
    return {
      all: nonDiscarded.length,
      visited: nonDiscarded.filter(apt => apt.visited).length,
      notVisited: nonDiscarded.filter(apt => !apt.visited).length,
      discarded: apartments.filter(apt => apt.discarded).length,
    };
  }, [apartments]);

  const handleNeighborhoodToggle = (neighborhood: string) => {
    setSelectedNeighborhoods(prev =>
      prev.includes(neighborhood)
        ? prev.filter(n => n !== neighborhood)
        : [...prev, neighborhood]
    );
  };

  const clearAllFilters = () => {
    setSelectedNeighborhoods([]);
    setPriceRange(actualPriceRange);
  };

  const hasActiveFilters = selectedNeighborhoods.length > 0 ||
    priceRange.min !== actualPriceRange.min ||
    priceRange.max !== actualPriceRange.max;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Home className="w-8 h-8 text-black" strokeWidth={1.5} />
            <h1 className="text-3xl font-light text-black tracking-tight">Renting Help</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/visits"
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <Calendar className="w-4 h-4" strokeWidth={2} />
              Visitas
            </Link>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              Novo apartamento
            </button>
          </div>
        </div>

        {/* Tabs de Filtro */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex gap-8 overflow-x-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`pb-4 px-1 border-b-2 transition-colors whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'border-black text-black font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Todos
              <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{stats.all}</span>
            </button>
            <button
              onClick={() => setActiveFilter('not-visited')}
              className={`pb-4 px-1 border-b-2 transition-colors whitespace-nowrap ${
                activeFilter === 'not-visited'
                  ? 'border-black text-black font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Não visitados
              <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{stats.notVisited}</span>
            </button>
            <button
              onClick={() => setActiveFilter('visited')}
              className={`pb-4 px-1 border-b-2 transition-colors whitespace-nowrap ${
                activeFilter === 'visited'
                  ? 'border-black text-black font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Visitados
              <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{stats.visited}</span>
            </button>
            <button
              onClick={() => setActiveFilter('discarded')}
              className={`pb-4 px-1 border-b-2 transition-colors whitespace-nowrap ${
                activeFilter === 'discarded'
                  ? 'border-black text-black font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Descartados
              <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{stats.discarded}</span>
            </button>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-light text-black">
                  {editingApartment ? 'Editar apartamento' : 'Novo apartamento'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>

              {/* ETAPA 1: Importar ou continuar manualmente */}
              {!editingApartment && !showManualForm && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">IMPORTAR DE ANÚNCIO</label>
                    <p className="text-sm text-gray-600 mb-4">Cole o link do anúncio para preencher automaticamente</p>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="url"
                        placeholder="https://www.imovelweb.com.br/..."
                        value={scrapingUrl}
                        onChange={(e) => setScrapingUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleScrapeUrl();
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={handleScrapeUrl}
                        disabled={isScraping || !scrapingUrl}
                        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-all"
                      >
                        {isScraping ? 'Buscando...' : 'Importar'}
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">ou</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleContinueWithoutUrl}
                    className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                  >
                    Preencher manualmente
                  </button>
                </div>
              )}

              {/* ETAPA 2: Formulário manual (aparece após importar ou clicar em preencher manualmente) */}
              {(editingApartment || showManualForm) && (
                <form onSubmit={handleSubmit} className="space-y-5">
                {formData.images.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-2">IMAGENS IMPORTADAS ({formData.images.length})</label>
                    <div className="grid grid-cols-4 gap-2">
                      {formData.images.slice(0, 4).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-gray-200"
                        />
                      ))}
                    </div>
                    {formData.images.length > 4 && (
                      <p className="text-xs text-gray-500 mt-2">+{formData.images.length - 4} fotos</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">TÍTULO</label>
                  <input
                    type="text"
                    placeholder="Ex: Apartamento Jardins"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">ENDEREÇO</label>
                    <input
                      type="text"
                      placeholder="Ex: Rua Augusta, 123"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">BAIRRO</label>
                    <input
                      type="text"
                      placeholder="Ex: Jardins"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">ALUGUEL</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.rent}
                      onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">CONDOMÍNIO</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.condo}
                      onChange={(e) => setFormData({ ...formData, condo: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">IPTU</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.iptu}
                      onChange={(e) => setFormData({ ...formData, iptu: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">SEGURO</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.insurance}
                      onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-5">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.visited}
                      onChange={(e) => setFormData({ ...formData, visited: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black focus:ring-1"
                    />
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                      <span className="text-sm text-gray-700 group-hover:text-black transition-colors">Já visitei este apartamento</span>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">OBSERVAÇÕES</label>
                  <textarea
                    placeholder="Adicione observações sobre o apartamento..."
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
                    {editingApartment ? 'Atualizar' : 'Cadastrar'}
                  </button>
                </div>
              </form>
              )}
            </div>
          </div>
        )}

        {/* Layout with Sidebar and Content */}
        <div className="flex gap-6">
          {/* Sidebar de Filtros */}
          {showFilters && (
            <div className="w-72 flex-shrink-0">
              <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-8 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-black" strokeWidth={2} />
                    <h3 className="text-lg font-semibold text-black">Filtros</h3>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-gray-600 hover:text-black transition-colors font-medium"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Filtro de Bairros */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-black mb-3">Bairros</h4>
                  {loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {availableNeighborhoods.map(neighborhood => (
                          <label
                            key={neighborhood}
                            className="flex items-center gap-2 cursor-pointer group"
                          >
                            <input
                              type="checkbox"
                              checked={selectedNeighborhoods.includes(neighborhood)}
                              onChange={() => handleNeighborhoodToggle(neighborhood)}
                              className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black focus:ring-1"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                              {neighborhood}
                            </span>
                          </label>
                        ))}
                      </div>
                      {availableNeighborhoods.length === 0 && (
                        <p className="text-sm text-gray-500 italic">Nenhum bairro cadastrado</p>
                      )}
                    </>
                  )}
                </div>

                {/* Filtro de Faixa de Preço */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-semibold text-black mb-3">Faixa de Aluguel</h4>
                  {loading ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 rounded w-12 mb-1 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </div>
                        <div className="h-5 bg-gray-200 rounded w-5 mx-2 animate-pulse"></div>
                        <div className="flex-1 text-right">
                          <div className="h-3 bg-gray-200 rounded w-12 mb-1 ml-auto animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-20 ml-auto animate-pulse"></div>
                        </div>
                      </div>
                      <div className="px-3 py-2">
                        <div className="h-6 bg-gray-200 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Valores selecionados */}
                      <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                        <div>
                          <div className="text-xs text-gray-600 mb-0.5">Mínimo</div>
                          <div className="text-sm font-semibold text-black">
                            R$ {priceRange.min.toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <div className="text-gray-400">—</div>
                        <div className="text-right">
                          <div className="text-xs text-gray-600 mb-0.5">Máximo</div>
                          <div className="text-sm font-semibold text-black">
                            R$ {priceRange.max.toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>

                      {/* MUI Range Slider */}
                      <div className="px-3 py-2">
                      <Slider
                        value={[priceRange.min, priceRange.max]}
                        onChange={(_, newValue) => {
                          const [min, max] = newValue as number[];
                          setPriceRange({ min, max });
                        }}
                        min={actualPriceRange.min}
                        max={actualPriceRange.max}
                        step={100}
                        disableSwap
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                        sx={{
                          color: '#000',
                          '& .MuiSlider-thumb': {
                            width: 22,
                            height: 22,
                            backgroundColor: '#000',
                            border: '3px solid #fff',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                            transition: 'all 0.15s ease-in-out',
                            '&:hover, &.Mui-focusVisible': {
                              boxShadow: '0 3px 8px rgba(0, 0, 0, 0.3)',
                            },
                            '&.Mui-active': {
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                            },
                          },
                          '& .MuiSlider-track': {
                            backgroundColor: '#000',
                            border: 'none',
                            height: 6,
                            transition: 'height 0.15s ease-in-out',
                          },
                          '& .MuiSlider-rail': {
                            backgroundColor: '#e5e7eb',
                            height: 6,
                            opacity: 1,
                          },
                          '& .MuiSlider-valueLabel': {
                            backgroundColor: '#000',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '4px 8px',
                            '& *': {
                              background: 'transparent',
                              color: '#fff',
                            },
                          },
                        }}
                      />
                      </div>
                    </div>
                  )}
                </div>

                {/* Resultados */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  {loading ? (
                    <div className="bg-gray-100 rounded-lg p-4 text-center">
                      <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="bg-black text-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-semibold mb-1">{filteredApartments.length}</div>
                      <div className="text-sm text-gray-300">apartamento{filteredApartments.length !== 1 ? 's' : ''} encontrado{filteredApartments.length !== 1 ? 's' : ''}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Grade de Apartamentos */}
          <div className="flex-1">
            {loading ? (
              // Skeleton Loading
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Skeleton Image */}
                    <div className="h-48 bg-gray-200 animate-pulse"></div>

                    {/* Skeleton Content */}
                    <div className="p-6">
                      {/* Title and badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        </div>
                        <div className="ml-4">
                          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="space-y-3 mb-5">
                        <div className="flex items-start gap-2">
                          <div className="h-4 w-4 bg-gray-200 rounded mt-0.5 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
                        </div>

                        {/* Price details */}
                        <div className="pt-3 border-t border-gray-100">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                            </div>
                            <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
                              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action button */}
                      <div className="space-y-2">
                        <div className="h-[42px] bg-gray-200 rounded-lg w-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                key={`${activeFilter}-${selectedNeighborhoods.join(',')}-${priceRange.min}-${priceRange.max}`}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {filteredApartments.map((apartment, index) => {
                const upcomingVisit = getUpcomingVisit(apartment.id!);
                return (
                  <div
                    key={apartment.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:border-gray-300 transition-all duration-300 group animate-fade-in relative"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Action buttons - shown on hover */}
                    <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <button
                        onClick={() => handleEdit(apartment)}
                        className="p-2 bg-white/95 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-gray-100 hover:scale-110 active:scale-95 transition-all shadow-lg"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await updateApartment(apartment.id!, { discarded: !apartment.discarded });
                            toast.success(apartment.discarded ? 'Apartamento restaurado!' : 'Apartamento descartado!');
                          } catch (error) {
                            console.error('Error updating apartment:', error);
                            toast.error('Erro ao atualizar apartamento. Tente novamente.');
                          }
                        }}
                        className={`p-2 rounded-lg transition-all hover:scale-110 active:scale-95 shadow-lg backdrop-blur-sm ${
                          apartment.discarded
                            ? 'bg-green-500/95 text-white hover:bg-green-600'
                            : 'bg-white/95 text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                        }`}
                        title={apartment.discarded ? 'Restaurar' : 'Descartar'}
                      >
                        {apartment.discarded ? (
                          <RotateCcw className="w-4 h-4" strokeWidth={2} />
                        ) : (
                          <X className="w-4 h-4" strokeWidth={2} />
                        )}
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await deleteApartment(apartment.id!);
                            toast.success('Apartamento excluído com sucesso!');
                          } catch (error) {
                            console.error('Error deleting apartment:', error);
                            toast.error('Erro ao excluir apartamento. Tente novamente.');
                          }
                        }}
                        className="p-2 bg-white/95 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-red-500 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-lg"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>

                {apartment.images && apartment.images.length > 0 && (
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    <img
                      src={apartment.images[0]}
                      alt={apartment.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {apartment.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                        +{apartment.images.length - 1} fotos
                      </div>
                    )}
                    {apartment.url && (
                      <a
                        href={apartment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 bg-black/80 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-lg z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver anúncio
                      </a>
                    )}
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-black mb-1">{apartment.title}</h3>
                      <p className="text-sm text-gray-500">{apartment.neighborhood}</p>
                      {upcomingVisit && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Calendar className="w-3.5 h-3.5 text-purple-600" strokeWidth={2} />
                          <span className="text-xs text-purple-600 font-medium">
                            Visita agendada {upcomingVisit.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às {upcomingVisit.time}
                          </span>
                        </div>
                      )}
                    </div>
                  <div className="flex gap-1.5 ml-2">
                    {apartment.visited && (
                      <div className="p-1.5 bg-blue-50 rounded-lg" title="Visitado">
                        <Eye className="w-3.5 h-3.5 text-blue-600" strokeWidth={2} />
                      </div>
                    )}
                    {apartment.discarded && (
                      <div className="p-1.5 bg-gray-50 rounded-lg" title="Descartado">
                        <X className="w-3.5 h-3.5 text-gray-600" strokeWidth={2} />
                      </div>
                    )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-5">
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-sm">{apartment.address}</span>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Aluguel</span>
                        <span className="font-medium text-black">R$ {apartment.rent.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Condomínio</span>
                        <span className="font-medium text-black">R$ {apartment.condo.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>IPTU</span>
                        <span className="font-medium text-black">R$ {apartment.iptu.toLocaleString()}</span>
                      </div>
                      {apartment.insurance && (
                        <div className="flex justify-between text-gray-600">
                          <span>Seguro</span>
                          <span className="font-medium text-black">R$ {apartment.insurance.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-black border-t border-gray-200 pt-2 mt-2">
                        <span>Total mensal</span>
                        <span>R$ {getTotalCost(apartment).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  </div>

                  {apartment.notes && (
                    <div className="mb-5 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100">
                      {apartment.notes}
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      onClick={() => handleOpenVisitModal(apartment)}
                      className="w-full bg-black text-white py-2.5 rounded-lg hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                    >
                      <Calendar className="w-4 h-4" />
                      {getUpcomingVisit(apartment.id!) ? 'Reagendar Visita' : 'Agendar Visita'}
                    </button>
                  </div>
                </div>
                  </div>
                );
              })}
              </div>
            )}

            {filteredApartments.length === 0 && !loading && (
              <div className="text-center py-20">
                <Filter className="w-16 h-16 text-gray-300 mx-auto mb-6" strokeWidth={1} />
                <h3 className="text-xl font-light text-black mb-2">
                  {activeFilter === 'all' ? 'Nenhum apartamento cadastrado' : 'Nenhum apartamento encontrado'}
                </h3>
                <p className="text-gray-500 mb-8">
                  {activeFilter === 'all'
                    ? 'Comece adicionando seu primeiro apartamento'
                    : 'Tente selecionar outro filtro'
                  }
                </p>
                {activeFilter === 'all' && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
                  >
                    Adicionar apartamento
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Agendamento de Visita */}
      {showVisitModal && selectedApartmentForVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Agendar Visita</h2>
              <button
                onClick={() => {
                  setShowVisitModal(false);
                  setSelectedApartmentForVisit(null);
                  setVisitFormData({ date: null, time: '', notes: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 pb-4 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {selectedApartmentForVisit.title}
              </p>
              <p className="text-sm text-gray-700">
                {selectedApartmentForVisit.address}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Data da visita
                </label>
                <DatePicker
                  selected={visitFormData.date}
                  onChange={(date) => setVisitFormData({ ...visitFormData, date })}
                  dateFormat="dd/MM/yyyy"
                  locale="pt-BR"
                  placeholderText="Selecione a data"
                  minDate={new Date()}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 font-medium cursor-pointer hover:border-gray-400 transition-colors"
                  calendarClassName="custom-calendar"
                  wrapperClassName="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Horário
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={visitFormData.time}
                    onChange={(e) => setVisitFormData({ ...visitFormData, time: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 font-medium cursor-pointer hover:border-gray-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={visitFormData.notes}
                  onChange={(e) => setVisitFormData({ ...visitFormData, notes: e.target.value })}
                  placeholder="Ex: Levar documentos, perguntas sobre o condomínio..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowVisitModal(false);
                  setSelectedApartmentForVisit(null);
                  setVisitFormData({ date: null, time: '', notes: '' });
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleScheduleVisit}
                className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
