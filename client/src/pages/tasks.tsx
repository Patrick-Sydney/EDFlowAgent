import TaskBoard from "../components/tasks/TaskBoard";

export default function TasksPage() {
  // Get role from localStorage for simplicity
  const role = localStorage.getItem("edflow.role") || "charge";
  
  return (
    <div className="min-h-screen bg-gray-50">
      <TaskBoard 
        roleView={role === "hca" ? "HCA" : role === "rn" ? "RN" : role === "charge" ? "Charge" : "RN"}
        currentUserId={role === "hca" ? "hca-1" : undefined}
      />
    </div>
  );
}