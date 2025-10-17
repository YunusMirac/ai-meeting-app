
import { useState } from "react";
import { authServices } from "../services/authServices";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const navigate = useNavigate();
  const AuthService = new authServices();

  // Formular-Validierung
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Email prüfen
    if (!email.trim()) {
      newErrors.email = "Email ist erforderlich";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Ungültige Email-Adresse";
    }

    // Passwort prüfen
    if (!password.trim()) {
      newErrors.password = "Passwort ist erforderlich";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      
      try {
        const data = await AuthService.loginUser(email, password);
        const user = data as { id: string; email: string; first_name: string; last_name: string };
        localStorage.setItem('currentUser',
            JSON.stringify({ id: user.id, email: user.email, vorname: user.first_name, nachname: user.last_name })
        );
        // Nach erfolgreichem Login zur StartPage weiterleiten
        navigate('/startpage');
        
      } catch (error) {
        console.error('Login-Fehler:', error);
      }
    }
  };

  return (
    <>
      <div>Login Page</div>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input 
            type="email" 
            id="email"
            placeholder="ihre.email@beispiel.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <div style={{color: 'red', fontSize: '12px'}}>{errors.email}</div>}
        </div>
        
        <div>
          <label htmlFor="password">Passwort:</label>
          <input 
            type="password" 
            id="password"
            placeholder="Ihr Passwort" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <div style={{color: 'red', fontSize: '12px'}}>{errors.password}</div>}
        </div>
        <button type="submit">Login</button>
      </form>
    </>
  );
}

export default LoginPage;