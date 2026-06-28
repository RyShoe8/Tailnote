import Link from 'next/link';

export default function SpotlightAdminPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Spotlight Administration</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card border rounded-lg p-6 space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Pending Submissions</p>
          <p className="text-3xl font-bold">12</p>
        </div>
        <div className="bg-card border rounded-lg p-6 space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Scheduled Spotlights</p>
          <p className="text-3xl font-bold">4</p>
        </div>
        <div className="bg-card border rounded-lg p-6 space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Active This Week</p>
          <p className="text-3xl font-bold">Acme Corp</p>
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-muted/50">
          <h2 className="font-semibold text-lg">Recent Submissions</h2>
          <input type="search" placeholder="Search..." className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors w-[300px]" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
              <tr>
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Industry</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date Applied</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Placeholder data */}
              <tr className="border-b hover:bg-muted/30">
                <td className="px-6 py-4 font-medium">Example Startup</td>
                <td className="px-6 py-4">Software</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending</span></td>
                <td className="px-6 py-4">Oct 24, 2023</td>
                <td className="px-6 py-4 text-right">
                  <Link href="/spotlight/submissions/123" className="text-primary hover:underline font-medium">Review</Link>
                </td>
              </tr>
              <tr className="border-b hover:bg-muted/30">
                <td className="px-6 py-4 font-medium">Widgets Inc</td>
                <td className="px-6 py-4">Hardware</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Scheduled</span></td>
                <td className="px-6 py-4">Oct 20, 2023</td>
                <td className="px-6 py-4 text-right">
                  <Link href="/spotlight/submissions/124" className="text-primary hover:underline font-medium">View</Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
