import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { axiosExternal } from './axiosConfig';
import './App.css';
import cheeringGif from './images/cheerin.gif';
import worriedGif from './images/worried.gif';

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
        const response = await axiosExternal.get(
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
    const interval = setInterval(fetchBitcoinPrice, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="data-widget">
      <div className="data-label">Bitcoin Price</div>
      <div className="data-value">
        {bitcoinData.price ? `$${bitcoinData.price.toLocaleString()}` : 'Loading...'}
      </div>
      {bitcoinData.status === 'up' && <img src={cheeringGif} alt="Bitcoin is up!" style={{width: '80px', marginTop: '10px'}} />}
      {bitcoinData.status === 'down' && <img src={worriedGif} alt="Bitcoin is down!" style={{width: '80px', marginTop: '10px'}} />}
    </div>
  );
}

// Resume Page Component
function ResumePage() {
  const [resume, setResume] = useState(null);

  useEffect(() => {
    axios
      .get('/api/resume')
      .then((response) => {
        setResume(response.data);
      })
      .catch((error) => {
        console.error('Error fetching resume data:', error);
        // Set a default resume or error state
        setResume({
          name: 'Error Loading',
          email: 'error@example.com',
          phone: 'N/A',
          linkedin: '#',
          summary: 'Failed to load resume data. Please refresh.',
          education: { degree: 'N/A', institution: 'N/A', graduation_date: 'N/A', coursework: [] },
          skills: { ai_automation: [], languages: [], data_engineering: [], tools_devops: [] },
          certifications: [],
          experience: [],
          projects: []
        });
      });
  }, []);

  if (!resume) {
    return <div className="resume-page"><h1>Loading...</h1></div>;
  }

  return (
    <div className="resume-page">
      {/* Intro Section */}
      <section className="intro">
        <div className="intro-inner">
          <div className="status-bar">
            <span className="status-dot"></span>
            PROFILE ACTIVE
          </div>
          <h1 className="neon-name">{resume.name}</h1>
          <p className="neon-abstract">{resume.summary}</p>
          <div className="btn-group">
            <a href={resume.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              LinkedIn Profile
            </a>
            <a href="#contact" className="btn">
              Get in Touch
            </a>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section id="contact" className="container">
        <div className="section-header">
          <h2>Contact</h2>
          <div className="section-line"></div>
          <span className="section-num">01</span>
        </div>
        <div className="wrapper">
          <p><strong>Email:</strong> {resume.email}</p>
          <p><strong>Phone:</strong> {resume.phone}</p>
          <p><strong>LinkedIn:</strong> <a href={resume.linkedin} target="_blank" rel="noopener noreferrer">{resume.linkedin}</a></p>
        </div>
      </section>

      {/* Education Section */}
      <section className="container">
        <div className="section-header">
          <h2>Education</h2>
          <div className="section-line"></div>
          <span className="section-num">02</span>
        </div>
        <div className="wrapper">
          <h3>{resume.education.degree}</h3>
          <p>{resume.education.institution} • {resume.education.graduation_date}</p>
          <h4 style={{marginTop: '24px', color: 'var(--cyan)', fontSize: '0.9rem'}}>Relevant Coursework:</h4>
          <div className="skills-grid">
            {resume.education.coursework.map((course, index) => (
              <div key={index} className="skill-item">{course}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="container">
        <div className="section-header">
          <h2>Certifications</h2>
          <div className="section-line"></div>
          <span className="section-num">03</span>
        </div>
        <div className="projects-grid">
          {resume.certifications.map((cert, index) => (
            <div key={index} className="project">
              <h3>{cert.name}</h3>
              <p><strong>{cert.issuer}</strong> • {cert.year}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Skills Section */}
      <section className="container">
        <div className="section-header">
          <h2>Skills</h2>
          <div className="section-line"></div>
          <span className="section-num">04</span>
        </div>
        
        {/* AI & Automation */}
        <div className="wrapper" style={{marginBottom: '20px'}}>
          <h4 style={{color: 'var(--pink)', marginBottom: '12px'}}>AI & Automation</h4>
          <div className="skills-grid">
            {resume.skills.ai_automation.map((skill, index) => (
              <div key={index} className="skill-item">{skill}</div>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div className="wrapper" style={{marginBottom: '20px'}}>
          <h4 style={{color: 'var(--pink)', marginBottom: '12px'}}>Languages</h4>
          <div className="skills-grid">
            {resume.skills.languages.map((skill, index) => (
              <div key={index} className="skill-item">{skill}</div>
            ))}
          </div>
        </div>

        {/* Data Engineering */}
        <div className="wrapper" style={{marginBottom: '20px'}}>
          <h4 style={{color: 'var(--pink)', marginBottom: '12px'}}>Data Engineering</h4>
          <div className="skills-grid">
            {resume.skills.data_engineering.map((skill, index) => (
              <div key={index} className="skill-item">{skill}</div>
            ))}
          </div>
        </div>

        {/* Tools & DevOps */}
        <div className="wrapper">
          <h4 style={{color: 'var(--pink)', marginBottom: '12px'}}>Tools & DevOps</h4>
          <div className="skills-grid">
            {resume.skills.tools_devops.map((skill, index) => (
              <div key={index} className="skill-item">{skill}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="container">
        <div className="section-header">
          <h2>Experience</h2>
          <div className="section-line"></div>
          <span className="section-num">05</span>
        </div>
        {resume.experience.map((exp, index) => (
          <div key={index} className="experience-item">
            <h3>{exp.position}</h3>
            <p className="experience-meta">{exp.company} • {exp.start_date} – {exp.end_date}</p>
            <ul style={{color: 'var(--text-dim)', fontSize: '0.82rem', lineHeight: '1.8'}}>
              {exp.description.map((desc, i) => (
                <li key={i} style={{marginBottom: '8px'}}>{desc}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Projects Section */}
      <section className="container">
        <div className="section-header">
          <h2>Projects</h2>
          <div className="section-line"></div>
          <span className="section-num">06</span>
        </div>
        <div className="projects-grid">
          {resume.projects.map((project, index) => (
            <div key={index} className="project">
              <h3>{project.name}</h3>
              <p style={{fontSize: '0.75rem', color: 'var(--cyan-dim)', marginBottom: '12px'}}>
                {project.tools.join(' • ')}
              </p>
              <ul style={{color: 'var(--text-dim)', fontSize: '0.78rem', lineHeight: '1.6', paddingLeft: '16px'}}>
                {project.description.map((desc, i) => (
                  <li key={i} style={{marginBottom: '6px'}}>{desc}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Bitcoin Tracker Section */}
      <section className="container">
        <div className="section-header">
          <h2>Data Stream</h2>
          <div className="section-line"></div>
          <span className="section-num">07</span>
        </div>
        <BitcoinTracker />
      </section>

      {/* Discord Login Section */}
      <section className="container">
        <div className="section-header">
          <h2>Explore More</h2>
          <div className="section-line"></div>
          <span className="section-num">08</span>
        </div>
        <div className="wrapper" style={{textAlign: 'center'}}>
          <p style={{marginBottom: '24px'}}>Connect with me on Discord to explore more:</p>
          <a href="/login" className="neon-sign">Log in with Discord</a>
        </div>
      </section>
    </div>
  );
}

export default ResumePage;
