import { Router } from 'express';
import { getTeamMembers, inviteTeamMember, inviteTeamMemberByProject, removeTeamMember } from '../controllers/teamController';

const router = Router();

router.get('/:teamId/members', getTeamMembers);
router.post('/:teamId/invite', inviteTeamMember);
router.post('/invite', inviteTeamMemberByProject);
router.delete('/:teamId/members/:userId', removeTeamMember);

export default router;
