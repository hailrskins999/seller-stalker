import React, { useState, useEffect, useCallback } from 'react';

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-amber-600';
  
  return (
    <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-in`}>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children, wide }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className={`bg-zinc-900 border border-zinc-700 rounded-xl w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} shadow-2xl flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-700 flex-shrink-0">
          <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-700 transition-colors">✕</button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        <div className="p-4 border-t border-zinc-700 flex-shrink-0">
          <button onClick={onClose} className="w-full py-2 bg-zinc-700 text-white font-medium rounded-lg hover:bg-zinc-600 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Confirm Dialog
const ConfirmDialog = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-sm shadow-2xl p-6">
        <p className="text-zinc-200 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Stats Bar
const StatsBar = ({ sellers, products, newToday }) => (
  <div className="grid grid-cols-3 gap-4 mb-6">
    {[
      { label: 'Sellers Tracked', value: sellers, color: 'text-cyan-400' },
      { label: 'Products Found', value: products, color: 'text-emerald-400' },
      { label: 'New Today', value: newToday, color: 'text-amber-400' },
    ].map(({ label, value, color }) => (
      <div key={label} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
        <div className={`text-2xl font-bold ${color} font-mono`}>{value}</div>
        <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{label}</div>
      </div>
    ))}
  </div>
);

