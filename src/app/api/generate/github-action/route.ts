import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  failBelow: z.enum(["A", "B", "C", "D", "F"]).optional().default("D"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { owner, repo, failBelow } = parsed.data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mcp-scanner-kappa.vercel.app";

  const gradeOrder = ["A", "B", "C", "D", "F"];
  const failIndex = gradeOrder.indexOf(failBelow);

  const yaml = `name: MCP Security Scan
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  mcp-security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: MCP Security Scan
        id: scan
        run: |
          echo "Scanning ${owner}/${repo}..."
          RESULT=$(curl -sf "${appUrl}/api/v1/score/${owner}/${repo}" || echo '{"error":"not_found"}')

          GRADE=$(echo "$RESULT" | jq -r '.grade // "unknown"')
          SCORE=$(echo "$RESULT" | jq -r '.score // "N/A"')
          CRITICAL=$(echo "$RESULT" | jq -r '.findings.critical // 0')
          HIGH=$(echo "$RESULT" | jq -r '.findings.high // 0')

          echo "grade=$GRADE" >> $GITHUB_OUTPUT
          echo "score=$SCORE" >> $GITHUB_OUTPUT
          echo "critical=$CRITICAL" >> $GITHUB_OUTPUT
          echo "high=$HIGH" >> $GITHUB_OUTPUT

          echo "## MCP Security Scan Results" >> $GITHUB_STEP_SUMMARY
          echo "- **Grade:** $GRADE" >> $GITHUB_STEP_SUMMARY
          echo "- **Score:** $SCORE/100" >> $GITHUB_STEP_SUMMARY
          echo "- **Critical:** $CRITICAL | **High:** $HIGH" >> $GITHUB_STEP_SUMMARY
          echo "- [Full Report](${appUrl}/api/v1/score/${owner}/${repo})" >> $GITHUB_STEP_SUMMARY

      - name: Check Grade Threshold
        run: |
          GRADE="\${{ steps.scan.outputs.grade }}"
          GRADES=("A" "B" "C" "D" "F")
          FAIL_AT=${failIndex}

          for i in "\${!GRADES[@]}"; do
            if [[ "\${GRADES[$i]}" == "$GRADE" ]]; then
              if (( i >= FAIL_AT )); then
                echo "Grade $GRADE is below threshold ${failBelow}. Failing."
                exit 1
              fi
            fi
          done
          echo "Grade $GRADE passes threshold."
`;

  return NextResponse.json({ yaml, owner, repo, failBelow });
}
