import { IBusinessDocument } from '../models/Business';

export class BusinessNormalizer {
  /**
   * Normalize Google Places API response to internal format
   */
  static normalizeGooglePlace(place: any): Partial<IBusinessDocument> {
    // Extract address components
    const street = place.formatted_address?.split(',')[0] || '';
    const components = place.address_components || [];
    
    const city = 
      components.find((c: any) => c.types.includes('locality'))?.long_name ||
      components.find((c: any) => c.types.includes('postal_town'))?.long_name ||
      components.find((c: any) => c.types.includes('sublocality_level_1'))?.long_name ||
      components.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name ||
      (place.formatted_address ? place.formatted_address.split(',')[place.formatted_address.split(',').length - 3]?.trim() : '');

    const state = components.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name;
    const postal_code = components.find((c: any) => c.types.includes('postal_code'))?.long_name;
    const country = 
      components.find((c: any) => c.types.includes('country'))?.long_name ||
      (place.formatted_address ? place.formatted_address.split(',')[place.formatted_address.split(',').length - 1]?.trim() : '');

    const latitude = place.geometry?.location?.lat;
    const longitude = place.geometry?.location?.lng;

    // Store phone numbers as strings (for PostgreSQL)
    const phone_numbers: string[] = [];
    if (place.formatted_phone_number) {
      phone_numbers.push(place.formatted_phone_number);
    }
    if (place.international_phone_number) {
      phone_numbers.push(place.international_phone_number);
    }

    const openingHours = place.opening_hours?.weekday_text?.map((text: string, index: number) => ({
      day_of_week: index,
      open: this.extractTime(text, true),
      close: this.extractTime(text, false),
    })) || [];

    const searchText = [
      place.name,
      place.formatted_address,
      place.types?.join(' '),
      place.business_status,
    ]
      .filter(Boolean)
      .join(' ');

    return {
      external_id: `google_${place.place_id}`,
      provider: 'google_places',
      name: place.name,
      description: place.editorial_summary?.overview,
      category: this.normalizeCategory(place.types?.[0]),
      subcategories: place.types?.slice(1).map((t: string) => this.normalizeCategory(t)),
      street,
      city,
      state,
      postal_code,
      country,
      latitude,
      longitude,
      phone_numbers,
      website: place.website,
      rating: place.rating,
      review_count: place.user_ratings_total,
      opening_hours: openingHours,
      verified: place.verified_operator === true,
      status: place.business_status === 'OPERATIONAL' ? 'active' : 'inactive',
      source_data: place,
      search_text: searchText,
    };
  }

  /**
   * Universal normalizer that detects format
   */
  static normalizeAnyGooglePlace(place: any): Partial<IBusinessDocument> {
    if (place.id && place.displayName) {
      return this.normalizeGooglePlaceNew(place);
    }
    return this.normalizeGooglePlace(place);
  }

