import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { POINTS, grantPoints, todayKey } from '../../shared/vibe.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in to earn points.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const questionId = body.questionId ? String(body.questionId) : '';
    const roomId = body.roomId ? String(body.roomId) : '';
    const round = typeof body.round === 'number' ? body.round : -1;

    let amount = 0;
    let actionKey = '';
    let patch = {};

    if (action === 'daily') {
      amount = POINTS.daily;
      actionKey = `daily:${todayKey()}`;
    } else if (action === 'quiz') {
      amount = POINTS.quiz;
      actionKey = `quiz:${todayKey()}`;
      patch = { quizzes: 1 };
    } else if (action === 'take') {
      if (!questionId) return Response.json({ error: 'Missing question.' }, { status: 400 });
      const question = await base44.asServiceRole.entities.Question.get(questionId);
      if (!question || question.is_active === false) {
        return Response.json({ error: 'That question is no longer active.' }, { status: 404 });
      }
      amount = POINTS.take;
      actionKey = `take:${question.id}`;
      patch = { takes: 1 };
    } else if (action === 'room_create') {
      if (!roomId) return Response.json({ error: 'Missing room.' }, { status: 400 });
      const room = await base44.asServiceRole.entities.GameRoom.get(roomId);
      if (!room || room.host_id !== user.id) {
        return Response.json({ error: 'Only the host earns host points.' }, { status: 403 });
      }
      amount = POINTS.room_create;
      actionKey = `roomCreate:${room.id}`;
      patch = { rooms_hosted: 1 };
    } else if (action === 'room_answer') {
      if (!roomId || round < 0) return Response.json({ error: 'Missing round.' }, { status: 400 });
      const room = await base44.asServiceRole.entities.GameRoom.get(roomId);
      const isPlayer = room && (room.players || []).some((p) => p.user_id === user.id);
      if (!isPlayer) return Response.json({ error: 'Join the room to earn round points.' }, { status: 403 });
      amount = POINTS.room_answer;
      actionKey = `roomAnswer:${room.id}:${round}`;
    } else {
      return Response.json({ error: 'Unknown action.' }, { status: 400 });
    }

    const result = await grantPoints(base44, user, { action, actionKey, amount, patch });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}