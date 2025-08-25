import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertEncounterSchema, 
  updateEncounterSchema, 
  assignRoomSchema, 
  markReadySchema,
  type Encounter,
  type InsertEncounter,
  LANES
} from "@shared/schema";

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

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all encounters
  app.get("/api/encounters", async (req, res) => {
    try {
      const encounters = await storage.getEncounters();
      res.json(encounters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch encounters" });
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
        lane: "triage"
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
