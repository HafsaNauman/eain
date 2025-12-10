// // routes/upload.routes.js
// import express from 'express';
// import multer from 'multer';
// import { uploadVendorImage } from '../controllers/upload.controller.js';

// const upload = multer({ dest: 'uploads/' });
// const router = express.Router();

// // POST /api/upload/vendor-image - Upload vendor image
// router.post('/vendor-image', upload.single('image'), uploadVendorImage);

// export default router;


import express from 'express';
import multer from 'multer';
import { uploadVendorImage, uploadProductImage } from '../controllers/upload.controller.js';
import { verifyJWT } from '../middlewares/authJwt.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Vendor image upload
router.post('/vendor-image', verifyJWT, upload.single('image'), uploadVendorImage);

// Product image upload
router.post('/product-image', verifyJWT, upload.single('image'), uploadProductImage);

export default router;
