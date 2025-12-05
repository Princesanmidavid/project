import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface Farmer {
  id: string;
  full_name: string;
  company_name: string;
  phone: string;
  email: string;
  country: string;
  state: string;
  local_government: string;
  city: string;
  street: string;
  business_cert_url?: string;
  id_card_url?: string;
  id_type: 'nin' | 'company' | 'passport';
  unique_code: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  full_name: string;
  company_name: string;
  company_address: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface FishListing {
  id: string;
  farmer_id: string;
  fish_type: 'catfish' | 'tilapia' | 'dry_fish';
  quantity: number;
  price_per_unit: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  farmer?: {
    full_name: string;
    company_name: string;
    unique_code: string;
    city: string;
    state: string;
  };
}

export interface Order {
  id: string;
  customer_id: string;
  farmer_id: string;
  farmer_code: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  fish_listing_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

// Authentication helpers
export const signUpFarmer = async (farmerData: {
  fullName: string;
  companyName: string;
  phone: string;
  email: string;
  password: string;
  country: string;
  state: string;
  localGovernment: string;
  city: string;
  street: string;
  idType: 'nin' | 'company' | 'passport';
  businessCert?: File;
  idCard?: File;
}) => {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: farmerData.email,
      password: farmerData.password,
    });

    if (authError) throw authError;

    if (authData.user) {
      // Upload files if provided
      let businessCertUrl = '';
      let idCardUrl = '';

      if (farmerData.businessCert) {
        const { data: certData, error: certError } = await supabase.storage
          .from('documents')
          .upload(`farmers/${authData.user.id}/business_cert_${Date.now()}`, farmerData.businessCert);
        
        if (certError) throw certError;
        businessCertUrl = certData?.path || '';
      }

      if (farmerData.idCard) {
        const { data: idData, error: idError } = await supabase.storage
          .from('documents')
          .upload(`farmers/${authData.user.id}/id_card_${Date.now()}`, farmerData.idCard);
        
        if (idError) throw idError;
        idCardUrl = idData?.path || '';
      }

      // Insert farmer data
      const { data: farmerRecord, error: farmerError } = await supabase
        .from('farmers')
        .insert({
          id: authData.user.id,
          full_name: farmerData.fullName,
          company_name: farmerData.companyName,
          phone: farmerData.phone,
          email: farmerData.email,
          password_hash: 'handled_by_auth',
          country: farmerData.country,
          state: farmerData.state,
          local_government: farmerData.localGovernment,
          city: farmerData.city,
          street: farmerData.street,
          business_cert_url: businessCertUrl,
          id_card_url: idCardUrl,
          id_type: farmerData.idType,
        })
        .select()
        .single();

      if (farmerError) throw farmerError;

      return { data: farmerRecord, error: null };
    }
  } catch (error) {
    return { data: null, error };
  }
};

export const signUpCustomer = async (customerData: {
  fullName: string;
  companyName: string;
  companyAddress: string;
  phone: string;
  email: string;
  password: string;
}) => {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: customerData.email,
      password: customerData.password,
    });

    if (authError) throw authError;

    if (authData.user) {
      // Insert customer data
      const { data: customerRecord, error: customerError } = await supabase
        .from('customers')
        .insert({
          id: authData.user.id,
          full_name: customerData.fullName,
          company_name: customerData.companyName,
          company_address: customerData.companyAddress,
          phone: customerData.phone,
          email: customerData.email,
          password_hash: 'handled_by_auth',
        })
        .select()
        .single();

      if (customerError) throw customerError;

      return { data: customerRecord, error: null };
    }
  } catch (error) {
    return { data: null, error };
  }
};

export const signInUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { data: null, error };

  // Check if user is farmer or customer
  const { data: farmerData } = await supabase
    .from('farmers')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (farmerData) {
    return { data: { user: data.user, profile: farmerData, type: 'farmer' }, error: null };
  }

  const { data: customerData } = await supabase
    .from('customers')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (customerData) {
    return { data: { user: data.user, profile: customerData, type: 'customer' }, error: null };
  }

  return { data: null, error: new Error('User profile not found') };
};

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Fish listing helpers
export const createFishListing = async (listingData: {
  fish_type: 'catfish' | 'tilapia' | 'dry_fish';
  quantity: number;
  price_per_unit: number;
  description: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('fish_listings')
    .insert({
      farmer_id: user.id,
      ...listingData,
    })
    .select()
    .single();

  return { data, error };
};

export const getFishListings = async () => {
  const { data, error } = await supabase
    .from('fish_listings')
    .select(`
      *,
      farmer:farmers(full_name, company_name, unique_code, city, state)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return { data, error };
};

export const getFarmerListings = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('fish_listings')
    .select('*')
    .eq('farmer_id', user.id)
    .order('created_at', { ascending: false });

  return { data, error };
};

export const updateFishListing = async (id: string, updates: Partial<FishListing>) => {
  const { data, error } = await supabase
    .from('fish_listings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
};

export const deleteFishListing = async (id: string) => {
  const { data, error } = await supabase
    .from('fish_listings')
    .delete()
    .eq('id', id);

  return { data, error };
};

// Order helpers
export const createOrder = async (orderData: {
  farmer_id: string;
  farmer_code: string;
  total_amount: number;
  items: {
    fish_listing_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[];
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: user.id,
      farmer_id: orderData.farmer_id,
      farmer_code: orderData.farmer_code,
      total_amount: orderData.total_amount,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Create order items
  const orderItems = orderData.items.map(item => ({
    order_id: order.id,
    ...item,
  }));

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select();

  if (itemsError) throw itemsError;

  return { data: { order, items }, error: null };
}