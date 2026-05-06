import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { teamService, projectService, taskService } from '../services/api';
import { Plus, CheckCircle2, Clock, AlertCircle, ListTodo } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import '../styles/tasks.css';

export default function Tasks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [allTasks, setAllTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: ''
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
      let allProjects = [];
      
      for (const team of teamsRes.data.teams) {
        try {
          const projectRes = await projectService.getAll(team._id);
          allProjects = [...allProjects, ...projectRes.data.projects];
        } catch (err) {
          console.error(`Failed to fetch projects for team`);
        }
      }
      allProjects.sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
      setProjects(allProjects);

      let tasks = [];
      for (const project of allProjects) {
        try {
          const taskRes = await taskService.getAll(project._id);
          tasks = [...tasks, ...taskRes.data.tasks];
        } catch (err) {
          console.error(`Failed to fetch tasks for project`);
        }
      }
      tasks.sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
      setAllTasks(tasks);
      if (allProjects.length > 0) {
        setSelectedProject(allProjects[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedProject) {
      alert('Please select a project');
      return;
    }

    try {
      await taskService.create(selectedProject, formData);
      setFormData({ title: '', description: '', priority: 'Medium', dueDate: '' });
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Error creating task');
    }
  };

  const getFilteredTasks = () => {
    if (filter === 'all') return allTasks;
    return allTasks.filter(t => t.status === filter);
  };

  const getTaskStats = () => {
    return {
      total: allTasks.length,
      completed: allTasks.filter(t => t.status === 'Completed').length,
      inProgress: allTasks.filter(t => t.status === 'In Progress').length,
      todo: allTasks.filter(t => t.status === 'To Do').length,
      overdue: allTasks.filter(t => t.isOverdue && t.status !== 'Completed').length
    };
  };

  if (loading) return <div className="loading">Loading tasks...</div>;

  const stats = getTaskStats();
  const filteredTasks = getFilteredTasks();

  return (
    <div className="dashboard-with-sidebar">
      <Sidebar />
      <main className="dashboard-content">
        <div className="page-container">
          <div className="page-header-section">
            <div className="header-info">
              <ListTodo size={32} className="header-icon" />
              <div>
                <h1>Tasks</h1>
                <p>Track and manage all your tasks</p>
              </div>
            </div>
            {user?.role === 'Admin' && (
              <button 
                className="btn-primary-lg"
                onClick={() => setShowModal(true)}
              >
                <Plus size={20} />
                New Task
              </button>
            )}
          </div>

          <div className="stats-section">
            <div className="stat-box">
              <ListTodo size={20} />
              <div>
                <span className="stat-label">Total</span>
                <span className="stat-value">{stats.total}</span>
              </div>
            </div>
            <div className="stat-box success">
              <CheckCircle2 size={20} />
              <div>
                <span className="stat-label">Completed</span>
                <span className="stat-value">{stats.completed}</span>
              </div>
            </div>
            <div className="stat-box warning">
              <Clock size={20} />
              <div>
                <span className="stat-label">In Progress</span>
                <span className="stat-value">{stats.inProgress}</span>
              </div>
            </div>
            <div className="stat-box danger">
              <AlertCircle size={20} />
              <div>
                <span className="stat-label">Overdue</span>
                <span className="stat-value">{stats.overdue}</span>
              </div>
            </div>
          </div>

          <div className="filter-section">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({allTasks.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'To Do' ? 'active' : ''}`}
              onClick={() => setFilter('To Do')}
            >
              To Do ({stats.todo})
            </button>
            <button 
              className={`filter-btn ${filter === 'In Progress' ? 'active' : ''}`}
              onClick={() => setFilter('In Progress')}
            >
              In Progress ({stats.inProgress})
            </button>
            <button 
              className={`filter-btn ${filter === 'Completed' ? 'active' : ''}`}
              onClick={() => setFilter('Completed')}
            >
              Completed ({stats.completed})
            </button>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="empty-state-large">
              <ListTodo size={64} />
              <h3>No Tasks</h3>
              <p>No tasks found for the selected filter</p>
            </div>
          ) : (
            <div className="tasks-grid">
              {filteredTasks.map(task => (
                <div key={task._id} className="task-card">
                  <div className="task-header-card">
                    <h3>{task.title}</h3>
                    <span className={`status-badge ${task.status.toLowerCase().replace(' ', '-')}`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="task-description">{task.description}</p>
                  <div className="task-meta">
                    <span className="priority-label" style={{
                      backgroundColor: task.priority === 'High' ? '#ef4444' : 
                                     task.priority === 'Medium' ? '#f59e0b' : '#10b981'
                    }}>
                      {task.priority}
                    </span>
                    {task.dueDate && <span className="due-date">{new Date(task.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showModal && user?.role === 'Admin' && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Project *</label>
                <select
                  required
                  value={selectedProject || ''}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="form-select"
                >
                  <option value="">Select a project</option>
                  {projects.map(proj => (
                    <option key={proj._id} value={proj._id}>{proj.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter task title"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter task description"
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
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
