// Shared types for report-card branding/templates.
// Mirrors the `config` + `color_scheme` JSON stored on the `report_templates` table.

export interface ReportColorScheme {
  primary: string;
  secondary: string;
  accent: string;
}

export type GradeDisplay = 'both' | 'percentage' | 'grade_only';
export type FontSize = 'small' | 'medium' | 'large';
export type BorderStyle = 'solid' | 'none' | 'double';
export type StampPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export interface ReportTemplateConfig {
  header?: string;
  footer?: string;
  showLogo?: boolean;
  showRank?: boolean;
  showAttendance?: boolean;
  showComments?: boolean;
  showSubjectCoefficients?: boolean;
  colorCodeGrades?: boolean;
  includeCharts?: boolean;
  gradeDisplay?: GradeDisplay;
  fontFamily?: string;
  fontSize?: FontSize;
  borderStyle?: BorderStyle;
  headerStyle?: string;
  showWatermark?: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;
  includeStamp?: boolean;
  stampPosition?: StampPosition;
  includeDigitalSignatures?: boolean;
  signatureFields?: string[];
  includeSchoolMotto?: boolean;
}

export interface ResolvedTemplate {
  config: ReportTemplateConfig;
  colorScheme: ReportColorScheme;
}

export const DEFAULT_COLOR_SCHEME: ReportColorScheme = {
  primary: '#4F46E5',
  secondary: '#10B981',
  accent: '#F59E0B',
};

export const DEFAULT_TEMPLATE: ResolvedTemplate = {
  config: {
    showLogo: true,
    showRank: true,
    showAttendance: true,
    showComments: true,
    showSubjectCoefficients: true,
    colorCodeGrades: false,
    gradeDisplay: 'percentage',
    fontFamily: 'Arial',
    fontSize: 'medium',
    borderStyle: 'solid',
    headerStyle: 'formal',
    includeSchoolMotto: true,
    signatureFields: ['Class Master', 'Principal', 'Parent/Guardian'],
  },
  colorScheme: DEFAULT_COLOR_SCHEME,
};

/** Build a ResolvedTemplate from a raw report_templates row (config + color_scheme). */
export function resolveTemplate(row: {
  config?: ReportTemplateConfig | null;
  color_scheme?: Partial<ReportColorScheme> | null;
} | null | undefined): ResolvedTemplate {
  if (!row) return DEFAULT_TEMPLATE;
  return {
    config: { ...DEFAULT_TEMPLATE.config, ...(row.config || {}) },
    colorScheme: { ...DEFAULT_COLOR_SCHEME, ...(row.color_scheme || {}) },
  };
}

export function fontSizeToPx(size?: FontSize): string {
  switch (size) {
    case 'small':
      return '12px';
    case 'large':
      return '16px';
    case 'medium':
    default:
      return '14px';
  }
}

export function borderStyleToCss(style?: BorderStyle): string {
  switch (style) {
    case 'none':
      return 'none';
    case 'double':
      return '3px double #9ca3af';
    case 'solid':
    default:
      return '1px solid #d1d5db';
  }
}
