import React, { useState, useMemo } from 'react';
import { 
  Search, TrendingUp, ShieldAlert, Wallet, ArrowRightLeft, 
  Info, TrendingDown, Zap, Upload, 
  PieChart as PieIcon, Activity, MessageSquare, Scale, Calculator,
  ArrowUpRight, AlertCircle, CheckCircle2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts';
import { mockFunds, type Fund } from './data/mockFunds';
import { supabase } from './lib/supabase';
import { deepseek } from './lib/deepseek';
import { getFallbackResponse } from './data/expertKnowledge';
import { useEffect } from 'react';

type Tab = 'dashboard' | 'research' | 'portfolio' | 'advisor' | 'chatbot';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFund, setSelectedFund] = useState<Fund | null>(mockFunds[0]);
  const [investmentAmount, setInvestmentAmount] = useState(1000000);
  const [years, setYears] = useState(20);
  const [showChatbot, setShowChatbot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hello! I'm your FundSwap AI Advisor. I can help you analyze your portfolio, explain the difference between Direct and Regular funds, and estimate your lifetime savings. How can I help you today?" }
  ]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    try {
      const response = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { 
            role: "system", 
            content: `You are the FundSwap AI Advisor, an expert in Indian Mutual Funds. Your goal is to help retail investors switch from Regular to Direct plans to save on commissions. 
            The user's current investment amount is ₹${investmentAmount.toLocaleString('en-IN')}.
            Explain concepts like expense ratios, CAGR, and Sharpe ratios simply.`
          },
          ...messages,
          { role: "user", content: userMessage }
        ]
      });

      const assistantMessage = response.choices[0].message.content || "I'm sorry, I couldn't process that.";
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.warn('API Error, using Core Intelligence Fallback:', error);
      // Simulate a small delay for "thinking"
      setTimeout(() => {
        const fallbackMessage = getFallbackResponse(userMessage);
        setMessages(prev => [...prev, { role: 'assistant', content: fallbackMessage }]);
      }, 500);
    }
  };

  // --- Supabase Persistence ---
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('portfolios')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1);
        
        if (data && data.length > 0 && !error) {
          setInvestmentAmount(data[0].total_value);
          setYears(data[0].horizon_years);
        }
      } catch (err) {
        console.warn('Supabase fetch failed.');
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  const saveToSupabase = async (val: number, yr: number) => {
    try {
      // Try to update existing record with id 1, or insert if missing
      const { error } = await supabase
        .from('portfolios')
        .upsert([
          { 
            total_value: val, 
            horizon_years: yr,
            updated_at: new Date() 
          }
        ], { onConflict: 'id' }); // Let Supabase handle the conflict
      
      if (error) throw error;
      console.log('Saved to Supabase successfully!');
    } catch (err) {
      console.error('Supabase Save Error:', err);
    }
  };

  // --- Calculations ---
  const regularCounterpart = useMemo(() => {
    if (!selectedFund) return null;
    const baseName = selectedFund.name.split(' - ')[0];
    return mockFunds.find(f => f.name.includes(baseName) && f.variant === 'Regular');
  }, [selectedFund]);

  const directCounterpart = useMemo(() => {
    if (!selectedFund) return null;
    const baseName = selectedFund.name.split(' - ')[0];
    return mockFunds.find(f => f.name.includes(baseName) && f.variant === 'Direct');
  }, [selectedFund]);

  const savingsData = useMemo(() => {
    if (!directCounterpart || !regularCounterpart) return [];
    const data = [];
    const annualReturn = 0.12; 
    let directBalance = investmentAmount;
    let regularBalance = investmentAmount;

    for (let i = 0; i <= years; i++) {
      data.push({
        year: i,
        direct: Math.round(directBalance),
        regular: Math.round(regularBalance),
        savings: Math.round(directBalance - regularBalance)
      });
      directBalance *= (1 + annualReturn - (directCounterpart.expenseRatio / 100));
      regularBalance *= (1 + annualReturn - (regularCounterpart.expenseRatio / 100));
    }
    return data;
  }, [directCounterpart, regularCounterpart, investmentAmount, years]);

  const totalSavings = savingsData.length > 0 ? savingsData[savingsData.length - 1].savings : 0;

  // --- UI Components ---
  const SidebarItem = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 w-full p-4 rounded-xl transition-all ${activeTab === id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  const HealthMeter = ({ score }: { score: number }) => (
    <div className="relative w-full h-4 bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        className={`h-full ${score > 85 ? 'bg-secondary' : score > 70 ? 'bg-amber-400' : 'bg-rose-500'}`}
      />
    </div>
  );

  return (
    <div className="flex h-screen bg-dark overflow-hidden">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface p-6 rounded-xl shadow-lg flex items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span className="text-primary font-semibold">Loading...</span>
          </div>
        </div>
      )}
      <AnimatePresence>
        {showSuccess && <SuccessOverlay name={userName} value={investmentAmount} />}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 p-6 flex flex-col gap-8 bg-surface/50 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-primary rounded-lg text-white">
            <Zap size={24} fill="currentColor" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Fund<span className="text-primary">Swap</span></h1>
        </div>

        <nav className="flex flex-col gap-2">
          <SidebarItem id="dashboard" icon={Activity} label="Dashboard" />
          <SidebarItem id="research" icon={Search} label="Fund Research" />
          <SidebarItem id="portfolio" icon={PieIcon} label="My Holdings" />
          <SidebarItem id="advisor" icon={Scale} label="Switch Advisor" />
        </nav>

        <div className="mt-auto">
          <div className="glass-card p-4 space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
              <MessageSquare size={14} /> AI Co-pilot
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Analyze your portfolio for expense leakage and portfolio overlap in real-time.
            </p>
            <button 
              onClick={() => setShowChatbot(true)}
              className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-all"
            >
              Start Consultation
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto custom-scrollbar p-8 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10 rounded-full" />
        
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold capitalize">
              {userName ? `Welcome back, ${userName}` : activeTab}
            </h2>
            <p className="text-slate-400 mt-1">
              {userName ? 'Your portfolio has been synced and analyzed.' : 'Intelligent fund insights for retail investors.'}
            </p>
          </div>
          <div className="flex gap-4">
            <input 
              type="file" 
              id="csv-upload" 
              className="hidden" 
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    const text = event.target?.result as string;
                    setLoading(true);
                    
                    try {
                      // Actual CSV Parsing
                      const lines = text.split('\n');
                      const headers = lines[0].split(',');
                      const valueIndex = headers.findIndex(h => h.trim().includes('Investment Value'));
                      const nameIndex = headers.findIndex(h => h.trim().includes('User Name'));
                      
                      let totalValue = 0;
                      let extractedName = '';

                      for (let i = 1; i < lines.length; i++) {
                        const cols = lines[i].split(',');
                        if (cols[valueIndex]) {
                          totalValue += parseFloat(cols[valueIndex]);
                        }
                        if (cols[nameIndex] && !extractedName) {
                          extractedName = cols[nameIndex].trim();
                        }
                      }

                      if (totalValue > 0) {
                        await saveToSupabase(totalValue, years);
                        setInvestmentAmount(totalValue);
                        if (extractedName) setUserName(extractedName);
                        setShowSuccess(true);
                        setTimeout(() => setShowSuccess(false), 5000);
                      } else {
                        alert('Could not find valid investment data in CSV.');
                      }
                    } catch (err) {
                      console.error('CSV Parse Error:', err);
                      alert('Error parsing CSV. Please ensure it follows the demo format.');
                    } finally {
                      setLoading(false);
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            />
            <button 
              onClick={() => document.getElementById('csv-upload')?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/5 transition-all"
            >
              <Upload size={16} /> Import Holdings
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Global Fund Search..."
                className="bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="min-h-0 flex-1">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Top Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Portfolio Value', val: '₹42.5L', icon: Wallet, color: 'text-primary' },
                  { label: 'Annual Leakage', val: '₹34,200', icon: TrendingDown, color: 'text-rose-500' },
                  { label: 'Health Score', val: '84/100', icon: Activity, color: 'text-secondary' },
                  { label: 'Potential Savings', val: '₹8.4L', icon: Zap, color: 'text-amber-400' },
                ].map((stat, i) => (
                  <div key={i} className="glass-card">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">{stat.label}</p>
                        <h4 className="text-2xl font-bold mt-1">{stat.val}</h4>
                      </div>
                      <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                        <stat.icon size={20} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Visuals */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card min-w-0">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-primary" /> Performance Delta Analysis
                  </h3>
                  <div className="h-[350px] w-full" id="dashboard-chart-container">
                    {savingsData.length > 0 && (
                      <ResponsiveContainer width="99%" height={350} minWidth={0}>
                      <AreaChart data={savingsData}>
                        <defs>
                          <linearGradient id="dashGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="year" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/100000}L`} />
                        <Tooltip 
                          contentStyle={{ background: '#161821', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        />
                        <Area type="monotone" dataKey="direct" stroke="#6366F1" strokeWidth={3} fill="url(#dashGradient)" />
                        <Area type="monotone" dataKey="regular" stroke="#475569" strokeWidth={2} fill="transparent" />
                      </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="glass-card">
                   <h3 className="text-lg font-bold mb-6">Efficiency Alerts</h3>
                   <div className="space-y-4">
                     <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex gap-4">
                       <AlertCircle className="text-rose-500 shrink-0" size={20} />
                       <div>
                         <p className="text-sm font-bold text-rose-500">High Expense Leakage</p>
                         <p className="text-xs text-slate-400 mt-1">3 Regular funds in your portfolio are costing you ₹34,200 annually.</p>
                       </div>
                     </div>
                     <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-4">
                       <ShieldAlert className="text-amber-500 shrink-0" size={20} />
                       <div>
                         <p className="text-sm font-bold text-amber-500">Portfolio Overlap</p>
                         <p className="text-xs text-slate-400 mt-1">68% overlap detected between your Nifty 50 and Large Cap holdings.</p>
                       </div>
                     </div>
                     <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20 flex gap-4">
                       <CheckCircle2 className="text-secondary shrink-0" size={20} />
                       <div>
                         <p className="text-sm font-bold text-secondary">Tax Efficiency</p>
                         <p className="text-xs text-slate-400 mt-1">You have ₹1.2L in LTCG harvesting opportunities this year.</p>
                       </div>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'research' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Search sidebar for Research */}
              <div className="lg:col-span-1 space-y-6">
                <div className="glass-card">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Available Funds</h4>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                    {mockFunds.map(fund => (
                      <button 
                        key={fund.id}
                        onClick={() => setSelectedFund(fund)}
                        className={`w-full text-left p-3 rounded-lg transition-all border ${selectedFund?.id === fund.id ? 'bg-primary/10 border-primary' : 'bg-white/5 border-transparent hover:border-white/10'}`}
                      >
                        <p className="text-xs font-bold">{fund.name}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{fund.category} • ER: {fund.expenseRatio}%</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Research Display */}
              <div className="lg:col-span-3 space-y-8">
                {selectedFund ? (
                  <>
                    {/* Header Card */}
                    <div className="glass-card border-l-4 border-l-primary">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-2 py-1 bg-primary/20 text-primary rounded text-[10px] font-bold uppercase tracking-widest">{selectedFund.category}</span>
                          <h3 className="text-2xl font-bold mt-2">{selectedFund.name.split(' - ')[0]}</h3>
                          <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1"><PieIcon size={14} /> AUM: ₹{(selectedFund.metrics.aum / 100).toFixed(1)}k Cr</span>
                            <span className="flex items-center gap-1"><Scale size={14} /> Benchmark: {selectedFund.benchmark}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 uppercase font-bold">Health Score</p>
                          <p className={`text-4xl font-black ${selectedFund.metrics.healthScore > 90 ? 'text-secondary' : 'text-primary'}`}>{selectedFund.metrics.healthScore}</p>
                        </div>
                      </div>
                    </div>

                    {/* Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Regular Card */}
                      <div className="glass-card bg-slate-900/40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <TrendingDown size={120} />
                        </div>
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="font-bold text-slate-400">Regular Plan</h4>
                          <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-slate-400">High Cost</span>
                        </div>
                        <div className="grid grid-cols-2 gap-6 mb-8">
                          <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Exp. Ratio</p>
                            <p className="text-2xl font-bold">{regularCounterpart?.expenseRatio || 'N/A'}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">5Y CAGR</p>
                            <p className="text-2xl font-bold">{regularCounterpart?.cagr.fiveYear || 'N/A'}%</p>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 text-xs text-slate-400 leading-relaxed border border-white/5">
                           Commission driven. Approximately <strong>₹{((regularCounterpart?.expenseRatio || 0) - (directCounterpart?.expenseRatio || 0)).toFixed(2)}%</strong> of your capital is leaked to distributors annually.
                        </div>
                      </div>

                      {/* Direct Card */}
                      <div className="glass-card border-primary/30 relative overflow-hidden group shadow-2xl shadow-primary/10">
                        <div className="absolute top-0 right-0 p-4 opacity-20 text-primary">
                          <Zap size={120} />
                        </div>
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="font-bold text-primary">Direct Plan</h4>
                          <span className="text-[10px] bg-secondary/20 px-2 py-1 rounded text-secondary font-bold">Optimal</span>
                        </div>
                        <div className="grid grid-cols-2 gap-6 mb-8">
                          <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Exp. Ratio</p>
                            <p className="text-2xl font-bold text-secondary">{directCounterpart?.expenseRatio || 'N/A'}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">5Y CAGR</p>
                            <p className="text-2xl font-bold text-secondary">{directCounterpart?.cagr.fiveYear || 'N/A'}%</p>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-secondary/10 text-xs text-secondary leading-relaxed border border-secondary/20">
                           Direct investment. You keep the full benefit of market growth without middleman fees.
                        </div>
                      </div>
                    </div>

                    {/* ETF vs Index Fund Comparison (Special Insight) */}
                    {selectedFund.category === 'Index Fund' && (
                      <div className="glass-card bg-gradient-to-r from-primary/10 to-secondary/10 border-none shadow-xl">
                        <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                          <Activity size={20} className="text-secondary" /> ETF vs. Index Fund: Which is better?
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                          <div className="space-y-3">
                            <p className="font-bold text-slate-300 uppercase tracking-tighter text-xs">ETF (Exchange Traded Fund)</p>
                            <ul className="space-y-2 text-slate-400">
                              <li className="flex gap-2"><CheckCircle2 size={14} className="text-secondary shrink-0" /> Lower expense ratios (often 0.05% - 0.1%)</li>
                              <li className="flex gap-2"><CheckCircle2 size={14} className="text-secondary shrink-0" /> Real-time trading during market hours</li>
                              <li className="flex gap-2"><AlertCircle size={14} className="text-amber-500 shrink-0" /> Requires a Demat account and brokerage</li>
                            </ul>
                          </div>
                          <div className="space-y-3">
                            <p className="font-bold text-slate-300 uppercase tracking-tighter text-xs">Index Fund (This Fund)</p>
                            <ul className="space-y-2 text-slate-400">
                              <li className="flex gap-2"><CheckCircle2 size={14} className="text-secondary shrink-0" /> Automate via SIP without Demat</li>
                              <li className="flex gap-2"><CheckCircle2 size={14} className="text-secondary shrink-0" /> No brokerage or STT on transactions</li>
                              <li className="flex gap-2"><AlertCircle size={14} className="text-amber-500 shrink-0" /> Slightly higher ER than equivalent ETFs</li>
                            </ul>
                          </div>
                        </div>
                        <div className="mt-6 p-3 bg-white/5 rounded-lg text-xs text-slate-400 italic">
                          💡 <strong>Advisor Tip:</strong> If you invest manually and have a Demat account, an ETF might save you an additional 0.1% ER. For long-term automated SIPs, this Index Fund is more convenient.
                        </div>
                      </div>
                    )}

                    {/* Risk & Exposure Meters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="glass-card">
                         <h4 className="text-sm font-bold mb-4 flex items-center gap-2"><Scale size={16} /> Risk Adjusted Metrics</h4>
                         <div className="space-y-4">
                           <div className="flex justify-between items-center">
                             <span className="text-xs text-slate-400">Sharpe Ratio</span>
                             <span className="text-sm font-bold text-secondary">{selectedFund.metrics.sharpeRatio}</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-xs text-slate-400">Volatility (Std Dev)</span>
                             <span className="text-sm font-bold">{selectedFund.metrics.volatility}%</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-xs text-slate-400">Max Drawdown</span>
                             <span className="text-sm font-bold text-rose-500">{selectedFund.metrics.drawdown}%</span>
                           </div>
                         </div>
                      </div>
                      <div className="glass-card md:col-span-2">
                        <h4 className="text-sm font-bold mb-4 flex items-center gap-2"><PieIcon size={16} /> Top Sector Exposure</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mt-6">
                          {selectedFund.exposure.map((exp, idx) => (
                            <div key={idx} className="space-y-2">
                              <div className="flex justify-between text-xs font-medium">
                                <span>{exp.sector}</span>
                                <span>{exp.weight}%</span>
                              </div>
                              <HealthMeter score={exp.weight * 2} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-[600px] flex flex-col items-center justify-center text-center glass-card">
                    <Search size={64} className="text-slate-700 mb-6" />
                    <h3 className="text-xl font-bold">Start Your Research</h3>
                    <p className="text-slate-500 max-w-sm mt-2">Select a fund from the left panel to compare variants and analyze risk-adjusted returns.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'advisor' && (
            <div className="space-y-8 w-full animate-in fade-in zoom-in-95 duration-500">
              <div className="glass-card p-10 flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1 space-y-6">
                  <h3 className="text-4xl font-black leading-tight">Switch to Direct & Save <span className="text-secondary">₹{totalSavings.toLocaleString('en-IN')}</span></h3>
                  <p className="text-slate-400 text-lg leading-relaxed">
                    By switching your holdings from Regular to Direct variants, you could retire with significantly more wealth. 
                    This represents a <span className="text-white font-bold">{(totalSavings/investmentAmount*100).toFixed(1)}% extra growth</span> purely from cost efficiency.
                  </p>
                  
                  <div className="flex flex-col md:flex-row gap-4 pt-4">
                    <div className="flex flex-col gap-1 w-full md:w-64">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Fund to Analyze</label>
                      <select 
                        className="bg-white/5 border border-white/10 rounded-lg p-2 font-bold text-sm"
                        value={selectedFund?.id || ''}
                        onChange={(e) => {
                          const fund = mockFunds.find(f => f.id === e.target.value);
                          if (fund) setSelectedFund(fund);
                        }}
                      >
                        {mockFunds.filter(f => f.variant === 'Direct').map(f => (
                          <option key={f.id} value={f.id} className="bg-dark">{f.name.split(' - ')[0]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Investment (₹)</label>
                      <input 
                        type="number" 
                        className="bg-white/5 border border-white/10 rounded-lg p-2 font-bold"
                        value={investmentAmount}
                        onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                      />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time (Years): {years}</label>
                      <input 
                        type="range" min="1" max="40"
                        className="h-full accent-primary"
                        value={years}
                        onChange={(e) => setYears(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-1/3 glass-card bg-primary/10 border-primary/30 p-8 space-y-6 text-center">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-primary/50">
                    <Calculator size={32} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Projected Lifetime Savings</p>
                    <h4 className="text-4xl font-black text-white mt-1">₹{totalSavings.toLocaleString('en-IN')}</h4>
                  </div>
                  <button className="w-full py-4 bg-primary rounded-xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all">
                    Initiate Switch Now
                  </button>
                  <p className="text-[10px] text-slate-500">Includes estimated tax and exit load impact.</p>
                </div>
              </div>

              {/* Tax Aware Simulation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card">
                  <h4 className="text-lg font-bold mb-6 flex items-center gap-2"><ArrowRightLeft size={20} className="text-amber-400" /> Tax & Exit Load Simulator</h4>
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold">Redemption Value</p>
                        <p className="text-xs text-slate-500 mt-1">Current market value of regular units</p>
                      </div>
                      <p className="text-xl font-bold">₹{investmentAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-rose-500">Exit Load (Est.)</p>
                        <p className="text-xs text-slate-500 mt-1">1% if switched within 1 year</p>
                      </div>
                      <p className="text-xl font-bold text-rose-500">-₹{(investmentAmount * 0.01).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-rose-500">Capital Gains Tax</p>
                        <p className="text-xs text-slate-500 mt-1">Est. 10% on gains {'>'} ₹1.25L</p>
                      </div>
                      <p className="text-xl font-bold text-rose-500">-₹{(investmentAmount * 0.02).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                      <p className="text-lg font-bold">Net Reinvestment</p>
                      <p className="text-2xl font-black text-secondary">₹{(investmentAmount * 0.97).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 flex gap-3">
                      <Info size={16} className="shrink-0" />
                      <p><strong>Breakeven Period:</strong> 14 months. You will recover the tax and exit load costs within 14 months due to lower expense ratio of the Direct variant.</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card min-w-0">
                  <h4 className="text-lg font-bold mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-secondary" /> Wealth Projection</h4>
                  <div className="h-[300px] w-full" id="advisor-chart-container">
                    {savingsData.length > 0 && (
                      <ResponsiveContainer width="99%" height={300} minWidth={0}>
                      <BarChart data={savingsData.filter((_, i) => i % 5 === 0)}>
                        <XAxis dataKey="year" stroke="#475569" fontSize={10} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ background: '#161821', border: 'none', borderRadius: '8px' }} />
                        <Bar dataKey="direct" fill="#6366F1" radius={[4, 4, 0, 0]} name="Wealth with Direct" />
                        <Bar dataKey="regular" fill="#475569" radius={[4, 4, 0, 0]} name="Wealth with Regular" />
                      </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Chatbot Toggle (Hidden when drawer is open to avoid overlap) */}
        {!showChatbot && (
          <button 
            onClick={() => setShowChatbot(true)}
            className="fixed bottom-8 right-8 p-4 rounded-full shadow-2xl bg-primary hover:scale-110 transition-all duration-500 z-50 text-white"
          >
            <MessageSquare size={24} />
          </button>
        )}

        {/* AI Chatbot Drawer */}
        <AnimatePresence>
          {showChatbot && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[400px] bg-surface border-l border-white/10 shadow-[-20px_0_60px_rgba(0,0,0,0.5)] z-40 p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                    <MessageSquare size={20} fill="currentColor" />
                  </div>
                  <div>
                    <h4 className="font-bold">FundSwap AI</h4>
                    <p className="text-[10px] text-secondary font-bold uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" /> Online
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowChatbot(false)}
                  className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <Activity size={14} className="text-primary" />
                      </div>
                    )}
                    <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'rounded-tr-none bg-primary text-white' : 'rounded-tl-none bg-white/5 border border-white/5 text-sm leading-relaxed'} max-w-[85%]`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 relative">
                <input 
                  type="text" 
                  placeholder="Ask about your portfolio..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-4 pr-12 text-sm focus:outline-none focus:border-primary/50"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                  onClick={handleSendMessage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:scale-105 transition-all"
                >
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const SuccessOverlay: React.FC<{ name: string | null; value: number }> = ({ name, value }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] flex items-center justify-center bg-dark/90 backdrop-blur-md"
  >
    <motion.div 
      initial={{ scale: 0.8, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      className="glass-card p-12 text-center max-w-lg border-primary/30 shadow-[0_0_100px_rgba(99,102,241,0.2)]"
    >
      <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={40} className="text-primary animate-bounce" />
      </div>
      <h2 className="text-4xl font-black mb-4">Portfolio Analyzed!</h2>
      <p className="text-slate-400 text-lg mb-8 leading-relaxed">
        Hello <span className="text-white font-bold">{name || 'Investor'}</span>, we found <span className="text-white font-bold">₹{value.toLocaleString('en-IN')}</span> in holdings across 5 AMC accounts.
      </p>
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold">
        Switching to Direct could save you ₹{Math.round(value * 0.15).toLocaleString('en-IN')}
      </div>
    </motion.div>
  </motion.div>
);


export default App;
