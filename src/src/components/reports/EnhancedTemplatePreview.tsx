import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Copy, Check, FileText, Award } from 'lucide-react';

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

interface EnhancedTemplatePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  template: ReportTemplate;
  onClone?: (templateId: string) => void;
  onActivate?: (templateId: string) => void;
}

export function EnhancedTemplatePreview({
  isOpen,
  onClose,
  template,
  onClone,
  onActivate
}: EnhancedTemplatePreviewProps) {
  const isBooklet = template.template_type === 'booklet';
  
  // Watermark component
  const Watermark = () => {
    if (!template.config.showWatermark) return null;
    
    return (
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
        style={{ 
          opacity: template.config.watermarkOpacity || 0.05 
        }}
      >
        <div 
          className="text-9xl font-bold transform rotate-[-45deg]"
          style={{ color: template.color_scheme?.primary }}
        >
          {template.config.watermarkText || 'OFFICIAL'}
        </div>
      </div>
    );
  };

  // Official Stamp component
  const OfficialStamp = () => {
    if (!template.config.includeStamp) return null;
    
    return (
      <div className="absolute bottom-8 right-8 z-10">
        <div 
          className="w-24 h-24 rounded-full border-4 flex items-center justify-center transform rotate-12"
          style={{ 
            borderColor: template.color_scheme?.accent,
            backgroundColor: `${template.color_scheme?.accent}10`
          }}
        >
          <div className="text-center">
            <Award 
              className="w-8 h-8 mx-auto mb-1" 
              style={{ color: template.color_scheme?.accent }}
            />
            <div 
              className="text-xs font-bold"
              style={{ color: template.color_scheme?.accent }}
            >
              OFFICIAL
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Signature Fields component
  const SignatureFields = () => {
    if (!template.config.includeDigitalSignatures) return null;
    
    const fields = template.config.signatureFields || ['Principal', 'Class Teacher', 'Parent/Guardian'];
    
    return (
      <div className="grid grid-cols-3 gap-6 mt-8">
        {fields.map((field: string, index: number) => (
          <div key={index} className="text-center">
            <div className="border-t-2 border-gray-400 pt-2 mt-12">
              <div className="text-xs font-medium text-gray-600">{field}</div>
              <div className="text-xs text-gray-400 mt-1">Signature & Date</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Booklet Cover Page
  const CoverPage = () => (
    <div 
      className="relative bg-white border-2 rounded-lg p-12 shadow-lg min-h-[500px] flex flex-col items-center justify-center overflow-hidden"
      style={{ borderColor: template.color_scheme?.primary }}
    >
      <Watermark />
      
      {/* Decorative corner elements */}
      <div 
        className="absolute top-0 left-0 w-32 h-32 opacity-10"
        style={{ 
          background: `linear-gradient(135deg, ${template.color_scheme?.primary} 0%, transparent 100%)` 
        }}
      />
      <div 
        className="absolute bottom-0 right-0 w-32 h-32 opacity-10"
        style={{ 
          background: `linear-gradient(-45deg, ${template.color_scheme?.secondary} 0%, transparent 100%)` 
        }}
      />
      
      <div className="relative z-10 text-center space-y-6">
        {/* School Logo */}
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">🏫</span>
        </div>
        
        {/* Title */}
        <div>
          <h1 
            className="text-4xl font-bold mb-2"
            style={{ color: template.color_scheme?.primary }}
          >
            Academic Report Card
          </h1>
          <div 
            className="h-1 w-32 mx-auto rounded"
            style={{ backgroundColor: template.color_scheme?.secondary }}
          />
        </div>
        
        {/* School Info */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-800">
            Sample High School
          </h2>
          <p className="text-gray-600">Excellence in Education</p>
        </div>
        
        {/* Academic Year */}
        <div 
          className="inline-block px-6 py-3 rounded-lg"
          style={{ 
            backgroundColor: `${template.color_scheme?.primary}10`,
            borderLeft: `4px solid ${template.color_scheme?.primary}`
          }}
        >
          <div className="text-sm text-gray-600">Academic Year</div>
          <div className="text-xl font-bold" style={{ color: template.color_scheme?.primary }}>
            2023-2024
          </div>
        </div>
        
        {/* Student Info */}
        <div className="mt-8 space-y-2">
          <div className="text-lg">
            <span className="text-gray-600">Student:</span>
            <span className="ml-2 font-semibold">John Doe</span>
          </div>
          <div className="text-lg">
            <span className="text-gray-600">Class:</span>
            <span className="ml-2 font-semibold">Grade 10A</span>
          </div>
          <div className="text-lg">
            <span className="text-gray-600">Term:</span>
            <span className="ml-2 font-semibold">First Term</span>
          </div>
        </div>
      </div>
      
      {/* Page number */}
      {template.config.pageNumbers && (
        <div className="absolute bottom-4 right-4 text-xs text-gray-400">
          Page 1
        </div>
      )}
    </div>
  );

  // Main Report Page
  const ReportPage = ({ pageNumber = 2 }: { pageNumber?: number }) => (
    <div 
      className="relative bg-white border-2 rounded-lg p-6 shadow-sm overflow-hidden"
      style={{ borderColor: template.color_scheme?.primary }}
    >
      <Watermark />
      
      <div className="relative z-10">
        {/* Header with color bar */}
        <div 
          className="h-3 -mx-6 -mt-6 mb-4 rounded-t-lg"
          style={{ 
            background: `linear-gradient(90deg, ${template.color_scheme?.primary}, ${template.color_scheme?.secondary})` 
          }}
        />

        {/* School Header */}
        {template.config.showLogo && !isBooklet && (
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
        ) : !isBooklet && (
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

        {/* Footer with Signatures */}
        {template.config.footer ? (
          <div className="pt-4 border-t text-center">
            <p className="text-xs text-gray-600 whitespace-pre-wrap">
              {template.config.footer}
            </p>
          </div>
        ) : (
          <div className="pt-4 border-t">
            <SignatureFields />
          </div>
        )}
      </div>

      {/* Official Stamp */}
      <OfficialStamp />

      {/* Page number */}
      {template.config.pageNumbers && (
        <div className="absolute bottom-4 right-4 text-xs text-gray-400 z-20">
          Page {pageNumber}
        </div>
      )}
    </div>
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`${template.template_name} - Live Preview`}
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Show booklet pages or single page */}
        {isBooklet && template.config.includeCoverPage ? (
          <div className="space-y-6">
            <div className="text-center">
              <Badge variant="info" className="mb-2">
                <FileText className="h-3 w-3 mr-1" />
                Multi-Page Booklet Preview
              </Badge>
            </div>
            <CoverPage />
            <ReportPage pageNumber={2} />
            <div className="text-center text-sm text-gray-500 italic">
              ... Additional pages would include charts, analysis, and summary ...
            </div>
          </div>
        ) : (
          <ReportPage />
        )}

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
                {template.config.showWatermark && <Badge variant="info" className="text-xs">Watermark</Badge>}
                {template.config.includeStamp && <Badge variant="warning" className="text-xs">Official Stamp</Badge>}
                {template.config.includeDigitalSignatures && <Badge variant="success" className="text-xs">Signatures</Badge>}
                {template.config.multiPage && <Badge variant="info" className="text-xs">Multi-Page</Badge>}
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
