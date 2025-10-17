import { useEffect, useRef, useState } from "react";
import { userServices } from "../services/userServices";
import { Link, useNavigate } from "react-router-dom";

type User = {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    unread_count: number;
};

function StartPage() {
    const [searchEmail, setSearchEmail] = useState("");
    const [foundUser, setFoundUser] = useState<User | null>(null);
    const [contacts, setContacts] = useState<User[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const UserService = new userServices();
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchContacts() {
            try {
                const data = await UserService.getContacts();
                setContacts(data as User[]);
            } catch (error) {
                console.error("Error fetching contacts:", error);
            }
        }

fetchContacts();
}, []); // Leeres Abhängigkeitsarray, damit es nur einmal beim Mounten ausgeführt wird

useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        // Kein Token vorhanden, eventuell zur Login-Seite weiterleiten
        return;
    }
    const socket = new WebSocket(`ws://localhost:8000/chat/ws?token=${token}`);
    wsRef.current = socket;

wsRef.current.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const currentUser = localStorage.getItem('currentUser');
    const currentUserId = currentUser ? JSON.parse(currentUser).id : null;

    if (message.receiver_id === currentUserId) {
        setContacts(prevContacts => {
            const newContacts = [...prevContacts];
            for (let i = 0; i < newContacts.length; i++) {
                if (newContacts[i].id === message.sender_id) {
                    newContacts[i].unread_count = (newContacts[i].unread_count || 0) + 1;
                    break;
                }
            }
            return newContacts;
        });
    }
    return () => {
        wsRef.current?.close();
    };
} 
}, []);


    async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        try {
            const result = await UserService.searchUsersByEmail(searchEmail);
            setFoundUser(result as User);
        console.log("Search results:", result);
        } catch (error) {
            console.error("Error searching users:", error);
        }
    }

    async function handleAddUser(id: number): Promise<void> {
        try {
            const currentUserString = localStorage.getItem('currentUser');
            if (!currentUserString) {
                throw new Error("User not logged in");
            }
            const currentUser = JSON.parse(currentUserString);
            const data = await UserService.addContact(currentUser.id, id);
            setContacts(prevContacts => [...prevContacts, data as User]);
        } catch (error) {
            console.error("Error adding user:", error);
        }
    }



    return (
        <>
            <div>
                <button onClick={() => navigate("/create-meeting")}>Create Meeting</button>
                <button onClick={() => navigate("/join-meeting")}>Join Meeting</button>
            </div>
            <div>
                <h2>Benutzersuche:</h2>
                <form onSubmit={handleSearch}>
                    <input type="text" placeholder="Suche nach Email" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} />
                    <button type="submit">Search</button>
                </form>
        {foundUser ?(
        <table><thead>
                            <tr>
                                <th>Email</th>
                                <th>Vorname</th>
                                <th>Nachname</th>
                                <th>Aktion</th>
                            </tr>
            </thead><tbody>
                            <tr key={foundUser.id}>
                                <td>{foundUser.email}</td>
                                <td>{foundUser.first_name}</td>
                                <td>{foundUser.last_name}</td>
                                <td>
                    <button type="button" onClick={() => handleAddUser(foundUser.id)}>hinzufügen</button>
                                </td>
                            </tr>
            </tbody></table>
        ) : (
            <p>Keine Email gefunden</p>
                )}
            </div>

    <div><h1>Meine Kontakte:</h1>
                {contacts.length > 0 ? (
            <ul>
                {contacts.map((contact, index) => (
                    <li key={contact.id || `contact-${index}`}>
                        <Link to={`/chat/${contact.id}`}>
                            {contact.email} 
                            {contact.unread_count > 0 && <span>({contact.unread_count})</span>}
                        </Link>
                    </li>
                ))}
            </ul>
                ) : (
                    <p>Keine Kontakte gefunden.</p>
                )}
            </div>
        </>
    );
}

export default StartPage;