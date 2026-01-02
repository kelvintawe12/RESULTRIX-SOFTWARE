import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { School, Mail, Phone, MapPin, Calendar, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
export function SchoolDetailsPage() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  // Mock data - would fetch based on ID
  const school = {
    id,
    name: 'Springfield Academy',
    admin: 'John Principal',
    email: 'admin@springfield.edu',
    phone: '+1 (555) 123-4567',
    address: '742 Evergreen Terrace, Springfield',
    status: 'Active',
    joinedDate: '2023-08-15',
    students: 450,
    teachers: 32,
    plan: 'Enterprise',
    logo: null
  };
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <School className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              {school.name}
              <Badge variant="success">{school.status}</Badge>
            </h1>
            <p className="text-slate-500 flex items-center gap-2 mt-1">
              <MapPin className="w-4 h-4" /> {school.address}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">
            <Edit className="w-4 h-4 mr-2" /> Edit
          </Button>
          <Button variant="danger">
            <Trash2 className="w-4 h-4 mr-2" /> Suspend
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="School Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Administrator
                </label>
                <p className="text-sm font-medium text-slate-900 mt-1">
                  {school.admin}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Contact Email
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <a href={`mailto:${school.email}`} className="text-sm font-medium text-blue-600 hover:underline">
                    {school.email}
                  </a>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Phone
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <p className="text-sm font-medium text-slate-900">
                    {school.phone}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Joined Date
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <p className="text-sm font-medium text-slate-900">
                    {school.joinedDate}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Tabs tabs={[{
          id: 'activity',
          label: 'Activity Log',
          content: <div className="p-4 text-center text-slate-500">
                    Activity log content placeholder
                  </div>
        }, {
          id: 'users',
          label: 'Users',
          content: <div className="p-4 text-center text-slate-500">
                    Users list placeholder
                  </div>
        }, {
          id: 'billing',
          label: 'Billing',
          content: <div className="p-4 text-center text-slate-500">
                    Billing history placeholder
                  </div>
        }]} />
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <Card title="Overview Stats">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Total Students</span>
                <span className="text-lg font-bold text-slate-900">
                  {school.students}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Total Teachers</span>
                <span className="text-lg font-bold text-slate-900">
                  {school.teachers}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Current Plan</span>
                <Badge variant="info">{school.plan}</Badge>
              </div>
            </div>
          </Card>

          <Card title="System Health">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Database Usage</span>
                <span className="text-sm font-medium text-slate-900">45%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{
                width: '45%'
              }}></div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-slate-600">Storage Usage</span>
                <span className="text-sm font-medium text-slate-900">28%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{
                width: '28%'
              }}></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>;
}