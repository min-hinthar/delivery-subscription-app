export type AlaCarteItem = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  category: string | null;
  is_active: boolean;
  min_order_quantity: number;
  available_day?: string;
  available_quantity?: number;
  image_url?: string | null;
};

export type AlaCarteOrderItem = {
  item_id: string;
  quantity: number;
  unit_price_cents: number;
};

export type AlaCarteOrder = {
  id: string;
  user_id: string;
  week_of: string;
  order_type: 'a_la_carte';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_cents: number;
  items: AlaCarteOrderItem[];
  created_at: string;
  updated_at: string;
};

export type CartItem = {
  item: AlaCarteItem;
  quantity: number;
};
