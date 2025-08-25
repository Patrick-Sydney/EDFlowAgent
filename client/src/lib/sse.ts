import { useDashboardStore } from '@/stores/dashboardStore';
import { type Encounter } from '@shared/schema';

export class SSEManager {
  private eventSource: EventSource | null = null;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private maxReconnectAttempts = 5;
  private reconnectAttempts = 0;
  private reconnectDelay = 1000;

  connect() {
    try {
      this.eventSource = new EventSource('/api/events');
      
      this.eventSource.onopen = () => {
        console.log('SSE connected');
        useDashboardStore.getState().setConnectionStatus(true);
        this.reconnectAttempts = 0;
      };

      this.eventSource.addEventListener('connected', (event) => {
        const data = JSON.parse(event.data);
        console.log('SSE connection established:', data.message);
      });

      this.eventSource.addEventListener('encounter:new', (event) => {
        const encounterRaw = JSON.parse(event.data);
        const encounter = { ...encounterRaw, lane: encounterRaw.lane ?? encounterRaw.state ?? "waiting" };
        useDashboardStore.getState().addEncounter(encounter);
      });

      this.eventSource.addEventListener('encounter:update', (event) => {
        const encounterRaw = JSON.parse(event.data);
        const encounter = { ...encounterRaw, lane: encounterRaw.lane ?? encounterRaw.state ?? "waiting" };
        useDashboardStore.getState().updateEncounter(encounter);
      });

      this.eventSource.addEventListener('demo:reset', async () => {
        try {
          console.log("Demo reset event received, reloading encounters");
          const response = await fetch('/api/encounters');
          const data = await response.json();
          const list = Array.isArray(data) ? data : Object.values(data ?? {});
          const norm = list.map((e: any) => ({ ...e, lane: e.lane ?? e.state ?? "waiting" }));
          useDashboardStore.getState().setEncounters(norm);
        } catch (error) {
          console.error("Failed to reload encounters after demo reset:", error);
        }
      });

      this.eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        useDashboardStore.getState().setConnectionStatus(false);
        this.handleReconnect();
      };

    } catch (error) {
      console.error('Failed to establish SSE connection:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.disconnect();
    
    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    useDashboardStore.getState().setConnectionStatus(false);
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

export const sseManager = new SSEManager();
