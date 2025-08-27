import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertEncounterSchema, 
  updateEncounterSchema, 
  assignRoomSchema, 
  markReadySchema,
  markResultsCompleteSchema,
  startTriageSchema,
  setAtsSchema,
  type Encounter,
  type InsertEncounter,
  LANES
} from "@shared/schema";

// Site configuration for triage flow
const siteConfig = {
  triageInRoom: false, // Set to true for sites that do triage at bedside
  demoMode: true // Enable demo reset functionality
};

// SSE connections
const sseClients = new Set<{
  res: any;
  req: any;
}>();

// Helper to broadcast SSE events
function broadcastSSE(event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(message);
    } catch (error) {
      sseClients.delete(client);
    }
  });
}

// Treatment Spaces (ED) - Dunedin Hospital Demo Data
// - TreatmentSpace → FHIR Location (status, physicalType, type, name/id)
// - Encounter.roomId → FHIR Encounter.location.location (Reference(Location))
// - Cleaning/blocked can map to Location.status + operationalStatus extension

// Helper functions for time calculations
const inMinutes = (min: number) => new Date(Date.now() + min * 60000).toISOString();

const spaces = [
  // 10 Cubicles: Room1–Room10
  { id: "Room1", zone: "A", type: "cubicle", monitored: false, oxygen: true, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: null },
  { id: "Room2", zone: "A", type: "cubicle", monitored: false, oxygen: true, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: null },
  { id: "Room3", zone: "A", type: "cubicle", monitored: false, oxygen: true, negativePressure: false, status: "cleaning", cleanEta: new Date(Date.now() + 8 * 60000), assignedEncounterId: null, notes: "Cleaning in progress" },
  { id: "Room4", zone: "A", type: "cubicle", monitored: false, oxygen: true, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: null },
  { id: "Room5", zone: "A", type: "cubicle", monitored: false, oxygen: true, negativePressure: false, status: "occupied", cleanEta: null, assignedEncounterId: "p045", notes: null },
  { id: "Room6", zone: "A", type: "cubicle", monitored: false, oxygen: true, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: null },
  { id: "Room7", zone: "A", type: "cubicle", monitored: false, oxygen: true, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: null },
  { id: "Room8", zone: "A", type: "cubicle", monitored: false, oxygen: true, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: null },
  { id: "Room9", zone: "A", type: "cubicle", monitored: false, oxygen: true, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: null },
  { id: "Room10", zone: "A", type: "cubicle", monitored: false, oxygen: true, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: null },
  
  // 2 Resus rooms: Resus1–Resus2
  { id: "Resus1", zone: "A", type: "resus", monitored: true, oxygen: true, negativePressure: false, status: "occupied", cleanEta: null, assignedEncounterId: "p001", notes: "Defib at bedside" },
  { id: "Resus2", zone: "A", type: "resus", monitored: true, oxygen: true, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: null },
  
  // 8 Observation rooms: OBS1–OBS8
  { id: "OBS1", zone: "B", type: "cubicle", monitored: false, oxygen: true, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: null },
  { id: "OBS2", zone: "B", type: "cubicle", monitored: false, oxygen: true, negativePressure: false, status: "occupied", cleanEta: null, assignedEncounterId: "p118", notes: null },
  { id: "OBS3", zone: "B", type: "cubicle", monitored: false, oxygen: true, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: null },
  { id: "OBS4", zone: "B", type: "cubicle", monitored: false, oxygen: true, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: null },
  { id: "OBS5", zone: "B", type: "cubicle", monitored: false, oxygen: true, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: null },
  { id: "OBS6", zone: "B", type: "cubicle", monitored: false, oxygen: true, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: null },
  { id: "OBS7", zone: "B", type: "cubicle", monitored: false, oxygen: true, negativePressure: false, status: "outofservice", cleanEta: null, assignedEncounterId: null, notes: "Lighting repair ETA 16:00" },
  { id: "OBS8", zone: "B", type: "cubicle", monitored: false, oxygen: true, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: null },
  
  // 2 ISO rooms: ISO1–ISO2
  { id: "ISO1", zone: "B", type: "isolation", monitored: true, oxygen: true, negativePressure: true, status: "available", cleanEta: null, assignedEncounterId: null, notes: null },
  { id: "ISO2", zone: "B", type: "isolation", monitored: true, oxygen: true, negativePressure: true, status: "occupied", cleanEta: null, assignedEncounterId: "p150", notes: null },
  
  // 10 Lazy-boy ambulatory chairs: LB1–LB10
  { id: "LB1", zone: "FT", type: "chair", monitored: false, oxygen: false, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: "Ambulatory chair" },
  { id: "LB2", zone: "FT", type: "chair", monitored: false, oxygen: false, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: "Ambulatory chair" },
  { id: "LB3", zone: "FT", type: "chair", monitored: false, oxygen: false, negativePressure: false, status: "occupied", cleanEta: null, assignedEncounterId: "p201", notes: "Ambulatory chair" },
  { id: "LB4", zone: "FT", type: "chair", monitored: false, oxygen: false, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: "Ambulatory chair" },
  { id: "LB5", zone: "FT", type: "chair", monitored: false, oxygen: false, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: "Ambulatory chair" },
  { id: "LB6", zone: "FT", type: "chair", monitored: false, oxygen: false, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: "Ambulatory chair" },
  { id: "LB7", zone: "FT", type: "chair", monitored: false, oxygen: false, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: "Ambulatory chair" },
  { id: "LB8", zone: "FT", type: "chair", monitored: false, oxygen: false, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: "Ambulatory chair" },
  { id: "LB9", zone: "FT", type: "chair", monitored: false, oxygen: false, negativePressure: false, status: "cleaning", cleanEta: new Date(Date.now() + 6 * 60000), assignedEncounterId: null, notes: "Ambulatory chair" },
  { id: "LB10", zone: "FT", type: "chair", monitored: false, oxygen: false, negativePressure: false, status: "available", cleanEta: null, assignedEncounterId: null, notes: "Ambulatory chair" }
];

