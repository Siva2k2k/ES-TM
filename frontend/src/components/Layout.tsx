import React from 'react';
import { themeClasses, cn } from '../contexts/theme';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  className,
  containerClassName,
}) => {
  return (
    <div className={cn(themeClasses.page, className)}>
      <div className={cn('container mx-auto px-4 py-6', containerClassName)}>
        {(title || subtitle || actions) && (
          <div className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                {title && (
                  <h1 className={cn('text-3xl font-bold', themeClasses.heading)}>
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className={cn('mt-1', themeClasses.body)}>
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex items-center gap-3">
                  {actions}
                </div>
              )}
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

interface SectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  children,
  title,
  subtitle,
  actions,
  className,
}) => {
  return (
    <section className={cn('space-y-4', className)}>
      {(title || subtitle || actions) && (
        <div className="flex items-start justify-between">
          <div>
            {title && (
              <h2 className={cn('text-xl font-semibold', themeClasses.heading)}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className={cn('mt-1 text-sm', themeClasses.muted)}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn(themeClasses.card, 'p-12 text-center', className)}>
      {icon && (
        <div className="mx-auto mb-4 text-4xl text-gray-400 dark:text-gray-600">
          {icon}
        </div>
      )}
      <h3 className={cn('text-lg font-medium mb-2', themeClasses.heading)}>
        {title}
      </h3>
      {description && (
        <p className={cn('text-sm mb-4', themeClasses.muted)}>
          {description}
        </p>
      )}
      {action && action}
    </div>
  );
};