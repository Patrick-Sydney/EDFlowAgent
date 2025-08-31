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
    // Use NHI as stable ID to prevent data loss on server restart
    const id = insertEncounter.nhi || randomUUID();
    const now = new Date();
    const encounter: Encounter = {
      ...insertEncounter,
      id,
      ats: insertEncounter.ats ?? null, // Ensure null instead of undefined
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
      // Roomed patients matching space occupancy
      {
        name: "Alex Taylor",
        age: 67,
        sex: "M",
        nhi: "ABC1001", 
        ats: 2,
        complaint: "Severe chest pain, shortness of breath",
        lane: "roomed",
        room: "Resus1",
        provider: "Dr. Martinez"
      },
      {
        name: "Moana Rangi",
        age: 52,
        sex: "F",
        nhi: "DEF2045",
        ats: 3,
        complaint: "Fall injury, possible fracture",
        lane: "roomed", 
        room: "Room5",
        provider: "Dr. Wilson"
      },
      {
        name: "Rose Chen",
        age: 34,
        sex: "F",
        nhi: "GHI3118",
        ats: 3,
        complaint: "Abdominal pain, nausea",
        lane: "roomed",
        room: "OBS2", 
        provider: "Dr. Lee"
      },
      {
        name: "Te Awhina Tai",
        age: 28,
        sex: "F",
        nhi: "JKL4150",
        ats: 3,
        complaint: "Respiratory symptoms, isolation required",
        lane: "roomed",
        room: "ISO2",
        provider: "Dr. Kumar",
        isolationRequired: "true"
      },
      {
        name: "Jamie Reid",
        age: 45,
        sex: "M",
        nhi: "MNO5201", 
        ats: 4,
        complaint: "Minor laceration, requires suturing",
        lane: "roomed",
        room: "LB3",
        provider: "Nurse J. Smith"
      },
      // Patients in triage
      {
        name: "Sione Fakatou",
        age: 36,
        sex: "M",
        nhi: "PQR6230",
        ats: 4,
        complaint: "Back pain after lifting heavy object",
        lane: "triage",
        provider: "Nurse M. Davis"
      },
      {
        name: "Pania Walters", 
        age: 42,
        sex: "F",
        nhi: "STU7260",
        ats: 3,
        complaint: "Severe headache, visual disturbance",
        lane: "triage",
        provider: "Nurse K. Wilson"
      },
      // Patients waiting
      {
        name: "Anika Singh",
        age: 31,
        sex: "F", 
        nhi: "VWX8240",
        ats: null,
        complaint: "Fever, sore throat, 2 days",
        lane: "waiting"
      },
      {
        name: "Hemi Baker",
        age: 19,
        sex: "M",
        nhi: "YZA9251", 
        ats: null,
        complaint: "Sports injury, ankle pain",
        lane: "waiting"
      },
      {
        name: "Kauri Ngata",
        age: 58,
        sex: "M",
        nhi: "BCD0270",
        ats: null,
        complaint: "Chest discomfort, palpitations",
        lane: "waiting"
      }
    ];

    // Create test data with staggered arrival times
    testEncounters.forEach((encounter, index) => {
      const arrivalTime = new Date();
      arrivalTime.setHours(arrivalTime.getHours() - (testEncounters.length - index));
      
      // Use NHI as stable ID to prevent data loss on server restart
      const id = encounter.nhi || randomUUID();
      const fullEncounter: Encounter = {
        ...encounter,
        id,
        ats: encounter.ats ?? null, // Ensure null instead of undefined
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
      beforeValue: entry.beforeValue ?? null,
      afterValue: entry.afterValue ?? null,
      actorName: entry.actorName ?? null,
      actorRole: entry.actorRole ?? null,
      timestamp: now,
    };
    this.auditEntries.set(id, auditEntry);
    return auditEntry;
  }
}

export const storage = new MemStorage();
