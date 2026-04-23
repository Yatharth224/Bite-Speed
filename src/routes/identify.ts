import { Router } from "express"
import { identifyUser } from "../controllers/identifyController"

const router = Router()

// any POST request to /identify goes to the identifyUser function
router.post("/identify", identifyUser)

export default router