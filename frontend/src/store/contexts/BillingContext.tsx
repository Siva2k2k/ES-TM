import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Project, User } from '../../types';
import { ProjectService } from '../../services/ProjectService';
import { UserService } from '../../services/UserService';
import { showError } from '../../utils/toast';
import type { Client } from '../../types';

type BillingPeriod = 'weekly' | 'monthly';
type BillingFilterType = 'project' | 'employee';

interface DateRange {
  start: string;
  end: string;
}

interface BillingContextValue {
  period: BillingPeriod;
  setPeriod: (period: BillingPeriod) => void;
  filterType: BillingFilterType;
  setFilterType: (type: BillingFilterType) => void;
  selectedProjectId?: string;
  setSelectedProjectId: (projectId?: string) => void;
  selectedUserId?: string;
  setSelectedUserId: (userId?: string) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  refreshToken: number;
  triggerRefresh: () => void;
  projects: Project[];
  users: User[];
  clients: Client[];
  loadingOptions: boolean;
}

const BillingContext = createContext<BillingContextValue | undefined>(undefined);

const getCurrentWeekRange = (): DateRange => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as start
  const startDate = new Date(now);
  startDate.setDate(now.getDate() + startOffset);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const toIso = (date: Date) => date.toISOString().split('T')[0];
  return {
    start: toIso(startDate),
    end: toIso(endDate)
  };
};

interface BillingProviderProps {
  children: React.ReactNode;
}

export function BillingProvider({ children }: BillingProviderProps) {
  const [period, setPeriod] = useState<BillingPeriod>('weekly');
  const [filterType, setFilterType] = useState<BillingFilterType>('project');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<DateRange>(() => getCurrentWeekRange());
  const [refreshToken, setRefreshToken] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [projectResult, userResult, clientResult] = await Promise.all([
          ProjectService.getAllProjects(),
          UserService.getAllUsers(),
          ProjectService.getAllClients()
        ]);

        if (isMounted) {
          if (projectResult.error) {
            showError(projectResult.error);
          } else {
            setProjects(projectResult.projects);
          }

          if (userResult.error) {
            showError(userResult.error);
          } else {
            setUsers(userResult.users);
          }

          if (clientResult.error) {
            showError(clientResult.error);
          } else {
            setClients(clientResult.clients);
          }
        }
      } catch (error) {
        console.error('Failed to load billing filters:', error);
        if (isMounted) {
          showError('Failed to load billing options');
        }
      } finally {
        if (isMounted) {
          setLoadingOptions(false);
        }
      }
    };

    loadOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  const value = useMemo<BillingContextValue>(() => ({
    period,
    setPeriod,
    filterType,
    setFilterType,
    selectedProjectId,
    setSelectedProjectId,
    selectedUserId,
    setSelectedUserId,
    dateRange,
    setDateRange,
    refreshToken,
    triggerRefresh,
    projects,
    users,
    clients,
    loadingOptions
  }), [
    period,
    filterType,
    selectedProjectId,
    selectedUserId,
    dateRange,
    refreshToken,
    triggerRefresh,
    projects,
    users,
    clients,
    loadingOptions
  ]);

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
}

export function useBillingContext(): BillingContextValue {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBillingContext must be used within a BillingProvider');
  }
  return context;
}
