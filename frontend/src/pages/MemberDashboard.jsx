import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { teamService, projectService, taskService } from '../services/api';
import { CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import '../styles/dashboard.css';

export default function MemberDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const allTeams = teamsRes.data.teams;
      setTeams(allTeams);

      // Fetch all projects from all teams
      let allProjects = [];
      for (const team of allTeams) {
        try {
          const projRes = await projectService.getAll(team._id);
          allProjects = [...allProjects, ...projRes.data.projects];
        } catch (err) {
          console.error(`Failed to fetch projects for team ${team._id}`);
        }
      }
      allProjects.sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
      setProjects(allProjects);

      // Fetch all tasks (simplified - would need backend support for better filtering)
      if (allProjects.length > 0) {
        let allTasks = [];
        for (const proj of allProjects) {
          try {
            const taskRes = await taskService.getAll(proj._id);
            allTasks = [...allTasks, ...taskRes.data.tasks];
          } catch (err) {
            console.error(`Failed to fetch tasks for project ${proj._id}`);
          }
        }
        allTasks.sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
        setTasks(allTasks);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getTaskStats = () => {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      overdue: tasks.filter(t => t.isOverdue && t.status !== 'Completed').length
    };
  };

  const stats = getTaskStats();
  const headerStats = {
    totalProjects: projects.length,
    totalTasks: tasks.length,
    inProgress: stats.inProgress,
    overdue: stats.overdue
  };

  const upcoming = tasks.filter(t=>t.dueDate).sort((a,b)=> new Date(a.dueDate)-new Date(b.dueDate)).slice(0,4);
  const recentProjects = projects.slice(0,4);
  const activity = [
    ...recentProjects.map(p=>({type:'project', text:`${p.name} project`, date:p.createdAt, by: p.owner?.name || p.owner})),
    ...tasks.slice(0,6).map(t=>({type:'task', text:`${t.title} task`, date:t.createdAt, by: t.createdBy?.name || t.createdBy}))
  ].sort((a,b)=> new Date(b.date||0)-new Date(a.date||0)).slice(0,6);

  return (
    <div className="dashboard-with-sidebar">
      <Sidebar />
      <main className="dashboard-content">
        <div className="dashboard-container">
          <header className="dash-top">
            <div>
              <h1>Dashboard</h1>
              <p className="muted">Welcome back, {user?.name || 'Member'}. Here's your workspace overview.</p>
            </div>
            <div className="top-actions">
              {user?.role==='Admin' && <button className="btn-primary">+ New Project</button>}
            </div>
          </header>

          <section className="header-cards">
            <div className="card"><div className="card-title">Total Projects</div><div className="card-value">{headerStats.totalProjects}</div></div>
            <div className="card"><div className="card-title">Total Tasks</div><div className="card-value">{headerStats.totalTasks}</div></div>
            <div className="card"><div className="card-title">In Progress</div><div className="card-value">{headerStats.inProgress}</div></div>
            <div className="card"><div className="card-title">Overdue Tasks</div><div className="card-value">{headerStats.overdue}</div></div>
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
                      <div style={{fontSize:'13px',color:'#fff',marginBottom:'2px'}}>Completed</div>
                      <div style={{fontSize:'20px',fontWeight:'700',color:'#10b981'}}>{tasks.filter(t=>t.status==='Completed').length}</div>
                    </div>
                    <div>
                      <div style={{fontSize:'13px',color:'#fff',marginBottom:'2px'}}>Overdue</div>
                      <div style={{fontSize:'20px',fontWeight:'700',color:'#ef4444'}}>{tasks.filter(t=>t.isOverdue && t.status!=='Completed').length}</div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="panel">
                <h3>🚀 Recent Projects</h3>
                <div className="projects-list">
                  {recentProjects.length === 0 ? (
                    <p className="muted">No projects available yet.</p>
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
                  activity.map((a,idx)=>(<div key={idx} className="activity-item"><strong>{a.by||'System'}</strong><div className="muted">{a.text}</div><div className="muted small">{a.date? new Date(a.date).toLocaleString():''}</div></div>))
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