// Product Card (like your screenshot - with green left border, image, price hunt button)
const ProductCard = ({ product, onPriceHunt, isHunting }) => {
  const amazonUrl = `https://amazon.com/dp/${product.asin}`;
  const imageUrl = product.image || (product.imageId ? `https://images-na.ssl-images-amazon.com/images/I/${product.imageId}._SL150_.jpg` : null);
  
  return (
    <div className="bg-zinc-800/30 border-l-4 border-l-emerald-500 border border-zinc-700/50 rounded-r-xl p-4 flex gap-4">
      <div className="flex-1 min-w-0">
        <a 
          href={amazonUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 font-semibold text-sm leading-tight block mb-3 line-clamp-2"
        >
          {product.title || `Product ${product.asin}`}
        </a>
        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
          <div>
            <div className="text-zinc-500 text-xs">Price</div>
            <div className="text-white font-mono">{product.price ? `$${product.price.toFixed(2)}` : '$-0.01'}</div>
          </div>
          <div>
            <div className="text-zinc-500 text-xs">Rating</div>
            <div className="text-white">{product.rating ? `${product.rating} ★` : 'No rating'}</div>
          </div>
          <div>
            <div className="text-zinc-500 text-xs">ASIN</div>
            <div className="text-cyan-400 font-mono text-xs">{product.asin}</div>
          </div>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-zinc-500 flex items-center gap-2">
            <span>Seller: {product.sellerName} ({product.sellerId}) • {product.detectedAt ? new Date(product.detectedAt).toLocaleString() : 'Just now'}</span>
            {product.discordNotifiedAt && (
              <span className="text-purple-400" title={`Sent to Discord: ${new Date(product.discordNotifiedAt).toLocaleString()}`}>
                📨
              </span>
            )}
          </div>
          <button
            onClick={() => onPriceHunt(product)}
            disabled={isHunting}
            className="px-3 py-1.5 text-xs bg-amber-600/20 text-amber-400 border border-amber-600/30 rounded-lg hover:bg-amber-600/30 disabled:opacity-50 transition-all flex items-center gap-1.5 flex-shrink-0"
            title="Shows demo data - use Claude in Chrome for real results"
          >
            🔍 {isHunting ? 'Checking...' : 'Check Competitors'}
          </button>
        </div>
      </div>
      {imageUrl && (
        <div className="w-20 h-20 flex-shrink-0">
          <img 
            src={imageUrl}
            alt={product.title || product.asin}
            className="w-full h-full object-contain rounded-lg bg-white"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}
    </div>
  );
};

// Seller Card
const SellerCard = ({ seller, onDelete, onCheck, isChecking, onViewProducts }) => {
  const productCount = seller.products?.length || 0;
  const newCount = seller.products?.filter(p => p.isNew).length || 0;
  const lastChecked = seller.lastChecked ? new Date(seller.lastChecked).toLocaleString() : 'Never';
  
  return (
    <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-5 hover:border-zinc-600 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-white text-lg">{seller.name || seller.id}</h3>
          <code className="text-xs text-zinc-500 font-mono">{seller.id}</code>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onCheck(seller.id)}
            disabled={isChecking}
            className="px-3 py-1.5 text-xs bg-cyan-600/20 text-cyan-400 border border-cyan-600/30 rounded-lg hover:bg-cyan-600/30 disabled:opacity-50 transition-all"
          >
            {isChecking ? 'Checking...' : 'Check Now'}
          </button>
          <button
            onClick={() => onDelete(seller.id)}
            className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-600/20 rounded-lg transition-all"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          {productCount} products
        </span>
        {newCount > 0 && (
          <span className="bg-amber-600/20 text-amber-400 px-2 py-0.5 rounded text-xs">
            {newCount} NEW
          </span>
        )}
        <span>Last: {lastChecked}</span>
      </div>
      {productCount > 0 && (
        <button
          onClick={() => onViewProducts(seller)}
          className="mt-4 w-full py-2 text-sm text-cyan-400 border border-cyan-600/30 rounded-lg hover:bg-cyan-600/10 transition-all"
        >
          View All Products →
        </button>
      )}
    </div>
  );
};

// Price Hunt Results Modal
const PriceHuntResults = ({ isOpen, onClose, results }) => {
  if (!results) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔍 Competitor Price Check" wide>
      <div className="space-y-6">
        {/* Demo Mode Warning */}
        <div className="bg-amber-900/30 border border-amber-600/30 rounded-lg p-4 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="text-amber-400 font-bold">Demo Mode</div>
            <div className="text-sm text-amber-200/70">
              This is simulated data. For real competitor checks, use the <strong>Claude in Chrome extension</strong> to search Walmart, Target, eBay, and brand sites.
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-zinc-800/50 rounded-lg p-4 flex gap-4">
          {results.product?.image && (
            <img src={results.product.image} alt="" className="w-16 h-16 object-contain bg-white rounded-lg" />
          )}
          <div>
            <h3 className="font-bold text-white mb-1">{results.product?.title}</h3>
            <div className="text-sm text-zinc-400">ASIN: {results.product?.asin}</div>
            <div className="text-sm text-cyan-400 mt-1">Your Amazon Price: {results.product?.price ? `$${results.product.price.toFixed(2)}` : 'Unknown'}</div>
          </div>
        </div>

        {/* Lowest Competitor Alert */}
        {results.bestDeal && (
          <div className="bg-red-900/30 border border-red-600/30 rounded-lg p-4">
            <div className="text-red-400 font-bold text-lg mb-2">⚠️ Lowest Competitor: {results.bestDeal.retailer}</div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-zinc-500">Their Price</div>
                <div className="text-white font-bold text-xl">${results.bestDeal.price?.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-zinc-500">Per Unit</div>
                <div className="text-white font-bold">${results.bestDeal.perUnit?.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-zinc-500">Notes</div>
                <div className="text-white">{results.bestDeal.method}</div>
              </div>
            </div>
          </div>
        )}

        {/* Competitor Prices */}
        {results.retailers && results.retailers.length > 0 && (
          <div>
            <h4 className="text-sm text-zinc-400 uppercase tracking-wider mb-3">Competitor Prices</h4>
            <div className="space-y-2">
              {results.retailers.map((r, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${r.isBest ? 'bg-red-900/20 border border-red-600/30' : 'bg-zinc-800/30'}`}>
                  <div className="flex items-center gap-3">
                    {r.isBest && <span className="text-red-400">⚠️</span>}
                    <span className="text-white font-medium">{r.name}</span>
                    {r.notes && <span className="text-xs text-zinc-500">{r.notes}</span>}
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono">${r.price?.toFixed(2)}</div>
                    <div className="text-xs text-zinc-500">${r.perUnit?.toFixed(2)}/unit</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Competitor Coupon Codes */}
        {results.workingCodes && results.workingCodes.length > 0 && (
          <div>
            <h4 className="text-sm text-zinc-400 uppercase tracking-wider mb-3">Competitor Coupon Codes</h4>
            <div className="space-y-2">
              {results.workingCodes.map((code, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg">
                  <code className="text-amber-400 font-mono">{code.code}</code>
                  <span className="text-zinc-400 text-sm">{code.discount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Failed Codes */}
        {results.failedCodes && results.failedCodes.length > 0 && (
          <div>
            <h4 className="text-sm text-zinc-400 uppercase tracking-wider mb-3">Codes That Don't Work</h4>
            <div className="space-y-2">
              {results.failedCodes.map((code, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg opacity-60">
                  <code className="text-zinc-500 font-mono line-through">{code.code}</code>
                  <span className="text-red-400 text-sm">{code.error}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Copy Prompt for Claude in Chrome */}
        <div className="bg-cyan-900/20 border border-cyan-600/30 rounded-lg p-4">
          <h4 className="text-sm text-cyan-400 font-bold mb-2">🔌 Run Real Competitor Check</h4>
          <p className="text-xs text-zinc-400 mb-3">Copy this prompt and paste it into the Claude in Chrome extension:</p>
          <div className="bg-zinc-900 rounded-lg p-3 text-xs font-mono text-zinc-300 whitespace-pre-wrap">
{`Competitor price check for: ${results.product?.title || results.product?.asin}
ASIN: ${results.product?.asin}

I sell this on Amazon. Find competitor prices to see if anyone is undercutting me:

1. Search Walmart.com for this exact product
2. Search Target.com for this exact product  
3. Find the official brand website and check their price
4. Check eBay for third-party sellers
5. Look for any coupon codes on the brand's official site
6. Test codes: WELCOME10, WELCOME15, SAVE10, SAVE20, FIRST10

Report back:
- Each competitor's price and price-per-unit
- Any working coupon codes
- Flag if any competitor is priced LOWER than my Amazon listing
- Note free shipping thresholds`}
          </div>
          <button
            onClick={() => {
              const prompt = `Competitor price check for: ${results.product?.title || results.product?.asin}\nASIN: ${results.product?.asin}\n\nI sell this on Amazon. Find competitor prices to see if anyone is undercutting me:\n\n1. Search Walmart.com for this exact product\n2. Search Target.com for this exact product\n3. Find the official brand website and check their price\n4. Check eBay for third-party sellers\n5. Look for any coupon codes on the brand's official site\n6. Test codes: WELCOME10, WELCOME15, SAVE10, SAVE20, FIRST10\n\nReport back:\n- Each competitor's price and price-per-unit\n- Any working coupon codes\n- Flag if any competitor is priced LOWER than my Amazon listing\n- Note free shipping thresholds`;
              navigator.clipboard.writeText(prompt);
            }}
            className="mt-3 px-4 py-2 bg-cyan-600 text-white text-sm font-bold rounded-lg hover:bg-cyan-500 transition-colors"
          >
            📋 Copy Prompt
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Main App
export default function AmazonSellerStalker() {
  // State
  const [sellers, setSellers] = useState([]);
  const [settings, setSettings] = useState({ 
    keepaKey: '', 
    discordWebhook: '',
    autoPriceHunt: false, // Off by default - needs browser automation
    sendPriceHuntToDiscord: false // Off by default - demo data shouldn't go to Discord
  });
  const [toasts, setToasts] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddSeller, setShowAddSeller] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showProducts, setShowProducts] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [newSeller, setNewSeller] = useState({ id: '', name: '' });
  const [isChecking, setIsChecking] = useState(null);
  const [isHunting, setIsHunting] = useState(null);
  const [rateLimit, setRateLimit] = useState(null);
  const [importData, setImportData] = useState('');
  const [priceHuntResults, setPriceHuntResults] = useState(null);
  const [showPriceHuntResults, setShowPriceHuntResults] = useState(false);

  // localStorage for persistence
  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedSellers = localStorage.getItem('seller_stalker_sellers');
      const savedSettings = localStorage.getItem('seller_stalker_settings');
      if (savedSellers) setSellers(JSON.parse(savedSellers));
      if (savedSettings) setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }, []);

  // Save sellers to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('seller_stalker_sellers', JSON.stringify(sellers));
    } catch (error) {
      console.error('Failed to save sellers:', error);
    }
  }, [sellers]);

  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('seller_stalker_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings]);

  // Toast helper
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch product details from Keepa
  const fetchProductDetails = async (asins) => {
    if (!settings.keepaKey || asins.length === 0) return {};
    
    try {
      const batchSize = 100;
      const products = {};
      
      for (let i = 0; i < asins.length; i += batchSize) {
        const batch = asins.slice(i, i + batchSize);
        const url = `https://api.keepa.com/product?key=${settings.keepaKey}&domain=1&asin=${batch.join(',')}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.tokensLeft !== undefined) {
          setRateLimit({ tokens: data.tokensLeft, refillIn: data.refillIn });
        }
        
        if (data.products) {
          data.products.forEach(p => {
            products[p.asin] = {
              title: p.title,
              imageId: p.imagesCSV?.split(',')[0],
              image: p.imagesCSV ? `https://images-na.ssl-images-amazon.com/images/I/${p.imagesCSV.split(',')[0]}._SL150_.jpg` : null,
              price: p.csv?.[0]?.[p.csv[0].length - 1] > 0 ? p.csv[0][p.csv[0].length - 1] / 100 : null,
              rating: p.csv?.[16]?.[p.csv[16]?.length - 1] ? (p.csv[16][p.csv[16].length - 1] / 10).toFixed(1) : null,
              brand: p.brand,
              category: p.categoryTree?.[0]?.name
            };
          });
        }
        
        if (i + batchSize < asins.length) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      
      return products;
    } catch (error) {
      console.error('Error fetching product details:', error);
      return {};
    }
  };

  // Send rich Discord notification with product embeds (like your screenshot)
  // Returns the ASINs that were successfully sent
  const sendRichDiscordNotification = async (sellerName, sellerId, products) => {
    if (!settings.discordWebhook || products.length === 0) return [];
    
    // Filter out products that have already been sent to Discord
    const unnotifiedProducts = products.filter(p => !p.discordNotifiedAt);
    if (unnotifiedProducts.length === 0) {
      console.log('All products already notified to Discord, skipping');
      return [];
    }
    
    try {
      // Send individual embeds for each product (Discord limit: 10 embeds per message)
      const batches = [];
      for (let i = 0; i < unnotifiedProducts.length; i += 10) {
        batches.push(unnotifiedProducts.slice(i, i + 10));
      }
      
      const sentAsins = [];
      
      for (const batch of batches) {
        const embeds = batch.map(p => ({
          title: p.title || `Product ${p.asin}`,
          url: `https://amazon.com/dp/${p.asin}`,
          color: 0x00ff88, // Green color like your screenshot
          thumbnail: p.image ? { url: p.image } : undefined,
          fields: [
            { name: 'Price', value: p.price ? `$${p.price.toFixed(2)}` : '$-0.01', inline: true },
            { name: 'Rating', value: p.rating ? `${p.rating} ★` : 'No rating', inline: true },
            { name: 'ASIN', value: `\`${p.asin}\``, inline: true },
          ],
          footer: { text: `Seller: ${sellerName} (${sellerId})` },
          timestamp: new Date().toISOString()
        }));

        await fetch(settings.discordWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ embeds })
        });
        
        // Track which ASINs were sent
        batch.forEach(p => sentAsins.push(p.asin));
        
        if (batches.length > 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      
      addToast(`Discord: Sent ${unnotifiedProducts.length} product cards`, 'success');
      return sentAsins;
    } catch (error) {
      addToast('Failed to send Discord notification', 'error');
      return [];
    }
  };

  // Send Price Hunt results to Discord
  const sendPriceHuntToDiscord = async (results) => {
    if (!settings.discordWebhook || !results) return;
    
    try {
      const product = results.product;
      const best = results.bestDeal;
      
      // Build retailer comparison
      let retailerText = '';
      if (results.retailers) {
        retailerText = results.retailers.map(r => 
          `${r.isBest ? '⚠️ ' : ''}${r.name}: $${r.price?.toFixed(2)} ($${r.perUnit?.toFixed(2)}/unit)${r.notes ? ` - ${r.notes}` : ''}`
        ).join('\n');
      }
      
      // Build working codes list
      let codesText = 'None found';
      if (results.workingCodes && results.workingCodes.length > 0) {
        codesText = results.workingCodes.map(c => `\`${c.code}\` - ${c.discount}`).join('\n');
      }

      // Check if any competitor is cheaper (flag for seller)
      const lowestCompetitor = results.retailers?.reduce((min, r) => r.price < min.price ? r : min, results.retailers[0]);
      const alertLevel = lowestCompetitor?.price < (product?.price || 999) ? 0xff0000 : 0xf59e0b; // Red if undercut, amber otherwise

      const embeds = [
        {
          title: `🔍 Competitor Check: ${product?.title || product?.asin}`,
          url: `https://amazon.com/dp/${product?.asin}`,
          color: alertLevel,
          thumbnail: product?.image ? { url: product.image } : undefined,
          fields: [
            { 
              name: '📊 Your Amazon Price', 
              value: product?.price ? `$${product.price.toFixed(2)}` : 'Unknown',
              inline: true 
            },
            { 
              name: '⚠️ Lowest Competitor', 
              value: best ? `${best.retailer}: $${best.price?.toFixed(2)}` : 'Not found',
              inline: true 
            },
            { 
              name: '🏪 All Competitor Prices', 
              value: retailerText || 'Not checked',
              inline: false 
            },
            { 
              name: '🎟️ Competitor Coupon Codes', 
              value: codesText,
              inline: false 
            },
          ],
          footer: { text: `ASIN: ${product?.asin}` },
          timestamp: new Date().toISOString()
        }
      ];

      await fetch(settings.discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds })
      });
      
      addToast('Discord: Sent competitor price check', 'success');
    } catch (error) {
      console.error('Discord price hunt error:', error);
      addToast('Failed to send price check to Discord', 'error');
    }
  };

  // Price Hunt function - the main workflow from Part 2 (now focused on competitor checking)
  const runPriceHunt = async (product) => {
    setIsHunting(product.asin);
    addToast(`🔍 Checking competitors for ${product.title || product.asin}...`, 'info');
    
    // In a full implementation with browser automation (Claude in Chrome), this would:
    // 1. Search Walmart, Target, official brand site
    // 2. Gather coupon codes from aggregators
    // 3. Test codes at checkout on BOTH S&S and One-Time options
    // 4. Test higher number variants (e.g., BRAND30 → BRAND35, BRAND40...)
    // 5. Compare final prices
    
    // Simulated results showing the full workflow output format
    await new Promise(r => setTimeout(r, 2000));
    
    const basePrice = product.price || 29.99;
    
    const results = {
      product: product,
      bestDeal: {
        retailer: 'Official Site',
        price: basePrice * 0.85,
        perUnit: basePrice * 0.85,
        method: 'Direct + Free shipping $50+'
      },
      ssComparison: null, // Not comparing S&S since we're the Amazon seller
      retailers: [
        { name: 'Walmart', price: basePrice * 1.05, perUnit: basePrice * 1.05, isBest: false },
        { name: 'Target', price: basePrice * 1.08, perUnit: basePrice * 1.08, isBest: false },
        { name: 'Official Site', price: basePrice * 0.85, perUnit: basePrice * 0.85, isBest: true, notes: 'Free shipping $50+' },
        { name: 'eBay', price: basePrice * 0.95, perUnit: basePrice * 0.95, isBest: false, notes: 'Third-party seller' },
      ],
      workingCodes: [
        { code: 'WELCOME15', discount: '15% off first order (Official Site)' },
        { code: 'SAVE10', discount: '10% off (Official Site)' },
      ],
      failedCodes: [
        { code: 'BRAND50', error: 'Invalid code' },
        { code: 'SAVE20', error: 'Expired' },
      ]
    };
    
    setPriceHuntResults(results);
    setShowPriceHuntResults(true);
    setIsHunting(null);
    addToast('🔍 Competitor check complete!', 'success');
    
    // Send results to Discord if enabled
    if (settings.discordWebhook && settings.sendPriceHuntToDiscord) {
      await sendPriceHuntToDiscord(results);
    }
    
    return results;
  };

  // Add seller
  const handleAddSeller = () => {
    if (!newSeller.id.trim()) {
      addToast('Seller ID is required', 'error');
      return;
    }
    if (sellers.find(s => s.id.toLowerCase() === newSeller.id.toLowerCase())) {
      addToast('Seller already exists', 'error');
      return;
    }
    setSellers(prev => [...prev, { 
      id: newSeller.id.trim(), 
      name: newSeller.name.trim() || newSeller.id.trim(),
      products: [],
      lastChecked: null,
      addedAt: Date.now()
    }]);
    setNewSeller({ id: '', name: '' });
    setShowAddSeller(false);
    addToast('Seller added successfully', 'success');
  };

  // Delete seller
  const handleDeleteSeller = (id) => {
    setSellers(prev => prev.filter(s => s.id !== id));
    setDeleteConfirm(null);
    addToast('Seller removed', 'success');
  };

  // Check seller storefront via Keepa
  const checkSeller = async (sellerId) => {
    if (!settings.keepaKey) {
      addToast('Keepa API key required. Check settings.', 'error');
      setShowSettings(true);
      return;
    }

    setIsChecking(sellerId);
    addToast('Fetching storefront...', 'info');

    try {
      const url = `https://api.keepa.com/seller?key=${settings.keepaKey}&domain=1&seller=${sellerId}&storefront=1`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.tokensLeft !== undefined) {
        setRateLimit({ tokens: data.tokensLeft, refillIn: data.refillIn });
        if (data.tokensLeft < 5) {
          addToast(`Rate limited - wait ${Math.ceil(data.refillIn / 1000)}s`, 'error');
          setIsChecking(null);
          return;
        }
      }

      // Flexible seller lookup (handle case mismatches)
      let sellerInfo = data.sellers?.[sellerId];
      if (!sellerInfo && data.sellers) {
        const keys = Object.keys(data.sellers);
        const matchKey = keys.find(k => k.toLowerCase() === sellerId.toLowerCase());
        sellerInfo = matchKey ? data.sellers[matchKey] : keys[0] ? data.sellers[keys[0]] : null;
      }

      if (!sellerInfo) {
        addToast('Seller not found', 'error');
        setIsChecking(null);
        return;
      }

      const newAsins = sellerInfo.asinList || [];
      const sellerName = sellerInfo.sellerName || sellerId;
      
      const seller = sellers.find(s => s.id.toLowerCase() === sellerId.toLowerCase());
      const existingAsins = new Set(seller?.products?.map(p => p.asin) || []);
      const detectedNewAsins = newAsins.filter(asin => !existingAsins.has(asin));
      
      // Fetch product details for new ASINs
      let productDetails = {};
      if (detectedNewAsins.length > 0) {
        addToast(`Fetching details for ${detectedNewAsins.length} new products...`, 'info');
        productDetails = await fetchProductDetails(detectedNewAsins);
      }

      // Build new products list
      const newProducts = detectedNewAsins.map(asin => ({
        asin,
        isNew: true,
        detectedAt: Date.now(),
        sellerId: sellerId,
        sellerName: sellerName,
        ...productDetails[asin]
      }));

      // Update sellers state
      setSellers(prev => prev.map(s => {
        if (s.id.toLowerCase() !== sellerId.toLowerCase()) return s;
        
        const updatedProducts = [
          ...newProducts,
          ...(s.products || []).map(p => ({ ...p, isNew: false }))
        ];

        return {
          ...s,
          name: sellerName,
          products: updatedProducts,
          lastChecked: Date.now()
        };
      }));

      // Handle notifications AFTER state update (outside the callback)
      if (detectedNewAsins.length > 0) {
        addToast(`🚨 ${detectedNewAsins.length} new product(s) detected!`, 'success');
        
        // Send rich Discord notification with images
        if (settings.discordWebhook) {
          const sentAsins = await sendRichDiscordNotification(sellerName, sellerId, newProducts);
          // Mark sent products with discordNotifiedAt
          if (sentAsins.length > 0) {
            setSellers(prev => prev.map(s => {
              if (s.id.toLowerCase() !== sellerId.toLowerCase()) return s;
              return {
                ...s,
                products: s.products.map(p => 
                  sentAsins.includes(p.asin) ? { ...p, discordNotifiedAt: Date.now() } : p
                )
              };
            }));
          }
        }
        
        // Auto price hunt if enabled
        if (settings.autoPriceHunt && newProducts.length > 0) {
          addToast('🔍 Auto-checking competitors...', 'info');
          setTimeout(() => runPriceHunt(newProducts[0]), 1000);
        }
      } else {
        addToast('No new products found', 'info');
      }

    } catch (error) {
      addToast(`Error: ${error.message}`, 'error');
    }

    setIsChecking(null);
  };

  // Check all sellers sequentially
  const checkAllSellers = async () => {
    if (!settings.keepaKey) {
      addToast('Keepa API key required. Check settings.', 'error');
      setShowSettings(true);
      return;
    }

    if (sellers.length === 0) {
      addToast('No sellers to check', 'error');
      return;
    }

    setIsChecking('all');
    addToast(`Checking ${sellers.length} seller(s)...`, 'info');

    for (let i = 0; i < sellers.length; i++) {
      const seller = sellers[i];
      addToast(`Checking ${seller.name || seller.id} (${i + 1}/${sellers.length})...`, 'info');
      
      try {
        const url = `https://api.keepa.com/seller?key=${settings.keepaKey}&domain=1&seller=${seller.id}&storefront=1`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.tokensLeft !== undefined) {
          setRateLimit({ tokens: data.tokensLeft, refillIn: data.refillIn });
          if (data.tokensLeft < 5) {
            addToast(`Rate limited - stopping. Wait ${Math.ceil(data.refillIn / 1000)}s`, 'error');
            break;
          }
        }

        let sellerInfo = data.sellers?.[seller.id];
        if (!sellerInfo && data.sellers) {
          const keys = Object.keys(data.sellers);
          const matchKey = keys.find(k => k.toLowerCase() === seller.id.toLowerCase());
          sellerInfo = matchKey ? data.sellers[matchKey] : keys[0] ? data.sellers[keys[0]] : null;
        }

        if (!sellerInfo) {
          addToast(`Seller ${seller.name || seller.id} not found`, 'error');
          continue;
        }

        const newAsins = sellerInfo.asinList || [];
        const sellerName = sellerInfo.sellerName || seller.id;
        const existingAsins = new Set(seller.products?.map(p => p.asin) || []);
        const detectedNewAsins = newAsins.filter(asin => !existingAsins.has(asin));

        let productDetails = {};
        if (detectedNewAsins.length > 0) {
          productDetails = await fetchProductDetails(detectedNewAsins);
        }

        // Build new products list
        const newProducts = detectedNewAsins.map(asin => ({
          asin,
          isNew: true,
          detectedAt: Date.now(),
          sellerId: seller.id,
          sellerName: sellerName,
          ...productDetails[asin]
        }));

        // Update sellers state
        setSellers(prev => prev.map(s => {
          if (s.id.toLowerCase() !== seller.id.toLowerCase()) return s;

          const updatedProducts = [
            ...newProducts,
            ...(s.products || []).map(p => ({ ...p, isNew: false }))
          ];

          return {
            ...s,
            name: sellerName,
            products: updatedProducts,
            lastChecked: Date.now()
          };
        }));

        // Handle notifications AFTER state update
        if (detectedNewAsins.length > 0) {
          addToast(`🚨 ${detectedNewAsins.length} new product(s) from ${sellerName}!`, 'success');
          
          if (settings.discordWebhook) {
            const sentAsins = await sendRichDiscordNotification(sellerName, seller.id, newProducts);
            // Mark sent products with discordNotifiedAt
            if (sentAsins.length > 0) {
              setSellers(prev => prev.map(s => {
                if (s.id.toLowerCase() !== seller.id.toLowerCase()) return s;
                return {
                  ...s,
                  products: s.products.map(p => 
                    sentAsins.includes(p.asin) ? { ...p, discordNotifiedAt: Date.now() } : p
                  )
                };
              }));
            }
          }
        }

        // Delay between sellers to avoid rate limiting
        if (i < sellers.length - 1) {
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (error) {
        addToast(`Error checking ${seller.name || seller.id}: ${error.message}`, 'error');
      }
    }

    addToast('✅ Finished checking all sellers', 'success');
    setIsChecking(null);
  };

  // Export data
  const exportData = () => {
    const data = { sellers, settings: { ...settings, keepaKey: '***REDACTED***' } };
    return JSON.stringify(data, null, 2);
  };

  // Import data
  const handleImport = () => {
    try {
      const data = JSON.parse(importData);
      if (data.sellers) setSellers(data.sellers);
      if (data.settings?.discordWebhook) {
        setSettings(prev => ({ ...prev, discordWebhook: data.settings.discordWebhook }));
      }
      setShowExport(false);
      setImportData('');
      addToast('Data imported successfully', 'success');
    } catch (error) {
      addToast('Invalid import data', 'error');
    }
  };

  // Calculate stats
  const totalProducts = sellers.reduce((sum, s) => sum + (s.products?.length || 0), 0);
  const today = new Date().setHours(0, 0, 0, 0);
  const newToday = sellers.reduce((sum, s) => 
    sum + (s.products?.filter(p => p.detectedAt && p.detectedAt >= today).length || 0), 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      {/* Background texture */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }} />

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>

      {/* Header */}
      <header className="relative mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white flex items-center gap-3">
              <span className="text-4xl">🕵️</span>
              SELLER STALKER
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Amazon seller monitoring + price hunting <span className="text-emerald-500">● Data auto-saved</span></p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {rateLimit && (
              <div className="text-xs text-zinc-500 bg-zinc-800 px-3 py-1.5 rounded-lg">
                API Tokens: <span className={rateLimit.tokens < 10 ? 'text-red-400' : 'text-emerald-400'}>{rateLimit.tokens}</span>
              </div>
            )}
            <button
              onClick={() => setShowExport(true)}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-zinc-700 rounded-lg hover:border-zinc-600 transition-all"
            >
              Export/Import
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 text-sm bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-all flex items-center gap-2"
            >
              ⚙️ Settings
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <StatsBar sellers={sellers.length} products={totalProducts} newToday={newToday} />

      {/* Add Seller Button */}
      <div className="mb-6 flex gap-3 flex-wrap">
        <button
          onClick={() => setShowAddSeller(true)}
          className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-bold rounded-xl hover:from-cyan-500 hover:to-cyan-400 transition-all shadow-lg shadow-cyan-600/20"
        >
          + Add Seller
        </button>
        {sellers.length > 0 && (
          <button
            onClick={checkAllSellers}
            disabled={isChecking === 'all'}
            className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isChecking === 'all' ? (
              <>
                <span className="animate-spin">⟳</span> Checking...
              </>
            ) : (
              <>🔄 Check All Sellers</>
            )}
          </button>
        )}
      </div>

      {/* Sellers Grid */}
      {sellers.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <div className="text-6xl mb-4 opacity-30">📦</div>
          <p>No sellers tracked yet.</p>
          <p className="text-sm mt-2">Add a seller ID to start monitoring their storefront.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sellers.map(seller => (
            <SellerCard
              key={seller.id}
              seller={seller}
              onDelete={(id) => setDeleteConfirm(id)}
              onCheck={checkSeller}
              isChecking={isChecking === seller.id || isChecking === 'all'}
              onViewProducts={setShowProducts}
            />
          ))}
        </div>
      )}

      {/* Settings Modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings">
        <div className="space-y-5">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Keepa API Key</label>
            <input
              type="password"
              value={settings.keepaKey}
              onChange={(e) => setSettings(prev => ({ ...prev, keepaKey: e.target.value }))}
              placeholder="Enter your Keepa API key"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
            <p className="text-xs text-zinc-500 mt-2">Get your key at <a href="https://keepa.com/#!api" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">keepa.com/api</a></p>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Discord Webhook URL</label>
            <input
              type="text"
              value={settings.discordWebhook}
              onChange={(e) => setSettings(prev => ({ ...prev, discordWebhook: e.target.value }))}
              placeholder="https://discord.com/api/webhooks/..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
            <p className="text-xs text-zinc-500 mt-2">Receive rich product cards with images when new items detected</p>
          </div>
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
            <div>
              <div className="text-white text-sm font-medium">Auto Competitor Check (Demo)</div>
              <div className="text-xs text-zinc-500">Show simulated competitor data for new products</div>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, autoPriceHunt: !prev.autoPriceHunt }))}
              className={`w-12 h-6 rounded-full transition-colors ${settings.autoPriceHunt ? 'bg-cyan-600' : 'bg-zinc-700'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${settings.autoPriceHunt ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
            <div>
              <div className="text-white text-sm font-medium">Send Competitor Check to Discord</div>
              <div className="text-xs text-zinc-500">Post competitor prices to Discord (off by default)</div>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, sendPriceHuntToDiscord: !prev.sendPriceHuntToDiscord }))}
              className={`w-12 h-6 rounded-full transition-colors ${settings.sendPriceHuntToDiscord ? 'bg-cyan-600' : 'bg-zinc-700'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${settings.sendPriceHuntToDiscord ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <button
            onClick={() => { setShowSettings(false); addToast('Settings saved', 'success'); }}
            className="w-full py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 transition-colors"
          >
            Save Settings
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure? This will delete ALL sellers and settings permanently.')) {
                localStorage.removeItem('seller_stalker_sellers');
                localStorage.removeItem('seller_stalker_settings');
                setSellers([]);
                setSettings({ keepaKey: '', discordWebhook: '', autoPriceHunt: false, sendPriceHuntToDiscord: false });
                setShowSettings(false);
                addToast('All data cleared', 'success');
              }
            }}
            className="w-full py-3 bg-red-600/20 text-red-400 font-bold rounded-lg hover:bg-red-600/30 transition-colors border border-red-600/30"
          >
            Clear All Data
          </button>
        </div>
      </Modal>

      {/* Add Seller Modal */}
      <Modal isOpen={showAddSeller} onClose={() => setShowAddSeller(false)} title="Add Seller">
        <div className="space-y-5">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Seller ID *</label>
            <input
              type="text"
              value={newSeller.id}
              onChange={(e) => setNewSeller(prev => ({ ...prev, id: e.target.value }))}
              placeholder="e.g., A2R2RITDJNW1Q6"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <p className="text-xs text-zinc-500 mt-2">Find this in the Amazon seller URL: amazon.com/sp?seller=<strong>SELLER_ID</strong></p>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Display Name (optional)</label>
            <input
              type="text"
              value={newSeller.name}
              onChange={(e) => setNewSeller(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Brand Official Store"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={handleAddSeller}
            className="w-full py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 transition-colors"
          >
            Add Seller
          </button>
        </div>
      </Modal>

      {/* Products Modal */}
      <Modal isOpen={!!showProducts} onClose={() => setShowProducts(null)} title={`Products: ${showProducts?.name || ''}`} wide>
        <div className="space-y-3">
          {showProducts?.products?.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No products tracked yet. Click "Check Now" to fetch storefront.</p>
          ) : (
            showProducts?.products?.map(product => (
              <ProductCard 
                key={product.asin} 
                product={{...product, sellerName: showProducts.name, sellerId: showProducts.id}}
                onPriceHunt={runPriceHunt}
                isHunting={isHunting === product.asin}
              />
            ))
          )}
        </div>
      </Modal>

      {/* Export/Import Modal */}
      <Modal isOpen={showExport} onClose={() => setShowExport(false)} title="Export / Import Data">
        <div className="space-y-5">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Export (copy this)</label>
            <textarea
              readOnly
              value={exportData()}
              className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono text-xs focus:outline-none"
            />
          </div>
          <div className="border-t border-zinc-700 pt-5">
            <label className="block text-sm text-zinc-400 mb-2">Import (paste here)</label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste exported JSON here..."
              className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleImport}
              disabled={!importData}
              className="mt-3 w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Import Data
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDeleteSeller(deleteConfirm)}
        message="Are you sure you want to remove this seller? All tracked product data will be lost."
      />

      {/* Price Hunt Results */}
      <PriceHuntResults 
        isOpen={showPriceHuntResults} 
        onClose={() => setShowPriceHuntResults(false)} 
        results={priceHuntResults}
      />
    </div>
  );
}
