import { useEffect } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { schedulerTick } from '@/utils/monitoring';

/**
 * Hook to automatically run the monitoring scheduler every 30 seconds
 * Marks observation tasks as overdue when their due time passes
 */
export function useMonitoringScheduler() {
  const encounters = useDashboardStore(state => state.encounters);
  const setEncounters = useDashboardStore(state => state.setEncounters);
  
  useEffect(() => {
    const schedulerId = setInterval(() => {
      if (!encounters || encounters.length === 0) return;
      
      const current = Array.isArray(encounters) ? encounters : [];
      let hasChanges = false;
      
      const updatedEncounters = current.map(encounter => {
        const monitoringTasks = (encounter as any)._monitoringTasks;
        if (!monitoringTasks || monitoringTasks.length === 0) return encounter;
        
        const patientLite = {
          id: encounter.id,
          ats: encounter.ats as any,
          observations: [],
          tasks: [...monitoringTasks],
          flags: { 
            suspectedSepsis: encounter.isolationRequired === "true" 
          }
        };
        
        // Run scheduler tick to mark overdue tasks
        schedulerTick([patientLite]);
        
        // Check if tasks changed
        if (JSON.stringify(patientLite.tasks) !== JSON.stringify(monitoringTasks)) {
          hasChanges = true;
          return {
            ...encounter,
            _monitoringTasks: patientLite.tasks
          };
        }
        
        return encounter;
      });
      
      if (hasChanges) {
        setEncounters(updatedEncounters as any);
      }
    }, 30 * 1000); // every 30 seconds
    
    return () => clearInterval(schedulerId);
  }, [encounters, setEncounters]);
}