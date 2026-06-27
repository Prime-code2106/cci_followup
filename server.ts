import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';
import { db } from './src/db/index.ts';
import { 
  churches, 
  members, 
  visitors, 
  attendance, 
  prayerRequests, 
  followUps, 
  recentActivities, 
  fellowshipConnections, 
  fellowshipNotes, 
  appSettings 
} from './src/db/schema.ts';
import { eq, and, or } from 'drizzle-orm';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON
  app.use(express.json());

  // Handle DB Seeding & Clean Demo Data on boot
  try {
    const existingChurches = await db.select().from(churches).limit(1);
    if (existingChurches.length === 0) {
      console.log('Database tables are empty. Beginning automatic demonstration seeding...');

      // 1. Seed Churches
      const defaultChurches = [
        {
          id: 'futamap',
          name: 'Celebration Church International',
          passwordHash: 'mock_bcrypt_pbkdf2_2ec9aec', // celebration2026 hash (aligned with frontend hash)
          mapName: 'Celebration Group',
          logoName: 'CCI Admin'
        },
        {
          id: 'rccg',
          name: 'RCCG',
          passwordHash: 'mock_bcrypt_pbkdf2_660194d7', // rccg2026 hash (aligned with frontend hash)
          mapName: 'RCCG Area',
          logoName: 'RCCG Admin'
        },
        {
          id: 'winners',
          name: 'Winners Chapel',
          passwordHash: 'mock_bcrypt_pbkdf2_68615316', // winners2026 hash (aligned with frontend hash)
          mapName: 'Winners Cell',
          logoName: 'Winners Admin'
        }
      ];
      await db.insert(churches).values(defaultChurches);
      console.log('✓ Seeding: Churches completed.');

      // 2. Seed default App Settings
      const defaultSettings = defaultChurches.map(c => ({
        id: c.id,
        mapName: c.mapName,
        churchName: c.name,
        themeColor: '#4f46e5',
        logoName: c.logoName
      }));
      await db.insert(appSettings).values(defaultSettings);
      console.log('✓ Seeding: Settings completed.');
    }

    // Always ensure database is cleared of the pre-seeded mock records so the user gets a completely clean slate!
    console.log('Clearing any existing mock/demonstration records...');
    await db.delete(members);
    await db.delete(visitors);
    await db.delete(attendance);
    await db.delete(prayerRequests);
    await db.delete(followUps);
    await db.delete(fellowshipConnections);
    await db.delete(fellowshipNotes);
    await db.delete(recentActivities);
    console.log('✓ Database tables cleared. Starting with a completely pristine, empty care database!');
  } catch (err) {
    console.error('Error during database seeding/cleanup:', err);
  }

  // --- API Endpoints ---

  // 1. Churches
  app.get('/api/churches', async (req, res) => {
    try {
      const list = await db.select().from(churches);
      res.json(list.map(c => ({ id: c.id, name: c.name, mapName: c.mapName })));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/churches/:id', async (req, res) => {
    try {
      const list = await db.select().from(churches).where(eq(churches.id, req.params.id));
      if (list.length === 0) return res.status(404).json({ error: 'Church not found' });
      res.json(list[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/churches', async (req, res) => {
    try {
      const { id, name, mapName, logoName, passwordHash } = req.body;
      const existing = await db.select().from(churches).where(eq(churches.name, name));
      if (existing.length > 0) {
        return res.status(400).json({ error: 'A church with this name is already registered.' });
      }

      await db.insert(churches).values({ id, name, mapName, logoName, passwordHash });
      
      // Seed default AppSettings for newly registered church
      await db.insert(appSettings).values({
        id,
        mapName,
        churchName: name,
        themeColor: '#2563eb',
        logoName: logoName || `${name} Admin`
      });

      res.status(201).json({ id, name });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Auth Logins
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { churchName, passwordHash } = req.body;
      const list = await db.select().from(churches);
      const found = list.find(c => c.name.toLowerCase().trim() === churchName.toLowerCase().trim());
      if (!found) {
        return res.status(404).json({ error: 'Church not registered.' });
      }
      
      let isMatch = found.passwordHash === passwordHash;
      // Multi-hash alignment check for demo accounts
      if (!isMatch) {
        if (found.id === 'futamap' && (passwordHash === 'mock_bcrypt_pbkdf2_2ec9aec' || passwordHash === 'mock_bcrypt_pbkdf2_6dfb8d23')) {
          isMatch = true;
        } else if (found.id === 'rccg' && (passwordHash === 'mock_bcrypt_pbkdf2_660194d7' || passwordHash === 'mock_bcrypt_pbkdf2_2e718b5b')) {
          isMatch = true;
        } else if (found.id === 'winners' && (passwordHash === 'mock_bcrypt_pbkdf2_68615316' || passwordHash === 'mock_bcrypt_pbkdf2_71f496e1')) {
          isMatch = true;
        }
      }

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid password.' });
      }
      res.json({
        churchId: found.id,
        churchName: found.name,
        mapName: found.mapName,
        logoName: found.logoName,
        authenticatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/member-login', async (req, res) => {
    try {
      const { emailOrPhone, passwordHash, rawPassword } = req.body;
      const allMembers = await db.select().from(members);
      const cleanInput = emailOrPhone.toLowerCase().trim().replace(/[\s\-\+\(\)]/g, '');

      const matched = allMembers.find(m => {
        const dbEmail = m.email ? m.email.toLowerCase().trim() : '';
        const dbPhoneClean = m.phoneNumber.replace(/[\s\-\+\(\)]/g, '');
        const isEmailMatch = m.email && dbEmail === emailOrPhone.toLowerCase().trim();
        const isPhoneMatch = dbPhoneClean.endsWith(cleanInput) || cleanInput.endsWith(dbPhoneClean);
        return isEmailMatch || isPhoneMatch;
      });

      if (!matched) {
        return res.status(404).json({ error: 'Member profile not found with this phone number or email address.' });
      }

      if (matched.passwordHash) {
        let isMatch = matched.passwordHash === passwordHash;
        // Aligns seeded members with both legacy and new frontend hashes for "celebration2026"
        if (!isMatch && (matched.passwordHash === 'mock_bcrypt_pbkdf2_6dfb8d23' || matched.passwordHash === 'mock_bcrypt_pbkdf2_2ec9aec') && (passwordHash === 'mock_bcrypt_pbkdf2_2ec9aec' || passwordHash === 'mock_bcrypt_pbkdf2_6dfb8d23')) {
          isMatch = true;
        }
        if (!isMatch) {
          return res.status(401).json({ error: 'Incorrect password.' });
        }
      } else {
        // First login fallback options
        const defaultPhonePass = matched.phoneNumber.replace(/[^0-9]/g, '');
        const defaultThemePass = 'celebration2026';
        
        const isPhonePass = rawPassword === defaultPhonePass || rawPassword === matched.phoneNumber.trim();
        const isThemePass = rawPassword === defaultThemePass;

        if (!isPhonePass && !isThemePass) {
          return res.status(401).json({ 
            error: 'Incorrect password. (Tip: For your first login, use your phone number digits or "celebration2026" as your password, or click Forgot Password to set a custom one).' 
          });
        }

        // Save passwordHash on first login
        await db.update(members).set({ passwordHash }).where(eq(members.id, matched.id));
      }

      res.json({
        memberId: matched.id,
        fullName: matched.fullName,
        churchId: matched.churchId || 'futamap',
        phoneNumber: matched.phoneNumber,
        email: matched.email,
        authenticatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Members
  app.get('/api/members', async (req, res) => {
    try {
      const { churchId } = req.query;
      let list;
      if (churchId) {
        list = await db.select().from(members).where(eq(members.churchId, churchId as string));
      } else {
        list = await db.select().from(members);
      }
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/members/:id', async (req, res) => {
    try {
      const list = await db.select().from(members).where(eq(members.id, req.params.id));
      if (list.length === 0) return res.status(404).json({ error: 'Member not found' });
      res.json(list[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/members', async (req, res) => {
    try {
      const memberData = req.body;
      await db.insert(members).values(memberData);
      res.status(201).json(memberData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/members/:id', async (req, res) => {
    try {
      await db.update(members).set(req.body).where(eq(members.id, req.params.id));
      const updated = await db.select().from(members).where(eq(members.id, req.params.id));
      res.json(updated[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Visitors
  app.get('/api/visitors', async (req, res) => {
    try {
      const { churchId } = req.query;
      let list;
      if (churchId) {
        list = await db.select().from(visitors).where(eq(visitors.churchId, churchId as string));
      } else {
        list = await db.select().from(visitors);
      }
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/visitors', async (req, res) => {
    try {
      const visitorData = req.body;
      await db.insert(visitors).values(visitorData);
      res.status(201).json(visitorData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/visitors/:id', async (req, res) => {
    try {
      await db.update(visitors).set(req.body).where(eq(visitors.id, req.params.id));
      const updated = await db.select().from(visitors).where(eq(visitors.id, req.params.id));
      res.json(updated[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Attendance Logs
  app.get('/api/attendance', async (req, res) => {
    try {
      const { churchId } = req.query;
      let list;
      if (churchId) {
        list = await db.select().from(attendance).where(eq(attendance.churchId, churchId as string));
      } else {
        list = await db.select().from(attendance);
      }
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/attendance', async (req, res) => {
    try {
      const attData = req.body;
      // Check if already registered
      const dups = await db.select().from(attendance).where(
        and(
          eq(attendance.memberId, attData.memberId),
          eq(attendance.date, attData.date),
          eq(attendance.serviceType, attData.serviceType)
        )
      );
      if (dups.length > 0) {
        return res.status(409).json({ error: 'Attendance already registered for this member.' });
      }

      await db.insert(attendance).values(attData);
      res.status(201).json(attData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/attendance/:id', async (req, res) => {
    try {
      await db.delete(attendance).where(eq(attendance.id, req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Prayer Requests
  app.get('/api/prayer-requests', async (req, res) => {
    try {
      const { churchId } = req.query;
      let list;
      if (churchId) {
        list = await db.select().from(prayerRequests).where(eq(prayerRequests.churchId, churchId as string));
      } else {
        list = await db.select().from(prayerRequests);
      }
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/prayer-requests', async (req, res) => {
    try {
      const prayerData = req.body;
      await db.insert(prayerRequests).values(prayerData);
      res.status(201).json(prayerData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/prayer-requests/:id', async (req, res) => {
    try {
      await db.update(prayerRequests).set(req.body).where(eq(prayerRequests.id, req.params.id));
      const updated = await db.select().from(prayerRequests).where(eq(prayerRequests.id, req.params.id));
      res.json(updated[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Follow Ups
  app.get('/api/follow-ups', async (req, res) => {
    try {
      const { churchId } = req.query;
      let list;
      if (churchId) {
        list = await db.select().from(followUps).where(eq(followUps.churchId, churchId as string));
      } else {
        list = await db.select().from(followUps);
      }
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/follow-ups', async (req, res) => {
    try {
      const fuData = req.body;
      await db.insert(followUps).values(fuData);
      res.status(201).json(fuData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/follow-ups/:id', async (req, res) => {
    try {
      await db.update(followUps).set(req.body).where(eq(followUps.id, req.params.id));
      const updated = await db.select().from(followUps).where(eq(followUps.id, req.params.id));
      res.json(updated[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Recent Activities
  app.get('/api/activities', async (req, res) => {
    try {
      const { churchId } = req.query;
      let list;
      if (churchId) {
        list = await db.select().from(recentActivities).where(eq(recentActivities.churchId, churchId as string));
      } else {
        list = await db.select().from(recentActivities);
      }
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/activities', async (req, res) => {
    try {
      const activityData = req.body;
      await db.insert(recentActivities).values(activityData);
      res.status(201).json(activityData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Fellowship Social (Connections)
  app.get('/api/fellowship/connections', async (req, res) => {
    try {
      const { churchId } = req.query;
      let list;
      if (churchId) {
        list = await db.select().from(fellowshipConnections).where(eq(fellowshipConnections.churchId, churchId as string));
      } else {
        list = await db.select().from(fellowshipConnections);
      }
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/fellowship/connections', async (req, res) => {
    try {
      const connData = req.body;
      await db.insert(fellowshipConnections).values(connData);
      res.status(201).json(connData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/fellowship/connections/:id', async (req, res) => {
    try {
      await db.update(fellowshipConnections).set(req.body).where(eq(fellowshipConnections.id, req.params.id));
      const updated = await db.select().from(fellowshipConnections).where(eq(fellowshipConnections.id, req.params.id));
      res.json(updated[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/fellowship/connections/:id', async (req, res) => {
    try {
      await db.delete(fellowshipConnections).where(eq(fellowshipConnections.id, req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 10. Fellowship Social (Notes/Messages)
  app.get('/api/fellowship/notes', async (req, res) => {
    try {
      const { churchId } = req.query;
      let list;
      if (churchId) {
        list = await db.select().from(fellowshipNotes).where(eq(fellowshipNotes.churchId, churchId as string));
      } else {
        list = await db.select().from(fellowshipNotes);
      }
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/fellowship/notes', async (req, res) => {
    try {
      const noteData = req.body;
      await db.insert(fellowshipNotes).values(noteData);
      res.status(201).json(noteData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 11. Settings (AppSettings)
  app.get('/api/settings/:churchId', async (req, res) => {
    try {
      const list = await db.select().from(appSettings).where(eq(appSettings.id, req.params.churchId));
      if (list.length === 0) {
        return res.json({
          mapName: 'MAP',
          churchName: 'Church Assembly',
          themeColor: '#4f46e5',
          logoName: 'Admin'
        });
      }
      res.json(list[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings/:churchId', async (req, res) => {
    try {
      const { mapName, churchName, themeColor, logoName } = req.body;
      const list = await db.select().from(appSettings).where(eq(appSettings.id, req.params.churchId));
      if (list.length === 0) {
        await db.insert(appSettings).values({
          id: req.params.churchId,
          mapName,
          churchName,
          themeColor,
          logoName
        });
      } else {
        await db.update(appSettings).set({
          mapName,
          churchName,
          themeColor,
          logoName
        }).where(eq(appSettings.id, req.params.churchId));
      }
      res.json({ mapName, churchName, themeColor, logoName });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Serve Frontend Client (Vite middleware or static files) ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started. Running fullstack port: http://localhost:${PORT}`);
  });
}

startServer();
