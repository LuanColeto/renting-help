import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Visit } from '@/types/visit';

export function useVisits() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const q = query(collection(db, 'visits'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!mounted) return;
        const visitsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Visit[];
        setVisits(visitsList);
        setLoading(false);
      },
      (error) => {
        if (!mounted) return;
        console.error('Error fetching visits:', error);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const addVisit = async (visit: Omit<Visit, 'id' | 'createdAt' | 'updatedAt'>) => {
    const cleanData = Object.fromEntries(
      Object.entries(visit).filter(([_, value]) => value !== undefined)
    );
    await addDoc(collection(db, 'visits'), {
      ...cleanData,
      date: Timestamp.fromDate(visit.date),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  };

  const updateVisit = async (id: string, updates: Partial<Visit>) => {
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    if (cleanUpdates.date && cleanUpdates.date instanceof Date) {
      cleanUpdates.date = Timestamp.fromDate(cleanUpdates.date as Date) as any;
    }
    await updateDoc(doc(db, 'visits', id), {
      ...cleanUpdates,
      updatedAt: Timestamp.now(),
    });
  };

  const deleteVisit = async (id: string) => {
    await deleteDoc(doc(db, 'visits', id));
  };

  return { visits, loading, addVisit, updateVisit, deleteVisit };
}
