import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { ServiceProvider } from './ui/context/ServiceContext';
import { DiagramService } from './diagram/application/DiagramService';
import { ExportService } from './export/application/ExportService';
import { App } from './ui/components/App/App';

const services = {
  diagramService: new DiagramService(),
  exportService: new ExportService(),
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ServiceProvider services={services}>
      <App />
    </ServiceProvider>
  </StrictMode>,
);
