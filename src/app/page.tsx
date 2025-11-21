'use client';

import { useState } from 'react';
import { Plus, Home, MapPin, DollarSign, Eye, Heart, X, HelpCircle } from 'lucide-react';
import { useApartments } from '@/hooks/useApartments';
import { Apartment, ApartmentStatus } from '@/types/apartment';

const statusConfig = {
  doubt: { label: 'Em dúvida', icon: HelpCircle, color: 'bg-yellow-100 text-yellow-800' },
  visited: { label: 'Visitado', icon: Eye, color: 'bg-blue-100 text-blue-800' },
  interested: { label: 'Interessado', icon: Heart, color: 'bg-green-100 text-green-800' },
  discarded: { label: 'Descartado', icon: X, color: 'bg-red-100 text-red-800' },
};

export default function HomePage() {
  const { apartments, loading, addApartment, updateApartment, deleteApartment } = useApartments();
  const [showForm, setShowForm] = useState(false);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    address: '',
    rent: '',
    condo: '',
    iptu: '',
    insurance: '',
    status: 'doubt' as ApartmentStatus,
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      address: '',
      rent: '',
      condo: '',
      iptu: '',
      insurance: '',
      status: 'doubt',
      notes: '',
    });
    setEditingApartment(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const apartmentData = {
      title: formData.title,
      address: formData.address,
      rent: Number(formData.rent),
      condo: Number(formData.condo),
      iptu: Number(formData.iptu),
      insurance: formData.insurance ? Number(formData.insurance) : undefined,
      status: formData.status,
      notes: formData.notes,
    };

    if (editingApartment) {
      await updateApartment(editingApartment.id!, apartmentData);
    } else {
      await addApartment(apartmentData);
    }
    
    resetForm();
  };

  const handleEdit = (apartment: Apartment) => {
    setFormData({
      title: apartment.title,
      address: apartment.address,
      rent: apartment.rent.toString(),
      condo: apartment.condo.toString(),
      iptu: apartment.iptu.toString(),
      insurance: apartment.insurance?.toString() || '',
      status: apartment.status,
      notes: apartment.notes || '',
    });
    setEditingApartment(apartment);
    setShowForm(true);
  };

  const getTotalCost = (apartment: Apartment) => {
    return apartment.rent + apartment.condo + apartment.iptu + (apartment.insurance || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Home className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Renting Help</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Adicionar Apartamento
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingApartment ? 'Editar Apartamento' : 'Novo Apartamento'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Título"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Endereço"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Aluguel"
                    value={formData.rent}
                    onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Condomínio"
                    value={formData.condo}
                    onChange={(e) => setFormData({ ...formData, condo: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="IPTU"
                    value={formData.iptu}
                    onChange={(e) => setFormData({ ...formData, iptu: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Seguro Fiança (opcional)"
                    value={formData.insurance}
                    onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ApartmentStatus })}
                  className="w-full p-3 border rounded-lg"
                >
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
                <textarea
                  placeholder="Observações (opcional)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-3 border rounded-lg h-20"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                  >
                    {editingApartment ? 'Atualizar' : 'Salvar'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {apartments.map((apartment) => {
            const status = statusConfig[apartment.status];
            const StatusIcon = status.icon;
            
            return (
              <div key={apartment.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{apartment.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{apartment.address}</span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Aluguel:</span>
                      <span>R$ {apartment.rent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Condomínio:</span>
                      <span>R$ {apartment.condo.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IPTU:</span>
                      <span>R$ {apartment.iptu.toLocaleString()}</span>
                    </div>
                    {apartment.insurance && (
                      <div className="flex justify-between">
                        <span>Seguro Fiança:</span>
                        <span>R$ {apartment.insurance.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-blue-600 border-t pt-1">
                      <span>Total:</span>
                      <span>R$ {getTotalCost(apartment).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {apartment.notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
                    {apartment.notes}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(apartment)}
                    className="flex-1 bg-blue-100 text-blue-700 py-2 rounded hover:bg-blue-200"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteApartment(apartment.id!)}
                    className="flex-1 bg-red-100 text-red-700 py-2 rounded hover:bg-red-200"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {apartments.length === 0 && (
          <div className="text-center py-12">
            <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum apartamento cadastrado</h3>
            <p className="text-gray-500 mb-4">Comece adicionando seu primeiro apartamento</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Adicionar Apartamento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
