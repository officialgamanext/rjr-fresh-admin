import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [selectedLocation, setSelectedLocation] = useState(localStorage.getItem('selectedLocation') || 'all');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'locations'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const locationList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLocations(locationList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const changeLocation = (locationId) => {
    setSelectedLocation(locationId);
    localStorage.setItem('selectedLocation', locationId);
  };

  const addLocation = async (locationName) => {
    try {
      await addDoc(collection(db, 'locations'), {
        name: locationName,
        createdAt: new Date()
      });
    } catch (error) {
      console.error("Error adding location: ", error);
      throw error;
    }
  };

  const value = {
    selectedLocation,
    locations,
    loading,
    changeLocation,
    addLocation
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
