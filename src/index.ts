
import "dotenv/config";
import express from "express";
import energyGenerationRecordRouter from "./api/energy-generation-record";
import { globalErrorHandler } from "./api/middlewares/global-error-handling-middleware";
import { loggerMiddleware } from "./api/middlewares/logger-middleware";

import { connectDB } from "./infrastructure/db";
import cors from "cors";

import { clerkMiddleware } from "@clerk/express";

//import anomaliesRouter from "./api/anomalies";


const server = express();
server.use(express.json());
server.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://fed-front-end-venumi.netlify.app",
    ],
    credentials: true,
  })
);


server.use(loggerMiddleware);

//
//server.use(clerkMiddleware());

server.use(express.json());


server.use("/api/energy-generation-records", energyGenerationRecordRouter);

//server.use("/api/anomalies", anomaliesRouter);


server.use(globalErrorHandler);

connectDB();

const PORT = process.env.PORT || 8001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});