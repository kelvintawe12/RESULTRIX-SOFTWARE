import React from 'react';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Search, Filter, Download } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
export function AuditLogsPage() {
  const logs = [{
    id: 1,
    user: 'John Principal',
    school: 'Springfield Academy',
    action: 'Login',
    details: 'Successful login from IP 192.168.1.1',
    time: '2 mins ago',
    status: 'success'
  }, {
    id: 2,
    user: 'Sarah Admin',
    school: 'Riverside High',
    action: 'Update Settings',
    details: 'Changed grading scale',
    time: '15 mins ago',
    status: 'success'
  }, {
    id: 3,
    user: 'Mike Teacher',
    school: 'Oakwood Primary',
    action: 'Submit Marks',
    details: 'Submitted marks for Math 101',
    time: '1 hour ago',
    status: 'success'
  }, {
    id: 4,
    user: 'Unknown',
    school: '-',
    action: 'Failed Login',
    details: 'Invalid password attempt',
    time: '2 hours ago',
    status: 'warning'
  }, {
    id: 5,
    user: 'System',
    school: '-',
    action: 'Backup',
    details: 'Automated database backup',
    time: '4 hours ago',
    status: 'info'
  }];
  const columns = [{
    header: 'Timestamp',
    accessor: 'time' as const
  }, {
    header: 'User',
    accessor: 'user' as const
  }, {
    header: 'School',
    accessor: 'school' as const
  }, {
    header: 'Action',
    accessor: 'action' as const
  }, {
    header: 'Details',
    accessor: 'details' as const
  }, {
    header: 'Status',
    accessor: 'status' as const,
    render: (row: any) => <Badge variant={row.status === 'success' ? 'success' : row.status === 'warning' ? 'warning' : 'info'}>
          {row.status}
        </Badge>
  }];
  return <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-slate-500">
            Track system activity and security events
          </p>
        </div>
        <Button variant="secondary">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search logs..." className="pl-10" />
        </div>
        <Button variant="secondary">
          <Filter className="w-4 h-4 mr-2" /> Filter
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <Table data={logs} columns={columns} />
      </div>
    </div>;
}