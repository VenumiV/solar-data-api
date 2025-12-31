import mongoose from "mongoose";
import { EnergyGenerationRecord } from "./entities/EnergyGenerationRecord";
import dotenv from "dotenv";
import { connectDB } from "./db";

dotenv.config();

async function seed() {
  const serialNumber = "SU-0001";

  try {
    // Connect to DB
    await connectDB();

    // Clear existing data - DELETE ALL RECORDS
    console.log("Clearing all existing energy generation records...");
    const deleteResult = await EnergyGenerationRecord.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing records.`);

    // Create historical energy generation records from Aug 1, 2025 8pm to Dec 28, 2025 12:30pm (Sri Lanka time) every 2 hours
    const records = [];
    const startDate = new Date("2025-08-01T08:00:00Z"); // August 1, 2025 8pm UTC
    const endDate = new Date("2025-12-31T12:30:00Z"); // Dec 28, 2025 12:30pm UTC

    let currentDate = new Date(startDate);
    let recordCount = 0;

    while (currentDate <= endDate) {
      // Generate realistic energy values based on time of day and season
      const hour = currentDate.getUTCHours();
      const month = currentDate.getUTCMonth(); // 0-11

      // Calculate days since start (Aug 1 = day 0)
      const daysSinceStart = Math.floor(
        (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Base energy generation (higher in summer months)
      let baseEnergy = 200;
      if (month >= 5 && month <= 7) {
        // June-August (summer)
        baseEnergy = 300;
      } else if (month >= 2 && month <= 4) {
        // March-May (spring)
        baseEnergy = 250;
      } else if (month >= 8 && month <= 10) {
        // September-November (fall)
        baseEnergy = 200;
      } else {
        // December-February (winter)
        baseEnergy = 150;
      }

      // Adjust based on time of day (solar panels generate more during daylight)
      let timeMultiplier = 1;
      if (hour >= 6 && hour <= 18) {
        // Daylight hours
        timeMultiplier = 1.2;
        if (hour >= 10 && hour <= 14) {
          // Peak sun hours
          timeMultiplier = 1.5;
        }
      } else {
        // Night hours
        timeMultiplier = 0; // Minimal generation at night
      }

      let energyGenerated = 0;

      // CONTINUOUS ANOMALY PATTERNS - Optimized to generate ~30 anomalies
      // Each anomaly type affects ALL 2-hour records within the specified date range
      // Shorter periods (3-5 days) to reduce total anomaly count

      // 1. MECHANICAL FAILURE: Aug 5-7 (Days 4-6) - 3 days = ~3 anomalies
      if (daysSinceStart >= 4 && daysSinceStart <= 6) {
        energyGenerated = 0; // No energy generation at all
      }
      // 2. SENSOR ERROR PERIOD 1: Aug 10-14 (Days 9-13) - 5 days = ~5 anomalies
      else if (daysSinceStart >= 9 && daysSinceStart <= 13) {
        // Sensor errors produce impossible values throughout this period
        if (Math.random() < 0.5) {
          energyGenerated = -Math.round(5 + Math.random() * 20); // Negative readings (-5 to -25 kWh)
        } else {
          energyGenerated = Math.round(5000 + Math.random() * 5000); // Impossible high values (5000-10000 kWh)
        }
      }
      // 3. BELOW AVERAGE PERIOD 1: Aug 20-24 (Days 19-23) - 5 days = ~5 anomalies
      else if (daysSinceStart >= 19 && daysSinceStart <= 23) {
        // Consistently reduced energy (30-50% of normal) due to panel obstruction
        const reductionFactor = 0.3 + Math.random() * 0.2; // 30-50% of normal
        const variation = 0.8 + Math.random() * 0.4; // Normal daily variation
        energyGenerated = Math.round(baseEnergy * timeMultiplier * variation * reductionFactor);
      }
      // 4. TEMPERATURE ANOMALY: Aug 30 - Sep 3 (Days 29-33) - 5 days = ~1 anomaly (grouped)
      else if (daysSinceStart >= 29 && daysSinceStart <= 33) {
        // High temperatures reduce efficiency to 40% of normal
        const variation = 0.8 + Math.random() * 0.4;
        energyGenerated = Math.round(baseEnergy * timeMultiplier * variation * 0.4);
      }
      // 5. SHADING ANOMALY: Sep 10-14 (Days 40-44) - 5 days = ~1 anomaly (grouped)
      else if (daysSinceStart >= 40 && daysSinceStart <= 44) {
        // Shading reduces output to 65% of normal
        const variation = 0.8 + Math.random() * 0.4;
        energyGenerated = Math.round(baseEnergy * timeMultiplier * variation * 0.65);
      }
      // 6. SENSOR ERROR PERIOD 2: Sep 20-24 (Days 50-54) - 5 days = ~5 anomalies
      else if (daysSinceStart >= 50 && daysSinceStart <= 56) {
        // Different pattern of sensor errors
        if (Math.random() < 0.6) {
          energyGenerated = -Math.round(10 + Math.random() * 10); // Negative readings (-10 to -25 kWh)
        } else {
          energyGenerated = Math.round(8000 + Math.random() * 40000); // Extreme values (8000-12000 kWh)
        }
      }
      // 7. BELOW AVERAGE PERIOD 2: Oct 5-9 (Days 65-69) - 5 days = ~5 anomalies
      else if (daysSinceStart >= 65 && daysSinceStart <= 69) {
        // Reduced energy (40-60% of normal) throughout the period
        const reductionFactor = 0.4 + Math.random() * 0.2; // 40-60% of normal
        const variation = 0.8 + Math.random() * 0.4;
        energyGenerated = Math.round(baseEnergy * timeMultiplier * variation * reductionFactor);
      }
      // 8. BELOW AVERAGE PERIOD 3: Nov 15-19 (Days 106-110) - 5 days = ~5 anomalies
      /*else if (daysSinceStart >= 106 && daysSinceStart <= 110) {
        // Reduced energy (35-45% of normal)
        const reductionFactor = 0.35 + Math.random() * 0.1; // 35-45% of normal
        const variation = 0.8 + Math.random() * 0.4;
        energyGenerated = Math.round(baseEnergy * timeMultiplier * variation * reductionFactor);
      }*/
      // NORMAL OPERATION - All other periods
      else {
        // Normal operation with typical daily variation (±20%)
        const variation = 0.8 + Math.random() * 0.4;
        energyGenerated = Math.round(baseEnergy * timeMultiplier * variation);
      }

      records.push({
        serialNumber: serialNumber,
        timestamp: new Date(currentDate),
        energyGenerated: energyGenerated,
      });

      // Move to next 2-hour interval
      currentDate = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000);
      recordCount++;
    }

    await EnergyGenerationRecord.insertMany(records);

    console.log(
      `Database seeded successfully. Generated ${recordCount} energy generation records from August 1, 2025 to December 31, 2025.`
    );
    console.log("\nAnomaly Periods (Expected ~30 anomalies):");
    console.log("- Aug 5-7 (3 days): Mechanical Failure (0 kWh) → ~3 anomalies");
    console.log("- Aug 10-14 (5 days): Sensor Error Period 1 (negative/extreme values) → ~5 anomalies");
    console.log("- Aug 20-24 (5 days): Below Average Period 1 (30-50% normal) → ~5 anomalies");
    console.log("- Aug 30 - Sep 3 (5 days): Temperature Anomaly (40% normal) → ~1 anomaly");
    console.log("- Sep 10-14 (5 days): Shading Anomaly (65% normal) → ~1 anomaly");
    console.log("- Sep 20-24 (5 days): Sensor Error Period 2 (negative/extreme values) → ~5 anomalies");
    console.log("- Oct 5-9 (5 days): Below Average Period 2 (40-60% normal) → ~5 anomalies");
    console.log("- Nov 15-19 (5 days): Below Average Period 3 (35-45% normal) → ~5 anomalies");
    console.log("\nTotal: ~30 anomalies across 8 distinct periods");
    console.log("All other dates have NORMAL operation.");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();