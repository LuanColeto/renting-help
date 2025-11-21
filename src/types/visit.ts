export interface Visit {
  id?: string;
  apartmentId: string;
  apartmentTitle: string;
  apartmentAddress: string;
  apartmentNeighborhood: string;
  date: Date;
  time: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
