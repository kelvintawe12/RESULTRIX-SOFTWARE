import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Alert } from '../../components/ui/Alert';
import { Tabs } from '../../components/ui/Tabs';
import { Database, Table as TableIcon, RefreshCw, AlertCircle, CheckCircle, XCircle, Search, Eye, BarChart3, FileText, Download, Columns, Key, Link, Code } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Dialog } from '../../components/ui/Dialog';
interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: string;
}
interface TableInfo {
  name: string;
  rowCount: number;
  nullCount: number;
  emptyCount: number;
  lastUpdated: string | null;
  status: 'healthy' | 'warning' | 'error';
  columns: ColumnInfo[];
  estimatedSize: number;
  indexes: string[];
  relationships: string[];
}
export function DatabaseInspectorPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalTables: 0,
    totalRows: 0,
    totalColumns: 0,
    healthyTables: 0,
    warningTables: 0
  });
  const tableNames = ['schools', 'users', 'students', 'guardians', 'classes', 'subjects', 'enrollments', 'teacher_assignments', 'payments', 'fee_structures', 'invoices', 'subscriptions', 'subscription_plans', 'announcements', 'email_queue', 'audit_logs', 'system_maintenance', 'platform_status'];
  useEffect(() => {
    fetchDatabaseInfo();
  }, []);
  const fetchDatabaseInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const tableInfoPromises = tableNames.map(async tableName => {
        try {
          // Get row count
          const {
            count: rowCount,
            error: countError
          } = await supabase.from(tableName).select('*', {
            count: 'exact',
            head: true
          });
          if (countError) throw countError;
          // Get sample data to analyze columns
          const {
            data: sampleData,
            error: sampleError
          } = await supabase.from(tableName).select('*').limit(100);
          if (sampleError) throw sampleError;
          // Analyze columns
          const columns: ColumnInfo[] = [];
          let nullCount = 0;
          let emptyCount = 0;
          if (sampleData && sampleData.length > 0) {
            const firstRow = sampleData[0];
            Object.keys(firstRow).forEach(columnName => {
              const columnValues = sampleData.map(row => row[columnName]);
              const nulls = columnValues.filter(v => v === null).length;
              const empties = columnValues.filter(v => v === '' || v === undefined).length;
              nullCount += nulls;
              emptyCount += empties;
              // Determine column type
              const sampleValue = columnValues.find(v => v !== null && v !== undefined);
              let type = 'unknown';
              if (sampleValue !== undefined) {
                if (typeof sampleValue === 'string') {
                  if (sampleValue.match(/^\d{4}-\d{2}-\d{2}/)) type = 'timestamp';else if (sampleValue.length === 36 && sampleValue.includes('-')) type = 'uuid';else type = 'text';
                } else if (typeof sampleValue === 'number') {
                  type = Number.isInteger(sampleValue) ? 'integer' : 'numeric';
                } else if (typeof sampleValue === 'boolean') {
                  type = 'boolean';
                } else if (Array.isArray(sampleValue)) {
                  type = 'array';
                } else if (typeof sampleValue === 'object') {
                  type = 'json';
                }
              }
              // Detect primary/foreign keys
              const isPrimaryKey = columnName === 'id';
              const isForeignKey = columnName.endsWith('_id') && columnName !== 'id';
              const references = isForeignKey ? columnName.replace('_id', 's') : undefined;
              columns.push({
                name: columnName,
                type,
                nullable: nulls > 0,
                default: null,
                isPrimaryKey,
                isForeignKey,
                references
              });
            });
          }
          // Determine status
          let status: 'healthy' | 'warning' | 'error' = 'healthy';
          const totalCells = (rowCount || 0) * columns.length;
          if (rowCount === 0) {
            status = 'warning';
          } else if (totalCells > 0 && nullCount > totalCells * 0.3) {
            status = 'error';
          } else if (totalCells > 0 && nullCount > totalCells * 0.1) {
            status = 'warning';
          }
          // Get last updated
          let lastUpdated = null;
          if (sampleData && sampleData.length > 0) {
            const dates = sampleData.map((row: any) => row.updated_at || row.created_at).filter(Boolean).sort();
            lastUpdated = dates[dates.length - 1] || null;
          }
          // Estimate size (rough calculation)
          const estimatedSize = (rowCount || 0) * columns.length * 50; // ~50 bytes per cell
          // Detect indexes (common patterns)
          const indexes = columns.filter(c => c.isPrimaryKey || c.isForeignKey || c.name.includes('_at')).map(c => `idx_${tableName}_${c.name}`);
          // Detect relationships
          const relationships = columns.filter(c => c.isForeignKey && c.references).map(c => `${tableName}.${c.name} → ${c.references}.id`);
          return {
            name: tableName,
            rowCount: rowCount || 0,
            nullCount,
            emptyCount,
            lastUpdated,
            status,
            columns,
            estimatedSize,
            indexes,
            relationships
          };
        } catch (err) {
          console.error(`Error fetching info for ${tableName}:`, err);
          return {
            name: tableName,
            rowCount: 0,
            nullCount: 0,
            emptyCount: 0,
            lastUpdated: null,
            status: 'error' as const,
            columns: [],
            estimatedSize: 0,
            indexes: [],
            relationships: []
          };
        }
      });
      const tableInfos = await Promise.all(tableInfoPromises);
      setTables(tableInfos);
      // Calculate stats
      const totalRows = tableInfos.reduce((sum, t) => sum + t.rowCount, 0);
      const totalColumns = tableInfos.reduce((sum, t) => sum + t.columns.length, 0);
      const healthyTables = tableInfos.filter(t => t.status === 'healthy').length;
      const warningTables = tableInfos.filter(t => t.status === 'warning').length;
      setStats({
        totalTables: tableInfos.length,
        totalRows,
        totalColumns,
        healthyTables,
        warningTables
      });
    } catch (err: any) {
      console.error('Error fetching database info:', err);
      setError('Failed to fetch database information');
    } finally {
      setLoading(false);
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Healthy
          </Badge>;
      case 'warning':
        return <Badge variant="warning" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Warning
          </Badge>;
      case 'error':
        return <Badge variant="danger" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Error
          </Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      uuid: 'text-purple-600 bg-purple-50',
      text: 'text-blue-600 bg-blue-50',
      integer: 'text-green-600 bg-green-50',
      numeric: 'text-green-600 bg-green-50',
      boolean: 'text-amber-600 bg-amber-50',
      timestamp: 'text-indigo-600 bg-indigo-50',
      array: 'text-pink-600 bg-pink-50',
      json: 'text-rose-600 bg-rose-50'
    };
    return colors[type] || 'text-slate-600 bg-slate-50';
  };
  const filteredTables = tables.filter(table => table.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const columns = [{
    header: 'Table Name',
    accessor: 'name' as const,
    render: (row: TableInfo) => <div className="flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-slate-400" />
          <span className="font-mono text-sm font-semibold text-slate-900">
            {row.name}
          </span>
        </div>
  }, {
    header: 'Rows',
    accessor: 'rowCount' as const,
    render: (row: TableInfo) => <span className="font-semibold text-slate-900">
          {row.rowCount.toLocaleString()}
        </span>
  }, {
    header: 'Columns',
    accessor: 'columns' as const,
    render: (row: TableInfo) => <span className="text-slate-600">{row.columns.length}</span>
  }, {
    header: 'Size',
    accessor: 'estimatedSize' as const,
    render: (row: TableInfo) => <span className="text-sm text-slate-600">
          {(row.estimatedSize / 1024).toFixed(2)} KB
        </span>
  }, {
    header: 'Data Quality',
    accessor: 'nullCount' as const,
    render: (row: TableInfo) => <div className="flex items-center gap-2">
          {getStatusBadge(row.status)}
          {row.nullCount > 0 && <span className="text-xs text-amber-600">
              {row.nullCount} nulls
            </span>}
        </div>
  }, {
    header: 'Actions',
    accessor: 'name' as const,
    render: (row: TableInfo) => <Button size="sm" variant="secondary" onClick={() => {
      setSelectedTable(row);
      setActiveTab('overview');
    }} leftIcon={<Eye className="w-4 h-4" />}>
          Inspect
        </Button>
  }];
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Database Inspector
          </h1>
          <p className="text-slate-500 mt-1">
            Comprehensive database schema and data quality analysis
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={fetchDatabaseInfo} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button variant="primary" leftIcon={<Download className="w-4 h-4" />}>
            Export Schema
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Tables</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {stats.totalTables}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Rows</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {stats.totalRows.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Columns</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {stats.totalColumns}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Columns className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Healthy</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.healthyTables}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Warnings</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">
                {stats.warningTables}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search tables..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
      </div>

      {/* Tables List */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {filteredTables.length > 0 ? <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-900">
                  {filteredTables.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900">
                  {tables.length}
                </span>{' '}
                tables
              </p>
            </div>
            <Table data={filteredTables} columns={columns} />
          </div> : <div className="text-center py-16 px-6">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Tables Found
            </h3>
            <p className="text-slate-500">Try adjusting your search query.</p>
          </div>}
      </div>

      {/* Table Details Modal */}
      <Dialog isOpen={!!selectedTable} onClose={() => setSelectedTable(null)} title={`Table: ${selectedTable?.name || ''}`} size="xl">
        {selectedTable && <div className="space-y-6">
            {/* Tabs */}
            <Tabs tabs={[{
          id: 'overview',
          label: 'Overview'
        }, {
          id: 'columns',
          label: 'Columns'
        }, {
          id: 'relationships',
          label: 'Relationships'
        }, {
          id: 'indexes',
          label: 'Indexes'
        }]} activeTab={activeTab} onChange={setActiveTab} />

            {/* Overview Tab */}
            {activeTab === 'overview' && <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500 mb-1">Total Rows</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {selectedTable.rowCount.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500 mb-1">Columns</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {selectedTable.columns.length}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500 mb-1">Est. Size</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {(selectedTable.estimatedSize / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-sm text-amber-700 mb-1">Null Values</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {selectedTable.nullCount}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-sm text-amber-700 mb-1">Empty Values</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {selectedTable.emptyCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">
                    Status
                  </span>
                  {getStatusBadge(selectedTable.status)}
                </div>
              </div>}

            {/* Columns Tab */}
            {activeTab === 'columns' && <div className="space-y-3">
                {selectedTable.columns.map(column => <div key={column.name} className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-semibold text-slate-900">
                          {column.name}
                        </code>
                        {column.isPrimaryKey && <Badge variant="primary" className="text-xs">
                            <Key className="w-3 h-3 mr-1" />
                            PK
                          </Badge>}
                        {column.isForeignKey && <Badge variant="default" className="text-xs">
                            <Link className="w-3 h-3 mr-1" />
                            FK
                          </Badge>}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${getTypeColor(column.type)}`}>
                        {column.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Nullable: {column.nullable ? 'Yes' : 'No'}</span>
                      {column.references && <span className="flex items-center gap-1">
                          <Link className="w-3 h-3" />
                          References: {column.references}
                        </span>}
                    </div>
                  </div>)}
              </div>}

            {/* Relationships Tab */}
            {activeTab === 'relationships' && <div className="space-y-3">
                {selectedTable.relationships.length > 0 ? selectedTable.relationships.map((rel, index) => <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <code className="text-sm text-blue-900">{rel}</code>
                    </div>) : <p className="text-center text-slate-500 py-8">
                    No foreign key relationships detected
                  </p>}
              </div>}

            {/* Indexes Tab */}
            {activeTab === 'indexes' && <div className="space-y-3">
                {selectedTable.indexes.length > 0 ? selectedTable.indexes.map((index, i) => <div key={i} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <code className="text-sm text-purple-900">{index}</code>
                    </div>) : <p className="text-center text-slate-500 py-8">
                    No indexes detected
                  </p>}
              </div>}

            {/* Actions */}
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setSelectedTable(null)}>
                Close
              </Button>
            </div>
          </div>}
      </Dialog>
    </div>;
}