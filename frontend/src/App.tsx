import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { translations } from './translations';
import { 
  TrendingUp, Activity, AlertCircle, User, Settings, 
  LayoutDashboard, MessageSquare, Landmark, Warehouse, Droplets, Send, Bug, Camera, CheckCircle,
  Calculator, MousePointer2, IndianRupee, LogOut, ExternalLink, Package, History, Languages
} from 'lucide-react';
import './App.css';

const API_BASE = "http://localhost:8000/api/v1";

interface Mandi { id: number; name: string; state: string; }
interface Commodity { id: number; name: string; msp: number; }
interface PriceHistory { date: string; modal_price: number; arrivals: number; }
interface Prediction { date: string; predicted_price: number; lower_90_ci: number; upper_90_ci: number; }
interface Weather { date: string; rainfall: number; temperature: number; }
interface NDVI { date: string; ndvi: number; }
interface Recommendation { mandi_name: string; predicted_price: number; distance_km: number; transport_cost: number; net_profit: number; }
interface Alert { id: number; title: string; content: string; category: string; severity: string; }
interface Scheme { id: number; title: string; description: string; benefit_amount: string; eligibility_criteria: string; state: string; link: string; }
interface ColdStorage { id: number; name: string; capacity_mt: number; available_mt: number; price_per_qtl_month: number; storage_type: string; }
interface UserBooking { id: number; storage_name: string; commodity_name: string; quantity: number; duration: number; date: string; status: string; }
interface IrrigationAdvice { status: string; advice: string; icon: string; rainfall_7d: number; avg_temp_7d: number; ndvi: number; }

