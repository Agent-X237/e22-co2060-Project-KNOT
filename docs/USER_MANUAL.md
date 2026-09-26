# Project KNOT – Comprehensive User Manual
> **University Resource & Maintenance Management Platform**  
> **Faculty of Engineering, University of Peradeniya**  
> **Document Version**: 2.5.0 | **Last Updated**: September 2026

---

## 📌 Table of Contents
1. [System Overview & Portal Access](#1-system-overview--portal-access)
2. [Demo Access Credentials Matrix](#2-demo-access-credentials-matrix)
3. [User Account & Profile Management](#3-user-account--profile-management)
4. [Student Portal User Guide](#4-student-portal-user-guide)
   - [4.1 Navigating the Student Dashboard](#41-navigating-the-student-dashboard)
   - [4.2 Hall & Lab Reservation Workflow (Hourly Availability Grid)](#42-hall--lab-reservation-workflow-hourly-availability-grid)
   - [4.3 2-Step Attendance Verification System (Anti-No-Show Engine)](#43-2-step-attendance-verification-system-anti-no-show-engine)
   - [4.4 Maintenance Fault Reporting (GIS Map Pins & Evidence Photos)](#44-maintenance-fault-reporting-gis-map-pins--evidence-photos)
5. [Lecturer Portal User Guide](#5-lecturer-portal-user-guide)
   - [5.1 Direct Lecture Hall & Lab Reservations](#51-direct-lecture-hall--lab-reservations)
   - [5.2 Endorsing & Reviewing Student Booking Requests](#52-endorsing--reviewing-student-booking-requests)
   - [5.3 Department Schedule Timeline & Calendar Filtering](#53-department-schedule-timeline--calendar-filtering)
6. [Booking Admin (AR Office) Guide](#6-booking-admin-ar-office-guide)
   - [6.1 AR Approval Queue & Rejection Notes](#61-ar-approval-queue--rejection-notes)
   - [6.2 Advanced Sorting, Search & Multi-Criteria Filtering](#62-advanced-sorting-search--multi-criteria-filtering)
   - [6.3 Automated Booking Approval Engine Toggle](#63-automated-booking-approval-engine-toggle)
   - [6.4 Master Semester Timetable Bulk Importer](#64-master-semester-timetable-bulk-importer)
7. [Maintenance Admin Guide](#7-maintenance-admin-guide)
   - [7.1 Ticketing Management Dashboard](#71-ticketing-management-dashboard)
   - [7.2 Interactive Evidence Viewer & Location Coordinates Inspector](#72-interactive-evidence-viewer--location-coordinates-inspector)
   - [7.3 Technician Task Assignment & Priority Classification](#73-technician-task-assignment--priority-classification)
8. [Technician / Field Worker Guide](#8-technician--field-worker-guide)
   - [8.1 Accessing Technician Task Queue (`TechnicianDashboard`)](#81-accessing-technician-task-queue-techniciandashboard)
   - [8.2 Inspecting Job Directives & Map Locations](#82-inspecting-job-directives--map-locations)
   - [8.3 Updating Work Status & Uploading Proof-of-Work Logs](#83-updating-work-status--uploading-proof-of-work-logs)
9. [System Notifications & Email Alerts](#9-system-notifications--email-alerts)
10. [Frequently Asked Questions (FAQ) & Troubleshooting](#10-frequently-asked-questions-faq--troubleshooting)

---

## 1. System Overview & Portal Access

**Project KNOT** is a centralized web platform designed specifically for the Faculty of Engineering at the University of Peradeniya. It unifies academic resource reservations (lecture halls, drawing offices, laboratories, seminar rooms) with infrastructure maintenance reporting into a single transparent system.

### Accessing the Platform
1. Open any web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari).
2. Enter the web address:
   - **Public Production Domain**: **`https://foe.knotpdn.tech`**
   - **Local Development Host**: `http://localhost:3000`
3. The platform automatically displays role-based entry portals for **Students**, **Lecturers**, **Booking Administrators**, **Maintenance Administrators**, and **Field Technicians**.

---

## 2. Demo Access Credentials Matrix

For demonstration, system evaluation, and testing, use the following pre-configured user credentials:

| Role | Username | Password | Full Name | Email Address | Core Portal Capabilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Student** | `e22237` | `1234` | Minhaj Ali | `e22237@eng.pdn.ac.lk` | Hall/lab reservations, interactive hourly grid selection, 2-step verification banners, fault reporting with GIS pin dropping & photo attachments |
| **Lecturer** | `lecturer1` | `1234` | Dr. Smith | `lecturer1@eng.pdn.ac.lk` | Direct room booking, student request endorsement/rejection, academic schedule timeline inspection |
| **Booking Admin (AR)**| `bookadmin` | `adminpass` | Booking Admin | `ar.office@eng.pdn.ac.lk` | Final AR office approvals/rejections, multi-criteria filtering, bulk CSV schedule import, auto-booking toggle control |
| **Maintenance Admin**| `admin` | `adminpass` | Maint. Admin | `maint.admin@eng.pdn.ac.lk` | Full ticketing management, photo evidence inspector, GIS location viewer, technician assignment & priority classification |
| **Technician / Worker**| `alex` | `1234` | Alex Johnson | `alex.tech@eng.pdn.ac.lk` | Assigned task queue, interactive job detail modal, status updates (`In Progress`/`Resolved`), work logs & proof-of-work photo uploads |

---

## 3. User Account & Profile Management

Every registered user has a personal account profile containing personal credentials, contact details, and role privileges.

```
                           [ Click User Profile Avatar ]
                             (Top Right Header Navigation)
                                          |
                               [ View Profile Modal ]
                                          |
    -------------------------------------------------------------------------
    | Full Name               | User Role Tag (Student, Lecturer, Tech)     |
    | Registration / Emp ID   | Email Address                               |
    | Contact Phone Number    | Department / Organization                   |
    | Campus / Home Address   | Base64 Profile Avatar                       |
    -------------------------------------------------------------------------
                                          |
                                 [ Save Profile Details ]
```

### How to Update Your Profile:
1. Click your profile avatar image or user initials in the upper right-hand corner of the navigation bar.
2. Click **Profile** in the dropdown menu.
3. Edit your contact details (Email Address, Phone Number, Registration/Employee Number, Department, Address).
4. Click **Save Changes** to immediately update your account details.

---

## 4. Student Portal User Guide

### 4.1 Navigating the Student Dashboard
Upon logging in as a Student (`e22237`), the dashboard provides:
- **Active Bookings Cards**: Real-time status badges (`Approved`, `Pending Lecturer`, `Pending AR`, `Rejected`).
- **2-Step Verification Action Banner**: Prompts requiring attendance confirmation.
- **My Reported Faults**: Progress status on reported maintenance tickets (`Open`, `In Progress`, `Resolved`).

---

### 4.2 Hall & Lab Reservation Workflow (Hourly Availability Grid)

```
[ Step 1: Open Book Space ] ➡️ [ Step 2: Select Date & Hall ] ➡️ [ Step 3: Pick Hourly Slot Grid ]
                                                                             |
[ Step 5: Submit Request ] ⬅️ [ Step 4: Select Lecturer & Purpose ] ⬅️-------+
```

1. Click **Book Space** on the navigation menu.
2. **Select Date**: Choose the date of your desired reservation using the calendar date picker.
3. **Select Hall / Room**: Choose from the standardized 10 faculty rooms:
   - `EOE Hall`, `DO1`, `DO2`, `LH01`, `LH02`, `Seminar Room A`, `Seminar Room B`, `Computer Lab 01`, `Computer Lab 02`, `Electronics Lab`.
4. **Interactive Hourly Slot Grid**:
   - The grid displays hourly slots from **08:00 AM to 06:00 PM**.
   - **Green Badge (`Available`)**: Click to select one or multiple consecutive hourly slots.
   - **Red Badge (`Booked: [Purpose]`)**: Slot is occupied by another approved reservation.
   - **Grey Badge (`Passed`)**: Time slot has already elapsed.
5. **Assign Endorsing Lecturer**: Select your supervising lecturer from the dropdown menu (required for student requests).
6. **Enter Purpose**: Specify course code or event details (e.g. *E/22 Batch Hardware Project Lab Session*).
7. Click **Submit Booking Request**. Your request enters state `Pending Lecturer Endorsement`.

---

### 4.3 2-Step Attendance Verification System (Anti-No-Show Engine)

To prevent lecture halls from remaining empty due to no-shows, KNOT enforces an automated **2-Step Verification System**.

```
                           [ Booking Approved ]
                                    |
                    +---------------+---------------+
                    |                               |
        Booked > 12 Hours in Advance     Booked < 12 Hours in Advance
                    |                               |
          Prompt: 24h before Start        Prompt: 7:00 AM on Day of Slot
          Deadline: 12h before Start      Deadline: 7:30 AM on Day of Slot
                    |                               |
                    +---------------+---------------+
                                    |
                         [ Background Cron Checks ]
                                    |
                  +-----------------+-----------------+
                  |                                   |
         User Confirms Booking              Deadline Passes without Action
                  |                                   |
           Status = Verified                 Status = Cancelled & Slot Freed
```

#### Confirming Attendance:
1. When a 2-step verification window opens, a **Yellow Action Banner** appears at the top of your dashboard, and an email notification is dispatched.
2. Click **✓ Confirm Attendance** to mark your reservation as `Verified`.
3. If you no longer require the room, click **✗ Cancel & Release Slot** to immediately free the hall for other students and staff.
4. > [!WARNING]
   > If you do not respond before the remaining countdown deadline, the system will **automatically cancel your reservation** and release the hall.

---

### 4.4 Maintenance Fault Reporting (GIS Map Pins & Evidence Photos)

1. Click **Report Maintenance Issue** from the dashboard or sidebar.
2. **Issue Category & Title**: Select issue type (*Projector/Audio*, *Air Conditioning*, *Electrical*, *Plumbing*, *Furniture/Structural*).
3. **Interactive Map Pinning**: Use the interactive OpenStreetMap Leaflet map to place a pin at the exact location of the issue. The system auto-fills address text via reverse geocoding.
4. **Photo Evidence Upload**: Attach a photo of the defect (supports up to 50MB Base64 uploads).
5. Click **Submit Fault Report**. Track maintenance progress under **My Reported Faults**.

---

## 5. Lecturer Portal User Guide

### 5.1 Direct Lecture Hall & Lab Reservations
- Lecturers (`lecturer1`) can reserve rooms directly for classes or exams.
- Direct reservations bypass lecturer endorsement and enter the AR Office queue directly as `Pending AR Approval` (or receive instant approval if `Auto-Booking` is enabled).

---

### 5.2 Endorsing & Reviewing Student Booking Requests

1. Log in as a Lecturer (`lecturer1`).
2. Navigate to **Pending Approvals** on the Lecturer Dashboard.
3. Review student requests naming you as the supervising lecturer.
4. **To Endorse**: Click **✓ Endorse Request**. The status updates to `Pending AR Approval`.
5. **To Reject**: Click **✗ Reject Request** and provide feedback explaining the reason for denial.

---

### 5.3 Department Schedule Timeline & Calendar Filtering
- Lecturers can filter the schedule calendar by date, room, or department to verify hall availability before scheduling extra lectures.

---

## 6. Booking Admin (AR Office) Guide

### 6.1 AR Approval Queue & Rejection Notes
1. Log in as Booking Admin (`bookadmin`).
2. Open **AR Booking Management**.
3. Review endorsed student requests and direct lecturer requests.
4. Click **Approve** to grant final reservation authorization or **Reject** to deny with feedback notes.

---

### 6.2 Advanced Sorting, Search & Multi-Criteria Filtering
- **Keyword Search**: Filter by student ID, lecturer name, or purpose.
- **Room Badges**: Filter view by specific rooms (`EOE Hall`, `DO1`, `LH01`).
- **Date Presets**: Filter by `Today`, `Tomorrow`, `This Week`, `Future`, or custom date range.
- **Status Filters**: Filter by `Approved`, `Pending AR`, `Pending`, `Rejected`, `Cancelled`.

---

### 6.3 Automated Booking Approval Engine Toggle
1. Click **System Settings** in the upper action bar.
2. Toggle **Auto-Booking Approval Engine**:
   - **ON (`true`)**: Incoming conflict-free requests are automatically validated and instantly approved (`Approved`).
   - **OFF (`false`)**: All requests require manual AR Office review.

---

### 6.4 Master Semester Timetable Bulk Importer
1. Click **Bulk Schedule Import** on the Booking Admin Dashboard.
2. Select your master semester schedule CSV file.
3. Click **Import Timetable**. The engine validates hall names against standard rooms, skips overlapping slots, and populates recurring weekly lectures into the database.

---

## 7. Maintenance Admin Guide

### 7.1 Ticketing Management Dashboard
1. Log in as Maintenance Admin (`admin`).
2. Access the **Maintenance Management Dashboard**.
3. View all campus fault reports with real-time status badges (`Open`, `In Progress`, `Resolved`).

---

### 7.2 Interactive Evidence Viewer & Location Coordinates Inspector
1. Click on any ticket row to open the **Ticket Details Modal**.
2. **Inspect Evidence**: View high-resolution evidence photos uploaded by reporters.
3. **Inspect Map Location**: View exact latitude/longitude coordinates and address description.

---

### 7.3 Technician Task Assignment & Priority Classification
1. In the Ticket Details modal, assign a field technician (*Alex Johnson* or *Sam Carter*).
2. Set Priority Level (`Low`, `Medium`, `High`, `Urgent`).
3. Enter **Manager Directives / Work Notes**.
4. Click **Assign & Update Ticket**. An automated email notification will be sent to the assigned technician.

---

## 8. Technician / Field Worker Guide

### 8.1 Accessing Technician Task Queue (`TechnicianDashboard`)
1. Log in as Technician (`alex`).
2. You will be greeted by your custom **Technician Dashboard** (`TechnicianDashboard`).
3. Your queue displays tasks assigned specifically to your user ID.

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

### 8.2 Inspecting Job Directives & Map Locations
1. Click **Inspect & Start Job** on any ticket in your queue.
2. Review reporter descriptions, map location coordinates, and evidence photos.
3. Read Manager Instructions attached by the Maintenance Admin.

---

### 8.3 Updating Work Status & Uploading Proof-of-Work Logs
1. **Update Status**: Set status to `In Progress` when beginning repairs, and `Resolved` upon completion.
2. **Add Maintenance Resolution Notes**: Enter details of repairs executed.
3. **Upload Proof-of-Work Photo**: Attach a photo showing the completed repair.
4. Click **Save Work Log**. The reporter and Maintenance Admin will receive automated completion notifications.

---

## 9. System Notifications & Email Alerts

Automated email notifications are dispatched for key system events:

| Event Trigger | Email Recipient | Email Contents |
| :--- | :--- | :--- |
| **New Fault Ticket Created** | Reporter & Maintenance Admin | Ticket ID, fault title, category, location text |
| **Technician Assigned** | Assigned Worker | Ticket details, priority level, manager directives |
| **Ticket Resolved** | Ticket Reporter | Resolution notes, proof photo, resolution timestamp |
| **2-Step Verification Required** | Booker | Booking details, verification deadline countdown link |
| **Booking Confirmed** | Booker | Reservation confirmation receipt & room details |
| **Booking Expired / Cancelled** | Booker | Cancellation notification due to missed verification deadline |

---

## 10. Frequently Asked Questions (FAQ) & Troubleshooting

#### Q1: What happens if I miss the 2-step verification deadline for a booking?
> If you do not click **Confirm Attendance** before the deadline (12 hours before slot start for advance bookings, or 7:30 AM for same-day bookings), the system automatically cancels the reservation and releases the room slot for other users.

#### Q2: Can students book rooms directly without lecturer approval?
> Student requests require selecting a supervising lecturer for academic endorsement unless the Booking Admin has enabled `Auto-Booking`.

#### Q3: How do technicians access their task queues?
> Technicians log in using their credentials (e.g. `alex`) to access their personalized task queue on the `TechnicianDashboard`.

#### Q4: What file formats are supported for bulk schedule importing?
> The system accepts `.csv` files containing `Room`, `Day`, `Start Time`, `End Time`, and `Course/Lecturer` columns.

---
*For technical assistance or administrative access requests, contact the AR Office or System Maintainer.*
