import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { grantPoints, POINTS } from '../../shared/vibe.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const roomId = String(body.roomId || '');
    if (!roomId) return Response.json({ error: 'Missing room.' }, { status: 400 });

    const sr = base44.asServiceRole.entities;
    const room = await sr.GameRoom.get(roomId);
    if (!room) return Response.json({ error: 'Room not found.' }, { status: 404 });
    if (room.host_id !== user.id) {
      return Response.json({ error: 'Only the host can end the game.' }, { status: 403 });
    }
    if (room.status === 'finished') {
      return Response.json({ room, standings: room.players || [] });
    }

    const answers = await sr.RoomAnswer.filter({ room_id: room.id }, { limit: 400 });
    const roundWins = {};
    if (room.mode === 'most_likely') {
      (answers.items || []).forEach((a) => {
        if (a.target_name) roundWins[a.target_name] = (roundWins[a.target_name] || 0) + 1;
      });
    }

    const players = room.players || [];
    for (const player of players) {
      const wins = roundWins[player.display_name] || 0;
      await grantPoints(
        base44,
        { id: player.user_id, full_name: player.display_name },
        {
          action: 'room',
          actionKey: `roomDone:${room.id}`,
          amount: POINTS.room + wins * 10,
          patch: { games_played: 1, wins: wins > 0 ? 1 : 0 }
        }
      );
    }

    const winnerName = Object.keys(roundWins).sort((a, b) => roundWins[b] - roundWins[a])[0] || '';
    const updated = await sr.GameRoom.update(room.id, {
      status: 'finished',
      revealed: true,
      winner_name: winnerName
    });

    return Response.json({ room: updated, standings: players, roundWins });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}