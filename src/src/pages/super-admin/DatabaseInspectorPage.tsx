import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Tabs } from '../../components/ui/Tabs';
import { Database, Table as TableIcon, RefreshCw, AlertCircle, CheckCircle, XCircle, Search, Eye, BarChart3, FileText, Download, Columns, Key, Link, Code, LayoutGrid, List as ListIcon, Filter, ArrowUpDown, HardDrive, Shield, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Dialog } from '../../components/ui/Dialog';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('overview');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [stats, setStats] = useState({
    totalTables: 0,
    totalRows: 0,
    totalColumns: 0,
    healthyTables: 0,
    warningTables: 0
  });

  const tableNames = ['schools', 'users', 'students', 'guardians', 'classes', 'subjects', 'enrollments', 'teacher_assignments', 'payments', 'fee_structures', 'invoices', 'subscriptions', 'subscription_plans', 'announcements', 'email_queue', 'audit_logs', 'system_maintenance', 'platform_status'];
  
  const healthChartData = useMemo(() => [
    { name: 'Healthy', value: stats.healthyTables, color: '#22c55e' },
    { name: 'Warning', value: stats.warningTables, color: '#f59e0b' },
    { name: 'Error', value: stats.totalTables - stats.healthyTables - stats.warningTables, color: '#ef4444' }
  ].filter(i => i.value > 0), [stats]);

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

  const handleExportSchema = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tables, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `database_schema_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredTables = useMemo(() => {
    let result = tables.filter(table => {
      const matchesSearch = table.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || table.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    if (sortConfig.key) {
      result.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [tables, searchQuery, statusFilter, sortConfig]);

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
          <Button variant="primary" onClick={handleExportSchema} leftIcon={<Download className="w-4 h-4" />}>
            Export Schema
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Health Chart */}
        <Card className="p-6 flex flex-col justify-center">
           <div className="h-[80px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={healthChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={35}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {healthChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="middle" align="right" layout="vertical" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
           </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search tables by name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white">
              <Filter className="w-4 h-4 text-slate-500" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm focus:outline-none bg-transparent min-w-[120px]">
                <option value="all">All Status</option>
                <option value="healthy">Healthy</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                <ListIcon className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tables List */}
      <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${viewMode === 'grid' ? 'p-6' : 'overflow-hidden'}`}>
        {filteredTables.length > 0 ? (
          <div>
            {viewMode === 'grid' && <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-900">{filteredTables.length}</span> of <span className="font-semibold text-slate-900">{tables.length}</span> tables
              </p>
            </div>}

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTables.map(table => (
                  <Card key={table.name} className="p-5 flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow border-t-4" style={{ borderTopColor: table.status === 'healthy' ? '#22c55e' : table.status === 'warning' ? '#f59e0b' : '#ef4444' }}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                          <TableIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{table.name}</h3>
                          <p className="text-xs text-slate-500">{table.columns.length} columns</p>
                        </div>
                      </div>
                      {getStatusBadge(table.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50 p-3 rounded-lg">
                      <div>
                        <p className="text-xs text-slate-500">Rows</p>
                        <p className="font-semibold text-slate-900">{table.rowCount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Size (Est)</p>
                        <p className="font-semibold text-slate-900">{(table.estimatedSize / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>

                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="w-full mt-auto"
                      onClick={() => { setSelectedTable(table); setActiveTab('overview'); }}
                      leftIcon={<Eye className="w-4 h-4" />}
                    >
                      Inspect Details
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-1">Table Name <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('rowCount')}>
                        <div className="flex items-center gap-1">Rows <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Columns</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('estimatedSize')}>
                        <div className="flex items-center gap-1">Size <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Health</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTables.map(table => (
                      <tr key={table.name} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <TableIcon className="w-4 h-4 text-slate-400" />
                            <span className="font-mono text-sm font-semibold text-slate-900">{table.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">{table.rowCount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-slate-600">{table.columns.length}</td>
                        <td className="px-6 py-4 text-slate-600">{(table.estimatedSize / 1024).toFixed(2)} KB</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(table.status)}
                            {table.nullCount > 0 && <span className="text-xs text-amber-600">({table.nullCount} nulls)</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" variant="secondary" onClick={() => { setSelectedTable(table); setActiveTab('overview'); }} leftIcon={<Eye className="w-4 h-4" />}>
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 px-6">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Tables Found
            </h3>
            <p className="text-slate-500">Try adjusting your search query.</p>
          </div>
        )}
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
                    <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><ListIcon className="w-3 h-3" /> Total Rows</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {selectedTable.rowCount.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><Columns className="w-3 h-3" /> Columns</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {selectedTable.columns.length}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><HardDrive className="w-3 h-3" /> Est. Size</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {(selectedTable.estimatedSize / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-sm text-amber-700 mb-1 flex items-center gap-2"><AlertCircle className="w-3 h-3" /> Null Values</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {selectedTable.nullCount}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-sm text-amber-700 mb-1 flex items-center gap-2"><XCircle className="w-3 h-3" /> Empty Values</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {selectedTable.emptyCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Status
                  </span>
                  {getStatusBadge(selectedTable.status)}
                </div>
              </div>}

            {/* Columns Tab */}
            {activeTab === 'columns' && <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  {selectedTable.columns.map(column => (
                    <div key={column.name} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${
                          column.isPrimaryKey ? 'bg-yellow-100 text-yellow-700' : 
                          column.isForeignKey ? 'bg-blue-100 text-blue-700' : 
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {column.isPrimaryKey ? <Key className="w-4 h-4" /> : 
                           column.isForeignKey ? <Link className="w-4 h-4" /> : 
                           <Columns className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-slate-900">{column.name}</span>
                            {column.isPrimaryKey && <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200">PRIMARY KEY</span>}
                            {column.isForeignKey && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">FOREIGN KEY</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] uppercase font-semibold tracking-wider ${getTypeColor(column.type).replace('bg-', 'text-')}`}>{column.type}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">{column.nullable ? 'Optional' : 'Required'}</span>
                            {column.references && <span className="text-xs text-blue-600 flex items-center gap-1 ml-1">→ Links to {column.references}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>}

            {/* Relationships Tab */}
            {activeTab === 'relationships' && <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 min-h-[400px] flex items-center justify-center relative overflow-hidden">
                  {(() => {
                    const outgoing = selectedTable.columns
                      .filter(c => c.isForeignKey && c.references)
                      .map(c => ({ table: c.references!, col: c.name }));
                    
                    const incoming = tables.filter(t => 
                      t.columns.some(c => c.references === selectedTable.name)
                    ).map(t => ({ 
                      table: t.name, 
                      col: t.columns.find(c => c.references === selectedTable.name)?.name 
                    }));

                    if (outgoing.length === 0 && incoming.length === 0) {
                      return (
                        <div className="text-center text-slate-400">
                          <Link className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No relationships detected</p>
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 relative z-10">
                        {/* Incoming */}
                        <div className="flex flex-col gap-4">
                          {incoming.length > 0 ? incoming.map((rel, i) => (
                            <div key={i} className="bg-white border border-slate-200 shadow-sm px-4 py-3 rounded-lg flex items-center gap-2 min-w-[160px] relative group">
                              <div className="hidden md:block absolute -right-16 top-1/2 h-px w-16 bg-slate-300" />
                              <div className="hidden md:block absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-300 rounded-full" />
                              <TableIcon className="w-4 h-4 text-blue-500" />
                              <div>
                                <div className="font-semibold text-slate-700 text-sm">{rel.table}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{rel.col}</div>
                              </div>
                            </div>
                          )) : <div className="text-xs text-slate-400 italic px-4 text-center">No incoming references</div>}
                        </div>

                        {/* Center (Current) */}
                        <div className="bg-blue-50 border-2 border-blue-200 shadow-md px-6 py-4 rounded-xl flex flex-col items-center gap-2 z-20 min-w-[180px]">
                          <Database className="w-8 h-8 text-blue-600" />
                          <div className="font-bold text-slate-900">{selectedTable.name}</div>
                          <div className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Current Table</div>
                        </div>

                        {/* Outgoing */}
                        <div className="flex flex-col gap-4">
                          {outgoing.length > 0 ? outgoing.map((rel, i) => (
                            <div key={i} className="bg-white border border-slate-200 shadow-sm px-4 py-3 rounded-lg flex items-center gap-2 min-w-[160px] relative">
                              <div className="hidden md:block absolute -left-16 top-1/2 h-px w-16 bg-slate-300" />
                              <div className="hidden md:block absolute -left-1 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-slate-300" />
                              <TableIcon className="w-4 h-4 text-purple-500" />
                              <div>
                                <div className="font-semibold text-slate-700 text-sm">{rel.table}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{rel.col}</div>
                              </div>
                            </div>
                          )) : <div className="text-xs text-slate-400 italic px-4 text-center">No outgoing references</div>}
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Background Grid */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                </div>

                <h4 className="text-sm font-semibold text-slate-900 pt-2">Relationship Details</h4>
                {selectedTable.relationships.length > 0 ? selectedTable.relationships.map((rel, index) => <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
                      <Link className="w-4 h-4 text-slate-400" />
                      <code className="text-sm text-slate-700">{rel}</code>
                    </div>) : <p className="text-slate-500 text-sm">
                    No foreign key relationships detected in schema definition.
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