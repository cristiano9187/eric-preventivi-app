import React, { useState } from 'react';
import { Client } from '../types';
import { Search, Plus, Edit2, Trash2, User, Phone, Mail, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export default function ClientList({ clients, onEdit, onDelete, onAdd }: ClientListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Clienti</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Nuovo Cliente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Cerca per nome, telefono, email..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-200 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <User size={24} />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => onEdit(client)}
                  className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => onDelete(client.id)}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-4">{client.name}</h3>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-slate-400" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-slate-400" />
                <span>{client.email || 'Nessuna email'}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-slate-400 mt-0.5" />
                <span>{client.address || 'Nessun indirizzo'}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400">
              Aggiunto il {format(new Date(client.createdAt), 'dd/MM/yyyy')}
            </div>
          </div>
        ))}
        {filteredClients.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
            Nessun cliente trovato.
          </div>
        )}
      </div>
    </div>
  );
}
