import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService, taskService } from '../services/api';
import { Plus, ArrowLeft, CheckCircle, Clock, AlertCircle, Lock } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { formatDistanceToNow } from 'date-fns';
import '../styles/project.css';

export default function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: ''
  });

  const fetchProjectAndTasks = useCallback(async () => {
    try {
      const projectRes = await projectService.getById(projectId);
      setProject(projectRes.data.project);

      const tasksRes = await taskService.getAll(projectId);
      setTasks(tasksRes.data.tasks);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectAndTasks();
  }, [fetchProjectAndTasks]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await taskService.create(projectId, taskForm);
      setTaskForm({ title: '', description: '', priority: 'Medium', dueDate: '' });
      setShowTaskModal(false);
      fetchProjectAndTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const getFilteredTasks = () => {
    if (filter === 'all') return tasks;
    return tasks.filter(t => t.status === filter);
  };

  const getTaskStats = () => {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      overdue: tasks.filter(t => t.isOverdue && t.status !== 'Completed').length
    };
  };

  if (loading) return <div className="loading">Loading project...</div>;

  const stats = getTaskStats();
  const filteredTasks = getFilteredTasks();

  return (
    <div className="dashboard-with-sidebar">
      <Sidebar />
      <div className="project-page">
        <header className="page-header-bar">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
        <div className="header-title">
          <h1>{project?.name}</h1>
          <p className="header-subtitle">{project?.description}</p>
        </div>
        {user?.role === 'Admin' ? (
          <button className="btn-primary" onClick={() => setShowTaskModal(true)}>
            <Plus size={20} />
            New Task
          </button>
        ) : (
          <div className="btn-disabled" title="Only admins can create tasks">
            <Lock size={20} />
            Admin Only
          </div>
        )}
      </header>

      <main className="project-content">
        <div className="stats-bar">
          <div className="stat-card">
            <span className="stat-label">Total Tasks</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-card success">
            <CheckCircle size={20} />
            <span className="stat-label">Completed</span>
            <span className="stat-value">{stats.completed}</span>
          </div>
          <div className="stat-card warning">
            <Clock size={20} />
            <span className="stat-label">In Progress</span>
            <span className="stat-value">{stats.inProgress}</span>
          </div>
          <div className="stat-card danger">
            <AlertCircle size={20} />
            <span className="stat-label">Overdue</span>
            <span className="stat-value">{stats.overdue}</span>
          </div>
        </div>

        <div className="filter-bar">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Tasks
          </button>
          <button 
            className={`filter-btn ${filter === 'To Do' ? 'active' : ''}`}
            onClick={() => setFilter('To Do')}
          >
            To Do
          </button>
          <button 
            className={`filter-btn ${filter === 'In Progress' ? 'active' : ''}`}
            onClick={() => setFilter('In Progress')}
          >
            In Progress
          </button>
          <button 
            className={`filter-btn ${filter === 'Completed' ? 'active' : ''}`}
            onClick={() => setFilter('Completed')}
          >
            Completed
          </button>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks found</p>
          </div>
        ) : (
          <div className="tasks-list">
            {filteredTasks.map(task => (
              <div key={task._id} className="task-item">
                <div className="task-header">
                  <h3>{task.title}</h3>
                  <span className={`status-badge ${task.status.toLowerCase().replace(' ', '-')}`}>
                    {task.status}
                  </span>
                </div>
                <p className="task-description">{task.description}</p>
                <div className="task-footer">
                  <span className="priority" style={{ background: getPriorityColor(task.priority) }}>
                    {task.priority}
                  </span>
                  {task.dueDate && (
                    <span className="due-date">
                      Due {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showTaskModal && user?.role === 'Admin' && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  placeholder="Enter task title"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  placeholder="Enter task description"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    required
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>
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