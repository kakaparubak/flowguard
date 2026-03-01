export type Transaction = {
  id: string;
  bankIssuer: string; // e.g. QRIS, OVO, GOPAY, BCA, BNI, Mandiri
  amount: number;
  device: string;
  device_id: string;
  location: string;
  ip: string;
  hour: number;
  country: string;
};

export type RouteDecision = {
  failureScore: number;
  optimalChannel: string;
  reason: string;
};

export const isPeak = (hour: number) => hour >= 18 && hour <= 22;

const CHANNELS = ["QRIS", "OVO", "GOPAY", "BCA", "BNI", "Mandiri"] as const;

const callQwen = async (prompt: string): Promise<string | null> => {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(
    "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen2.5-72b-instruct",
        messages: [{ role: "user", content: prompt }],
      }),
    },
  );

  if (!response.ok) {
    console.error("Qwen API Error:", response.status);
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? null;
};

const extractJson = (content: string): any => {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found");
  return JSON.parse(content.substring(start, end + 1));
};

// --- Failure Score Only (kept for backwards compat) ---
export const predictFailure = async (txn: Transaction): Promise<number> => {
  const { failureScore } = await selectRoute(txn);
  return failureScore;
};

// --- AI-Driven Routing Decision ---
export const selectRoute = async (txn: Transaction): Promise<RouteDecision> => {
  const peak = isPeak(txn.hour);

  const prompt = `You are an Indonesian payment routing AI. Analyze this transaction and decide the optimal payment channel.

Transaction:
- Origin Bank: ${txn.bankIssuer}
- Amount: ${txn.amount} IDR (${txn.amount > 5_000_000 ? "HIGH VALUE" : "normal"})
- Device: ${txn.device}
- Location: ${txn.location}
- Hour: ${txn.hour}:00 (${peak ? "PEAK HOUR - high congestion risk" : "off-peak"})
- Country: ${txn.country}

Available channels and their characteristics:
- QRIS: fastest (200ms), but HIGH failure risk during peak hours (18-22)
- OVO: 350ms, reliable e-wallet, good for mid-value transactions
- GOPAY: 350ms, best for GOPAY-origin transactions and urban Jakarta
- BCA: 650ms, stable bank channel, low e-commerce failure rate
- BNI: 650ms, good for high-value transactions above 5M IDR
- Mandiri: 900ms, most stable, use as last resort or for very high-value

Evaluate the failure risk of routing on the origin bank as-is, then select the single best channel considering reliability, speed, and transaction context.

Output ONLY valid JSON:
{"failure_score": <0-100 float>, "optimal_channel": "<one of: QRIS|OVO|GOPAY|BCA|BNI|Mandiri>", "reason": "<one short sentence>"}`;

  // --- Mock fallback (no API key or rate limited) ---
  const mockDecision = (): RouteDecision => {
    let score = 10;
    let channel = txn.bankIssuer;
    let reason = "Default origin channel, low risk detected";

    if (txn.bankIssuer === "QRIS" && peak) {
      score = 35 + Math.random() * 15;
      channel = "OVO";
      reason = "QRIS peak-hour congestion — rerouted to OVO";
    } else if (txn.bankIssuer === "QRIS") {
      score = 4 + Math.random() * 3;
      channel = "QRIS";
      reason = "QRIS off-peak, optimal speed";
    } else if (["BCA", "BNI"].includes(txn.bankIssuer) && peak) {
      score = 20 + Math.random() * 10;
      channel = txn.amount > 5_000_000 ? "BNI" : "BCA";
      reason = "Bank channel slight peak load, using stable alternative";
    } else if (txn.amount > 5_000_000) {
      score = 18 + Math.random() * 8;
      channel = "BNI";
      reason = "High-value transaction → BNI for stability";
    } else if (txn.location.toLowerCase().includes("jakarta")) {
      score = 10 + Math.random() * 5;
      channel = "GOPAY";
      reason = "Jakarta urban traffic — GOPAY optimal";
    }

    return {
      failureScore: parseFloat(score.toFixed(1)),
      optimalChannel: channel,
      reason,
    };
  };

  try {
    const content = await callQwen(prompt);
    if (!content) return mockDecision();

    const parsed = extractJson(content);

    // Validate channel is one of the known list
    const channel = CHANNELS.includes(parsed.optimal_channel)
      ? parsed.optimal_channel
      : txn.bankIssuer;
    const failureScore = parseFloat(
      parseFloat(parsed.failure_score ?? 15).toFixed(1),
    );
    const reason = parsed.reason ?? "Qwen routing decision";

    console.log(
      `[QWEN ROUTING] ${txn.id} | ${txn.bankIssuer} → ${channel} | Score: ${failureScore} | ${reason}`,
    );

    return { failureScore, optimalChannel: channel, reason };
  } catch (error) {
    console.error("Qwen routing error:", error);
    return mockDecision();
  }
};
