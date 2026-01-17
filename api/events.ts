
/**
 * Vercel Serverless Function: POST /api/events
 * Collects and logs application events in a structured JSON format.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;

    if (!body || !body.event) {
      return res.status(400).json({ error: 'Invalid event payload' });
    }

    // Structured logging for Vercel / CloudWatch / Datadog extraction
    // We include headers like user-agent for basic environment debugging (privacy safe)
    const logEntry = {
      ...body,
      received_at: new Date().toISOString(),
      ua: req.headers['user-agent'],
      geo: {
        city: req.headers['x-vercel-ip-city'],
        country: req.headers['x-vercel-ip-country']
      }
    };

    // This output is captured by Vercel's logging infrastructure
    console.log(JSON.stringify(logEntry));

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Event logging failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
