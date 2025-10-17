import HomePage from "./pages/HomePage";
import { Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePageNavbar from "./components/HomePageNavbar";
import EmailVerifiedPage from "./pages/EmailVerifiedPage";
import StartPage from "./pages/StartPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatPage from "./pages/ChatPage";
import CreateMeeting from "./pages/CreateMeeting";
import JoinMeeting from "./pages/JoinMeeting";
import MeetingPage from "./pages/MeetingPage";
import SummaryPage from "./pages/SummaryPage";

const AppContent: React.FC = () => {
  return (
    <>
      <HomePageNavbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/email-verified" element={<EmailVerifiedPage />} />
        <Route 
          path="/startpage" 
          element={
            <ProtectedRoute>
              <StartPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/chat/:contact_id" element={ <ProtectedRoute><ChatPage /></ProtectedRoute> } />
        <Route path="/create-meeting" element={ <ProtectedRoute><CreateMeeting /></ProtectedRoute> } />
        <Route path="/join-meeting" element={ <ProtectedRoute><JoinMeeting /></ProtectedRoute> } />
        <Route path="/meeting/:meeting_code" element={ <ProtectedRoute><MeetingPage /></ProtectedRoute> } />
        <Route path="/summary/:meetingCode" element={ <ProtectedRoute><SummaryPage /></ProtectedRoute> } />
      </Routes>
    </>

  );
};

const App: React.FC = () => {
  return (
      <AppContent />
  );
}

export default App;