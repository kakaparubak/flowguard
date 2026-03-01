export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, unknown>) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch (_e) {
          clearInterval(interval);
        }
      };

      const interval = setInterval(() => {
        const banks = ["QRIS", "OVO", "GOPAY", "BCA", "BNI", "Mandiri"];
        const mockTxn = {
          id: `tx_${Math.random().toString(36).substring(7)}`,
          bankIssuer: banks[Math.floor(Math.random() * banks.length)],
          amount: Math.floor(Math.random() * 50000) * 100 + 10000,
          device: Math.random() > 0.5 ? "Mobile Chrome" : "Desktop Safari",
          device_id: `dev_${Math.random().toString(36).substring(7)}`,
          location: Math.random() > 0.3 ? "Jakarta" : "Surabaya",
          ip: `114.120.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          hour: new Date().getHours(),
          country: "ID",
        };
        sendEvent(mockTxn);
      }, 3000); // New transaction every 3 seconds

      // Send initial keepalike
      controller.enqueue(encoder.encode(":keepalive\n\n"));
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
