import { Router } from "express"
import { identifyUser } from "../controllers/identifyController"

const router = Router()

router.post("/identify", identifyUser)

export default router