import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { teamService, projectService, taskService } from '../services/api';
import { Plus, BarChart3 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MemberPicker from '../components/MemberPicker';
import '../styles/dashboard.css';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '',
    selectedMembers: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const teamsRes = await teamService.getAll();
      const allTeams = teamsRes.data.teams;
      setTeams(allTeams);

      // fetch projects for each team
      let allProjects = [];
      for (const t of allTeams) {
        try {
          const pRes = await projectService.getAll(t._id);
          allProjects = [...allProjects, ...pRes.data.projects];
        } catch (err) {
          console.error('Failed to fetch projects for team', t._id);
        }
      }
      setProjects(allProjects);

      // fetch tasks for each project
      let allTasks = [];
      for (const p of allProjects) {
        try {
          const tRes = await taskService.getAll(p._id);
          allTasks = [...allTasks, ...tRes.data.tasks];
        } catch (err) {
          console.error('Failed to fetch tasks for project', p._id);
        }
      }
      setTasks(allTasks);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const teamData = {
        name: formData.name,
        description: formData.description,
        selectedMembers: formData.selectedMembers
      };
      await teamService.create(teamData);
      setFormData({ name: '', description: '', selectedMembers: [] });
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create team:', error);
      alert('Error creating team: ' + error.response?.data?.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const stats = {
    totalProjects: projects.length,
    totalTasks: tasks.length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    overdue: tasks.filter(t => t.isOverdue && t.status !== 'Completed').length
  };

  const upcoming = tasks
    .filter(t => t.dueDate)
    .sort((a,b)=> new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0,4);

  const recentProjects = projects.slice(0,4);

  const activity = [
    ...projects.map(p=>({type:'project', text:`${p.name} project created`, date:p.createdAt, by: p.owner?.name || p.owner})),
    ...tasks.map(t=>({type:'task', text:`${t.title} task created`, date:t.createdAt, by: t.createdBy?.name || t.createdBy}))
  ].sort((a,b)=> new Date(b.date||0)-new Date(a.date||0)).slice(0,6);

  return (
    <div className="dashboard-with-sidebar">
      <Sidebar />
      <main className="dashboard-content">
        <div className="dashboard-container">
          <header className="dash-top">
            <div>
              <h1>Dashboard</h1>
              <p className="muted">Welcome back, {user?.name || 'Admin'}. Here's your team overview.</p>
            </div>
            <div className="top-actions">
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={16} />
                New Team
              </button>
            </div>
          </header>

          {loading ? (
            <div className="loading">Loading dashboard...</div>
          ) : (
            <>
              <section className="header-cards">
                <div className="card">
                  <div className="card-title">Total Projects</div>
                  <div className="card-value">{stats.totalProjects}</div>
                </div>
                <div className="card">
                  <div className="card-title">Total Tasks</div>
                  <div className="card-value">{stats.totalTasks}</div>
                </div>
                <div className="card">
                  <div className="card-title">In Progress</div>
                  <div className="card-value">{stats.inProgress}</div>
                </div>
                <div className="card">
                  <div className="card-title">Overdue Tasks</div>
                  <div className="card-value">{stats.overdue}</div>
                </div>
              </section>

              <div className="dash-grid">
                <div className="col-left">
                  <section className="panel">
                    <h3>📊 Tasks Overview</h3>
                    <div className="overview-stats">
                      <div className="overview-chart">
                        <div className="donut-placeholder" />
                      </div>
                      <div>
                        <div style={{marginBottom:'12px'}}>
                          <div style={{fontSize:'13px',color:'#fff',marginBottom:'2px'}}>To Do</div>
                          <div style={{fontSize:'20px',fontWeight:'700',color:'#3b82f6'}}>{tasks.filter(t=>t.status==='To Do').length}</div>
                        </div>
                        <div style={{marginBottom:'12px'}}>
                          <div style={{fontSize:'13px',color:'#fff',marginBottom:'2px'}}>In Progress</div>
                          <div style={{fontSize:'20px',fontWeight:'700',color:'#f59e0b'}}>{tasks.filter(t=>t.status==='In Progress').length}</div>
                        </div>
                        <div style={{marginBottom:'12px'}}>
                          <div style={{fontSize:'13px',color:'#fff',marginBottom:'2px'}}>Review</div>
                          <div style={{fontSize:'20px',fontWeight:'700',color:'#8b5cf6'}}>{tasks.filter(t=>t.status==='Review').length}</div>
                        </div>
                        <div>
                          <div style={{fontSize:'13px',color:'#fff',marginBottom:'2px'}}>Completed</div>
                          <div style={{fontSize:'20px',fontWeight:'700',color:'#10b981'}}>{tasks.filter(t=>t.status==='Completed').length}</div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="panel">
                    <h3>🚀 Recent Projects</h3>
                    <div className="projects-list">
                      {recentProjects.length === 0 ? (
                        <p className="muted">No projects yet. Create your first project to get started.</p>
                      ) : (
                        recentProjects.map(p=> (
                          <div key={p._id} className="recent-project-item">
                            <strong>{p.name}</strong>
                            <div className="muted">{p.description || 'No description'}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>

                <div className="col-right">
                  <section className="panel">
                    <h3>📅 Upcoming Deadlines</h3>
                    {upcoming.length===0? (
                      <p className="muted">No upcoming deadlines</p>
                    ) : (
                      upcoming.map(t=> (
                        <div key={t._id} className="deadline-item">
                          <strong>{t.title}</strong>
                          <div className="muted">{t.description || 'No details'}</div>
                          <div className="muted">Due {new Date(t.dueDate).toLocaleDateString()}</div>
                        </div>
                      ))
                    )}
                  </section>

                  <section className="panel">
                    <h3>⚡ Team Activity</h3>
                    {activity.length===0? (
                      <p className="muted">No activity yet</p>
                    ) : (
                      activity.map((a,idx)=> (
                        <div key={idx} className="activity-item">
                          <strong>{a.by || 'System'}</strong>
                          <div className="muted">{a.text}</div>
                          <div className="muted small">{a.date? new Date(a.date).toLocaleString():''}</div>
                        </div>
                      ))
                    )}
                  </section>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create New Team</h2>
            <form onSubmit={handleCreateTeam}>
              <div className="form-group">
                <label>Team Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter team name"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter team description"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <MemberPicker
                  selectedMembers={formData.selectedMembers}
                  onSelectionChange={(members) => setFormData({...formData, selectedMembers: members})}
                  currentUserId={user?.id}
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
