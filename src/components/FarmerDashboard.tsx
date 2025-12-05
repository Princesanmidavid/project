import React, { useState } from 'react';
import { Fish, Plus, CreditCard as Edit, Trash2, LogOut, User, Package, DollarSign, TrendingUp } from 'lucide-react';
import { User as UserType } from '../App';
import { supabase, createFishListing, getFarmerListings, updateFishListing, deleteFishListing, FishListing } from '../lib/supabase';

interface FarmerDashboardProps {
  user: UserType;
  onLogout: () => void;
}


export default function FarmerDashboard({ user, onLogout }: FarmerDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddFish, setShowAddFish] = useState(false);
  const [editingFish, setEditingFish] = useState<FishListing | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [fishListings, setFishListings] = useState<FishListing[]>([]);

  const [newFish, setNewFish] = useState({
    fish_type: 'catfish' as 'catfish' | 'tilapia' | 'dry_fish',
    quantity: '',
    price_per_unit: '',
    description: ''
  });

  // Load farmer's listings on component mount
  React.useEffect(() => {
    loadFishListings();
  }, []);

  const loadFishListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await getFarmerListings();
      if (error) throw error;
      setFishListings(data || []);
    } catch (error) {
      console.error('Error loading fish listings:', error);
      alert('Failed to load fish listings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await createFishListing({
        fish_type: newFish.fish_type,
        quantity: parseInt(newFish.quantity),
        price_per_unit: parseFloat(newFish.price_per_unit),
        description: newFish.description,
      });

      if (error) throw error;

      setFishListings([data, ...fishListings]);
      setNewFish({ fish_type: 'catfish', quantity: '', price_per_unit: '', description: '' });
      setShowAddFish(false);
      alert('Fish listing added successfully!');
    } catch (error) {
      console.error('Error adding fish listing:', error);
      alert('Failed to add fish listing');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFish = (fish: FishListing) => {
    setEditingFish(fish);
    setNewFish({
      fish_type: fish.fish_type,
      quantity: fish.quantity.toString(),
      price_per_unit: fish.price_per_unit.toString(),
      description: fish.description
    });
    setShowAddFish(true);
  };

  const handleUpdateFish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFish) return;
    setLoading(true);
    
    try {
      const { data, error } = await updateFishListing(editingFish.id, {
        fish_type: newFish.fish_type,
        quantity: parseInt(newFish.quantity),
        price_per_unit: parseFloat(newFish.price_per_unit),
        description: newFish.description,
      });

      if (error) throw error;

      setFishListings(fishListings.map(fish => 
        fish.id === editingFish.id ? data : fish
      ));
      
      setNewFish({ fish_type: 'catfish', quantity: '', price_per_unit: '', description: '' });
      setShowAddFish(false);
      setEditingFish(null);
      alert('Fish listing updated successfully!');
    } catch (error) {
      console.error('Error updating fish listing:', error);
      alert('Failed to update fish listing');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFish = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fish listing?')) return;
    
    setLoading(true);
    try {
      const { error } = await deleteFishListing(id);
      if (error) throw error;

      setFishListings(fishListings.filter(fish => fish.id !== id));
      alert('Fish listing deleted successfully!');
    } catch (error) {
      console.error('Error deleting fish listing:', error);
      alert('Failed to delete fish listing');
    } finally {
      setLoading(false);
    }
  };

  const totalQuantity = fishListings.reduce((sum, fish) => sum + fish.quantity, 0);
  const totalValue = fishListings.reduce((sum, fish) => sum + (fish.quantity * fish.price_per_unit), 0);

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Fish</p>
              <p className="text-3xl font-bold text-gray-900">{totalQuantity} kg</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Fish className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-3xl font-bold text-gray-900">₦{totalValue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Listings</p>
              <p className="text-3xl font-bold text-gray-900">{fishListings.length}</p>
            </div>
            <div className="p-3 bg-teal-100 rounded-lg">
              <Package className="h-6 w-6 text-teal-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">New order received</p>
              <p className="text-sm text-gray-600">50kg Catfish ordered by Restaurant ABC</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Fish className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Listing updated</p>
              <p className="text-sm text-gray-600">Tilapia price updated to ₦3,200/kg</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderListings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Fish Listings</h2>
        <button
          onClick={() => setShowAddFish(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Fish</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fishListings.map((fish) => (
          <div key={fish.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  fish.fish_type === 'catfish' ? 'bg-yellow-100' : 
                  fish.fish_type === 'tilapia' ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  <Fish className={`h-6 w-6 ${
                    fish.fish_type === 'catfish' ? 'text-yellow-600' : 
                    fish.fish_type === 'tilapia' ? 'text-green-600' : 'text-orange-600'
                  }`} />
                </div>
                <h3 className="font-semibold text-gray-900 capitalize">{fish.fish_type.replace('_', ' ')}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEditFish(fish)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteFish(fish.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium">{fish.quantity} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price per kg:</span>
                <span className="font-medium">₦{fish.price_per_unit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Value:</span>
                <span className="font-bold text-green-600">₦{(fish.quantity * fish.price_per_unit).toLocaleString()}</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{fish.description}</p>
            <p className="text-xs text-gray-500">Added: {new Date(fish.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>

      {/* Add/Edit Fish Modal */}
      {showAddFish && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingFish ? 'Edit Fish Listing' : 'Add New Fish'}
            </h3>
            
            <form onSubmit={editingFish ? handleUpdateFish : handleAddFish} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fish Type</label>
                <select
                  value={newFish.fish_type}
                  onChange={(e) => setNewFish({...newFish, fish_type: e.target.value as 'catfish' | 'tilapia' | 'dry_fish'})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="catfish">Catfish</option>
                  <option value="tilapia">Tilapia</option>
                  <option value="dry_fish">Dry Fish</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity (kg)</label>
                <input
                  type="number"
                  value={newFish.quantity}
                  onChange={(e) => setNewFish({...newFish, quantity: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price per kg (₦)</label>
                <input
                  type="number"
                  value={newFish.price_per_unit}
                  onChange={(e) => setNewFish({...newFish, price_per_unit: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newFish.description}
                  onChange={(e) => setNewFish({...newFish, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  required
                />
              </div>
              
              <div className="flex items-center space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
                >
                  {loading ? 'Processing...' : (editingFish ? 'Update Fish' : 'Add Fish')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddFish(false);
                    setEditingFish(null);
                    setNewFish({ fish_type: 'catfish', quantity: '', price_per_unit: '', description: '' });
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
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
                <h1 className="text-xl font-bold text-gray-900">FISHY Farmer</h1>
                <p className="text-sm text-gray-600">Welcome, {user.fullName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Farmer Code</p>
                <p className="text-lg font-bold text-blue-600">{user.uniqueCode}</p>
              </div>
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
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'listings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Listings
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? renderDashboard() : renderListings()}
      </main>
    </div>
  );
}