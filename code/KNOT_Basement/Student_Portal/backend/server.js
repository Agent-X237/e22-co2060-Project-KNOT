require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const emailService = require('./emailService');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'new_password',
  database: process.env.DB_NAME || 'knot_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDB() {
  try { await pool.query('ALTER TABLE bookings ADD COLUMN end_time DATETIME'); } catch(e){}
  try { await pool.query('ALTER TABLE bookings ADD COLUMN assigned_lecturer VARCHAR(255)'); } catch(e){}
  try { await pool.query('ALTER TABLE bookings ADD COLUMN purpose TEXT'); } catch(e){}
  try { await pool.query('ALTER TABLE bookings ADD COLUMN rejection_reason TEXT'); } catch(e){}
  try { await pool.query("ALTER TABLE bookings ADD COLUMN booking_type VARCHAR(50) DEFAULT 'AR Office'"); } catch(e){}
  try { await pool.query('ALTER TABLE faults ADD COLUMN maintenance_notes TEXT'); } catch(e){}
  try { 
    await pool.query('ALTER TABLE faults MODIFY COLUMN photo_url LONGTEXT'); 
  } catch(e){
    try { await pool.query('ALTER TABLE faults ADD COLUMN photo_url LONGTEXT'); } catch(err){}
  }
  try { await pool.query('ALTER TABLE faults ADD COLUMN worker_photo LONGTEXT'); } catch(e){}
  try { await pool.query('ALTER TABLE faults ADD COLUMN assigned_technician_id INT'); } catch(e){}
  try { await pool.query('ALTER TABLE faults MODIFY COLUMN location TEXT'); } catch(e){}
  try { await pool.query("ALTER TABLE bookings ADD COLUMN verification_status VARCHAR(50) DEFAULT 'NOT_REQUIRED'"); } catch(e){}
  try { await pool.query("ALTER TABLE bookings ADD COLUMN verification_prompt_time DATETIME"); } catch(e){}
  try { await pool.query("ALTER TABLE bookings ADD COLUMN verification_deadline DATETIME"); } catch(e){}
  try { await pool.query("ALTER TABLE bookings ADD COLUMN verification_notified TINYINT(1) DEFAULT 0"); } catch(e){}
  try { await pool.query("ALTER TABLE bookings ADD COLUMN start_datetime DATETIME"); } catch(e){}
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value VARCHAR(255) NOT NULL
      )
    `);
    await pool.query(`INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('auto_booking', 'true')`);
  } catch(e){}
}
initDB();

// Authentication Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT id, username, name, role, department, email FROM users WHERE username = ? AND password = ?', [username, password]);
    if (rows.length > 0) {
      res.json({ success: true, user: rows[0] });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Faults Endpoints
app.get('/api/faults/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM faults WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/faults', async (req, res) => {
  const { title, description, priority, location, user_id, icon, photo_url } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO faults (title, description, priority, location, user_id, icon, status, photo_url) VALUES (?, ?, ?, ?, ?, ?, "Open", ?)',
      [title, description, priority, location, user_id, icon, photo_url || null]
    );
    const ticketId = result.insertId;

    let reporterName = 'Student User';
    let reporterEmail = 'minhaj.dssc1@gmail.com';
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

    res.json({ success: true, id: ticketId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/faults/:id/resolve', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE faults SET status = "Resolved", resolved_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Schedule Timetable Endpoints
app.get('/api/schedule/all', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         b.id, 
         b.title as room_name, 
         b.time_display, 
         b.status, 
         b.icon, 
         b.user_id, 
         b.end_time, 
         b.assigned_lecturer, 
         b.purpose, 
         b.rejection_reason,
         u.name as requester_name 
       FROM bookings b 
       LEFT JOIN users u ON b.user_id = u.id 
       WHERE b.status = 'Approved' 
       ORDER BY b.time_display ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bookings Endpoints
app.get('/api/bookings/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    // Automatically delete bookings where end_time has passed
    await pool.query('DELETE FROM bookings WHERE end_time IS NOT NULL AND end_time < NOW()');

    const [rows] = await pool.query('SELECT * FROM bookings WHERE user_id = ?', [userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  const { title, time_display, user_id, icon, status, end_time, assigned_lecturer, purpose } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let requestType = 'AR Office';
    if (assigned_lecturer) {
      const [lRows] = await connection.query('SELECT role FROM users WHERE name = ?', [assigned_lecturer]);
      if (lRows.length > 0) {
        if (lRows[0].role === 'Lecturer') {
          requestType = 'Lecture';
        } else {
          requestType = 'AR Office';
        }
      } else {
        requestType = 'AR Office';
      }
    }

    let bookingId;
    let finalStatus = status || 'Pending';
    let rejectionReason = null;
    let autoProcessed = false;

    if (status === 'Pending AR') {
      const [settings] = await connection.query("SELECT setting_value FROM settings WHERE setting_key = 'auto_booking'");
      const isAutoEnabled = settings.length > 0 && settings[0].setting_value === 'true';

      if (isAutoEnabled) {
        const [conflicts] = await connection.query(
          'SELECT id FROM bookings WHERE title = ? AND time_display = ? AND status = "Approved" FOR UPDATE',
          [title, time_display]
        );

        finalStatus = 'Approved';
        if (conflicts.length > 0) {
          finalStatus = 'Rejected';
          rejectionReason = 'Automated system: Room is already booked for this time slot.';
        }
        autoProcessed = true;

        const [result] = await connection.query(
          'INSERT INTO bookings (title, time_display, user_id, icon, status, end_time, assigned_lecturer, purpose, rejection_reason, booking_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [title, time_display, user_id, icon || 'meeting_room', finalStatus, end_time || null, assigned_lecturer || null, purpose || null, rejectionReason, requestType]
        );
        bookingId = result.insertId;
      }
    }

    if (!bookingId) {
      const [result] = await connection.query(
        'INSERT INTO bookings (title, time_display, user_id, icon, status, end_time, assigned_lecturer, purpose, booking_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, time_display, user_id, icon || 'meeting_room', finalStatus, end_time || null, assigned_lecturer || null, purpose || null, requestType]
      );
      bookingId = result.insertId;
    }

    await connection.commit();

    // Async Email Notifications
    (async () => {
      try {
        const [uRows] = await pool.query('SELECT name, email FROM users WHERE id = ?', [user_id]);
        const studentName = uRows.length > 0 ? uRows[0].name : 'Student';
        const studentEmail = uRows.length > 0 && uRows[0].email ? uRows[0].email : 'e22237@eng.pdn.ac.lk';

        let lecturerEmail = null;
        if (assigned_lecturer) {
          const [lRows] = await pool.query("SELECT email FROM users WHERE name = ? AND role = 'Lecturer'", [assigned_lecturer]);
          if (lRows.length > 0 && lRows[0].email) lecturerEmail = lRows[0].email;
        }

        const [arRows] = await pool.query("SELECT email FROM users WHERE role = 'booking_admin' AND email IS NOT NULL");
        const arAdminEmail = arRows.length > 0 ? arRows[0].email : 'minhaj.dssc3@gmail.com';

        const bookingObj = { id: bookingId, title, time_display, status: finalStatus, booking_type: requestType, purpose, assigned_lecturer };

        await emailService.sendBookingCreatedNotification(pool, {
          booking: bookingObj,
          studentEmail,
          studentName,
          lecturerEmail,
          arAdminEmail
        });

        if (autoProcessed) {
          if (finalStatus === 'Approved') {
            await emailService.sendBookingApprovedNotification(pool, { booking: bookingObj, studentEmail, studentName, approvedBy: 'Automated System' });
          } else if (finalStatus === 'Rejected') {
            await emailService.sendBookingRejectedNotification(pool, { booking: bookingObj, studentEmail, studentName, reason: rejectionReason });
          }
        }
      } catch (e) {
        console.error('[BookingServer] Error dispatching booking created email:', e.message);
      }
    })();

    res.json({ success: true, id: bookingId, status: finalStatus, autoProcessed, booking_type: requestType });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// ─── 2-STEP BOOKING VERIFICATION AUTOMATION LOGIC ───
function parseStartDatetime(timeDisplay) {
  if (!timeDisplay) return null;
  const match = timeDisplay.match(/(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}\s+(?:AM|PM))/i);
  if (match) {
    const dStr = match[1];
    const tStr = match[2];
    const tMatch = tStr.match(/(\d{1,2}):(\d{2})\s+(AM|PM)/i);
    if (tMatch) {
      let hh = parseInt(tMatch[1], 10);
      const mm = tMatch[2];
      const ampm = tMatch[3];
      if (ampm.toUpperCase() === 'PM' && hh < 12) hh += 12;
      if (ampm.toUpperCase() === 'AM' && hh === 12) hh = 0;
      return `${dStr} ${String(hh).padStart(2, '0')}:${mm}:00`;
    }
  }
  return null;
}

async function processBooking2StepVerifications() {
  try {
    const now = new Date();

    const [bookings] = await pool.query(`
      SELECT b.*, u.email as user_email, u.name as user_name, u.role as user_role 
      FROM bookings b 
      LEFT JOIN users u ON b.user_id = u.id 
      WHERE b.status = 'Approved'
    `);

    for (const b of bookings) {
      let startDt = b.start_datetime ? new Date(b.start_datetime) : null;
      if (!startDt || isNaN(startDt.getTime())) {
        const parsedStr = parseStartDatetime(b.time_display);
        if (parsedStr) {
          startDt = new Date(parsedStr);
          await pool.query('UPDATE bookings SET start_datetime = ? WHERE id = ?', [parsedStr, b.id]);
        }
      }

      if (!startDt || isNaN(startDt.getTime())) continue;

      const hoursUntilSlot = (startDt.getTime() - now.getTime()) / (1000 * 60 * 60);

      let promptTime = b.verification_prompt_time ? new Date(b.verification_prompt_time) : null;
      let deadlineTime = b.verification_deadline ? new Date(b.verification_deadline) : null;

      if (!promptTime || !deadlineTime) {
        if (hoursUntilSlot >= 12) {
          // Standard >12h Booking: Prompt at 24h prior, Deadline at 12h prior
          promptTime = new Date(startDt.getTime() - (24 * 60 * 60 * 1000));
          deadlineTime = new Date(startDt.getTime() - (12 * 60 * 60 * 1000));
        } else {
          // Same-day / Short notice <12h Booking: Prompt at 7:00 AM on slot date, Deadline at 7:30 AM
          const datePart = startDt.toISOString().split('T')[0];
          promptTime = new Date(`${datePart}T07:00:00`);
          deadlineTime = new Date(`${datePart}T07:30:00`);
        }

        await pool.query(
          'UPDATE bookings SET verification_prompt_time = ?, verification_deadline = ? WHERE id = ?',
          [promptTime, deadlineTime, b.id]
        );
      }

      const vStatus = b.verification_status || 'NOT_REQUIRED';

      // 1. Activate Verification Prompt & Send Notification Email when promptTime reached
      if (now >= promptTime && (vStatus === 'NOT_REQUIRED' || vStatus === 'PENDING_VERIFICATION')) {
        if (vStatus === 'NOT_REQUIRED') {
          await pool.query("UPDATE bookings SET verification_status = 'PENDING_VERIFICATION' WHERE id = ?", [b.id]);
          b.verification_status = 'PENDING_VERIFICATION';
        }

        if (!b.verification_notified) {
          let recipientEmail = b.user_email || 'e22237@eng.pdn.ac.lk';
          let recipientName = b.user_name || 'Student / Lecturer';

          if (b.assigned_lecturer) {
            const [lRows] = await pool.query('SELECT email, name FROM users WHERE name = ?', [b.assigned_lecturer]);
            if (lRows.length > 0 && lRows[0].email) {
              recipientEmail = lRows[0].email;
              recipientName = lRows[0].name;
            }
          }

          const deadlineStr = deadlineTime.toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          });

          emailService.sendBookingVerificationPromptNotification(pool, {
            booking: b,
            recipientEmail,
            recipientName,
            deadlineStr
          }).catch(e => console.error('[Verification Prompt Email Error]:', e.message));

          await pool.query('UPDATE bookings SET verification_notified = 1 WHERE id = ?', [b.id]);
        }
      }

      // 2. Check Expiration: if now >= deadlineTime and status is still PENDING_VERIFICATION (unconfirmed)
      if (now >= deadlineTime && b.verification_status === 'PENDING_VERIFICATION') {
        await pool.query(
          "UPDATE bookings SET status = 'Cancelled', verification_status = 'EXPIRED_CANCELLED', rejection_reason = 'Automated 2-Step Verification: Deadline expired without confirmation.' WHERE id = ?",
          [b.id]
        );

        let recipientEmail = b.user_email || 'e22237@eng.pdn.ac.lk';
        let recipientName = b.user_name || 'Student / Lecturer';

        if (b.assigned_lecturer) {
          const [lRows] = await pool.query('SELECT email, name FROM users WHERE name = ?', [b.assigned_lecturer]);
          if (lRows.length > 0 && lRows[0].email) {
            recipientEmail = lRows[0].email;
            recipientName = lRows[0].name;
          }
        }

        emailService.sendBookingVerificationExpiredNotification(pool, {
          booking: b,
          recipientEmail,
          recipientName
        }).catch(e => console.error('[Verification Expired Email Error]:', e.message));

        console.log(`[2-Step Verification] Booking #${b.id} (${b.title}) auto-cancelled & slot freed.`);
      }
    }
  } catch (err) {
    console.error('[2-Step Verification Job Error]:', err.message);
  }
}

