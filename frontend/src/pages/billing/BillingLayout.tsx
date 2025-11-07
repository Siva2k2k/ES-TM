import React from 'react';
import { Outlet } from 'react-router-dom';
import { BillingProvider } from '../../store/contexts/BillingContext';

export function BillingLayout() {
  return (
    <BillingProvider>
      <Outlet />
    </BillingProvider>
  );
}

export default BillingLayout;
