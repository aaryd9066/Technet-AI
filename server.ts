import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("technet.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT,
    picture TEXT,
    credits INTEGER DEFAULT 50,
    last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_locked INTEGER DEFAULT 0
  );
  
  CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    type TEXT,
    url TEXT,
    prompt TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    amount INTEGER,
    type TEXT,
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  INSERT OR IGNORE INTO settings (key, value) VALUES ('payments_locked', 'false');
`);

// Migration: Ensure username and payment_locked columns exist
try {
  const columns = db.prepare("PRAGMA table_info(users)").all() as any[];
  const columnNames = columns.map(c => c.name);
  
  if (!columnNames.includes("username")) {
    db.exec("ALTER TABLE users ADD COLUMN username TEXT");
  }
  if (!columnNames.includes("payment_locked")) {
    db.exec("ALTER TABLE users ADD COLUMN payment_locked INTEGER DEFAULT 0");
  }
} catch (err) {
  console.error("Migration failed:", err);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "technet-secret-123",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: true,
        sameSite: "none",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Auth Middleware
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log(`requireAdmin check: ${req.url} - adminParam=${req.query.admin}`);
    if (isAdmin(req)) {
      console.log(`requireAdmin: Access GRANTED for ${req.url}`);
      next();
    } else {
      console.log(`requireAdmin: Access DENIED for ${req.url}`);
      res.status(403).json({ error: "Forbidden: Developer access only" });
    }
  };

  const getUserId = (req: express.Request) => (req.session as any).userId;

  const isAdmin = (req: express.Request) => {
    // Ultimate bypass for developer
    if (req.query.admin === "true") {
      console.log("isAdmin: Bypass GRANTED via query parameter");
      return true;
    }
    
    const userId = getUserId(req);
    if (!userId) {
      console.log("isAdmin: Access DENIED - No userId and no bypass");
      return false;
    }
    
    const normalizedId = String(userId).toLowerCase().trim();
    const isDev = normalizedId.includes("aarydeshmane9066") || 
                  normalizedId === "admin" || 
                  normalizedId === "aarydeshmane" || 
                  normalizedId.includes("aarydeshmane9066@gmail.com");
    
    console.log(`isAdmin check: userId="${userId}", isDev=${isDev}`);
    return isDev;
  };

  // --- Auth Routes ---
  app.post("/api/auth/profile", (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }

      const userId = username.toLowerCase().trim();
      console.log(`Login Attempt - Username: "${username}", Created UserID: "${userId}"`);

      // Password check for specific users - Removed for easier access
      /*
      if (userId === "aarydeshmane9066") {
        if (!password) {
          return res.status(401).json({ error: "Password required for developer account" });
        }
        if (password !== "aary90deshmane66") {
          return res.status(401).json({ error: "Invalid password for developer account" });
        }
      } else if (userId === "admin") {
        if (!password) {
          return res.status(401).json({ error: "Password required for admin account" });
        }
        if (password !== "admin123") {
          return res.status(401).json({ error: "Invalid password for admin account" });
        }
      }
      */

      let user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
      
      if (!user) {
        db.prepare("INSERT INTO users (id, username, credits) VALUES (?, ?, ?)")
          .run(userId, username, 50);
      } else {
        db.prepare("UPDATE users SET username = ? WHERE id = ?")
          .run(username, userId);
      }

      (req.session as any).userId = userId;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Failed to save session" });
        }
        const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
        res.json({ success: true, user: updatedUser });
      });
    } catch (error: any) {
      console.error("Login route error:", error);
      res.status(500).json({ error: error.message || "Internal server error during login" });
    }
  });

  app.get("/api/auth/force-admin", (req, res) => {
    (req.session as any).userId = "admin";
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ error: "Failed to save session" });
      }
      console.log("Force Admin Bypass: Session set to 'admin' and saved");
      res.json({ success: true, userId: "admin" });
    });
  });

  app.get("/api/auth/debug", (req, res) => {
    res.json({
      session: req.session,
      userId: (req.session as any).userId,
      isAdmin: isAdmin(req),
      cookies: req.cookies
    });
  });

  app.get("/api/auth/me", (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.json({ user: null });
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    res.json({ user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // --- User & Media Routes ---
  app.get("/api/user/stats", requireAuth, (req, res) => {
    const userId = getUserId(req);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    const media = db.prepare("SELECT * FROM media WHERE user_id = ? ORDER BY timestamp DESC").all(userId);
    res.json({ user, media });
  });

  app.post("/api/user/deduct", requireAuth, (req, res) => {
    const userId = getUserId(req);
    const { amount, description } = req.body;
    const user = db.prepare("SELECT credits FROM users WHERE id = ?").get(userId) as any;
    
    if (user && user.credits >= amount) {
      db.prepare("UPDATE users SET credits = credits - ? WHERE id = ?").run(amount, userId);
      db.prepare("INSERT INTO transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)")
        .run(Date.now().toString(), userId, amount, "deduction", description || "AI Generation");
      res.json({ success: true, remaining: user.credits - amount });
    } else {
      res.status(400).json({ error: "Insufficient credits" });
    }
  });

  app.post("/api/user/add-credits", requireAuth, (req, res) => {
    const userId = getUserId(req);
    const { amount, method } = req.body;
    
    const settings = db.prepare("SELECT value FROM settings WHERE key = 'payments_locked'").get() as any;
    if (settings && settings.value === "true") {
      return res.status(403).json({ error: "Payments are currently locked by the administrator." });
    }

    const userRecord = db.prepare("SELECT payment_locked FROM users WHERE id = ?").get(userId) as any;
    if (userRecord?.payment_locked) {
      return res.status(403).json({ error: "Payments are locked for your account. Please contact support." });
    }

    db.prepare("UPDATE users SET credits = credits + ? WHERE id = ?").run(amount, userId);
    db.prepare("INSERT INTO transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)")
      .run(Date.now().toString(), userId, amount, "addition", `Purchase via ${method || "unknown"}`);
    const user = db.prepare("SELECT credits FROM users WHERE id = ?").get(userId) as any;
    res.json({ success: true, credits: user.credits });
  });

  app.post("/api/media/save", requireAuth, (req, res) => {
    const userId = getUserId(req);
    const { id, type, url, prompt } = req.body;
    db.prepare("INSERT INTO media (id, user_id, type, url, prompt) VALUES (?, ?, ?, ?, ?)")
      .run(id, userId, type, url, prompt);
    res.json({ success: true });
  });

  app.delete("/api/media/:id", requireAuth, (req, res) => {
    const userId = getUserId(req);
    const { id } = req.params;
    db.prepare("DELETE FROM media WHERE id = ? AND user_id = ?").run(id, userId);
    res.json({ success: true });
  });

  // --- Admin Routes ---
  app.get("/api/admin/super-bypass", (req, res) => {
    console.log("SUPER BYPASS ACCESSED");
    try {
      const transactions = db.prepare(`
        SELECT t.*, u.username 
        FROM transactions t 
        LEFT JOIN users u ON t.user_id = u.id 
        ORDER BY t.timestamp DESC 
        LIMIT 100
      `).all();
      
      const userStats = db.prepare("SELECT username, credits, id, payment_locked FROM users").all();
      const totalCredits = db.prepare("SELECT SUM(credits) as total FROM users").get() as any;
      const totalTransactions = db.prepare("SELECT COUNT(*) as count FROM transactions").get() as any;

      res.json({ 
        transactions, 
        userStats,
        summary: {
          totalUsers: userStats.length,
          totalCreditsInSystem: totalCredits.total || 0,
          totalTransactions: totalTransactions.count
        }
      });
    } catch (err) {
      console.error("Super Bypass Error:", err);
      res.status(500).json({ error: "Super bypass failed" });
    }
  });

  app.get("/api/admin/monitor", requireAdmin, (req, res) => {
    const userId = getUserId(req);
    console.log(`Admin Monitor Access - UserID: "${userId}" - START`);
    
    try {
      console.log("Admin Monitor: Fetching transactions...");
      const transactions = db.prepare(`
        SELECT t.*, u.username 
        FROM transactions t 
        LEFT JOIN users u ON t.user_id = u.id 
        ORDER BY t.timestamp DESC 
        LIMIT 100
      `).all();
      console.log(`Admin Monitor: Found ${transactions.length} transactions`);
      
      console.log("Admin Monitor: Fetching user stats...");
      const userStats = db.prepare("SELECT username, credits, id, payment_locked FROM users").all();
      console.log(`Admin Monitor: Found ${userStats.length} users`);

      console.log("Admin Monitor: Fetching summary...");
      const totalCredits = db.prepare("SELECT SUM(credits) as total FROM users").get() as any;
      const totalTransactions = db.prepare("SELECT COUNT(*) as count FROM transactions").get() as any;

      console.log("Admin Monitor: Sending response");
      res.json({ 
        transactions, 
        userStats,
        summary: {
          totalUsers: userStats.length,
          totalCreditsInSystem: totalCredits.total || 0,
          totalTransactions: totalTransactions.count
        }
      });
    } catch (err) {
      console.error("Admin Monitor Error:", err);
      res.status(500).json({ error: "Internal server error in monitor" });
    }
  });

  app.get("/api/admin/super-bypass-settings", (req, res) => {
    console.log("SUPER BYPASS SETTINGS ACCESSED");
    try {
      const settings = db.prepare("SELECT * FROM settings").all();
      const settingsMap = settings.reduce((acc: any, s: any) => {
        acc[s.key] = s.value;
        return acc;
      }, {});
      res.json(settingsMap);
    } catch (err) {
      console.error("Super Bypass Settings Error:", err);
      res.status(500).json({ error: "Super bypass settings failed" });
    }
  });

  app.get("/api/admin/settings", requireAdmin, (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsMap = settings.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json(settingsMap);
  });

  app.post("/api/admin/settings", requireAdmin, (req, res) => {
    const { key, value } = req.body;
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value.toString());
    res.json({ success: true });
  });

  app.post("/api/admin/toggle-user-payment-lock", requireAdmin, (req, res) => {
    const { targetUserId, locked } = req.body;
    db.prepare("UPDATE users SET payment_locked = ? WHERE id = ?").run(locked ? 1 : 0, targetUserId);
    res.json({ success: true });
  });

  app.post("/api/admin/adjust-credits", requireAdmin, (req, res) => {
    const { targetUserId, amount, type, description } = req.body;
    
    if (type === "add") {
      db.prepare("UPDATE users SET credits = credits + ? WHERE id = ?").run(amount, targetUserId);
    } else {
      db.prepare("UPDATE users SET credits = MAX(0, credits - ?) WHERE id = ?").run(amount, targetUserId);
    }
    
    db.prepare("INSERT INTO transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)")
      .run(Date.now().toString(), targetUserId, amount, type === "add" ? "addition" : "deduction", `Admin Adjustment: ${description || "Manual"}`);
      
    res.json({ success: true });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Technet AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
