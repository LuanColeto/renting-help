import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Apartment } from '@/types/apartment';

export function useApartments() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onSnapshot(
      collection(db, 'apartments'),
      (snapshot) => {
        if (!mounted) return;
        const apartmentsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Apartment[];
        setApartments(apartmentsList);
        setLoading(false);
      },
      (error) => {
        if (!mounted) return;
        console.error('Error fetching apartments:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const addApartment = async (apartment: Omit<Apartment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const cleanData = Object.fromEntries(
      Object.entries(apartment).filter(([_, value]) => value !== undefined)
    );
    await addDoc(collection(db, 'apartments'), {
      ...cleanData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  };

  const updateApartment = async (id: string, updates: Partial<Apartment>) => {
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    await updateDoc(doc(db, 'apartments', id), {
      ...cleanUpdates,
      updatedAt: Timestamp.now(),
    });
  };

  const deleteApartment = async (id: string) => {
    await deleteDoc(doc(db, 'apartments', id));
  };

  return { apartments, loading, addApartment, updateApartment, deleteApartment };
}
