import { Application } from 'express';
import examplesRouter from './api/controllers/examples/router';
import carroRouter from './api/controllers/carros/router';
import clienteRouter from './api/controllers/clientes/router';

export default function routes(app: Application): void {
  app.use('/api/v1/examples', examplesRouter);
  app.use('/api/v1/carros', carroRouter);
  app.use('/api/v1/clientes', clienteRouter);
}
