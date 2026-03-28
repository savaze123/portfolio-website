import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ServersPage.css';

function ServersPage() {
  const [servers, setServers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('http://127.0.0.1:5000/api/servers', { withCredentials: true })
      .then((response) => {
        // Limit to 10 servers max
        const limitedServers = response.data.slice(0, 10);
        setServers(limitedServers);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching servers:', error);
        setError('Failed to load servers. Please log in again.');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="servers-page"><h1>Loading servers...</h1></div>;
  if (error) return <div className="servers-page"><p className="error-message">{error}</p></div>;

  return (
    <div className="servers-page">
      <h1>Your Discord Servers ({servers.length}/10)</h1>
      <div className="servers-list">
        {servers.map((server) => (
          <div key={server.id} className="server-card">
            <img
              src={
                server.icon
                  ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`
                  : 'https://via.placeholder.com/100'
              }
              alt={server.name}
              className="server-icon"
            />
            <p className="server-name">{server.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ServersPage;
