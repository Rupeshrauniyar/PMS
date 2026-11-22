/**
 * Optional standalone data-hygiene script:
 *   node scripts/migrateData.js [--dry-run]
 *
 * - Normalizes whitespace/commas on Property `price`, `rooms`, `washrooms`
 * - Upgrades legacy `bType: "visit"` bookings without `visitStatus`
 */
const { connectDB, disconnectDB } = require("../DB/db");
const PropertyModel = require("../Models/PropertyModel");
const { migrateLegacyVisits } = require("../services/visitService");

const dryRun = process.argv.includes("--dry-run");

function cleanNumericString(v) {
  if (v === undefined || v === null) return null;
  const cleaned = String(v).replace(/,/g, "").trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? String(num) : null;
}

async function run() {
  await connectDB();
  let updatedProps = 0;

  const props = await PropertyModel.find({}).select("_id price rooms washrooms").lean();
  for (const p of props) {
    const patch = {};
    for (const field of ["price", "rooms", "washrooms"]) {
      const next = cleanNumericString(p[field]);
      if (next !== null && next !== p[field]) patch[field] = next;
    }
    if (Object.keys(patch).length > 0) {
      updatedProps += 1;
      if (!dryRun) {
        await PropertyModel.updateOne({ _id: p._id }, { $set: patch });
      }
    }
  }

  if (!dryRun) {
    await migrateLegacyVisits();
  }

  console.log(
    `[migrateData] ${dryRun ? "(dry-run) would normalize" : "normalized"} ${updatedProps}/${props.length} properties.`,
  );
  await disconnectDB();
}

run().catch((err) => {
  console.error("[migrateData] failed:", err);
  process.exit(1);
});
