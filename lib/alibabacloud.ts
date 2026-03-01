import { Transaction } from "./qwen";

export const logDecision = async ({
  txn,
  failureScore,
  channel,
  result,
}: {
  txn: Transaction;
  failureScore: number;
  channel: string;
  result: { status: string };
}) => {
  console.log(`[ALIBABA CLOUD] Logging Decision:
  Txn ID: ${txn.id}
  Bank: ${txn.bankIssuer}
  Failure Score: ${failureScore}
  Routed Channel: ${channel}
  Result: ${result.status}
  `);

  if (!process.env.DATABASE_URL) {
    return { success: true, mock: true };
  }

  // Example placeholder for ApsaraDB RDS insert logic
  // await db.insert(decisions).values({ txnId: txn.id, bank: txn.bankIssuer, score: failureScore, channel, status: result.status });

  return { success: true };
};
