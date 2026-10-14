// Scratch Relay replacements (not in purple.js). Guest members leaning Purple.
import { registerGuests } from '/home/user/patrons/src/engine/v4/content/index.js';
import { extraTurns, spareSpace } from '/home/user/patrons/src/engine/v4/content/purple.js';
const m = (key, name, s, w, text, extra = {}) => ({ key, name, lean: 'purple', s, w, text, f: 1, n: 1, ...extra });
const room = ctx => { let open = 0; ctx.state.quadrants.forEach((qid, q) => ctx.quadrant(qid).actions.forEach((a, i) => { if (a.ring <= ctx.state.round && ctx.state.slots[`${q}-${i}`] === undefined) open++; })); return open - ctx.state.queue.filter(t => t.t === 'turn').length; };
registerGuests('scratch', [
  m('cheer', 'Cheerleaders', 4, 2, 'Whenever you take an extra turn, +1 follower.', {
    onExtraTurn(ctx, owner) { owner.bonus += 1; },
  }),
  m('sprinter', 'Sprinter', 4, 2, 'When you place your first worker of a round, take an extra turn right after this one.', {
    afterAction(ctx, owner, card) { if (card.r === ctx.state.round) return; card.r = ctx.state.round; extraTurns(ctx, owner, 1, 'Sprinter'); },
  }),
  m('nightowl', 'Night Owl', 4, 2, 'When you place your last worker of a round, take an extra turn right after this one.', {
    afterAction(ctx, owner, card) { if (owner.left !== 0 || card.r === ctx.state.round) return; card.r = ctx.state.round; extraTurns(ctx, owner, 1, 'Night Owl'); },
  }),
  m('relief', 'Relief Crew', 4, 2, 'Once per game: take 2 extra turns right after this one.', {
    activate: 'game',
    onActivate(ctx, owner, card) { if (!extraTurns(ctx, owner, 2, 'Relief Crew')) card.used = false; },
    botActivate: ctx => ctx.state.round === 3 && room(ctx) >= 2,
  }),
]);
