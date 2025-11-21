'use client';

import { useState, useMemo } from 'react';
import { Plus, Home, MapPin, Eye, Heart, X, Filter, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useApartments } from '@/hooks/useApartments';
import { Apartment } from '@/types/apartment';
import Link from 'next/link';

type FilterTab = 'all' | 'visited' | 'interested' | 'not-visited' | 'discarded';

export default function HomePage() {
  const { apartments, loading, addApartment, updateApartment, deleteApartment } = useApartments();
  const [showForm, setShowForm] = useState(false);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const [formData, setFormData] = useState({
    title: '',
    address: '',
    neighborhood: '',
    rent: '',
    condo: '',
    iptu: '',
    insurance: '',
    visited: false,
    interested: false,
    discarded: false,
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
      interested: false,
      discarded: false,
      notes: '',
    });
    setEditingApartment(null);
    setShowForm(false);
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
        interested: formData.interested,
        discarded: formData.discarded,
        notes: formData.notes,
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
      interested: apartment.interested,
      discarded: apartment.discarded,
      notes: apartment.notes || '',
    });
    setEditingApartment(apartment);
    setShowForm(true);
  };

  const getTotalCost = (apartment: Apartment) => {
    return apartment.rent + apartment.condo + apartment.iptu + (apartment.insurance || 0);
  };

  const filteredApartments = useMemo(() => {
    switch (activeFilter) {
      case 'visited':
        return apartments.filter(apt => apt.visited);
      case 'not-visited':
        return apartments.filter(apt => !apt.visited);
      case 'interested':
        return apartments.filter(apt => apt.interested);
      case 'discarded':
        return apartments.filter(apt => apt.discarded);
      default:
        return apartments;
    }
  }, [apartments, activeFilter]);

  const stats = useMemo(() => ({
    all: apartments.length,
    visited: apartments.filter(apt => apt.visited).length,
    notVisited: apartments.filter(apt => !apt.visited).length,
    interested: apartments.filter(apt => apt.interested).length,
    discarded: apartments.filter(apt => apt.discarded).length,
  }), [apartments]);

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
              onClick={() => setActiveFilter('interested')}
              className={`pb-4 px-1 border-b-2 transition-colors whitespace-nowrap ${
                activeFilter === 'interested'
                  ? 'border-black text-black font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Interessado
              <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{stats.interested}</span>
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
              <form onSubmit={handleSubmit} className="space-y-5">
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
                  <label className="block text-xs font-medium text-gray-600 mb-3">STATUS</label>
                  <div className="space-y-2">
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
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.interested}
                        onChange={(e) => setFormData({ ...formData, interested: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black focus:ring-1"
                      />
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                        <span className="text-sm text-gray-700 group-hover:text-black transition-colors">Estou interessado</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.discarded}
                        onChange={(e) => setFormData({ ...formData, discarded: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black focus:ring-1"
                      />
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                        <span className="text-sm text-gray-700 group-hover:text-black transition-colors">Descartado</span>
                      </div>
                    </label>
                  </div>
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
                    {editingApartment ? 'Atualizar' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredApartments.map((apartment) => {
            return (
              <div key={apartment.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-black mb-1">{apartment.title}</h3>
                    <p className="text-sm text-gray-500">{apartment.neighborhood}</p>
                  </div>
                  <div className="flex gap-1.5 ml-2">
                    {apartment.visited && (
                      <div className="p-1.5 bg-blue-50 rounded-lg" title="Visitado">
                        <Eye className="w-3.5 h-3.5 text-blue-600" strokeWidth={2} />
                      </div>
                    )}
                    {apartment.interested && (
                      <div className="p-1.5 bg-emerald-50 rounded-lg" title="Interessado">
                        <Heart className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
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

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(apartment)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium transition-all"
                  >
                    Editar
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
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 text-sm font-medium transition-all"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>

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
  );
}
