import { runBulkIngestion } from "../src/lib/ingestion/bulk-ingest";

async function main() {
  const args = process.argv.slice(2);
  const dateFrom = args[0] || "2025-01-20";
  const dateTo = args[1] || undefined;

  console.log("=== PolicyPulse Bulk Ingestion ===");
  console.log(`Date range: ${dateFrom} → ${dateTo || "present"}`);
  console.log("");

  const result = await runBulkIngestion({
    dateFrom,
    dateTo,
    onProgress: (message) => console.log(message),
  });

  console.log("");
  console.log("=== Results ===");
  console.log(`Total fetched:  ${result.totalFetched}`);
  console.log(`New documents:  ${result.totalNew}`);
  console.log(`Inserted:       ${result.totalInserted}`);
  console.log(`Errors:         ${result.errors.length}`);

  if (result.errors.length > 0) {
    console.log("");
    console.log("=== Errors ===");
    result.errors.slice(0, 10).forEach((err) => console.error(`  - ${err}`));
    if (result.errors.length > 10) {
      console.error(`  ... and ${result.errors.length - 10} more`);
    }
  }

  process.exit(result.errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(2);
});
