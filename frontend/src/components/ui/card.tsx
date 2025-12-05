'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'glass';
  hover?: boolean;
}

export function Card({ 
  children, 
  variant = 'default', 
  hover = false,
  className, 
  ...props 
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-300',
        variant === 'default' && 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800',
        variant === 'gradient' && 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-gray-100 dark:border-gray-800',
        variant === 'glass' && 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-white/20 dark:border-gray-800/50',
        hover && 'hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 hover:-translate-y-1 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('p-6 pb-0', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900 dark:text-white', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('mt-1 text-sm text-gray-500 dark:text-gray-400', className)}>
      {children}
    </p>
  );
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl border-t border-gray-100 dark:border-gray-800', className)}>
      {children}
    </div>
  );
}

// Stat Card for dashboard
interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  iconBg?: string;
}

export function StatCard({ title, value, change, changeType = 'neutral', icon, iconBg }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change && (
            <p
              className={cn(
                'mt-2 text-sm font-medium',
                changeType === 'positive' && 'text-emerald-600',
                changeType === 'negative' && 'text-red-600',
                changeType === 'neutral' && 'text-gray-500'
              )}
            >
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'p-3 rounded-xl',
              iconBg || 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

