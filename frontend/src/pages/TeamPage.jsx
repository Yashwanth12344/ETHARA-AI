import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { teamService, projectService } from '../services/api';
import { Plus, ArrowLeft, Lock } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import '../styles/team.css';

export default function TeamPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({ 
    name: '', 
    description: '',
    priority: 'Medium',
    color: '#3B82F6'
  });

  const fetchTeamAndProjects = useCallback(async () => {
    try {
      const teamRes = await teamService.getById(teamId);
      setTeam(teamRes.data.team);
      
      const projectRes = await projectService.getAll(teamId);
      setProjects(projectRes.data.projects);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTeamAndProjects();
  }, [fetchTeamAndProjects]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await projectService.create(teamId, projectForm);
      setProjectForm({ name: '', description: '', priority: 'Medium', color: '#3B82F6' });
      setShowProjectModal(false);
      fetchTeamAndProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  if (loading) return <div className="loading">Loading team...</div>;

  return (
    <div className="dashboard-with-sidebar">
      <Sidebar />
      <div className="team-page">
      <header className="page-header-bar">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
        </button>
        <h1>{team?.name}</h1>
        {user?.role === 'Admin' ? (
          <button className="btn-primary" onClick={() => setShowProjectModal(true)}>
            <Plus size={20} />
            New Project
          </button>
        ) : (
          <div className="btn-disabled" title="Only admins can create projects">
            <Lock size={20} />
            Admin Only
          </div>
        )}
      </header>

      <main className="team-content">
        <div className="team-info">
          <h2>Projects</h2>
          <span className="project-count">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
        </div>

        {projects.length === 0 ? (
          <div className="empty-state">
            <p>No projects yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(project => (
              <div
                key={project._id}
                className="project-card"
                onClick={() => navigate(`/project/${project._id}`)}
                style={{ borderLeftColor: project.color }}
              >
                <h3>{project.name}</h3>
                <p className="project-desc">{project.description}</p>
                <div className="project-meta">
                  <span className="badge">{project.status}</span>
                  <span className="priority" style={{ background: getPriorityColor(project.priority) }}>
                    {project.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showProjectModal && user?.role === 'Admin' && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  required
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                  placeholder="Enter project name"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                  placeholder="Enter project description"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={projectForm.priority}
                    onChange={(e) => setProjectForm({...projectForm, priority: e.target.value})}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="color"
                    value={projectForm.color}
                    onChange={(e) => setProjectForm({...projectForm, color: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowProjectModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function getPriorityColor(priority) {
  const colors = {
    'Low': '#10B981',
    'Medium': '#F59E0B',
    'High': '#EF4444',
    'Critical': '#7C3AED'
  };
  return colors[priority] || '#6B7280';
}