import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { grantPoints } from '../../shared/vibe.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in to play.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const questionId = String(body.questionId || '');
    const choice = String(body.choice || '').toLowerCase();
    if (!questionId) return Response.json({ error: 'Missing question.' }, { status: 400 });
    if (!['a', 'b', 'c', 'd'].includes(choice)) {
      return Response.json({ error: 'Pick one of the options.' }, { status: 400 });
    }

    const sr = base44.asServiceRole.entities;
    const question = await sr.Question.get(questionId);
    if (!question || question.is_active === false) {
      return Response.json({ error: 'That question is no longer available.' }, { status: 404 });
    }

    const optionField = `option_${choice}`;
    if (!question[optionField]) {
      return Response.json({ error: 'That option is not part of this question.' }, { status: 400 });
    }

    const votesField = `votes_${choice}`;
    const patch = {};
    patch[votesField] = (question[votesField] || 0) + 1;
    const updated = await sr.Question.update(question.id, patch);

    const grant = await grantPoints(base44, user, {
      action: 'solo',
      actionKey: `solo:${question.id}`,
      amount: 10,
      patch: { games_played: 1 }
    });

    return Response.json({
      counts: {
        a: updated.votes_a || 0,
        b: updated.votes_b || 0,
        c: updated.votes_c || 0,
        d: updated.votes_d || 0
      },
      awarded: grant.awarded,
      amount: grant.amount,
      total: grant.total,
      newAchievements: grant.newAchievements
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}