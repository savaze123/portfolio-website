import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ServersPage.css';
import MatrixHomeButton from './MatrixHomeButton';
import myIcon from './images/matrixman.png';

function ServersPage() {
  const [servers, setServers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile data
        const profileResponse = await axios.get('/api/profile', { withCredentials: true });
        setProfile(profileResponse.data);

        // Fetch servers data
        const serversResponse = await axios.get('/api/servers', { withCredentials: true });
        const limitedServers = serversResponse.data.slice(0, 15);
        setServers(limitedServers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please log in again.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="servers-page"><h1>Loading servers...</h1></div>;
  if (error) return <div className="servers-page"><p className="error-message">{error}</p></div>;

  return (
    <div className="servers-page">
      <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 1000 }}>
        <MatrixHomeButton onClick={() => window.location.href = 'http://localhost:3000'} />
      </div>

      {/* User Profile Section */}
      {profile && (
        <div className="profile-section">
          <div className="profile-header">
            {profile.avatar && (
              <img src={profile.avatar} alt="Avatar" className="user-avatar" />
            )}
            <div className="profile-info">
              <h2 className="username">
                {profile.username}
                {profile.discriminator && <span className="discriminator">#{profile.discriminator}</span>}
              </h2>
            </div>
          </div>

          {/* Connections */}
          {profile.connections && profile.connections.length > 0 && (
            <div className="connections-section">
              <h3>Connected Accounts</h3>
              <div className="connections-list">
                {profile.connections.map((conn, idx) => (
                  <div key={idx} className="connection-item">
                    <span className="connection-type">{conn.type}:</span>
                    <span className="connection-name">{conn.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <h1 className="servers-title">Your Discord Servers ({servers.length}/15)</h1>
      <div className="servers-list">
        {servers.map((server) => (
          <div
            key={server.id}
            className="server-card"
            style={{ cursor: 'pointer' }}
          >
            <img
              src={
                server.icon
                  ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`
                  : myIcon
              }
              alt={server.name}
              className="server-icon"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = myIcon;
              }}
            />
            <p className="server-name">{server.name}</p>
            {server.approximate_member_count && (
              <p className="member-count">👥 {server.approximate_member_count.toLocaleString()} members</p>
            )}
            {server.owner && (
              <span className="owner-badge">👑 OWNER</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ServersPage;