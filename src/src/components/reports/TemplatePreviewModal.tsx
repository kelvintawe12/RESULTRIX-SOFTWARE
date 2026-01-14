import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Copy, Check } from 'lucide-react';

interface ReportTemplate {
  id: string;
  school_id: string | null;
  template_name: string;
  template_type: string;
  is_default: boolean;
  is_active: boolean;
  description: string;
  layout_type: string;
  color_scheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  config: any;
  created_at: string;
  updated_at?: string;
}

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: ReportTemplate;
  onClone?: (templateId: string) => void;
  onActivate?: (templateId: string) => void;
}

export function TemplatePreviewModal({
  isOpen,
  onClose,
  template,
  onClone,
  onActivate
}: TemplatePreviewModalProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`${template.template_name} - Live Preview`}
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Sample Report Card Preview */}
        <div 
          className="bg-white border-2 rounded-lg p-6 shadow-sm"
          style={{ borderColor: template.color_scheme?.primary }}
        >
          {/* Header with color bar */}
          <div 
            className="h-3 -mx-6 -mt-6 mb-4 rounded-t-lg"
            style={{ 
              background: `linear-gradient(90deg, ${template.color_scheme?.primary}, ${template.color_scheme?.secondary})` 
            }}
          />

          {/* School Header */}
          {template.config.showLogo && (
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🏫</span>
              </div>
            </div>
          )}

          {template.config.header ? (
            <div className="text-center mb-4 pb-4 border-b">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {template.config.header}
              </p>
            </div>
          ) : (
            <div className="text-center mb-4 pb-4 border-b">
              <h2 
                className="text-xl font-bold mb-1"
                style={{ color: template.color_scheme?.primary }}
              >
                Sample High School
              </h2>
              <p className="text-sm text-gray-600">Academic Report Card</p>
              <p className="text-xs text-gray-500">2023-2024 Academic Year • Term 1</p>
            </div>
          )}

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="text-gray-600">Student:</span>
              <span className="ml-2 font-semibold">John Doe</span>
            </div>
            <div>
              <span className="text-gray-600">Class:</span>
              <span className="ml-2 font-semibold">Grade 10A</span>
            </div>
            <div>
              <span className="text-gray-600">Admission No:</span>
              <span className="ml-2 font-semibold">2024001</span>
            </div>
            {template.config.showRank && (
              <div>
                <span className="text-gray-600">Rank:</span>
                <span 
                  className="ml-2 font-semibold"
                  style={{ color: template.color_scheme?.secondary }}
                >
                  3rd / 45
                </span>
              </div>
            )}
          </div>

          {/* Subjects Table */}
          <div className="mb-4">
            <h3 
              className="font-semibold mb-2 text-sm"
              style={{ color: template.color_scheme?.primary }}
            >
              Academic Performance
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr 
                  className="border-b-2"
                  style={{ borderColor: template.color_scheme?.primary }}
                >
                  <th className="text-left py-2">Subject</th>
                  <th className="text-center py-2">Score</th>
                  <th className="text-center py-2">Grade</th>
                  {template.config.showComments && (
                    <th className="text-left py-2">Remark</th>
                  )}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">Mathematics</td>
                  <td className="text-center">17.5 / 20</td>
                  <td className="text-center">
                    <span 
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{ 
                        backgroundColor: `${template.color_scheme?.secondary}20`,
                        color: template.color_scheme?.secondary 
                      }}
                    >
                      A
                    </span>
                  </td>
                  {template.config.showComments && (
                    <td className="text-xs text-gray-600">Excellent work</td>
                  )}
                </tr>
                <tr className="border-b">
                  <td className="py-2">English</td>
                  <td className="text-center">16.0 / 20</td>
                  <td className="text-center">
                    <span 
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{ 
                        backgroundColor: `${template.color_scheme?.secondary}20`,
                        color: template.color_scheme?.secondary 
                      }}
                    >
                      A
                    </span>
                  </td>
                  {template.config.showComments && (
                    <td className="text-xs text-gray-600">Very good</td>
                  )}
                </tr>
                <tr className="border-b">
                  <td className="py-2">Physics</td>
                  <td className="text-center">15.5 / 20</td>
                  <td className="text-center">
                    <span 
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{ 
                        backgroundColor: `${template.color_scheme?.accent}20`,
                        color: template.color_scheme?.accent 
                      }}
                    >
                      B+
                    </span>
                  </td>
                  {template.config.showComments && (
                    <td className="text-xs text-gray-600">Good progress</td>
                  )}
                </tr>
                <tr className="border-b font-semibold">
                  <td className="py-2">Overall Average</td>
                  <td className="text-center">16.3 / 20</td>
                  <td className="text-center">
                    <span 
                      className="px-2 py-1 rounded text-xs"
                      style={{ 
                        backgroundColor: `${template.color_scheme?.primary}20`,
                        color: template.color_scheme?.primary 
                      }}
                    >
                      81.5%
                    </span>
                  </td>
                  {template.config.showComments && <td></td>}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Attendance */}
          {template.config.showAttendance && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h3 
                className="font-semibold mb-2 text-sm"
                style={{ color: template.color_scheme?.primary }}
              >
                Attendance
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Present:</span>
                  <span className="ml-2 font-semibold">85 days</span>
                </div>
                <div>
                  <span className="text-gray-600">Absent:</span>
                  <span className="ml-2 font-semibold">5 days</span>
                </div>
                <div>
                  <span className="text-gray-600">Rate:</span>
                  <span 
                    className="ml-2 font-semibold"
                    style={{ color: template.color_scheme?.secondary }}
                  >
                    94.4%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Teacher Comments */}
          {template.config.showComments && (
            <div className="mb-4">
              <h3 
                className="font-semibold mb-2 text-sm"
                style={{ color: template.color_scheme?.primary }}
              >
                Teacher's Comments
              </h3>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                John is an excellent student who consistently demonstrates strong academic performance. 
                He actively participates in class and shows great enthusiasm for learning. Keep up the good work!
              </p>
            </div>
          )}

          {/* Footer */}
          {template.config.footer ? (
            <div className="pt-4 border-t text-center">
              <p className="text-xs text-gray-600 whitespace-pre-wrap">
                {template.config.footer}
              </p>
            </div>
          ) : (
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-8 text-xs text-center">
                <div>
                  <div className="border-t border-gray-400 pt-1 mt-8">Class Teacher</div>
                </div>
                <div>
                  <div className="border-t border-gray-400 pt-1 mt-8">Principal</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Template Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Template Information</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 capitalize">{template.template_type}</span>
            </div>
            <div>
              <span className="text-gray-600">Layout:</span>
              <span className="ml-2 capitalize">{template.layout_type}</span>
            </div>
            <div>
              <span className="text-gray-600">Features:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {template.config.showLogo && <Badge variant="neutral" className="text-xs">Logo</Badge>}
                {template.config.showRank && <Badge variant="neutral" className="text-xs">Rank</Badge>}
                {template.config.showAttendance && <Badge variant="neutral" className="text-xs">Attendance</Badge>}
                {template.config.showComments && <Badge variant="neutral" className="text-xs">Comments</Badge>}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
          {template.is_default && onClone ? (
            <Button 
              onClick={() => {
                onClose();
                onClone(template.id);
              }}
              leftIcon={<Copy className="h-4 w-4" />}
              className="flex-1"
            >
              Clone This Template
            </Button>
          ) : !template.is_active && onActivate && (
            <Button 
              onClick={() => {
                onClose();
                onActivate(template.id);
              }}
              leftIcon={<Check className="h-4 w-4" />}
              className="flex-1"
            >
              Activate Template
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
