import React, { createContext, useState } from 'react';

export const ConverterContext = createContext();

export const ConverterProvider = ({ children }) => {
  const [activeBuffer, setActiveBuffer] = useState(null);

  // Set selected Pickup/Bilty record to import into another document
  const copyToBuffer = (sourceType, data) => {
    setActiveBuffer({ sourceType, data });
  };

  const clearBuffer = () => setActiveBuffer(null);

  return (
    <ConverterContext.Provider value={{ activeBuffer, copyToBuffer, clearBuffer }}>
      {children}
    </ConverterContext.Provider>
  );
};