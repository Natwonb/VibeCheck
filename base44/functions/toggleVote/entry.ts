import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const ENTITIES = {
  take: 'TakeSubmission',
  daily: 'DailyResponse',
  roomAnswer: 'RoomAnswer'
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in to vote.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const kind = String(body.kind || '');
    const id = String(body.id || '');
    const entityName = ENTITIES[kind];
    if (!entityName || !id) return Response.json({ error: 'Invalid vote target.' }, { status: 400 });

    const entity = base44.asServiceRole.entities[entityName];
    const record = await entity.get(id);
    if (!record) return Response.json({ error: 'That post is gone.' }, { status: 404 });
    if (record.is_hidden) return Response.json({ error: 'That post was hidden.' }, { status: 400 });

    const voters = record.voter_ids || [];
    const had = voters.includes(user.id);
    const next = had ? voters.filter((v) => v !== user.id) : voters.concat([user.id]);

    await entity.update(id, { voter_ids: next, votes: next.length });
    return Response.json({ votes: next.length, voted: !had });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}