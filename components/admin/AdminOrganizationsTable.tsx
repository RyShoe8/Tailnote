'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { AdminAssignablePlan, AdminOrgRow } from '@/lib/admin/data';
import { AdminOrgPlanInlineEditor } from '@/components/admin/AdminOrgPlanInlineEditor';
import { AdminOrgUsersManager } from '@/components/admin/AdminOrgUsersManager';
import { Button } from '@/components/ui/button';

type Props = {
  organizations: AdminOrgRow[];
  assignablePlans: AdminAssignablePlan[];
};

export function AdminOrganizationsTable({ organizations: initialOrganizations, assignablePlans }: Props) {
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);

  function toggleExpanded(orgId: string) {
    setExpandedOrgId((current) => (current === orgId ? null : orgId));
  }

  function updateOrg(orgId: string, patch: Partial<AdminOrgRow>) {
    setOrganizations((prev) =>
      prev.map((org) => (org._id === orgId ? { ...org, ...patch } : org))
    );
  }

  function adjustUserCount(orgId: string, delta: number) {
    setOrganizations((prev) =>
      prev.map((org) =>
        org._id === orgId ? { ...org, userCount: Math.max(0, org.userCount + delta) } : org
      )
    );
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="overflow-x-auto rounded-md border min-w-0">
        <table className="w-full min-w-[48rem] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="p-3 w-10" aria-label="Expand" />
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Plan</th>
              <th className="p-3 font-medium">Subscription</th>
              <th className="p-3 font-medium">Users</th>
              <th className="p-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {organizations.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-muted-foreground text-center">
                  No organizations yet.
                </td>
              </tr>
            ) : (
              organizations.map((org) => {
                const expanded = expandedOrgId === org._id;
                return (
                  <Fragment key={org._id}>
                    <tr className="border-b last:border-0">
                      <td className="p-3 align-top">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-expanded={expanded}
                          aria-label={expanded ? 'Collapse users' : 'Expand users'}
                          onClick={() => toggleExpanded(org._id)}
                        >
                          {expanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                      <td className="p-3 font-medium align-top">{org.name}</td>
                      <td className="p-3 align-top">{org.planDisplayName}</td>
                      <td className="p-3 align-top">
                        <AdminOrgPlanInlineEditor
                          key={`${org._id}-${org.subscriptionPlanId}`}
                          organizationId={org._id}
                          subscriptionPlanId={org.subscriptionPlanId}
                          subscriptionStatus={org.subscriptionStatus}
                          assignablePlans={assignablePlans}
                          onSaved={({ subscriptionPlanId, planDisplayName }) => {
                            updateOrg(org._id, { subscriptionPlanId, planDisplayName });
                          }}
                        />
                      </td>
                      <td className="p-3 align-top">{org.userCount}</td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap align-top">
                        {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="border-b last:border-0 bg-muted/10">
                        <td colSpan={6} className="p-0">
                          <AdminOrgUsersManager
                            organizationId={org._id}
                            onUserCountChange={(delta) => adjustUserCount(org._id, delta)}
                          />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
