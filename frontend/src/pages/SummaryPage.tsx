import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { meetingServices } from "../services/meetingServices";

function SummaryPage() {
  // Holt den meetingCode aus der URL, z.B. /summary/ABC123
  const { meetingCode } = useParams<{ meetingCode: string }>();
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const meetingService = useMemo(() => new meetingServices(), []);

  useEffect(() => {
    // Führe nichts aus, wenn kein meetingCode vorhanden ist
    if (!meetingCode) {
      setError("Kein Meeting-Code gefunden.");
      setIsLoading(false);
      return;
    }

    console.log("Starte Polling für die Zusammenfassung...");

    // Starte ein Intervall, das alle 5 Sekunden beim Server nachfragt
    const intervalId = setInterval(async () => {
      try {
        const response = await meetingService.meetingSummary(meetingCode);

        // Prüfe die Antwort vom Server
        if (response.status === "ready") {
          console.log("Zusammenfassung ist fertig!");
          setSummary(response.summary || "Keine Zusammenfassung erhalten.");
          setIsLoading(false);
          clearInterval(intervalId); // WICHTIG: Stoppe das Nachfragen!
        } else {
          // response.status ist 'processing'
          console.log("Zusammenfassung wird noch generiert...");
        }
      } catch (err) {
        console.error("Fehler beim Abrufen der Zusammenfassung:", err);
        setError("Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        clearInterval(intervalId); // Auch bei einem Fehler stoppen
      }
    }, 5000); // Frage alle 5 Sekunden

    // WICHTIG: Die Aufräumfunktion. Sie wird ausgeführt, wenn die Seite verlassen wird.
    return () => {
      console.log("Stoppe Polling.");
      clearInterval(intervalId);
    };
  }, [meetingCode, meetingService]); // Abhängigkeiten korrekt angegeben

  // --- JSX ZUR ANZEIGE ---

  if (error) {
    return <div><h1>Error</h1><p>{error}</p></div>;
  }

  return (
    <div>
      {isLoading ? (
        <div>
          <h1>Your meeting summary is being generated...</h1>
          <p>This may take a few minutes. Please do not close this window.</p>
          {/* Hier könntest du einen Lade-Spinner oder eine Animation einfügen */}
        </div>
      ) : (
        <div>
          <h1>Meeting-Summary</h1>
          {/* Zeigt die Zusammenfassung mit Zeilenumbrüchen an */}
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "1rem" }}>
            {summary}
          </pre>
        </div>
      )}
    </div>
  );
}

export default SummaryPage;
