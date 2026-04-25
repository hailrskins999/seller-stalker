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
        asin: p.asin, title: p.title || `Product ${p.asin}`, link: `https://www.amazon.com/dp/${p.asin}`,
        image: p.imagesCSV ? `https://images-na.ssl-images-amazon.com/images/I/${p.imagesCSV.split(',')[0]}` : null,
        price: p.csv?.[0]?.length ? p.csv[0][p.csv[0].length - 1] / 100 : null
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
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: `🚨 **${neverSent.length} New from ${name}!**`,
                embeds: neverSent.slice(0, 10).map(p => ({ title: p.title.slice(0, 256), url: p.link, color: 3066993 }))
              })
            });
          } catch (e) { console.error('Discord error:', e); }
          updatedSentAsins = new Set(sentAsins);
          neverSent.forEach(p => updatedSentAsins.add(p.asin));
          setSentAsins(updatedSentAsins);
          showToast(`🎉 ${neverSent.length} new products!`, 'success');
        }
      }
      const updatedListings = { ...listings, [sellerId]: products };
      const updatedSellers = sellers.map(s => s.id === sellerId ? { ...s, lastChecked: new Date().toISOString(), itemCount: products.length, name } : s);
      setListings(updatedListings);
      setSellers(updatedSellers);
      await saveToCloud(updatedSellers, updatedListings, updatedNotifications, null, updatedSentAsins);
      showToast(`${products.length} products from ${name}`, 'success');
    } catch (e) { showToast(`Error: ${e.message}`, 'error'); } finally { setLoading(prev => ({ ...prev, [sellerId]: false })); }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center"><div className="text-5xl mb-4">☁️</div><div className="text-xl">Connecting to cloud...</div></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-xl z-50 ${toast.type === 'success' ? 'bg-green-800' : toast.type === 'error' ? 'bg-red-800' : toast.type === 'warning' ? 'bg-yellow-800' : 'bg-gray-700'}`}>
          {toast.message}
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">⚙️ Settings</h2>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Keepa API Key</label>
              <input type="password" value={tempConfig.keepaApiKey} onChange={e => setTempConfig({ ...tempConfig, keepaApiKey: e.target.value })} className="w-full px-3 py-2 bg-gray-700 rounded-lg" placeholder="Enter Keepa key" />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Discord Webhook</label>
              <input type="text" value={tempConfig.discordWebhook} onChange={e => setTempConfig({ ...tempConfig, discordWebhook: e.target.value })} className="w-full px-3 py-2 bg-gray-700 rounded-lg" placeholder="https://discord.com/api/webhooks/..." />
            </div>
            <div className="flex gap-3">
              <button onClick={saveConfig} className="flex-1 py-2 bg-blue-600 rounded-lg">Save</button>
              <button onClick={() => { setShowSettings(false); setTempConfig(config); }} className="flex-1 py-2 bg-gray-600 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Remove seller?</h3>
            <p className="text-gray-400 mb-4">{deleteConfirm}</p>
            <div className="flex gap-3">
              <button onClick={() => removeSeller(deleteConfirm)} className="flex-1 py-2 bg-red-600 rounded-lg">Remove</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 bg-gray-600 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">Seller Stalker</h1>
            <p className="text-gray-400 text-sm">☁️ Cloud synced</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowSettings(true); setTempConfig(config); }} className="px-4 py-2 bg-gray-700 rounded-lg">⚙️</button>
            <button onClick={checkAll} disabled={!sellers.length || Object.values(loading).some(l => l)} className="px-4 py-2 bg-blue-600 rounded-lg disabled:opacity-50">🔄 Check All</button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <input value={newSellerId} onChange={e => setNewSellerId(e.target.value)} onKeyPress={e => e.key === 'Enter' && addSeller()} placeholder="Seller ID (e.g. A2L77EE7U53NWQ)" className="flex-1 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700" />
          <button onClick={addSeller} className="px-6 py-2 bg-green-600 rounded-lg">+ Add</button>
        </div>

        <div className="space-y-4">
          {sellers.map(seller => (
            <div key={seller.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{seller.name || seller.id}</h3>
                  <p className="text-gray-500 text-xs">{seller.id} • {seller.itemCount} items</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => checkSeller(seller.id)} disabled={loading[seller.id]} className="px-3 py-1 bg-blue-600 rounded text-sm disabled:opacity-50">
                    {loading[seller.id] ? '...' : '🔄'}
                  </button>
                  <button onClick={() => setDeleteConfirm(seller.id)} className="px-3 py-1 bg-red-600 rounded text-sm">🗑️</button>
                </div>
              </div>
              {listings[seller.id]?.length > 0 && (
                <div className="mt-3 space-y-2">
                  {listings[seller.id].slice(0, 5).map(p => (
                    <div key={p.asin} className="flex items-center gap-3 bg-gray-700 rounded p-2">
                      {p.image && <img src={p.image} alt="" className="w-12 h-12 object-cover rounded" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{p.title}</p>
                        <p className="text-green-400 text-sm">{p.price ? `$${p.price.toFixed(2)}` : 'N/A'}</p>
                      </div>
                      <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm">View</a>
                    </div>
                  ))}
                  {listings[seller.id].length > 5 && <p className="text-gray-500 text-sm">+{listings[seller.id].length - 5} more</p>}
                </div>
              )}
            </div>
          ))}
        </div>

        {!sellers.length && (
          <div className="text-center py-16 text-gray-500">
            <div className="text-5xl mb-4">🔍</div>
            <p>No sellers yet. Add one above!</p>
          </div>
        )}
      </div>
    </div>
  );
}
