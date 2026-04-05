import React, { useState, useEffect } from 'react';
import { Quote, QuoteItem, Client, Material } from '../types';
import { Plus, Trash2, Save, FileText, X } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { format, addDays } from 'date-fns';

interface QuoteFormProps {
  initialQuote?: Quote;
  clients: Client[];
  materials: Material[];
  onSave: (quote: Quote) => void;
  onCancel: () => void;
}

export default function QuoteForm({ initialQuote, clients, materials, onSave, onCancel }: QuoteFormProps) {
  const [quote, setQuote] = useState<Partial<Quote>>(
    initialQuote || {
      quoteNumber: `Q-${Date.now().toString().slice(-6)}`,
      date: format(new Date(), 'yyyy-MM-dd'),
      validUntil: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      items: [],
      payments: [],
      status: 'draft',
      workDescription: '',
      totalAmount: 0,
      totalTax: 0,
      grandTotal: 0,
    }
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const totalAmount = quote.items?.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0;
    const totalTax = quote.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate) / 100, 0) || 0;
    const grandTotal = totalAmount + totalTax;

    setQuote(prev => ({ ...prev, totalAmount, totalTax, grandTotal }));
  }, [quote.items]);

  const addItem = () => {
    setValidationError(null);
    const newItem: QuoteItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 22,
    };
    setQuote(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
  };

  const addMaterialItem = (material: Material) => {
    setValidationError(null);
    const newItem: QuoteItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      description: material.name,
      quantity: 1,
      unitPrice: material.unitPrice,
      taxRate: 22,
    };
    setQuote(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
  };

  const removeItem = (id: string) => {
    setQuote(prev => ({ ...prev, items: prev.items?.filter(i => i.id !== id) }));
  };

  const updateItem = (id: string, updates: Partial<QuoteItem>) => {
    setQuote(prev => ({
      ...prev,
      items: prev.items?.map(i => (i.id === id ? { ...i, ...updates } : i)),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote.clientId || !quote.items?.length) {
      setValidationError("Seleziona un cliente e aggiungi almeno un articolo.");
      return;
    }
    onSave(quote as Quote);
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-slate-800">
          {initialQuote ? 'Modifica Preventivo' : 'Nuovo Preventivo'}
        </h2>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Cliente</label>
          <select
            value={quote.clientId || ''}
            onChange={(e) => {
              const client = clients.find(c => c.id === e.target.value);
              setQuote(prev => ({ ...prev, clientId: e.target.value, clientName: client?.name || '' }));
            }}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          >
            <option value="">Seleziona un cliente</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Numero Preventivo</label>
          <input
            type="text"
            value={quote.quoteNumber}
            onChange={(e) => setQuote(prev => ({ ...prev, quoteNumber: e.target.value }))}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Stato</label>
          <select
            value={quote.status}
            onChange={(e) => setQuote(prev => ({ ...prev, status: e.target.value as any }))}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="draft">Bozza</option>
            <option value="sent">Inviato</option>
            <option value="accepted">Accettato</option>
            <option value="cancelled">Annullato</option>
            <option value="paid">Pagato</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Data</label>
          <input
            type="date"
            value={quote.date}
            onChange={(e) => setQuote(prev => ({ ...prev, date: e.target.value }))}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Valido fino a</label>
          <input
            type="date"
            value={quote.validUntil}
            onChange={(e) => setQuote(prev => ({ ...prev, validUntil: e.target.value }))}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Descrizione della Fornitura/Lavori</label>
        <textarea
          value={quote.workDescription || ''}
          onChange={(e) => setQuote(prev => ({ ...prev, workDescription: e.target.value }))}
          className="w-full p-3 border rounded-lg h-40 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Descrivi globalmente i lavori da effettuare..."
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Articoli e Servizi</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} /> Aggiungi Riga
            </button>
            
            <div className="relative">
              <select
                onChange={(e) => {
                  const material = materials.find(m => m.id === e.target.value);
                  if (material) {
                    addMaterialItem(material);
                    e.target.value = "";
                  }
                }}
                className="pl-4 pr-10 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors outline-none cursor-pointer appearance-none font-medium"
                defaultValue=""
              >
                <option value="" disabled>+ Aggiungi Materiale</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({formatCurrency(m.unitPrice)})</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Plus size={16} className="text-slate-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-3 border-b">Descrizione</th>
                <th className="p-3 border-b w-24">Quantità</th>
                <th className="p-3 border-b w-32">Prezzo Unit.</th>
                <th className="p-3 border-b w-24">IVA %</th>
                <th className="p-3 border-b w-32">Totale</th>
                <th className="p-3 border-b w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quote.items?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      placeholder="Es: Sostituzione rubinetto"
                      className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                      required
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.quantity || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateItem(item.id, { quantity: val === '' ? 0 : Number(val) });
                      }}
                      className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                      min="0"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.unitPrice || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateItem(item.id, { unitPrice: val === '' ? 0 : Number(val) });
                      }}
                      className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                      step="0.01"
                      min="0"
                    />
                  </td>
                  <td className="p-3">
                    <select
                      value={item.taxRate}
                      onChange={(e) => updateItem(item.id, { taxRate: Number(e.target.value) })}
                      className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value={0}>0%</option>
                      <option value={4}>4%</option>
                      <option value={10}>10%</option>
                      <option value={22}>22%</option>
                    </select>
                  </td>
                  <td className="p-3 font-medium text-slate-700">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-8 pt-6 border-t">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-slate-700">Note / Termini e Condizioni</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setQuote(prev => ({ ...prev, notes: (prev.notes || '') + 'il 50% di acconto prima di iniziare il lavoro. e il resto alla fine. ' }))}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded border border-slate-200 transition-colors"
              >
                Acconto 50%
              </button>
              <button
                type="button"
                onClick={() => setQuote(prev => ({ ...prev, notes: (prev.notes || '') + 'il 70% di acconto prima di iniziare il lavoro. e il resto alla fine. ' }))}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded border border-slate-200 transition-colors"
              >
                Acconto 70%
              </button>
            </div>
          </div>
          <textarea
            value={quote.notes || ''}
            onChange={(e) => setQuote(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Aggiungi note per il cliente..."
          />
        </div>

        <div className="w-full md:w-80 space-y-3 bg-slate-50 p-4 rounded-lg">
          <div className="flex justify-between text-slate-600">
            <span>Imponibile:</span>
            <span>{formatCurrency(quote.totalAmount || 0)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>IVA:</span>
            <span>{formatCurrency(quote.totalTax || 0)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t">
            <span>Totale:</span>
            <span>{formatCurrency(quote.grandTotal || 0)}</span>
          </div>
        </div>
      </div>

      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
          {validationError}
        </div>
      )}

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Annulla
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          <Save size={18} /> Salva Preventivo
        </button>
      </div>
    </form>
  );
}
