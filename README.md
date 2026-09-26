# KNOT – University Resource & Maintenance Management Platform
## Project No. 19 | Complete Project Milestone Progression (Milestones 1 – 4 Final Evaluation)

## 📌 Project Overview

KNOT is a centralized web-based platform designed to manage university resource booking and maintenance reporting within the Faculty of Engineering, University of Peradeniya. The system integrates lecture hall and laboratory scheduling with campus issue reporting to improve transparency, efficiency, and coordination across students, staff, booking administrators, maintenance administrators, and technicians.

---

## 🎯 Problem Statement

The Faculty traditionally relies on manual record books and informal communication methods (verbal reports, emails) to manage lecture hall bookings and maintenance issues. This leads to:

- Booking conflicts and scheduling errors  
- Lack of visibility into request status  
- Delayed maintenance responses  
- Poor coordination between academic and administrative departments  

KNOT addresses these challenges through a unified digital solution with automated conflict detection, real-time tracking, 2-step verification, and automated email notifications.

---

## 🚀 Milestone Progress & Feature Progression

### 🔹 Milestone 1: Core Foundation & System Architecture
- **Authentication & Role-Based Access Control (RBAC)**:
  - Multi-role authentication framework supporting 5 distinct user roles: Students, Lecturers, Booking Admins (AR Office), Maintenance Admins, and Field Technicians.
- **Resource Database Schemas**:
  - Relational database normalization for lecture halls, drawing offices, seminar rooms, and computer labs with capacity metrics and operational status tracking.
- **Unified UI Architecture & Design System**:
  - Responsive Single Page Application (SPA) architecture using React.js and Tailwind CSS with glassmorphism UI elements, dark/light theme support, and role-guarded routing.

---

### 🔹 Milestone 2: Multi-Tier Booking Workflow & Maintenance Reporting
- **Multi-Tier Academic Booking Workflow**:
  - Structured 3-step approval chain: Student Request ➡️ Lecturer Endorsement ➡️ Booking Admin (AR Office) Final Approval.
  - Support for rejection feedback notes and booking status visibility for students.
- **Maintenance Reporting Module (Basic)**:
  - Issue submission interface enabling campus users to report infrastructure faults with category tags, descriptions, and urgency priority levels.
- **Admin System Settings**:
  - Configurable `auto_booking` toggle setting for Booking Admins to automate straightforward reservations.

---

