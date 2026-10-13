declare module 'lucide-react' {
  import * as React from 'react';

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
  }

  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >;

  export const Volume2: LucideIcon;
  export const VolumeX: LucideIcon;
  export const Music: LucideIcon;
  export const Heart: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Mail: LucideIcon;
  export const X: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Smile: LucideIcon;
  export const Moon: LucideIcon;
  export const Home: LucideIcon;
  export const Star: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const HeartHandshake: LucideIcon;
  export const Camera: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const Settings: LucideIcon;
  export const Palette: LucideIcon;
  export const Image: LucideIcon;
  export const FileText: LucideIcon;
  export const Layers: LucideIcon;
  export const Download: LucideIcon;
  export const Upload: LucideIcon;
  export const Plus: LucideIcon;
  export const Trash2: LucideIcon;
  export const Play: LucideIcon;
  export const Pause: LucideIcon;
  export const Save: LucideIcon;
  export const Undo: LucideIcon;
  export const Copy: LucideIcon;
  export const Check: LucideIcon;
  export const Eye: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const UploadCloud: LucideIcon;
}
