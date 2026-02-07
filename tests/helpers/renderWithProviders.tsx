import { render, type RenderOptions } from '@testing-library/react'
import { ServiceProvider } from '../../src/ui/context/ServiceContext'
import { createMockServices } from './mockServices'
import type { Services } from '../../src/ui/context/services'

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  services?: Partial<Services>
}

export function renderWithProviders(
  ui: React.ReactElement,
  { services, ...options }: ExtendedRenderOptions = {}
) {
  const mockServices = createMockServices(services)

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <ServiceProvider services={mockServices}>{children}</ServiceProvider>
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    services: mockServices,
  }
}
