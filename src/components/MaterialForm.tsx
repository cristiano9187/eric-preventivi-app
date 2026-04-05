import React, { useState } from 'react';
import { Material } from '../types';
import { Save, X, Package, Euro, Tag } from 'lucide-react';

interface MaterialFormProps {
  initialMaterial?: Material;
  onSave: (material: Material) => void;
  onCancel: () => void;
}

export default function MaterialForm({ initialMaterial, onSave, onCancel }: MaterialFormProps) {
  const [material, setMaterial] = useState<Partial<Material>>(
    initialMaterial || {
      name: '',
      unitPrice: 0,
      category: 'Materiale',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting material:', material);
    const id = material.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
    onSave({ ...material, id } as Material);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-bold text-slate-800">
          {initialMaterial ? 'Modifica Materiale' : 'Nuovo Materiale'}
        </h2>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Package size={16} /> Nome Materiale / Servizio
          </label>
          <input
            type="text"
            value={material.name}
            onChange={(e) => setMaterial(prev => ({ ...prev, name: e.target.value }))}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
            placeholder="Es: Tubo PVC 32mm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Euro size={16} /> Prezzo Unitario (€)
            </label>
            <input
              type="number"
              value={material.unitPrice || ''}
              onChange={(e) => {
                const val = e.target.value;
                setMaterial(prev => ({ ...prev, unitPrice: val === '' ? 0 : Number(val) }));
              }}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
              step="0.01"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Tag size={16} /> Categoria
            </label>
            <select
              value={material.category}
              onChange={(e) => setMaterial(prev => ({ ...prev, category: e.target.value }))}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Materiale">Materiale</option>
              <option value="Manodopera">Manodopera</option>
              <option value="Trasporto">Trasporto</option>
              <option value="Altro">Altro</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Annulla
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save size={18} /> Salva Materiale
        </button>
      </div>
    </form>
  );
}
