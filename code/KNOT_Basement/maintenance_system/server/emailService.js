const nodemailer = require('nodemailer');
require('dotenv').config();

// Setup Nodemailer Transporter with fallback
let transporter;

if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
} else {
  // Test / Local fallback transport (logs dispatches cleanly without failing)
  transporter = nodemailer.createTransport({
    jsonTransport: true
  });
}

/**
 * Helper to record dispatched email into email_notifications table
 */
async function logNotification(pool, { ticketId, recipientEmail, recipientName, subject, eventType, messageBody }) {
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO email_notifications (ticket_id, recipient_email, recipient_name, subject, event_type, message_body) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ticketId || null, recipientEmail, recipientName || 'User', subject, eventType, messageBody]
    );
  } catch (err) {
    console.error('[EmailService] Error logging notification to DB:', err.message);
  }
}

/**
 * HTML Base Layout Template wrapper
 */
function wrapHtmlTemplate(title, preheader, bodyContent) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
      .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
      .header h2 { margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px; }
      .header p { margin: 4px 0 0 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
      .content { padding: 32px 24px; }
      .badge { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
      .badge-blue { background: #dbeafe; color: #1e40af; }
      .badge-amber { background: #fef3c7; color: #92400e; }
      .badge-emerald { background: #d1fae5; color: #065f46; }
      .badge-purple { background: #f3e8ff; color: #6b21a8; }
      .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; }
      .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
      .info-label { color: #64748b; font-weight: 600; }
      .info-value { color: #0f172a; font-weight: 700; }
      .notes-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 0 8px 8px 0; margin: 16px 0; font-size: 13px; color: #78350f; font-weight: 500; }
      .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>KNOT Campus Operations</h2>
        <p>Facilities & Maintenance Management System</p>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
      <div class="footer">
        <p style="margin: 0;">This is an automated notification from KNOT Campus Operations.</p>
        <p style="margin: 4px 0 0 0;">Department of Computer Engineering • Faculty of Engineering</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * 1. Send Notification: Maintenance Request Created
 * - Email #1: Sent to Student (e22237@eng.pdn.ac.lk) acknowledging receipt
 * - Email #2: Sent to Maintenance Manager (minhaj.dssc1@gmail.com) alerting new request
 */
async function sendTicketCreatedNotification(pool, { ticket, reporterEmail, reporterName, managerEmail }) {
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'minhaj.dssc2@gmail.com';
  const email = reporterEmail || 'e22237@eng.pdn.ac.lk';
  const name = reporterName || ticket.reported_by || 'Student e22237';
  const mgrEmail = managerEmail || 'minhaj.dssc1@gmail.com';

  // Email to Student (Reporter)
  const subject = `[KNOT Maintenance] Request Received: ${ticket.title} (#TKT-${String(ticket.id).padStart(4, '0')})`;
  const bodyHtml = wrapHtmlTemplate(
    subject,
    'Your maintenance request has been submitted successfully.',
    `
      <span class="badge badge-blue">Request Received</span>
      <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px;">Hello ${name},</h3>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        We have received your maintenance report and registered it in the campus operations queue. Our facilities management team will assign a duty technician shortly.
      </p>

      <div class="info-box">
        <div class="info-row"><span class="info-label">Ticket ID:</span> <span class="info-value">#TKT-${String(ticket.id).padStart(4, '0')}</span></div>
        <div class="info-row"><span class="info-label">Issue Title:</span> <span class="info-value">${ticket.title}</span></div>
        <div class="info-row"><span class="info-label">Location:</span> <span class="info-value">${ticket.location || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Priority:</span> <span class="info-value">${ticket.priority || 'Medium'}</span></div>
        <div class="info-row"><span class="info-label">Status:</span> <span class="info-value">${ticket.status || 'Open'}</span></div>
      </div>

      ${ticket.description ? `
        <p style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Reported Description:</p>
        <p style="font-size: 13px; color: #334155; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 0 0 20px 0;">${ticket.description}</p>
      ` : ''}

      <p style="font-size: 13px; color: #64748b;">You will receive another update when a technician is assigned to inspect and resolve your issue.</p>
    `
  );

  try {
    await transporter.sendMail({ from: fromAddress, to: email, subject, html: bodyHtml });
    console.log(`[EmailService] Sent TICKET_CREATED email for Ticket #${ticket.id} to Student (${email})`);
  } catch (err) {
    console.error('[EmailService] Error sending student email:', err.message);
  }

  await logNotification(pool, {
    ticketId: ticket.id,
    recipientEmail: email,
    recipientName: name,
    subject,
    eventType: 'TICKET_CREATED',
    messageBody: `Maintenance request received for "${ticket.title}" at ${ticket.location || 'campus'}.`
  });

  // Email to Maintenance Manager (admin - minhaj.dssc1@gmail.com)
  const mgrSubject = `[KNOT Manager Alert] New Maintenance Request: ${ticket.title} (#TKT-${String(ticket.id).padStart(4, '0')})`;
  const mgrBodyHtml = wrapHtmlTemplate(
    mgrSubject,
    'A new maintenance request has been submitted and requires technician assignment.',
    `
      <span class="badge badge-amber">New Maintenance Request</span>
      <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px;">Hello Maintenance Manager,</h3>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        A new maintenance request has been submitted by student <strong>${name} (${email})</strong>. Please log in to the manager portal to assign a duty technician.
      </p>

      <div class="info-box">
        <div class="info-row"><span class="info-label">Ticket ID:</span> <span class="info-value">#TKT-${String(ticket.id).padStart(4, '0')}</span></div>
        <div class="info-row"><span class="info-label">Issue Title:</span> <span class="info-value">${ticket.title}</span></div>
        <div class="info-row"><span class="info-label">Location:</span> <span class="info-value">${ticket.location || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Priority:</span> <span class="info-value">${ticket.priority || 'Medium'}</span></div>
        <div class="info-row"><span class="info-label">Reported By:</span> <span class="info-value">${name} (${email})</span></div>
      </div>

      ${ticket.description ? `
        <p style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Reported Description:</p>
        <p style="font-size: 13px; color: #334155; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 0 0 20px 0;">${ticket.description}</p>
      ` : ''}

      <p style="font-size: 13px; color: #64748b;">Action Required: Log in to assign an available duty technician.</p>
    `
  );

  try {
    await transporter.sendMail({ from: fromAddress, to: mgrEmail, subject: mgrSubject, html: mgrBodyHtml });
    console.log(`[EmailService] Sent MANAGER_ALERT email for Ticket #${ticket.id} to Manager (${mgrEmail})`);
  } catch (err) {
    console.error('[EmailService] Error sending manager alert email:', err.message);
  }

  await logNotification(pool, {
    ticketId: ticket.id,
    recipientEmail: mgrEmail,
    recipientName: 'Maintenance Manager',
    subject: mgrSubject,
    eventType: 'TICKET_CREATED',
    messageBody: `New maintenance request alert for "${ticket.title}" submitted by ${name}.`
  });
}

/**
 * 2. Send Notification: Manager Assigns Work to Technician Alex (slminsgaming@gmail.com)
 */
async function sendTechnicianAssignedNotification(pool, { ticket, technicianEmail, technicianName }) {
  const email = technicianEmail || 'slminsgaming@gmail.com';
  const name = technicianName || 'Technician Alex';
  const subject = `[KNOT Dispatch] Work Order Assigned: ${ticket.title} (#TKT-${String(ticket.id).padStart(4, '0')})`;
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'minhaj.dssc2@gmail.com';

  const bodyHtml = wrapHtmlTemplate(
    subject,
    'You have been assigned a new maintenance work order.',
    `
      <span class="badge badge-purple">Work Order Assigned</span>
      <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px;">Hello ${name},</h3>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        You have been assigned to handle a maintenance work order by the Maintenance Manager. Please inspect the location and update work progress on your technician portal.
      </p>

      <div class="info-box">
        <div class="info-row"><span class="info-label">Ticket ID:</span> <span class="info-value">#TKT-${String(ticket.id).padStart(4, '0')}</span></div>
        <div class="info-row"><span class="info-label">Task:</span> <span class="info-value">${ticket.title}</span></div>
        <div class="info-row"><span class="info-label">Location:</span> <span class="info-value">${ticket.location || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Priority:</span> <span class="info-value">${ticket.priority || 'Medium'}</span></div>
        <div class="info-row"><span class="info-label">Reported By:</span> <span class="info-value">${ticket.reported_by || 'Student e22237'}</span></div>
      </div>

      ${ticket.description ? `
        <p style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Issue Details:</p>
        <p style="font-size: 13px; color: #334155; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 0 0 20px 0;">${ticket.description}</p>
      ` : ''}

      ${ticket.manager_notes ? `
        <div class="notes-box">
          <strong>Manager Instructions:</strong><br>
          ${ticket.manager_notes}
        </div>
      ` : ''}
    `
  );

  try {
    await transporter.sendMail({ from: fromAddress, to: email, subject, html: bodyHtml });
    console.log(`[EmailService] Sent TECHNICIAN_ASSIGNED email for Ticket #${ticket.id} to Technician (${email})`);
  } catch (err) {
    console.error('[EmailService] Error sending technician assigned email:', err.message);
  }

  await logNotification(pool, {
    ticketId: ticket.id,
    recipientEmail: email,
    recipientName: name,
    subject,
    eventType: 'TECHNICIAN_ASSIGNED',
    messageBody: `Assigned task "${ticket.title}" at ${ticket.location || 'N/A'}.`
  });
}

/**
 * 3. Send Notification: Technician Submits Solvation / Proof of Work (Alert to Manager minhaj.dssc1@gmail.com)
 */
async function sendTechnicianResolvedNotification(pool, { ticket, managerEmail, technicianName, workerNotes }) {
  const email = managerEmail || 'minhaj.dssc1@gmail.com';
  const techName = technicianName || ticket.tech_name || 'Technician Alex';
  const subject = `[KNOT Manager Review] Work Solvation Submitted for #TKT-${String(ticket.id).padStart(4, '0')}`;
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'minhaj.dssc2@gmail.com';

  const bodyHtml = wrapHtmlTemplate(
    subject,
    'Technician has completed maintenance work and submitted proof of solvation for your review.',
    `
      <span class="badge badge-purple">Solvation Submitted • Manager Review Needed</span>
      <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px;">Hello Maintenance Manager,</h3>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        Technician <strong>${techName}</strong> has completed maintenance work on <strong>#TKT-${String(ticket.id).padStart(4, '0')} (${ticket.title})</strong> and submitted resolved proof (photo + notes) for comparison.
      </p>

      <div class="info-box">
        <div class="info-row"><span class="info-label">Ticket ID:</span> <span class="info-value">#TKT-${String(ticket.id).padStart(4, '0')}</span></div>
        <div class="info-row"><span class="info-label">Issue Title:</span> <span class="info-value">${ticket.title}</span></div>
        <div class="info-row"><span class="info-label">Location:</span> <span class="info-value">${ticket.location || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Technician:</span> <span class="info-value">${techName}</span></div>
        <div class="info-row"><span class="info-label">Status:</span> <span class="info-value">Work Solvation Submitted</span></div>
      </div>

      ${workerNotes || ticket.maintenance_notes ? `
        <div class="notes-box">
          <strong>🔧 Technician Solvation Notes:</strong><br>
          ${workerNotes || ticket.maintenance_notes}
        </div>
      ` : ''}

      <p style="font-size: 13px; color: #64748b;">Please log in to the Manager Dashboard to compare before/after photos & notes, and confirm resolution or send next resolving steps.</p>
    `
  );

  try {
    await transporter.sendMail({ from: fromAddress, to: email, subject, html: bodyHtml });
    console.log(`[EmailService] Sent TECHNICIAN_SOLVATION email for Ticket #${ticket.id} to Manager (${email})`);
  } catch (err) {
    console.error('[EmailService] Error sending solvation email to manager:', err.message);
  }

  await logNotification(pool, {
    ticketId: ticket.id,
    recipientEmail: email,
    recipientName: 'Maintenance Manager',
    subject,
    eventType: 'WORK_SUBMITTED',
    messageBody: `Technician ${techName} submitted solvation for "${ticket.title}".`
  });
}

/**
 * 4a. Send Notification: Manager Sends Next Step Instruction (To Technician Alex slminsgaming@gmail.com)
 */
async function sendNextStepNotification(pool, { ticket, technicianEmail, technicianName, managerNotes }) {
  const email = technicianEmail || 'slminsgaming@gmail.com';
  const name = technicianName || 'Technician Alex';
  const subject = `[KNOT Action Required] Next Resolving Step for #TKT-${String(ticket.id).padStart(4, '0')}`;
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'minhaj.dssc2@gmail.com';

  const bodyHtml = wrapHtmlTemplate(
    subject,
    'Manager has sent next resolving step instructions for your active task.',
    `
      <span class="badge badge-amber">Action Required • Next Step</span>
      <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px;">Hello ${name},</h3>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        The Maintenance Manager has reviewed work order <strong>#TKT-${String(ticket.id).padStart(4, '0')} (${ticket.title})</strong> and issued next resolving step instructions for you.
      </p>

      <div class="notes-box">
        <strong>📋 Manager Guidance & Next Step:</strong><br>
        ${managerNotes || ticket.manager_notes || 'Please perform additional inspection as instructed.'}
      </div>

      <div class="info-box">
        <div class="info-row"><span class="info-label">Ticket ID:</span> <span class="info-value">#TKT-${String(ticket.id).padStart(4, '0')}</span></div>
        <div class="info-row"><span class="info-label">Issue Title:</span> <span class="info-value">${ticket.title}</span></div>
        <div class="info-row"><span class="info-label">Location:</span> <span class="info-value">${ticket.location || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Status:</span> <span class="info-value">In Progress (Next Step Required)</span></div>
      </div>

      <p style="font-size: 13px; color: #64748b;">Please log in to your Technician Portal to submit your updated proof of work after completing these steps.</p>
    `
  );

  try {
    await transporter.sendMail({ from: fromAddress, to: email, subject, html: bodyHtml });
    console.log(`[EmailService] Sent NEXT_STEP_SENT email for Ticket #${ticket.id} to Technician (${email})`);
  } catch (err) {
    console.error('[EmailService] Error sending next step email to technician:', err.message);
  }

  await logNotification(pool, {
    ticketId: ticket.id,
    recipientEmail: email,
    recipientName: name,
    subject,
    eventType: 'NEXT_STEP_SENT',
    messageBody: `Manager instructions: ${managerNotes || ticket.manager_notes || 'Next step requested'}`
  });
}

/**
 * 4b. Send Notification: Manager Verifies Resolution
 * - Email #1: Sent to Technician Alex (slminsgaming@gmail.com) confirming work verified & approved
 * - Email #2: Sent to Student (e22237@eng.pdn.ac.lk) confirming issue fully resolved
 */
async function sendTicketResolvedNotification(pool, { ticket, reporterEmail, reporterName, technicianEmail }) {
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'minhaj.dssc2@gmail.com';
  const studentEmail = reporterEmail || 'e22237@eng.pdn.ac.lk';
  const studentName = reporterName || ticket.reported_by || 'Student e22237';
  const techEmail = technicianEmail || 'slminsgaming@gmail.com';

  // Email to Student
  const subject = `[KNOT Resolved] Maintenance Completed: ${ticket.title} (#TKT-${String(ticket.id).padStart(4, '0')})`;
  const bodyHtml = wrapHtmlTemplate(
    subject,
    'Your reported maintenance issue has been resolved and verified.',
    `
      <span class="badge badge-emerald">Issue Fully Resolved</span>
      <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px;">Hello ${studentName},</h3>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        Great news! The reported maintenance issue at <strong>${ticket.location || 'campus'}</strong> has been fixed by our technician and verified by the Maintenance Manager.
      </p>

      <div class="info-box">
        <div class="info-row"><span class="info-label">Ticket ID:</span> <span class="info-value">#TKT-${String(ticket.id).padStart(4, '0')}</span></div>
        <div class="info-row"><span class="info-label">Issue Title:</span> <span class="info-value">${ticket.title}</span></div>
        <div class="info-row"><span class="info-label">Location:</span> <span class="info-value">${ticket.location || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Verification:</span> <span class="info-value">✓ Verified by Manager</span></div>
      </div>

      ${ticket.maintenance_notes ? `
        <p style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Resolution Notes Logged:</p>
        <p style="font-size: 13px; color: #334155; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 0 0 20px 0;">${ticket.maintenance_notes}</p>
      ` : ''}

      <p style="font-size: 13px; color: #64748b;">Thank you for helping us keep KNOT Campus facilities clean, safe, and operational!</p>
    `
  );

  try {
    await transporter.sendMail({ from: fromAddress, to: studentEmail, subject, html: bodyHtml });
    console.log(`[EmailService] Sent WORK_RESOLVED email for Ticket #${ticket.id} to Student (${studentEmail})`);
  } catch (err) {
    console.error('[EmailService] Error sending student resolved email:', err.message);
  }

  await logNotification(pool, {
    ticketId: ticket.id,
    recipientEmail: studentEmail,
    recipientName: studentName,
    subject,
    eventType: 'WORK_RESOLVED',
    messageBody: `Issue "${ticket.title}" verified resolved by Maintenance Manager.`
  });

  // Email to Technician Alex confirming resolution approval
  const techSubject = `[KNOT Verified] Work Order #${String(ticket.id).padStart(4, '0')} Resolution Approved`;
  const techBodyHtml = wrapHtmlTemplate(
    techSubject,
    'Your submitted work order resolution has been reviewed, verified, and closed by Manager.',
    `
      <span class="badge badge-emerald">Work Order Verified & Closed</span>
      <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px;">Hello Technician Alex,</h3>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        Your submitted proof of solvation for <strong>#TKT-${String(ticket.id).padStart(4, '0')} (${ticket.title})</strong> has been reviewed, verified, and officially approved by the Maintenance Manager.
      </p>

      <div class="info-box">
        <div class="info-row"><span class="info-label">Ticket ID:</span> <span class="info-value">#TKT-${String(ticket.id).padStart(4, '0')}</span></div>
        <div class="info-row"><span class="info-label">Task:</span> <span class="info-value">${ticket.title}</span></div>
        <div class="info-row"><span class="info-label">Status:</span> <span class="info-value">Resolved & Closed</span></div>
      </div>
    `
  );

  try {
    await transporter.sendMail({ from: fromAddress, to: techEmail, subject: techSubject, html: techBodyHtml });
    console.log(`[EmailService] Sent WORK_RESOLVED email for Ticket #${ticket.id} to Technician (${techEmail})`);
  } catch (err) {
    console.error('[EmailService] Error sending technician resolved email:', err.message);
  }

  await logNotification(pool, {
    ticketId: ticket.id,
    recipientEmail: techEmail,
    recipientName: 'Technician Alex',
    subject: techSubject,
    eventType: 'WORK_RESOLVED',
    messageBody: `Work order #${ticket.id} resolution verified and approved by Manager.`
  });
}

/**
 * 6. Booking Notification: Room Booking Created
 */
async function sendBookingCreatedNotification(pool, { booking, studentEmail, studentName, lecturerEmail, arAdminEmail }) {
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'minhaj.dssc2@gmail.com';
  const email = studentEmail || 'e22237@eng.pdn.ac.lk';
  const name = studentName || 'Student Minhaj Ali';
  const arEmail = arAdminEmail || 'minhaj.dssc3@gmail.com';

  // Email to Student
  const subject = `[KNOT Booking] Request Received: ${booking.title} (${booking.time_display})`;
  const bodyHtml = wrapHtmlTemplate(
    subject,
    'Your space booking request has been registered.',
    `
      <span class="badge badge-blue">Booking Request Received</span>
      <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px;">Hello ${name},</h3>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        We have received your room booking request for <strong>${booking.title}</strong>. Your request is now being processed by campus operations.
      </p>

      <div class="info-box">
        <div class="info-row"><span class="info-label">Room / Space:</span> <span class="info-value">${booking.title}</span></div>
        <div class="info-row"><span class="info-label">Time Slot:</span> <span class="info-value">${booking.time_display}</span></div>
        <div class="info-row"><span class="info-label">Booking Type:</span> <span class="info-value">${booking.booking_type || 'AR Office'}</span></div>
        <div class="info-row"><span class="info-label">Status:</span> <span class="info-value">${booking.status || 'Pending'}</span></div>
        ${booking.purpose ? `<div class="info-row"><span class="info-label">Purpose:</span> <span class="info-value">${booking.purpose}</span></div>` : ''}
      </div>
    `
  );

  try {
    await transporter.sendMail({ from: fromAddress, to: email, subject, html: bodyHtml });
    console.log(`[EmailService] Sent BOOKING_CREATED email to Student (${email})`);
  } catch (err) {
    console.error('[EmailService] Error sending student booking email:', err.message);
  }

  await logNotification(pool, {
    ticketId: booking.id,
    recipientEmail: email,
    recipientName: name,
    subject,
    eventType: 'BOOKING_CREATED',
    messageBody: `Booking request received for ${booking.title} (${booking.time_display}).`
  });

  // Alert to Lecturer if assigned
  if (lecturerEmail) {
    const lecSubject = `[KNOT Lecturer Alert] Student Booking Request: ${booking.title}`;
    const lecBodyHtml = wrapHtmlTemplate(
      lecSubject,
      'A student has requested your recommendation for a lecture hall booking.',
      `
        <span class="badge badge-amber">Lecturer Recommendation Required</span>
        <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px;">Hello Lecturer,</h3>
        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
          Student <strong>${name} (${email})</strong> has submitted a booking request for <strong>${booking.title}</strong> and selected you as the supervising lecturer.
        </p>

        <div class="info-box">
          <div class="info-row"><span class="info-label">Space:</span> <span class="info-value">${booking.title}</span></div>
          <div class="info-row"><span class="info-label">Time Slot:</span> <span class="info-value">${booking.time_display}</span></div>
          <div class="info-row"><span class="info-label">Requester:</span> <span class="info-value">${name} (${email})</span></div>
          ${booking.purpose ? `<div class="info-row"><span class="info-label">Purpose:</span> <span class="info-value">${booking.purpose}</span></div>` : ''}
        </div>

        <p style="font-size: 13px; color: #64748b;">Action Required: Log in to your Lecturer Portal to approve or decline this request.</p>
      `
    );

    try {
      await transporter.sendMail({ from: fromAddress, to: lecturerEmail, subject: lecSubject, html: lecBodyHtml });
      console.log(`[EmailService] Sent LECTURER_BOOKING_ALERT to Lecturer (${lecturerEmail})`);
    } catch (err) {
      console.error('[EmailService] Error sending lecturer alert email:', err.message);
    }

    await logNotification(pool, {
      ticketId: booking.id,
      recipientEmail: lecturerEmail,
      recipientName: 'Lecturer',
      subject: lecSubject,
      eventType: 'BOOKING_CREATED',
      messageBody: `Student ${name} requested booking recommendation for ${booking.title}.`
    });
  } else {
    // Alert to AR Booking Manager (minhaj.dssc3@gmail.com)
    const arSubject = `[KNOT AR Alert] New Space Booking Request: ${booking.title}`;
    const arBodyHtml = wrapHtmlTemplate(
      arSubject,
      'A new room booking request has been submitted for AR Office review.',
      `
        <span class="badge badge-purple">AR Booking Review Needed</span>
        <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px;">Hello AR Booking Administrator,</h3>
        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
          A new room booking request has been submitted by <strong>${name} (${email})</strong>.
        </p>

        <div class="info-box">
          <div class="info-row"><span class="info-label">Space:</span> <span class="info-value">${booking.title}</span></div>
          <div class="info-row"><span class="info-label">Time Slot:</span> <span class="info-value">${booking.time_display}</span></div>
          <div class="info-row"><span class="info-label">Requester:</span> <span class="info-value">${name} (${email})</span></div>
        </div>
      `
    );

    try {
      await transporter.sendMail({ from: fromAddress, to: arEmail, subject: arSubject, html: arBodyHtml });
      console.log(`[EmailService] Sent AR_BOOKING_ALERT to AR Admin (${arEmail})`);
    } catch (err) {
      console.error('[EmailService] Error sending AR admin alert email:', err.message);
    }

    await logNotification(pool, {
      ticketId: booking.id,
      recipientEmail: arEmail,
      recipientName: 'AR Booking Admin',
      subject: arSubject,
      eventType: 'BOOKING_CREATED',
      messageBody: `New room booking request for ${booking.title} submitted by ${name}.`
    });
  }
}

/**
 * 7. Booking Notification: Lecturer Approved / Recommended Request
 */
async function sendBookingLecturerApprovedNotification(pool, { booking, studentEmail, studentName, lecturerName, arAdminEmail }) {
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'minhaj.dssc2@gmail.com';
  const email = studentEmail || 'e22237@eng.pdn.ac.lk';
  const name = studentName || 'Student Minhaj Ali';
  const lecName = lecturerName || 'Dr. Smith';
  const arEmail = arAdminEmail || 'minhaj.dssc3@gmail.com';

  const subject = `[KNOT Booking Update] Lecturer Recommended: ${booking.title}`;
  const bodyHtml = wrapHtmlTemplate(
    subject,
    'Your booking request has been recommended by the lecturer.',
    `
      <span class="badge badge-emerald">Lecturer Recommended</span>
      <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px;">Hello ${name},</h3>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        Great news! <strong>${lecName}</strong> has approved and recommended your booking request for <strong>${booking.title}</strong> (${booking.time_display}).
      </p>

      <div class="info-box">
        <div class="info-row"><span class="info-label">Room / Space:</span> <span class="info-value">${booking.title}</span></div>
        <div class="info-row"><span class="info-label">Time Slot:</span> <span class="info-value">${booking.time_display}</span></div>
        <div class="info-row"><span class="info-label">Recommended By:</span> <span class="info-value">${lecName}</span></div>
        <div class="info-row"><span class="info-label">Current Status:</span> <span class="info-value">${booking.status}</span></div>
      </div>
    `
  );

  try {
    await transporter.sendMail({ from: fromAddress, to: email, subject, html: bodyHtml });
    console.log(`[EmailService] Sent LECTURER_APPROVED email to Student (${email})`);
  } catch (err) {
    console.error('[EmailService] Error sending lecturer approval email to student:', err.message);
  }

  await logNotification(pool, {
    ticketId: booking.id,
    recipientEmail: email,
    recipientName: name,
    subject,
    eventType: 'BOOKING_UPDATED',
    messageBody: `${lecName} recommended booking for ${booking.title}.`
  });

  if (booking.status === 'Pending AR') {
    const arSubject = `[KNOT AR Review] Lecturer Approved Request: ${booking.title}`;
    const arBodyHtml = wrapHtmlTemplate(
      arSubject,
      'A lecturer-recommended booking is waiting for final AR approval.',
      `
        <span class="badge badge-purple">Lecturer Approved - Pending AR Sign-off</span>
        <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px;">Hello AR Booking Administrator,</h3>
        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
          Lecturer <strong>${lecName}</strong> has approved student <strong>${name}'s</strong> request for <strong>${booking.title}</strong>. Please log in to issue final AR approval.
        </p>
      `
    );

    try {
      await transporter.sendMail({ from: fromAddress, to: arEmail, subject: arSubject, html: arBodyHtml });
    } catch(e){}
  }
}

/**
 * 8. Booking Notification: Lecturer Rejected Request
 */
async function sendBookingLecturerRejectedNotification(pool, { booking, studentEmail, studentName, lecturerName, reason }) {
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'minhaj.dssc2@gmail.com';
  const email = studentEmail || 'e22237@eng.pdn.ac.lk';
  const name = studentName || 'Student Minhaj Ali';
  const lecName = lecturerName || 'Dr. Smith';

  const subject = `[KNOT Booking Update] Request Declined by Lecturer: ${booking.title}`;
  const bodyHtml = wrapHtmlTemplate(
    subject,
    'Your booking request was declined by the lecturer.',
    `
      <span class="badge badge-amber">Request Declined by Lecturer</span>
      <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px;">Hello ${name},</h3>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        Your booking request for <strong>${booking.title}</strong> (${booking.time_display}) was declined by <strong>${lecName}</strong>.
      </p>

      <div class="info-box">
        <div class="info-row"><span class="info-label">Room / Space:</span> <span class="info-value">${booking.title}</span></div>
        <div class="info-row"><span class="info-label">Time Slot:</span> <span class="info-value">${booking.time_display}</span></div>
        <div class="info-row"><span class="info-label">Declined By:</span> <span class="info-value">${lecName}</span></div>
      </div>

      ${reason ? `
        <div class="notes-box">
          <strong>Lecturer Note:</strong> ${reason}
        </div>
      ` : ''}
    `
  );

  try {
    await transporter.sendMail({ from: fromAddress, to: email, subject, html: bodyHtml });
    console.log(`[EmailService] Sent LECTURER_REJECTED email to Student (${email})`);
  } catch (err) {
    console.error('[EmailService] Error sending lecturer rejection email:', err.message);
  }

  await logNotification(pool, {
    ticketId: booking.id,
    recipientEmail: email,
    recipientName: name,
    subject,
    eventType: 'BOOKING_REJECTED',
    messageBody: `${lecName} declined booking for ${booking.title}. Reason: ${reason || 'N/A'}`
  });
}

/**
 * 9. Booking Notification: Final Booking Approved (Room Pass Issued)
 */
async function sendBookingApprovedNotification(pool, { booking, studentEmail, studentName, approvedBy }) {
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'minhaj.dssc2@gmail.com';
  const email = studentEmail || 'e22237@eng.pdn.ac.lk';
  const name = studentName || 'Student Minhaj Ali';

  const subject = `[KNOT Booking Approved] Official Room Pass: ${booking.title} (${booking.time_display})`;
  const bodyHtml = wrapHtmlTemplate(
    subject,
    'Your room booking is officially approved. Here is your digital pass.',
    `
      <span class="badge badge-emerald">✓ Booking Approved & Confirmed</span>
      <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px;">Congratulations ${name}!</h3>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        Your room booking request for <strong>${booking.title}</strong> has been officially approved by the AR Office.
      </p>

      <div class="info-box" style="border: 2px solid #10b981; background: #ecfdf5;">
        <div style="font-[10px]; font-weight: 700; color: #047857; text-transform: uppercase; margin-bottom: 8px; border-b: 1px border #a7f3d0; pb-1;">OFFICIAL KNOT DIGITAL ROOM PASS</div>
        <div class="info-row"><span class="info-label">Venue / Room:</span> <span class="info-value" style="color: #047857;">${booking.title}</span></div>
        <div class="info-row"><span class="info-label">Reserved Slot:</span> <span class="info-value">${booking.time_display}</span></div>
        <div class="info-row"><span class="info-label">Authorized Requester:</span> <span class="info-value">${name}</span></div>
        <div class="info-row"><span class="info-label">Approval Status:</span> <span class="info-value" style="color: #047857;">APPROVED</span></div>
      </div>

      <p style="font-size: 13px; color: #64748b;">Please present this email pass to campus security or building supervisors if requested.</p>
    `
  );

  try {
    await transporter.sendMail({ from: fromAddress, to: email, subject, html: bodyHtml });
    console.log(`[EmailService] Sent BOOKING_APPROVED email to Student (${email})`);
  } catch (err) {
    console.error('[EmailService] Error sending booking approval email:', err.message);
  }

  await logNotification(pool, {
    ticketId: booking.id,
    recipientEmail: email,
    recipientName: name,
    subject,
    eventType: 'BOOKING_APPROVED',
    messageBody: `Booking for ${booking.title} (${booking.time_display}) approved.`
  });
}

/**
 * 10. Booking Notification: Booking Rejected / Conflict Warning
 */
async function sendBookingRejectedNotification(pool, { booking, studentEmail, studentName, reason }) {
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'minhaj.dssc2@gmail.com';
  const email = studentEmail || 'e22237@eng.pdn.ac.lk';
  const name = studentName || 'Student Minhaj Ali';

  const subject = `[KNOT Booking Update] Request Declined: ${booking.title}`;
  const bodyHtml = wrapHtmlTemplate(
    subject,
    'Your booking request was declined.',
    `
      <span class="badge badge-amber">Booking Request Declined</span>
      <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px;">Hello ${name},</h3>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        Your booking request for <strong>${booking.title}</strong> (${booking.time_display}) could not be completed.
      </p>

      <div class="info-box">
        <div class="info-row"><span class="info-label">Room / Space:</span> <span class="info-value">${booking.title}</span></div>
        <div class="info-row"><span class="info-label">Time Slot:</span> <span class="info-value">${booking.time_display}</span></div>
        <div class="info-row"><span class="info-label">Status:</span> <span class="info-value">Rejected</span></div>
      </div>

      <div class="notes-box">
        <strong>Reason:</strong> ${reason || 'Time slot unavailable or room conflict detected.'}
      </div>
    `
  );

  try {
    await transporter.sendMail({ from: fromAddress, to: email, subject, html: bodyHtml });
    console.log(`[EmailService] Sent BOOKING_REJECTED email to Student (${email})`);
  } catch (err) {
    console.error('[EmailService] Error sending booking rejection email:', err.message);
  }

  await logNotification(pool, {
    ticketId: booking.id,
    recipientEmail: email,
    recipientName: name,
    subject,
    eventType: 'BOOKING_REJECTED',
    messageBody: `Booking for ${booking.title} rejected. Reason: ${reason || 'N/A'}`
  });
}

module.exports = {
  sendTicketCreatedNotification,
  sendTechnicianAssignedNotification,
  sendTechnicianResolvedNotification,
  sendNextStepNotification,
  sendTicketResolvedNotification,
  sendBookingCreatedNotification,
  sendBookingLecturerApprovedNotification,
  sendBookingLecturerRejectedNotification,
  sendBookingApprovedNotification,
  sendBookingRejectedNotification
};
