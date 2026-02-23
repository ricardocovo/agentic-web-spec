import { Router, Request, Response } from "express";

export const kdbRouter = Router();

// GET /api/kdb/spaces
kdbRouter.get("/spaces", async (req: Request, res: Response) => {
  // Extract Authorization header from the incoming request
  const authHeader = req.headers.authorization;

  // Validate Authorization header is present
  if (!authHeader) {
    res.status(400).json({ error: "Authorization header is required" });
    return;
  }

  try {
    // Call GitHub API server-side with the PAT and required headers
    const response = await fetch("https://api.github.com/user/copilot/spaces", {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    // Parse the response body
    const data = await response.json();

    // Return GitHub's response with the same status code
    res.status(response.status).json(data);
  } catch (error: unknown) {
    // Handle network errors or fetch failures
    const message = error instanceof Error ? error.message : "Failed to fetch spaces from GitHub";
    res.status(500).json({ error: message });
  }
});
