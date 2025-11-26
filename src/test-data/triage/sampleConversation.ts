export const sampleMessages = [
  { role: "system", content: "You are Ekonomichefen, a triage assistant for accounting tasks." },
  { role: "user", content: "Hi — please review the invoice from Acme and post it." },
];

// Break assistant text into smaller streaming chunks for a more granular simulation.
const assistantMessages = [
  "Thanks — I found the invoice. I'll validate the VAT and extract metadata.",
  "Suggested plan: 1) OCR invoice, 2) validate VAT, 3) create supplier invoice in Fortnox.",
  "Do you want me to proceed?",
];

function chunkString(str: string, size = 18) {
  const chunks: string[] = [];
  let i = 0;
  while (i < str.length) {
    chunks.push(str.slice(i, i + size));
    i += size;
  }
  return chunks;
}

const assistantChunks = assistantMessages.flatMap((m) => chunkString(m, 18));

// Returns a ReadableStream-like object with a body.getReader() compatible API for fetch-like usage.
export function simulateStreaming() {
  let i = 0;
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i >= assistantChunks.length) {
        controller.close();
        return;
      }
      const chunk = assistantChunks[i++];
      // simulate small delay
      return new Promise((res) => {
        setTimeout(() => {
          controller.enqueue(encoder.encode(chunk));
          res(undefined);
        }, 300 + Math.random() * 400);
      });
    },
  });
}

export default sampleMessages;
