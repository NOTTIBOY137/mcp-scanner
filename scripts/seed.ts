import { config } from "dotenv";
config({ path: ".env" });

import { TOP_SERVERS } from "../src/data/top-servers";
import { seedServers } from "../src/lib/seeder";

async function main() {
  const args = process.argv.slice(2);
  const priorityFlag = args.find((a) => a.startsWith("--priority="));
  const delayFlag = args.find((a) => a.startsWith("--delay="));

  let serverList = [...TOP_SERVERS];

  if (priorityFlag) {
    const maxPriority = parseInt(priorityFlag.split("=")[1], 10);
    if (!isNaN(maxPriority)) {
      serverList = serverList.filter((s) => s.priority <= maxPriority);
    }
  }

  const delayMs = delayFlag ? parseInt(delayFlag.split("=")[1], 10) : 3000;

  console.log(`Seeding ${serverList.length} servers...`);
  console.log(
    `Delay between scans: ${isNaN(delayMs) ? 3000 : delayMs}ms\n`,
  );

  const results = await seedServers(serverList, {
    delayMs: isNaN(delayMs) ? 3000 : delayMs,
    onProgress: (result, index, total) => {
      const icon =
        result.status === "scanned"
          ? "\u2713"
          : result.status === "skipped"
            ? "\u25CB"
            : "\u2717";
      const detail = result.grade ?? result.status;
      const error = result.error ? ` (${result.error})` : "";
      console.log(
        `[${index + 1}/${total}] ${icon} ${result.repoUrl} \u2014 ${detail}${error}`,
      );
    },
  });

  const scanned = results.filter((r) => r.status === "scanned").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;

  console.log(
    `\nDone: ${scanned} scanned, ${skipped} skipped, ${failed} failed`,
  );

  // Print grade distribution
  const grades: Record<string, number> = {};
  for (const r of results) {
    if (r.grade) {
      grades[r.grade] = (grades[r.grade] || 0) + 1;
    }
  }

  if (Object.keys(grades).length > 0) {
    console.log("\nGrade distribution:");
    for (const [grade, count] of Object.entries(grades).sort()) {
      console.log(`  ${grade}: ${count}`);
    }
  }
}

main().catch(console.error);
