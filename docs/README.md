---
layout: home
permalink: index.html

# Please update this with your repository name and project title
repository-name: e22-co2060-Project-KNOT
title: Project KNOT – University Resource & Maintenance Management Platform
---

# Project KNOT – System Milestones & Documentation
> **University Resource & Maintenance Management Platform**  
> **Faculty of Engineering, University of Peradeniya**  
> **Final Evaluation (2nd Year Project - 4th Milestone)**

---

## Team
-  E/22/237, M. F. M. Minhaj Ali, [e22237@eng.pdn.ac.lk](mailto:e22237@eng.pdn.ac.lk)
-  E/22/366, M. D. S. Senanayake, [e22366@eng.pdn.ac.lk](mailto:e22366@eng.pdn.ac.lk)
-  E/22/280, H. C. V. Perera, [e22280@eng.pdn.ac.lk](mailto:e22280@eng.pdn.ac.lk)
-  E/22/443, W. M. E. N. Wijesinghe, [e22443@eng.pdn.ac.lk](mailto:e22443@eng.pdn.ac.lk)

## Supervisor
-  Prof. Roshan G. Ragel, [roshanr@eng.pdn.ac.lk](mailto:roshanr@eng.pdn.ac.lk)

---

## 🌐 Live Production Deployment
- **Main Web Application**: **[https://foe.knotpdn.tech](https://foe.knotpdn.tech)**
- **REST API Backend**: **[https://backend.knotpdn.tech](https://backend.knotpdn.tech)**

---

## 📚 Complete System Guides

- 🛠️ **Developer & Maintainer Guide**: [PDF Document](Team_19_DEVELOPER_GUIDE.pdf)
  - *Technical architecture, database models, micro-service gateway proxy setup, 2-step verification background cron jobs, Cloudflare Edge Tunnels, and API reference.*
- 📖 **Comprehensive User Manual**: [PDF Document](Project_KNOT_User_Manual.pdf)
  - *Role-based step-by-step user manual for Students, Lecturers, Booking Admins (AR Office), Maintenance Admins, and Field Technicians.*
- 🧪 **System Testing & Validation Report**: [Markdown Version](TESTING_AND_VALIDATION.md) | [Word Document (.docx)](TESTING_AND_VALIDATION.docx)
  - *Automated test execution logs (100% pass rate), code coverage metrics (95.1%), manual test traceability matrix (RTM), bug resolution log, hosting/tunnel validation, and performance benchmarks.*
- 🐳 **Docker Containerization Guide**: [Markdown Version](DOCKER_GUIDE.md) | [Word Document (.docx)](DOCKER_GUIDE.docx)
  - *Complete Docker & Docker Compose setup, multi-container architecture, Nginx proxy, MySQL volume persistence, and one-command deployment instructions.*

---

#### Table of Contents
1. [Introduction](#introduction)
2. [Milestone Progress & Implemented Features](#milestone-progress--implemented-features)
3. [Solution Architecture](#solution-architecture)
4. [Software Designs](#software-designs)
5. [Testing & System Validation](#testing--system-validation)
6. [Conclusion & Future Work](#conclusion--future-work)
7. [Links](#links)

---

## Introduction

#### The Problem
Universities and large educational institutions often suffer from highly fragmented administrative systems. Currently, the processes for booking academic resources (such as lecture halls, labs, and seminar rooms) and reporting infrastructure faults are disconnected. This leads to severe coordination issues between students, academic staff (lecturers), administrative registries (AR), and maintenance technicians. The real-world consequences include double-booked lecture halls, untracked maintenance requests that take weeks to resolve, ghost bookings, and a general lack of transparency regarding request statuses.

#### The Solution
Project KNOT is a unified, centralized resource and maintenance management platform. It solves this fragmentation by offering a single, Role-Based Access Control (RBAC) ecosystem with specialized workflows for Students, Lecturers, Booking Admins, Maintenance Admins, and Field Technicians, supported by automated 2-step attendance verification, Nodemailer email dispatch, multi-container Docker infrastructure, and Cloudflare zero-trust edge hosting.

---

## Milestone Progress & Implemented Features

### 🔹 Milestone 1: Core Foundation & Architecture
1. **Multi-Role Authentication & Role-Based Access Control (RBAC)**:
   - Built a secure login framework supporting Students, Lecturers, Booking Admins, Maintenance Admins, and Technicians.
2. **Resource Database Schema Normalization**:
   - Initial database design for lecture halls, labs, and seminar rooms with capacity metrics and operational status tracking.
3. **UI Dashboard Framework**:
   - Developed responsive Single Page Application (SPA) layouts using React.js and Tailwind CSS with glassmorphic elements and dark/light modes.

---

### 🔹 Milestone 2: Academic Booking Workflow & Maintenance Reporting
1. **Multi-Tier Academic Approval Workflow**:
   - Implemented 3-stage reservation approval chain: Student Request ➡️ Lecturer Endorsement ➡️ Booking Admin Final Approval.
2. **Basic Fault Reporting Module**:
   - Implemented issue submission features allowing campus users to report infrastructure faults with category tags and priority levels.

---

### 🔹 Milestone 3: Real-Time Availability Grid, Worker Portal, Bulk Schedule Import & System Integration
1. **Bulk Semester Schedule Import Implementation (Dean's Requirement)**:
   - **Master Timetable Ingestion Engine**: Implemented specifically per the Dean's requirement to handle pre-booked master semester timetables.
   - **Automated Validation & Ingestion**: Parses semester schedule files, extracts day/time/hall/lecturer attributes, automatically verifies conflicts against existing database reservations, skips overlapping slots, and bulk-populates recurring semester lectures into the system.

2. **Interactive Real-Time Hall Availability Grid**:
   - Visual hourly slot selection grid (08:00 AM – 06:00 PM) replacing static dropdowns.
   - Real-time database queries displaying booked status badges (`Available`, `Booked: [Purpose]`, `Already Passed`) and preventing double-booking over occupied ranges.

3. **Maintenance Worker Portal Integration & Admin Task Assignment**:
   - **Admin Task Assignment & Dispatch**: Maintenance Admins review fault reports, assign specific technicians (*Alex Johnson*, *Sam Carter*), set priority levels, and attach technical directives.
   - **Technician Task Queue (`TechnicianDashboard`)**: Technicians access a personal, real-time job queue filtering tickets assigned specifically to their ID.
   - **Interactive Task Modal & Evidence Inspector**: Technicians inspect location info, map coordinates, reporter notes, and user evidence photos.
   - **Status Progression & Work Logs**: Technicians update jobs in real-time (`Open` ➡️ `In Progress` ➡️ `Resolved`), add maintenance resolution notes, and upload proof-of-work photos upon completion.

4. **Booking Admin Portal Automated Approval System & Multi-Criteria Filtering**:
   - **Automated Reservation Approval Engine**: Implemented an automated booking approval system in the Booking Admin Portal. When enabled (`auto_booking: true`), routine conflict-free hall booking requests are automatically validated against existing reservations and instantly approved (`Approved`) without administrative delay.
   - **Configurable Control Panel**: Configurable toggle in Booking Admin System Settings with persistent MySQL database state (`settings` table) allowing admins to toggle between automated approvals and manual AR office reviews.
   - **Multi-Criteria Search & Filter**: Filter by Search Text (matching room, lecturer name, user role, or purpose), Multi-Select Room badges (e.g., `EOE Hall`, `DO1`, `Lecture Hall 1`), Quick Date Presets (`Today`, `Tomorrow`, `This Week`, `Future`), Custom Date Ranges, and Status (`Approved`, `Pending AR`, `Pending`, `Rejected`).
   - **Flexible Sorting**: Sort table rows by Date (Newest/Oldest), Lecture Hall Name, or Status.

5. **Semester Timetable Calendar Enhancements**:
   - Native HTML5 datepicker calendar integration.
   - Datepicker-filtered **Agenda View** displaying lectures strictly for selected dates.
   - Dedicated single-room grid timeline view when filtering by a specific hall.
   - Standardized 10 uniform lecture hall names across all UI elements and database schemas (`EOE Hall`, `DO1`, `DO2`, `Lecture Hall 1`, `Lecture Hall 2`, `Seminar Room 1`, `Seminar Room 2`, `Computer Lab 1`, `Computer Lab 2`, `Main Auditorium`).

6. **Maintenance Reporting & Admin Evidence Viewer**:
   - Integrated OpenStreetMap (Leaflet) with reverse geocoding (Nominatim API) and map pin dropping.
   - High-resolution photo evidence upload support with 50MB JSON payload limits.
   - Maintenance Admin Ticket Details view with a dedicated **Evidence Photo Viewer**.

---

### 🌟 Milestone 4: 2-Step Verification, Email Dispatch, Profile Management, Docker & Cloudflare Production Deployment (Final Evaluation)
1. **Automated 2-Step Booking Verification & Background Anti-No-Show Engine**:
   - **Attendance Verification Workflow**: Built a 2-step verification system to eliminate ghost bookings and unverified hall reservations.
   - **60-Second Background Cron Worker**: Runs continuous minute-by-minute checks (`server.js`) scanning for unverified pending holds, auto-expiring unconfirmed reservations, and releasing room allocations back to the public pool.

2. **Nodemailer Automated Email Notification Dispatcher**:
   - **SMTP Email Service Integration**: Integrated Nodemailer with responsive HTML templates for all key system events.
   - **Real-Time Transactional Alerts**: Automatic dispatch of email alerts for booking status changes (Approved/Rejected), verification reminders, fault ticket filings, technician task dispatches, and ticket resolution logs.

3. **Flexible Dual-Credential Authentication (Username or Email)**:
   - **Multi-Credential Login Engine**: Enhanced authentication endpoints (`/api/auth/login`) allowing users across all 5 user roles to log in using either their Registration Number / Username (e.g., `e22237`) or their verified Email Address (`e22237@eng.pdn.ac.lk`).

4. **User Profile & Credentials Management Module**:
   - **Profile Settings Panel**: Added user profile management across all dashboards allowing users to view/edit display names, phone numbers, addresses, employee/student IDs, avatar graphics, and securely update passwords with instant MySQL persistence.

5. **Production Multi-Container Docker & Docker Compose Environment**:
   - **Containerized Micro-Services**: Built a production stack using `docker-compose.yml`, multi-stage `Dockerfile`s, Nginx proxy, persistent MySQL volume mounts, and automated schema migration scripts (`setup_db.js`).

6. **Cloudflare Zero-Trust Edge Tunnel & Production Hosting Architecture**:
   - **Live Production Deployment**: Hosted live at **`https://foe.knotpdn.tech`** and **`https://backend.knotpdn.tech`**.
   - **Zero-Trust Edge Proxy**: Secured with Cloudflare Edge Tunnel (`cloudflared`), PM2 process management, and SSL/TLS encryption for 24/7 uptime.

7. **Comprehensive System Testing & Code Coverage Suite**:
   - **Automated Validation Suite**: Test runner (`test_runner.js`) achieving 100% test pass rate across unit and API integration suites and 95.1% code coverage.
   - **Full Documentation Artifacts**: Complete Developer Guide, User Manual, Docker Deployment Guide, and System Testing & Validation Report (both Markdown and Microsoft Word `.docx` formats).

---

## Solution Architecture

Project KNOT utilizes a modern, decoupled Client-Server Architecture to ensure scalability and maintainability.

- **Frontend (Client):** Built using React.js (Vite) and Tailwind CSS for a responsive, modern UI. Utilizes Lucide & Material Symbols icons, Leaflet map components, and local state management for snappy SPA rendering.
- **Backend (Server):** Powered by Node.js and Express.js with a unified proxy gateway (`gateway_server.js`), RESTful APIs with 50MB payload limits, Nodemailer SMTP service, and 60-second cron verification worker.
- **Database:** MySQL relational database (`knot_db`) normalized into core tables (`users`, `rooms`, `bookings`, `faults`, `settings`) with dynamic schema migration scripts (`setup_db.js`).
- **Production & Hosting:** Containerized via Docker Compose, reverse-proxied with Nginx, managed via PM2, and exposed via Cloudflare Zero-Trust Edge Tunnels.

---

## Software Designs

#### 3.1 User Interface (UI) Design
The system employs a "View-Based Navigation" architecture. Dashboards utilize dynamic component rendering and RBAC authentication guards to seamlessly mount appropriate interfaces for Students, Lecturers, Booking Admins, Maintenance Admins, and Technicians.

#### 3.2 Database Schema Design
Normalized relational schema:
- **`users`**: RBAC credentials & profile data (`id`, `username`, `password`, `name`, `role`, `department`, `email`, `phone`, `employee_no`, `address`, `avatar`).
- **`rooms`**: Asset management (`id`, `name`, `capacity`, `type`, `status`).
- **`bookings`**: Reservation state (`id`, `title`, `time_display`, `status`, `assigned_lecturer`, `purpose`, `end_time`, `rejection_reason`, `booking_type`, `verification_code`, `is_verified`).
- **`faults`**: Maintenance tickets (`id`, `title`, `description`, `location`, `priority`, `status`, `photo_url`, `assigned_technician_id`, `maintenance_notes`, `worker_photo`, `admin_verified`).
- **`settings`**: System configurations (`auto_booking` state).

#### 3.3 Business Logic & Workflow Designs
1. **2-Step Booking Verification & Auto-Expiration**: Booking created ➡️ Verification code generated ➡️ Student verifies attendance ➡️ Background cron auto-purges expired unverified holds.
2. **Dean's Bulk Timetable Ingestion**: Booking Admin uploads master schedule file ➡️ Backend parses slots & validates conflicts ➡️ Bulk inserts valid semester lectures into database.
3. **Multi-Criteria Booking Filter & Sort**: Booking Admin toggles room badges, date ranges, and status pills ➡️ Dynamic client-side filter engine updates "All Bookings" table instantly.
4. **Worker Task Assignment**: Maintenance Admin assigns fault ticket ➡️ Assigned Technician views task on Worker Portal, updates status (`In Progress` ➡️ `Resolved`), logs work, and uploads proof photo.

---

## Testing & System Validation

Testing was conducted across all system tiers to validate Milestones 1, 2, 3, and 4 requirements:

- **2-Step Verification & Background Cron Testing**: Created unverified test bookings. Confirmed 60-second background worker automatically expired unverified holds and updated availability grid status.
- **Nodemailer SMTP Dispatch Testing**: Triggered booking approvals, ticket submissions, and worker assignments. Verified real-time email dispatch and responsive HTML rendering.
- **Dual-Credential Login Testing**: Authenticated test accounts using both registration numbers (`e22237`) and email addresses (`e22237@eng.pdn.ac.lk`). Verified seamless session generation for both options.
- **Docker Compose Multi-Container Stack Testing**: Built and launched environment via `docker-compose up -d --build`. Verified automated database migrations, Nginx reverse proxy routing, and data volume persistence.
- **Cloudflare Tunnel & Production Infrastructure Validation**: Verified public HTTPS access on `https://foe.knotpdn.tech` and `https://backend.knotpdn.tech`, checked PM2 process uptime, and confirmed edge SSL encryption.
- **Bulk Schedule Ingestion Testing**: Uploaded master semester schedule files. Confirmed automated conflict detection skipped double-bookings while bulk-populating valid lectures across all 10 lecture halls.
- **Worker Portal & Task Assignment Testing**: Assigned tickets to technician `Alex Johnson` via Maintenance Admin view. Confirmed real-time delivery to Alex's Worker Portal, validated status transitions (`In Progress` ➡️ `Resolved`), and verified work log sync.

---

## Conclusion & Future Work

#### What Was Achieved
We successfully designed, developed, integrated, containerized, hosted, and validated all four Milestones of Project KNOT for the final 2nd year project evaluation. The platform provides a complete academic resource booking system, Dean's bulk semester timetable import, 2-step attendance verification engine, Nodemailer automated email alerts, dual-credential login, user profile management, maintenance worker portal with task assignment, Leaflet GIS fault reporting, photo evidence inspection, multi-container Docker stack, and live Cloudflare Zero-Trust production hosting.

#### Future Developments
- **Mobile Native Apps**: React Native wrappers for iOS & Android with native push notifications.
- **IoT Smart Lock Integration**: Automated RFID / Bluetooth door access tied to verified room bookings.
- **Advanced Analytics & Heatmaps**: Visual analytics dashboard for facility utilization rates and predictive maintenance scheduling.

---

## Links

- [Live Web Application](https://foe.knotpdn.tech){:target="_blank"}
- [Live Backend API](https://backend.knotpdn.tech){:target="_blank"}
- [Project Repository](https://github.com/cepdnaclk/e22-co2060-Project-KNOT){:target="_blank"}
- [Department of Computer Engineering](http://www.ce.pdn.ac.lk/)
- [University of Peradeniya](https://eng.pdn.ac.lk/)
