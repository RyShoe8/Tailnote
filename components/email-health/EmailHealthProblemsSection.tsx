import { IssueCard } from '@/components/email-health/IssueCard';
import { getCategoryGuide } from '@/lib/email-health/categoryGuide';
import type { DomainIssue, EmailHealthCategory } from '@/lib/email-health/types';

function problemIssues(issues: DomainIssue[]) {
  return issues.filter((i) => i.severity === 'fail' || i.severity === 'warn');
}

function problemsByCategory(issues: DomainIssue[]) {
  const map = new Map<EmailHealthCategory, DomainIssue[]>();
  for (const issue of problemIssues(issues)) {
    const list = map.get(issue.category) ?? [];
    list.push(issue);
    map.set(issue.category, list);
  }
  return map;
}

export type EmailHealthProblemsSectionProps = {
  issues: DomainIssue[];
  showPricingLink?: boolean;
};

export function EmailHealthProblemsSection({
  issues,
  showPricingLink = true,
}: EmailHealthProblemsSectionProps) {
  const problems = problemIssues(issues);
  const groupedProblems = problemsByCategory(issues);

  if (problems.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight">Problems detected</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Follow the numbered steps on each card to move from warn or fail to pass.
      </p>
      <div className="mt-6 space-y-8">
        {Array.from(groupedProblems.entries()).map(([category, categoryIssues]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {getCategoryGuide(category).label}
            </h3>
            <div className="mt-3 space-y-4">
              {categoryIssues.map((issue, i) => (
                <IssueCard
                  key={`${issue.category}-${issue.title}-${i}`}
                  issue={issue}
                  showPricingLink={showPricingLink}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export { problemIssues, problemsByCategory };
