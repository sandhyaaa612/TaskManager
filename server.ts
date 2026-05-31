import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Task, User, Session, TaskStage, TaskPriority, UserDTO } from './src/types';

// Main Express Server Setup
const app = express();
const PORT = 3000;

// Enable JSON bodies safely (especially on serverless hosts like Vercel which pre-parse bodies)
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    next();
  } else {
    express.json()(req, res, next);
  }
});

const DB_PATH = process.env.VERCEL
  ? '/tmp/db.json'
  : path.join(process.cwd(), 'db.json');

// --- DATABASE ACCESS HELPER ---
interface DatabaseContent {
  users: User[];
  tasks: Task[];
  sessions: Session[];
}

function readDB(): DatabaseContent {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const defaultDB: DatabaseContent = { users: [], tasks: [], sessions: [] };
      
      // Seed initial database state if we are running in Vercel from the packaged db.json
      if (process.env.VERCEL) {
        const rootDBPath = path.join(process.cwd(), 'db.json');
        if (fs.existsSync(rootDBPath)) {
          const rootData = fs.readFileSync(rootDBPath, 'utf-8');
          fs.writeFileSync(DB_PATH, rootData, 'utf-8');
          return JSON.parse(rootData);
        }
      }
      
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2), 'utf-8');
      return defaultDB;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Read DB Error, returning defaults:', err);
    return { users: [], tasks: [], sessions: [] };
  }
}

function writeDB(data: DatabaseContent): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Write DB Error:', err);
  }
}

// --- SECURE CRYPTOGRAPHIC AUTH LOGIC ---
function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password: string, salt: string): string {
  // Utilizing PBKDF2 with 1000 iterations and SHA-512 for lightweight secure hashing
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function generateSessionToken(): string {
  return 'sess_' + crypto.randomBytes(32).toString('hex');
}

// --- AUTHENTICATION MIDDLEWARE ---
interface AuthenticatedRequest extends express.Request {
  userId?: string;
}

function authenticate(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header with Bearer token is required' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const db = readDB();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) {
    res.status(410).json({ error: 'Session token is invalid or has logged out' });
    return;
  }
  const now = new Date().toISOString();
  if (session.expiresAt < now) {
    // Remove expired session from db
    db.sessions = db.sessions.filter((s) => s.token !== token);
    writeDB(db);
    res.status(401).json({ error: 'Session has expired, please log in again' });
    return;
  }
  req.userId = session.userId;
  next();
}

// --- API ENDPOINTS ---

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Auth: Register
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Username and password must be non-empty strings' });
    return;
  }

  const trimmedUsername = username.trim();
  if (trimmedUsername.length < 3) {
    res.status(400).json({ error: 'Username must be at least 3 characters long' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long' });
    return;
  }

  const db = readDB();

  // Check unique username (case-insensitive checking to prevent collisions)
  const userExists = db.users.some(
    (u) => u.username.toLowerCase() === trimmedUsername.toLowerCase()
  );
  if (userExists) {
    res.status(409).json({ error: 'Username is already taken' });
    return;
  }

  const userId = 'u_' + crypto.randomUUID();
  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  const newUser: User = {
    id: userId,
    username: trimmedUsername,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);

  // Auto Login upon Registration: generate session
  const token = generateSessionToken();
  // Session active for 7 days
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const newSession: Session = {
    token,
    userId,
    expiresAt,
  };
  db.sessions.push(newSession);

  writeDB(db);

  const userDTO: UserDTO = {
    id: newUser.id,
    username: newUser.username,
    createdAt: newUser.createdAt,
  };

  res.status(201).json({ user: userDTO, token });
});

// Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const db = readDB();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  );

  if (!user) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  // Verify Hash
  const hash = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  // Create Session
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const newSession: Session = {
    token,
    userId: user.id,
    expiresAt,
  };

  db.sessions.push(newSession);
  writeDB(db);

  const userDTO: UserDTO = {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
  };

  res.json({ user: userDTO, token });
});

// Auth: Logout
app.post('/api/auth/logout', authenticate, (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader!.split(' ')[1];

  const db = readDB();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  writeDB(db);

  res.json({ success: true, message: 'Logged out successfully' });
});

