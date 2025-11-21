export interface Apartment {
  id?: string;
  title: string;
  address: string;
  neighborhood: string;
  rent: number;
  condo: number;
  iptu: number;
  insurance?: number;
  visited: boolean;
  discarded: boolean;
  notes?: string;
  images?: string[];
  url?: string;
  createdAt: Date;
  updatedAt: Date;
}
