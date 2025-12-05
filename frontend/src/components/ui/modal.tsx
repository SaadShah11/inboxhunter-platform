'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Modal({ open, onOpenChange, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95vw] max-w-6xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalContent({ children, className }: ModalContentProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[85vh] overflow-hidden',
        className
      )}
    >
      {children}
    </div>
  );
}

interface ModalHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export function ModalHeader({ children, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-2 -mr-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      )}
    </div>
  );
}

export function ModalTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Dialog.Title className={cn('text-xl font-semibold text-gray-900 dark:text-white', className)}>
      {children}
    </Dialog.Title>
  );
}

export function ModalDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Dialog.Description className={cn('mt-1 text-sm text-gray-500 dark:text-gray-400', className)}>
      {children}
    </Dialog.Description>
  );
}

export function ModalBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-6 flex-1 overflow-y-auto', className)}>{children}</div>;
}

export function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 p-6 pt-0 flex-shrink-0',
        className
      )}
    >
      {children}
    </div>
  );
}