function App() {
  const [appState, setAppState] = useState<'landing' | 'dashboard' | 'auth'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [lang, setLang] = useState<'en' | 'te'>('te'); // Default to Telugu
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ai' | 'schemes' | 'storage' | 'planner' | 'diagnosis' | 'calculator'>('dashboard');
  const t = translations[lang];

  const [mandis, setMandis] = useState<Mandi[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [selectedMandi, setSelectedMandi] = useState<number>(0);
  const [selectedComm, setSelectedComm] = useState<number>(0);
  
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [weather, setWeather] = useState<Weather[]>([]);
  const [ndvi, setNdvi] = useState<NDVI[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [storage, setStorage] = useState<ColdStorage[]>([]);
  const [myBookings, setMyBookings] = useState<UserBooking[]>([]);
  const [irrigation, setIrrigation] = useState<IrrigationAdvice | null>(null);
  const [loading, setLoading] = useState(false);

  const [userLoc, setUserLoc] = useState({ lat: 17.9689, lon: 79.5941 });
  const [tempLoc, setTempLoc] = useState({ lat: 17.9689, lon: 79.5941 });
  const [showProfile, setShowProfile] = useState(false);

  // Auth Forms
  const [authForm, setAuthForm] = useState({ username: '', password: '', email: '', full_name: '' });

  // Chat State
  const [chatMsg, setChatMsg] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    {role: 'bot', text: 'నమస్కారం! నేను మీ AI వ్యవసాయ సలహాదారుని. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?'}
  ]);

  // Diagnosis State
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [diagnosisResult, setDiagnosisResult] = useState<{issue: string, remedy: string, prevention: string} | null>(null);

  // Calculator State
  const [calcInputs, setCalcInputs] = useState({ seeds: 5000, fert: 8000, labor: 10000, yield: 20 });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuth(token);
    }
    
    const fetchData = async () => {
      try {
        const [mRes, cRes, aRes] = await Promise.all([
          axios.get(`${API_BASE}/mandis`),
          axios.get(`${API_BASE}/commodities`),
          axios.get(`${API_BASE}/alerts`)
        ]);
        setMandis(mRes.data);
        setCommodities(cRes.data);
        setAlerts(aRes.data);
        if (mRes.data.length > 0) setSelectedMandi(mRes.data[0].id);
        if (cRes.data.length > 0) setSelectedComm(cRes.data[0].id);
      } catch (err) {
        console.error("Error fetching initial data", err);
      }
    };
    fetchData();
  }, []);

  const checkAuth = async (token: string) => {
    try {
      const res = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      setIsLoggedIn(true);
      if (res.data.latitude) {
          setUserLoc({lat: res.data.latitude, lon: res.data.longitude});
          setTempLoc({lat: res.data.latitude, lon: res.data.longitude});
      }
      fetchMyBookings(token);
    } catch (err) {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
    }
  };

  const fetchMyBookings = async (token: string) => {
    try {
      const res = await axios.get(`${API_BASE}/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyBookings(res.data);
    } catch (err) {
      console.error("Error fetching bookings", err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (authMode === 'login') {
        const res = await axios.post(`${API_BASE}/auth/login`, {
          username: authForm.username,
          password: authForm.password
        });
        localStorage.setItem('token', res.data.access_token);
        await checkAuth(res.data.access_token);
        setAppState('dashboard');
      } else {
        const res = await axios.post(`${API_BASE}/auth/register`, authForm);
        localStorage.setItem('token', res.data.access_token);
        await checkAuth(res.data.access_token);
        setAppState('dashboard');
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || "Authentication failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    setAppState('landing');
  };

  useEffect(() => {
    const fetchForecast = async () => {
      if (!selectedMandi || !selectedComm || mandis.length === 0) return;
      setLoading(true);
      try {
        const mandi = mandis.find(m => m.id === selectedMandi);
        const state = mandi?.state || '';
        
        const [hRes, pRes, wRes, nRes, rRes, sRes, stRes, iRes] = await Promise.all([
          axios.get(`${API_BASE}/history?mandi_id=${selectedMandi}&commodity_id=${selectedComm}&days=30`),
          axios.get(`${API_BASE}/predict?mandi_id=${selectedMandi}&commodity_id=${selectedComm}`),
          axios.get(`${API_BASE}/weather?mandi_id=${selectedMandi}&days=30`),
          axios.get(`${API_BASE}/ndvi?mandi_id=${selectedMandi}&days=30`),
          axios.get(`${API_BASE}/recommend-mandi?commodity_id=${selectedComm}&lat=${userLoc.lat}&lon=${userLoc.lon}`),
          axios.get(`${API_BASE}/schemes?state=${state}`),
          axios.get(`${API_BASE}/storage?mandi_id=${selectedMandi}`),
          axios.get(`${API_BASE}/irrigation-advice/${selectedMandi}`)
        ]);
        setHistory(hRes.data);
        setPrediction(pRes.data);
        setWeather(wRes.data);
        setNdvi(nRes.data);
        setRecommendations(rRes.data);
        setSchemes(sRes.data);
        setStorage(stRes.data);
        setIrrigation(iRes.data);
      } catch (err) {
        console.error("Error fetching forecast data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, [selectedMandi, selectedComm, userLoc, mandis]);

  const saveProfile = () => {
    setUserLoc(tempLoc);
    setShowProfile(false);
  };

  const handleSendChat = async () => {
    if (!chatMsg.trim()) return;
    const userMsg = chatMsg;
    const newMessages = [...messages, {role: 'user' as const, text: userMsg}];
    setMessages(newMessages);
    setChatMsg('');
    
    try {
      const res = await axios.post(`${API_BASE}/chat`, {
        message: userMsg,
        mandi_name: mandis.find(m => m.id === selectedMandi)?.name || "Unknown",
        commodity_name: commodities.find(c => c.id === selectedComm)?.name || "Unknown"
      });
      setMessages(prev => [...prev, {role: 'bot', text: res.data.response}]);
    } catch (err) {
      setMessages(prev => [...prev, {role: 'bot', text: "I'm having trouble connecting to my knowledge base right now. Please try again later."}]);
    }
  };

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const runDiagnosis = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const commName = commodities.find(c => c.id === selectedComm)?.name || "Crop";
      if (selectedSymptoms.includes('Yellow Leaves')) {
        setDiagnosisResult({
          issue: `${commName} Nitrogen Deficiency`,
          remedy: "Apply Urea or balanced NPK fertilizer. Ensure proper drainage.",
          prevention: "Regular soil testing and balanced fertilization before sowing."
        });
      } else if (selectedSymptoms.includes('Holes in Leaves')) {
        setDiagnosisResult({
          issue: `${commName} Pest Attack (Leaf Folder)`,
          remedy: "Spray Neem oil or recommended insecticide (e.g., Chlorpyrifos).",
          prevention: "Intercropping with repellent plants and pheromone traps."
        });
      } else {
        setDiagnosisResult({
          issue: "Minor Environmental Stress",
          remedy: "Ensure consistent irrigation and monitor for next 48 hours.",
          prevention: "Maintain optimal crop spacing and soil health."
        });
      }
    }, 1500);
  };

  const handleBooking = async (storageId: number) => {
    if (!isLoggedIn) {
      setAppState('auth');
      return;
    }
    const qty = prompt("Enter quantity to store (quintals):", "100");
    if (!qty) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/bookings`, {
        storage_id: storageId,
        commodity_id: selectedComm,
        quantity_qtl: parseFloat(qty),
        duration_months: 3
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Space Booked Successfully! View details in 'My Inventory'.");
      if (token) fetchMyBookings(token);
    } catch (err) {
      alert("Failed to book space. Please try again.");
    }
  };

  const currentPrice = history.length > 0 ? history[history.length - 1].modal_price : 0;
  const isRising = prediction && prediction.predicted_price > currentPrice;

  const combinedData = weather.map((w, i) => ({
    date: w.date,
    rainfall: w.rainfall,
    ndvi: ndvi[i]?.ndvi || 0
  }));

  const commonSymptoms = ["Yellow Leaves", "Holes in Leaves", "White Spots", "Wilting Stem", "Stunted Growth"];

  const totalInvestment = calcInputs.seeds + calcInputs.fert + calcInputs.labor;
  const expectedRevenue = calcInputs.yield * (prediction?.predicted_price || currentPrice);
  const projectedProfit = expectedRevenue - totalInvestment;

  const tsPrice = recommendations.find(r => mandis.find(m => m.name === r.mandi_name)?.state === 'Telangana')?.predicted_price || currentPrice;
  const apPrice = recommendations.find(r => mandis.find(m => m.name === r.mandi_name)?.state === 'Andhra Pradesh')?.predicted_price || currentPrice * 0.95;

  if (appState === 'landing') {
    return (
      <div className="landing-container" onClick={() => setAppState(isLoggedIn ? 'dashboard' : 'auth')}>
        <div className="app-bg"></div>
        <div className="app-overlay"></div>
        <div className="landing-logo">{t.title}</div>
        <div className="landing-subtitle">{lang === 'te' ? 'వ్యవసాయ భవిష్యత్తును బలోపేతం చేయడం' : 'Empowering the Future of Farming'}</div>
        <div className="tap-prompt"><MousePointer2 size={24} style={{marginRight: '10px'}} /> {lang === 'te' ? 'ప్రవేశించడానికి ఎక్కడైనా నొక్కండి' : 'Tap anywhere to enter'}</div>
      </div>
    );
  }

  if (appState === 'auth') {
    return (
      <div className="landing-container">
        <div className="app-bg"></div>
        <div className="app-overlay"></div>
        <div className="glass-card" style={{width: '400px', textAlign: 'left'}}>
          <div className="card-title" style={{justifyContent: 'center', fontSize: '1.5rem'}}>
            {authMode === 'login' ? t.login : t.register}
          </div>
          <form onSubmit={handleAuth} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            {authMode === 'register' && (
              <>
                <input 
                  type="text" className="profile-input" placeholder={t.fullName} required
                  value={authForm.full_name} onChange={e => setAuthForm({...authForm, full_name: e.target.value})}
                />
                <input 
                  type="email" className="profile-input" placeholder={t.email} required
                  value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})}
                />
              </>
            )}
            <input 
              type="text" className="profile-input" placeholder={t.username} required
              value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})}
            />
            <input 
              type="password" className="profile-input" placeholder={t.password} required
              value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})}
            />
            <button type="submit" className="profile-btn">
              {authMode === 'login' ? t.login : t.register}
            </button>
          </form>
          <div style={{marginTop: '20px', textAlign: 'center', fontSize: '0.9rem'}}>
            {authMode === 'login' ? (lang === 'te' ? 'ఖాతా లేదా? ' : "Don't have an account? ") : (lang === 'te' ? 'ఇప్పటికే ఖాతా ఉందా? ' : "Already have an account? ")}
            <span 
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              style={{color: 'var(--accent)', fontWeight: 'bold', cursor: 'pointer'}}
            >
              {authMode === 'login' ? t.register : t.login}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app-bg"></div>
      <div className="app-overlay"></div>
      <div className="app-container">
        <aside className="sidebar">
          <div className="brand">
            <h1>{t.title}</h1>
          </div>

          <nav className="nav-menu">
            <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <LayoutDashboard size={20} /> {t.navDashboard}
            </button>
            <button className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
              <MessageSquare size={20} /> {t.navAI}
            </button>
            <button className={`nav-item ${activeTab === 'diagnosis' ? 'active' : ''}`} onClick={() => setActiveTab('diagnosis')}>
              <Bug size={20} /> {t.navDiagnosis}
            </button>
            <button className={`nav-item ${activeTab === 'calculator' ? 'active' : ''}`} onClick={() => setActiveTab('calculator')}>
              <Calculator size={20} /> {t.navCalc}
            </button>
            <button className={`nav-item ${activeTab === 'schemes' ? 'active' : ''}`} onClick={() => setActiveTab('schemes')}>
              <Landmark size={20} /> {t.navSchemes}
            </button>
            <button className={`nav-item ${activeTab === 'storage' ? 'active' : ''}`} onClick={() => setActiveTab('storage')}>
              <Warehouse size={20} /> {t.navStorage}
            </button>
            <button className={`nav-item ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => setActiveTab('planner')}>
              <Droplets size={20} /> {t.navPlanner}
            </button>
          </nav>

          <div className="alerts-section">
            <div className="glass-card" style={{padding: '15px', background: 'rgba(255,255,255,0.05)', marginBottom: '20px'}}>
               <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <div style={{width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <User size={20} />
                  </div>
                  <div>
                    <div style={{fontWeight: 'bold', fontSize: '0.9rem'}}>{user?.full_name || 'Farmer'}</div>
                    <div style={{fontSize: '0.7rem', color: 'var(--text-dim)'}}>@{user?.username}</div>
                  </div>
               </div>
               <button onClick={handleLogout} style={{width: '100%', marginTop: '15px', padding: '8px', background: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.2)', color: '#ef5350', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'}}>
                 <LogOut size={14} /> {t.logout}
               </button>
            </div>
            {alerts.slice(0, 2).map(alert => (
              <div key={alert.id} className="glass-card" style={{padding: '15px', fontSize: '0.8rem', marginBottom: '10px'}}>
                <div style={{fontWeight: 'bold', display: 'flex', gap: '8px', marginBottom: '5px'}}>
                  <AlertCircle size={14} color={alert.severity === 'warning' ? '#f9a825' : '#4caf50'} />
                  {alert.title}
                </div>
                <div style={{color: 'var(--text-dim)'}}>{alert.content.substring(0, 50)}...</div>
              </div>
            ))}
          </div>
        </aside>

        <main className="main-wrapper">
          <header>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
               <Languages size={20} />
               <select 
                 value={lang} 
                 onChange={(e) => setLang(e.target.value as 'en' | 'te')}
                 style={{background: 'var(--glass)', border: '1px solid var(--glass-border)', color: '#fff', padding: '5px 15px', borderRadius: '20px'}}
               >
                 <option value="te">తెలుగు (Telugu)</option>
                 <option value="en">English</option>
               </select>
            </div>
            <button className="btn-icon" onClick={() => setShowProfile(!showProfile)}>
              <Settings size={20} />
            </button>
          </header>

          <div className="content-area">
            <div className="glass-card global-selectors">
              <select value={selectedMandi} onChange={(e) => setSelectedMandi(Number(e.target.value))}>
                {mandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <select value={selectedComm} onChange={(e) => setSelectedComm(Number(e.target.value))}>
                {commodities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {showProfile && (
              <div className="glass-card" style={{marginBottom: '30px'}}>
                <div className="card-title"><User size={20} style={{marginRight: '10px'}} /> {t.profileTitle}</div>
                <div className="profile-grid">
                  <div>
                    <label className="summary-label">{t.lat}</label>
                    <input type="number" className="profile-input" value={tempLoc.lat} onChange={(e) => setTempLoc({...tempLoc, lat: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="summary-label">{t.lon}</label>
                    <input type="number" className="profile-input" value={tempLoc.lon} onChange={(e) => setTempLoc({...tempLoc, lon: Number(e.target.value)})} />
                  </div>
                </div>
                <button className="profile-btn" onClick={saveProfile}>{t.save}</button>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div className="dashboard-grid">
                {loading ? (
                  <div className="loading-overlay full-width"><div className="loader"></div></div>
                ) : (
                  <>
                    <div className="glass-card">
                      <div className="card-title"><TrendingUp size={20} style={{marginRight: '10px'}} /> {t.forecastTitle}</div>
                      <div className="forecast-highlight">
                        <div className="summary-label">{t.prediction} ({t.nextWeek})</div>
                        <div className="forecast-price">₹{prediction?.predicted_price.toFixed(0)}</div>
                        <div className="summary-label">Conf. Range: ₹{prediction?.lower_90_ci.toFixed(0)} - ₹{prediction?.upper_90_ci.toFixed(0)}</div>
                      </div>
                      <div className={`advisory ${isRising ? 'hold' : 'sell'}`}>
                        {isRising ? t.hold : t.sell}
                      </div>
                    </div>

                    <div className="glass-card">
                      <div className="card-title"><IndianRupee size={20} style={{marginRight: '10px'}} /> {lang === 'te' ? 'రాష్ట్ర పోలిక' : 'State Comparison'}</div>
                      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px'}}>
                        <div style={{textAlign: 'center', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px'}}>
                          <div className="summary-label">{lang === 'te' ? 'తెలంగాణ' : 'Telangana'}</div>
                          <div className="summary-value" style={{fontSize: '1.75rem', marginTop: '5px'}}>₹{tsPrice.toFixed(0)}</div>
                        </div>
                        <div style={{textAlign: 'center', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px'}}>
                          <div className="summary-label">{lang === 'te' ? 'ఆంధ్రప్రదేశ్' : 'Andhra Pradesh'}</div>
                          <div className="summary-value" style={{fontSize: '1.75rem', marginTop: '5px'}}>₹{apPrice.toFixed(0)}</div>
                        </div>
                      </div>
                      <div style={{marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)'}}>
                         <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                            <div className="summary-label">{lang === 'te' ? 'సమీప మార్కెట్ సంభావ్యత' : 'Nearby Market Potential'}</div>
                            <div className="badge" style={{background: 'rgba(76, 175, 80, 0.1)', color: '#81c784', fontSize: '0.6rem'}}>
                              {storage.length} {lang === 'te' ? 'స్టోరేజ్ సౌకర్యాలు కనుగొనబడ్డాయి' : 'Storage Facilities Found'}
                            </div>
                         </div>
                         {recommendations.slice(0, 2).map((r, i) => (
                           <div key={i} style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem'}}>
                             <span style={{fontWeight: '600'}}>{r.mandi_name}</span>
                             <span style={{color: 'var(--accent)'}}>₹{r.predicted_price.toFixed(0)}</span>
                           </div>
                         ))}
                      </div>
                    </div>

                    <div className="glass-card full-width">
                      <div className="card-title"><Activity size={20} style={{marginRight: '10px'}} /> {t.historyTitle}</div>
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={history}>
                            <defs>
                              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4caf50" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#4caf50" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorArrivals" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" hide />
                            <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{background: '#1a1f1a', border: '1px solid var(--glass-border)', borderRadius: '8px'}} />
                            <Area yAxisId="left" type="monotone" dataKey="modal_price" name={t.price} stroke="#81c784" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={4} />
                            <Area yAxisId="right" type="monotone" dataKey="arrivals" name={t.arrivals} stroke="#94a3b8" fillOpacity={1} fill="url(#colorArrivals)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="glass-card full-width">
                      <div className="card-title"><Droplets size={20} style={{marginRight: '10px'}} /> {t.weatherTitle}</div>
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={combinedData}>
                            <defs>
                              <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2196f3" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#2196f3" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorNdvi" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8bc34a" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8bc34a" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" hide />
                            <YAxis yAxisId="left" orientation="left" stroke="#64b5f6" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" stroke="#aed581" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{background: '#1a1f1a', border: '1px solid var(--glass-border)', borderRadius: '8px'}} />
                            <Area yAxisId="left" type="monotone" dataKey="rainfall" name={t.rainfall} stroke="#2196f3" fillOpacity={1} fill="url(#colorRain)" strokeWidth={3} />
                            <Area yAxisId="right" type="monotone" dataKey="ndvi" name={t.ndvi} stroke="#8bc34a" fillOpacity={1} fill="url(#colorNdvi)" strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="glass-card chat-container">
                <div className="card-title"><MessageSquare size={20} style={{marginRight: '10px'}} /> {t.navAI}</div>
                <div className="messages">
                  {messages.map((m, i) => (
                    <div key={i} className={`message ${m.role}`}>
                      {m.text}
                    </div>
                  ))}
                </div>
                <div className="chat-input-area">
                  <input 
                    type="text" 
                    className="chat-input" 
                    placeholder={t.chatPlaceholder}
                    value={chatMsg}
                    onChange={(e) => setChatMsg(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  />
                  <button className="send-btn" onClick={handleSendChat}><Send size={20} /></button>
                </div>
              </div>
            )}

            {activeTab === 'diagnosis' && (
              <div className="glass-card">
                <div className="card-title"><Bug size={20} style={{marginRight: '10px'}} /> {t.diagnosisTitle}</div>
                <div className="dashboard-grid">
                  <div className="glass-card" style={{borderStyle: 'dashed', textAlign: 'center', padding: '40px'}}>
                    <Camera size={48} color="#94a3b8" style={{marginBottom: '16px'}} />
                    <div style={{fontWeight: 'bold', marginBottom: '15px'}}>{lang === 'en' ? 'Upload Crop Photo' : 'పంట ఫోటోను అప్‌లోడ్ చేయండి'}</div>
                    <input type="file" style={{display: 'none'}} id="crop-upload" />
                    <label htmlFor="crop-upload" className="profile-btn" style={{display: 'inline-block', width: 'auto', padding: '12px 30px', cursor: 'pointer'}}>
                      {lang === 'en' ? 'Select File' : 'ఫైల్‌ను ఎంచుకోండి'}
                    </label>
                  </div>
                  <div className="glass-card">
                    <div style={{fontWeight: 'bold', marginBottom: '20px'}}>{t.symptoms}</div>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                      {commonSymptoms.map(s => (
                        <button 
                          key={s} 
                          onClick={() => toggleSymptom(s)}
                          style={{
                            padding: '10px 20px', 
                            borderRadius: '30px', 
                            border: '1px solid',
                            borderColor: selectedSymptoms.includes(s) ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                            background: selectedSymptoms.includes(s) ? 'rgba(249, 168, 37, 0.1)' : 'rgba(255,255,255,0.05)',
                            color: selectedSymptoms.includes(s) ? 'var(--accent)' : '#fff',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9rem'
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <button className="profile-btn" style={{marginTop: '30px'}} onClick={runDiagnosis}>{t.diagnoseBtn}</button>
                  </div>
                  
                  {diagnosisResult && (
                    <div className="glass-card full-width" style={{borderLeft: '5px solid #4caf50', background: 'rgba(76, 175, 80, 0.05)'}}>
                      <div style={{display: 'flex', gap: '15px', alignItems: 'flex-start'}}>
                        <CheckCircle size={24} color="#4caf50" />
                        <div>
                          <div style={{fontWeight: '900', fontSize: '1.4rem', color: '#81c784'}}>{diagnosisResult.issue}</div>
                          <div style={{marginTop: '15px'}}>
                            <div className="summary-label" style={{color: '#81c784'}}>{t.remedy}</div>
                            <div style={{color: '#fff', fontSize: '1.1rem'}}>{diagnosisResult.remedy}</div>
                          </div>
                          <div style={{marginTop: '15px'}}>
                            <div className="summary-label" style={{color: '#81c784'}}>{t.prevent}</div>
                            <div style={{color: '#fff', fontSize: '1.1rem'}}>{diagnosisResult.prevention}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'calculator' && (
              <div className="glass-card">
                <div className="card-title"><Calculator size={20} style={{marginRight: '10px'}} /> {t.calcTitle}</div>
                <div className="dashboard-grid">
                  <div className="glass-card">
                    <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                      <div>
                        <label className="summary-label">{t.costSeeds} (₹)</label>
                        <input type="number" className="profile-input" value={calcInputs.seeds} onChange={(e) => setCalcInputs({...calcInputs, seeds: Number(e.target.value)})} />
                      </div>
                      <div>
                        <label className="summary-label">{t.costFert} (₹)</label>
                        <input type="number" className="profile-input" value={calcInputs.fert} onChange={(e) => setCalcInputs({...calcInputs, fert: Number(e.target.value)})} />
                      </div>
                      <div>
                        <label className="summary-label">{t.costLabor} (₹)</label>
                        <input type="number" className="profile-input" value={calcInputs.labor} onChange={(e) => setCalcInputs({...calcInputs, labor: Number(e.target.value)})} />
                      </div>
                      <div>
                        <label className="summary-label">{t.yieldExp}</label>
                        <input type="number" className="profile-input" value={calcInputs.yield} onChange={(e) => setCalcInputs({...calcInputs, yield: Number(e.target.value)})} />
                      </div>
                    </div>
                  </div>
                  <div className="glass-card">
                     <div style={{display: 'flex', flexDirection: 'column', gap: '25px'}}>
                        <div style={{textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px'}}>
                          <div className="summary-label">{t.totalCost}</div>
                          <div className="summary-value" style={{color: '#94a3b8', fontSize: '2rem'}}>₹{totalInvestment.toLocaleString()}</div>
                        </div>
                        <div style={{textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px'}}>
                          <div className="summary-label">{t.expRevenue}</div>
                          <div className="summary-value" style={{color: '#64b5f6', fontSize: '2rem'}}>₹{expectedRevenue.toLocaleString()}</div>
                        </div>
                        <div style={{textAlign: 'center', padding: '20px', background: projectedProfit >= 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)', borderRadius: '12px', border: '1px solid', borderColor: projectedProfit >= 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'}}>
                          <div className="summary-label">{t.expProfit}</div>
                          <div className="summary-value" style={{color: projectedProfit >= 0 ? '#81c784' : '#ef5350', fontSize: '2.5rem'}}>₹{projectedProfit.toLocaleString()}</div>
                          <div style={{fontSize: '0.8rem', marginTop: '5px', fontWeight: '900', letterSpacing: '2px'}}>
                            {projectedProfit >= 0 ? "PROFIT GAIN" : "LOSS ALERT"}
                          </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schemes' && (
              <div className="glass-card">
                <div className="card-title"><Landmark size={20} style={{marginRight: '10px'}} /> {t.navSchemes}</div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                  {schemes.map(s => (
                    <div key={s.id} className="glass-card" style={{background: 'rgba(76, 175, 80, 0.05)', borderColor: s.state === 'Central' ? '#4caf50' : '#8bc34a'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <div style={{fontWeight: 'bold', fontSize: '1.2rem', color: '#fff'}}>{s.title}</div>
                        <span className="badge" style={{background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem'}}>{s.state}</span>
                      </div>
                      <div style={{color: 'var(--text-dim)', marginTop: '10px'}}>{s.description}</div>
                      <div style={{marginTop: '15px', display: 'flex', gap: '20px'}}>
                        <div>
                          <div className="summary-label">Benefit</div>
                          <div style={{fontWeight: 'bold', color: 'var(--accent)'}}>{s.benefit_amount}</div>
                        </div>
                        <div>
                          <div className="summary-label">Eligibility</div>
                          <div style={{fontWeight: 'bold'}}>{s.eligibility_criteria}</div>
                        </div>
                      </div>
                      <a href={s.link} target="_blank" rel="noopener noreferrer" className="profile-btn" style={{marginTop: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                        Apply Now <ExternalLink size={16} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="glass-card">
                <div className="card-title"><Warehouse size={20} style={{marginRight: '10px'}} /> {t.navStorage}</div>
                
                {/* My Inventory Section */}
                {isLoggedIn && myBookings.length > 0 && (
                  <div className="glass-card" style={{marginBottom: '30px', border: '1px solid var(--accent)', background: 'rgba(249, 168, 37, 0.05)'}}>
                    <div className="card-title" style={{fontSize: '1rem'}}><History size={18} style={{marginRight: '10px'}} /> My Stored Inventory</div>
                    <div className="dashboard-grid">
                       {myBookings.map(b => (
                         <div key={b.id} className="glass-card" style={{padding: '15px', background: 'rgba(0,0,0,0.1)'}}>
                            <div style={{fontWeight: 'bold'}}>{b.commodity_name}</div>
                            <div style={{fontSize: '0.8rem', color: 'var(--text-dim)'}}>{b.storage_name}</div>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '10px'}}>
                               <div className="summary-label">Qty: {b.quantity} qtl</div>
                               <div className="badge" style={{background: '#4caf50', color: '#fff', fontSize: '0.6rem'}}>{b.status}</div>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                <div className="dashboard-grid">
                  {storage.length > 0 ? storage.map(s => (
                    <div key={s.id} className="glass-card">
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <div style={{fontWeight: 'bold', fontSize: '1.1rem', color: '#fff'}}>{s.name}</div>
                        <span className="badge" style={{background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '15px', fontSize: '0.6rem'}}>{s.storage_type}</span>
                      </div>
                      <div className="summary-label" style={{marginTop: '5px'}}>Available: {s.available_mt} / {s.capacity_mt} MT</div>
                      <div style={{marginTop: '20px', color: 'var(--accent)', fontWeight: '900', fontSize: '1.5rem'}}>₹{s.price_per_qtl_month}/qtl/mo</div>
                      <button className="profile-btn" style={{marginTop: '15px'}} onClick={() => handleBooking(s.id)}>Book Space</button>
                    </div>
                  )) : (
                    <div className="glass-card full-width" style={{textAlign: 'center', padding: '40px', color: 'var(--text-dim)'}}>
                        No storage facilities found near this mandi.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'planner' && (
              <div className="glass-card">
                <div className="card-title"><Droplets size={20} style={{marginRight: '10px'}} /> {t.navPlanner}</div>
                
                {irrigation && (
                  <div style={{textAlign: 'center', padding: '40px'}}>
                    <div style={{fontSize: '6rem', marginBottom: '20px'}}>{irrigation.icon}</div>
                    <div style={{
                      fontWeight: '900', 
                      fontSize: '2.5rem', 
                      color: irrigation.status === 'Optimal' ? '#81c784' : (irrigation.status === 'Critical' ? '#ef5350' : '#f9a825'),
                      textTransform: 'uppercase'
                    }}>
                      {irrigation.status}
                    </div>
                    <p style={{color: '#fff', fontSize: '1.25rem', maxWidth: '600px', margin: '24px auto', fontWeight: '500'}}>
                      {irrigation.advice}
                    </p>
                    
                    <div className="dashboard-grid" style={{marginTop: '40px'}}>
                       <div className="glass-card" style={{padding: '20px'}}>
                          <div className="summary-label">7d Rainfall</div>
                          <div style={{fontSize: '1.5rem', fontWeight: '800'}}>{irrigation.rainfall_7d} mm</div>
                       </div>
                       <div className="glass-card" style={{padding: '20px'}}>
                          <div className="summary-label">7d Avg Temp</div>
                          <div style={{fontSize: '1.5rem', fontWeight: '800'}}>{irrigation.avg_temp_7d} °C</div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <footer style={{textAlign: 'center', padding: '40px', color: 'var(--text-dim)', fontSize: '0.9rem'}}>
        <p>© 2026 {t.title} - {lang === 'en' ? 'Empowering the Future of Farming' : 'వ్యవసాయ భవిష్యత్తును బలోపేతం చేయడం'}</p>
      </footer>
    </>
  );
}

export default App;
