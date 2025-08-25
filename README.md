# ED Flow Agent

A real-time Emergency Department patient flow dashboard with lane management, patient tracking, and scenario simulation.

## Quick Start

### Development Mode (Hot Reload)
```bash
npm install
cd server && npm install
cd ../client && npm install
cd ..
npm run dev
```
- Client: http://localhost:5173
- Server: http://localhost:3001

### Production Mode (Single Port)
```bash
npm install
cd server && npm install
cd ../client && npm install
cd ..
npm run build && npm start
```
- Application: http://localhost:3001

## 10-Minute Demo Script

### Setup (1 minute)
1. **Start the application**
   ```bash
   npm run dev
   ```
2. **Open browser** to http://localhost:5173
3. **What you should see:**
   - Clean dashboard with 7 lanes (Waiting → Admitted)
   - KPI strip showing: Waiting: 1, Boarding: 0, Median Time in ED: ~240m
   - Role selector set to "Charge" (showing all lanes)
   - 7 initial patients distributed across lanes
   - Real-time timer badges on patient cards

### Demo 1: Surge Scenario - Queue Control (3 minutes)

**Goal:** Demonstrate mass casualty response and queue management

1. **Trigger Surge**
   - Click red "Surge" button in top toolbar
   - **What "good" looks like:**
     - 10 new patients instantly appear in "Waiting" lane
     - KPI strip updates: Waiting count jumps to 11
     - Each new patient has unique name, age, sex, NHI
     - ATS levels 3-5 (appropriate for surge)
     - Real-time "0m" timer badges on new patients

2. **Process Surge Patients**
   - Switch role to "RN" (shows Waiting, Triage, Roomed only)
   - Click "Assign room" on first waiting patient
   - Enter room number (e.g., "Room 8")
   - **What "good" looks like:**
     - Patient moves from Waiting → Roomed lane
     - Room number appears on patient card
     - KPI strip updates: Waiting count decreases
     - Timer badge continues counting up

3. **Queue Control View**
   - Switch role to "Charge" to see full flow
   - **What "good" looks like:**
     - Clear visibility of bottlenecks
     - Waiting lane shows queue depth
     - Easy identification of longest waiting patients

### Demo 2: Stroke Alert - Door-to-CT Timer (3 minutes)

**Goal:** Demonstrate time-critical pathway management

1. **Trigger Stroke Alert**
   - Click orange "Stroke" button
   - **What "good" looks like:**
     - "Emergency Stroke Alert" patient appears in Triage
     - ATS 1 (red badge) - highest priority
     - Complaint: "Suspected stroke - FAST positive, left side weakness"
     - Timer starts at "0m" and counts up
     - Patient stands out visually with red ATS badge

2. **MD Workflow**
   - Switch role to "MD" (shows Roomed, Diagnostics, Decision)
   - Move stroke patient through workflow:
     - First assign room to move to Roomed
     - Then mark ready to move to Ready lane
   - **What "good" looks like:**
     - Smooth role-based workflow
     - Timer continues tracking throughout journey
     - Critical patient easily identifiable

3. **Time-Critical Monitoring**
   - Observe timer counting up on stroke patient
   - **What "good" looks like:**
     - Continuous time tracking
     - Clear visual indication of time pressure
     - Easy monitoring across lanes

### Demo 3: Boarding Crisis - Bed Huddle Relief (3 minutes)

**Goal:** Demonstrate capacity management and boarding visibility

1. **Create Boarding Situation**
   - Click yellow "Boarding" button
   - **What "good" looks like:**
     - Multiple patients move to "Ready" lane
     - All show disposition: "Admitted - waiting for bed"
     - KPI strip shows increased boarding count
     - 3 additional boarding patients added

2. **Bed Manager View**
   - Switch role to "BedMgr" (shows Ready, Admitted only)
   - **What "good" looks like:**
     - Focused view on bed management
     - Clear list of patients waiting for beds
     - Easy identification of boarding patients
     - Time stamps showing how long they've been boarding

3. **Capacity Management**
   - Observe KPI strip updates
   - **What "good" looks like:**
     - Boarding count prominently displayed
     - Median time in ED increases
     - Clear visibility of capacity constraints
     - Easy identification of discharge opportunities

### Wrap-up: Real-time Updates (1 minute)

1. **Demonstrate Live Updates**
   - Open second browser tab to same URL
   - Trigger any scenario from one tab
   - **What "good" looks like:**
     - Changes appear instantly in both tabs
     - No page refresh needed
     - Perfect synchronization across views
     - KPI strips update in real-time

2. **Role-Based Views**
   - Switch between different roles
   - **What "good" looks like:**
     - Each role sees relevant lanes only
     - Appropriate workflow focus
     - No overwhelming information
     - Clean, purpose-built interfaces

## What Success Looks Like

### Technical Indicators
- ✅ Application loads within 3 seconds
- ✅ No console errors in browser
- ✅ Real-time updates appear instantly
- ✅ All buttons respond immediately
- ✅ KPI calculations update correctly

### Clinical Workflow Indicators
- ✅ **Surge**: Queue visibility and patient assignment workflow
- ✅ **Stroke**: Time-critical patient tracking with ATS 1 priority
- ✅ **Boarding**: Clear bed management view with capacity metrics
- ✅ **Role Views**: Appropriate information for each staff type

### User Experience Indicators
- ✅ Intuitive lane-based flow visualization
- ✅ Clear patient information at a glance
- ✅ Responsive design across screen sizes
- ✅ Professional healthcare-appropriate styling
- ✅ Real-time collaboration across multiple users

## Troubleshooting

### Common Issues
- **Port conflicts**: Change PORT in server to 3002 if 3001 is taken
- **Client won't load**: Ensure both `npm install` commands completed
- **SSE not working**: Check browser console for connection errors
- **Scenarios not working**: Verify server is running and API endpoints respond

### Reset Demo Data
Restart the server to reset to initial patient state:
```bash
# Development
Ctrl+C then npm run dev

# Production  
Ctrl+C then npm start
```

## Architecture Notes

- **Frontend**: React + Tailwind CSS + Zustand state management
- **Backend**: Node.js + Express + Server-Sent Events
- **Data**: In-memory storage (resets on server restart)
- **Real-time**: SSE for live updates across clients
- **Roles**: Client-side filtering, no authentication