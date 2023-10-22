
import  { Router } from 'express';
import zksaltController from '@controllers/zksalt/zksalt.controller';
const router = Router();


router.post("/generate",zksaltController.postGenerateZkSalt)
router.post("/proof",zksaltController.postZkProof)

export default router