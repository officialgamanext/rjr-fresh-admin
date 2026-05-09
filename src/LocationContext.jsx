import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [selectedLocation, setSelectedLocation] = useState({ id: 'all', name: 'All Locations' });
  const [locations, setLocations] = useState([]);

  const fetchLocations = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "locations"));
      const locs = [{ id: 'all', name: 'All Locations' }];
      querySnapshot.forEach((doc) => {
        locs.push({ id: doc.id, ...doc.data() });
      });
      setLocations(locs);
    } catch (error) {
      console.error("Error fetching locations for context:", error);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  return (
    <LocationContext.Provider value={{ selectedLocation, setSelectedLocation, locations, fetchLocations }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
