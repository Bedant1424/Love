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
}
