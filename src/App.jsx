import { useState, useEffect } from 'react';

const SUPABASE_URL = 'https://pyshlfqyjmcbqofnbeyu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2hsZnF5am1jYnFvZm5iZXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MzkyNTgsImV4cCI6MjA5MTMxNTI1OH0.K32COTrmQjHVieiZa4P5w237kxMBmfyIy5prtCTawq0';

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

export default function App() {
  const [sellers, setSellers] = useState([]);
  const [newSellerId, setNewSellerId] = useState('');
  const [listings, setListings] = useState({});
  const [loading, setLoading] = useState({});
  const [config, setConfig] = useState({ keepaApiKey: '', discordWebhook: '' });
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [sentAsins, setSentAsins] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [tempConfig, setTempConfig] = useState({ keepaApiKey: '', discordWebhook: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
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
        showToast('☁️ Data loaded from cloud', 'success');
      } else {
        showToast('☁️ Connected - ready to add sellers', 'info');
      }
    } catch (e) {
      console.error('Load error:', e);
      showToast('⚠️ Could not connect to cloud', 'error');
    }
    setIsLoading(false);
  };

  const saveToCloud = async (s, l, n, c, a) => {
    const data = { sellers: s ?? sellers, listings: l ?? listings, config: c ?? config, notifications: n ?? notifications, sentAsins: [...(a ?? sentAsins)] };
    const success = await supabase.set('main', data);
    if (!success) showToast('⚠️ Failed to save', 'error');
  };

  const addSeller = async () => {
    if (!newSellerId.trim()) return;
    if (sellers.some(s => s.id === newSellerId.trim())) { showToast('Already tracking', 'warning'); return; }
    const seller = { id: newSellerId.trim(), name: null, dateAdded: new Date().toISOString(), lastChecked: null, itemCount: 0 };
    const updated = [...sellers, seller];
    setSellers(updated);
    setNewSellerId('');
    await saveToCloud(updated, null, null, null, null);
    showToast('Seller added ✓', 'success');
  };

  const removeSeller = async (id) => {
    const updated = sellers.filter(s => s.id !== id);
    const updatedListings = { ...listings };
    delete updatedListings[id];
    setSellers(updated);
    setListings(updatedListings);
    await saveToCloud(updated, updatedListings, null, null, null);
    showToast('Seller removed', 'info');
    setDeleteConfirm(null);
  };

  const checkSeller = async (sellerId) => {
    if (!config.keepaApiKey) { showToast('Add Keepa API key in Settings', 'warning'); setShowSettings(true); return; }
    setLoading(prev => ({ ...prev, [sellerId]: true }));
    try {
      const res = await fetch(`https://api.keepa.com/seller?key=${config.keepaApiKey}&domain=1&seller=${encodeURIComponent(sellerId)}&storefront=1`);
      const data = await res.json();
      if (res.status === 429 || (data.tokensLeft !== undefined && data.tokensLeft <= 0)) {
        throw new Error(`Rate limited - wait ${data.refillIn ? Math.ceil(data.refillIn / 1000) : 20}s`);
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
      const prodRes = await fetch(`https://api.keepa.com/product?key=${config.keepaApiKey}&domain=1&asin=${asins.slice(0, 50).join(',')}`);
      const prodData = await prodRes.json();
      const products = (prodData.products || []).map(p => ({
        asin: p.asin,
        title: p.title || `Product ${p.asin}`,
        link: `https://www.amazon.com/dp/${p.asin}`,
        image: p.imagesCSV ? `https://images-na.ssl-images-amazon.com/images/I/${p.imagesCSV.split(',')[0]}` : null,
        price: p.csv?.[0]?.length ? p.csv[0][p.csv[0].length - 1] / 100 : null,
        rating: p.csv?.[16]?.length ? p.csv[16][p.csv[16].length - 1] / 10 : null
      }));
      const oldList = listings[sellerId] || [];
      const newProds = products.filter(p => !oldList.some(o => o.asin === p.asin));
      let updatedSentAsins = sentAsins;
      let updatedNotifications = notifications;
      if (newProds.length && oldList.length && config.discordWebhook) {
        const neverSent = newProds.filter(p => !sentAsins.has(p.asin));
        if (neverSent.length) {
          try {
            await fetch(config.discordWebhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: `🚨 **${neverSent.length} New from ${name}!**`,
                embeds: neverSent.slice(0, 10).map(p => ({
                  title: p.title.slice(0, 256),
                  url: p.link,
                  color: 3066993,
                  thumbnail: p.image ? { url: p.image } : undefined,
                  fields: [
                    { name: 'Price', value: p.price ? `$${p.price.toFixed(2)}` : 'N/A', inline: true },
                    { name: 'ASIN', value: p.asin, inline: true }
                  ]
                }))
              })
            });
          } catch (e) { console.error('Discord error:', e); }
          updatedSentAsins = new Set(sentAsins);
          neverSent.forEach(p => updatedSentAsins.add(p.asin));
          setSentAsins(updatedSentAsins);
          const newNotifs = neverSent.map(p => ({ id: Date.now() + Math.random(), sellerId, sellerName: name, product: p, timestamp: new Date().toISOString() }));
          updatedNotifications = [...newNotifs, ...notifications].slice(0, 50);
          setNotifications(updatedNotifications);
          showToast(`🎉 ${neverSent.length} new products!`, 'success');
        }
      }
      const updatedListings = { ...listings, [sellerId]: products };
      const updatedSellers = sellers.map(s => s.id === sellerId ? { ...s, lastChecked: new Date().toISOString(), itemCount: products.length, name } : s);
      setListings(updatedListings);
      setSellers(updatedSellers);
      await saveToCloud(updatedSellers, updatedListings, updatedNotifications, null, updatedSentAsins);
      showToast(`${products.length} products from ${name}`, 'success');
    } catch (e) {
      showToast(`Error: ${e.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, [sellerId]: false }));
    }
  };

  const checkAll = async () => {
    if (!sellers.length) return;
    showToast(`Checking ${sellers.length} sellers...`, 'info');
    for (let i = 0; i < sellers.length; i++) {
      await checkSeller(sellers[i].id);
      if (i < sellers.length - 1) await new Promise(r => setTimeout(r, 20000));
    }
    showToast('Done checking all!', 'success');
  };

  const saveConfig = async () => {
    setConfig(tempConfig);
    await saveToCloud(null, null, null, tempConfig, null);
    setShowSettings(false);
    showToast('Settings saved ✓', 'success');
  };

  const testWebhook = async () => {
    if (!tempConfig.discordWebhook) { showToast('Add webhook URL first', 'warning'); return; }
    try {
      await fetch(tempConfig.discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '🧪 **Test from Seller Stalker**', embeds: [{ title: 'Webhook Test', description: 'Connection successful! 🎉', color: 5763719 }] })
      });
      showToast('Test sent!', 'success');
    } catch { showToast('Webhook test failed', 'error'); }
  };

  const totalProducts = Object.values(listings).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  const newToday = notifications.filter(n => new Date(n.timestamp) >= new Date(new Date().setHours(0, 0, 0, 0))).length;
  const filtered = sellers.filter(s => s.id.toLowerCase().includes(searchTerm.toLowerCase()) || s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">☁️</div>
          <div className="text-xl font-medium">Connecting to cloud...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {toast && (
        <div className={`fixed bottom-4 right-4 px-5 py-3 rounded-xl shadow-2xl z-50 border ${toast.type === 'success' ? 'bg-green-900/90 border-green-700' : toast.type === 'error' ? 'bg-red-900/90 border-red-700' : toast.type === 'warning' ? 'bg-yellow-900/90 border-yellow-700' : 'bg-gray-800/90 border-gray-600'}`}>
          {toast.message}
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <h2 className="text-xl font-bold">⚙️ Settings</h2>
              <button onClick={() => { setShowSettings(false); setTempConfig(config); }} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-green-900/30 border border-green-800 rounded-lg px-4 py-2 text-green-400 text-sm">
                ☁️ Cloud storage active - data syncs automatically
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Keepa API Key</label>
                <input type="password" value={tempConfig.keepaApiKey} onChange={e => setTempConfig({ ...tempConfig, keepaApiKey: e.target.value })} className="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none" placeholder="Enter Keepa key" />
                <a href="https://keepa.com/api" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline mt-1 inline-block">Get your key at keepa.com/api</a>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Discord Webhook URL</label>
                <input type="text" value={tempConfig.discordWebhook} onChange={e => setTempConfig({ ...tempConfig, discordWebhook: e.target.value })} className="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none" placeholder="https://discord.com/api/webhooks/..." />
                <button onClick={testWebhook} disabled={!tempConfig.discordWebhook} className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-sm">🧪 Test Webhook</button>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button onClick={saveConfig} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium">Save Settings</button>
                <button onClick={() => { setShowSettings(false); setTempConfig(config); }} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-900/50 rounded-full text-2xl">⚠️</div>
              <div>
                <h3 className="text-lg font-bold">Remove Seller?</h3>
                <p className="text-gray-400 text-sm">{deleteConfirm.name || deleteConfirm.id}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => removeSeller(deleteConfirm.id)} className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium">Remove</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">🕵️ Seller Stalker</h1>
              <p className="text-gray-400 mt-1">☁️ Cloud synced • Never lose your data</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowSettings(true); setTempConfig(config); }} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium">⚙️ Settings</button>
              <button onClick={checkAll} disabled={!sellers.length || Object.values(loading).some(l => l)} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium flex items-center gap-2">
                {Object.values(loading).some(l => l) ? '⏳' : '🔄'} Check All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <div className="text-3xl font-bold text-blue-400">{sellers.length}</div>
              <div className="text-gray-400 text-sm uppercase tracking-wide">Sellers Tracked</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <div className="text-3xl font-bold text-purple-400">{totalProducts}</div>
              <div className="text-gray-400 text-sm uppercase tracking-wide">Products Found</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <div className="text-3xl font-bold text-green-400">{newToday}</div>
              <div className="text-gray-400 text-sm uppercase tracking-wide">New Today</div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <h2 className="text-lg font-semibold mb-3">➕ Add Seller</h2>
            <div className="flex gap-3">
              <input value={newSellerId} onChange={e => setNewSellerId(e.target.value)} onKeyPress={e => e.key === 'Enter' && addSeller()} placeholder="Enter Seller ID (e.g., A2L77EE7U53NWQ)" className="flex-1 px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none" />
              <button onClick={addSeller} className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-medium">+ Add</button>
            </div>
          </div>
        </header>

        {notifications.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-5 border border-green-800/50">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">🔔 Recent New Listings</h2>
            <div className="space-y-2">
              {notifications.slice(0, 5).map(n => (
                <div key={n.id} className="bg-gray-800/50 rounded-lg p-3 flex items-center gap-4">
                  {n.product.image && <img src={n.product.image} alt="" className="w-14 h-14 object-cover rounded" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-green-400 font-medium">{n.sellerName}</p>
                    <p className="text-sm text-gray-300 truncate">{n.product.title}</p>
                  </div>
                  <a href={n.product.link} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">View</a>
                </div>
              ))}
            </div>
          </div>
        )}

        {sellers.length > 0 && (
          <div className="mb-6">
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="🔍 Search sellers..." className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none" />
          </div>
        )}

        <div className="space-y-4">
          {filtered.map(seller => (
            <div key={seller.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold">{seller.name || <span className="text-gray-400">Loading...</span>}</h3>
                    <p className="text-gray-500 text-sm">{seller.id}</p>
                    <div className="flex gap-4 mt-1 text-sm text-gray-500">
                      <span>📦 {seller.itemCount} items</span>
                      {seller.lastChecked && <span>🕒 {new Date(seller.lastChecked).toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => checkSeller(seller.id)} disabled={loading[seller.id]} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium">
                      {loading[seller.id] ? '⏳' : '🔄'} Check
                    </button>
                    <button onClick={() => setDeleteConfirm(seller)} className="px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg font-medium">🗑️</button>
                  </div>
                </div>

                {listings[seller.id]?.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {listings[seller.id].slice(0, 5).map(p => (
                      <div key={p.asin} className="bg-gray-700/50 hover:bg-gray-700 rounded-lg p-3 flex items-center gap-4 transition-colors">
                        {p.image && <img src={p.image} alt="" className="w-16 h-16 object-cover rounded" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{p.title}</p>
                          <div className="flex gap-3 text-sm mt-1">
                            <span className="text-green-400 font-semibold">{p.price > 0 ? `$${p.price.toFixed(2)}` : 'N/A'}</span>
                            {p.rating && <span className="text-yellow-400">⭐ {p.rating.toFixed(1)}</span>}
                          </div>
                        </div>
                        <a href={p.link} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">View ↗</a>
                      </div>
                    ))}
                    {listings[seller.id].length > 5 && (
                      <p className="text-gray-500 text-sm text-center py-2">+{listings[seller.id].length - 5} more products</p>
                    )}
                  </div>
                )}

                {!listings[seller.id]?.length && (
                  <div className="mt-4 text-center py-6 text-gray-500 bg-gray-700/20 rounded-lg">
                    No listings loaded. Click "Check" to fetch products.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!sellers.length && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-2">No Sellers Yet</h2>
            <p className="text-gray-400">Add a seller ID above to start tracking</p>
          </div>
        )}
      </div>
    </div>
  );
}
