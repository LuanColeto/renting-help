export interface Apartment {
  id?: string;
  title: string;
  address: string;
  rent: number;
  condo: number;
  iptu: number;
  insurance?: number;
  status: 'doubt' | 'visited' | 'interested' | 'discarded';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ApartmentStatus = Apartment['status'];
