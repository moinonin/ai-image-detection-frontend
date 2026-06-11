import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { organizationService } from '../services/api';
import {
  OrganizationDetail,
  OrganizationInvitationCreated,
  OrganizationRole,
  OrganizationSummary,
} from '../types';

const formatDate = (value?: string) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const roleLabel = (role: OrganizationRole) =>
  role.charAt(0).toUpperCase() + role.slice(1);

const OrganizationManagement: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [organization, setOrganization] = useState<OrganizationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [requiresTeam, setRequiresTeam] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [createdInvitation, setCreatedInvitation] =
    useState<OrganizationInvitationCreated | null>(null);

  const selectedSummary = useMemo(
    () => organizations.find((item) => item.id === selectedId),
    [organizations, selectedId]
  );
  const canManage = organization?.role === 'owner' || organization?.role === 'admin';
  const isOwner = organization?.role === 'owner';

  const loadOrganization = useCallback(async (accountId: string) => {
    setLoading(true);
    setError(null);
    setRequiresTeam(false);
    setCreatedInvitation(null);
    try {
      setOrganization(await organizationService.getOrganization(accountId));
    } catch (err: any) {
      setOrganization(null);
      setRequiresTeam(err.status === 403);
      setError(err.message || 'Could not load this organization.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadOrganizations = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await organizationService.listOrganizations();
        const items = response.organizations || [];
        setOrganizations(items);
        const teamAccount =
          items.find(
            (item) =>
              item.id === user?.account_id &&
              item.subscription_plan_type?.toLowerCase() === 'team'
          ) ||
          items.find(
            (item) =>
              item.subscription_plan_type?.toLowerCase() === 'team' &&
              item.subscription_status?.toLowerCase() === 'active'
          ) ||
          items.find((item) => item.subscription_plan_type?.toLowerCase() === 'team') ||
          items.find((item) => item.id === user?.account_id) ||
          items[0];
        if (teamAccount) {
          setSelectedId(teamAccount.id);
          await loadOrganization(teamAccount.id);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Could not load your organizations.');
        setLoading(false);
      }
    };

    loadOrganizations();
  }, [loadOrganization, user?.account_id]);

  const refresh = async () => {
    if (selectedId) await loadOrganization(selectedId);
  };

  const handleOrganizationChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const accountId = event.target.value;
    setSelectedId(accountId);
    await loadOrganization(accountId);
  };

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organization || !inviteEmail.trim()) return;
    setWorking('invite');
    setError(null);
    try {
      const invitation = await organizationService.createOrganizationInvitation(
        organization.id,
        inviteEmail.trim(),
        inviteRole
      );
      setCreatedInvitation(invitation);
      setInviteEmail('');
      toast.push('Invitation created.', 'success');
      const updated = await organizationService.getOrganization(organization.id);
      setOrganization(updated);
    } catch (err: any) {
      setError(err.message || 'Could not create the invitation.');
    } finally {
      setWorking('');
    }
  };

  const handleCopyInvite = async () => {
    if (!createdInvitation?.accept_url) return;
    try {
      await navigator.clipboard.writeText(createdInvitation.accept_url);
      toast.push('Invitation link copied.', 'success');
    } catch {
      toast.push('Could not copy the invitation link.', 'error');
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!organization) return;
    setWorking(invitationId);
    setError(null);
    try {
      await organizationService.revokeOrganizationInvitation(
        organization.id,
        invitationId
      );
      toast.push('Invitation revoked.', 'success');
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Could not revoke the invitation.');
    } finally {
      setWorking('');
    }
  };

  const handleRoleChange = async (
    userId: string,
    role: Exclude<OrganizationRole, 'owner'>
  ) => {
    if (!organization) return;
    setWorking(userId);
    setError(null);
    try {
      await organizationService.updateOrganizationMemberRole(
        organization.id,
        userId,
        role
      );
      toast.push('Member role updated.', 'success');
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Could not update the member role.');
    } finally {
      setWorking('');
    }
  };

  const handleRemoveMember = async (userId: string, email: string) => {
    if (!organization) return;
    if (!window.confirm(`Remove ${email} from this organization?`)) return;
    setWorking(userId);
    setError(null);
    try {
      await organizationService.removeOrganizationMember(organization.id, userId);
      toast.push('Member removed.', 'success');
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Could not remove the member.');
    } finally {
      setWorking('');
    }
  };

  return (
    <div className="organization-page">
      <section className="page-header">
        <p className="eyebrow">Team workspace</p>
        <h1>Organization</h1>
        <p>Manage people who can issue, verify, and administer trusted records.</p>
      </section>

      {organizations.length > 1 && (
        <div className="organization-switcher">
          <label htmlFor="organization-account">Organization</label>
          <select
            id="organization-account"
            value={selectedId}
            onChange={handleOrganizationChange}
            disabled={loading}
          >
            {organizations.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name || item.email || item.id}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <section className={`organization-notice ${requiresTeam ? 'warning' : 'error'}`}>
          <h2>{requiresTeam ? 'Team workspace unavailable' : 'Organization error'}</h2>
          <p>{error}</p>
          {requiresTeam && (
            <Link className="primary-action" to="/pricing">
              View Team plan
            </Link>
          )}
        </section>
      )}

      {loading && (
        <section className="organization-notice">
          <h2>Loading organization</h2>
          <p>Retrieving members and seat availability.</p>
        </section>
      )}

      {!loading && organizations.length === 0 && !error && (
        <section className="organization-notice warning">
          <h2>No organization found</h2>
          <p>Your account is not attached to an organization workspace.</p>
        </section>
      )}

      {!loading && organization && (
        <>
          <div className="organization-heading">
            <div>
              <p className="eyebrow">{roleLabel(organization.role)} access</p>
              <h2>{organization.name || selectedSummary?.email || 'Team organization'}</h2>
              <p>
                {organization.subscription_status === 'active'
                  ? 'Team subscription active'
                  : 'Subscription inactive'}
              </p>
            </div>
            <button className="secondary-action" type="button" onClick={refresh}>
              Refresh
            </button>
          </div>

          <section className="organization-seat-grid" aria-label="Seat availability">
            <article>
              <strong>{organization.seat_limit}</strong>
              <span>Total seats</span>
            </article>
            <article>
              <strong>{organization.member_count}</strong>
              <span>Members</span>
            </article>
            <article>
              <strong>{organization.pending_invitation_count}</strong>
              <span>Pending</span>
            </article>
            <article>
              <strong>{organization.available_seats}</strong>
              <span>Available</span>
            </article>
          </section>

          {canManage && (
            <section className="organization-section">
              <div className="organization-section-heading">
                <div>
                  <p className="eyebrow">Invite people</p>
                  <h2>Add a team member</h2>
                </div>
                <span>{organization.available_seats} seats available</span>
              </div>

              <form className="organization-invite-form" onSubmit={handleInvite}>
                <div className="form-group">
                  <label htmlFor="invite-email">Email address</label>
                  <input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="colleague@institution.org"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="invite-role">Role</label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(event) =>
                      setInviteRole(event.target.value as 'admin' | 'member')
                    }
                    disabled={!isOwner}
                  >
                    <option value="member">Member</option>
                    {isOwner && <option value="admin">Administrator</option>}
                  </select>
                </div>
                <button
                  className="primary-action"
                  type="submit"
                  disabled={working === 'invite' || organization.available_seats === 0}
                >
                  {working === 'invite' ? 'Creating invitation' : 'Invite member'}
                </button>
              </form>

              {createdInvitation && (
                <div className="invitation-created" role="status">
                  <div>
                    <strong>Invitation ready</strong>
                    <p>
                      {createdInvitation.delivery === 'sent'
                        ? `Sent to ${createdInvitation.email}.`
                        : 'Share this link securely with the invited person.'}
                    </p>
                  </div>
                  <code>{createdInvitation.accept_url}</code>
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={handleCopyInvite}
                  >
                    Copy invitation link
                  </button>
                </div>
              )}
            </section>
          )}

          <section className="organization-section">
            <div className="organization-section-heading">
              <div>
                <p className="eyebrow">Access</p>
                <h2>Members</h2>
              </div>
              <span>{organization.member_count} seats occupied</span>
            </div>

            <div className="organization-table-wrap">
              <table className="organization-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Status</th>
                    {canManage && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {organization.members.map((member) => (
                    <tr key={member.user_id}>
                      <td>
                        <strong>{member.full_name || member.username}</strong>
                        <span>{member.email}</span>
                      </td>
                      <td>
                        {isOwner && member.role !== 'owner' ? (
                          <select
                            value={member.role}
                            aria-label={`Role for ${member.email}`}
                            onChange={(event) =>
                              handleRoleChange(
                                member.user_id,
                                event.target.value as 'admin' | 'member'
                              )
                            }
                            disabled={working === member.user_id}
                          >
                            <option value="member">Member</option>
                            <option value="admin">Administrator</option>
                          </select>
                        ) : (
                          <span className={`organization-role ${member.role}`}>
                            {roleLabel(member.role)}
                          </span>
                        )}
                      </td>
                      <td>{member.is_active ? 'Active' : 'Inactive'}</td>
                      {canManage && (
                        <td>
                          {member.role !== 'owner' &&
                            (isOwner || member.role === 'member') && (
                              <button
                                className="text-danger-action"
                                type="button"
                                onClick={() =>
                                  handleRemoveMember(member.user_id, member.email)
                                }
                                disabled={working === member.user_id}
                              >
                                Remove
                              </button>
                            )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {canManage && (
            <section className="organization-section">
              <div className="organization-section-heading">
                <div>
                  <p className="eyebrow">Awaiting response</p>
                  <h2>Pending invitations</h2>
                </div>
                <span>{organization.pending_invitation_count} seats reserved</span>
              </div>

              {!organization.pending_invitations?.length ? (
                <p className="organization-empty">No invitations are pending.</p>
              ) : (
                <div className="organization-table-wrap">
                  <table className="organization-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Expires</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {organization.pending_invitations.map((invitation) => (
                        <tr key={invitation.id}>
                          <td>{invitation.email}</td>
                          <td>{roleLabel(invitation.role)}</td>
                          <td>{formatDate(invitation.expires_at)}</td>
                          <td>
                            <button
                              className="text-danger-action"
                              type="button"
                              onClick={() => handleRevokeInvitation(invitation.id)}
                              disabled={working === invitation.id}
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default OrganizationManagement;
