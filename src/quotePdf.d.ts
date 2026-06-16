export function generateQuotePDF(data: {
  productName: string;
  quote: { total: number; items?: unknown[] };
  config: Record<string, unknown>;
  client: { name: string; email: string; phone?: string };
}): Promise<void>;
