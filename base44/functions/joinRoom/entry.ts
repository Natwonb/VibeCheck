import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { getOrCreateProfile } from '../../shared/vibe.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in to join a room.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const code = String(body.code || '').trim().toUpperCase();
    if (!code) return Response.json({ error: 'Enter a room code.' }, { status: 400 });

    const sr = base44.asServiceRole.entities;
    const found = await sr.GameRoom.filter({ code }, { limit: 1 });
    const room = found.items && found.items[0];
    if (!room) {
      return Response.json({ error: 'No room with that code. Double check the letters and try again.' }, { status: 404 });
    }
    if (room.status === 'finished') {
      return Response.json({ error: 'That room has already finished.' }, { status: 400 });
    }

    const players = room.players || [];
    if (!players.some((p) => p.user_id === user.id)) {
      if (players.length >= 12) {
        return Response.json({ error: 'That room is full (12 players max).' }, { status: 400 });
      }
      const profile = await getOrCreateProfile(base44, user);
      players.push({
        user_id: user.id,
        display_name: profile.display_name,
        avatar: profile.avatar || '🦄'
      });
      await sr.GameRoom.update(room.id, { players });
    }

    return Response.json({ room: { ...room, players } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}