### 🔹 Milestone 3: Real-Time Availability Grid, Worker Portal, Bulk Schedule Import & System Integration
- **Bulk Semester Schedule Import Implementation (Dean's Requirement)**:
  - **Master Timetable Import Engine**: Built specifically per the Dean's requirement to handle pre-booked master semester timetables.
  - **Automated Validation & Ingestion**: Reads semester schedule files, parses day/time/hall/lecturer attributes, automatically checks for conflicts against existing database reservations, skips overlapping slots, and bulk-populates recurring semester lectures into the system.
- **Interactive Real-Time Hall Availability Grid**:
  - Visual hourly time-slot selection grid (08:00 AM – 06:00 PM) replacing static dropdowns.
  - Real-time database queries displaying booked status badges (`Available`, `Booked: [Purpose]`, `Already Passed`) and preventing double-booking over occupied ranges.
- **Maintenance Worker Portal Integration (`TechnicianDashboard` & Static Worker Portal)**:
  - **Admin Task Assignment & Dispatch**: Maintenance Admins review fault reports, assign specific technicians (*Alex Johnson*, *Sam Carter*), set priority levels, and attach technical directives.
  - **Technician Task Queue**: Technicians receive custom, real-time task queues tailored to their user ID.
  - **Interactive Task Modal & Evidence Inspector**: Technicians inspect location info, map coordinates, reporter notes, and user evidence photos.
  - **Status Progression & Work Logs**: Technicians update jobs in real-time (`Open` ➡️ `In Progress` ➡️ `Resolved`), add maintenance resolution notes, and upload proof-of-work photos upon completion.
- **Semester Timetable Calendar & Single-Room Timeline View**:
  - Native HTML5 datepicker calendar filtering with Datepicker-Filtered Agenda View.
  - Focused single-room timeline grid view when filtering by a specific hall.
  - Standardized 10 uniform lecture hall names across all UI elements and database schemas (`EOE Hall`, `DO1`, `DO2`, `Lecture Hall 1`, `Lecture Hall 2`, `Seminar Room 1`, `Seminar Room 2`, `Computer Lab 1`, `Computer Lab 2`, `Main Auditorium`).
- **Interactive Map Pinning & Photo Evidence Inspector**:
  - OpenStreetMap Leaflet location selector with reverse-geocoding (Nominatim API) and map pin dropping.
  - High-resolution photo evidence upload with 50MB backend payload support.
  - Maintenance Admin Ticket Details view with a dedicated **Evidence Photo Viewer**.
- **Booking Admin Portal Advanced Sorting, Multi-Criteria Filtering & Automated System**:
  - **Automated Reservation Approval Engine**: Implemented an automated booking approval system for the Booking Admin Portal. When enabled (`auto_booking: true`), routine conflict-free reservation requests are automatically validated and instantly approved (`Approved`) without requiring manual AR office intervention.
  - **System Auto-Booking Control Panel**: Configurable system-wide toggle in Booking Admin settings with persistent database state (`settings` table) allowing admins to seamlessly switch between automated instant approvals and manual review.
  - **Multi-Criteria Search & Filter**: Filter by search text, multi-select room badges, quick date presets (`Today`, `Tomorrow`, `This Week`, `Future`), custom date range pickers, status pills (`Approved`, `Pending AR`, `Pending`, `Rejected`), and dynamic multi-column table sorting.

---

### 🌟 Milestone 4: 2-Step Verification, Nodemailer Email Dispatch, Profile Management, Docker & Production Hosting (Final Evaluation)
- **Automated 2-Step Booking Verification & Background Anti-No-Show Engine**:
  - Implemented 2-step attendance verification for room bookings to prevent ghost bookings and slot hoarding.
  - Automated Node.js background cron worker (`server.js`) running every 60 seconds to scan unverified room reservations, auto-expire unconfirmed holds, and release room slots back to the public pool.
- **Nodemailer Automated Email & Notification Dispatch System**:
  - Integrated Nodemailer SMTP service with responsive HTML email notification templates.
  - Automatically dispatches real-time transactional emails for booking status updates (Approval/Rejection), 2-step verification reminders, fault report filings, technician job assignments, and ticket resolution logs.
- **Flexible Dual-Credential Authentication (Username or Email Login)**:
  - Enhanced backend REST API logic (`/api/auth/login`) allowing users across all 5 roles to log in using either their Username / Registration ID (e.g. `e22237`, `lecturer1`) or their verified Email Address (`e22237@eng.pdn.ac.lk`).
- **User Profile & Credentials Management Portal**:
  - Comprehensive user profile settings page across all role dashboards for updating display names, contact phone numbers, employee/student IDs, office/home addresses, and performing secure password updates with instant MySQL persistence.
- **Production Multi-Container Docker & Docker Compose Stack**:
  - Fully containerized production environment defined via `docker-compose.yml`, multi-stage Docker builds, Nginx reverse proxy integration, persistent MySQL database volumes, automated database initialization scripts (`setup_db.js`), health checks, and restart resilience.
- **Cloudflare Zero-Trust Edge Tunnel & Live Production Web Hosting**:
  - Live production deployment accessible via **`https://foe.knotpdn.tech`** (Frontend) and **`https://backend.knotpdn.tech`** (REST API).
  - Production infrastructure powered by Cloudflare Edge Tunnel (`cloudflared`) and PM2 process manager for 24/7 background availability, zero-trust edge security, and SSL/TLS encryption.
- **Comprehensive System Testing, Code Coverage & Final Documentation Suite**:
  - Automated test runner (`test_runner.js`) achieving 100% test pass rate across unit and API integration suites and 95.1% code coverage.
  - Published comprehensive documentation suite: Developer & Maintainer Guide, User Manual, Docker Deployment Guide, and System Testing & Validation Report (in both Markdown and Microsoft Word `.docx` formats).

---

## 🔑 Demo Access Credentials

| Role | Username / Email | Password | Access & Portal Capabilities |
| :--- | :--- | :--- | :--- |
| **Student** | `e22237` or `e22237@eng.pdn.ac.lk` | `1234` | Hall & lab bookings, interactive slot picker, 2-step verification, fault reporting with map pins & photo attachments, profile settings |
| **Lecturer** | `lecturer1` or `lecturer1@eng.pdn.ac.lk` | `1234` | Direct room booking, student request endorsement/rejection, fault reporting, profile settings |
| **Booking Admin** | `bookadmin` or `bookadmin@eng.pdn.ac.lk` | `adminpass` | Final AR office hall approvals, rejection feedback, bulk schedule import, multi-criteria sorting/filtering, auto-booking toggle |
| **Maintenance Admin** | `admin` or `admin@eng.pdn.ac.lk` | `adminpass` | Full ticketing management, technician task assignments, evidence photo viewer, maintenance notes |
| **Technician / Worker** | `alex` or `alex@eng.pdn.ac.lk` | `1234` | Assigned task queue, interactive job detail modal, status updates (`In Progress`/`Resolved`), work logs |

---

## 🌐 Live Production Deployment & Quick Start

### 🌍 Live Hosted Production Application
- **Main Portal Web App**: **[https://foe.knotpdn.tech](https://foe.knotpdn.tech)**
- **API Backend Endpoint**: **[https://backend.knotpdn.tech](https://backend.knotpdn.tech)**

---

### 💻 Local Development Setup & Running Commands

#### Option A: Running via Node.js Gateway (Local Development)

##### 1️⃣ Database Setup & Initialization
Ensure MySQL is running on `localhost:3306`, then execute:
```bash
node code/KNOT_Basement/Student_Portal/database/setup_db.js
```

##### 2️⃣ Start the Gateway Server
Launch all backend and frontend services simultaneously:
```bash
node code/KNOT_Basement/gateway_server.js
```
Open your browser and navigate to **`http://localhost:3000`**.

#### Option B: Running via Docker Compose (Multi-Container Production Stack)

```bash
docker-compose up -d --build
```
This launches MySQL 8.0, Nginx reverse proxy, and all micro-services automatically.

---

## 🏗️ System Architecture & Stack

- **Frontend:** React.js, Tailwind CSS, Vite, Lucide & Material Symbols Icons, Leaflet (OpenStreetMap)  
- **Backend:** Node.js, Express.js (50MB payload support for Base64 attachments & bulk import parsing), Nodemailer (SMTP), Cron Verification Engine  
- **Database:** MySQL (`knot_db`) with relational normalization and automatic schema migrations (`setup_db.js`)  
- **Architecture:** Unified Gateway Server (`gateway_server.js`), Nginx Proxy, Cloudflare Zero-Trust Edge Tunnel  
- **Containerization & Hosting:** Docker, Docker Compose, PM2, Cloudflare Tunnels (`cloudflared`)  

---

## 📅 Milestone Summary

- **Milestone 1** – Core Architecture, UI Design & Multi-Role RBAC Authentication Setup ✅ *(Completed)*
- **Milestone 2** – Multi-Tier Booking Workflow & Basic Maintenance Reporting ✅ *(Completed)*
- **Milestone 3** – Dean's Bulk Semester Timetable Import, Interactive Availability Grid, Worker Portal Integration, Admin Task Assignment, Map & Photo Evidence Inspector, Timetable Agenda View & System Validation ✅ *(Completed)*
- **Milestone 4** – 2-Step Verification Engine, Nodemailer Automated Email System, Flexible Dual-Credential Login, Profile Management, Production Docker Stack, Cloudflare Edge Tunnel Deployment & Final Project Evaluation ✅ *(Completed - Final Milestone)*

---

## 📚 System Documentation

- 🛠️ **Developer & Maintainer Guide**: [Markdown Version](docs/DEVELOPER_GUIDE.md) | [Word Document (.docx)](docs/DEVELOPER_GUIDE.docx)
  - *Technical architecture, database schemas, ER diagrams, backend APIs, 2-step verification cron logic, Cloudflare tunnel setup, and deployment instructions.*
- 📖 **Comprehensive User Manual**: [Markdown Version](docs/USER_MANUAL.md) | [Word Document (.docx)](docs/USER_MANUAL.docx)
  - *Step-by-step user guide for Students, Lecturers, Booking Admins (AR Office), Maintenance Admins, and Field Technicians.*
- 🧪 **System Testing & Validation Report**: [Markdown Version](docs/TESTING_AND_VALIDATION.md) | [Word Document (.docx)](docs/TESTING_AND_VALIDATION.docx)
  - *Automated test execution logs (100% pass rate), code coverage metrics (95.1%), manual test traceability matrix (RTM), bug resolution log, hosting/tunnel validation, and performance benchmark evidence.*
- 🐳 **Docker Containerization Guide**: [Markdown Version](docs/DOCKER_GUIDE.md) | [Word Document (.docx)](docs/DOCKER_GUIDE.docx)
  - *Complete Docker & Docker Compose setup, multi-container architecture, Nginx proxy, MySQL volume persistence, and one-command deployment instructions.*

---

## 👥 Team Roles

- **Team Leader / Lead Developer:** Minhaj Ali (E/22/237) – System Architecture, Gateway Integration, Availability Grid, 2-Step Verification Engine, Docker & Production Hosting  
- **Product Owner:** Senara Senanayake (E/22/366) – Requirements & UX Design  
- **Developer:** Chamudi Perera (E/22/280) – Maintenance Workflow, Technician Panel & Email Dispatch System  
- **Developer:** Ewmi Wijesinghe (E/22/443) – Student Interface, Profile Management & Timetable Calendar  
