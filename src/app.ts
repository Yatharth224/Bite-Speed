import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import identifyRouter from "./routes/identify"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use("/", identifyRouter)

app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

const PORT = (process as any).env.PORT || 3000

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
})

export default app