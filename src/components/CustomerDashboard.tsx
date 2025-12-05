import React, { useState } from 'react';
import { Fish, ShoppingCart, LogOut, Search, Filter, Star, MapPin } from 'lucide-react';
import { User as UserType } from '../App';
import { supabase, getFishListings, createOrder, FishListing } from '../lib/supabase';

interface CustomerDashboardProps {
  user: UserType;
  onLogout: () => void;
}

interface CartItem extends FishListing {
  orderQuantity: number;
}

export default function CustomerDashboard({ user, onLogout }: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'catfish' | 'tilapia' | 'dry_fish'>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fishListings, setFishListings] = useState<FishListing[]>([]);

  // Load fish listings on component mount
  React.useEffect(() => {
    loadFishListings();
  }, []);

  const loadFishListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await getFishListings();
      if (error) throw error;
      setFishListings(data || []);
    } catch (error) {
      console.error('Error loading fish listings:', error);
      alert('Failed to load fish listings');
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = fishListings.filter(listing => {
    const matchesSearch = listing.farmer?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.fish_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || listing.fish_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const addToCart = (listing: FishListing, quantity: number) => {
    const existingItem = cart.find(item => item.id === listing.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === listing.id 
          ? { ...item, orderQuantity: item.orderQuantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, { ...listing, orderQuantity: quantity }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateCartQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setCart(cart.map(item => 
        item.id === id ? { ...item, orderQuantity: quantity } : item
      ));
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price_per_unit * item.orderQuantity), 0);
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Group cart items by farmer
      const ordersByFarmer = cart.reduce((acc, item) => {
        const farmerId = item.farmer_id;
        if (!acc[farmerId]) {
          acc[farmerId] = {
            farmer_id: farmerId,
            farmer_code: item.farmer?.unique_code || '',
            items: [],
            total: 0
          };
        }
        acc[farmerId].items.push({
          fish_listing_id: item.id,
          quantity: item.orderQuantity,
          unit_price: item.price_per_unit,
          subtotal: item.price_per_unit * item.orderQuantity
        });
        acc[farmerId].total += item.price_per_unit * item.orderQuantity;
        return acc;
      }, {} as any);

      // Create orders for each farmer
      for (const order of Object.values(ordersByFarmer) as any[]) {
        const { error } = await createOrder({
          farmer_id: order.farmer_id,
          farmer_code: order.farmer_code,
          total_amount: order.total,
          items: order.items
        });
        
        if (error) throw error;
      }

      alert(`Payment of ₦${getTotalAmount().toLocaleString()} processed successfully! Your orders have been placed.`);
      setCart([]);
      setShowCheckout(false);
      setShowCart(false);
    } catch (error) {
      console.error('Error processing checkout:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderMarketplace = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for fish, farms, or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'catfish' | 'tilapia' | 'dry_fish')}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Fish</option>
                <option value="catfish">Catfish</option>
                <option value="tilapia">Tilapia</option>
                <option value="dry_fish">Dry Fish</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Fish Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.map((listing) => (
          <FishCard key={listing.id} listing={listing} onAddToCart={addToCart} />
        ))}
      </div>

      {filteredListings.length === 0 && (
        <div className="text-center py-12">
          <Fish className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No fish found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );

  const renderCart = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>
      
      {cart.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-600">Add some fish to your cart to get started</p>
          <button
            onClick={() => setActiveTab('marketplace')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Browse Fish
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${
                      item.fish_type === 'catfish' ? 'bg-yellow-100' : 
                      item.fish_type === 'tilapia' ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      <Fish className={`h-6 w-6 ${
                        item.fish_type === 'catfish' ? 'text-yellow-600' : 
                        item.fish_type === 'tilapia' ? 'text-green-600' : 'text-orange-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 capitalize">{item.fish_type.replace('_', ' ')}</h3>
                      <p className="text-sm text-gray-600">{item.farmer?.company_name}</p>
                      <p className="text-sm text-blue-600">Code: {item.farmer?.unique_code}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.orderQuantity - 1)}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-medium">{item.orderQuantity} kg</span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.orderQuantity + 1)}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-lg">₦{(item.price_per_unit * item.orderQuantity).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">₦{item.price_per_unit.toLocaleString()}/kg</p>
                    </div>
                    
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between text-xl font-bold">
              <span>Total Amount:</span>
              <span className="text-green-600">₦{getTotalAmount().toLocaleString()}</span>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Checkout</h3>
            
            <div className="space-y-4 mb-6">
              <div className="border-b pb-4">
                <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.fish_type.replace('_', ' ')} ({item.orderQuantity}kg) - {item.farmer?.unique_code}</span>
                    <span>₦{(item.price_per_unit * item.orderQuantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>₦{getTotalAmount().toLocaleString()}</span>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Payment Information:</strong><br />
                  All payments are processed securely through FISHY's centralized payment system. 
                  Your order will be processed and farmers will be notified automatically.
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
              >
                {loading ? 'Processing...' : 'Complete Payment'}
              </button>
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Fish className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FISHY Customer</h1>
                <p className="text-sm text-gray-600">Welcome, {user.fullName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <ShoppingCart className="h-6 w-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'marketplace'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Marketplace
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showCart ? renderCart() : renderMarketplace()}
      </main>
    </div>
  );
}

// Fish Card Component
interface FishCardProps {
  listing: FishListing;
  onAddToCart: (listing: FishListing, quantity: number) => void;
}

function FishCard({ listing, onAddToCart }: FishCardProps) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-lg ${
            listing.fish_type === 'catfish' ? 'bg-yellow-100' : 
            listing.fish_type === 'tilapia' ? 'bg-green-100' : 'bg-orange-100'
          }`}>
            <Fish className={`h-6 w-6 ${
              listing.fish_type === 'catfish' ? 'text-yellow-600' : 
              listing.fish_type === 'tilapia' ? 'text-green-600' : 'text-orange-600'
            }`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 capitalize">{listing.fish_type.replace('_', ' ')}</h3>
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-600">Fresh & Quality</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{listing.farmer?.company_name}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>📍 {listing.farmer?.city}, {listing.farmer?.state}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <span>Code: {listing.farmer?.unique_code}</span>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Available:</span>
          <span className="font-medium">{listing.quantity} kg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Price per kg:</span>
          <span className="font-bold text-green-600">₦{listing.price_per_unit.toLocaleString()}</span>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">{listing.description}</p>
      
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
          >
            -
          </button>
          <span className="w-12 text-center font-medium">{quantity} kg</span>
          <button
            onClick={() => setQuantity(Math.min(listing.quantity, quantity + 1))}
            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
          >
            +
          </button>
        </div>
        
        <button
          onClick={() => onAddToCart(listing, quantity)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
}