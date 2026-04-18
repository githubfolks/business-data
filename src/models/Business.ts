export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface IPhoneNumber {
  type: 'phone' | 'mobile' | 'fax';
  number: string;
}

export interface IOpeningHours {
  day_of_week: number;
  open: string;
  close: string;
}

export interface IBusinessDocument {
  id: string;
  external_id: string;
  provider: 'google_places' | 'yelp' | 'custom';
  name: string;
  description?: string | null;
  category: string;
  subcategories?: string[];
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone_numbers?: string[];
  website?: string | null;
  email?: string | null;
  rating?: number | null;
  review_count?: number | null;
  opening_hours?: any | null;
  attributes?: any | null;
  verified: boolean;
  verification_date?: Date | null;
  status: 'active' | 'inactive' | 'closed';
  source_data?: any | null;
  created_at: Date;
  updated_at: Date;
  last_synced?: Date | null;
  search_text?: string | null;
}

