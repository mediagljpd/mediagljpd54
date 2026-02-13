
export interface Animation {
  id: string;
  title: string;
  description?: string;
  classLevel: string;
  animator?: string;
  color: string;
  fontColor: string;
  order: number;
}

export interface Booking {
  id: string;
  animationId: string;
  animationTitle: string;
  date: string; // YYYY-MM-DD
  time: number; // 9, 10, 14, 15
  teacherName: string;
  classLevel: string;
  commune: string;
  schoolName: string;
  phoneNumber: string;
  email: string;
  studentCount: number;
  adultCount: number;
  busInfo: string;
  // Nouveaux champs pour la gestion du bus
  noBusRequired?: boolean;
  busStatus?: 'pending' | 'validated';
  busCost?: number;
}

export interface Holiday {
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface AnimatorSettings {
  inactiveSlots: number[];
  unavailableDates: string[];
}

export interface Animator {
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface AppSettings {
  homepageTitle: string;
  homepageSubtitle?: string;
  homepageBgColor: string;
  headerBgColor?: string;
  
  titleFontSize?: string;
  titleFontWeight?: string;
  titleFontStyle?: string;
  titleColor?: string;

  subtitleFontSize?: string;
  subtitleFontWeight?: string;
  subtitleFontStyle?: string;
  subtitleColor?: string;

  activeYear: string; // e.g., "2025-2026"
  holidays: Holiday[];
  adminEmail: string;
  adminUsername?: string;
  adminPassword?: string;
  footerContent: string;
  animators: Animator[];
  animatorSettings?: Record<string, AnimatorSettings>;

  // Nouvelles images personnalisables
  adminLoginBgUrl?: string;
  gameMemoryImageUrl?: string;
  gameCheckersImageUrl?: string;
  gamePicrossImageUrl?: string;

  // Règles du calendrier
  bookingLeadTime: number; // Nombre de jours de préavis
  allowedDays: number[]; // [0, 1, 2, 3, 4, 5, 6] (0=Dim, 1=Lun...)
  availableTimeSlots: number[]; // [9, 10, 14, 15...]

  // Contact
  contactPhone?: string;
  contactEmail?: string;
}

export interface ChangelogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  version: string;
  title: string;
  description: string;
}

export enum View {
  HOME,
  CALENDAR,
  ADMIN_LOGIN,
  ADMIN_PANEL,
}
