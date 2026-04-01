import { Router } from 'express';
import multer from 'multer';
import { visualSearch } from '../controllers/visualSearch.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/catalog/visual-search
router.post('/visual-search', upload.single('image'), visualSearch);

export default router;
