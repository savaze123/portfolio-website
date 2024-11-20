import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';
import cheeringGif from './images/cheerin.gif'; // Make sure this path is correct
import worriedGif from './images/worried.gif'; // Make sure this path is correct

// BitcoinTracker Component
function BitcoinTracker() {
  const [bitcoinPrice, setBitcoinPrice] = useState(null);
  const [previousPrice, setPreviousPrice] = useState(null);
  const [priceStatus, setPriceStatus] = useState('neutral'); // Initialize with 'neutral'

  useEffect(() => {
    const fetchBitcoinPrice = async () => {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        const currentPrice = response.data.bitcoin.usd;

        // Update price status
        if (previousPrice !== null) {
          if (currentPrice > previousPrice) {
            setPriceStatus('up');
          } else if (currentPrice < previousPrice) {
            setPriceStatus('down');
          }
        }

        setPreviousPrice(currentPrice);
        setBitcoinPrice(parseFloat(currentPrice.toFixed(2)));
      } catch (error) {
        console.error('Error fetching Bitcoin price:', error);
      }
    };

    fetchBitcoinPrice(); // Initial fetch

    // Set up interval to fetch every 30 seconds
    const interval = setInterval(() => {
      fetchBitcoinPrice();
    }, 30000);

    return () => clearInterval(interval); // Clean up interval on component unmount
  }, [previousPrice]); // Add previousPrice to the dependency array

  return (
    <div className="bitcoin-tracker" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ flex: 1 }}>
        <p>Current Bitcoin Price: {bitcoinPrice ? `$${bitcoinPrice.toFixed(2)}` : 'Loading...'}</p>
      </div>
      <div className="status-gif" style={{ marginLeft: '20px' }}>
        {priceStatus === 'neutral' && <p>Waiting for price update...</p>}
        {priceStatus === 'up' && <img src={cheeringGif} alt="Bitcoin is up!" />}
        {priceStatus === 'down' && <img src={worriedGif} alt="Bitcoin is down!" />}
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [resume, setResume] = useState(null);

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/api/resume')
      .then(response => {
        console.log('Resume data fetched successfully:', response.data);
        setResume(response.data);
      })
      .catch(error => {
        console.error('Error fetching resume data:', error);
      });
  }, []);

  if (!resume) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      {/* Intro Section */}
      <section className="intro">
        <div className="intro-content">
          <h1 className="neon-name">Savaze Khattak</h1>
          <p className="neon-abstract">
            A highly motivated and ambitious individual with a deep passion for technology,
            eager to make a mark in the software engineering world. With a solid foundation
            in computer science and a knack for problem-solving, I'm driven to build innovative
            solutions that push the boundaries of what's possible. Welcome to my digital realm.
          </p>
        </div>
      </section>

      {/* Resume Section */}
      <div className="wrapper">
        <header className="App-header">
          <h1>{resume.name}</h1>
          <p>Email: {resume.email}</p>
          <p>Phone: {resume.phone}</p>
        </header>

        <section className="education">
          <h2>Education</h2>
          <p>{resume.education.degree} - {resume.education.institution} ({resume.education.graduation_date})</p>
        </section>

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

        <section className="projects">
          <h2>Projects</h2>
          {resume.projects.map((project, index) => (
            <div key={index} className="project">
              <h3>
                {/* Adding a link for my discord bot project */}
                {project.name === 'Python Discord Bot' ? (
                  <a href="https://github.com/SelasiF/discordBot" target="_blank" rel="noopener noreferrer">
                    {project.name}
                  </a>
                ) : (
                  project.name
                )}
              </h3>
              <p><strong>Tools:</strong> {project.tools}</p>
              <p>{project.description}</p>
            </div>
          ))}
        </section>

        <section className="experience">
          <h2>Experience</h2>
          {resume.experience.map((exp, index) => (
            <div key={index} className="experience-item">
              <h3>{exp.position} - 
                {exp.company === 'Marjan NycInc' ? (
                  <a href="https://marjannyc.com/?srsltid=AfmBOopjSOfiySOqIl0r4CMVFix2U8hOYL76RBIjoBg5e1y-cwpB_czS" target="_blank" rel="noopener noreferrer">
                    {exp.company}
                  </a>
                ) : (
                  exp.company
                )}
              </h3>
              <p>{exp.start_date} - {exp.end_date}</p>
              <p>{exp.description}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default App;
