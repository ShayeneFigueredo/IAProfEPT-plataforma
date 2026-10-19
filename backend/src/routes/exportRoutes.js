import { Router } from 'express';
import { exportController } from '../controllers/exportController.js';

const exportRoutes = Router();

exportRoutes.post('/', exportController.exportDocument);

export default exportRoutes;
