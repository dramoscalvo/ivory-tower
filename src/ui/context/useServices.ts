import { useContext } from 'react';
import { ServiceContext, type Services } from './services';

export function useServices(): Services {
  const ctx = useContext(ServiceContext);
  if (!ctx) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return ctx;
}
