const express = require('express');
const router = express.Router();
const { protect, validateTeamMember } = require('../middleware/auth');
const {
  createTeam,
  getTeams,
  getTeamById,
  addTeamMember,
  updateTeam
} = require('../controllers/teamController');

const { toggleMemberRole, removeMember } = require('../controllers/teamController');

router.post('/', protect, createTeam);
router.get('/', protect, getTeams);
router.get('/:teamId', protect, getTeamById);
router.put('/:teamId', protect, validateTeamMember, updateTeam);
router.post('/:teamId/members', protect, validateTeamMember, addTeamMember);
router.put('/:teamId/members/:memberId/role', protect, validateTeamMember, toggleMemberRole);
router.delete('/:teamId/members/:memberId', protect, validateTeamMember, removeMember);

module.exports = router;
