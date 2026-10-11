export type FulfilmentPreference = 'COUNTER_PICKUP' | 'SPECIAL_ENQUIRY';

export interface CustomerDetails {
  fullName: string;
  mobileNumber: string;
  fulfilmentPreference: FulfilmentPreference;
  ageConfirmed: boolean;
  notes: string;
}

export interface FormErrors {
  fullName?: string;
  mobileNumber?: string;
  ageConfirmed?: string;
}
