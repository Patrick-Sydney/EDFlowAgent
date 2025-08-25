import { type Encounter, type InsertEncounter, type UpdateEncounter, type Lane, type AuditEntry, type InsertAuditEntry } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Encounter CRUD
  getEncounter(id: string): Promise<Encounter | undefined>;
  getEncounters(): Promise<Encounter[]>;
  getEncountersByLane(lane: Lane): Promise<Encounter[]>;
  createEncounter(encounter: InsertEncounter): Promise<Encounter>;
  updateEncounter(update: UpdateEncounter): Promise<Encounter | undefined>;
  deleteEncounter(id: string): Promise<boolean>;
  
  // Bulk operations for scenarios
  createMultipleEncounters(encounters: InsertEncounter[]): Promise<Encounter[]>;
  moveEncountersToLane(encounterIds: string[], lane: Lane): Promise<Encounter[]>;
  
  // Audit trail
  getAuditEntries(encounterId?: string): Promise<AuditEntry[]>;
  createAuditEntry(entry: InsertAuditEntry): Promise<AuditEntry>;
  
  // Demo utilities
  initializeTestData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private encounters: Map<string, Encounter>;
  private auditEntries: Map<string, AuditEntry>;

  constructor() {
    this.encounters = new Map();
    this.auditEntries = new Map();
    this.initializeTestData();
  }

  async getEncounter(id: string): Promise<Encounter | undefined> {
    return this.encounters.get(id);
  }

  async getEncounters(): Promise<Encounter[]> {
    return Array.from(this.encounters.values()).sort((a, b) => 
      new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime()
    );
  }

  async getEncountersByLane(lane: Lane): Promise<Encounter[]> {
    return Array.from(this.encounters.values())
      .filter(encounter => encounter.lane === lane)
      .sort((a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime());
  }

  async createEncounter(insertEncounter: InsertEncounter): Promise<Encounter> {
    const id = randomUUID();
    const now = new Date();
    const encounter: Encounter = {
      ...insertEncounter,
      id,
      lane: insertEncounter.lane || "waiting", // Provide default value
      room: insertEncounter.room || null,
      provider: insertEncounter.provider || null,
      disposition: insertEncounter.disposition || null,
      resultsStatus: insertEncounter.resultsStatus || null,
      triageBypass: insertEncounter.triageBypass || "false",
      isolationRequired: insertEncounter.isolationRequired || "false",
      provisionalAts: insertEncounter.provisionalAts || "false",
      arrivalTime: now,
      lastUpdated: now,
    };
    this.encounters.set(id, encounter);
    return encounter;
  }

  async updateEncounter(update: UpdateEncounter): Promise<Encounter | undefined> {
    const existing = this.encounters.get(update.id);
    if (!existing) return undefined;

    const updated: Encounter = {
      ...existing,
      ...update,
      lastUpdated: new Date(),
    };
    this.encounters.set(update.id, updated);
    return updated;
  }

  async deleteEncounter(id: string): Promise<boolean> {
    return this.encounters.delete(id);
  }

  async createMultipleEncounters(encounters: InsertEncounter[]): Promise<Encounter[]> {
    const results: Encounter[] = [];
    for (const encounter of encounters) {
      const created = await this.createEncounter(encounter);
      results.push(created);
    }
    return results;
  }

  async moveEncountersToLane(encounterIds: string[], lane: Lane): Promise<Encounter[]> {
    const results: Encounter[] = [];
    for (const id of encounterIds) {
      const updated = await this.updateEncounter({ id, lane });
      if (updated) results.push(updated);
    }
    return results;
  }

  async initializeTestData(): Promise<void> {
    // Clear existing data
    this.encounters.clear();
    
    this.seedTestData();
  }

  private seedTestData() {
    const testEncounters: InsertEncounter[] = [
      {
        name: "Sarah Mitchell",
        age: 45,
        sex: "F",
        nhi: "ABC1234",
        ats: null, // No ATS set yet in waiting
        complaint: "Chest pain, onset 2hrs",
        lane: "waiting"
      },
      {
        name: "James Wong", 
        age: 28,
        sex: "M",
        nhi: "DEF5678",
        ats: null, // No ATS set yet in waiting
        complaint: "Ankle sprain, twisted playing football",
        lane: "waiting"
      },
      {
        name: "Robert Chen",
        age: 52,
        sex: "M", 
        nhi: "JKL3456",
        ats: 2,
        complaint: "Severe abdominal pain, vomiting",
        lane: "triage",
        provider: "Nurse J. Smith"
      },
      {
        name: "Lisa Thompson",
        age: 34,
        sex: "F",
        nhi: "MNO7890", 
        ats: 3,
        complaint: "Headache, photophobia, 3 days",
        lane: "triage",
        provider: "Nurse M. Davis"
      },
      {
        name: "Michael Brown",
        age: 45,
        sex: "M",
        nhi: "PQR1234",
        ats: 2,
        complaint: "Possible stroke, left side weakness",
        lane: "roomed",
        room: "Room 12",
        provider: "Dr. Wilson"
      },
      {
        name: "Amanda Taylor",
        age: 29,
        sex: "F", 
        nhi: "STU5678",
        ats: 4,
        complaint: "UTI symptoms, fever",
        lane: "roomed",
        room: "Room 8", 
        provider: "Dr. Lee"
      },
      {
        name: "David Garcia",
        age: 58,
        sex: "M",
        nhi: "VWX9012",
        ats: 2,
        complaint: "Chest pain, rule out MI",
        lane: "diagnostics",
        room: "Room 15",
        provider: "Dr. Martinez",
        resultsStatus: "pending"
      }
    ];

    // Create test data with staggered arrival times
    testEncounters.forEach((encounter, index) => {
      const arrivalTime = new Date();
      arrivalTime.setHours(arrivalTime.getHours() - (testEncounters.length - index));
      
      const id = randomUUID();
      const fullEncounter: Encounter = {
        ...encounter,
        id,
        lane: encounter.lane || "waiting", // Provide default value
        room: encounter.room || null,
        provider: encounter.provider || null,
        disposition: encounter.disposition || null,
        resultsStatus: encounter.lane === "diagnostics" ? "pending" : null,
        triageBypass: encounter.triageBypass || "false",
        isolationRequired: encounter.isolationRequired || "false",
        provisionalAts: encounter.provisionalAts || "false",
        arrivalTime,
        lastUpdated: arrivalTime,
      };
      this.encounters.set(id, fullEncounter);
    });
  }

  async getAuditEntries(encounterId?: string): Promise<AuditEntry[]> {
    const entries = Array.from(this.auditEntries.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    if (encounterId) {
      return entries.filter(entry => entry.encounterId === encounterId);
    }
    
    return entries.slice(0, 200); // Last 200 entries
  }

  async createAuditEntry(entry: InsertAuditEntry): Promise<AuditEntry> {
    const id = randomUUID();
    const now = new Date();
    const auditEntry: AuditEntry = {
      ...entry,
      id,
      timestamp: now,
    };
    this.auditEntries.set(id, auditEntry);
    return auditEntry;
  }
}

export const storage = new MemStorage();
