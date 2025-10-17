export class meetingServices{
    private API_URL = 'http://localhost:8000/meeting';

    async createMeeting(meetingName: string, meetingPassword: string): Promise<unknown> {
        try {
            const response = await fetch(`${this.API_URL}/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
                body: JSON.stringify({ 
                    meeting_name: meetingName, 
                    password: meetingPassword 
                }),
            });
            if (!response.ok) {
                throw new Error("Failed to create meeting");
            }
            return await response.json();
        } catch (error) {
            console.error("Error creating meeting:", error);
            return null;
        }
    }

    async joinMeeting(meetingCode: string, password: string): Promise<unknown> {
        try {
            const response = await fetch(`${this.API_URL}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
                body: JSON.stringify({ 
                    meeting_code: meetingCode, 
                    password 
                }),
            });
            if (!response.ok) {
                throw new Error("Failed to join meeting");
            }
            return await response.json();
        } catch (error) {
            console.error("Error joining meeting:", error);
            return null;
        }
    }

    async meetingSummary(meetingCode: string): Promise<{ status: string; summary?: string }> {
    const token = localStorage.getItem("access_token");
    try {
      const response = await fetch(
        `${this.API_URL}/${meetingCode}/summary`,
        {
          method: "GET",
          headers: {
            "Accept": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
            // VERBESSERUNG 3: Bessere Fehlerbehandlung
            if (response.status === 401) {
                throw new Error("Unauthorized - please login again");
            }
            if (response.status === 404) {
                throw new Error("Meeting not found");
            }
            
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP ${response.status}: Failed to fetch summary`);
        }
        
        return await response.json();
    } catch (error) {
      console.error("Error fetching summary:", error);
      throw error;
    }
  }
    
}