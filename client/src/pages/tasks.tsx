import { useState } from "react";
import TaskBoard from "../components/tasks/TaskBoard";
import TaskCardSheet from "../components/tasks/TaskCardSheet";

export default function TasksPage() {
  // Get role from localStorage for simplicity
  const role = localStorage.getItem("edflow.role") || "charge";
  const [openTaskSheet, setOpenTaskSheet] = useState<string | null>(null);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <TaskBoard 
        roleView={role === "hca" ? "HCA" : role === "rn" ? "RN" : role === "charge" ? "Charge" : "RN"}
        currentUserId={role === "hca" ? "hca-1" : undefined}
        onSelectTaskId={setOpenTaskSheet}
      />
      
      {openTaskSheet && (
        <TaskCardSheet
          taskId={openTaskSheet}
          onClose={() => setOpenTaskSheet(null)}
          currentUserId={role === "hca" ? "hca-1" : undefined}
          readOnly={role === "hca"}
        />
      )}
    </div>
  );
}