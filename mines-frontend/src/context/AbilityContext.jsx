'use client';

import { createContext, useEffect } from 'react';
import { createContextualCan } from '@casl/react';
import { ability, defineAbilitiesFor } from '../utils/ability';
import Cookies from 'js-cookie';

export const AbilityContext = createContext();
export const Can = createContextualCan(AbilityContext.Consumer);

export const AbilityProvider = ({ children }) => {
  useEffect(() => {
    // Sync ability with cookies on mount (e.g., page refresh)
    const storedPermissions = Cookies.get('permissions');
    const storedRole = Cookies.get('role');
    if (storedPermissions || storedRole) {
      try {
        const permissions = storedPermissions ? JSON.parse(storedPermissions) : [];
        const role = storedRole || '';
        ability.update(defineAbilitiesFor(permissions, role).rules);
      } catch (e) {
        console.error('Failed to parse permissions cookie', e);
      }
    }
  }, []);

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
};
