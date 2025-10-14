import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Client, Project, User } from '../../../types';
import type { CreateRateData } from '../../../types/billing';

const rateFormSchema = z.object({
  entityType: z.enum(['global', 'user', 'project', 'client', 'role']),
  entityId: z.string().optional(),
  role: z.string().optional(),
  hourlyRate: z
    .number({ invalid_type_error: 'Hourly rate is required' })
    .min(0, 'Hourly rate cannot be negative')
    .max(1000, 'Hourly rate exceeds limit'),
  overtimeMultiplier: z
    .number({ invalid_type_error: 'Overtime multiplier is required' })
    .min(1, 'Overtime multiplier must be at least 1')
    .max(5, 'Overtime multiplier exceeds limit'),
  holidayMultiplier: z
    .number({ invalid_type_error: 'Holiday multiplier is required' })
    .min(1, 'Holiday multiplier must be at least 1')
    .max(5, 'Holiday multiplier exceeds limit'),
  weekendMultiplier: z
    .number({ invalid_type_error: 'Weekend multiplier is required' })
    .min(1, 'Weekend multiplier must be at least 1')
    .max(5, 'Weekend multiplier exceeds limit'),
  minimumIncrementMinutes: z
    .number({ invalid_type_error: 'Minimum increment is required' })
    .min(5, 'Minimum increment must be at least 5 minutes')
    .max(120, 'Minimum increment exceeds limit'),
  effectiveFrom: z.string().min(1, 'Effective from date is required'),
  effectiveUntil: z.string().optional()
}).superRefine((data, ctx) => {
  if (['user', 'project', 'client'].includes(data.entityType) && !data.entityId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['entityId'],
      message: 'Selection is required for this entity type'
    });
  }

  if (data.entityType === 'role' && !data.role) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['role'],
      message: 'Role is required for role-based rates'
    });
  }

  if (data.effectiveUntil && data.effectiveUntil < data.effectiveFrom) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['effectiveUntil'],
      message: 'Effective until must be after effective from'
    });
  }
});

export type RateFormValues = z.infer<typeof rateFormSchema>;

const roleOptions = [
  { id: 'super_admin', name: 'Super Admin' },
  { id: 'management', name: 'Management' },
  { id: 'manager', name: 'Manager' },
  { id: 'lead', name: 'Lead' },
  { id: 'employee', name: 'Employee' }
];

interface RateFormProps {
  users: User[];
  projects: Project[];
  clients: Client[];
  onSubmit: (payload: CreateRateData) => Promise<boolean>;
}

export function RateForm({ users, projects, clients, onSubmit }: RateFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<RateFormValues>({
    resolver: zodResolver(rateFormSchema),
    defaultValues: {
      entityType: 'global',
      hourlyRate: 100,
      overtimeMultiplier: 1.5,
      holidayMultiplier: 2,
      weekendMultiplier: 1.25,
      minimumIncrementMinutes: 15,
      effectiveFrom: new Date().toISOString().split('T')[0]
    }
  });

  const entityType = watch('entityType');

  const submit = async (values: RateFormValues) => {
    const payload: CreateRateData = {
      entity_type: values.entityType,
      hourly_rate: values.hourlyRate,
      overtime_multiplier: values.overtimeMultiplier,
      holiday_multiplier: values.holidayMultiplier,
      weekend_multiplier: values.weekendMultiplier,
      minimum_increment_minutes: values.minimumIncrementMinutes,
      effective_from: values.effectiveFrom,
      effective_until: values.effectiveUntil || undefined
    };

    if (values.entityType === 'role') {
      payload.role = values.role;
    } else if (values.entityType !== 'global') {
      payload.entity_id = values.entityId;
    }

    const success = await onSubmit(payload);
    if (success) {
      reset({
        entityType: values.entityType,
        entityId: undefined,
        role: undefined,
        hourlyRate: values.hourlyRate,
        overtimeMultiplier: values.overtimeMultiplier,
        holidayMultiplier: values.holidayMultiplier,
        weekendMultiplier: values.weekendMultiplier,
        minimumIncrementMinutes: values.minimumIncrementMinutes,
        effectiveFrom: values.effectiveFrom,
        effectiveUntil: undefined
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Scope
          </label>
          <select
            {...register('entityType')}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="global">Global (default)</option>
            <option value="user">Specific user</option>
            <option value="project">Specific project</option>
            <option value="client">Specific client</option>
            <option value="role">Role based</option>
          </select>
        </div>

        {['user', 'project', 'client'].includes(entityType) && (
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              {entityType === 'user' ? 'User' : entityType === 'project' ? 'Project' : 'Client'}
            </label>
            <select
              {...register('entityId')}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">Select...</option>
              {entityType === 'user' &&
                users.map((user) => (
                  <option key={user._id ?? user.id} value={user._id ?? user.id}>
                    {'full_name' in user && user.full_name
                      ? user.full_name
                      : `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email}
                  </option>
                ))}
              {entityType === 'project' &&
                projects.map((project) => (
                  <option key={project._id ?? project.id} value={project._id ?? project.id}>
                    {project.name}
                  </option>
                ))}
              {entityType === 'client' &&
                clients.map((client) => (
                  <option key={client._id ?? client.id} value={client._id ?? client.id}>
                    {client.name}
                  </option>
                ))}
            </select>
            {errors.entityId && (
              <p className="mt-1 text-xs text-red-600">{errors.entityId.message}</p>
            )}
          </div>
        )}

        {entityType === 'role' && (
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              Role
            </label>
            <select
              {...register('role')}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">Select role...</option>
              {roleOptions.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Hourly Rate (USD)
          </label>
          <input
            type="number"
            step="0.01"
            {...register('hourlyRate', { valueAsNumber: true })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          {errors.hourlyRate && (
            <p className="mt-1 text-xs text-red-600">{errors.hourlyRate.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Overtime Multiplier
          </label>
          <input
            type="number"
            step="0.05"
            {...register('overtimeMultiplier', { valueAsNumber: true })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          {errors.overtimeMultiplier && (
            <p className="mt-1 text-xs text-red-600">{errors.overtimeMultiplier.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Holiday Multiplier
          </label>
          <input
            type="number"
            step="0.05"
            {...register('holidayMultiplier', { valueAsNumber: true })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          {errors.holidayMultiplier && (
            <p className="mt-1 text-xs text-red-600">{errors.holidayMultiplier.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Weekend Multiplier
          </label>
          <input
            type="number"
            step="0.05"
            {...register('weekendMultiplier', { valueAsNumber: true })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          {errors.weekendMultiplier && (
            <p className="mt-1 text-xs text-red-600">{errors.weekendMultiplier.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Minimum Increment (minutes)
          </label>
          <input
            type="number"
            {...register('minimumIncrementMinutes', { valueAsNumber: true })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          {errors.minimumIncrementMinutes && (
            <p className="mt-1 text-xs text-red-600">
              {errors.minimumIncrementMinutes.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Effective From
          </label>
          <input
            type="date"
            {...register('effectiveFrom')}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          {errors.effectiveFrom && (
            <p className="mt-1 text-xs text-red-600">{errors.effectiveFrom.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Effective Until (optional)
          </label>
          <input
            type="date"
            {...register('effectiveUntil')}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          {errors.effectiveUntil && (
            <p className="mt-1 text-xs text-red-600">{errors.effectiveUntil.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Rate'}
        </button>
      </div>
    </form>
  );
}
