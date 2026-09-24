# Project KNOT – Comprehensive User Manual

Welcome to the official **User Manual** for **Project KNOT** (University Resource & Maintenance Management Platform, Faculty of Engineering).

This manual provides complete step-by-step instructions for all user roles: **Students**, **Lecturers**, **Booking Administrators (AR Office)**, **Maintenance Administrators**, and **Field Technicians**.

---

## 📌 Table of Contents
1. [System Access & Overview](#1-system-access--overview)
2. [Demo Access Credentials](#2-demo-access-credentials)
3. [Managing User Profiles & Account Settings](#3-managing-user-profiles--account-settings)
4. [Student User Guide](#4-student-user-guide)
   - [4.1 Booking a Lecture Hall or Laboratory](#41-booking-a-lecture-hall-or-laboratory)
   - [4.2 2-Step Booking Verification System](#42-2-step-booking-verification-system)
   - [4.3 Reporting Maintenance Faults](#43-reporting-maintenance-faults)
5. [Lecturer User Guide](#5-lecturer-user-guide)
   - [5.1 Direct Lecture Hall Booking](#51-direct-lecture-hall-booking)
   - [5.2 Endorsing or Rejecting Student Booking Requests](#52-endorsing-or-rejecting-student-booking-requests)
6. [Booking Admin (AR Office) Guide](#6-booking-admin-ar-office-guide)
   - [6.1 Reviewing & Approving Booking Requests](#61-reviewing--approving-booking-requests)
   - [6.2 Automated Booking Approval Control](#62-automated-booking-approval-control)
   - [6.3 Bulk Semester Timetable Import](#63-bulk-semester-timetable-import)
7. [Maintenance Admin Guide](#7-maintenance-admin-guide)
   - [7.1 Reviewing Maintenance Tickets & Inspecting Evidence](#71-reviewing-maintenance-tickets--inspecting-evidence)
   - [7.2 Assigning Technicians & Work Directives](#72-assigning-technicians--work-directives)
8. [Technician / Maintenance Worker Guide](#8-technician--maintenance-worker-guide)
   - [8.1 Accessing Assigned Job Queue](#81-accessing-assigned-job-queue)
   - [8.2 Updating Job Status & Uploading Work Logs](#82-updating-job-status--uploading-work-logs)
9. [Frequently Asked Questions (FAQ)](#9-frequently-asked-questions-faq)

---

## 1. System Access & Overview

KNOT is a centralized web portal designed for the Faculty of Engineering. It replaces paper logbooks and fragmented emails with a unified platform for resource reservations and campus maintenance.

### Accessing the System
1. Open any modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari).
2. Enter the system URL: **`http://localhost:3000`**
3. Select your role or click **Login** to enter your portal.

---

## 2. Demo Access Credentials

For testing and demonstration, use the following default accounts:

| User Role | Username | Password | Full Name | Primary Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | `e22237` | `1234` | Minhaj Ali | Reserve halls/labs, track approval stages, respond to 2-step verifications, report maintenance faults with photos & map pins |
| **Lecturer** | `lecturer1` | `1234` | Dr. Smith | Direct hall booking, endorse/reject student booking requests, manage academic schedules |
| **Booking Admin** | `bookadmin` | `adminpass` | Booking Administrator | Final AR office approvals, multi-criteria filtering, bulk CSV schedule import, auto-booking toggle |
| **Maintenance Admin**| `admin` | `adminpass` | System Administrator | Inspect fault reports, view photo evidence & map pins, assign technicians, attach work directives |
| **Technician / Worker**| `alex` | `1234` | Alex Johnson | View assigned job queue, inspect location & evidence, update task status (`In Progress`/`Resolved`), upload work photos |

---

## 3. Managing User Profiles & Account Settings

Every user in KNOT has a dedicated profile page.

```
                      [ Click User Photo / Avatar ]
                        (Top-Right Corner Header)
                                   |
                         [ View / Edit Profile ]
                                   |
    ---------------------------------------------------------------
    | Full Name          | Position (Student, Lecturer, Tech)     |
    | Registration / ID  | Email Address                          |
    | Phone Number       | Department                             |
    | Residential Address| Profile Picture / Avatar               |
    ---------------------------------------------------------------
                                   |
                           [ Save Changes ]
```

### Updating Profile Information
1. Click your profile avatar or initials in the upper right-hand corner of the navigation bar.
2. Select **Profile** from the dropdown menu.
3. Update your contact details (Phone Number, Email Address, Registration/Employee Number, Address).
4. Click **Save Changes** to update your account records.

---

## 4. Student User Guide

### 4.1 Booking a Lecture Hall or Laboratory

```
[ Step 1: Open Book Space ] ➡️ [ Step 2: Select Date & Hall ] ➡️ [ Step 3: Pick Hourly Slot Grid ]
                                                                             |
[ Step 5: Submit Request ] ⬅️ [ Step 4: Select Lecturer & Enter Purpose ] ⬅️-+
```

1. Navigate to **Book Space** from the left navigation menu.
2. **Select Date**: Choose your desired date using the date selector.
3. **Select Hall / Laboratory**: Choose from the standard 10 university rooms:
   - `EOE Hall`, `DO1`, `DO2`, `LH01`, `LH02`, `Seminar Room A`, `Seminar Room B`, `Computer Lab 01`, `Computer Lab 02`, `Electronics Lab`.
4. **Interactive Slot Grid**: View real-time hour-by-hour availability badges:
   - `Available` (Green): Click to select.
   - `Booked: [Purpose]` (Red): Slot is occupied.
   - `Passed` (Grey): Slot has already elapsed.
5. **Lecturer Assignment**: Select the supervising lecturer responsible for endorsing your booking.
6. **Enter Purpose**: Specify course code or activity (e.g. *E/22 Batch Project Discussion*).
7. Click **Submit Booking Request**.

---

### 4.2 2-Step Booking Verification System

To prevent empty halls caused by no-shows, KNOT requires users to confirm their attendance before the booking slot.

#### How It Works:
- **Bookings Made > 12 Hours in Advance**:
  - A verification prompt opens **24 hours** before the slot start time.
  - You must click **Confirm & Keep Slot** before the **12-hour remaining** deadline.
- **Bookings Made < 12 Hours in Advance (Same-Day)**:
  - A verification prompt opens at **7:00 AM** on the morning of the booking.
  - You must confirm before **7:30 AM**.

#### Confirming Your Booking:
1. When a verification prompt is active, a yellow notification banner appears at the top of your Dashboard.
2. Click **✓ Confirm & Keep Slot** to confirm your attendance.
3. If you no longer require the hall, click **✗ Cancel & Free Slot** to immediately release the slot for others.
4. > [!WARNING]
   > If you do not respond before the countdown timer expires, the system will **automatically cancel the reservation** and free the hall slot for other users.

---

### 4.3 Reporting Maintenance Faults

1. Click **Report Maintenance Issue** from the dashboard or sidebar.
2. **Issue Title & Category**: Select category (e.g. *Projector / Audio*, *Air Conditioning*, *Electrical*, *Plumbing*).
3. **Interactive Map Pinning**: Use the OpenStreetMap Leaflet map to drop a pin at the exact fault location.
4. **Photo Evidence Upload**: Click **Upload Evidence Photo** to attach a photo of the defect (up to 50MB).
5. **Submit Report**: Click **Submit Fault Ticket**. You can track resolution progress on your Dashboard (`Open` ➡️ `In Progress` ➡️ `Resolved`).

---

## 5. Lecturer User Guide

### 5.1 Direct Lecture Hall Booking
- Lecturers can book lecture halls directly.
- Direct bookings bypass the preliminary endorsement phase and enter the AR Office queue as `Pending AR Approval` (or receive instant approval if `Auto-Booking` is enabled).

### 5.2 Endorsing or Rejecting Student Booking Requests
1. Log in as a Lecturer (`lecturer1`).
2. Navigate to **Pending Approvals** on your Lecturer Dashboard.
3. Review incoming student requests naming you as the supervising lecturer.
4. **To Endorse**: Click **✓ Endorse Request**. The booking moves to `Pending AR Approval`.
5. **To Reject**: Click **✗ Reject Request** and provide feedback explaining why the request cannot be endorsed.

---

## 6. Booking Admin (AR Office) Guide

### 6.1 Reviewing & Approving Booking Requests
1. Log in as Booking Admin (`bookadmin`).
2. Navigate to **AR Booking Management**.
3. **Multi-Criteria Filter Bar**:
   - Filter by **Search Keyword** (room, lecturer name, student ID).
   - Filter by **Room Badges** (e.g. `EOE Hall`, `DO1`).
   - Filter by **Date Presets** (`Today`, `Tomorrow`, `This Week`, `Future`).
   - Filter by **Status** (`Approved`, `Pending AR`, `Pending`, `Rejected`).
4. Click **Approve** to issue final authorization or **Reject** to deny with comments.

---

### 6.2 Automated Booking Approval Control
1. Click **System Settings** in the upper action bar.
2. Toggle **Auto-Booking Approval Engine**:
   - **Enabled (`ON`)**: Conflict-free routine bookings are instantly approved without manual AR review.
   - **Disabled (`OFF`)**: All bookings require manual AR Office review.

---

### 6.3 Bulk Semester Timetable Import
1. Click **Bulk Timetable Import** on the Booking Admin Dashboard.
2. Select your semester timetable CSV file.
3. Click **Import & Process Schedule**. The engine automatically validates room names, detects conflicts against existing bookings, and ingests recurring semester lectures into the system.

---

## 7. Maintenance Admin Guide

### 7.1 Reviewing Maintenance Tickets & Inspecting Evidence
1. Log in as Maintenance Admin (`admin`).
2. Access the **Maintenance Management Dashboard**.
3. Click on any ticket row to open the **Interactive Ticket Details Inspector**.
4. **Inspect Evidence**: View high-resolution evidence photos uploaded by reporters and inspect OpenStreetMap coordinates.

---

### 7.2 Assigning Technicians & Work Directives
1. In the Ticket Details modal, select a duty technician (*Alex Johnson* or *Sam Carter*).
2. Set Priority Level (`Low`, `Medium`, `High`, `Urgent`).
3. Enter **Manager Instructions / Technical Directives**.
4. Click **Assign & Update Ticket**. An automated email notification will be dispatched to the selected technician.

---

## 8. Technician / Maintenance Worker Guide

### 8.1 Accessing Assigned Job Queue
1. Log in as Technician (`alex`).
2. You will be greeted by your custom **Technician Dashboard** (`TechnicianDashboard`).
3. Your queue displays tickets assigned specifically to you.

```
+-----------------------------------------------------------------------+
|  MY ASSIGNED MAINTENANCE TASKS                                        |
+--------------------+------------+----------+--------------------------+
| Fault Title        | Location   | Priority | Action                   |
+--------------------+------------+----------+--------------------------+
| Projector Room 1   | EOE South  | High     | [ Inspect & Start Job ]  |
| HVAC Unit B4       | DO1        | Medium   | [ Inspect & Start Job ]  |
+--------------------+------------+----------+--------------------------+
```

---

### 8.2 Updating Job Status & Uploading Work Logs
1. Click **Inspect & Start Job** on any ticket.
2. Review reporter notes, map location, and evidence photos.
3. **Change Status**:
   - Select **In Progress** when starting work.
   - Select **Resolved** upon completing repair.
4. **Add Maintenance Resolution Notes**: Summarize repairs executed (e.g., *Replaced projector HDMI cable & tested display*).
5. **Upload Work Photo**: Attach a photo proving completion.
6. Click **Save Work Log**. The reporter and Maintenance Admin will be notified of ticket resolution.

---

## 9. Frequently Asked Questions (FAQ)

#### Q1: What happens if I forget to respond to a 2-step booking verification prompt?
> If you do not click **Confirm & Keep Slot** before the remaining countdown deadline (12 hours before slot start for advance bookings, or 7:30 AM for same-day bookings), the system automatically cancels the booking and releases the hall slot for others.

#### Q2: Can a student book a lecture hall directly without a lecturer?
> Student bookings require selecting an assigned supervising lecturer for academic endorsement unless the Booking Admin has enabled the automated system override.

#### Q3: How do technicians receive job assignments?
> Technicians receive real-time updates on their `TechnicianDashboard` and automated email notifications whenever a Maintenance Admin assigns a ticket to their user ID.

#### Q4: What file formats are supported for bulk schedule importing?
> The system supports standard `.csv` files containing fields for Day, Time Range, Room Name, and Lecturer.

---
