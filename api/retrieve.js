import pg from 'pg';
const { Pool } = pg;

// Connect to your Supabase database.
// IMPORTANT: Put your connection string in Vercel's environment variables.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { x_coordinate, y_coordinate, access_code } = req.body;

  // --- THIS IS THE INTENTIONALLY VULNERABLE PART ---
  // --- DO NOT EVER DO THIS IN A REAL APPLICATION. ---
  // The code directly inserts user input into the query string.
  const vulnerableQuery = `
    SELECT * FROM secretLocations 
    WHERE 
      x_coordinate = ${x_coordinate} AND 
      y_coordinate = ${y_coordinate} AND 
      access_code = '${access_code}'
  `;
  // For a numeric field like x_coordinate, quotes aren't even needed,
  // which makes the injection even easier for the player.

  try {
    const result = await pool.query(vulnerableQuery);

    if (result.rows.length > 0) {
      // If the query returns anything, send the first result back.
      res.status(200).json({ message: 'Data Retrieved!', data: result.rows[0] });
    } else {
      // If the query returns no rows, deny access.
      res.status(401).json({ message: 'ACCESS DENIED: No data found for these credentials.' });
    }
  } catch (error) {
    // If the SQL is malformed (due to injection), it might error out.
    // Send a generic error so we don't leak too much info.
    console.error('Database Error:', error);
    res.status(500).json({ message: 'System error.' });
  }
}
