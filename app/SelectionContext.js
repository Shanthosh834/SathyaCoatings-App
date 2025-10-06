// SelectionContext.js
import  { createContext, useState, useContext } from 'react';

const SelectionContext = createContext();

export const SelectionProvider = ({ children }) => {
  const [selection, setSelection] = useState(null);
  
  return (
    <SelectionContext.Provider value={{ selection, setSelection }}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = () => useContext(SelectionContext);