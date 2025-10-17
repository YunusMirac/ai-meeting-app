import { useState } from "react";
import { authServices } from "../services/authServices";
function RegisterPage() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [errors, setErrors] = useState<{[key: string]: string}>({});
const AuthService = new authServices();

// Passwort-Validierung
const validatePassword = (password: string) => {
  const errors = [];
  if (password.length < 8) {
    errors.push("Mindestens 8 Zeichen");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Mindestens 1 Großbuchstabe");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Mindestens 1 Kleinbuchstabe");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Mindestens 1 Zahl");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Mindestens 1 Sonderzeichen");
  }
  return errors;
};

// Formular-Validierung
const validateForm = () => {
  const newErrors: {[key: string]: string} = {};

  // Vorname prüfen
  if (!firstName.trim()) {
    newErrors.firstName = "Vorname ist erforderlich";
  }

  // Nachname prüfen
  if (!lastName.trim()) {
    newErrors.lastName = "Nachname ist erforderlich";
  }

  // Email prüfen
  if (!email.trim()) {
    newErrors.email = "Email ist erforderlich";
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    newErrors.email = "Ungültige Email-Adresse";
  }

  // Passwort prüfen
  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    newErrors.password = passwordErrors.join(", ");
  }

  // Passwort-Bestätigung prüfen
  if (!confirmPassword) {
    newErrors.confirmPassword = "Passwort-Bestätigung ist erforderlich";
  } else if (password !== confirmPassword) {
    newErrors.confirmPassword = "Passwörter stimmen nicht überein";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (validateForm()) {
    try {
      // Registrierungslogik nur ausführen wenn Validierung erfolgreich
      console.log('Registrierung erfolgreich:', {
        firstName,
        lastName,
        email,
        password
      });
      
      const result = await AuthService.registerUser(firstName, lastName, email, password);
      console.log('Registration result:', result);
      
      // Erfolgreiche Registrierung
      alert('Registrierung erfolgreich! Bitte überprüfen Sie Ihre Email für die Bestätigung.');
      
      // Formular zurücksetzen
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setErrors({});
      
    } catch (error) {
      console.error('Registration failed:', error);
      if (error instanceof Error) {
        setErrors({ email: error.message });
      } else {
        setErrors({ email: 'Ein unbekannter Fehler ist aufgetreten' });
      }
    }
  }
};

  return (
    <>
      <div>Register Page</div>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="firstName">First Name:</label>
          <input 
            type="text" 
            id="firstName"
            placeholder="First Name" 
            value={firstName} 
            onChange={(e) => setFirstName(e.target.value)} 
          />
          {errors.firstName && <div style={{color: 'red', fontSize: '12px'}}>{errors.firstName}</div>}
        </div>
        
        <div>
          <label htmlFor="lastName">Last Name:</label>
          <input 
            type="text" 
            id="lastName"
            placeholder="Last Name" 
            value={lastName} 
            onChange={(e) => setLastName(e.target.value)} 
          />
          {errors.lastName && <div style={{color: 'red', fontSize: '12px'}}>{errors.lastName}</div>}
        </div>
        
        <div>
          <label htmlFor="email">Email:</label>
          <input 
            type="email" 
            id="email"
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          {errors.email && <div style={{color: 'red', fontSize: '12px'}}>{errors.email}</div>}
        </div>
        
        <div>
          <label htmlFor="password">Password:</label>
          <input 
            type="password" 
            id="password"
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          {errors.password && <div style={{color: 'red', fontSize: '12px'}}>{errors.password}</div>}
          <div style={{fontSize: '11px', color: '#666', marginTop: '4px'}}>
            Mindestens 8 Zeichen, 1 Groß-, 1 Kleinbuchstabe, 1 Zahl, 1 Sonderzeichen
          </div>
        </div>
        
        <div>
          <label htmlFor="confirmPassword">Passwort bestätigen:</label>
          <input 
            type="password" 
            id="confirmPassword"
            placeholder="Passwort wiederholen" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {errors.confirmPassword && <div style={{color: 'red', fontSize: '12px'}}>{errors.confirmPassword}</div>}
        </div>
        
        <button type="submit">Register</button>
      </form>
    </>
  );
}

export default RegisterPage;
