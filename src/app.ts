import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import identifyRouter from "./routes/identify"

// reads the .env file, without this process.env.PORT would be undefined
dotenv.config()

const app = express()

// so that frontend or postman can hit this api without getting blocked
app.use(cors())

// req.body wont work without this
app.use(express.json())

// hooking up our identify route
app.use("/", identifyRouter)

// quick way to check if server is alive
app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

const PORT = (process as any).env.PORT || 3000

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
})

export default app