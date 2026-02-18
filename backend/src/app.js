import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);

app.use(cors({
  origin: "*",
  methods: ["GET","POST","PUT","DELETE"]
}));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// API routes
app.use("/api/v1/users", userRoutes);


// ===== FIX FOR "NOT FOUND" AFTER REFRESH =====

// get current directory (ESM way)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// serve React build folder
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// send React for any unknown route (React Router handles it)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});


// ===== Start Server =====
const start = async () => {
  const connectionDb = await mongoose.connect(process.env.MONGO_URI);
  console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);

  server.listen(app.get("port"), () => {
    console.log(`SERVER RUNNING ON PORT ${app.get("port")}`);
  });
};

start();
