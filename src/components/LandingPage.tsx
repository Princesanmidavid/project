import React, { useState } from 'react';
import { Fish, Users, ShoppingCart, Shield, Star, ArrowRight, Phone, Mail, MapPin } from 'lucide-react';
import { User } from '../App';
import { signUpFarmer, signUpCustomer, signInUser } from '../lib/supabase';

interface LandingPageProps {
  onLogin: (user: User) => void;
}

interface FormData {
  fullName: string;
  companyName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Farmer specific
  country: string;
  state: string;
  localGovernment: string;
  city: string;
  street: string;
  businessCert: File | null;
  idCard: File | null;
  idType: 'nin' | 'company' | 'passport';
  // Customer specific
  companyAddress: string;
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'farmer-signup' | 'customer-signup'>('login');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    companyName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    state: '',
    localGovernment: '',
    city: '',
    street: '',
    businessCert: null,
    idCard: null,
    idType: 'nin',
    companyAddress: ''
  });

  const generateUniqueCode = () => {
    return 'FSH' + Math.random().toString(36).substr(2, 6).toUpperCase();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'businessCert' | 'idCard') => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authMode === 'login') {
      handleLogin();
    } else {
      handleSignup();
    }
  };

  const handleLogin = async () => {
    try {
      const { data, error } = await signInUser(formData.email, formData.password);
      if (error) throw error;

      if (data) {
        const user: User = {
          id: data.profile.id,
          type: data.type as 'farmer' | 'customer',
          fullName: data.profile.full_name,
          email: data.profile.email,
          phone: data.profile.phone,
          companyName: data.profile.company_name,
          uniqueCode: data.type === 'farmer' ? data.profile.unique_code : undefined
        };
        onLogin(user);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please check your credentials.');
    }
  };

  const handleSignup = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      if (authMode === 'farmer-signup') {
        const { data, error } = await signUpFarmer({
          fullName: formData.fullName,
          companyName: formData.companyName,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          country: formData.country,
          state: formData.state,
          localGovernment: formData.localGovernment,
          city: formData.city,
          street: formData.street,
          idType: formData.idType,
          businessCert: formData.businessCert,
          idCard: formData.idCard,
        });

        if (error) throw error;

        if (data) {
          const user: User = {
            id: data.id,
            type: 'farmer',
            fullName: data.full_name,
            email: data.email,
            phone: data.phone,
            companyName: data.company_name,
            uniqueCode: data.unique_code
          };
          onLogin(user);
        }
      } else {
        const { data, error } = await signUpCustomer({
          fullName: formData.fullName,
          companyName: formData.companyName,
          companyAddress: formData.companyAddress,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        if (data) {
          const user: User = {
            id: data.id,
            type: 'customer',
            fullName: data.full_name,
            email: data.email,
            phone: data.phone,
            companyName: data.company_name,
          };
          onLogin(user);
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed. Please try again.');
    }
  };

  const features = [
    {
      icon: Fish,
      title: 'Fresh Fish Direct',
      description: 'Connect directly with certified fish farmers for the freshest catch'
    },
    {
      icon: Shield,
      title: 'Secure Transactions',
      description: 'All payments are processed securely through our centralized system'
    },
    {
      icon: Users,
      title: 'Verified Farmers',
      description: 'All farmers are verified with proper documentation and certifications'
    },
    {
      icon: ShoppingCart,
      title: 'Easy Ordering',
      description: 'Simple and intuitive ordering process with real-time inventory'
    }
  ];

  const testimonials = [
    {
      name: 'Adebayo Ogundimu',
      role: 'Fish Farmer',
      location: 'Lagos, Nigeria',
      quote: 'FISHY has transformed my business. I can now reach customers across the country.',
      rating: 5
    },
    {
      name: 'Sarah Johnson',
      role: 'Restaurant Owner',
      location: 'Abuja, Nigeria',
      quote: 'The quality of fish is exceptional and delivery is always on time.',
      rating: 5
    }
  ];

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-teal-600 to-green-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Fish className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">FISHY</h1>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {authMode === 'login' ? 'Welcome Back' : 
               authMode === 'farmer-signup' ? 'Join as Farmer' : 'Join as Customer'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'login' ? (
              <>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </>
            ) : (
              <>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <input
                  type="text"
                  name="companyName"
                  placeholder="Company Name"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />

                {authMode === 'farmer-signup' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        name="country"
                        placeholder="Country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <input
                        type="text"
                        name="state"
                        placeholder="State"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        name="localGovernment"
                        placeholder="Local Government"
                        value={formData.localGovernment}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <input
                        type="text"
                        name="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      name="street"
                      placeholder="Street Address"
                      value={formData.street}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ID Type</label>
                      <select
                        name="idType"
                        value={formData.idType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="nin">NIN</option>
                        <option value="company">Company ID</option>
                        <option value="passport">International Passport</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business Registration Certificate</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, 'businessCert')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ID Card</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, 'idCard')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </>
                ) : (
                  <textarea
                    name="companyAddress"
                    placeholder="Company Address"
                    value={formData.companyAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    required
                  />
                )}

                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {authMode === 'login' ? (
              <>
                <button
                  onClick={() => setAuthMode('farmer-signup')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Join as Farmer
                </button>
                <span className="text-gray-400 mx-2">|</span>
                <button
                  onClick={() => setAuthMode('customer-signup')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Join as Customer
                </button>
              </>
            ) : (
              <button
                onClick={() => setAuthMode('login')}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Already have an account? Sign In
              </button>
            )}
          </div>

          <button
            onClick={() => setShowAuth(false)}
            className="mt-4 w-full text-gray-600 hover:text-gray-700 text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Fish className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">FISHY</h1>
                <p className="text-xs text-gray-600">Fresh Fish Marketplace</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setShowAuth(true);
                }}
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthMode('farmer-signup');
                  setShowAuth(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Join as Farmer
              </button>
              <button
                onClick={() => {
                  setAuthMode('customer-signup');
                  setShowAuth(true);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Join as Customer
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-teal-600 to-green-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Fresh Fish
                  <span className="text-yellow-300"> Direct</span>
                  <br />from Farmers
                </h1>
                <p className="text-xl text-blue-100 leading-relaxed">
                  Connect with certified fish farmers across Nigeria. Get the freshest catch 
                  delivered directly to your business with secure, transparent transactions.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => {
                    setAuthMode('customer-signup');
                    setShowAuth(true);
                  }}
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Start Buying</span>
                </button>
                <button 
                  onClick={() => {
                    setAuthMode('farmer-signup');
                    setShowAuth(true);
                  }}
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Fish className="h-5 w-5" />
                  <span>Start Selling</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-blue-200">Verified Farmers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">10K+</div>
                  <div className="text-blue-200">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">50K+</div>
                  <div className="text-blue-200">Fish Delivered</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Fish className="h-6 w-6 text-yellow-800" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Fresh Catfish</h3>
                      <p className="text-blue-200">₦2,500 per kg</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center">
                      <Fish className="h-6 w-6 text-green-800" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Premium Tilapia</h3>
                      <p className="text-blue-200">₦3,200 per kg</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
                      <Fish className="h-6 w-6 text-blue-800" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Organic Salmon</h3>
                      <p className="text-blue-200">₦5,800 per kg</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose FISHY?</h2>
            <p className="text-xl text-gray-600">The most trusted fish marketplace in Nigeria</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-center">
                  <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                    <IconComponent className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600">Trusted by farmers and customers across Nigeria</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-lg text-gray-700 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-xs text-gray-500">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of farmers and customers on Nigeria's leading fish marketplace
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => {
                setAuthMode('farmer-signup');
                setShowAuth(true);
              }}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
            >
              <Fish className="h-5 w-5" />
              <span>Start Selling Fish</span>
            </button>
            <button 
              onClick={() => {
                setAuthMode('customer-signup');
                setShowAuth(true);
              }}
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Start Buying Fish</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Fish className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">FISHY</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Nigeria's premier fish marketplace connecting farmers directly with customers. 
                Fresh, quality fish delivered with trust and transparency.
              </p>
              <div className="flex items-center space-x-4">
                <Phone className="h-5 w-5 text-gray-400" />
                <span className="text-gray-400">+234 800 FISHY (34749)</span>
              </div>
              <div className="flex items-center space-x-4 mt-2">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-gray-400">hello@fishy.ng</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Farmers</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Sell Your Fish</li>
                <li>Farmer Resources</li>
                <li>Pricing Guide</li>
                <li>Support</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Customers</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Browse Fish</li>
                <li>How It Works</li>
                <li>Quality Guarantee</li>
                <li>Customer Support</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 FISHY. All rights reserved. Made with ❤️ for Nigerian fish farmers and customers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}