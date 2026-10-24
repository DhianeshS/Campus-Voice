import { Router } from 'express';
import { getMe, updateProfile } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authLimiter);
router.use(requireAuth);

router.get('/me', getMe);
router.put('/profile', updateProfile);

export default router;