// Start 2-Step Verification Periodic Background Service (Every 15s)
setInterval(processBooking2StepVerifications, 15000);
setTimeout(processBooking2StepVerifications, 2000);

// API: Fetch Active 2-Step Verifications for User
app.get('/api/bookings/verifications/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    await processBooking2StepVerifications();

    const [userRows] = await pool.query('SELECT id, name, role FROM users WHERE id = ? OR username = ?', [userId, userId]);
    let userName = '';
    let numericUserId = parseInt(userId, 10) || 0;
    if (userRows.length > 0) {
      userName = userRows[0].name;
      numericUserId = userRows[0].id;
    }

    const [rows] = await pool.query(`
      SELECT b.* 
      FROM bookings b 
      WHERE (b.user_id = ? OR b.assigned_lecturer = ?) 
        AND b.status = 'Approved' 
        AND b.verification_status = 'PENDING_VERIFICATION'
      ORDER BY b.verification_deadline ASC
    `, [numericUserId, userName]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Perform 2-Step Verification Action (Confirm or Cancel)
app.put('/api/bookings/:id/verify', async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  try {
    const [rows] = await pool.query(`
      SELECT b.*, u.email as user_email, u.name as user_name 
      FROM bookings b 
      LEFT JOIN users u ON b.user_id = u.id 
      WHERE b.id = ?
    `, [id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    const booking = rows[0];

    let recipientEmail = booking.user_email || 'e22237@eng.pdn.ac.lk';
    let recipientName = booking.user_name || 'Requester';

    if (booking.assigned_lecturer) {
      const [lRows] = await pool.query('SELECT email, name FROM users WHERE name = ?', [booking.assigned_lecturer]);
      if (lRows.length > 0 && lRows[0].email) {
        recipientEmail = lRows[0].email;
        recipientName = lRows[0].name;
      }
    }

    if (action === 'confirm') {
      await pool.query("UPDATE bookings SET verification_status = 'CONFIRMED' WHERE id = ?", [id]);
      emailService.sendBookingVerificationConfirmedNotification(pool, {
        booking,
        recipientEmail,
        recipientName
      }).catch(e => console.error(e.message));

      res.json({ success: true, message: '2-Step Verification Confirmed! Your hall booking is locked in.' });
    } else if (action === 'cancel') {
      await pool.query(
        "UPDATE bookings SET status = 'Cancelled', verification_status = 'USER_CANCELLED', rejection_reason = 'Cancelled by user during 2-Step Verification.' WHERE id = ?",
        [id]
      );
      emailService.sendBookingVerificationExpiredNotification(pool, {
        booking,
        recipientEmail,
        recipientName
      }).catch(e => console.error(e.message));

      res.json({ success: true, message: 'Booking cancelled & hall slot freed.' });
    } else {
      res.status(400).json({ error: 'Invalid action. Use confirm or cancel.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rooms', async (req, res) => {
  try {
    const [rooms] = await pool.query('SELECT * FROM rooms');
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lecturers', async (req, res) => {
  try {
    const [lecturers] = await pool.query("SELECT id, name, username, department FROM users WHERE role = 'Lecturer'");
    res.json(lecturers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lecturer Endpoints
app.get('/api/lecturer/requests/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [userRows] = await pool.query('SELECT name FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) return res.status(404).json({ error: "User not found" });
    const lecturerName = userRows[0].name;

    const [rows] = await pool.query(
      'SELECT b.*, u.name as requestor_name FROM bookings b JOIN users u ON b.user_id = u.id WHERE b.assigned_lecturer = ? ORDER BY b.id DESC',
      [lecturerName]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/lecturer/requests/:id/forward', async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [settings] = await connection.query("SELECT setting_value FROM settings WHERE setting_key = 'auto_booking'");
    const isAutoEnabled = settings.length > 0 && settings[0].setting_value === 'true';

    let finalStatus = "Pending AR";
    let rejectionReason = null;
    let autoProcessed = false;

    if (isAutoEnabled) {
      const [bookingRows] = await connection.query('SELECT title, time_display FROM bookings WHERE id = ? FOR UPDATE', [id]);
      if (bookingRows.length > 0) {
        const { title, time_display } = bookingRows[0];
        const [conflicts] = await connection.query(
          'SELECT id FROM bookings WHERE title = ? AND time_display = ? AND status = "Approved" AND id != ? FOR UPDATE',
          [title, time_display, id]
        );

        finalStatus = 'Approved';
        if (conflicts.length > 0) {
          finalStatus = 'Rejected';
          rejectionReason = 'Automated system: Room is already booked for this time slot.';
        }
        autoProcessed = true;
        await connection.query('UPDATE bookings SET status = ?, rejection_reason = ? WHERE id = ?', [finalStatus, rejectionReason, id]);
      }
    } else {
      await connection.query('UPDATE bookings SET status = "Pending AR" WHERE id = ?', [id]);
    }

    await connection.commit();

    // Async Email Notification
    (async () => {
      try {
        const [bRows] = await pool.query(
          'SELECT b.*, u.name as student_name, u.email as student_email FROM bookings b JOIN users u ON b.user_id = u.id WHERE b.id = ?',
          [id]
        );
        if (bRows.length > 0) {
          const b = bRows[0];
          const studentEmail = b.student_email || 'e22237@eng.pdn.ac.lk';
          const studentName = b.student_name || 'Student';

          const [arRows] = await pool.query("SELECT email FROM users WHERE role = 'booking_admin' AND email IS NOT NULL");
          const arAdminEmail = arRows.length > 0 ? arRows[0].email : 'minhaj.dssc3@gmail.com';

          await emailService.sendBookingLecturerApprovedNotification(pool, {
            booking: b,
            studentEmail,
            studentName,
            lecturerName: b.assigned_lecturer || 'Dr. Smith',
            arAdminEmail
          });

          if (autoProcessed) {
            if (finalStatus === 'Approved') {
              await emailService.sendBookingApprovedNotification(pool, { booking: b, studentEmail, studentName, approvedBy: 'Automated System' });
            } else if (finalStatus === 'Rejected') {
              await emailService.sendBookingRejectedNotification(pool, { booking: b, studentEmail, studentName, reason: rejectionReason });
            }
          }
        }
      } catch (e) {
        console.error('[BookingServer] Error sending lecturer approved email:', e.message);
      }
    })();

    res.json({ success: true, status: finalStatus, autoProcessed });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.put('/api/lecturer/requests/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    await pool.query('UPDATE bookings SET status = "Rejected", rejection_reason = ? WHERE id = ?', [reason || null, id]);
    
    // Async Email Notification
    (async () => {
      try {
        const [bRows] = await pool.query(
          'SELECT b.*, u.name as student_name, u.email as student_email FROM bookings b JOIN users u ON b.user_id = u.id WHERE b.id = ?',
          [id]
        );
        if (bRows.length > 0) {
          const b = bRows[0];
          await emailService.sendBookingLecturerRejectedNotification(pool, {
            booking: b,
            studentEmail: b.student_email || 'e22237@eng.pdn.ac.lk',
            studentName: b.student_name || 'Student',
            lecturerName: b.assigned_lecturer || 'Dr. Smith',
            reason: reason || 'Declined by lecturer'
          });
        }
      } catch (e) {
        console.error('[BookingServer] Error sending lecturer rejected email:', e.message);
      }
    })();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Maintenance Admin Endpoints
const formatTicket = (fault) => ({
  id: fault.id,
  ticket_number: `TKT-${String(fault.id).padStart(4, '0')}`,
  title: fault.title,
  description: fault.description,
  priority: fault.priority || 'Low',
  status: fault.status,
  reported_at: fault.created_at,
  reported_by: fault.reporter_name || 'System User',
  location: fault.location || 'N/A',
  maintenance_notes: fault.maintenance_notes || null,
  manager_notes: fault.manager_notes || null,
  photo_url: fault.photo_url || null,
  worker_photo: fault.worker_photo || null,
  assigned_technician_id: fault.assigned_technician_id || null,
  assigned_technician_name: fault.technician_name || null,
  admin_verified: fault.admin_verified ? true : false
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tickets/stats', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT status, title as category 
      FROM faults
    `);
    
    const open = rows.filter(r => r.status === 'Open').length;
    const inProgress = rows.filter(r => r.status === 'In Progress').length;
    const resolvedToday = rows.filter(r => r.status === 'Resolved').length;

    const resolutionRates = [
      { category: 'Hardware', rate: 76 },
      { category: 'Software', rate: 92 },
      { category: 'General', rate: 85 }
    ];

    res.json({ open, inProgress, resolvedToday, resolutionRates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tickets/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT f.*, u.name as reporter_name, tech.name as technician_name
      FROM faults f 
      LEFT JOIN users u ON f.user_id = u.id 
      LEFT JOIN users tech ON f.assigned_technician_id = tech.id
      WHERE f.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    res.json(formatTicket(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tickets/:id', async (req, res) => {
  const { status, maintenance_notes, manager_notes, photo_url, worker_photo, assigned_technician_id, admin_verified } = req.body;
  try {
    // Fetch state before update
    const [oldRows] = await pool.query(`
      SELECT f.*, u.name as reporter_name, u.email as reporter_email, tech.name as tech_name, tech.email as tech_email 
      FROM faults f 
      LEFT JOIN users u ON f.user_id = u.id 
      LEFT JOIN users tech ON f.assigned_technician_id = tech.id 
      WHERE f.id = ?
    `, [req.params.id]);
    const oldTicket = oldRows[0] || null;

    let targetStatus = status;
    if (assigned_technician_id !== undefined && assigned_technician_id !== null && (!status || status === 'Open')) {
      targetStatus = 'In Progress';
    }

    const updateFields = [];
    const params = [];
    if (targetStatus !== undefined) { updateFields.push('status = ?'); params.push(targetStatus); }
    if (maintenance_notes !== undefined) { updateFields.push('maintenance_notes = ?'); params.push(maintenance_notes); }
    if (manager_notes !== undefined) { updateFields.push('manager_notes = ?'); params.push(manager_notes); }
    if (photo_url !== undefined) { updateFields.push('photo_url = ?'); params.push(photo_url); }
    if (worker_photo !== undefined) { updateFields.push('worker_photo = ?'); params.push(worker_photo); }
    if (assigned_technician_id !== undefined) { updateFields.push('assigned_technician_id = ?'); params.push(assigned_technician_id); }
    if (admin_verified !== undefined) { updateFields.push('admin_verified = ?'); params.push(admin_verified ? 1 : 0); }
    
    if (targetStatus === 'Resolved') {
      updateFields.push('resolved_at = CURRENT_TIMESTAMP');
    }

    if (updateFields.length > 0) {
      params.push(req.params.id);
      await pool.query(`UPDATE faults SET ${updateFields.join(', ')} WHERE id = ?`, params);
    }

    // Fetch updated state with join
    const [updatedRows] = await pool.query(`
      SELECT f.*, u.name as reporter_name, u.email as reporter_email, tech.name as tech_name, tech.email as tech_email 
      FROM faults f 
      LEFT JOIN users u ON f.user_id = u.id 
      LEFT JOIN users tech ON f.assigned_technician_id = tech.id 
      WHERE f.id = ?
    `, [req.params.id]);

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
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  if (typeof id === 'string' && id.startsWith('KNT-')) {
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

app.get('/api/admin/settings/auto-booking', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'auto_booking'");
    res.json({ auto_booking: rows.length > 0 ? rows[0].setting_value === 'true' : false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/settings/auto-booking', async (req, res) => {
  const { enabled } = req.body;
  try {
    const val = enabled ? 'true' : 'false';
    await pool.query(
      "INSERT INTO settings (setting_key, setting_value) VALUES ('auto_booking', ?) ON DUPLICATE KEY UPDATE setting_value = ?",
      [val, val]
    );
    res.json({ success: true, auto_booking: enabled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Booking Admin Endpoints
app.get('/api/admin/bookings/stats', async (req, res) => {
  try {
    const [bookings] = await pool.query(`SELECT COUNT(*) AS totalBookings FROM bookings WHERE title IS NOT NULL`);
    const [pendingBookings] = await pool.query(`SELECT COUNT(*) AS pendingBookings FROM bookings WHERE status = 'Pending AR'`);
    
    res.json({
        totalBookingsToday: bookings[0].totalBookings, // using total bookings since we don't have created_at yet
        pendingBookings: pendingBookings[0].pendingBookings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/pending-bookings', async (req, res) => {
  try {
    const [approvals] = await pool.query(`
        SELECT 
            b.id, 
            b.title as room_name, 
            b.time_display as booking_date, 
            b.status,
            b.assigned_lecturer,
            b.purpose,
            u.name AS user_name, 
            u.role
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.status = 'Pending AR'
    `);
    res.json(approvals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/bookings/:id', async (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body; 

  if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be approve or reject.' });
  }

  if (action === 'approve') {
      try {
          const [booking] = await pool.query('SELECT title, time_display FROM bookings WHERE id = ?', [id]);
          if (booking.length > 0) {
              const { title, time_display } = booking[0];
              const [overlapping] = await pool.query(
                  'SELECT id FROM bookings WHERE title = ? AND time_display = ? AND status = "Approved" AND id != ?', 
                  [title, time_display, id]
              );
              if (overlapping.length > 0) {
                  return res.status(409).json({ error: 'Cannot approve: Room is already booked for this time.' });
              }
          }
      } catch (err) {
          return res.status(500).json({ error: err.message });
      }
  }

  const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
  const rejectionReason = action === 'reject' ? (reason || null) : null;

  try {
      const [result] = await pool.query(
          'UPDATE bookings SET status = ?, rejection_reason = ? WHERE id = ?',
          [newStatus, rejectionReason, id]
      );
      if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Booking not found' });
      }

      // Async Email Notification
      (async () => {
        try {
          const [bRows] = await pool.query(
            'SELECT b.*, u.name as student_name, u.email as student_email FROM bookings b JOIN users u ON b.user_id = u.id WHERE b.id = ?',
            [id]
          );
          if (bRows.length > 0) {
            const b = bRows[0];
            const studentEmail = b.student_email || 'e22237@eng.pdn.ac.lk';
            const studentName = b.student_name || 'Student';

            if (action === 'approve') {
              await emailService.sendBookingApprovedNotification(pool, {
                booking: b,
                studentEmail,
                studentName,
                approvedBy: 'Assistant Registrar (AR Office)'
              });
            } else {
              await emailService.sendBookingRejectedNotification(pool, {
                booking: b,
                studentEmail,
                studentName,
                reason: rejectionReason || 'Declined by AR Booking Office'
              });
            }
          }
        } catch (e) {
          console.error('[BookingServer] Error sending AR admin decision email:', e.message);
        }
      })();

      res.json({ message: `Booking successfully ${newStatus}` });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});
app.get('/api/admin/all-bookings', async (req, res) => {
  try {
    const [bookings] = await pool.query(`
        SELECT 
            b.id, 
            b.title as room_name, 
            b.time_display as booking_date, 
            b.status,
            b.rejection_reason,
            b.assigned_lecturer,
            b.purpose,
            u.name AS user_name, 
            u.role
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        ORDER BY b.id DESC
    `);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/rooms', async (req, res) => {
  try {
    const [rooms] = await pool.query('SELECT * FROM rooms');
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/rooms', async (req, res) => {
  const { name, capacity, type, status } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO rooms (name, capacity, type, status) VALUES (?, ?, ?, ?)',
      [name, capacity || 30, type || 'Lecture Hall', status || 'Available']
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/rooms/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE rooms SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/rooms/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM rooms WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk validate semester pre-bookings
app.post('/api/admin/bookings/bulk-validate', async (req, res) => {
  const { semesterStart, semesterEnd, rows } = req.body;
  if (!semesterStart || !semesterEnd || !Array.isArray(rows)) {
    return res.status(400).json({ error: 'Missing parameter(s). Required: semesterStart, semesterEnd, rows' });
  }

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  try {
    const generatedBookings = [];

    // Parse date strings in local time to avoid timezone shift
    const [startYear, startMonth, startDay] = semesterStart.split('-').map(Number);
    const [endYear, endMonth, endDay] = semesterEnd.split('-').map(Number);

    for (const row of rows) {
      const { roomName, dayOfWeek, startTime, endTime, purpose, lecturer } = row;
      const targetDayIdx = daysOfWeek.indexOf(dayOfWeek);
      if (targetDayIdx === -1) continue;
      if (!roomName || !startTime || !endTime) continue;

      let current = new Date(startYear, startMonth - 1, startDay);
      const end = new Date(endYear, endMonth - 1, endDay);

      while (current <= end) {
        if (current.getDay() === targetDayIdx) {
          const dateString = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;

          // Format start and end times
          const sTime = typeof startTime === 'string' && startTime.includes(':') ? startTime : '08:30';
          const eTime = typeof endTime === 'string' && endTime.includes(':') ? endTime : '10:30';

          const [startH, startM] = sTime.split(':');
          const [endH, endM] = eTime.split(':');

          const startHourInt = parseInt(startH) || 0;
          const startMinInt = parseInt(startM) || 0;
          const endHourInt = parseInt(endH) || 0;
          const endMinInt = parseInt(endM) || 0;

          const startAmPm = startHourInt >= 12 ? 'PM' : 'AM';
          const startDisp = `${String(startHourInt > 12 ? startHourInt - 12 : startHourInt === 0 ? 12 : startHourInt).padStart(2, '0')}:${String(startMinInt).padStart(2, '0')} ${startAmPm}`;

          const endAmPm = endHourInt >= 12 ? 'PM' : 'AM';
          const endDisp = `${String(endHourInt > 12 ? endHourInt - 12 : endHourInt === 0 ? 12 : endHourInt).padStart(2, '0')}:${String(endMinInt).padStart(2, '0')} ${endAmPm}`;

          const timeDisplay = `${dateString} ${startDisp} - ${endDisp}`;
          const formattedEndTime = `${dateString} ${String(endHourInt).padStart(2, '0')}:${String(endMinInt).padStart(2, '0')}:00`;

          // Check overlap
          const [overlapping] = await pool.query(
            'SELECT id, title, time_display, purpose FROM bookings WHERE title = ? AND time_display = ? AND status = "Approved"',
            [roomName, timeDisplay]
          );

          generatedBookings.push({
            room_name: roomName,
            date: dateString,
            day_of_week: dayOfWeek,
            time_display: timeDisplay,
            end_time: formattedEndTime,
            purpose: purpose,
            assigned_lecturer: lecturer,
            valid: overlapping.length === 0,
            conflict_details: overlapping.length > 0 ? `Conflicts with: "${overlapping[0].purpose}"` : null
          });
        }
        current.setDate(current.getDate() + 1);
      }
    }

    res.json(generatedBookings);
  } catch (err) {
    console.error("Bulk validation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Bulk insert bookings
app.post('/api/admin/bookings/bulk-insert', async (req, res) => {
  const { bookings, userId } = req.body;
  if (!Array.isArray(bookings) || bookings.length === 0) {
    return res.status(400).json({ error: 'Missing or empty bookings array.' });
  }

  try {
    let successCount = 0;
    for (const b of bookings) {
      // First, confirm it doesn't already conflict
      const [overlapping] = await pool.query(
        'SELECT id FROM bookings WHERE title = ? AND time_display = ? AND status = "Approved"',
        [b.room_name, b.time_display]
      );

      if (overlapping.length === 0) {
        await pool.query(
          'INSERT INTO bookings (title, time_display, status, icon, user_id, assigned_lecturer, purpose, end_time) VALUES (?, ?, "Approved", ?, ?, ?, ?, ?)',
          [
            b.room_name,
            b.time_display,
            b.room_name.toLowerCase().includes('lab') ? 'science' : 'corporate_fare',
            userId || null,
            b.assigned_lecturer || null,
            b.purpose || null,
            b.end_time
          ]
        );
        successCount++;
      }
    }
    res.json({ success: true, count: successCount });
  } catch (err) {
    console.error("Bulk insert error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Documented /api/bookings endpoint for better readability

// Documented /api/availability endpoint for conflict checks
