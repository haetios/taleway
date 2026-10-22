/** Accès SQL direct pour les fixtures de test (bypass API).
 * Utilisé quand l'endpoint de création n'existe pas encore (TDD) ou pour
 * préparer des états que l'API n'expose pas.
 */
import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

export async function insertBookmark(profileId: string, storyId: number, nodeId: string) {
  const [row] = await sql`
    insert into bookmarks (profile_id, story_id, node_id)
    values (${profileId}, ${storyId}, ${nodeId})
    on conflict (profile_id, story_id) do update set node_id = ${nodeId}
    returning *
  `;
  return row as { id: number; profile_id: string; story_id: number; node_id: string };
}

export async function closeSql() {
  await sql.end();
}