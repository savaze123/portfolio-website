import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import cheeringGif from './images/cheerin.gif'; // Ensure the path is correct
import worriedGif from './images/worried.gif'; // Ensure the path is correct

// Bitcoin Tracker Component
function BitcoinTracker() {
  const [bitcoinData, setBitcoinData] = useState({
    price: null,
    previousPrice: null,
    status: 'neutral',
  });

  useEffect(() => {
    const fetchBitcoinPrice = async () => {
      try {
        const response = await axios.get(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
        );
        const currentPrice = response.data.bitcoin.usd;

        setBitcoinData((prevData) => ({
          previousPrice: prevData.price,
          price: currentPrice,
          status:
            prevData.price !== null
              ? currentPrice > prevData.price
                ? 'up'
                : currentPrice < prevData.price
                ? 'down'
                : prevData.status
              : 'neutral',
        }));
      } catch (error) {
        console.error('Error fetching Bitcoin price:', error);
      }
    };

    fetchBitcoinPrice();
    const interval = setInterval(fetchBitcoinPrice, 30000); // Fetch every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bitcoin-tracker">
      <p>Current Bitcoin Price: {bitcoinData.price ? `$${bitcoinData.price.toFixed(2)}` : 'Loading...'}</p>
      {bitcoinData.status === 'neutral' && <p>Waiting for price update...</p>}
      {bitcoinData.status === 'up' && <img src={cheeringGif} alt="Bitcoin is up!" />}
      {bitcoinData.status === 'down' && <img src={worriedGif} alt="Bitcoin is down!" />}
    </div>
  );
}

// Resume Page Component
function ResumePage() {
  const [resume, setResume] = useState(null);

  useEffect(() => {
    axios
      .get('http://127.0.0.1:5000/api/resume')
      .then((response) => {
        setResume(response.data);
      })
      .catch((error) => {
        console.error('Error fetching resume data:', error);
      });
  }, []);

  if (!resume) {
    return <div>Loading...</div>;
  }

  return (
    <div className="resume-page">
      {/* Wrapper for content */}
      <div className="container">
        {/* Intro Section */}
        <section className="intro">
          <h1 className="neon-name">Savaze Khattak</h1>
          <p className="neon-abstract">
            A highly motivated and ambitious individual with a deep passion for technology,
            eager to make a mark in the software engineering world. With a solid foundation
            in computer science and a knack for problem-solving, I'm driven to build innovative
            solutions that push the boundaries of what's possible. Welcome to my digital realm.
          </p>
        </section>

        {/* Contact Information */}
        <header className="App-header">
          <h1>{resume.name}</h1>
          <p>Email: {resume.email}</p>
          <p>Phone: {resume.phone}</p>
        </header>

        {/* Education Section */}
        <section className="education">
          <h2>Education</h2>
          <p>{resume.education.degree} - {resume.education.institution} ({resume.education.graduation_date})</p>
        </section>

        {/* Skills Section */}
        <section className="skills">
          <h2>Skills</h2>
          <ul>
            {resume.skills.map((skill, index) => (
              <li key={index}>{skill}</li>
            ))}
          </ul>
        </section>

        {/* Bitcoin Tracker Section */}
        <BitcoinTracker />

        {/* Projects Section */}
        <section className="projects">
          <h2>Projects</h2>
          {resume.projects.map((project, index) => (
            <div key={index} className="project">
              <h3>{project.name}</h3>
              <p><strong>Tools:</strong> {project.tools}</p>
              <p>{project.description}</p>
            </div>
          ))}
        </section>

        {/* Experience Section */}
        <section className="experience">
          <h2>Experience</h2>
          {resume.experience.map((exp, index) => (
            <div key={index} className="experience-item">
              <h3>{exp.position} - {exp.company}</h3>
              <p>{exp.start_date} - {exp.end_date}</p>
              <p>{exp.description}</p>
            </div>
          ))}
        </section>

        {/* Discord Login Section */}
        <section className="discord-login">
          <h2>Explore More</h2>
          <p>Log into your Discord to see your servers:</p>
          <a href="/login" className="neon-sign">Log in with Discord</a>
        </section>
      </div>
    </div>
  );
}

export default ResumePage;
