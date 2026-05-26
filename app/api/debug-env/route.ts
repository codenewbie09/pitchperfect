export async function GET() {
  const vars = {
    AUTH_SECRET: process.env.AUTH_SECRET ? `set (len=${process.env.AUTH_SECRET.length})` : "NOT SET",
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID ? `set (len=${process.env.AUTH_GOOGLE_ID.length})` : "NOT SET",
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET ? `set (len=${process.env.AUTH_GOOGLE_SECRET.length})` : "NOT SET",
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID ? `set (len=${process.env.AUTH_GITHUB_ID.length})` : "NOT SET",
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET ? `set (len=${process.env.AUTH_GITHUB_SECRET.length})` : "NOT SET",
    NODE_ENV: process.env.NODE_ENV || "NOT SET",
    VERCEL_ENV: process.env.VERCEL_ENV || "NOT SET",
    VERCEL_URL: process.env.VERCEL_URL || "NOT SET",
  };
  return Response.json(vars);
}