  /**
   * Normalize Google Places API (NEW) response
   */
  static normalizeGooglePlaceNew(place: any): Partial<IBusinessDocument> {
    const components = place.addressComponents || [];
    
    // Safety check for empty results
    if (!place) return {};

    const city = 
      components.find((c: any) => c.types.includes('locality'))?.longText ||
      components.find((c: any) => c.types.includes('postal_town'))?.longText ||
      components.find((c: any) => c.types.includes('sublocality_level_1'))?.longText;

    const state = components.find((c: any) => c.types.includes('administrative_area_level_1'))?.shortText;
    const postal_code = components.find((c: any) => c.types.includes('postal_code'))?.longText;
    const country = components.find((c: any) => c.types.includes('country'))?.shortText;

    const phone_numbers: string[] = [];
    if (place.internationalPhoneNumber) phone_numbers.push(place.internationalPhoneNumber);
    if (place.nationalPhoneNumber) phone_numbers.push(place.nationalPhoneNumber);

    return {
      external_id: `google_${place.id}`,
      provider: 'google_places',
      name: place.displayName?.text || 'Unknown',
      category: this.normalizeCategory(place.types?.[0]),
      subcategories: place.types?.slice(1).map((t: string) => this.normalizeCategory(t)),
      street: place.formattedAddress?.split(',')[0] || '',
      city: city || '',
      state: state || '',
      postal_code: postal_code || '',
      country: country || '',
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
      phone_numbers,
      website: place.websiteUri,
      rating: place.rating,
      review_count: place.userRatingCount,
      status: place.businessStatus === 'OPERATIONAL' ? 'active' : 'inactive',
      verified: true,
      source_data: place,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  /**
   * Normalize Yelp API response to internal format
   */
  static normalizeYelpBusiness(business: any): Partial<IBusinessDocument> {
    // Store phone numbers as strings (for PostgreSQL)
    const phone_numbers: string[] = [];
    if (business.phone) {
      phone_numbers.push(business.phone);
    }

    const searchText = [
      business.name,
      business.location?.address1,
      business.location?.city,
      business.categories?.map((c: any) => c.title).join(' '),
    ]
      .filter(Boolean)
      .join(' ');

    return {
      external_id: `yelp_${business.id}`,
      provider: 'yelp',
      name: business.name,
      category: business.categories?.[0]?.title || 'Other',
      subcategories: business.categories?.slice(1).map((c: any) => c.title),
      street: business.location?.address1,
      city: business.location?.city,
      state: business.location?.state,
      postal_code: business.location?.zip_code,
      country: business.location?.country,
      latitude: business.coordinates?.latitude,
      longitude: business.coordinates?.longitude,
      phone_numbers,
      website: business.url,
      rating: business.rating,
      review_count: business.review_count,
      verified: true,
      status: business.is_closed ? 'closed' : 'active',
      attributes: {
        yelp_rating: business.rating,
        yelp_url: business.url,
        image_url: business.image_url,
        transactions: business.transactions,
        price: business.price,
        is_claimed: business.is_claimed,
      },
      source_data: business,
      search_text: searchText,
    };
  }

  /**
   * Normalize category names to standardized format
   */
  private static normalizeCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      'point_of_interest': 'Point of Interest',
      'establishment': 'Business',
      'restaurant': 'Restaurant',
      'cafe': 'Cafe',
      'bakery': 'Bakery',
      'bar': 'Bar',
      'night_club': 'Night Club',
      'beauty_salon': 'Beauty & Wellness',
      'hair_care': 'Beauty & Wellness',
      'gym': 'Fitness',
      'health': 'Healthcare',
      'hospital': 'Healthcare',
      'doctor': 'Healthcare',
      'pharmacy': 'Healthcare',
      'grocery_or_supermarket': 'Retail',
      'shopping_mall': 'Retail',
      'store': 'Retail',
      'liquor_store': 'Retail',
      'park': 'Recreation',
      'museum': 'Entertainment',
      'movie_theater': 'Entertainment',
      'lodging': 'Hotel & Travel',
      'hotel': 'Hotel & Travel',
      'bank': 'Finance',
      'atm': 'Finance',
      'bus_station': 'Transportation',
      'taxi_stand': 'Transportation',
    };

    return categoryMap[category] || this.titleCase(category);
  }

  /**
   * Extract time from opening hours text
   */
  private static extractTime(text: string, isOpen: boolean): string {
    // Expected format: "Monday: 9:00 AM – 5:00 PM"
    const parts = text.split(':');
    if (parts.length < 2) return '00:00';

    const times = parts[1].split('–');
    if (times.length < 2) return '00:00';

    const timeStr = isOpen ? times[0].trim() : times[1].trim();
    return this.convertTo24Hour(timeStr);
  }

  /**
   * Convert 12-hour to 24-hour format
   */
  private static convertTo24Hour(time12: string): string {
    const match = time12.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return '00:00';

    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const meridiem = match[3]?.toUpperCase();

    if (meridiem === 'PM' && hours !== 12) {
      hours += 12;
    } else if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  /**
   * Title case conversion
   */
  private static titleCase(str: string): string {
    if (!str) return 'Uncategorized';
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
