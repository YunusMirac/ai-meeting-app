export class userServices {
    
    private apiUrl = 'http://localhost:8000/user';
    
    async searchUsersByEmail(email: string): Promise<unknown> {
        try {
            const response = await fetch(`${this.apiUrl}/?email=${encodeURIComponent(email)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP Error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error searching users by email:', error);
            throw error;
        }
    }

    async addContact(currentUserId: number, friend_id: number): Promise<unknown> {
        try {
            const response = await fetch(`${this.apiUrl}/add_contact?user_id=${currentUserId}&friend_id=${friend_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                  body: JSON.stringify({
                    user_id: currentUserId,
                    friend_id: friend_id
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP Error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error adding contact:', error);
            throw error;
        }
    }

    async getContacts(): Promise<unknown> {
        try {
            const response = await fetch(`${this.apiUrl}/get_contacts`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP Error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching contacts:', error);
            throw error;
        }
    }
}