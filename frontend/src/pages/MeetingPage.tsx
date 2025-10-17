import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

// Interface-Definitionen für WebSocket-Nachrichten
interface UserLeftMessage {
  type: "user_left";
  user_id: number;
}

interface ExistingUsersMessage {
  type: "existing_users";
  user_ids: number[];
}

interface UserJoinedMessage {
  type: "user_joined";
  user_id: number;
}

interface OfferMessage {
  type: "offer";
  offer: RTCSessionDescription;
  user_id: number;
}

interface AnswerMessage {
  type: "answer";
  answer: RTCSessionDescription;
  user_id: number;
}

interface IceCandidateMessage {
  type: "ice_candidate";
  candidate: RTCIceCandidate;
  user_id: number;
}

type WebSocketMessage =
  | ExistingUsersMessage
  | UserJoinedMessage
  | UserLeftMessage
  | OfferMessage
  | AnswerMessage
  | IceCandidateMessage;

function MeetingPage() {
  const stream = useRef<HTMLVideoElement | null>(null);
  const control = useRef<MediaStream | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const { meeting_code: meetingCode } = useParams<{ meeting_code: string }>();
  const [searchParams] = useSearchParams();
  const meetingName = searchParams.get("name");

  const navigate = useNavigate();
  const audioWsRef = useRef<WebSocket | null>(null);
  const [isMediaReady, setIsMediaReady] = useState(false);

  // Refs für die Peer-to-Peer Verbindungen
  const peerConnectionsRef = useRef<{ [userId: number]: RTCPeerConnection }>({});
  const [remoteStreams, setRemoteStreams] = useState<{
    [userId: number]: MediaStream;
  }>({});

  // Erster useEffect: Media Setup
  useEffect(() => {
    console.log("🚀 Starte Media Setup...");
    
    const setupMedia = async () => {
      try {
        console.log("📹 Anfrage Kamera und Mikrofon...");
        const userMedia = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        console.log("✅ Media Stream erhalten!");

        if (stream.current) {
          stream.current.srcObject = userMedia;
        }

        control.current = userMedia;
        setIsMediaReady(true);
        console.log("✅ Media Setup vollständig - isMediaReady = true");

      } catch (error) {
        console.error("❌ Fehler beim Media Setup:", error);
      }
    };

    setupMedia();
  }, []);

  // Zweiter useEffect: WebSocket Connections (nur wenn Media bereit ist)
  useEffect(() => {
    if (!isMediaReady || !meetingCode) {
      console.log("⏳ Warte auf Media oder MeetingCode...");
      return;
    }

    console.log("🌐 Starte WebSocket Verbindungen...");
    
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("❌ Kein Token gefunden!");
      navigate("/login");
      return;
    }

    // Kopiere Refs für Cleanup
    const currentPeerConnections = peerConnectionsRef.current;

    // Meeting WebSocket
    ws.current = new WebSocket(
      `ws://localhost:8000/meeting/ws/${meetingCode}?token=${token}`
    );

    ws.current.onopen = () => {
      console.log("✅ Meeting-WebSocket verbunden!");
    };

    ws.current.onmessage = async (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log("📨 Meeting-Nachricht erhalten:", message);

      switch (message.type) {
        case "existing_users": {
          const userIdsToCall: number[] = message.user_ids;
          for (const userId of userIdsToCall) {
            const pc = createPeerConnection(userId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            ws.current?.send(JSON.stringify({
              type: "offer",
              offer: offer,
              user_id: userId
            }));
          }
          break;
        }
        case "user_joined": {
          console.log(`👋 Benutzer ${message.user_id} ist beigetreten`);
          break;
        }
        case "user_left": {
          console.log(`👋 Benutzer ${message.user_id} hat verlassen`);
          
          if (peerConnectionsRef.current[message.user_id]) {
            peerConnectionsRef.current[message.user_id].close();
            delete peerConnectionsRef.current[message.user_id];
            
            setRemoteStreams(prev => {
              const newStreams = { ...prev };
              delete newStreams[message.user_id];
              return newStreams;
            });
          }
          break;
        }
        case "offer": {
          const senderId = message.user_id;
          const pc = createPeerConnection(senderId);
          await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          ws.current?.send(JSON.stringify({
            type: "answer",
            answer: answer,
            user_id: senderId
          }));
          break;
        }
        case "answer": {
          const senderId = message.user_id;
          const pc = peerConnectionsRef.current[senderId];
          await pc.setRemoteDescription(new RTCSessionDescription(message.answer));
          break;
        }
        case "ice_candidate": {
          const senderId = message.user_id;
          const pc = peerConnectionsRef.current[senderId];
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
          }
          break;
        }
      }
    };

    // Audio WebSocket für AI
    audioWsRef.current = new WebSocket(
      `ws://localhost:8000/meeting/ws/audio/${meetingCode}?token=${token}`
    );
    
    audioWsRef.current.onopen = () => {
      console.log("✅ Audio-WebSocket verbunden!");

      if (!control.current) {
        console.error("❌ MediaStream nicht verfügbar!");
        return;
      }

      // MediaRecorder Setup - Audio-Only für bessere Kompatibilität
      try {
        console.log("🎙️ Erstelle Audio-Only MediaRecorder...");
        
        // Erstelle Audio-Only Stream für bessere Qualität
        const audioTracks = control.current.getAudioTracks();
        if (audioTracks.length === 0) {
          console.error("❌ Keine Audio-Tracks verfügbar!");
          return;
        }
        
        const audioOnlyStream = new MediaStream([audioTracks[0]]);
        console.log("✅ Audio-Only Stream erstellt");
        
        // Teste verschiedene MediaRecorder Konfigurationen
        let recorder;
        const configs = [
          { mimeType: 'audio/webm;codecs=opus', name: 'WEBM Opus' },
          { mimeType: 'audio/webm', name: 'WEBM Standard' },
          { mimeType: 'audio/mp4', name: 'MP4' },
          { name: 'Browser Default' }
        ];
        
        for (const config of configs) {
          try {
            console.log(`🔄 Teste Konfiguration: ${config.name}`);
            recorder = config.mimeType 
              ? new MediaRecorder(audioOnlyStream, { mimeType: config.mimeType })
              : new MediaRecorder(audioOnlyStream);
            
            console.log(`✅ ${config.name} funktioniert! MIME: ${recorder.mimeType}`);
            break;
          } catch (configError) {
            console.warn(`⚠️ ${config.name} nicht unterstützt:`, (configError as Error).message);
          }
        }
        
        if (!recorder) {
          console.error("❌ Keine funktionierende MediaRecorder Konfiguration gefunden!");
          return;
        }

        recorder.ondataavailable = (event) => {
          console.log("📝 Audio-Daten:", event.data.size, "bytes, Type:", event.data.type);
          if (audioWsRef.current?.readyState === WebSocket.OPEN && event.data.size > 0) {
            audioWsRef.current.send(event.data);
            console.log("📤 Audio-Daten gesendet!");
          }
        };

        recorder.onerror = (event) => {
          console.error("❌ MediaRecorder Fehler:", event);
        };

        recorder.onstart = () => {
          console.log("🎬 Audio-Only MediaRecorder gestartet!");
        };

        // Kürzere Intervalle für bessere Streaming-Qualität
        recorder.start(1000); // 1 Sekunde statt 3
        console.log("✅ Audio-Only MediaRecorder gestartet mit 1s Intervall");

      } catch (error) {
        console.error("❌ MediaRecorder fehlgeschlagen:", error);
        console.log("🔍 Browser unterstützt MediaRecorder möglicherweise nicht");
      }
    };

    audioWsRef.current.onerror = (error) => {
      console.error("❌ Audio-WebSocket Fehler:", error);
    };

    audioWsRef.current.onclose = (event) => {
      console.log("🔌 Audio-WebSocket geschlossen:", event.code);
    };

    // Cleanup
    return () => {
      console.log("🧹 Cleanup WebSocket Verbindungen...");
      ws.current?.close();
      audioWsRef.current?.close();
      
      // Peer Connections schließen
      Object.values(currentPeerConnections).forEach(pc => pc.close());
    };

  }, [isMediaReady, meetingCode, navigate]);

  // Hilfsfunktion für PeerConnection
  const createPeerConnection = (userId: number): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    if (control.current) {
      control.current.getTracks().forEach(track => {
        pc.addTrack(track, control.current!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.current?.send(JSON.stringify({
          type: "ice_candidate",
          candidate: event.candidate,
          user_id: userId
        }));
      }
    };

    pc.ontrack = (event) => {
      console.log("🎥 Remote Stream erhalten von Benutzer:", userId);
      setRemoteStreams(prev => ({
        ...prev,
        [userId]: event.streams[0]
      }));
    };

    peerConnectionsRef.current[userId] = pc;
    return pc;
  };

  const endMeeting = () => {
    // Cleanup und Navigation
    ws.current?.close();
    audioWsRef.current?.close();
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    
    if (control.current) {
      control.current.getTracks().forEach(track => track.stop());
    }

    navigate(`/summary/${meetingCode}?name=${encodeURIComponent(meetingName || "")}`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Meeting: {meetingName}</h1>
      <p>Code: {meetingCode}</p>
      
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {/* Eigenes Video */}
        <div>
          <h3>Du</h3>
          <video
            ref={stream}
            autoPlay
            muted
            style={{ width: "300px", height: "200px", border: "1px solid #ccc" }}
          />
        </div>

        {/* Remote Videos */}
        {Object.entries(remoteStreams).map(([userId, stream]) => (
          <div key={userId}>
            <h3>Benutzer {userId}</h3>
            <video
              autoPlay
              ref={(video) => {
                if (video) video.srcObject = stream;
              }}
              style={{ width: "300px", height: "200px", border: "1px solid #ccc" }}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={endMeeting}
          style={{
            padding: "10px 20px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Meeting beenden
        </button>
      </div>
    </div>
  );
}

export default MeetingPage;