// Auth: Me
app.get('/api/auth/me', authenticate, (req: AuthenticatedRequest, res) => {
  const db = readDB();
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) {
    res.status(404).json({ error: 'User database record not found' });
    return;
  }

  const userDTO: UserDTO = {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
  };

  res.json({ user: userDTO });
});

// Tasks: List All (For Authenticated User)
app.get('/api/tasks', authenticate, (req: AuthenticatedRequest, res) => {
  const db = readDB();
  const userTasks = db.tasks.filter((t) => t.userId === req.userId);
  res.json({ tasks: userTasks });
});

// Tasks: Create
app.post('/api/tasks', authenticate, (req: AuthenticatedRequest, res) => {
  const { title, description, stage, priority, dueDate } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    res.status(400).json({ error: 'Title field is required and must exceed whitespace' });
    return;
  }

  const validStages: TaskStage[] = ['Todo', 'In Progress', 'Done'];
  const validPriorities: TaskPriority[] = ['Low', 'Medium', 'High'];

  const finalStage: TaskStage = stage && validStages.includes(stage) ? stage : 'Todo';
  const finalPriority: TaskPriority = priority && validPriorities.includes(priority) ? priority : 'Medium';

  const db = readDB();
  const now = new Date().toISOString();

  const newTask: Task = {
    id: 'task_' + crypto.randomUUID(),
    title: title.trim(),
    description: description ? String(description).trim() : '',
    stage: finalStage,
    priority: finalPriority,
    dueDate: dueDate ? String(dueDate) : undefined,
    userId: req.userId!,
    createdAt: now,
    updatedAt: now,
  };

  db.tasks.push(newTask);
  writeDB(db);

  res.status(201).json({ task: newTask });
});

// Tasks: Update
app.put('/api/tasks/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const taskId = req.params.id;
  const { title, description, stage, priority, dueDate } = req.body;

  const db = readDB();
  const taskIndex = db.tasks.findIndex((t) => t.id === taskId);

  if (taskIndex === -1) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const task = db.tasks[taskIndex];
  
  // Ensure ownership
  if (task.userId !== req.userId) {
    res.status(403).json({ error: 'Access denied: You are not the owner of this task' });
    return;
  }

  const validStages: TaskStage[] = ['Todo', 'In Progress', 'Done'];
  const validPriorities: TaskPriority[] = ['Low', 'Medium', 'High'];

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      res.status(400).json({ error: 'Title cannot be empty' });
      return;
    }
    task.title = title.trim();
  }

  if (description !== undefined) {
    task.description = String(description).trim();
  }

  if (stage !== undefined) {
    if (!validStages.includes(stage)) {
      res.status(400).json({ error: `Invalid stage. Must be one of ${validStages.join(', ')}` });
      return;
    }
    task.stage = stage;
  }

  if (priority !== undefined) {
    if (!validPriorities.includes(priority)) {
      res.status(400).json({ error: `Invalid priority. Must be one of ${validPriorities.join(', ')}` });
      return;
    }
    task.priority = priority;
  }

  if (dueDate !== undefined) {
    task.dueDate = dueDate ? String(dueDate) : undefined;
  }

  task.updatedAt = new Date().toISOString();
  db.tasks[taskIndex] = task;

  writeDB(db);
  res.json({ task });
});

// Tasks: Delete
app.delete('/api/tasks/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const taskId = req.params.id;
  const db = readDB();
  const taskIndex = db.tasks.findIndex((t) => t.id === taskId);

  if (taskIndex === -1) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const task = db.tasks[taskIndex];

  // Ensure ownership
  if (task.userId !== req.userId) {
    res.status(403).json({ error: 'Access denied: You are not the owner of this task' });
    return;
  }

  // Remove task
  db.tasks.splice(taskIndex, 1);
  writeDB(db);

  res.json({ success: true, message: 'Task deleted successfully' });
});


// --- GLOBAL ERROR-HANDLING MIDDLEWARE ---
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Server Exception]:', err);
  res.status(500).json({
    error: 'A server database or system exception occurred inside Vercel.',
    details: err instanceof Error ? err.message : String(err),
  });
});


// --- INITIALIZE & ATTACH VITE WORKSPACE ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Vite] Mounted dev server middleware.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve HTML page
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Production] Serving static files from dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Listening on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
}

// Export the Express server app for external integration/serverless engines (e.g., Vercel Functions)
export default app;

if (!process.env.VERCEL) {
  startServer();
}
