import { ServiceContext, type Services } from './services';

export function ServiceProvider({
  children,
  services,
}: {
  children: React.ReactNode;
  services: Services;
}) {
  return <ServiceContext.Provider value={services}>{children}</ServiceContext.Provider>;
}
