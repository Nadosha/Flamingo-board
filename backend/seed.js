/**
 * Mock data seed -- "DevLog Sprint 1"
 *
 * Usage:
 *   docker compose exec backend node seed.js
 *   cd backend && node seed.js
 *
 * Credentials:
 *   alex.morgan@devlog.io  /  Demo1234!   (owner)
 *   sarah.chen@devlog.io   /  Demo1234!   (member)
 */
'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/holymoly';
const { Schema } = mongoose;

const userSchema = new Schema(
  { email: String, password: String, full_name: String, avatar_url: { type: String, default: null } },
  { timestamps: true }
);
const workspaceSchema = new Schema(
  { name: String, slug: String, owner_id: Schema.Types.ObjectId },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);
const workspaceMemberSchema = new Schema(
  { workspace_id: Schema.Types.ObjectId, user_id: Schema.Types.ObjectId, role: String },
  { timestamps: { createdAt: 'joined_at', updatedAt: false } }
);
const boardSchema = new Schema(
  { name: String, workspace_id: Schema.Types.ObjectId, color: String, description: String, created_by: Schema.Types.ObjectId },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);
const columnSchema = new Schema(
  { board_id: Schema.Types.ObjectId, name: String, position: Number },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);
const labelSchema = new Schema(
  { workspace_id: Schema.Types.ObjectId, name: String, color: String },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);
