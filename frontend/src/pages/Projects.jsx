import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { teamService, projectService, taskService } from '../services/api';
import { Plus, FolderOpen, TrendingUp } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import '../styles/projects.css';

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const [showTaskEditModal, setShowTaskEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskEditForm, setTaskEditForm] = useState({ title: '', description: '', priority: 'Medium', dueDate: '' });
  const [showModal, setShowModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '',
    priority: 'Medium',
    color: '#3B82F6'
  });

  useEffect(() => {
    fetchData();
    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);
    const refreshTimer = setInterval(fetchData, 15000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(refreshTimer);
    };
  }, []);

  const fetchData = async () => {
    try {
      const teamsRes = await teamService.getAll();
      setTeams(teamsRes.data.teams);

      let projects = [];
      for (const team of teamsRes.data.teams) {
        try {
          const projectRes = await projectService.getAll(team._id);
          projects = [...projects, ...projectRes.data.projects];
        } catch (err) {
          console.error(`Failed to fetch projects for team ${team._id}`);
        }
      }
      projects.sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
      setAllProjects(projects);
      if (projects.length > 0) {
        setSelectedTeam(projects[0].teamId || teamsRes.data.teams[0]?._id);
      } else if (teamsRes.data.teams.length > 0) {
        setSelectedTeam(teamsRes.data.teams[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (projectId) => {
    try {
      const projRes = await projectService.getById(projectId);
      setSelectedProject(projRes.data.project);
      const tasksRes = await taskService.getAll(projectId);
      setProjectTasks(tasksRes.data.tasks);
    } catch (err) {
      console.error('Failed to fetch project details', err);
    }
  };

  const handleOpenTaskEdit = (task) => {
    setEditingTask(task);
    setTaskEditForm({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'Medium',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
    });
    setShowTaskEditModal(true);
  };

  const handleTaskEditChange = (e) => {
    setTaskEditForm({ ...taskEditForm, [e.target.name]: e.target.value });
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    try {
      await taskService.update(editingTask._id, taskEditForm);
      setShowTaskEditModal(false);
      setEditingTask(null);
      fetchProjectDetails(selectedProjectId);
    } catch (err) {
      console.error('Failed to update task', err);
      alert('Failed to update task');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!selectedTeam) {
      alert('Please select a team');
      return;
    }

    try {
      await projectService.create(selectedTeam, formData);
      setFormData({ name: '', description: '', priority: 'Medium', color: '#3B82F6' });
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Error creating project');
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Low': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'High': return '#ef4444';
      case 'Critical': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  if (loading) return <div className="loading">Loading projects...</div>;

  return (
    <div className="dashboard-with-sidebar">
      <Sidebar />
      <main className="dashboard-content">
        <div className="page-container projects-master-detail">
          <div className="projects-list-panel">
            <div className="page-header-section">
              <div className="header-info">
                <FolderOpen size={32} className="header-icon" />
                <div>
                  <h1>Projects</h1>
                  <p>Manage all your projects across teams</p>
                </div>
              </div>
              {user?.role === 'Admin' && (
                <button 
                  className="btn-primary-lg"
                  onClick={() => setShowModal(true)}
                >
                  <Plus size={20} />
                  New Project
                </button>
              )}
            </div>

            {allProjects.length === 0 ? (
              <div className="empty-state-large">
                <FolderOpen size={64} />
                <h3>No Projects Yet</h3>
                <p>Create your first project to get started</p>
              </div>
            ) : (
              <div className="projects-list">
                {allProjects.map(project => (
                  <div 
                    key={project._id}
                    className={`project-list-item ${selectedProjectId === project._id ? 'active' : ''}`}
                    style={{ borderLeftColor: project.color }}
                  >
                    <div onClick={() => { setSelectedProjectId(project._id); fetchProjectDetails(project._id); }} style={{cursor:'pointer'}}>
                      <h4>{project.name}</h4>
                      <p className="small muted">{project.description}</p>
                    </div>
                    <div style={{marginTop:8}}>
                      <button className="btn-small" onClick={() => { setSelectedProjectId(project._id); fetchProjectDetails(project._id); }}>View →</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="projects-detail-panel">
            {!selectedProjectId ? (
              <div className="empty-state">
                <p>Select a project to view details and tasks</p>
              </div>
            ) : (
              <div className="project-detail">
                <div className="project-header-detail">
                  <button className="btn-back" onClick={() => { setSelectedProjectId(null); setSelectedProject(null); setProjectTasks([]); }}>
                    Back
                  </button>
                  <h2>{selectedProject?.name}</h2>
                  <p className="muted">{selectedProject?.description}</p>
                </div>
                <div className="project-stats">
                  <div className="stat-card">Total Tasks: {projectTasks.length}</div>
                  <div className="stat-card success">Completed: {projectTasks.filter(t => t.status === 'Completed').length}</div>
                  <div className="stat-card warning">In Progress: {projectTasks.filter(t => t.status === 'In Progress').length}</div>
                </div>
                <div className="project-tasks">
                  {projectTasks.length === 0 ? (
                    <div className="empty-state-large"><p>No tasks yet</p></div>
                  ) : (
                    projectTasks.map(task => (
                      <div key={task._id} className="task-card">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
                          <div>
                            <h4>{task.title}</h4>
                            <p className="small">{task.description}</p>
                            <div className="meta small muted">{task.priority} • {task.status}</div>
                          </div>
                          <div style={{display:'flex', gap:8}}>
                            <button className="btn-small" onClick={() => handleOpenTaskEdit(task)}>Edit</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {showTaskEditModal && (
        <div className="modal-overlay" onClick={() => setShowTaskEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Edit Task</h2>
            <form onSubmit={handleUpdateTask}>
              <div className="form-group">
                <label>Title</label>
                <input name="title" value={taskEditForm.title} onChange={handleTaskEditChange} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={taskEditForm.description} onChange={handleTaskEditChange} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select name="priority" value={taskEditForm.priority} onChange={handleTaskEditChange}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input name="dueDate" type="date" value={taskEditForm.dueDate} onChange={handleTaskEditChange} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowTaskEditModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Update Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && user?.role === 'Admin' && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Team *</label>
                <select
                  required
                  value={selectedTeam || ''}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="form-select"
                >
                  <option value="">Select a team</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Project Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter project name"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter project description"
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
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
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
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
  );
}
