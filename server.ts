import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fs from "fs";
import multer from "multer";
import { Storage } from "@google-cloud/storage";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import { Volume, createFsFromVolume } from "memfs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";
const DB_PATH = path.join(__dirname, "db.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");

// Initialize DB if not exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], projects: [] }, null, 2));
}

// Initialize Uploads dir
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

const storage = new Storage();
const bucketName = "dirtnapp";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const getDB = () => JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
const saveDB = (data: any) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(morgan("dev"));
  app.use(compression());
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for development/iframe flexibility
    crossOriginEmbedderPolicy: false,
  }));
  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Auth APIs
  app.post("/api/auth/register", async (req, res) => {
    const { username, email, password } = req.body;
    const db = getDB();

    if (db.users.find((u: any) => u.email === email)) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: crypto.randomUUID(),
      username,
      email,
      password: hashedPassword,
      bio: "",
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    };

    db.users.push(newUser);
    saveDB(db);

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET);
    res.json({ token, user: { id: newUser.id, username: newUser.username, email: newUser.email, bio: newUser.bio, avatarUrl: newUser.avatarUrl } });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const db = getDB();
    const user = db.users.find((u: any) => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, bio: user.bio, avatarUrl: user.avatarUrl } });
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    const db = getDB();
    const user = db.users.find((u: any) => u.id === req.user.id);
    if (!user) return res.sendStatus(404);
    res.json({ id: user.id, username: user.username, email: user.email, bio: user.bio, avatarUrl: user.avatarUrl });
  });

  // Scraper Integration API
  app.get("/api/scrapes", authenticateToken, (req, res) => {
    const offlineDir = path.join(process.cwd(), 'output', 'offline_clone');
    if (!fs.existsSync(offlineDir)) {
      return res.json([]);
    }
    const files = fs.readdirSync(offlineDir).filter(f => f.endsWith('.html'));
    res.json(files.map(f => ({
      filename: f,
      name: f.replace('.html', ''),
      time: fs.statSync(path.join(offlineDir, f)).mtimeMs
    })));
  });

  app.post("/api/scrapes/import", authenticateToken, (req: any, res) => {
    const { filename } = req.body;
    const filePath = path.join(process.cwd(), 'output', 'offline_clone', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Scrape not found" });
    }

    const html = fs.readFileSync(filePath, 'utf-8');
    const db = getDB();

    const newProject = {
      id: crypto.randomUUID(),
      name: `Scrape: ${filename.replace('.html', '')}`,
      code: {
        html: html,
        css: "",
        js: "",
        php: "",
        react: "",
        md: ""
      },
      assets: [],
      updatedAt: Date.now(),
      userId: req.user.id,
      isPublic: false
    };

    db.projects.push(newProject);
    saveDB(db);
    res.json(newProject);
  });

  app.post("/api/internal/import-scrape", express.json({limit: '50mb'}), (req, res) => {
    const { name, html, css, js, assets } = req.body;
    const db = getDB();
    
    const defaultUser = db.users[0]; 
    if (!defaultUser) {
      return res.status(400).json({error: "No users exist. Please create an account first."});
    }

    const newProject = {
      id: crypto.randomUUID(),
      name: name || "Scraped Site",
      code: {
        html: html || "",
        css: css || "",
        js: js || "",
        php: "",
        react: "",
        md: ""
      },
      assets: assets || [],
      updatedAt: Date.now(),
      userId: defaultUser.id,
      isPublic: false
    };

    db.projects.push(newProject);
    saveDB(db);
    res.json({ success: true, projectId: newProject.id });
  });

  // Search API
  app.get("/api/projects/search", (req, res) => {
    const { q, category, startDate, endDate, minConfidence, sort = "updatedAt", order = "desc" } = req.query;
    const db = getDB();
    let results = [...db.projects];

    if (q) {
      const query = (q as string).toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.code.html && p.code.html.toLowerCase().includes(query)) ||
        (p.code.css && p.code.css.toLowerCase().includes(query)) ||
        (p.code.js && p.code.js.toLowerCase().includes(query)) ||
        (p.code.php && p.code.php.toLowerCase().includes(query)) ||
        (p.code.react && p.code.react.toLowerCase().includes(query)) ||
        (p.code.md && p.code.md.toLowerCase().includes(query))
      );
    }

    if (category) {
      results = results.filter(p => p.category === category);
    }

    if (startDate) {
      results = results.filter(p => p.updatedAt >= Number(startDate));
    }

    if (endDate) {
      results = results.filter(p => p.updatedAt <= Number(endDate));
    }

    if (minConfidence) {
      results = results.filter(p => (p.confidenceScore || 0) >= Number(minConfidence));
    }

    results.sort((a, b) => {
      const valA = a[sort as string];
      const valB = b[sort as string];
      if (order === "asc") return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

    res.json(results);
  });

  app.post("/api/projects", authenticateToken, (req: any, res) => {
    const project = req.body;
    const db = getDB();
    const index = db.projects.findIndex((p: any) => p.id === project.id);
    
    if (index !== -1) {
      const oldProject = db.projects[index];
      
      // Check permission
      const isOwner = oldProject.userId === req.user.id;
      const isEditor = oldProject.sharedWith?.some((u: any) => u.email === req.user.email && u.role === 'editor');
      
      if (!isOwner && !isEditor) return res.sendStatus(403);

      // Create a version from the old state before updating
      if (!oldProject.versions) oldProject.versions = [];
      
      // Only add a version if the code actually changed and createVersion is true
      const codeChanged = JSON.stringify(oldProject.code) !== JSON.stringify(project.code);
      
      if (codeChanged && req.body.createVersion) {
        oldProject.versions.push({
          id: crypto.randomUUID(),
          code: JSON.parse(JSON.stringify(oldProject.code)),
          message: req.body.versionMessage || `Manual snapshot`,
          updatedAt: oldProject.updatedAt || Date.now()
        });
        // Limit to last 20 versions
        if (oldProject.versions.length > 20) {
          oldProject.versions.shift();
        }
      }
      
      db.projects[index] = { 
        ...project, 
        userId: oldProject.userId, // Maintain original owner
        versions: oldProject.versions,
        isPublic: oldProject.isPublic, // Maintain sharing settings if not owner
        sharedWith: oldProject.sharedWith
      };

      // If owner is saving, they can update sharing settings too if they were in the body
      if (isOwner) {
        if (project.isPublic !== undefined) db.projects[index].isPublic = project.isPublic;
        if (project.sharedWith !== undefined) db.projects[index].sharedWith = project.sharedWith;
      }

    } else {
      db.projects.push({ ...project, userId: req.user.id, versions: [] });
    }
    
    saveDB(db);
    res.json({ status: "ok" });
  });

  app.patch("/api/projects/:id/sharing", authenticateToken, (req: any, res) => {
    const db = getDB();
    const projectIndex = db.projects.findIndex((p: any) => p.id === req.params.id);
    if (projectIndex === -1) return res.sendStatus(404);
    const project = db.projects[projectIndex];
    
    // Only owner can change sharing settings
    if (project.userId !== req.user.id) return res.sendStatus(403);

    const { isPublic, sharedWith } = req.body;
    if (isPublic !== undefined) project.isPublic = isPublic;
    if (sharedWith !== undefined) project.sharedWith = sharedWith;

    saveDB(db);
    res.json(project);
  });

  app.get("/api/projects/list", authenticateToken, (req: any, res) => {
    const db = getDB();
    const ownedProjects = db.projects.filter((p: any) => p.userId === req.user.id);
    res.json(ownedProjects);
  });

  app.get("/api/projects/shared", authenticateToken, (req: any, res) => {
    const db = getDB();
    const sharedProjects = db.projects.filter((p: any) => 
      p.sharedWith?.some((u: any) => u.email === req.user.email)
    );
    res.json(sharedProjects);
  });

  app.get("/api/projects/:id/versions", authenticateToken, (req: any, res) => {
    const db = getDB();
    const project = db.projects.find((p: any) => p.id === req.params.id);
    if (!project) return res.sendStatus(404);
    if (project.userId !== req.user.id) return res.sendStatus(403);
    res.json(project.versions || []);
  });

  // Git APIs
  app.post("/api/projects/:id/git/init", authenticateToken, async (req: any, res) => {
    const db = getDB();
    const projectIndex = db.projects.findIndex((p: any) => p.id === req.params.id);
    if (projectIndex === -1) return res.sendStatus(404);
    const project = db.projects[projectIndex];
    if (project.userId !== req.user.id) return res.sendStatus(403);

    const vol = new Volume();
    vol.mkdirSync('/project', { recursive: true });
    vol.writeFileSync('/project/index.html', project.code.html || '');
    vol.writeFileSync('/project/styles.css', project.code.css || '');
    vol.writeFileSync('/project/script.js', project.code.js || '');
    vol.writeFileSync('/project/index.php', project.code.php || '');
    vol.writeFileSync('/project/App.tsx', project.code.react || '');
    vol.writeFileSync('/project/README.md', project.code.md || '');
    
    const fsObj = createFsFromVolume(vol);
    
    try {
      await git.init({ fs: fsObj as any, dir: '/project' });
      
      const json = vol.toJSON();
      const gitState: any = {};
      for (const key in json) {
        if (key.startsWith('/project/.git')) {
          gitState[key.replace('/project/', '')] = json[key];
        }
      }
      project.gitState = gitState;
      saveDB(db);
      res.json({ status: "ok" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/projects/:id/git/status", authenticateToken, async (req: any, res) => {
    const db = getDB();
    const project = db.projects.find((p: any) => p.id === req.params.id);
    if (!project) return res.sendStatus(404);
    if (project.userId !== req.user.id) return res.sendStatus(403);
    if (!project.gitState) return res.json({ isRepo: false });

    const vol = new Volume();
    vol.fromJSON(project.gitState, '/project');
    vol.writeFileSync('/project/index.html', project.code.html || '');
    vol.writeFileSync('/project/styles.css', project.code.css || '');
    vol.writeFileSync('/project/script.js', project.code.js || '');
    vol.writeFileSync('/project/index.php', project.code.php || '');
    vol.writeFileSync('/project/App.tsx', project.code.react || '');
    vol.writeFileSync('/project/README.md', project.code.md || '');
    
    const fsObj = createFsFromVolume(vol);
    
    try {
      const statusMatrix = await git.statusMatrix({ fs: fsObj as any, dir: '/project' });
      const changes = statusMatrix.filter(row => row[1] !== row[2] || row[2] !== row[3]);
      res.json({ isRepo: true, changes });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/projects/:id/git/commit", authenticateToken, async (req: any, res) => {
    const { message, code } = req.body;
    const db = getDB();
    const projectIndex = db.projects.findIndex((p: any) => p.id === req.params.id);
    if (projectIndex === -1) return res.sendStatus(404);
    const project = db.projects[projectIndex];
    if (project.userId !== req.user.id) return res.sendStatus(403);
    if (!project.gitState) return res.status(400).json({ error: "Not a git repo" });

    const vol = new Volume();
    vol.fromJSON(project.gitState, '/project');
    
    // Use provided code or fallback to project code
    const html = code?.html ?? project.code.html ?? '';
    const css = code?.css ?? project.code.css ?? '';
    const js = code?.js ?? project.code.js ?? '';
    const php = code?.php ?? project.code.php ?? '';
    const react = code?.react ?? project.code.react ?? '';
    const md = code?.md ?? project.code.md ?? '';

    vol.writeFileSync('/project/index.html', html);
    vol.writeFileSync('/project/styles.css', css);
    vol.writeFileSync('/project/script.js', js);
    vol.writeFileSync('/project/index.php', php);
    vol.writeFileSync('/project/App.tsx', react);
    vol.writeFileSync('/project/README.md', md);
    
    const fsObj = createFsFromVolume(vol);
    
    try {
      await git.add({ fs: fsObj as any, dir: '/project', filepath: '.' });
      const sha = await git.commit({ 
        fs: fsObj as any, 
        dir: '/project', 
        message: message || 'Update', 
        author: { name: req.user.username || 'User', email: req.user.email } 
      });
      
      const json = vol.toJSON();
      const gitState: any = {};
      for (const key in json) {
        if (key.startsWith('/project/.git')) {
          gitState[key.replace('/project/', '')] = json[key];
        }
      }
      project.gitState = gitState;
      saveDB(db);
      res.json({ status: "ok", sha });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/projects/:id/git/log", authenticateToken, async (req: any, res) => {
    const db = getDB();
    const project = db.projects.find((p: any) => p.id === req.params.id);
    if (!project) return res.sendStatus(404);
    if (project.userId !== req.user.id) return res.sendStatus(403);
    if (!project.gitState) return res.json([]);

    const vol = new Volume();
    vol.fromJSON(project.gitState, '/project');
    const fsObj = createFsFromVolume(vol);
    
    try {
      const commits = await git.log({ fs: fsObj as any, dir: '/project' });
      res.json(commits);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/projects/:id/git/clone", authenticateToken, async (req: any, res) => {
    const { url, username, password } = req.body;
    const db = getDB();
    const project = db.projects.find((p: any) => p.id === req.params.id);
    if (!project) return res.sendStatus(404);
    if (project.userId !== req.user.id) return res.sendStatus(403);

    const vol = new Volume();
    const fsObj = createFsFromVolume(vol);

    try {
      await git.clone({
        fs: fsObj as any,
        http,
        dir: '/project',
        url: url,
        singleBranch: true,
        depth: 1,
        onAuth: () => ({ username, password })
      });

      // Extract code from cloned files
      const fileMap: Record<string, any> = {
        'index.html': 'html',
        'styles.css': 'css',
        'script.js': 'js',
        'index.php': 'php',
        'App.tsx': 'react',
        'README.md': 'md'
      };

      for (const [filename, key] of Object.entries(fileMap)) {
        try {
          const content = vol.readFileSync(`/project/${filename}`, 'utf8').toString();
          project.code[key] = content;
        } catch (e) {}
      }

      const json = vol.toJSON();
      const gitState: any = {};
      for (const key in json) {
        if (key.startsWith('/project/.git')) {
          gitState[key.replace('/project/', '')] = json[key];
        }
      }
      project.gitState = gitState;
      saveDB(db);

      res.json(project);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/projects/:id/git/remote", authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    const db = getDB();
    const project = db.projects.find((p: any) => p.id === id);

    if (!project || !project.gitState) return res.json({ url: null });

    const vol = new Volume();
    vol.fromJSON(project.gitState, '/project');
    const fsObj = createFsFromVolume(vol);

    try {
      const remotes = await git.listRemotes({ fs: fsObj as any, dir: '/project' });
      const origin = remotes.find(r => r.remote === 'origin');
      res.json({ url: origin ? origin.url : null });
    } catch (error) {
      res.json({ url: null });
    }
  });

  app.post("/api/projects/:id/git/config", authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    const { remoteUrl } = req.body;
    const db = getDB();
    const project = db.projects.find((p: any) => p.id === id);

    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!project.gitState) return res.status(400).json({ error: "Not a git repository" });

    const vol = new Volume();
    vol.fromJSON(project.gitState, '/project');
    const fsObj = createFsFromVolume(vol);

    try {
      // Remove existing remote if it exists
      try {
        await git.deleteRemote({ fs: fsObj as any, dir: '/project', remote: 'origin' });
      } catch (e) {
        // Ignore if it doesn't exist
      }

      await git.addRemote({
        fs: fsObj as any,
        dir: '/project',
        remote: 'origin',
        url: remoteUrl
      });

      // Update git state
      const json = vol.toJSON();
      const gitState: any = {};
      for (const key in json) {
        if (key.startsWith('/project/.git')) {
          gitState[key.replace('/project/', '')] = json[key];
        }
      }
      project.gitState = gitState;
      project.updatedAt = Date.now();
      saveDB(db);

      res.json({ status: "ok" });
    } catch (error: any) {
      console.error("Git config error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/projects/:id/git/push", authenticateToken, async (req: any, res) => {
    const { remoteUrl, username, password } = req.body;
    const db = getDB();
    const project = db.projects.find((p: any) => p.id === req.params.id);
    if (!project) return res.sendStatus(404);
    if (project.userId !== req.user.id) return res.sendStatus(403);
    if (!project.gitState) return res.status(400).json({ error: "Not a git repository" });

    const vol = new Volume();
    vol.fromJSON(project.gitState, '/project');
    vol.writeFileSync('/project/index.html', project.code.html || '');
    vol.writeFileSync('/project/styles.css', project.code.css || '');
    vol.writeFileSync('/project/script.js', project.code.js || '');
    vol.writeFileSync('/project/index.php', project.code.php || '');
    vol.writeFileSync('/project/App.tsx', project.code.react || '');
    vol.writeFileSync('/project/README.md', project.code.md || '');
    
    const fsObj = createFsFromVolume(vol);

    try {
      await git.addRemote({
        fs: fsObj as any,
        dir: '/project',
        remote: 'origin',
        url: remoteUrl,
        force: true
      });

      const pushResult = await git.push({
        fs: fsObj as any,
        http,
        dir: '/project',
        remote: 'origin',
        ref: 'master',
        onAuth: () => ({ username, password })
      });

      const json = vol.toJSON();
      const gitState: any = {};
      for (const key in json) {
        if (key.startsWith('/project/.git')) {
          gitState[key.replace('/project/', '')] = json[key];
        }
      }
      project.gitState = gitState;
      saveDB(db);

      res.json({ success: true, result: pushResult });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/projects/:id/git/pull", authenticateToken, async (req: any, res) => {
    const { remoteUrl, username, password } = req.body;
    const db = getDB();
    const project = db.projects.find((p: any) => p.id === req.params.id);
    if (!project) return res.sendStatus(404);
    if (project.userId !== req.user.id) return res.sendStatus(403);
    if (!project.gitState) return res.status(400).json({ error: "Not a git repository" });

    const vol = new Volume();
    vol.fromJSON(project.gitState, '/project');
    vol.writeFileSync('/project/index.html', project.code.html || '');
    vol.writeFileSync('/project/styles.css', project.code.css || '');
    vol.writeFileSync('/project/script.js', project.code.js || '');
    vol.writeFileSync('/project/index.php', project.code.php || '');
    vol.writeFileSync('/project/App.tsx', project.code.react || '');
    vol.writeFileSync('/project/README.md', project.code.md || '');
    
    const fsObj = createFsFromVolume(vol);

    try {
      await git.addRemote({
        fs: fsObj as any,
        dir: '/project',
        remote: 'origin',
        url: remoteUrl,
        force: true
      });

      await git.pull({
        fs: fsObj as any,
        http,
        dir: '/project',
        remote: 'origin',
        ref: 'master',
        singleBranch: true,
        author: {
          name: req.user.username || 'User',
          email: req.user.email
        },
        onAuth: () => ({ username, password })
      });

      const fileMap: Record<string, any> = {
        'index.html': 'html',
        'styles.css': 'css',
        'script.js': 'js',
        'index.php': 'php',
        'App.tsx': 'react',
        'README.md': 'md'
      };

      for (const [filename, key] of Object.entries(fileMap)) {
        try {
          const content = await fsObj.promises.readFile(`/project/${filename}`, 'utf8');
          project.code[key] = content as string;
        } catch (e) {}
      }

      const json = vol.toJSON();
      const gitState: any = {};
      for (const key in json) {
        if (key.startsWith('/project/.git')) {
          gitState[key.replace('/project/', '')] = json[key];
        }
      }
      project.gitState = gitState;
      saveDB(db);

      res.json(project);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/projects/:id/git/restore", authenticateToken, async (req: any, res) => {
    const { commitId } = req.body;
    const db = getDB();
    const project = db.projects.find((p: any) => p.id === req.params.id);
    if (!project) return res.sendStatus(404);
    if (project.userId !== req.user.id) return res.sendStatus(403);
    if (!project.gitState) return res.status(400).json({ error: "Not a git repository" });

    const vol = new Volume();
    vol.fromJSON(project.gitState, '/project');
    const fsObj = createFsFromVolume(vol);

    try {
      await git.checkout({
        fs: fsObj as any,
        dir: '/project',
        ref: commitId,
        force: true
      });

      const fileMap: Record<string, any> = {
        'index.html': 'html',
        'styles.css': 'css',
        'script.js': 'js',
        'index.php': 'php',
        'App.tsx': 'react',
        'README.md': 'md'
      };

      for (const [filename, key] of Object.entries(fileMap)) {
        try {
          const content = await fsObj.promises.readFile(`/project/${filename}`, 'utf8');
          project.code[key] = content as string;
        } catch (e) {}
      }

      // Save current state as a version before restoring
      if (!project.versions) project.versions = [];
      project.versions.push({
        id: crypto.randomUUID(),
        code: JSON.parse(JSON.stringify(project.code)),
        message: `Backup before restoring Git: ${commitId.substring(0, 7)}`,
        updatedAt: project.updatedAt || Date.now()
      });

      project.updatedAt = Date.now();
      
      // Update git state
      const json = vol.toJSON();
      const gitState: any = {};
      for (const key in json) {
        if (key.startsWith('/project/.git')) {
          gitState[key.replace('/project/', '')] = json[key];
        }
      }
      project.gitState = gitState;

      saveDB(db);
      res.json(project);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/projects/:id/restore", authenticateToken, (req: any, res) => {
    const { versionId } = req.body;
    const db = getDB();
    const projectIndex = db.projects.findIndex((p: any) => p.id === req.params.id);
    
    if (projectIndex === -1) return res.sendStatus(404);
    const project = db.projects[projectIndex];
    if (project.userId !== req.user.id) return res.sendStatus(403);

    const version = project.versions?.find((v: any) => v.id === versionId);
    if (!version) return res.status(404).json({ error: "Version not found" });

    // Save current state as a version before restoring
    project.versions.push({
      id: crypto.randomUUID(),
      code: JSON.parse(JSON.stringify(project.code)),
      message: `Backup before restoring snapshot: ${versionId.substring(0, 7)}`,
      updatedAt: project.updatedAt || Date.now()
    });

    project.code = version.code;
    project.updatedAt = Date.now();

    saveDB(db);
    res.json(project);
  });

  app.post("/api/projects/:id/scan", authenticateToken, (req: any, res) => {
    const db = getDB();
    const projectIndex = db.projects.findIndex((p: any) => p.id === req.params.id);
    if (projectIndex === -1) return res.sendStatus(404);
    const project = db.projects[projectIndex];
    if (project.userId !== req.user.id) return res.sendStatus(403);

    // Simulated security scan logic
    const vulnerabilities = [
      {
        id: crypto.randomUUID(),
        title: "XSS Risk in HTML",
        description: "Detected unescaped user input in HTML templates.",
        severity: "high",
        status: "detected",
        category: "Injection",
        detectedAt: Date.now(),
        autoRemediable: true,
        remediationAction: "Apply HTML escaping to all dynamic content."
      },
      {
        id: crypto.randomUUID(),
        title: "Missing Security Headers",
        description: "Content-Security-Policy header is not configured.",
        severity: "medium",
        status: "detected",
        category: "Configuration",
        detectedAt: Date.now(),
        autoRemediable: true,
        remediationAction: "Inject CSP meta tag into HTML head."
      },
      {
        id: crypto.randomUUID(),
        title: "Weak Password Policy",
        description: "Password generation tool defaults to low complexity.",
        severity: "low",
        status: "detected",
        category: "Authentication",
        detectedAt: Date.now(),
        autoRemediable: false,
        remediationAction: "Update password generation settings manually."
      },
      {
        id: crypto.randomUUID(),
        title: "Insecure Cookie Configuration",
        description: "Cookies are missing the 'Secure' and 'HttpOnly' flags.",
        severity: "critical",
        status: "detected",
        category: "Session Management",
        detectedAt: Date.now(),
        autoRemediable: true,
        remediationAction: "Update cookie middleware configuration."
      }
    ];

    project.vulnerabilities = vulnerabilities;
    saveDB(db);
    res.json(vulnerabilities);
  });

  app.post("/api/projects/:id/remediate", authenticateToken, (req: any, res) => {
    const { vulnerabilityId } = req.body;
    const db = getDB();
    const projectIndex = db.projects.findIndex((p: any) => p.id === req.params.id);
    if (projectIndex === -1) return res.sendStatus(404);
    const project = db.projects[projectIndex];
    if (project.userId !== req.user.id) return res.sendStatus(403);

    const vulnerability = project.vulnerabilities?.find((v: any) => v.id === vulnerabilityId);
    if (!vulnerability) return res.status(404).json({ error: "Vulnerability not found" });
    if (!vulnerability.autoRemediable) return res.status(400).json({ error: "Not auto-remediable" });

    // Simulate remediation process
    vulnerability.status = "resolved";
    
    // In a real app, we would actually modify the project code here
    // For example, if it's a missing CSP header, we'd inject it into project.code.html
    if (vulnerability.title === "Missing Security Headers") {
      const cspTag = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\';">';
      if (!project.code.html.includes("Content-Security-Policy")) {
        if (project.code.html.includes("<head>")) {
          project.code.html = project.code.html.replace("<head>", `<head>\n  ${cspTag}`);
        } else {
          project.code.html = `<html>\n<head>\n  ${cspTag}\n</head>\n${project.code.html}</html>`;
        }
      }
    }

    saveDB(db);
    res.json(vulnerability);
  });

  app.get("/api/projects/:id", (req: any, res) => {
    const db = getDB();
    const project = db.projects.find((p: any) => p.id === req.params.id);
    if (!project) return res.sendStatus(404);

    // Check public access
    if (project.isPublic) return res.json(project);

    // Check private access (requires token)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      
      const isOwner = project.userId === user.id;
      const isShared = project.sharedWith?.some((u: any) => u.email === user.email);
      
      if (isOwner || isShared) {
        res.json(project);
      } else {
        res.sendStatus(403);
      }
    });
  });

  // File Upload API
  app.post("/api/upload", authenticateToken, upload.single("file"), async (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const blob = storage.bucket(bucketName).file(`${Date.now()}-${req.file.originalname}`);
    const blobStream = blob.createWriteStream({
      resumable: false,
      gzip: true,
    });

    blobStream.on("error", (err) => {
      console.error("GCS Upload Error:", err);
      // Fallback to local storage if GCS fails (e.g. no credentials)
      const localPath = path.join(UPLOADS_DIR, `${Date.now()}-${req.file.originalname}`);
      fs.writeFileSync(localPath, req.file.buffer);
      res.json({
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${path.basename(localPath)}`,
      });
    });

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
      res.json({
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        url: publicUrl,
      });
    });

    blobStream.end(req.file.buffer);
  });

  // Serve local uploads as fallback
  app.use("/uploads", express.static(UPLOADS_DIR));

  // File Delete API
  app.delete("/api/upload/:filename", authenticateToken, async (req: any, res) => {
    const { filename } = req.params;
    
    try {
      // Try to delete from GCS
      await storage.bucket(bucketName).file(filename).delete();
    } catch (err) {
      console.error("GCS Delete Error (might be local file):", err);
      // Try to delete from local storage
      const localPath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }
    
    res.json({ status: "ok" });
  });

  // Base44-style Backend Features
  app.post("/api/tools/hash", (req, res) => {
    const { text, algorithm = "sha256" } = req.body;
    try {
      const hash = crypto.createHash(algorithm).update(text).digest("hex");
      res.json({ result: hash });
    } catch (error) {
      res.status(400).json({ error: "Invalid algorithm" });
    }
  });

  app.get("/api/tools/uuid", (req, res) => {
    res.json({ result: crypto.randomUUID() });
  });

  app.post("/api/tools/password", (req, res) => {
    const { length = 16 } = req.body;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    res.json({ result: retVal });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
