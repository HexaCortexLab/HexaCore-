import {
  HEXACORE_FETCH_TRANSFERS_NAME,
  HEXACORE_FETCH_HOLDERS_NAME,
  HEXACORE_DETECT_WHALES_NAME,
  HEXACORE_DETECT_SPIKES_NAME,
  HEXACORE_DETECT_DUMPS_NAME,
  HEXACORE_GENERATE_HEATMAP_NAME,
  HEXACORE_CORRELATION_ANALYSIS_NAME,
  HEXACORE_SNAPSHOT_DISTRIBUTION_NAME
} from "./action-names"

export const HEXACORE_TOOLKIT = {
  fetchTransfers: {
    name: HEXACORE_FETCH_TRANSFERS_NAME,
    description: "Retrieve recent token transfer events for a given mint",
    parameters: {
      type: "object",
      properties: {
        mint: { type: "string", description: "Token mint address" },
        limit: { type: "number", description: "Max number of transfers" }
      },
      required: ["mint"]
    }
  },
  fetchHolders: {
    name: HEXACORE_FETCH_HOLDERS_NAME,
    description: "Fetch top-N holder distribution for a token mint",
    parameters: {
      type: "object",
      properties: {
        mint: { type: "string", description: "Token mint address" },
        topN: { type: "number", description: "Number of top holders" }
      },
      required: ["mint"]
    }
  },
  detectWhales: {
    name: HEXACORE_DETECT_WHALES_NAME,
    description: "Detect large ('whale') transfers above a threshold",
    parameters: {
      type: "object",
      properties: {
        mint: { type: "string" },
        threshold: { type: "number" }
      },
      required: ["mint", "threshold"]
    }
  },
  detectSpikes: {
    name: HEXACORE_DETECT_SPIKES_NAME,
    description: "Identify sudden volume spikes over a window",
    parameters: {
      type: "object",
      properties: {
        mint: { type: "string" },
        windowSize: { type: "number" },
        thresholdPct: { type: "number" }
      },
      required: ["mint"]
    }
  },
  detectDumps: {
    name: HEXACORE_DETECT_DUMPS_NAME,
    description: "Identify sudden volume drops over a window",
    parameters: {
      type: "object",
      properties: {
        mint: { type: "string" },
        windowSize: { type: "number" },
        thresholdPct: { type: "number" }
      },
      required: ["mint"]
    }
  },
  generateHeatmap: {
    name: HEXACORE_GENERATE_HEATMAP_NAME,
    description: "Build a 24-hour heatmap of transfer activity",
    parameters: {
      type: "object",
      properties: {
        mint: { type: "string" },
        lookback: { type: "number", description: "Number of transfers to include" }
      },
      required: ["mint"]
    }
  },
  correlationAnalysis: {
    name: HEXACORE_CORRELATION_ANALYSIS_NAME,
    description: "Compute pairwise correlations for volume, liquidity, and activity",
    parameters: {
      type: "object",
      properties: {
        mint: { type: "string" },
        periodHours: { type: "number", description: "Analysis window in hours" }
      },
      required: ["mint", "periodHours"]
    }
  },
  snapshotDistribution: {
    name: HEXACORE_SNAPSHOT_DISTRIBUTION_NAME,
    description: "Capture a snapshot of top-holder distribution",
    parameters: {
      type: "object",
      properties: {
        mint: { type: "string" },
        topN: { type: "number", description: "Number of top holders" }
      },
      required: ["mint"]
    }
  }
}
