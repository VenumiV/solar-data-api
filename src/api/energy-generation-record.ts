import express from "express";
import { getAllEnergyGenerationRecordsBySerialNumber } from "../application/energy-generation-record";
import { authenticationMiddleware } from "./middlewares/authentication-middleware";
//import { detectFromReading } from "../application/anomaly-detection";

const energyGenerationRecordRouter = express.Router();

energyGenerationRecordRouter
  .route("/solar-unit/:serialNumber")
  .get(getAllEnergyGenerationRecordsBySerialNumber);
 
export default energyGenerationRecordRouter;