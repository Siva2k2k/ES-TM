import React from 'react';
import { HolidayManagement } from '../../components/settings/HolidayManagement';

export const HolidayManagementPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <HolidayManagement />
    </div>
  );
};

export default HolidayManagementPage;
