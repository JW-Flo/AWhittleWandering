/* eslint-disable no-console */
import express from "express";
import { execa } from "execa";

const app = express();
app.use(express.json({ limit: "1mb" }));

// POST /run_unit  { }
app.post("/run_unit", async (_req, res) => {
  try {
    const subprocess = execa("npx", ["vitest", "--reporter", "json"], {
      stdio: "pipe",
    });
    const { stdout } = await subprocess;
    return res.json({ status: "success", report: JSON.parse(stdout) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
});

// Health
app.get("/health", (_, res) => res.sendStatus(200));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`test-runner-server listening on ${PORT}`));
