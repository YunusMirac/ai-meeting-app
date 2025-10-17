import { useState, type FormEvent } from "react";
import { meetingServices } from "../services/meetingServices";
import { useNavigate } from "react-router";

interface Meeting {
    id: number;
    meeting_code: string;
    meeting_name: string;
    host_id: number;
}
function JoinMeeting() {
    const meetingService = new meetingServices();
    const [meetingCode, setMeetingCode] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    
    async function handleJoinMeeting(event: FormEvent) {
        event.preventDefault();
        try {
            const data = await meetingService.joinMeeting(meetingCode, password);
            const meeting = data as Meeting;
            navigate(`/meeting/${meeting.meeting_code}`);
        } catch (error) {
            console.error("Error joining meeting:", error);
        }
        
    }

    return (
        <div>
            <h1>Join Meeting Page</h1>
            <form onSubmit={handleJoinMeeting}>
                <label htmlFor="meetingCode">Meeting Code:</label>
                <input type="text" name="meetingCode" value={meetingCode} onChange={(e) => setMeetingCode(e.target.value)} required />
                <label htmlFor="password">Password:</label>
                <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Join Meeting</button>
            </form>
            
        </div>
    );
}

export default JoinMeeting;