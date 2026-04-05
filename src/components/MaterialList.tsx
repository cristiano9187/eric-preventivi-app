import React, { useState } from 'react';
import { Material } from '../types';
import { Search, Plus, Edit2, Trash2, Package, Euro, Tag } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface MaterialListProps {
  materials: Material[];
  onEdit: (material: Material) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export default function MaterialList({ materials, onDelete, onEdit, onAdd }: MaterialListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Materiali e Servizi</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Nuovo Materiale
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Cerca per nome o categoria..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map((material) => (
          <div key={material.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-200 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <Package size={24} />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => onEdit(material)}
                  className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => onDelete(material.id)}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-4">{material.name}</h3>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <Euro size={16} className="text-slate-400" />
                <span className="font-semibold text-slate-900">{formatCurrency(material.unitPrice)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Tag size={16} className="text-slate-400" />
                <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-500 font-medium">
                  {material.category}
                </span>
              </div>
            </div>
          </div>
        ))}
        {filteredMaterials.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
            Nessun materiale trovato.
          </div>
        )}
      </div>
    </div>
  );
}