// Helper: find space
function getSpace(spaceId: string) { 
  return spaces.find(s => s.id === spaceId); 
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get site configuration
  app.get("/api/config", (req, res) => {
    res.json(siteConfig);
  });

  // Get all encounters
  app.get("/api/encounters", async (req, res) => {
    try {
      const encounters = await storage.getEncounters();
      res.json(encounters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch encounters" });
    }
  });

  // Update demographics (Reception)
  app.post("/api/encounters/demographics", async (req, res) => {
    try {
      const { id, name, nhi, sex, age } = req.body || {};
      const encounters = await storage.getEncounters();
      const enc = encounters.find(e => e.id === id);
      
      if (!enc) {
        return res.status(404).json({ ok: false, error: "Encounter not found" });
      }

      const before = { name: enc.name, nhi: enc.nhi, sex: enc.sex, age: enc.age };
      
      // Update demographics
      if (name !== undefined) enc.name = name;
      if (nhi !== undefined) enc.nhi = nhi;
      if (sex !== undefined) enc.sex = sex;
      if (age !== undefined) enc.age = Number(age) || null;

      enc.lastUpdated = new Date().toISOString();

      // Save the updated encounter
      await storage.updateEncounter(enc);

      // Broadcast the update
      broadcastSSE("encounter_updated", enc);

      res.json({ 
        ok: true, 
        data: { 
          id: enc.id, 
          patient: { name: enc.name, nhi: enc.nhi, sex: enc.sex, age: enc.age } 
        } 
      });
    } catch (error) {
      console.error("Error updating demographics:", error);
      res.status(500).json({ ok: false, error: "Failed to update demographics" });
    }
  });

  // Get audit entries
  app.get("/api/audit", async (req, res) => {
    try {
      const { encounterId } = req.query;
      const entries = await storage.getAuditEntries(encounterId as string);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit entries" });
    }
  });

  // Register a new incoming patient (Reception/Admin)
  app.post("/api/register", async (req, res) => {
    try {
      const body = req.body || {};
      const required = ["name", "age", "sex", "complaint"];
      const missing = required.filter(k => body[k] === undefined || body[k] === null || body[k] === "");
      
      if (missing.length) {
        return res.status(400).json({ 
          message: `Missing required fields: ${missing.join(", ")}` 
        });
      }

      const encounter: InsertEncounter = {
        name: String(body.name),
        age: Number(body.age),
        sex: body.sex === "F" ? "F" : "M",
        nhi: body.nhi || `NEW${Math.floor(Math.random() * 9000 + 1000)}`,
        ats: body.ats && [1, 2, 3, 4, 5].includes(Number(body.ats)) ? Number(body.ats) : null,
        complaint: String(body.complaint),
        lane: "waiting",
        triageBypass: body.triageBypass ? "true" : "false",
        isolationRequired: body.isolationRequired ? "true" : "false",
        provisionalAts: (body.provisionalAts && body.ats) ? "true" : "false"
      };

      const newEncounter = await storage.createEncounter(encounter);
      broadcastSSE("encounter:new", newEncounter);
      
      res.json({ 
        message: "Patient registered successfully", 
        encounter: newEncounter 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to register patient" });
    }
  });

  // Save triage (vitals/pain/notes + extended v2 fields + optional ATS)
  app.post("/api/triage/save", async (req, res) => {
    try {
      const body = req.body || {};
      const { 
        id, vitals = {}, pain = null, notes = "", ats, actorName, actorRole,
        modeOfArrival, complaintText, complaintCode, allergy, pregnancy, 
        infection, mobility, risk = {}, provisionalDispo, expectedResources = [], care = {}
      } = body;
      
      if (!id) {
        return res.status(400).json({ message: "Encounter ID required" });
      }

      const encounter = await storage.getEncounter(id);
      if (!encounter) {
        return res.status(404).json({ message: "Encounter not found" });
      }

      // Create update object with triage data
      const updateData: any = {
        triageCompleted: "true",
        triagePain: pain !== null ? Number(pain) : null,
        triageNotes: String(notes || ""),
        triageHr: vitals.hr ? Number(vitals.hr) : null,
        triageRr: vitals.rr ? Number(vitals.rr) : null,
        triageBpSys: vitals.bpSys ? Number(vitals.bpSys) : null,
        triageBpDia: vitals.bpDia ? Number(vitals.bpDia) : null,
        triageSpo2: vitals.spo2 ? Number(vitals.spo2) : null,
        triageTemp: vitals.temp ? Math.round(Number(vitals.temp) * 10) : null, // Store as integer * 10
        // Extended v2 fields
        triageModeOfArrival: modeOfArrival || null,
        triageComplaintText: String(complaintText || ""),
        triageComplaintCode: complaintCode || null,
        triageAllergy: allergy || "unknown",
        triagePregnancy: pregnancy || "unknown",
        triageInfection: infection || "none",
        triageMobility: mobility || "independent",
        triageRiskSepsis: risk.sepsis ? "true" : "false",
        triageRiskStroke: risk.stroke ? "true" : "false",
        triageRiskSuicide: risk.suicide ? "true" : "false",
        triageProvisionalDispo: provisionalDispo || "unsure",
        triageExpectedResources: JSON.stringify(expectedResources || []),
        triageCareAnalgesia: care.analgesia ? "true" : "false",
        triageCareIv: care.iv ? "true" : "false",
        lastUpdated: new Date().toISOString()
      };

      // Move waiting → triage on save
      if (encounter.lane === "waiting") {
        updateData.lane = "triage";
      }

      // Optional ATS update
      if (ats && [1, 2, 3, 4, 5].includes(Number(ats))) {
        updateData.ats = Number(ats);
        updateData.provisionalAts = "false";

        // Audit ATS change
        await storage.createAuditEntry({
          encounterId: id,
          action: "set-ats",
          beforeValue: JSON.stringify({ ats: encounter.ats }),
          afterValue: JSON.stringify({ ats: Number(ats) }),
          actorName: actorName || "Unknown",
          actorRole: actorRole || null
        });
      }

      const updatedEncounter = await storage.updateEncounter(id, updateData);

      // Audit triage save
      await storage.createAuditEntry({
        encounterId: id,
        action: "triage.save",
        beforeValue: JSON.stringify({
          completed: encounter.triageCompleted,
          pain: encounter.triagePain,
          notes: encounter.triageNotes,
          vitals: {
            hr: encounter.triageHr,
            rr: encounter.triageRr,
            bpSys: encounter.triageBpSys,
            bpDia: encounter.triageBpDia,
            spo2: encounter.triageSpo2,
            temp: encounter.triageTemp ? encounter.triageTemp / 10 : null
          }
        }),
        afterValue: JSON.stringify({
          completed: true,
          pain: updateData.triagePain,
          notes: updateData.triageNotes,
          vitals: {
            hr: updateData.triageHr,
            rr: updateData.triageRr,
            bpSys: updateData.triageBpSys,
            bpDia: updateData.triageBpDia,
            spo2: updateData.triageSpo2,
            temp: updateData.triageTemp ? updateData.triageTemp / 10 : null
          }
        }),
        actorName: actorName || "Unknown",
        actorRole: actorRole || null
      });

      broadcastSSE("encounter:updated", updatedEncounter);
      
      res.json({ 
        message: "Triage saved successfully", 
        encounter: updatedEncounter 
      });
    } catch (error) {
      console.error("Failed to save triage:", error);
      res.status(500).json({ message: "Failed to save triage" });
    }
  });

  // Get encounters by lane
  app.get("/api/encounters/lane/:lane", async (req, res) => {
    try {
      const { lane } = req.params;
      if (!LANES.includes(lane as any)) {
        return res.status(400).json({ message: "Invalid lane" });
      }
      const encounters = await storage.getEncountersByLane(lane as any);
      res.json(encounters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch encounters by lane" });
    }
  });

  // Create new encounter
  app.post("/api/encounters", async (req, res) => {
    try {
      const result = insertEncounterSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid encounter data", errors: result.error.errors });
      }
      
      const encounter = await storage.createEncounter(result.data);
      
      // Broadcast new encounter via SSE
      broadcastSSE("encounter:new", encounter);
      
      res.status(201).json(encounter);
    } catch (error) {
      res.status(500).json({ message: "Failed to create encounter" });
    }
  });

  // Update encounter
  app.patch("/api/encounters/:id", async (req, res) => {
    try {
      const updateData = { ...req.body, id: req.params.id };
      const result = updateEncounterSchema.safeParse(updateData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid update data", errors: result.error.errors });
      }
      
      const encounter = await storage.updateEncounter(result.data);
      if (!encounter) {
        return res.status(404).json({ message: "Encounter not found" });
      }
      
      // Broadcast update via SSE
      broadcastSSE("encounter:update", encounter);
      
      res.json(encounter);
    } catch (error) {
      res.status(500).json({ message: "Failed to update encounter" });
    }
  });

  // Assign room action
  app.post("/api/actions/assign-room", async (req, res) => {
    try {
      const result = assignRoomSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request", errors: result.error.errors });
      }

      const { id, room } = result.data;
      const encounter = await storage.updateEncounter({ 
        id, 
        room, 
        lane: "roomed" 
      });
      
      if (!encounter) {
        return res.status(404).json({ message: "Encounter not found" });
      }

      broadcastSSE("encounter:update", encounter);
      res.json(encounter);
    } catch (error) {
      res.status(500).json({ message: "Failed to assign room" });
    }
  });

  // Mark ready action
  app.post("/api/actions/mark-ready", async (req, res) => {
    try {
      const result = markReadySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request", errors: result.error.errors });
      }

      const { id, disposition } = result.data;
      const encounter = await storage.updateEncounter({ 
        id, 
        disposition, 
        lane: "ready" 
      });
      
      if (!encounter) {
        return res.status(404).json({ message: "Encounter not found" });
      }

      broadcastSSE("encounter:update", encounter);
      res.json(encounter);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark ready" });
    }
  });

  // Mark results complete action
  app.post("/api/actions/results-complete", async (req, res) => {
    try {
      const result = markResultsCompleteSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request", errors: result.error.errors });
      }

      const { id } = result.data;
      const encounter = await storage.updateEncounter({ 
        id, 
        resultsStatus: "complete" 
      });
      
      if (!encounter) {
        return res.status(404).json({ message: "Encounter not found" });
      }

      broadcastSSE("encounter:update", encounter);
      res.json({ message: "Results marked complete", encounter });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark results complete" });
    }
  });

  // Start triage action
  app.post("/api/actions/start-triage", async (req, res) => {
    try {
      const result = startTriageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request", errors: result.error.errors });
      }

      const { id } = result.data;
      const encounter = await storage.updateEncounter({ 
        id, 
        lane: "triage" 
      });
      
      if (!encounter) {
        return res.status(404).json({ message: "Encounter not found" });
      }

      broadcastSSE("encounter:update", encounter);
      res.json({ message: "Triage started", encounter });
    } catch (error) {
      res.status(500).json({ message: "Failed to start triage" });
    }
  });

  // Set ATS action with audit trail
  app.post("/api/actions/set-ats", async (req, res) => {
    try {
      const result = setAtsSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request", errors: result.error.errors });
      }

      const { id, ats, actorName, actorRole } = result.data;
      
      // Get current encounter for audit trail
      const currentEncounter = await storage.getEncounter(id);
      if (!currentEncounter) {
        return res.status(404).json({ message: "Encounter not found" });
      }

      const beforeValue = JSON.stringify({ 
        ats: currentEncounter.ats, 
        provisionalAts: currentEncounter.provisionalAts 
      });
      
      // Update encounter - setting ATS removes provisional flag
      const encounter = await storage.updateEncounter({ 
        id, 
        ats,
        provisionalAts: "false"
      });
      
      if (!encounter) {
        return res.status(404).json({ message: "Encounter not found" });
      }

      // Create audit entry
      await storage.createAuditEntry({
        encounterId: id,
        action: "set-ats",
        beforeValue,
        afterValue: JSON.stringify({ ats, provisionalAts: "false" }),
        actorName: actorName || "Unknown",
        actorRole: actorRole || "Unknown"
      });

      broadcastSSE("encounter:update", encounter);
      res.json({ message: "ATS updated", encounter });
    } catch (error) {
      res.status(500).json({ message: "Failed to set ATS" });
    }
  });

  // Demo utilities - Reset demo board
  app.post("/api/demo/reset", async (req, res) => {
    if (!siteConfig.demoMode) {
      return res.status(403).json({ message: "Demo mode disabled" });
    }

    const { keepAudit } = req.query;
    
    try {
      // Clear encounters and optionally audit entries
      const encounters = await storage.getEncounters();
      for (const encounter of encounters) {
        await storage.deleteEncounter(encounter.id);
      }
      
      if (!keepAudit) {
        // Clear audit entries - this will be handled by reinitializing storage
        // For now, we'll keep the audit as the interface doesn't have a clear method
      }

      // Reinitialize test data
      await storage.initializeTestData();
      
      // Broadcast reset event
      broadcastSSE("demo:reset", { at: new Date().toISOString() });
      
      const newEncounters = await storage.getEncounters();
      res.json({ 
        message: "Demo reset complete", 
        count: newEncounters.length 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset demo" });
    }
  });

  // Scenario endpoints
  app.post("/api/scenario/surge", async (req, res) => {
    try {
      // Generate 10 new surge patients
      const surgePatients: InsertEncounter[] = [
        {
          name: "Emergency Patient 1",
          age: 35,
          sex: "M",
          nhi: "SRG001",
          ats: 3,
          complaint: "Motor vehicle accident - chest trauma",
          lane: "waiting"
        },
        {
          name: "Emergency Patient 2", 
          age: 42,
          sex: "F",
          nhi: "SRG002",
          ats: 4,
          complaint: "MVC - minor lacerations",
          lane: "waiting"
        },
        {
          name: "Emergency Patient 3",
          age: 28,
          sex: "M", 
          nhi: "SRG003",
          ats: 3,
          complaint: "MVC - possible internal bleeding",
          lane: "waiting"
        },
        {
          name: "Emergency Patient 4",
          age: 56,
          sex: "F",
          nhi: "SRG004", 
          ats: 5,
          complaint: "MVC - anxiety reaction",
          lane: "waiting"
        },
        {
          name: "Emergency Patient 5",
          age: 31,
          sex: "M",
          nhi: "SRG005",
          ats: 4,
          complaint: "MVC - neck pain",
          lane: "waiting"  
        },
        {
          name: "Emergency Patient 6",
          age: 67,
          sex: "F",
          nhi: "SRG006",
          ats: 3,
          complaint: "MVC - head injury",
          lane: "waiting"
        },
        {
          name: "Emergency Patient 7",
          age: 24,
          sex: "M",
          nhi: "SRG007", 
          ats: 4,
          complaint: "MVC - abrasions",
          lane: "waiting"
        },
        {
          name: "Emergency Patient 8",
          age: 45,
          sex: "F",
          nhi: "SRG008",
          ats: 3,
          complaint: "MVC - suspected fracture",
          lane: "waiting"
        },
        {
          name: "Emergency Patient 9",
          age: 38,
          sex: "M",
          nhi: "SRG009",
          ats: 5,
          complaint: "MVC - minor bruising",
          lane: "waiting"
        },
        {
          name: "Emergency Patient 10",
          age: 52,
          sex: "F", 
          nhi: "SRG010",
          ats: 4,
          complaint: "MVC - back pain",
          lane: "waiting"
        }
      ];

      const encounters = await storage.createMultipleEncounters(surgePatients);
      
      // Broadcast all new encounters
      encounters.forEach(encounter => {
        broadcastSSE("encounter:new", encounter);
      });

      res.json({ message: "Surge scenario activated", encounters });
    } catch (error) {
      res.status(500).json({ message: "Failed to activate surge scenario" });
    }
  });

  app.post("/api/scenario/stroke", async (req, res) => {
    try {
      const strokePatient: InsertEncounter = {
        name: "Emergency Stroke Alert",
        age: 71,
        sex: "M",
        nhi: "STR001", 
        ats: 1,
        complaint: "Suspected stroke - FAST positive, left side weakness",
        lane: "waiting",
        triageBypass: "true", // Critical case can bypass triage and go straight to room
        provisionalAts: "true" // Ambulance-provided provisional ATS
      };

      const encounter = await storage.createEncounter(strokePatient);
      broadcastSSE("encounter:new", encounter);
      
      res.json({ message: "Stroke scenario activated", encounter });
    } catch (error) {
      res.status(500).json({ message: "Failed to activate stroke scenario" });
    }
  });

  app.post("/api/scenario/boarding", async (req, res) => {
    try {
      // Move existing patients to ready and create new boarding patients  
      const encounters = await storage.getEncounters();
      const roomedPatients = encounters.filter(e => e.lane === "roomed").slice(0, 2);
      const reviewPatients = encounters.filter(e => e.lane === "review");
      
      const toMove = [...roomedPatients, ...reviewPatients].slice(0, 3);
      const movedEncounters = await Promise.all(
        toMove.map(e => storage.updateEncounter({
          id: e.id,
          lane: "ready",
          disposition: "Admitted - waiting for bed"
        }))
      );

      // Create additional boarding patients
      const boardingPatients: InsertEncounter[] = [
        {
          name: "Boarding Patient 1",
          age: 78,
          sex: "F",
          nhi: "BRD001",
          ats: 2,
          complaint: "Pneumonia - requires admission",
          lane: "ready",
          disposition: "Admitted - waiting for bed"
        },
        {
          name: "Boarding Patient 2", 
          age: 65,
          sex: "M",
          nhi: "BRD002",
          ats: 3,
          complaint: "Heart failure exacerbation",
          lane: "ready", 
          disposition: "Admitted - waiting for bed"
        },
        {
          name: "Boarding Patient 3",
          age: 82,
          sex: "F",
          nhi: "BRD003",
          ats: 2,
          complaint: "Sepsis - ICU admission pending",
          lane: "ready",
          disposition: "Admitted - waiting for bed"
        }
      ];

      const newEncounters = await storage.createMultipleEncounters(boardingPatients);
      
      // Broadcast updates
      [...movedEncounters, ...newEncounters].forEach(encounter => {
        if (encounter) {
          broadcastSSE("encounter:update", encounter);
        }
      });

      res.json({ 
        message: "Boarding scenario activated", 
        movedEncounters: movedEncounters.filter(Boolean), 
        newEncounters 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to activate boarding scenario" });
    }
  });

  // FHIR R4 Encounter endpoint (demo stub)
  app.get("/fhir/Encounter/:id", async (req, res) => {
    try {
      const encounter = await storage.getEncounter(req.params.id);
      if (!encounter) {
        return res.status(404).json({ 
          resourceType: "OperationOutcome",
          issue: [{ severity: "error", code: "not-found", details: { text: "Encounter not found" } }]
        });
      }

      // Map internal encounter to FHIR R4 Encounter resource
      const fhirEncounter = {
        resourceType: "Encounter",
        id: encounter.id,
        status: encounter.lane === "discharged" ? "finished" : "in-progress",
        class: {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "EMER",
          display: "emergency"
        },
        subject: {
          reference: `Patient/${encounter.nhi}`,
          display: encounter.name
        },
        period: {
          start: encounter.arrivalTime
        },
        reasonCode: [{
          text: encounter.complaint
        }],
        location: encounter.room ? [{
          location: { display: encounter.room },
          status: "active"
        }] : [],
        participant: encounter.provider ? [{
          individual: { display: encounter.provider },
          type: [{ text: "primary performer" }]
        }] : [],
        extension: [{
          url: "https://edflow.example.com/ats-score",
          valueInteger: encounter.ats
        }]
      };

      res.json(fhirEncounter);
    } catch (error) {
      res.status(500).json({
        resourceType: "OperationOutcome", 
        issue: [{ severity: "error", code: "exception", details: { text: "Internal server error" } }]
      });
    }
  });

  // List spaces
  app.get("/api/spaces", (req, res) => res.json({ ok: true, data: spaces }));

  // Assign space (Waiting/Triage → Roomed)
  app.post("/api/spaces/assign", async (req, res) => {
    const { encounterId, spaceId, reason, actorName, actorRole } = req.body || {};
    const encounter = await storage.getEncounter(encounterId);
    if (!encounter) return res.status(404).json({ ok: false, error: "Encounter not found" });
    const space = getSpace(spaceId);
    if (!space) return res.status(404).json({ ok: false, error: "Space not found" });
    if (space.status !== "available") return res.status(409).json({ ok: false, error: `Space ${space.id} is ${space.status}` });

    // Suitability (MVP): isolation & acuity hint via ATS
    const needsIso = encounter.isolationRequired === "true";
    const acuity = Number(encounter.ats || 3);
    const isoOk = !needsIso || space.negativePressure || space.type === "isolation";
    const acuOk = (acuity <= 2) ? (space.type === "resus" || space.monitored) : true;
    const safe = isoOk && acuOk;

    // Assign
    space.status = "occupied";
    space.assignedEncounterId = encounter.id;
    const before = { state: encounter.lane, roomId: encounter.room || null };
    const now = new Date();
    
    const updatedEncounter = await storage.updateEncounter({
      id: encounter.id,
      lane: "roomed",
      room: space.id,
      lastUpdated: now
    });

    await storage.createAuditEntry({
      ts: now.toISOString(),
      actor: actorName || "unknown",
      role: actorRole || null,
      action: before.roomId ? "space.reassign" : "space.assign",
      encounterId: encounter.id,
      spaceId: space.id,
      reason: reason || null,
      before,
      after: { state: "roomed", roomId: space.id },
      safe,
      checks: { isoOk, acuOk }
    });

    broadcastSSE('encounterUpdated', updatedEncounter);
    res.json({ ok: true, data: { encounterId: encounter.id, space, safe, checks: { isoOk, acuOk } } });
  });

  // Reassign space (Roomed → another space) — reason required
  app.post("/api/spaces/reassign", async (req, res) => {
    const { encounterId, toSpaceId, reason, actorName, actorRole } = req.body || {};
    if (!reason) return res.status(400).json({ ok: false, error: "Reason required for reassign" });
    const encounter = await storage.getEncounter(encounterId);
    if (!encounter) return res.status(404).json({ ok: false, error: "Encounter not found" });
    const fromId = encounter.room;
    const from = fromId ? getSpace(fromId) : null;
    const to = getSpace(toSpaceId);
    if (!to) return res.status(404).json({ ok: false, error: "Target space not found" });
    if (to.status !== "available") return res.status(409).json({ ok: false, error: `Target ${to.id} is ${to.status}` });

    // Free old
    if (from) { 
      from.status = "cleaning"; 
      from.cleanEta = 10; 
      from.assignedEncounterId = null;
    }
    // Occupy new
    to.status = "occupied"; 
    to.assignedEncounterId = encounter.id;

    const now = new Date();
    await storage.createAuditEntry({
      ts: now.toISOString(),
      actor: actorName || "unknown",
      role: actorRole || null,
      action: "space.reassign",
      encounterId,
      spaceId: to.id,
      reason,
      before: { from: fromId },
      after: { to: to.id }
    });

    const updatedEncounter = await storage.updateEncounter({
      id: encounter.id,
      room: to.id,
      lastUpdated: now
    });

    broadcastSSE('encounterUpdated', updatedEncounter);
    res.json({ ok: true, data: { encounterId, from: fromId, to: to.id } });
  });

  // Release space (on discharge/admit transfer)
  app.post("/api/spaces/release", async (req, res) => {
    const { encounterId, makeCleaning = true, actorName, actorRole } = req.body || {};
    const encounter = await storage.getEncounter(encounterId);
    if (!encounter) return res.status(404).json({ ok: false, error: "Encounter not found" });
    const space = encounter.room ? getSpace(encounter.room) : null;
    if (space) {
      space.assignedEncounterId = null;
      space.status = makeCleaning ? "cleaning" : "available";
      space.cleanEta = makeCleaning ? 10 : null;
    }
    const now = new Date();
    await storage.createAuditEntry({
      ts: now.toISOString(),
      actor: actorName || "unknown",
      role: actorRole || null,
      action: "space.release",
      encounterId,
      spaceId: space?.id || null
    });

    const updatedEncounter = await storage.updateEncounter({
      id: encounter.id,
      room: null,
      lastUpdated: now
    });

    broadcastSSE('encounterUpdated', updatedEncounter);
    res.json({ ok: true, data: { encounterId, spaceId: space?.id || null } });
  });

  // Cleaning/ready/block controls
  app.post("/api/spaces/clean/request", async (req, res) => {
    const { spaceId } = req.body || {};
    const space = getSpace(spaceId);
    if (!space) return res.status(404).json({ ok: false, error: "Space not found" });
    if (space.status === "occupied") return res.status(400).json({ ok: false, error: "Occupied" });
    space.status = "cleaning"; 
    space.cleanEta = space.cleanEta || 12;
    
    await storage.createAuditEntry({
      ts: new Date().toISOString(),
      action: "space.clean.request",
      spaceId
    });
    
    res.json({ ok: true, data: space });
  });

  app.post("/api/spaces/clean/ready", async (req, res) => {
    const { spaceId } = req.body || {};
    const space = getSpace(spaceId);
    if (!space) return res.status(404).json({ ok: false, error: "Space not found" });
    if (space.status === "occupied") return res.status(400).json({ ok: false, error: "Occupied" });
    space.status = "available"; 
    space.cleanEta = null;
    
    await storage.createAuditEntry({
      ts: new Date().toISOString(),
      action: "space.clean.ready",
      spaceId
    });
    
    res.json({ ok: true, data: space });
  });

  app.post("/api/spaces/block", async (req, res) => {
    const { spaceId, reason } = req.body || {};
    const space = getSpace(spaceId);
    if (!space) return res.status(404).json({ ok: false, error: "Space not found" });
    space.status = "blocked"; 
    space.notes = reason || "Blocked";
    
    await storage.createAuditEntry({
      ts: new Date().toISOString(),
      action: "space.block",
      spaceId,
      reason: space.notes
    });
    
    res.json({ ok: true, data: space });
  });

  app.post("/api/spaces/unblock", async (req, res) => {
    const { spaceId } = req.body || {};
    const space = getSpace(spaceId);
    if (!space) return res.status(404).json({ ok: false, error: "Space not found" });
    space.status = "available"; 
    space.notes = null; 
    space.cleanEta = null;
    
    await storage.createAuditEntry({
      ts: new Date().toISOString(),
      action: "space.unblock",
      spaceId
    });
    
    res.json({ ok: true, data: space });
  });

  // SSE endpoint for real-time updates
  app.get("/api/events", (req, res) => {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Add client to SSE clients set
    const client = { req, res };
    sseClients.add(client);

    // Send initial connection message
    res.write(`event: connected\ndata: ${JSON.stringify({ message: "Connected to ED Flow events" })}\n\n`);

    // Handle client disconnect
    req.on('close', () => {
      sseClients.delete(client);
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
