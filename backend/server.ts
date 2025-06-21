import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { WsServer } from "./wsServer";
import authRouter from "./routes/auth";
import conversationsRouter from "./routes/conversations";
import messagesRouter from "./routes/messages";
import invitationsRouter from "./routes/invitations";

const app = express();
const server = http.createServer(app);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/invitations", invitationsRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Initialize WebSocket server
new WsServer(server);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});
