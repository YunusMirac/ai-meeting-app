import { useEffect, useRef, useState } from "react";
import { userServices } from "../services/userServices";
import { Link, useNavigate } from "react-router-dom";
import "../styles/StartPage.css";
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
            <div className="meeting-actions">
                <button className="meeting-button" onClick={() => navigate("/create-meeting")}>Create Meeting</button>
                <button className="meeting-button" onClick={() => navigate("/join-meeting")}>Join Meeting</button>
            </div>
            <div>
                <form className="search-form" onSubmit={handleSearch}>
                    <input className="search-input" type="text" placeholder="Search by Email here...." value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} />
                    <button className="search-button" type="submit">Search</button>
                </form>
        {foundUser ?(
        <table className="table"><thead className="table-thead">
                            <tr>
                                <th>Email</th>
                                <th>Firstname</th>
                                <th>Lastname</th>
                                <th>Action</th>
                            </tr>
            </thead><tbody className="table-tbody">
                            <tr key={foundUser.id}>
                                <td>{foundUser.email}</td>
                                <td>{foundUser.first_name}</td>
                                <td>{foundUser.last_name}</td>
                                <td>
                    <button className="table-button" type="button" onClick={() => handleAddUser(foundUser.id)}>hinzufügen</button>
                                </td>
                            </tr>
            </tbody></table>
        ) : (
            <p className="description">No user found.</p>
                )}
            </div>

    <div className="contacts-div"><h1 className="contacts-title">Contacts:</h1>
                {contacts.length > 0 ? (
            <ul className="contacts-list">
                {contacts.map((contact, index) => (
                    <li className="contacts-list-item" key={contact.id || `contact-${index}`}>
                        <Link className="contact-link" to={`/chat/${contact.id}`}>
                        <div className="contact-info">
                           <p className="contact-email">{contact.email}</p>
                            <p className="contact-unread-count">{contact.unread_count > 0 && <span>{contact.unread_count}</span>}</p>
                        </div>
                        </Link>
                    </li>
                ))}
            </ul>
                ) : (
                    <p className="description">No contacts found.</p>
                )}
            </div>
        </>
    );
}

export default StartPage;