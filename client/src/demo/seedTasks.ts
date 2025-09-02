// demo/seedTasks.ts
import { useTaskStore } from "../stores/taskStore";

export function seedTasksOnce() {
  const seeded = sessionStorage.getItem("seed.tasks");
  if (seeded) return;
  const upsert = useTaskStore.getState().upsert;
  upsert({ label: "Assist to toilet", kind: "hygiene", patientId: "p001", dueAt: new Date(Date.now()+10*60000).toISOString(), origin: "RN", actorId: "rn-1" });
  upsert({ label: "Pressure roll", kind: "mobility", patientId: "p002", dueAt: new Date(Date.now()-5*60000).toISOString(), origin: "Charge", actorId: "charge-1" });
  upsert({ label: "Escort to CT scan", kind: "escort", patientId: "p001", dueAt: new Date(Date.now()+30*60000).toISOString(), origin: "RN", actorId: "rn-1" });
  sessionStorage.setItem("seed.tasks", "1");
}