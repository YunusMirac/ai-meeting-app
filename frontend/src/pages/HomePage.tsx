import "../styles/HomePage.css";
// Am Anfang der Datei:
import unknownPersonImage from "../images/unknownPerson.png";

// Im JSX:
<img src={unknownPersonImage} alt="AI Meeting Logo" className="logo-image" />

function HomePage() {

  return (
    <>
    <div className="title-container">
        <h1 className="title">AI-MEETING</h1>
        <h2 className="subtitle">Your AI powered meeting assistant</h2>
        <p className="description">A platform for meetings with an AI assistant that automatically generates minutes, assigns tasks, and captures decisions.
          Yesterday was the last day to forget meeting notes!
        </p>
    </div>
    <div className="meeting-preview">
      <h3 className="meeting-name">Developer Meeting</h3>
    <div className="image-container">
        <div className="image-wrapper"><img src={unknownPersonImage} alt="AI Meeting Logo" className="logo-image" id="unknownPersonImage1"/><div className="name-badge">Yunus Comart</div></div>
        <div className="image-wrapper"><img src={unknownPersonImage} alt="AI Meeting Logo" className="logo-image" id="unknownPersonImage2"/><div className="name-badge">Felix Kraus</div></div>
    </div>
    <div className="image-container">
        <div className="image-wrapper"><img src={unknownPersonImage} alt="AI Meeting Logo" className="logo-image" id="unknownPersonImage3"/><div className="name-badge">Max Mustermann</div></div>
        <div className="image-wrapper"><img src={unknownPersonImage} alt="AI Meeting Logo" className="logo-image" id="unknownPersonImage4"/><div className="name-badge">Alexander Klannz</div></div>
        <div className="image-wrapper"><img src={unknownPersonImage} alt="AI Meeting Logo" className="logo-image" id="unknownPersonImage5"/><div className="name-badge">Sanches Ha</div></div>
    </div>
    </div>

        
    </>
  );
}

export default HomePage;