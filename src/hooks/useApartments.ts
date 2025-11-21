import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Apartment } from '@/types/apartment';

export function useApartments() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'apartments'), (snapshot) => {
      const apartmentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Apartment[];
      setApartments(apartmentsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addApartment = async (apartment: Omit<Apartment, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addDoc(collection(db, 'apartments'), {
      ...apartment,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  };

  const updateApartment = async (id: string, updates: Partial<Apartment>) => {
    await updateDoc(doc(db, 'apartments', id), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  };

  const deleteApartment = async (id: string) => {
    await deleteDoc(doc(db, 'apartments', id));
  };

  return { apartments, loading, addApartment, updateApartment, deleteApartment };
}
