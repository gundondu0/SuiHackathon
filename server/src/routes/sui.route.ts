
import  { Router } from 'express';
import suiController from '@controllers/sui/sui.controller';
const router = Router();


router.post("/execute-block",suiController.postExecuteBlock)

export default router