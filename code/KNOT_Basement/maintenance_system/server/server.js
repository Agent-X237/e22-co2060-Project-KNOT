require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const emailService = require('./emailService');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const path = require('path');
// Serve Maintenance Worker Portal (folder with spaces in name)
const workerPortalPath = path.join(__dirname, '..', '..', 'maintenance worker portal');
app.use('/maintenance_worker_portal', express.static(workerPortalPath, { index: 'code.html' }));
console.log('Worker portal static path:', workerPortalPath);

// Initialize missing columns in faults table if they don't exist
async function initDB() {
  try {
    await pool.query('ALTER TABLE faults ADD COLUMN maintenance_notes TEXT');
  } catch(err) {
    if (err.code !== 'ER_DUP_FIELDNAME') console.error("DB init error (notes):", err.message);
  }
  try {
    await pool.query('ALTER TABLE faults MODIFY COLUMN photo_url LONGTEXT');
  } catch(err) {
    try {
      await pool.query('ALTER TABLE faults ADD COLUMN photo_url LONGTEXT');
    } catch(e) {
      console.error("DB init error (photo):", e.message);
    }
  }
  try {
    await pool.query('ALTER TABLE faults ADD COLUMN worker_photo LONGTEXT');
  } catch(err) {
    if (err.code !== 'ER_DUP_FIELDNAME') console.error("DB init error (worker_photo):", err.message);
  }
  try {
    await pool.query('ALTER TABLE faults ADD COLUMN assigned_technician_id INT');
  } catch(err) {
    if (err.code !== 'ER_DUP_FIELDNAME') console.error("DB init error (assigned_technician_id):", err.message);
  }
  try {
    await pool.query('ALTER TABLE faults ADD COLUMN admin_verified TINYINT(1) DEFAULT 0');
  } catch(err) {
    if (err.code !== 'ER_DUP_FIELDNAME') console.error("DB init error (admin_verified):", err.message);
  }
}
initDB();

// Ensure a default admin user exists (fallback credentials)
(async () => {
  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE username = ? OR email = ?', ['admin', 'admin']);
    if (rows.length === 0) {
      await pool.query(
        "INSERT INTO users (email, username, name, password, role) VALUES (?, ?, ?, ?, ?)",
        ['admin', 'admin', 'System Admin', 'adminpass', 'maintenance_admin']
      );
      console.log('Created default admin user (admin / adminpass)');
    }
  } catch (e) {
    console.error('Error ensuring admin user exists:', e.message);
  }
})();

// Helper to format fault to ticket
const formatTicket = (fault) => ({
  id: fault.id,
  ticket_number: `KNT-${1000 + fault.id}`,
  title: fault.title,
  description: fault.description,
  location: fault.location,
  priority: fault.priority,
  status: fault.status === 'In Progress' ? 'In Progress' : fault.status === 'Resolved' ? 'Resolved' : 'Open',
  reported_by: fault.reporter_name || 'Unknown',
  reported_at: fault.created_at,
  maintenance_notes: fault.maintenance_notes || '',
  manager_notes: fault.manager_notes || '',
  category: 'General',
  photo_url: fault.photo_url || null,
  worker_photo: fault.worker_photo || null,
  assigned_technician_id: fault.assigned_technician_id || null,
  assigned_technician_name: fault.technician_name || null,
  admin_verified: fault.admin_verified ? true : false
});

