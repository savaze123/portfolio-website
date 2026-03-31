import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ChannelsPage.css';
import MatrixBackButton from './MatrixBackButton';

function ChannelsPage() {
  const { serverId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const serverName = state?.serverName || 'Unknown Server';

  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Fetch channels on load
  useEffect(() => {
    axios
      .get(`/api/channels/${serverId}`, { withCredentials: true })
      .then((response) => {
        setChannels(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching channels:', error);
        setError('Failed to load channels.');
        setLoading(false);
      });
  }, [serverId]);

  // Fetch messages when channel is selected
  const handleChannelClick = (channel) => {
    setSelectedChannel(channel);
    setMessagesLoading(true);
    setMessages([]);

    axios
      .get(`/api/messages/${channel.id}`, { withCredentials: true })
      .then((response) => {
        // Reverse to show oldest first
        setMessages(response.data.reverse());
        setMessagesLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages.');
        setMessagesLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="channels-page">
        <h1>Loading channels...</h1>
      </div>
    );
  }

  if (error && channels.length === 0) {
    return (
      <div className="channels-page">
        <p className="error-message">{error}</p>
        <button onClick={() => navigate('/servers')}>Back to Servers</button>
      </div>
    );
  }

  return (
    <div className="channels-page">
      <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 1000 }}>
        <MatrixBackButton onClick={() => navigate('/servers')} />
      </div>

      <div className="channels-container">
        {/* Channels List */}
        <div className="channels-sidebar">
          <h2 className="server-title">{serverName}</h2>
          <div className="channels-list">
            {channels.length === 0 ? (
              <p className="no-channels">No text channels found.</p>
            ) : (
              channels.map((channel) => (
                <div
                  key={channel.id}
                  className={`channel-item ${selectedChannel?.id === channel.id ? 'active' : ''}`}
                  onClick={() => handleChannelClick(channel)}
                >
                  # {channel.name}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messages Terminal */}
        <div className="messages-panel">
          {selectedChannel ? (
            <>
              <div className="terminal-header">
                <span className="terminal-title"># {selectedChannel.name}</span>
                <span className="terminal-status">●</span>
              </div>
              <div className="terminal-output">
                {messagesLoading ? (
                  <div className="message-line">loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="message-line">no messages in this channel</div>
                ) : (
                  messages.map((msg, index) => {
                    const timestamp = new Date(msg.timestamp).toLocaleTimeString();
                    return (
                      <div
                        key={msg.id}
                        className="message-line"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        [{timestamp}] {msg.author} &gt; {msg.content}
                      </div>
                    );
                  })
                )}
                <div className="cursor">_</div>
              </div>
            </>
          ) : (
            <div className="terminal-empty">
              <div className="message-line">select a channel to view messages</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChannelsPage;
