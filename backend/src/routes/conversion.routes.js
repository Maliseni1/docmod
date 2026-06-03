import { Router } from 'express';
import { ConversionController } from '../controllers/ConversionController.js';
import { upload } from '../middleware/upload.js';

const router = Router();
const controller = new ConversionController();

router.post('/convert', upload.single('file'), controller.convert);
router.get('/download', controller.download);
router.get('/formats', controller.getSupportedFormats);
router.get('/formats/:category', controller.getFormatsByCategory);
router.get('/category', controller.getFileCategory);
router.get('/engines', controller.getEngines);

export default router;
