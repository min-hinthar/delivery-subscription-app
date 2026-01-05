export type MenuTheme = "traditional" | "street_food" | "regional" | "fusion" | "vegetarian";

export type WeeklyMenuStatus = "draft" | "published" | "closed" | "completed" | "archived";

export type WeeklyOrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type DeliveryWindow = "8 AM - 12 PM" | "12 PM - 4 PM" | "4 PM - 8 PM";

export interface Dish {
  id: string;
  name: string;
  name_my?: string | null;
  description?: string | null;
  description_my?: string | null;
  tags?: string[] | null;
  image_url?: string | null;
  price_cents?: number | null;
}

export interface MenuTemplate {
  id: string;
  name: string;
  name_my?: string | null;
  description?: string | null;
  description_my?: string | null;
  theme?: MenuTheme | null;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateDish {
  id: string;
  template_id: string;
  dish_id: string;
  day_of_week: number;
  meal_position: number;
  created_at: string;
  dish?: Dish | null;
}

export interface WeeklyMenu {
  id: string;
  template_id?: string | null;
  week_start_date: string | null;
  week_number: number | null;
  order_deadline: string | null;
  delivery_date: string | null;
  status: WeeklyMenuStatus;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  template?: MenuTemplate | null;
  items?: WeeklyMenuItem[];
}

export interface WeeklyMenuItem {
  id: string;
  weekly_menu_id: string;
  dish_id?: string | null;
  day_of_week: number | null;
  meal_position: number | null;
  is_available: boolean;
  max_portions?: number | null;
  current_orders: number;
  created_at: string;
  dish?: Dish | null;
}

export interface MealPackage {
  id: string;
  name: string;
  name_my?: string | null;
  description: string;
  description_my?: string | null;
  dishes_per_day: number;
  total_dishes: number;
  price_cents: number;
  is_active: boolean;
  display_order: number;
  badge_text?: string | null;
  badge_text_my?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyOrder {
  id: string;
  weekly_menu_id: string;
  customer_id: string;
  package_id: string;
  total_amount_cents: number;
  status: WeeklyOrderStatus;
  delivery_address_id?: string | null;
  delivery_instructions?: string | null;
  delivery_window?: DeliveryWindow | null;
  driver_id?: string | null;
  assigned_at?: string | null;
  stripe_payment_intent_id?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at?: string | null;
  delivered_at?: string | null;
  weekly_menu?: WeeklyMenu | null;
  package?: MealPackage | null;
  customer?: Profile | null;
  driver?: Profile | null;
  delivery_address?: Address | null;
}

export interface Profile {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  is_admin?: boolean | null;
}

export interface Address {
  id: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country?: string | null;
  instructions?: string | null;
  is_primary?: boolean | null;
}

export interface DayMenu {
  dayOfWeek: number;
  dayName: string;
  date: string;
  dishes: (WeeklyMenuItem & { dish: Dish })[];
}

export interface WeeklyOrderSummary {
  week_start_date: string;
  delivery_date: string;
  total_orders: number;
  total_revenue_cents: number;
  orders_by_package: {
    package_name: string;
    count: number;
    revenue_cents: number;
  }[];
  orders_by_window: {
    window: DeliveryWindow;
    count: number;
  }[];
}
