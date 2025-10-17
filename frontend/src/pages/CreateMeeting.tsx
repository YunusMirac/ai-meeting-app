import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { meetingServices } from "../services/meetingServices";

interface Meeting {
    id: number;
    meeting_code: string;
    host_id: number;
    meeting_name: string;
}
function CreateMeeting() {
    const navigate = useNavigate();
    const [meetingName, setMeetingName] = useState("");
    const [meetingPassword, setMeetingPassword] = useState("");
    const meetingService = new meetingServices();
    
    async function handleCreateMeeting(event: FormEvent) {
    event.preventDefault();
    try {
        const data = await meetingService.createMeeting(meetingName, meetingPassword);
        const meeting = data as Meeting;
        if (meeting && meeting.meeting_code) {
            // Übergebe Meeting-Name als URL Parameter
            navigate(`/meeting/${meeting.meeting_code}?name=${encodeURIComponent(meeting.meeting_name)}`);
        } else {
            // Gib eine Fehlermeldung aus, falls etwas schiefgelaufen ist.
            console.error("Meeting-Code wurde nicht von der API empfangen.");
            // Hier könntest du dem Benutzer eine Fehlermeldung anzeigen.
        }
    } catch (error) {
        console.error("Error creating meeting:", error);
    }
  }

  return (
    <>
    <div>
      <h1>Create Meeting Page</h1>
        <form onSubmit={handleCreateMeeting}>
          <label htmlFor="name">Meeting Name:</label>
          <input type="text" name="name" value={meetingName} onChange={(e) => setMeetingName(e.target.value)} required />
          <label htmlFor="password">Password of the Meeting</label>
          <input type="password" name="password" value={meetingPassword} onChange={(e) => setMeetingPassword(e.target.value)} required />
          <button type="submit">Create Meeting</button>
        </form>
      </div>
    </>
  );
}

export default CreateMeeting;
