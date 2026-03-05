import type { ScanRule } from "@/types/scan";
import { toolPoisoningRules } from "./tool-poisoning";
import { commandInjectionRules } from "./command-injection";
import { pathTraversalRules } from "./path-traversal";
import { ssrfRules } from "./ssrf";
import { credentialTheftRules } from "./credential-theft";
import { excessivePermissionsRules } from "./excessive-permissions";
import { missingAuthRules } from "./missing-auth";
import { supplyChainRules } from "./supply-chain";
import { rugPullRules } from "./rug-pull";
import { dataExfiltrationRules } from "./data-exfiltration";

export const allRules: ScanRule[] = [
  ...toolPoisoningRules,
  ...commandInjectionRules,
  ...pathTraversalRules,
  ...ssrfRules,
  ...credentialTheftRules,
  ...excessivePermissionsRules,
  ...missingAuthRules,
  ...supplyChainRules,
  ...rugPullRules,
  ...dataExfiltrationRules,
];

export {
  toolPoisoningRules,
  commandInjectionRules,
  pathTraversalRules,
  ssrfRules,
  credentialTheftRules,
  excessivePermissionsRules,
  missingAuthRules,
  supplyChainRules,
  rugPullRules,
  dataExfiltrationRules,
};
