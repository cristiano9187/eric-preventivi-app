import React from 'react';
import { Quote, CompanySettings } from '../types';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import { Download, Edit2, ExternalLink, Trash2 } from 'lucide-react';

interface QuoteCardProps {
  quote: Quote;
  companySettings: CompanySettings;
  onEdit: (quote: Quote) => void;
  onDownload: (quote: Quote) => void;
  onDelete?: (id: string) => void;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, companySettings, onEdit, onDownload, onDelete }) => {
  const paidAmount = quote.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const remainingAmount = quote.grandTotal - paidAmount;

  const getStatusColor = (status: Quote['status']) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-600';
      case 'sent': return 'bg-blue-100 text-blue-600';
      case 'accepted': return 'bg-green-100 text-green-600';
      case 'cancelled': return 'bg-red-100 text-red-600';
      case 'paid': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4 mb-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-blue-600 font-bold text-sm uppercase tracking-wider">
            {quote.quoteNumber}
          </span>
          <h3 className="text-lg font-bold text-slate-900 uppercase">
            {quote.clientName}
          </h3>
          <p className="text-slate-400 text-sm">
            {format(new Date(quote.date), 'dd/MM/yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onDownload(quote)}
            className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
            title="Scarica PDF"
          >
            <Download size={20} />
          </button>
          <button 
            onClick={() => onEdit(quote)}
            className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            title="Modifica"
          >
            <Edit2 size={20} />
          </button>
          {onDelete && (
            <button 
              onClick={() => onDelete(quote.id)}
              className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
              title="Elimina"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CLIENTE</p>
          <p className="text-sm font-semibold text-slate-700 truncate">{quote.clientName}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">TOTALE</p>
          <p className="text-sm font-bold text-slate-900">{formatCurrency(quote.grandTotal)}</p>
        </div>
      </div>

      <div className="pt-4 flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", 
          remainingAmount > 0 ? "bg-orange-500" : "bg-emerald-500"
        )} />
        <p className="text-sm font-bold text-slate-800 uppercase tracking-tight">
          {remainingAmount > 0 ? (
            <>RESTE: <span className="text-orange-600">{formatCurrency(remainingAmount)}</span></>
          ) : (
            <span className="text-emerald-600">SALDATO</span>
          )}
        </p>
        <div className="ml-auto">
           <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase", getStatusColor(quote.status))}>
            {quote.status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuoteCard;

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
