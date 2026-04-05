import React, { useState, useEffect } from 'react';
import { Quote, Client, Material, AppUser, CompanySettings } from './types';
import QuoteForm from './components/QuoteForm';
import ClientForm from './components/ClientForm';
import MaterialForm from './components/MaterialForm';
import ClientList from './components/ClientList';
import MaterialList from './components/MaterialList';
import UserManagement from './components/UserManagement';
import QuoteCard from './components/QuoteCard';
import { 
  Plus, Search, FileText, Users, Package, 
  Download, Edit2, Trash2, LayoutDashboard,
  Menu, X, LogIn, LogOut, Settings, RefreshCw,
  UserCircle, ShieldCheck, UserPlus, Save, CheckCircle
} from 'lucide-react';
import { cn, formatCurrency, compressImage } from './lib/utils';
import { format } from 'date-fns';
import { generateQuotePDF } from './lib/pdfService';
import { generatePlumbingLogo } from './lib/logoGenerator';
import { motion, AnimatePresence } from 'motion/react';
import { 
  db, auth, signIn, logOut, handleFirestoreError, OperationType 
} from './lib/firebase';
import { 
  collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc 
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

type View = 'dashboard' | 'quotes' | 'clients' | 'materials' | 'settings' | 'users';

const ALLOWED_EMAILS = [
  'christian.yamepi@gmail.com',
  'eric.bopda99@gmail.com',
];

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [logo, setLogo] = useState<string | null>(null);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  
  const isAllowed = user && user.email && user.emailVerified && (
    ALLOWED_EMAILS.includes(user.email.toLowerCase()) ||
    appUsers.some(u => u.email.toLowerCase() === user.email?.toLowerCase())
  );
  
  // Forms state
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showMaterialForm, setShowMaterialForm] = useState(false);

  // Data state
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    id: 'company',
    companyName: 'Yamepi Plomberie',
    vatNumber: '123 456 789 00012',
    address: '123 Rue de la Tuyauterie, 75000 Paris'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ collection: string; id: string } | null>(null);

  if (error) {
    throw error;
  }

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!isAuthReady || !user) {
      setQuotes([]);
      setClients([]);
      setMaterials([]);
      setAppUsers([]);
      return;
    }

    // Users listener always starts if authenticated
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setAppUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AppUser)));
    }, (err) => {
      console.error('Users listener error:', err);
    });

    // Other listeners start only if allowed
    let unsubQuotes = () => {};
    let unsubClients = () => {};
    let unsubMaterials = () => {};
    let unsubSettings = () => {};

    if (isAllowed) {
      unsubQuotes = onSnapshot(collection(db, 'quotes'), (snapshot) => {
        setQuotes(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Quote)));
      }, (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'quotes');
        } catch (e) {
          setError(e as Error);
        }
      });

      unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
        setClients(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Client)));
      }, (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'clients');
        } catch (e) {
          setError(e as Error);
        }
      });

      unsubMaterials = onSnapshot(collection(db, 'materials'), (snapshot) => {
        setMaterials(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Material)));
      }, (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'materials');
        } catch (e) {
          setError(e as Error);
        }
      });

      unsubSettings = onSnapshot(doc(db, 'settings', 'company'), (snapshot) => {
        if (snapshot.exists()) {
          setCompanySettings(snapshot.data() as CompanySettings);
          if (snapshot.data().logo) {
            setLogo(snapshot.data().logo);
          }
        }
      }, (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, 'settings');
        } catch (e) {
          setError(e as Error);
        }
      });
    }

    return () => {
      unsubQuotes();
      unsubClients();
      unsubMaterials();
      unsubUsers();
      unsubSettings();
    };
  }, [isAuthReady, user, isAllowed]);

  useEffect(() => {
    // Load logo
    const loadLogo = async () => {
      const savedLogo = localStorage.getItem('plumbing_logo');
      if (savedLogo) {
        setLogo(savedLogo);
      } else {
        const generated = await generatePlumbingLogo();
        if (generated) {
          const compressed = await compressImage(generated);
          setLogo(compressed);
          localStorage.setItem('plumbing_logo', compressed);
        }
      }
    };
    loadLogo();
  }, []);

  const handleSaveQuote = async (q: Quote) => {
    if (!user) return;
    try {
      const id = q.id || crypto.randomUUID();
      const quoteData = { ...q, id, ownerId: user.uid };
      await setDoc(doc(db, 'quotes', id), quoteData);
      setToast({ message: 'Preventivo salvato con successo!', type: 'success' });
      setShowQuoteForm(false);
      setEditingQuote(null);
    } catch (err) {
      try {
        handleFirestoreError(err, editingQuote ? OperationType.UPDATE : OperationType.CREATE, 'quotes');
      } catch (e) {
        setError(e as Error);
      }
    }
  };

  const handleSaveClient = async (c: Client) => {
    if (!user) return;
    try {
      const id = c.id || crypto.randomUUID();
      const clientData = { ...c, id, ownerId: user.uid };
      await setDoc(doc(db, 'clients', id), clientData);
      setToast({ message: 'Cliente salvato con successo!', type: 'success' });
      setShowClientForm(false);
      setEditingClient(null);
    } catch (err) {
      try {
        handleFirestoreError(err, editingClient ? OperationType.UPDATE : OperationType.CREATE, 'clients');
      } catch (e) {
        setError(e as Error);
      }
    }
  };

  const handleSaveMaterial = async (m: Material) => {
    if (!user) {
      console.error('No user logged in, cannot save material');
      return;
    }
    console.log('handleSaveMaterial called with:', m);
    try {
      const id = m.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
      const materialData = { ...m, id, ownerId: user.uid };
      console.log('Saving material to Firestore:', materialData);
      await setDoc(doc(db, 'materials', id), materialData);
      setToast({ message: 'Materiale salvato con successo!', type: 'success' });
      console.log('Material saved successfully');
      setShowMaterialForm(false);
      setEditingMaterial(null);
    } catch (err) {
      console.error('Error saving material:', err);
      try {
        handleFirestoreError(err, editingMaterial ? OperationType.UPDATE : OperationType.CREATE, 'materials');
      } catch (e) {
        setError(e as Error);
      }
    }
  };

  const handleSaveSettings = async (settings: CompanySettings) => {
    try {
      let finalSettings = { ...settings };
      if (logo && logo.startsWith('data:image')) {
        const compressed = await compressImage(logo);
        finalSettings.logo = compressed;
      }
      await setDoc(doc(db, 'settings', 'company'), finalSettings);
      setToast({ message: 'Impostazioni salvate con successo!', type: 'success' });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, 'settings');
      } catch (e) {
        setError(e as Error);
      }
    }
  };

  const handleDelete = async (collectionName: string, id: string) => {
    setConfirmDelete({ collection: collectionName, id });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, confirmDelete.collection, confirmDelete.id));
      setToast({ message: 'Elemento eliminato con successo!', type: 'success' });
      setConfirmDelete(null);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, confirmDelete.collection);
      } catch (e) {
        setError(e as Error);
      }
      setConfirmDelete(null);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full text-center space-y-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-200">
            <FileText className="text-white w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Plombier Pro</h1>
            <p className="text-slate-500">Gestisci i tuoi preventivi in modo professionale e veloce.</p>
          </div>
          <button 
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
            Accedi con Google
          </button>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full text-center space-y-8">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-50">
            <X className="text-red-600 w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Accesso Negato</h1>
            <p className="text-slate-500">Spiacenti, il tuo account ({user.email}) non è autorizzato ad accedere a questa applicazione.</p>
          </div>
          <button 
            onClick={logOut}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-semibold"
          >
            Esci e prova un altro account
          </button>
        </div>
      </div>
    );
  }

  const filteredQuotes = quotes.filter(q => 
    q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalQuotes: quotes.length,
    pendingAmount: quotes.filter(q => q.status === 'sent').reduce((sum, q) => sum + q.grandTotal, 0),
    paidAmount: quotes.filter(q => q.status === 'paid').reduce((sum, q) => sum + q.grandTotal, 0),
    totalClients: clients.length,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "bg-slate-900 text-slate-300 w-64 fixed h-full transition-all duration-300 z-50",
        !isSidebarOpen ? "-translate-x-full" : "translate-x-0"
      )}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            {logo ? (
              <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg bg-white p-1" />
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="text-white" />
              </div>
            )}
            <span className="font-bold text-white text-lg">Plombier Pro</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          <NavItem 
            active={view === 'dashboard'} 
            onClick={() => {
              setView('dashboard');
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }} 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
          />
          <NavItem 
            active={view === 'quotes'} 
            onClick={() => {
              setView('quotes');
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }} 
            icon={<FileText size={20} />} 
            label="Preventivi" 
          />
          <NavItem 
            active={view === 'clients'} 
            onClick={() => {
              setView('clients');
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }} 
            icon={<Users size={20} />} 
            label="Clienti" 
          />
          <NavItem 
            active={view === 'materials'} 
            onClick={() => {
              setView('materials');
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }} 
            icon={<Package size={20} />} 
            label="Materiali" 
          />
          <NavItem 
            active={view === 'users'} 
            onClick={() => {
              setView('users');
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }} 
            icon={<ShieldCheck size={20} />} 
            label="Utenti" 
          />
          <div className="pt-4 mt-4 border-t border-slate-800">
            <NavItem 
              active={view === 'settings'} 
              onClick={() => {
                setView('settings');
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }} 
              icon={<Settings size={20} />} 
              label="Impostazioni" 
            />
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 text-slate-400">
            {user.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full" />
            ) : (
              <UserCircle size={24} />
            )}
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
              <p className="text-[10px] truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={logOut}
            className="flex items-center gap-3 w-full px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            <span>Esci</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-w-0",
        isSidebarOpen ? "md:ml-64" : "ml-0"
      )}>
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="font-bold text-slate-800 md:hidden">Plombier Pro</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cerca preventivi, clienti..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg outline-none w-64 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => {
                setEditingQuote(null);
                setShowQuoteForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              <Plus size={18} /> Nuovo Preventivo
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {showQuoteForm ? (
              <motion.div
                key="quote-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <QuoteForm 
                  initialQuote={editingQuote || undefined}
                  clients={clients}
                  materials={materials}
                  onSave={handleSaveQuote}
                  onCancel={() => {
                    setShowQuoteForm(false);
                    setEditingQuote(null);
                  }}
                />
              </motion.div>
            ) : showClientForm ? (
              <motion.div
                key="client-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ClientForm 
                  initialClient={editingClient || undefined}
                  onSave={handleSaveClient}
                  onCancel={() => {
                    setShowClientForm(false);
                    setEditingClient(null);
                  }}
                />
              </motion.div>
            ) : showMaterialForm ? (
              <motion.div
                key="material-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <MaterialForm 
                  initialMaterial={editingMaterial || undefined}
                  onSave={handleSaveMaterial}
                  onCancel={() => {
                    setShowMaterialForm(false);
                    setEditingMaterial(null);
                  }}
                />
              </motion.div>
            ) : view === 'dashboard' ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard label="Preventivi Totali" value={stats.totalQuotes} icon={<FileText className="text-blue-600" />} />
                  <StatCard label="In Attesa" value={formatCurrency(stats.pendingAmount)} icon={<FileText className="text-orange-600" />} />
                  <StatCard label="Pagati" value={formatCurrency(stats.paidAmount)} icon={<FileText className="text-green-600" />} />
                  <StatCard label="Clienti" value={stats.totalClients} icon={<Users className="text-purple-600" />} />
                </div>

                {/* Recent Quotes */}
                <div className="bg-transparent md:bg-white md:rounded-xl md:shadow-sm md:border border-slate-200 overflow-hidden">
                  <div className="p-6 bg-white rounded-xl md:rounded-none border border-slate-200 md:border-none md:border-b border-slate-100 flex justify-between items-center mb-4 md:mb-0">
                    <h3 className="font-bold text-slate-800 text-lg">Preventivi Recenti</h3>
                    <button onClick={() => setView('quotes')} className="text-blue-600 text-sm font-medium hover:underline">Vedi tutti</button>
                  </div>
                  
                  {/* Mobile View */}
                  <div className="md:hidden space-y-4">
                    {filteredQuotes.slice(0, 5).map((q) => (
                      <QuoteCard 
                        key={q.id} 
                        quote={q} 
                        companySettings={companySettings}
                        onEdit={(quote) => {
                          setEditingQuote(quote);
                          setShowQuoteForm(true);
                        }}
                        onDownload={(quote) => generateQuotePDF(quote, companySettings)}
                      />
                    ))}
                    {filteredQuotes.length === 0 && (
                      <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                        Nessun preventivo trovato.
                      </div>
                    )}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                        <tr>
                          <th className="px-6 py-4">Numero</th>
                          <th className="px-6 py-4">Cliente</th>
                          <th className="px-6 py-4">Data</th>
                          <th className="px-6 py-4">Totale</th>
                          <th className="px-6 py-4">Stato</th>
                          <th className="px-6 py-4 text-right">Azioni</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredQuotes.slice(0, 5).map((q) => (
                          <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900">{q.quoteNumber}</td>
                            <td className="px-6 py-4 text-slate-600">{q.clientName}</td>
                            <td className="px-6 py-4 text-slate-500">{format(new Date(q.date), 'dd/MM/yyyy')}</td>
                            <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(q.grandTotal)}</td>
                            <td className="px-6 py-4">
                              <StatusBadge status={q.status} />
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button 
                                onClick={() => generateQuotePDF(q, companySettings)}
                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                title="Scarica PDF"
                              >
                                <Download size={18} />
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingQuote(q);
                                  setShowQuoteForm(true);
                                }}
                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                title="Modifica"
                              >
                                <Edit2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredQuotes.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                              Nessun preventivo trovato.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : view === 'quotes' ? (
              <motion.div key="quotes" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="bg-transparent md:bg-white md:rounded-xl md:shadow-sm md:border border-slate-200 overflow-hidden">
                  <div className="p-6 bg-white rounded-xl md:rounded-none border border-slate-200 md:border-none md:border-b border-slate-100 flex justify-between items-center mb-4 md:mb-0">
                    <h3 className="font-bold text-slate-800 text-lg">Tutti i Preventivi</h3>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden space-y-4">
                    {filteredQuotes.map((q) => (
                      <QuoteCard 
                        key={q.id} 
                        quote={q} 
                        companySettings={companySettings}
                        onEdit={(quote) => {
                          setEditingQuote(quote);
                          setShowQuoteForm(true);
                        }}
                        onDownload={(quote) => generateQuotePDF(quote, companySettings)}
                        onDelete={(id) => handleDelete('quotes', id)}
                      />
                    ))}
                    {filteredQuotes.length === 0 && (
                      <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                        Nessun preventivo trovato.
                      </div>
                    )}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                        <tr>
                          <th className="px-6 py-4">Numero</th>
                          <th className="px-6 py-4">Cliente</th>
                          <th className="px-6 py-4">Data</th>
                          <th className="px-6 py-4">Totale</th>
                          <th className="px-6 py-4">Stato</th>
                          <th className="px-6 py-4 text-right">Azioni</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredQuotes.map((q) => (
                          <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900">{q.quoteNumber}</td>
                            <td className="px-6 py-4 text-slate-600">{q.clientName}</td>
                            <td className="px-6 py-4 text-slate-500">{format(new Date(q.date), 'dd/MM/yyyy')}</td>
                            <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(q.grandTotal)}</td>
                            <td className="px-6 py-4">
                              <StatusBadge status={q.status} />
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button 
                                onClick={() => generateQuotePDF(q, companySettings)}
                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                              >
                                <Download size={18} />
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingQuote(q);
                                  setShowQuoteForm(true);
                                }}
                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleDelete('quotes', q.id)}
                                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
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
              </motion.div>
            ) : view === 'clients' ? (
              <motion.div key="clients" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ClientList 
                  clients={clients} 
                  onAdd={() => {
                    setEditingClient(null);
                    setShowClientForm(true);
                  }}
                  onEdit={(c) => {
                    setEditingClient(c);
                    setShowClientForm(true);
                  }}
                  onDelete={(id) => handleDelete('clients', id)}
                />
              </motion.div>
            ) : view === 'materials' ? (
              <motion.div key="materials" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <MaterialList 
                  materials={materials} 
                  onAdd={() => {
                    setEditingMaterial(null);
                    setShowMaterialForm(true);
                  }}
                  onEdit={(m) => {
                    setEditingMaterial(m);
                    setShowMaterialForm(true);
                  }}
                  onDelete={(id) => handleDelete('materials', id)}
                />
              </motion.div>
            ) : view === 'users' ? (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <UserManagement 
                  users={appUsers} 
                  onSave={async (u) => {
                    try {
                      const email = u.email.toLowerCase();
                      const id = email;
                      await setDoc(doc(db, 'users', id), { ...u, id, email });
                      setToast({ message: 'Utente salvato con successo!', type: 'success' });
                    } catch (err) {
                      try {
                        handleFirestoreError(err, OperationType.WRITE, 'users');
                      } catch (e) {
                        setError(e as Error);
                      }
                    }
                  }}
                  onDelete={(id) => handleDelete('users', id)}
                />
              </motion.div>
            ) : view === 'settings' ? (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800">Impostazioni</h2>
                    <button 
                      onClick={() => handleSaveSettings({ ...companySettings, logo: logo || undefined })}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    >
                      <Save size={18} /> Salva Impostazioni
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700">Logo Aziendale</h3>
                    <div className="flex items-center gap-6">
                      {logo && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <img src={logo} alt="Logo" className="w-32 h-32 object-contain" />
                        </div>
                      )}
                      <div className="space-y-3">
                        <p className="text-sm text-slate-500 max-w-md">
                          Il logo viene generato automaticamente tramite AI. Puoi rigenerarlo se desideri uno stile diverso.
                        </p>
                        <button 
                          disabled={isGeneratingLogo}
                          onClick={async () => {
                            setIsGeneratingLogo(true);
                            setToast({ message: 'Generazione logo in corso...', type: 'success' });
                            try {
                              const generated = await generatePlumbingLogo();
                              if (generated) {
                                const compressed = await compressImage(generated);
                                setLogo(compressed);
                                localStorage.setItem('plumbing_logo', compressed);
                                setToast({ message: 'Logo rigenerato con successo!', type: 'success' });
                              } else {
                                setToast({ message: 'Errore nella generazione del logo. Verifica la tua API Key.', type: 'error' });
                              }
                            } catch (err) {
                              console.error('Logo generation error:', err);
                              setToast({ message: 'Errore durante la generazione del logo.', type: 'error' });
                            } finally {
                              setIsGeneratingLogo(false);
                            }
                          }}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors",
                            isGeneratingLogo && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <RefreshCw size={18} className={cn(isGeneratingLogo && "animate-spin")} /> 
                          {isGeneratingLogo ? 'Generazione...' : 'Rigenera Logo'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Informazioni Aziendali</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Nome Azienda</label>
                        <input 
                          type="text" 
                          value={companySettings.companyName} 
                          onChange={(e) => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Partita IVA / SIRET</label>
                        <input 
                          type="text" 
                          value={companySettings.vatNumber} 
                          onChange={(e) => setCompanySettings({ ...companySettings, vatNumber: e.target.value })}
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Indirizzo</label>
                        <input 
                          type="text" 
                          value={companySettings.address} 
                          onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-400">
                Vista "{view}" in fase di sviluppo...
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200"
            >
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <Trash2 size={24} />
                <h3 className="text-lg font-bold">Conferma eliminazione</h3>
              </div>
              <p className="text-slate-600 mb-6">
                Sei sicuro di voler eliminare questo elemento? Questa azione non può essere annullata.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Annulla
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Elimina
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={cn(
              "fixed bottom-8 left-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border",
              toast.type === 'success' ? "bg-emerald-600 border-emerald-500 text-white" : "bg-red-600 border-red-500 text-white"
            )}
          >
            {toast.type === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all",
        active 
          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <h4 className="text-2xl font-bold text-slate-900 mt-1">{value}</h4>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Quote['status'] }) {
  const styles = {
    draft: "bg-slate-100 text-slate-600",
    sent: "bg-blue-100 text-blue-600",
    accepted: "bg-green-100 text-green-600",
    cancelled: "bg-red-100 text-red-600",
    paid: "bg-emerald-100 text-emerald-600",
  };

  const labels = {
    draft: "Bozza",
    sent: "Inviato",
    accepted: "Accettato",
    cancelled: "Annullato",
    paid: "Pagato",
  };

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold", styles[status])}>
      {labels[status]}
    </span>
  );
}
