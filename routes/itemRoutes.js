import express from 'express';
import { createItem, getItems, getItemById } from '../controllers/itemController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

const handleImageUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Image upload error:', err);
      return res.status(400).json({
        message: 'Image upload failed. Check your Cloudinary credentials in server/.env or submit without an image.',
      });
    }
    next();
  });
};

router.get('/', getItems);
router.get('/:id', getItemById);
router.post('/', protect, handleImageUpload, createItem);

export default router;