import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { Check, X } from 'lucide-react';
import '../styles/memberPicker.css';

export default function MemberPicker({ selectedMembers = [], onSelectionChange = () => {}, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (userId) => {
    const isSelected = selectedMembers.some(m => m.userId === userId || m === userId);
    let updatedMembers;
    
    if (isSelected) {
      updatedMembers = selectedMembers.filter(m => (m.userId || m) !== userId);
    } else {
      updatedMembers = [...selectedMembers, { userId, role: 'Member' }];
    }
    
    onSelectionChange(updatedMembers);
  };

  const isMemberSelected = (userId) => {
    return selectedMembers.some(m => (m.userId || m) === userId);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getAvatarColor = (index) => {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    return colors[index % colors.length];
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="member-picker">
      <div className="picker-header">
        <h3>Add Team Members</h3>
        <p className="muted">Select members to add to your team</p>
      </div>

      <div className="picker-search">
        <input
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="picker-loading">Loading members...</div>
      ) : (
        <div className="members-list">
          {filteredUsers.length === 0 ? (
            <div className="no-members">No members found</div>
          ) : (
            filteredUsers.map((user, index) => (
              <div
                key={user._id}
                className={`member-item ${isMemberSelected(user._id) ? 'selected' : ''}`}
                onClick={() => toggleMember(user._id)}
              >
                <div className="member-info">
                  <div
                    className="member-avatar"
                    style={{ backgroundColor: getAvatarColor(index) }}
                  >
                    {getInitials(user.name)}
                  </div>
                  <div className="member-details">
                    <div className="member-name">{user.name}</div>
                    <div className="member-email">{user.email}</div>
                  </div>
                </div>
                <div className="member-role">
                  <span className={`role-badge ${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </div>
                {isMemberSelected(user._id) && (
                  <div className="selected-checkmark">
                    <Check size={20} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {selectedMembers.length > 0 && (
        <div className="selected-summary">
          <strong>{selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected</strong>
        </div>
      )}
    </div>
  );
}
