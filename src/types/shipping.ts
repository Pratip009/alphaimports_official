// ─── Shared Shipping Types ────────────────────────────────────────────────────

export interface ShippingAddress {
  fullName?:   string;
  company?:    string;
  street1:     string;
  street2?:    string;
  city:        string;
  state:       string;        // 2-letter US state code
  postalCode:  string;
  country:     string;        // "US"
  phone?:      string;
  email?:      string;
  residential?: boolean;   // hint for ShipEngine residential surcharge detection
}

export interface PackageDimensions {
  weightLbs:        number;   // total weight in pounds
  lengthIn:         number;
  widthIn:          number;
  heightIn:         number;
  declaredValueUsd?: number;
  description?:     string;
}

export interface ShippingRate {
  carrier:           string;  // e.g. "UPS", "USPS", "FedEx"
  carrierId:         string;  // ShipEngine internal carrier ID
  service:           string;  // e.g. "UPS Ground", "Priority Mail"
  serviceCode:       string;  // ShipEngine service code
  rateId:            string;  // ShipEngine rate ID — pass to purchaseLabelFromRate
  rate:              number;  // total cost in USD
  currency:          'USD';
  estimatedDays:     number | null;
  estimatedDelivery: string | null;
  guaranteed:        boolean;
  negotiatedRate:    boolean;
}

export interface TrackingEvent {
  timestamp:   string;
  description: string;
  location:    string;
  signedBy?:   string;
}

export interface TrackingInfo {
  carrier:           string;
  trackingNumber:    string;
  status:            string;
  currentLocation:   string;
  lastUpdate:        string;
  estimatedDelivery: string | null;
  events:            TrackingEvent[];
  deliveredAt?:      string;
  signedBy?:         string;
}