import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ServersPage.css';

function ServersPage() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('http://127.0.0.1:5000/api/servers', { withCredentials: false })
      .then((response) => {
        setServers(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching servers:', error);
        setError('Failed to load servers. Please log in.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="servers-page">
      <h1>Your Discord Servers</h1>
      {loading && <p>Loading servers...</p>}
      {error && (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
      <div className="servers-list">
        {servers.length > 0 &&
          servers.map((server) => (
            <div key={server.id} className="server-card">
              <img
                src={
                  server.icon
                    ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`
                    : 'https://via.placeholder.com/100'
                }
                alt={`Icon of ${server.name}`}
                className="server-icon"
              />
              <p className="server-name">{server.name}</p>
            </div>
          ))}
        {servers.length === 0 && !loading && !error && (
          <p>No servers found. Please try again later.</p>
        )}
      </div>
    </div>
  );
}

export default ServersPage;
