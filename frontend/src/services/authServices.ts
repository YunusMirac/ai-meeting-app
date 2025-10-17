export class authServices {

private API_URL = 'http://localhost:8000/auth';

async registerUser(firstName: string, lastName: string, email: string, password: string): Promise<unknown> {
    try {
        console.log('Sending registration request...', { firstName, lastName, email });
        
        const response = await fetch(`${this.API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ 
                first_name: firstName, 
                last_name: lastName, 
                email, 
                password 
            }),
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Registration error data:', errorData);
            throw new Error(errorData.detail || `HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Registration successful:', data);
        return data;
    } catch (error) {
        console.error('Registrierungsfehler:', error);
        throw error;
    }
}

async loginUser(email: string, password: string): Promise<unknown> {
    try {
        const response = await fetch(`${this.API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Fehler bei der Anmeldung');
        }

        const data = await response.json();
        
        if (data && data.access_token) {
            localStorage.setItem('access_token', data.access_token);
        } else {
            // Wenn kein Token in der Antwort ist, liegt ein Problem vor.
            throw new Error('Login-Antwort enthielt kein access_token.');
        }
        return data;
    } catch (error) {
        localStorage.removeItem('access_token');
        console.error('Anmeldefehler:', error);
        throw error;
    }
}








// ▼▼▼ HINZUGEFÜGT ▼▼▼
    /**
     * Meldet den Benutzer ab, indem das Token entfernt wird.
     */
    logoutUser(): void {
        localStorage.removeItem('access_token');
        // Leitet den Benutzer zur Login-Seite weiter.
        window.location.href = '/login';
    }

    // ▼▼▼ HINZUGEFÜGT ▼▼▼
    /**
     * Prüft, ob ein gültiges Token im Speicher vorhanden ist.
     * Dies ist die Kernfunktion für deine ProtectedRoute.
     * @returns {boolean} True, wenn der Benutzer authentifiziert ist, sonst false.
     */
    isAuthenticated(): boolean {
        const token = localStorage.getItem('access_token');
        return !!token; // Gibt true zurück, wenn ein Token existiert, sonst false.
    }

    // ▼▼▼ HINZUGEFÜGT (NÜTZLICHE HILFSFUNKTION) ▼▼▼
    /**
     * Gibt das gespeicherte Token zurück.
     * Nützlich, wenn du es für API-Anfragen benötigst.
     * @returns {string | null} Das Token oder null, wenn keines vorhanden ist.
     */
    getToken(): string | null {
        return localStorage.getItem('access_token');
    }
}