// Login an administrator or worker
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT id, email, username, name, role FROM users WHERE (email = ? OR username = ?) AND password = ?', [username, username, password]);
    if (rows.length > 0) {
      res.json({ token: `mock-jwt-token-${rows[0].id}`, name: rows[0].name, role: rows[0].role, id: rows[0].id });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tickets', async (req, res) => {
  try {
    const { search, priority, status, page = 1, limit = 10 } = req.query;
    let query = `
      SELECT f.*, u.name as reporter_name, tech.name as technician_name
      FROM faults f 
      LEFT JOIN users u ON f.user_id = u.id 
      LEFT JOIN users tech ON f.assigned_technician_id = tech.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (f.title LIKE ? OR f.location LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (priority) {
      query += ` AND f.priority = ?`;
      params.push(priority);
    }
    if (status) {
      query += ` AND f.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY f.created_at DESC`;
    
    const [allRows] = await pool.query(query, params);
    
    const offset = (page - 1) * limit;
    const paginatedRows = allRows.slice(offset, offset + Number(limit));

    res.json({
      data: paginatedRows.map(formatTicket),
      pagination: {
        total: allRows.length,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Server error fetching tickets' });
  }
});

app.get('/api/tickets/stats', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT status FROM faults`);
    
    // Map existing statuses to Open/In Progress/Resolved
    const mappedStatuses = rows.map(r => r.status === 'In Progress' ? 'In Progress' : r.status === 'Resolved' ? 'Resolved' : 'Open');
    
    const open = mappedStatuses.filter(s => s === 'Open').length;
    const inProgress = mappedStatuses.filter(s => s === 'In Progress').length;
    const resolvedToday = mappedStatuses.filter(s => s === 'Resolved').length;
    
    res.json({
      open,
      inProgress,
      resolvedToday,
      resolutionRates: [
        { category: 'Electrical Issues', rate: 85 },
        { category: 'Furniture Repairs', rate: 60 },
        { category: 'HVAC Maintenance', rate: 45 }
      ]
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

app.get('/api/tickets/:id', async (req, res) => {
  try {
    let id = req.params.id;
    if (id.startsWith('KNT-')) {
      id = parseInt(id.replace('KNT-', ''), 10) - 1000;
    }
    
    const [rows] = await pool.query(`
      SELECT f.*, u.name as reporter_name, tech.name as technician_name
      FROM faults f 
      LEFT JOIN users u ON f.user_id = u.id 
      LEFT JOIN users tech ON f.assigned_technician_id = tech.id
      WHERE f.id = ?
    `, [id]);
    
    if (rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    
    res.json(formatTicket(rows[0]));
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Server error fetching ticket' });
  }
});

app.put('/api/tickets/:id', async (req, res) => {
  try {
    let id = req.params.id;
    if (id.startsWith('KNT-')) {
      id = parseInt(id.replace('KNT-', ''), 10) - 1000;
    }

    // Fetch old state before update
    const [oldRows] = await pool.query(`
      SELECT f.*, u.name as reporter_name, u.email as reporter_email, tech.name as tech_name, tech.email as tech_email 
      FROM faults f 
      LEFT JOIN users u ON f.user_id = u.id 
      LEFT JOIN users tech ON f.assigned_technician_id = tech.id 
      WHERE f.id = ?
    `, [id]);
    const oldTicket = oldRows[0] || null;
    
    const { status, maintenance_notes, manager_notes, photo_url, worker_photo, assigned_technician_id, admin_verified } = req.body;
    let targetStatus = status;
    if (assigned_technician_id !== undefined && assigned_technician_id !== null && (!status || status === 'Open')) {
      targetStatus = 'In Progress';
    }

    let updateQuery = 'UPDATE faults SET ';
    const params = [];
    
    if (targetStatus) {
      updateQuery += 'status = ?, ';
      params.push(targetStatus);
      if (targetStatus === 'Resolved') {
        updateQuery += 'resolved_at = CURRENT_TIMESTAMP, ';
      }
    }
    if (maintenance_notes !== undefined) {
      updateQuery += 'maintenance_notes = ?, ';
      params.push(maintenance_notes);
    }
    if (manager_notes !== undefined) {
      updateQuery += 'manager_notes = ?, ';
      params.push(manager_notes);
    }
    if (photo_url !== undefined) {
      updateQuery += 'photo_url = ?, ';
      params.push(photo_url);
    }
    if (worker_photo !== undefined) {
      updateQuery += 'worker_photo = ?, ';
      params.push(worker_photo);
    }
    if (assigned_technician_id !== undefined) {
      updateQuery += 'assigned_technician_id = ?, ';
      params.push(assigned_technician_id);
    }
    if (admin_verified !== undefined) {
      updateQuery += 'admin_verified = ?, ';
      params.push(admin_verified ? 1 : 0);
    }
    
    updateQuery = updateQuery.slice(0, -2) + ' WHERE id = ?';
    params.push(id);
    
    await pool.query(updateQuery, params);

    // Fetch updated ticket with join
    const [updatedRows] = await pool.query(`
      SELECT f.*, u.name as reporter_name, u.email as reporter_email, tech.name as tech_name, tech.email as tech_email 
      FROM faults f 
      LEFT JOIN users u ON f.user_id = u.id 
      LEFT JOIN users tech ON f.assigned_technician_id = tech.id 
      WHERE f.id = ?
    `, [id]);

    const ticket = updatedRows[0];

    if (ticket) {
      // 1. Manager Assigns Work Order to Technician Alex (slminsgaming@gmail.com)
      if (assigned_technician_id !== undefined && Number(assigned_technician_id) !== oldTicket?.assigned_technician_id && assigned_technician_id !== null) {
        emailService.sendTechnicianAssignedNotification(pool, {
          ticket,
          technicianEmail: ticket.tech_email || 'slminsgaming@gmail.com',
          technicianName: ticket.tech_name || 'Technician Alex'
        }).catch(e => console.error("Email notification error:", e.message));
      }

      // 2. Technician Submits Solvation / Proof of Work (Alert to Manager minhaj.dssc1@gmail.com)
      if ((worker_photo !== undefined && worker_photo) || (maintenance_notes !== undefined && maintenance_notes && status !== 'Resolved')) {
        let managerEmail = 'minhaj.dssc1@gmail.com';
        try {
          const [mgrs] = await pool.query('SELECT email FROM users WHERE role = "maintenance_admin" AND email IS NOT NULL');
          if (mgrs.length > 0) managerEmail = mgrs[0].email;
        } catch(e) {}

        emailService.sendTechnicianResolvedNotification(pool, {
          ticket,
          managerEmail,
          technicianName: ticket.tech_name || 'Technician Alex',
          workerNotes: maintenance_notes
        }).catch(e => console.error("Email notification error:", e.message));
      }

      // 3. Manager Issues Next Step to Technician Alex (slminsgaming@gmail.com)
      if (manager_notes !== undefined && manager_notes && (status === 'In Progress' || ticket.status === 'In Progress')) {
        emailService.sendNextStepNotification(pool, {
          ticket,
          technicianEmail: ticket.tech_email || 'slminsgaming@gmail.com',
          technicianName: ticket.tech_name || 'Technician Alex',
          managerNotes: manager_notes
        }).catch(e => console.error("Email notification error:", e.message));
      }

      // 4. Manager Verifies Resolution (Notifies Student e22237@eng.pdn.ac.lk AND Technician Alex slminsgaming@gmail.com)
      if (status === 'Resolved' || (admin_verified && ticket.status === 'Resolved')) {
        emailService.sendTicketResolvedNotification(pool, {
          ticket,
          reporterEmail: ticket.reporter_email || 'e22237@eng.pdn.ac.lk',
          reporterName: ticket.reporter_name || ticket.reported_by || 'Student e22237',
          technicianEmail: ticket.tech_email || 'slminsgaming@gmail.com'
        }).catch(e => console.error("Email notification error:", e.message));
      }
    }

    res.json({ success: true, message: 'Ticket updated successfully' });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Server error updating ticket' });
  }
});

// Create a new ticket / fault report
app.post('/api/tickets', async (req, res) => {
  try {
    const { title, description, location, priority, photo_url, user_id } = req.body;
    if (!title || !location) {
      return res.status(400).json({ error: 'Title and location are required' });
    }
    const [result] = await pool.query(
      `INSERT INTO faults (title, description, location, priority, status, user_id, photo_url, created_at)
       VALUES (?, ?, ?, ?, 'Open', ?, ?, NOW())`,
      [title, description || '', location, priority || 'Medium', user_id || null, photo_url || null]
    );

    const ticketId = result.insertId;
    let reporterName = 'Student User';
    let reporterEmail = 'e22237@eng.pdn.ac.lk';
    if (user_id) {
      const [users] = await pool.query('SELECT name, email, username FROM users WHERE id = ?', [user_id]);
      if (users.length > 0 && users[0].email) {
        reporterName = users[0].name;
        reporterEmail = users[0].email;
      }
    }

    let managerEmail = 'minhaj.dssc1@gmail.com';
    try {
      const [mgrs] = await pool.query('SELECT email FROM users WHERE role = "maintenance_admin" AND email IS NOT NULL');
      if (mgrs.length > 0) managerEmail = mgrs[0].email;
    } catch(e) {}

    const ticketObj = { id: ticketId, title, description, priority, location, status: 'Open', reported_by: reporterName };
    emailService.sendTicketCreatedNotification(pool, {
      ticket: ticketObj,
      reporterEmail,
      reporterName,
      managerEmail
    }).catch(e => console.error("Email notification error:", e.message));

    res.json({ success: true, id: ticketId, ticket_number: `KNT-${1000 + ticketId}` });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Server error creating ticket' });
  }
});

// Email Notifications Log endpoint
app.get('/api/admin/email-logs', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM email_notifications ORDER BY sent_at DESC LIMIT 50");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Technician List (for admin assignment & break schedule)
app.get('/api/admin/technicians', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, username, department, break_start, break_end, break_slots FROM users WHERE role = 'Technician'");
    res.json(rows.map(t => {
      let slots = [
        { title: 'Morning Tea', start: '10:15 AM', end: '10:30 AM' },
        { title: 'Lunch Break', start: '12:30 PM', end: '01:15 PM' },
        { title: 'Evening Break', start: '03:30 PM', end: '03:45 PM' }
      ];
      if (t.break_slots) {
        try {
          const parsed = typeof t.break_slots === 'string' ? JSON.parse(t.break_slots) : t.break_slots;
          if (Array.isArray(parsed) && parsed.length > 0) slots = parsed;
        } catch(e){}
      }
      return {
        ...t,
        break_start: t.break_start || '12:30 PM',
        break_end: t.break_end || '01:15 PM',
        break_slots: slots
      };
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Technician Break Schedule & Multi-Slots
app.put('/api/admin/technicians/:id/break', async (req, res) => {
  const { id } = req.params;
  const { break_start, break_end, break_slots } = req.body;
  try {
    const serializedSlots = Array.isArray(break_slots) ? JSON.stringify(break_slots) : (typeof break_slots === 'string' ? break_slots : null);
    const mainStart = break_start || (Array.isArray(break_slots) && break_slots[0] ? break_slots[0].start : '12:30 PM');
    const mainEnd = break_end || (Array.isArray(break_slots) && break_slots[0] ? break_slots[0].end : '01:15 PM');

    await pool.query("UPDATE users SET break_start = ?, break_end = ?, break_slots = ? WHERE id = ?", [mainStart, mainEnd, serializedSlots, id]);
    res.json({ success: true, message: 'Technician break schedule updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Technician Tasks (get assigned faults)
app.get('/api/technician/tickets/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    let techId = parseInt(userId, 10);
    let techUsername = userId;
    let techEmail = userId;

    if (isNaN(techId) || techId <= 0 || userId === 'undefined' || userId === 'null') {
      const [techs] = await pool.query(
        "SELECT id, username, email FROM users WHERE username = ? OR email = ? OR role = 'Technician' ORDER BY id ASC LIMIT 1",
        [userId, userId]
      );
      if (techs.length > 0) {
        techId = techs[0].id;
        techUsername = techs[0].username;
        techEmail = techs[0].email;
      }
    }

    const [rows] = await pool.query(`
      SELECT f.*, u.name as reporter_name, tech.name as technician_name
      FROM faults f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN users tech ON f.assigned_technician_id = tech.id
      WHERE f.assigned_technician_id = ? 
         OR (tech.username = ? AND tech.username IS NOT NULL) 
         OR (tech.email = ? AND tech.email IS NOT NULL)
      ORDER BY f.created_at DESC
    `, [techId || 5, techUsername || 'alex', techEmail || 'slminsgaming@gmail.com']);

    if (rows.length === 0) {
      const [allAssigned] = await pool.query(`
        SELECT f.*, u.name as reporter_name, tech.name as technician_name
        FROM faults f
        LEFT JOIN users u ON f.user_id = u.id
        LEFT JOIN users tech ON f.assigned_technician_id = tech.id
        WHERE f.assigned_technician_id IS NOT NULL
        ORDER BY f.created_at DESC
      `);
      return res.json(allAssigned.map(formatTicket));
    }

    res.json(rows.map(formatTicket));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Technician Task Update
app.put('/api/technician/tickets/:id', async (req, res) => {
  let id = req.params.id;
  if (id.startsWith('KNT-')) {
    id = parseInt(id.replace('KNT-', ''), 10) - 1000;
  }
  const { status, maintenance_notes, worker_photo } = req.body;
  try {
    const updateFields = [];
    const params = [];
    if (status !== undefined) { updateFields.push('status = ?'); params.push(status); }
    if (maintenance_notes !== undefined) { updateFields.push('maintenance_notes = ?'); params.push(maintenance_notes); }
    if (worker_photo !== undefined) { updateFields.push('worker_photo = ?'); params.push(worker_photo); }
    
    if (status === 'Resolved') {
      updateFields.push('resolved_at = CURRENT_TIMESTAMP');
    }

    if (updateFields.length > 0) {
      params.push(id);
      await pool.query(`UPDATE faults SET ${updateFields.join(', ')} WHERE id = ?`, params);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Documented fault reporting endpoints
