import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { reposRouter } from "./routes/repos.js";
import { agentRouter } from "./routes/agent.js";
import { kdbRouter } from "./routes/kdb.js";
import { adminRouter } from "./routes/admin.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.use("/api/repos", reposRouter);
app.use("/api/agent", agentRouter);
app.use("/api/kdb", kdbRouter);
app.use("/api/admin", adminRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Web-Spec backend running on http://localhost:${PORT}`);
});
