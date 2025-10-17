import { useState, type FormEvent, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { chatServices } from "../services/chatServices";

interface Message {
    id: number;
    sender_id: number;
    message: string;
    timestamp: string;
}

function ChatPage() {
    const { contact_id } = useParams<{ contact_id: string }>();
    const [newMessage, setNewMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const chatService = new chatServices();

    // Chat-Historie laden
    useEffect(() => {
        const fetchMessages = async () => {
            if (!contact_id) return;
            try {
                const data = await chatService.getMessages(Number(contact_id));
                setMessages(data as Message[]);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };
        fetchMessages();
    }, [contact_id]);

    // WebSocket-Verbindung
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token || !contact_id) return;
        
        const socket = new WebSocket(`ws://localhost:8000/chat/ws?token=${token}`);
        wsRef.current = socket;

        // NEU: Warte auf Verbindung
    socket.onopen = () => {
        console.log("✅ WebSocket verbunden!");
    };
 
    socket.onmessage = (event) => {
        const neueNachricht = JSON.parse(event.data);
        setMessages(prev => {
            if (prev.some(m => m.id === neueNachricht.id)) return prev;
            return [...prev, neueNachricht];
        });
    };

    // NEU: Error Handling
    socket.onerror = (error) => {
        console.error("❌ WebSocket Fehler:", error);
    };

    socket.onclose = () => {
        console.log("WebSocket geschlossen");
    };

        return () => { 
            chatService.setNewActualDate(Number(contact_id));
            socket.close();
        };
    }, [contact_id]);

    // Nachricht senden
    const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!newMessage.trim() || !wsRef.current) return;
            if (wsRef.current.readyState !== WebSocket.OPEN) {
        console.error("WebSocket nicht verbunden!");
        return;
    }
    
        wsRef.current.send(JSON.stringify({
            receiver_id: Number(contact_id),
            message: newMessage.trim()
        }));
        setNewMessage("");
    };

    return (
        <div>
            <h1>Chat Page</h1>
            <div>
                {messages.map((msg) => (
                    <div key={msg.id}>
                        <strong>{msg.sender_id}:</strong> {msg.message}
                    </div>
                ))}
            </div>
            <form onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}

export default ChatPage;