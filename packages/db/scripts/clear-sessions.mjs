import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to clear auth sessions.");
}

const client = new pg.Client({ connectionString: databaseUrl });

try {
  await client.connect();
  const result = await client.query('DELETE FROM "session";');
  console.log(`Cleared ${result.rowCount} auth session(s).`);
} catch (error) {
  if (error?.code === "42P01") {
    console.log("Auth session table does not exist yet; skipping session cleanup.");
  } else {
    throw error;
  }
} finally {
  await client.end();
}
