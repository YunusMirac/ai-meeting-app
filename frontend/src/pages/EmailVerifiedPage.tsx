import { useEffect } from "react";
import { useNavigate } from "react-router-dom";


function EmailVerifiedPage() {
    const navigate = useNavigate();
    useEffect(() => {
        // Nach 5 Sekunden zur Login-Seite weiterleiten
        const timer = setTimeout(() => {
            navigate('/login');
        }, 5000);
        return () => clearTimeout(timer);
    }, [navigate]);
    return (
        <div>
            <h1>Email erfolgreich verifiziert!</h1>
            <p>Vielen Dank! Ihre Email-Adresse wurde erfolgreich verifiziert.</p>
        </div>
    );
}

export default EmailVerifiedPage;