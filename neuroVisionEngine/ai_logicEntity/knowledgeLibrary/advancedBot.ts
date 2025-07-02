import {
  HEXACORE_ANALYTICS_CAPABILITIES as CAPABILITIES,
  ANALYTICS_FLAGS,
} from "./capabilities"
import {
  HEXACORE_ANALYTICS_DESCRIPTION as DESCRIPTION,
  ANALYTICS_VERSION,
} from "./description"
import { HEXACORE_BOT_ID as BOT_ID } from "./name"
import { ANALYTICS_TOOLKIT as TOOLKIT } from "./tools"

import type { AssistantProfile } from "@/hexacore/agent"

export const hexacoreAnalyticsBot: AssistantProfile = Object.freeze({
  id: BOT_ID,
  version: ANALYTICS_VERSION,
  label: "hexacore-analytics",
  promptBase: DESCRIPTION,
  features: {
    ...CAPABILITIES,
    flags: ANALYTICS_FLAGS,
  },
  extensions: TOOLKIT,
} as const)
