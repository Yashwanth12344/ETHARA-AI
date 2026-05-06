import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { teamService } from '../services/api';
import { Users, Mail, Shield } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import '../styles/members.css';

export default function Members() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const teamsRes = await teamService.getAll();
      setTeams(teamsRes.data.teams);

      let members = [];
      for (const team of teamsRes.data.teams) {
        if (team.members) {
          members = [...members, ...team.members.map(m => ({ ...m, teamName: team.name, teamId: team._id }))];
        }
      }
      setAllMembers(members);
      if (teamsRes.data.teams.length > 0) {
        setSelectedTeam(teamsRes.data.teams[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading members...</div>;

  const selectedTeamData = teams.find(t => t._id === selectedTeam);
  const teamMembers = selectedTeamData?.members || [];

  return (
    <div className="dashboard-with-sidebar">
      <Sidebar />
      <main className="dashboard-content">
        <div className="page-container">
          <div className="page-header-section">
            <div className="header-info">
              <Users size={32} className="header-icon" />
              <div>
                <h1>Team Members</h1>
                <p>Manage team members and roles</p>
              </div>
            </div>
          </div>

          {teams.length === 0 ? (
            <div className="empty-state-large">
              <Users size={64} />
              <h3>No Teams</h3>
              <p>Create a team first to add members</p>
            </div>
          ) : (
            <>
              <div className="team-selector">
                <label>Select Team:</label>
                <select 
                  value={selectedTeam || ''} 
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="team-select"
                >
                  {teams.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              </div>

              {teamMembers.length === 0 ? (
                <div className="empty-state-large">
                  <Users size={64} />
                  <h3>No Members</h3>
                  <p>This team has no members yet</p>
                </div>
              ) : (
                <div className="members-grid">
                  {teamMembers.map(member => (
                    <div key={member.userId?._id || member._id} className="member-card">
                      <div className="member-avatar-large">
                        {(member.userId?.name || member.name)?.charAt(0).toUpperCase()}
                      </div>
                      <div className="member-info-section">
                        <h3>{member.userId?.name || member.name}</h3>
                        <div className="member-email">
                          <Mail size={14} />
                          {member.userId?.email || member.email}
                        </div>
                        <div className="member-role">
                          <Shield size={14} />
                          <span className={`role-badge ${member.role?.toLowerCase()}`}>
                            {member.role}
                          </span>
                        </div>
                      </div>
                      {user?.role === 'Admin' && (
                        <div className="member-actions">
                          <button className="btn-small secondary">Change Role</button>
                          <button className="btn-small danger">Remove</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
