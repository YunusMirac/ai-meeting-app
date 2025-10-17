export class chatServices {

private API_URL = 'http://localhost:8000/chat';

    async getMessages(contact_id: number): Promise<unknown> {
        try {
            const response = await fetch(`${this.API_URL}/get_chat?friend_id=${contact_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }
            return response.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async setNewActualDate(contact_id: number): Promise<void> {
        try {
            const response = await fetch(`${this.API_URL}/${contact_id}/read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to mark messages as read');
            }
        } catch (error) {
            console.error(error);
            throw error;
        }

   }

}