const Team = require('../models/Team');
const User = require('../models/User');

exports.createTeam = async (req, res) => {
  try {
    const { name, description, selectedMembers } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Team name is required'
      });
    }

    // Start with admin as a member
    let members = [{
      userId: req.user.id,
      role: 'Admin'
    }];

    // Add selected members if provided
    if (selectedMembers && Array.isArray(selectedMembers)) {
      for (const member of selectedMembers) {
        const userId = member.userId || member;
        // Don't add the admin again
        if (userId.toString() !== req.user.id) {
          members.push({
            userId,
            role: member.role || 'Member'
          });
        }
      }
    }

    const team = await Team.create({
      name,
      description,
      admin: req.user.id,
      members
    });

    // Add team to all members' teams array
    const memberIds = members.map(m => m.userId);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $push: { teams: team._id } }
    );

    res.status(201).json({
      success: true,
      team: await Team.findById(team._id).populate('admin members.userId').populate('projects')
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find({})
      .populate('admin members.userId')
      .populate('projects');

    res.status(200).json({
      success: true,
      teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('admin')
      .populate('members.userId')
      .populate('projects');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.status(200).json({
      success: true,
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.addTeamMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    if (team.admin.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only admin can add members'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMemberExists = team.members.some(m => m.userId.toString() === user._id.toString());

    if (isMemberExists) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member'
      });
    }

    team.members.push({
      userId: user._id,
      role: role || 'Member'
    });

    await team.save();
    await User.findByIdAndUpdate(user._id, {
      $push: { teams: team._id }
    });

    res.status(200).json({
      success: true,
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    if (team.admin.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update team'
      });
    }

    const { name, description } = req.body;

    if (name) team.name = name;
    if (description) team.description = description;

    await team.save();

    res.status(200).json({
      success: true,
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.toggleMemberRole = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const team = await Team.findById(teamId);

    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    if (team.admin.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only admin can toggle member roles' });
    }

    const member = team.members.id(memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found in team' });

    member.role = member.role === 'Admin' ? 'Member' : 'Admin';

    await team.save();

    res.status(200).json({ success: true, team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const team = await Team.findById(teamId);

    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    if (team.admin.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only admin can remove members' });
    }

    const member = team.members.id(memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found in team' });

    // Prevent removing the admin entry for the team owner
    if (member.userId.toString() === team.admin.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot remove team owner' });
    }

    member.remove();
    await team.save();

    // Also remove team reference from user
    await User.findByIdAndUpdate(member.userId, { $pull: { teams: team._id } });

    res.status(200).json({ success: true, team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