const cardSchema = new Schema(
  {
    column_id: Schema.Types.ObjectId,
    title: String,
    description: { type: String, default: null },
    position: Number,
    due_date: { type: Date, default: null },
    created_by: Schema.Types.ObjectId,
    assignee_ids: [Schema.Types.ObjectId],
    label_ids: [Schema.Types.ObjectId],
    priority: { type: String, enum: ['low', 'medium', 'high', null], default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);
const cardActivitySchema = new Schema(
  {
    card_id: Schema.Types.ObjectId,
    user_id: Schema.Types.ObjectId,
    type: String,
    content: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

const days = (n) => {
  const d = new Date('2026-04-02T12:00:00.000Z');
  d.setDate(d.getDate() + n);
  return d;
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to ' + MONGO_URI);

  const User            = mongoose.model('User',            userSchema);
  const Workspace       = mongoose.model('Workspace',       workspaceSchema);
  const WorkspaceMember = mongoose.model('WorkspaceMember', workspaceMemberSchema);
  const Board           = mongoose.model('Board',           boardSchema);
  const Column          = mongoose.model('Column',          columnSchema);
  const Label           = mongoose.model('Label',           labelSchema);
  const Card            = mongoose.model('Card',            cardSchema);
  const CardActivity    = mongoose.model('CardActivity',    cardActivitySchema);

  if (await Workspace.findOne({ slug: 'acme-dev' })) {
    console.log('Seed already applied. Drop the holymoly DB to re-seed.');
    await mongoose.disconnect();
    return;
  }

  const [h1, h2] = await Promise.all([bcrypt.hash('Demo1234!', 12), bcrypt.hash('Demo1234!', 12)]);
  const alex  = await User.create({ email: 'alex.morgan@devlog.io',  password: h1, full_name: 'Alex Morgan',  avatar_url: null });
  const sarah = await User.create({ email: 'sarah.chen@devlog.io',   password: h2, full_name: 'Sarah Chen',   avatar_url: null });
  console.log('Users: ' + alex.email + ', ' + sarah.email);

  const ws = await Workspace.create({ name: 'Acme Dev Team', slug: 'acme-dev', owner_id: alex._id });
  await WorkspaceMember.create([
    { workspace_id: ws._id, user_id: alex._id,  role: 'owner'  },
    { workspace_id: ws._id, user_id: sarah._id, role: 'member' },
  ]);
  console.log('Workspace: ' + ws.name);

  const [lBe, lFe, lBug, lAI, lOps] = await Label.create([
    { workspace_id: ws._id, name: 'Backend',  color: '#0052cc' },
    { workspace_id: ws._id, name: 'Frontend', color: '#00875a' },
    { workspace_id: ws._id, name: 'Bug',      color: '#bf2600' },
    { workspace_id: ws._id, name: 'AI',       color: '#8b5cf6' },
    { workspace_id: ws._id, name: 'DevOps',   color: '#ff8800' },
  ]);
  console.log('Labels: Backend, Frontend, Bug, AI, DevOps');

  const board = await Board.create({
    workspace_id: ws._id, name: 'DevLog -- Sprint 1',
    color: '#7c3aed', created_by: alex._id,
    description: 'First sprint: core CRUD, real-time sync, AI agents.',
  });
  console.log('Board: ' + board.name + ' (' + board._id + ')');

  const [cBL, cIP, cRV, cDN] = await Column.create([
    { board_id: board._id, name: 'Backlog',     position: 0 },
    { board_id: board._id, name: 'In Progress', position: 1 },
    { board_id: board._id, name: 'Review / QA', position: 2 },
    { board_id: board._id, name: 'Done',        position: 3 },
  ]);
  console.log('Columns created');

  // Backlog
  const c1 = await Card.create({ column_id: cBL._id, position: 0, priority: 'high',   due_date: days(3),   created_by: alex._id,  assignee_ids: [alex._id],           label_ids: [lOps._id],         title: 'Set up CI/CD pipeline for staging',       description: '## Goal\nAutomate deployment to staging on every push to main.\n\n## Acceptance criteria\n- GitHub Actions builds Docker images\n- Push to Docker Hub\n- SSH deploy on staging VM\n- Slack notification on success/failure' });
  const c2 = await Card.create({ column_id: cBL._id, position: 1, priority: 'medium', due_date: days(5),   created_by: alex._id,  assignee_ids: [sarah._id],          label_ids: [lBe._id],          title: 'Integrate Stripe payment webhook',         description: '## Context\nHandle invoice.payment_failed to downgrade accounts.\n\n## Steps\n1. POST /api/webhooks/stripe with Stripe-Signature verification\n2. Update workspace plan field\n3. Notify via SendGrid' });
  const c3 = await Card.create({ column_id: cBL._id, position: 2, priority: 'low',    due_date: days(7),   created_by: sarah._id, assignee_ids: [],                   label_ids: [lFe._id],          title: 'Improve mobile responsiveness of sidebar', description: 'Sidebar overlaps board on screens < 768px. Collapse into slide-over Sheet on mobile.' });

  // In Progress -- 2 overdue
  const c4 = await Card.create({ column_id: cIP._id, position: 0, priority: 'high',   due_date: days(-1),  created_by: alex._id,  assignee_ids: [alex._id],           label_ids: [lAI._id, lBe._id], title: 'Build AI task prioritization agent',      description: '## What\nRanks open cards by urgency with one-line reasoning.\n\n## Approach\n1. getBoardWithColumns\n2. Urgency = priority_weight + age_days/7 + overdue*5\n3. GPT senior-PM prompt\n\n## Status\nCore done. Needs streaming UI + error boundary.' });
  const c5 = await Card.create({ column_id: cIP._id, position: 1, priority: 'high',   due_date: days(-1),  created_by: sarah._id, assignee_ids: [sarah._id],          label_ids: [lFe._id, lBug._id],title: 'Fix drag-and-drop on mobile Safari',       description: '## Bug\niOS Safari 17+: long-press does not start drag.\n\n## Root cause\ntouch-action: none in global CSS conflicts with @hello-pangea/dnd.\n\n## Fix\nRemove override from drag handle wrapper.' });
  const c6 = await Card.create({ column_id: cIP._id, position: 2, priority: 'medium', due_date: days(1),   created_by: sarah._id, assignee_ids: [sarah._id],          label_ids: [lFe._id],          title: 'Implement card search & keyword filter',  description: 'Filters visible cards by title substring client-side. Scope: title-only for sprint 1.' });

  // Review / QA
  const c7 = await Card.create({ column_id: cRV._id, position: 0, priority: 'medium', due_date: days(2),   created_by: alex._id,  assignee_ids: [alex._id],           label_ids: [lBe._id],          title: 'Add unit tests for auth service',          description: 'AuthService.register + AuthService.login with Vitest + NestJS testing module.\nCases: duplicate email 409, wrong password 401, success returns user + sets cookie.' });
  const c8 = await Card.create({ column_id: cRV._id, position: 1, priority: 'low',    due_date: days(2),   created_by: sarah._id, assignee_ids: [sarah._id],          label_ids: [lFe._id],          title: 'Dark mode: fix button contrast in dialogs',description: 'Primary button contrast 2.8:1 in dark mode. WAI-ARIA min 4.5:1. Fix --primary token in tailwind.theme.js.' });

  // Done
  const c9  = await Card.create({ column_id: cDN._id, position: 0, priority: null,    due_date: days(-10), created_by: alex._id,  assignee_ids: [alex._id],           label_ids: [lBe._id],          title: 'Design MongoDB database schema',           description: '## Delivered\nUsers, Workspaces, Members, Invites, Boards, Columns, Cards, CardActivity, Labels.\nVirtual id fields. Compound index on WorkspaceMember(workspace_id, user_id).' });
  const c10 = await Card.create({ column_id: cDN._id, position: 1, priority: null,    due_date: days(-14), created_by: alex._id,  assignee_ids: [alex._id, sarah._id], label_ids: [lBe._id, lFe._id], title: 'Initial Next.js + NestJS project scaffold', description: 'NestJS 10 (port 4000) + Next.js 16 App Router (port 3000). Docker Compose. Tailwind CSS + shadcn/ui. TypeScript strict mode.' });
  console.log('10 cards created');

  // Activities
  const allCards = [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10];
  await CardActivity.create([
    ...allCards.map((c) => ({ card_id: c._id, user_id: c.created_by, type: 'card_created', content: 'Created card "' + c.title + '"' })),
    { card_id: c4._id, user_id: alex._id,  type: 'card_commented', content: 'Initial prototype working. Urgency scoring solid. Still need streaming response + error boundary in the prioritization panel.' },
    { card_id: c5._id, user_id: sarah._id, type: 'card_commented', content: 'Reproduced on iPhone 13 (Safari 17.4). touch-action: none on drag handle is the culprit. Will fix today.' },
    { card_id: c6._id, user_id: alex._id,  type: 'card_commented', content: 'Scope title-only for sprint 1. Full-text Atlas search in sprint 2.' },
    { card_id: c2._id, user_id: alex._id,  type: 'assignee_added', content: 'Added assignee', metadata: { assignee_id: sarah._id.toString() } },
  ]);
  console.log('Activities created');

  console.log('\n' + '='.repeat(56));
  console.log('  Seed complete!');
  console.log('');
  console.log('  Board ID : ' + board._id.toString());
  console.log('  URL      : http://localhost:3000/workspaces');
  console.log('');
  console.log('  alex.morgan@devlog.io  /  Demo1234!  (owner)');
  console.log('  sarah.chen@devlog.io   /  Demo1234!  (member)');
  console.log('='.repeat(56) + '\n');

  await mongoose.disconnect();
}

seed().catch((err) => { console.error('Seed failed:', err.message); process.exit(1); });
