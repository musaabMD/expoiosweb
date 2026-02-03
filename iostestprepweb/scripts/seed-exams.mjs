#!/usr/bin/env node

// Quick script to seed SCFHS exams
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.CONVEX_URL || "");

async function seed() {
    console.log("🌱 Seeding SCFHS exams...");

    const result = await client.mutation("exams:seedSCFHSExams", {});

    console.log("✅", result.message);
    console.log(`📊 Inserted ${result.inserted} exams`);
}

seed().catch(console.error);
