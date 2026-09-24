-- The analyst role is retired: it had nothing useful to show.
-- Pending analyst invitations are revoked. Existing analysts lose access
-- (they are not silently given a more powerful role); owners are told so
-- they can re-invite them with another role if needed.
UPDATE organisation_invitations SET revoked_at=now() WHERE role='analyst' AND accepted_at IS NULL AND revoked_at IS NULL;
INSERT INTO email_outbox(recipient,subject,body)
SELECT u.email,'A team member’s access has changed',
 'The Analyst role has been retired from Omnyvox. '||m_user.name||' ('||m_user.email||') no longer has access to '||o.name||'. If they still need access, invite them again from Organisation & team with the Administrator, Editor or Store manager role.'
FROM organisation_members m
JOIN organisations o ON o.id=m.organisation_id
JOIN users u ON u.id=o.owner_id
JOIN users m_user ON m_user.id=m.user_id
WHERE m.role='analyst';
DELETE FROM organisation_members WHERE role='analyst';
ALTER TABLE organisation_members DROP CONSTRAINT IF EXISTS organisation_members_role_check;
ALTER TABLE organisation_members ADD CONSTRAINT organisation_members_role_check CHECK(role IN ('owner','administrator','editor','store_manager'));
ALTER TABLE organisation_invitations DROP CONSTRAINT IF EXISTS organisation_invitations_role_check;
ALTER TABLE organisation_invitations ADD CONSTRAINT organisation_invitations_role_check CHECK(role IN ('administrator','editor','store_manager') OR revoked_at IS NOT NULL OR accepted_at IS NOT NULL);
