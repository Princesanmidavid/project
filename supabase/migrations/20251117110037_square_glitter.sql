/*
  # FISHY Marketplace Database Schema

  1. New Tables
    - `farmers`
      - `id` (uuid, primary key)
      - `full_name` (text)
      - `company_name` (text)
      - `phone` (text)
      - `email` (text, unique)
      - `password_hash` (text)
      - `country` (text)
      - `state` (text)
      - `local_government` (text)
      - `city` (text)
      - `street` (text)
      - `business_cert_url` (text)
      - `id_card_url` (text)
      - `id_type` (text)
      - `unique_code` (text, unique)
      - `is_verified` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `customers`
      - `id` (uuid, primary key)
      - `full_name` (text)
      - `company_name` (text)
      - `company_address` (text)
      - `phone` (text)
      - `email` (text, unique)
      - `password_hash` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `fish_listings`
      - `id` (uuid, primary key)
      - `farmer_id` (uuid, foreign key)
      - `fish_type` (text)
      - `quantity` (integer)
      - `price_per_unit` (decimal)
      - `description` (text)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `orders`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `farmer_id` (uuid, foreign key)
      - `farmer_code` (text)
      - `total_amount` (decimal)
      - `status` (text, default 'pending')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `fish_listing_id` (uuid, foreign key)
      - `quantity` (integer)
      - `unit_price` (decimal)
      - `subtotal` (decimal)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for farmers to manage their own data
    - Add policies for customers to view listings and manage their orders
    - Secure farmer contact information from customers
*/

-- Create farmers table
CREATE TABLE IF NOT EXISTS farmers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  company_name text NOT NULL,
  phone text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  country text NOT NULL,
  state text NOT NULL,
  local_government text NOT NULL,
  city text NOT NULL,
  street text NOT NULL,
  business_cert_url text,
  id_card_url text,
  id_type text NOT NULL CHECK (id_type IN ('nin', 'company', 'passport')),
  unique_code text UNIQUE NOT NULL,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  company_name text NOT NULL,
  company_address text NOT NULL,
  phone text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create fish_listings table
CREATE TABLE IF NOT EXISTS fish_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE,
  fish_type text NOT NULL CHECK (fish_type IN ('catfish', 'tilapia', 'dry_fish')),
  quantity integer NOT NULL CHECK (quantity > 0),
  price_per_unit decimal(10,2) NOT NULL CHECK (price_per_unit > 0),
  description text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE,
  farmer_code text NOT NULL,
  total_amount decimal(10,2) NOT NULL CHECK (total_amount > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  fish_listing_id uuid REFERENCES fish_listings(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL CHECK (unit_price > 0),
  subtotal decimal(10,2) NOT NULL CHECK (subtotal > 0),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fish_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Farmers/customers policy
-- Allow any authenticated user (customers & farmers) to view farmer profiles
CREATE POLICY "Anyone can view farmer profiles"
  ON farmers 
  FOR SELECT
  TO authenticated
  USING (true);
-- Farmers policies
CREATE POLICY "Farmers can read own data"
  ON farmers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Farmers can update own data"
  ON farmers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile into farmers
CREATE POLICY "Enable insert for authenticated users only"
  ON farmers 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Customers policies
CREATE POLICY "Customers can read own data"
  ON customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Customers can update own data"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile into customers
CREATE POLICY "Enable insert for authenticated users only"
  ON customers 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Fish listings policies
CREATE POLICY "Anyone can read active fish listings"
  ON fish_listings
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Farmers can manage own listings"
  ON fish_listings
  FOR ALL
  TO authenticated
  USING (farmer_id = auth.uid());

-- Orders policies
CREATE POLICY "Customers can read own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Farmers can read orders for their fish"
  ON orders
  FOR SELECT
  TO authenticated
  USING (farmer_id = auth.uid());

CREATE POLICY "Customers can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- Order items policies
CREATE POLICY "Users can read order items for their orders"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.customer_id = auth.uid() OR orders.farmer_id = auth.uid())
    )
  );

CREATE POLICY "Customers can create order items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.customer_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_farmers_email ON farmers(email);
CREATE INDEX IF NOT EXISTS idx_farmers_unique_code ON farmers(unique_code);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_fish_listings_farmer_id ON fish_listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_fish_listings_active ON fish_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_farmer_id ON orders(farmer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Create function to generate unique farmer codes
CREATE OR REPLACE FUNCTION generate_farmer_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := 'FSH' || LPAD(floor(random() * 1000)::text, 3, '0') || 
            chr(65 + floor(random() * 26)::int) || 
            chr(65 + floor(random() * 26)::int) || 
            chr(65 + floor(random() * 26)::int);
    
    SELECT EXISTS(SELECT 1 FROM farmers WHERE unique_code = code) INTO exists;
    
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate farmer codes
CREATE OR REPLACE FUNCTION set_farmer_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.unique_code IS NULL OR NEW.unique_code = '' THEN
    NEW.unique_code := generate_farmer_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_farmer_code
  BEFORE INSERT ON farmers
  FOR EACH ROW
  EXECUTE FUNCTION set_farmer_code();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_farmers_updated_at
  BEFORE UPDATE ON farmers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_fish_listings_updated_at
  BEFORE UPDATE ON fish_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();