import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Bell, Settings, ExternalLink, Search, X, AlertTriangle } from 'lucide-react';

// ===================
// SUPABASE CONFIG
// ===================
const SUPABASE_URL = 'https://pyshlfqyjmcbqofnbeyu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_IvDKdqp1eIaEdibdL_87SQ__GBiaKOJ';

const supabase = {
  async get(id) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/seller_data?id=eq.${id}&select=data`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const rows = await res.json();
      return rows.length > 0 ? rows[0].data : null;
    } catch (e) { console.error('Supabase get error:', e); return null; }
  },
  async set(id, data) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/seller_data`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({ id, data, updated_at: new Date().toISOString() })
      });
      return true;
    } catch (e) { console.error('Supabase set error:', e); return false; }
  }
};

const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    {toasts.map(toast => (
      <div key={toast.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border animate-slide-in ${toast.type === 'success' ? 'bg-green-900 border-green-700 text-green-100' : toast.type === 'error' ? 'bg-red-900 border-red-700 text-red-100' : toast.type === 'warning' ? 'bg-yellow-900 border-yellow-700 text-yellow-100' : 'bg-gray-800 border-gray-600 text-gray-100'}`}>
        <span className="text-sm font-medium">{toast.message}</span>
        <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
      </div>
    ))}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-full bg-red-900/50"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
          <div><h3 className="text-lg font-semibold text-white">{title}</h3><p className="text-gray-400 text-sm mt-1">{message}</p></div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-200">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white">Remove</button>
        </div>
      </div>
    </div>
  );
};

const StatsBar = ({ sellers, listings, notifications }) => {
  const totalProducts = Object.values(listings).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  const newToday = notifications.filter(n => new Date(n.timestamp) >= new Date(new Date().setHours(0,0,0,0))).length;
  return (
    <div className="flex items-center gap-6 px-4 py-3 bg-gray-800/50 rounded-lg border border-gray-700/50 mb-6">
      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-gray-400 text-sm">{sellers.length} Sellers</span></div>
      <div className="w-px h-4 bg-gray-700" />
      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500" /><span className="text-gray-400 text-sm">{totalProducts} Products</span></div>
      <div className="w-px h-4 bg-gray-700" />
      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-gray-400 text-sm">{newToday} New Today</span></div>
    </div>
  );
};

export default function App() {
  const [sellers, setSellers] = useState([]);
  const [newSellerId, setNewSellerId] = useState('');
  const [listings, setListings] = useState({});
  const [loading, setLoading] = useState({});
  const [config, setConfig] = useState({ keepaApiKey: '', discordWebhook: '' });
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentAsins, setSentAsins] = useState(new Set());
  const [toasts, setToasts] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, sellerId: null, sellerName: '' });
  const [tempConfig, setTempConfig] = useState({ keepaApiKey: '', discordWebhook: '' });
  const [isLoading, setIsLoading] = useState(true);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  useEffect(() => { loadFromCloud(); }, []);

  const loadFromCloud = async () => {
    setIsLoading(true);
    try {
      const data = await supabase.get('main');
      if (data) {
        if (data.sellers) setSellers(data.sellers);
        if (data.listings) setListings(data.listings);
        if (data.config) { setConfig(data.config); setTempConfig(data.config); }
        if (data.notifications) setNotifications(data.notifications);
        if (data.sentAsins) setSentAsins(new Set(data.sentAsins));
        addToast('☁️ Data loaded from cloud', 'success');
      } else {
        addToast('☁️ Connected - no existing data', 'info');
      }
    } catch (e) {
      console.error('Load error:', e);
      addToast('⚠️ Could not connect to cloud', 'error');
    }
    setIsLoading(false);
  };

  const saveToCloud = async (newSellers, newListings, newNotifications, newConfig, newSentAsins) => {
    const data = {
      sellers: newSellers ?? sellers,
      listings: newListings ?? listings,
      config: newConfig ?? config,
      notifications: newNotifications ?? notifications,
      sentAsins: [...(newSentAsins ?? sentAsins)]
    };
    const success = await supabase.set('main', data);
    if (!success) addToast('⚠️ Failed to save to cloud', 'error');
  };

  const saveConfig = async (c) => {
    setConfig(c);
    await saveToCloud(null, null, null, c, null);
    addToast('Settings saved to cloud', 'success');
  };

  const addSeller = async () => {
    if (!newSellerId.trim()) return;
    if (sellers.some(s => s.id === newSellerId.trim())) { addToast('Already tracking this seller', 'warning'); return; }
    const seller = { id: newSellerId.trim(), name: null, dateAdded: new Date().toISOString(), lastChecked: null, itemCount: 0 };
    const updated = [...sellers, seller];
    setSellers(updated);
    setNewSellerId('');
    await saveToCloud(updated, null, null, null, null);
    addToast('Seller added', 'success');
  };

  const removeSeller = async (id) => {
    const updated = sellers.filter(s => s.id !== id);
    const updatedListings = { ...listings };
    delete updatedListings[id];
    setSellers(updated);
    setListings(updatedListings);
    await saveToCloud(updated, updatedListings, null, null, null);
    addToast('Seller removed', 'info');
  };

  const checkSeller = async (sellerId) => {
    if (!config.keepaApiKey) { addToast('Add Keepa API key in Settings', 'warning'); setShowSettings(true); return; }
    setLoading(prev => ({ ...prev, [sellerId]: true }));
    try {
      const res = await fetch(`https://api.keepa.com/seller?key=${config.keepaApiKey}&domain=1&seller=${encodeURIComponent(sellerId)}&storefront=1`);
      const data = await res.json();
      if (res.status === 429 || (data.tokensLeft !== undefined && data.tokensLeft <= 0)) {
        const waitTime = data.refillIn ? Math.ceil(data.refillIn / 1000) : 20;
        throw new Error(`Rate limited - wait ${waitTime}s`);
      }
      if (data.error) throw new Error(data.error.message || data.error);
      let info = data.sellers?.[sellerId];
      if (!info && data.sellers) {
        const keys = Object.keys(data.sellers);
        const matchKey = keys.find(k => k.toLowerCase() === sellerId.toLowerCase());
        info = matchKey ? data.sellers[matchKey] : (keys.length > 0 ? data.sellers[keys[0]] : null);
      }
      if (!info) throw new Error('Seller not found');
      const name = info.sellerName || `Seller ${sellerId}`;
      const asins = info.asinList || [];
      if (!asins.length) throw new Error('No products found');
      const prodRes = await fetch(`https://api.keepa.com/product?key=${config.keepaApiKey}&domain=1&asin=${asins.slice(0,50).join(',')}`);
      const prodData = await prodRes.json();
      const products = (prodData.products || []).map(p => ({
        asin: p.asin, title: p.title || `Product ${p.asin}`, link: `https://www.amazon.com/dp/${p.asin}`,
        image: p.imagesCSV ? `https://images-na.ssl-images-amazon.com/images/I/${p.imagesCSV.split(',')[0]}` : null,
        price: p.csv?.[0]?.length ? p.csv[0][p.csv[0].length-1]/100 : null,
        rating: p.csv?.[16]?.length ? p.csv[16][p.csv[16].length-1]/10 : null
      }));
      const oldList = listings[sellerId] || [];
      const newProds = products.filter(p => !oldList.some(o => o.asin === p.asin));
      const neverSent = newProds.filter(p => !sentAsins.has(p.asin));
      
      let updatedSentAsins = sentAsins;
      let updatedNotifications = notifications;
      
      if (neverSent.length && oldList.length) {
        if (config.discordWebhook) {
          try {
            await fetch(config.discordWebhook, { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: `🚨 **${neverSent.length} New Listing${neverSent.length > 1 ? 's' : ''} from ${name}!**`,
                embeds: neverSent.slice(0,10).map(p => ({ title: p.title.slice(0,256), url: p.link, color: 3066993, thumbnail: p.image ? { url: p.image } : undefined, fields: [{ name: "Price", value: p.price ? `$${p.price.toFixed(2)}` : "N/A", inline: true }, { name: "ASIN", value: p.asin, inline: true }] }))
              })
            });
          } catch (e) { console.error('Discord error:', e); }
          updatedSentAsins = new Set(sentAsins);
          neverSent.forEach(p => updatedSentAsins.add(p.asin));
          setSentAsins(updatedSentAsins);
        }
        const newNotifs = newProds.map(p => ({ id: Date.now()+Math.random(), sellerId, sellerName: name, product: p, timestamp: new Date().toISOString() }));
        updatedNotifications = [...newNotifs, ...notifications].slice(0,50);
        setNotifications(updatedNotifications);
        addToast(`🎉 ${neverSent.length} new products from ${name}!`, 'success');
      }

      const updatedListings = { ...listings, [sellerId]: products };
      const updatedSellers = sellers.map(s => s.id === sellerId ? { ...s, lastChecked: new Date().toISOString(), itemCount: products.length, name } : s);
      setListings(updatedListings);
      setSellers(updatedSellers);
      await saveToCloud(updatedSellers, updatedListings, updatedNotifications, null, updatedSentAsins);
      addToast(`Loaded ${products.length} products from ${name}`, 'success');
    } catch (e) { addToast(`Error: ${e.message}`, 'error'); } finally { setLoading(prev => ({ ...prev, [sellerId]: false })); }
  };

  const checkAll = async () => {
    if (!sellers.length) return;
    addToast(`Checking ${sellers.length} sellers (20s between each)...`, 'info');
    for (const s of sellers) {
      await checkSeller(s.id);
      if (sellers.indexOf(s) < sellers.length - 1) {
        await new Promise(r => setTimeout(r, 20000));
      }
    }
    addToast('Finished checking all sellers', 'success');
  };

  const testWebhook = async () => {
    if (!tempConfig.discordWebhook) { addToast('Add webhook URL first', 'warning'); return; }
    try {
      await fetch(tempConfig.discordWebhook, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: "🧪 **Test from Seller Stalker**", embeds: [{ title: "Webhook Test", description: "Connection successful! 🎉", color: 5763719 }] })
      });
      addToast('Test sent!', 'success');
    } catch { addToast('Webhook test failed', 'error'); }
  };

  const filtered = sellers.filter(s => s.id.toLowerCase().includes(searchTerm.toLowerCase()) || s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">☁️</div>
          <div className="text-xl">Connecting to cloud...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      <Modal isOpen={showSettings} onClose={() => { setShowSettings(false); setTempConfig(config); }} title="Settings">
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-sm text-green-400 bg-green-900/30 px-3 py-2 rounded-lg">
            <span>☁️</span> <span>Cloud storage active - data syncs automatically</span>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Keepa API Key</label>
            <input type="password" value={tempConfig.keepaApiKey} onChange={(e) => setTempConfig({ ...tempConfig, keepaApiKey: e.target.value })} className="w-full px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none" placeholder="Enter Keepa API key" />
            <a href="https://keepa.com/api" target="_blank" className="text-xs text-blue-400 hover:underline">Get your key at keepa.com/api</a>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Discord Webhook URL</label>
            <input type="text" value={tempConfig.discordWebhook} onChange={(e) => setTempConfig({ ...tempConfig, discordWebhook: e.target.value })} className="w-full px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none" placeholder="https://discord.com/api/webhooks/..." />
            <button onClick={testWebhook} disabled={!tempConfig.discordWebhook} className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm disabled:opacity-50">🧪 Test Webhook</button>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button onClick={() => { saveConfig(tempConfig); setShowSettings(false); }} className="flex-1 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium">Save</button>
            <button onClick={() => { setShowSettings(false); setTempConfig(config); }} className="px-6 py-2.5 bg-gray-700 rounded-lg">Cancel</button>
          </div>
        </div>
      </Modal>
      
      <ConfirmDialog isOpen={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({ isOpen: false, sellerId: null, sellerName: '' })} onConfirm={() => removeSeller(deleteConfirm.sellerId)} title="Remove Seller" message={`Remove "${deleteConfirm.sellerName}" and all their listings?`} />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Seller Stalker Pro</h1>
              <p className="text-gray-400 mt-2">☁️ Cloud synced • Never lose your data</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowSettings(true); setTempConfig(config); }} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2"><Settings className="w-5 h-5" />Settings</button>
              <button onClick={checkAll} disabled={!sellers.length || Object.values(loading).some(l => l)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50"><RefreshCw className={`w-5 h-5 ${Object.values(loading).some(l => l) ? 'animate-spin' : ''}`} />Check All</button>
            </div>
          </div>
          
          <StatsBar sellers={sellers} listings={listings} notifications={notifications} />
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Add Seller</h2>
            <div className="flex gap-3">
              <input value={newSellerId} onChange={(e) => setNewSellerId(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addSeller()} placeholder="Enter Seller ID (e.g., A2L77EE7U53NWQ)" className="flex-1 px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none" />
              <button onClick={addSeller} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center gap-2"><Plus className="w-5 h-5" />Add</button>
            </div>
          </div>
        </header>
        
        {notifications.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-lg p-6 border border-green-700/50">
            <div className="flex items-center gap-2 mb-4"><Bell className="w-6 h-6 text-green-400" /><h2 className="text-xl font-semibold">Recent New Listings</h2></div>
            <div className="space-y-3">
              {notifications.slice(0,5).map(n => (
                <div key={n.id} className="bg-gray-800/50 rounded-lg p-4 flex items-center gap-4">
                  {n.product.image && <img src={n.product.image} alt="" className="w-16 h-16 object-cover rounded" />}
                  <div className="flex-1 min-w-0"><p className="font-medium text-green-400">{n.sellerName}</p><p className="text-sm text-gray-300 truncate">{n.product.title}</p></div>
                  <a href={n.product.link} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">View</a>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {sellers.length > 0 && (
          <div className="mb-4 relative">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search sellers..." className="w-full pl-10 pr-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none" />
          </div>
        )}
        
        <div className="space-y-6">
          {filtered.map(seller => (
            <div key={seller.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-semibold">{seller.name || <span className="text-gray-400">Loading...</span>}</h3>
                  <p className="text-gray-400 text-sm">ID: {seller.id}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>Added: {new Date(seller.dateAdded).toLocaleDateString()}</span>
                    {seller.lastChecked && <span>Checked: {new Date(seller.lastChecked).toLocaleString()}</span>}
                    <span className="text-blue-400">{seller.itemCount} items</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => checkSeller(seller.id)} disabled={loading[seller.id]} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50">
                    <RefreshCw className={`w-4 h-4 ${loading[seller.id] ? 'animate-spin' : ''}`} />{loading[seller.id] ? 'Checking...' : 'Check Now'}
                  </button>
                  <button onClick={() => setDeleteConfirm({ isOpen: true, sellerId: seller.id, sellerName: seller.name || seller.id })} className="px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg flex items-center gap-2"><Trash2 className="w-4 h-4" />Remove</button>
                </div>
              </div>
              
              {listings[seller.id]?.length ? (
                <div>
                  <h4 className="text-lg font-semibold mb-3">Listings ({listings[seller.id].length})</h4>
                  <div className="space-y-2">
                    {listings[seller.id].slice(0,10).map(l => (
                      <div key={l.asin} className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 flex items-center gap-4">
                        {l.image && <img src={l.image} alt="" className="w-20 h-20 object-cover rounded" />}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm mb-1 line-clamp-2">{l.title}</h5>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-green-400 font-semibold">{l.price ? `$${l.price.toFixed(2)}` : 'N/A'}</span>
                            {l.rating && <span className="text-yellow-400">⭐ {l.rating}</span>}
                          </div>
                        </div>
                        <a href={l.link} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm flex items-center gap-1">View <ExternalLink className="w-3 h-3" /></a>
                      </div>
                    ))}
                  </div>
                  {listings[seller.id].length > 10 && <p className="text-gray-400 text-sm mt-3">+ {listings[seller.id].length - 10} more</p>}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No listings loaded. Click "Check Now"</div>
              )}
            </div>
          ))}
        </div>
        
        {!sellers.length && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-semibold mb-2">No Sellers Yet</h2>
            <p className="text-gray-400">Add a seller ID above to start tracking</p>
          </div>
        )}
      </div>
    </div>
  );
}
