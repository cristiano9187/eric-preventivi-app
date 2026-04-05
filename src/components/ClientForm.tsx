import React, { useState } from 'react';
import { Client } from '../types';
import { Save, X, User, Mail, Phone, MapPin } from 'lucide-react';

interface ClientFormProps {
  initialClient?: Client;
  onSave: (client: Client) => void;
  onCancel: () => void;
}

export default function ClientForm({ initialClient, onSave, onCancel }: ClientFormProps) {
  const [client, setClient] = useState<Partial<Client>>(
    initialClient || {
      name: '',
      email: '',
      phone: '',
      address: '',
      createdAt: new Date().toISOString(),
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...client, id: client.id || crypto.randomUUID() } as Client);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-bold text-slate-800">
          {initialClient ? 'Modifica Cliente' : 'Nuovo Cliente'}
        </h2>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <User size={16} /> Nome Completo
          </label>
          <input
            type="text"
            value={client.name}
            onChange={(e) => setClient(prev => ({ ...prev, name: e.target.value }))}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
            placeholder="Es: Mario Rossi"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Mail size={16} /> Email
            </label>
            <input
              type="email"
              value={client.email}
              onChange={(e) => setClient(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="mario.rossi@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Phone size={16} /> Telefono
            </label>
            <input
              type="tel"
              value={client.phone}
              onChange={(e) => setClient(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
              placeholder="+39 123 456 7890"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <MapPin size={16} /> Indirizzo
          </label>
          <textarea
            value={client.address}
            onChange={(e) => setClient(prev => ({ ...prev, address: e.target.value }))}
            className="w-full p-2 border rounded-lg h-24 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Via Roma 123, 00100 Roma"
          />
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
          <Save size={18} /> Salva Cliente
        </button>
      </div>
    </form>
  );
}
