import mongoose from "mongoose";
import { EnergyGenerationRecord } from "./entities/EnergyGenerationRecord";
import dotenv from "dotenv";
import { connectDB } from "./db";

dotenv.config();

// Define anomaly periods for each unit
const unitAnomalyConfigs = {
  "SU-0001": [
    { start: 4, end: 6, type: "mechanical" }, // Aug 5-7
   // { start: 9, end: 13, type: "sensor1" }, // Aug 10-14
    //{ start: 19, end: 23, type: "belowAvg1" }, // Aug 20-24
    { start: 29, end: 33, type: "temperature" }, // Aug 30 - Sep 3
    { start: 40, end: 44, type: "shading" }, // Sep 10-14
    { start: 50, end: 54, type: "sensor2" }, // Sep 20-24
    //{ start: 65, end: 69, type: "belowAvg2" }, // Oct 5-9
  ],
  "SU-0002": [
    { start: 15, end: 17, type: "mechanical" }, // Aug 16-18
    { start: 25, end: 29, type: "sensor1" }, // Aug 26-30
    //{ start: 35, end: 39, type: "belowAvg1" }, // Sep 5-9
    { start: 48, end: 52, type: "temperature" }, // Sep 18-22
    { start: 60, end: 64, type: "shading" }, // Oct 1-5
   // { start: 75, end: 79, type: "sensor2" }, // Oct 16-20
    //{ start: 90, end: 94, type: "belowAvg2" }, // Nov 1-5
  ],
  "SU-0003": [
    { start: 8, end: 10, type: "mechanical" }, // Aug 9-11
    //{ start: 20, end: 24, type: "sensor1" }, // Aug 21-25
   // { start: 32, end: 36, type: "belowAvg1" }, // Sep 2-6
    { start: 45, end: 49, type: "temperature" }, // Sep 15-19
    { start: 58, end: 62, type: "shading" }, // Sep 29 - Oct 3
    { start: 70, end: 74, type: "sensor2" }, // Oct 11-15
   // { start: 95, end: 99, type: "belowAvg2" }, // Nov 6-10
  ],
};

function getEnergyForAnomaly(
  anomalyType: string,
  baseEnergy: number,
  timeMultiplier: number
): number {
  const variation = 0.8 + Math.random() * 0.4;

  switch (anomalyType) {
    case "mechanical":
      return 0; // Complete failure

    case "sensor1":
      // Random negative or extreme high values
      return Math.random() < 0.5
        ? -(0.5 + Math.random() * 2) // Negative: -0.5 to -2.5 kWh
        : 50 + Math.random() * 100; // High: 50-150 kWh

    case "sensor2":
      // Different sensor error pattern
      return Math.random() < 0.6
        ? -(1 + Math.random() * 2) // Negative: -1 to -3 kWh
        : 80 + Math.random() * 120; // Extreme: 80-200 kWh

    /*case "belowAvg1":
      // 30-50% of normal
      const reduction1 = 0.3 + Math.random() * 0.2;
      return Math.round(baseEnergy * timeMultiplier * variation * reduction1 * 100) / 100;

    case "belowAvg2":
      // 40-60% of normal
      const reduction2 = 0.4 + Math.random() * 0.2;
      return Math.round(baseEnergy * timeMultiplier * variation * reduction2 * 100) / 100;
*/
    case "temperature":
      // 40% efficiency due to high temperature
      return Math.round(baseEnergy * timeMultiplier * variation * 0.4 * 100) / 100;

    case "shading":
      // 65% efficiency due to shading
      return Math.round(baseEnergy * timeMultiplier * variation * 0.65 * 100) / 100;

    default:
      return Math.round(baseEnergy * timeMultiplier * variation * 100) / 100;
  }
}

async function seedUnit(serialNumber: string, anomalies: any[]) {
  const records = [];
  const startDate = new Date("2025-08-01T08:00:00Z");
  const endDate = new Date("2026-01-03T12:30:00Z");

  let currentDate = new Date(startDate);
  let recordCount = 0;

  while (currentDate <= endDate) {
    const hour = currentDate.getUTCHours();
    const month = currentDate.getUTCMonth();

    const daysSinceStart = Math.floor(
      (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Base energy calculation
    let baseEnergy = 1.2;
    if (month >= 5 && month <= 7) {
      baseEnergy = 1.5;
    } else if (month >= 2 && month <= 4) {
      baseEnergy = 1.4;
    } else if (month >= 8 && month <= 10) {
      baseEnergy = 1.2;
    } else {
      baseEnergy = 1.0;
    }

    // Time of day multiplier
    let timeMultiplier = 1;
    if (hour >= 6 && hour <= 18) {
      timeMultiplier = 1.2;
      if (hour >= 10 && hour <= 14) {
        timeMultiplier = 1.5;
      }
    } else {
      timeMultiplier = 0;
    }

    // Check if current day falls in any anomaly period
    let energyGenerated = 0;
    let isAnomaly = false;

    for (const anomaly of anomalies) {
      if (daysSinceStart >= anomaly.start && daysSinceStart <= anomaly.end) {
        energyGenerated = getEnergyForAnomaly(anomaly.type, baseEnergy, timeMultiplier);
        isAnomaly = true;
        break;
      }
    }

    // Normal operation
    if (!isAnomaly) {
      const variation = 0.8 + Math.random() * 0.4;
      energyGenerated = Math.round(baseEnergy * timeMultiplier * variation * 100) / 100;
    }

    records.push({
      serialNumber: serialNumber,
      timestamp: new Date(currentDate),
      energyGenerated: energyGenerated,
    });

    currentDate = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000);
    recordCount++;
  }

  await EnergyGenerationRecord.insertMany(records);
  console.log(`✓ Seeded ${recordCount} records for ${serialNumber}`);
}

async function seed() {
  try {
    await connectDB();

    // Clear all existing data
    console.log("Clearing all existing energy generation records...");
    const deleteResult = await EnergyGenerationRecord.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing records.\n`);

    // Seed each unit
    for (const [serialNumber, anomalies] of Object.entries(unitAnomalyConfigs)) {
      console.log(`Seeding ${serialNumber}...`);
      await seedUnit(serialNumber, anomalies);
    }

    console.log("\n=== SEEDING COMPLETE ===");
    console.log("Generated records for SU-0001, SU-0002, and SU-0003");
    console.log("Period: August 1, 2025 to December 31, 2025");
    console.log("Interval: Every 2 hours");
    console.log("\nEach unit has different anomaly periods to simulate varied real-world conditions.");

  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();