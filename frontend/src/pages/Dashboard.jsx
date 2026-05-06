import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { teamService } from '../services/api';
import { Plus, Users, LogOut } from 'lucide-react';
import '../styles/dashboard.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await teamService.getAll();
      setTeams(response.data.teams);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await teamService.create(formData);
      setFormData({ name: '', description: '' });
      setShowModal(false);
      fetchTeams();
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Team Task Manager</h1>
          <div className="header-actions">
            <span className="user-name">Welcome, {user?.name}</span>
            <button onClick={handleLogout} className="btn-logout">
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="page-header">
            <h2>Your Teams</h2>
            <button 
              className="btn-primary" 
              onClick={() => setShowModal(true)}
            >
              <Plus size={20} />
              Create Team
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading teams...</div>
          ) : teams.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <h3>No teams yet</h3>
              <p>Create a team to get started with project management</p>
              <button 
                className="btn-primary" 
                onClick={() => setShowModal(true)}
              >
                Create Your First Team
              </button>
            </div>
          ) : (
            <div className="teams-grid">
              {teams.map(team => (
                <div 
                  key={team._id} 
                  className="team-card"
                  onClick={() => navigate(`/team/${team._id}`)}
                >
                  <div className="team-header">
                    <h3>{team.name}</h3>
                    <span className="member-count">{team.members?.length || 0} members</span>
                  </div>
                  <p className="team-description">{team.description}</p>
                  <div className="team-footer">
                    <span className="team-badge">Team</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create New Team</h2>
            <form onSubmit={handleCreateTeam}>
              <div className="form-group">
                <label>Team Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter team name"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter team description"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}