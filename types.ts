
export interface Animation {
  id: string;
  title: string;
  description?: string;
  classLevel: string;
  animator?: string;
  color: string;
  fontColor: string;
  order: number;
  imageUrl?: string;
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
  // Statut de réservation (Mode hybride / Test)
  status?: 'pending' | 'validated';
  // Nouveaux champs pour la gestion du bus
  noBusRequired?: boolean;
  busStatus?: 'pending' | 'validated';
  busCost?: number;
  isOutOfGrandLongwy?: boolean;
  reminderSent?: boolean;
}

export interface Holiday {
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface AnimatorSettings {
  inactiveSlots: number[];
  unavailableDates: string[];
  unavailableReasons?: Record<string, string>;
  unavailableHalfDays?: Record<string, 'morning' | 'afternoon'>;
  monthlyBookingLimit?: number;
}

export interface Animator {
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface FooterLink {
  id: string;
  label: string;
  url?: string;
  content?: string;
}

export interface EstablishmentInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  logoLeftUrl?: string;
  logoWidth?: number;
  logoLeftWidth?: number;
}

export interface CustomLegalPage {
  id: string;
  title: string;
  content: string;
  slug: string;
  hideTitle?: boolean;
}

export interface Commune {
  id: string;
  name: string;
  postalCode: string;
}

export interface School {
  id: string;
  name: string;
  address: string;
  communeId: string;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export interface UserPermissions {
  canModifySettings: boolean;
  canManageVacations: boolean;
  canManageAnimations: boolean;
  canManageBus?: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  animatorName?: string; // Linked animator for 'user' role
  permissions: UserPermissions;
  passwordLastChanged?: string; // ISO date
  mustChangePassword?: boolean;
  forcePasswordExpiry?: boolean;
  passwordExpiryDaysInterval?: number;
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

  // Règles du calendrier
  bookingLeadTime: number; // Nombre de jours de préavis
  allowedDays: number[]; // [0, 1, 2, 3, 4, 5, 6] (0=Dim, 1=Lun...)
  availableTimeSlots: number[]; // [9, 10, 14, 15...]

  // Données de référence
  classLevels?: string[];
  communes?: Commune[];
  schools?: School[];

  // Footer & Legal
  footerLinks?: FooterLink[];
  establishmentInfo?: EstablishmentInfo;
  legalNoticeTitle?: string;
  legalNotice?: string;
  privacyPolicyTitle?: string;
  privacyPolicy?: string;
  cookiesPolicyTitle?: string;
  cookiesPolicy?: string;

  // Contact
  contactPhone?: string;
  contactEmail?: string;
  users?: AdminUser[];
  userPreferences?: Record<string, { defaultViewPref?: 'list' | 'calendar'; defaultScopePref?: 'all' | 'mine' }>;

  // Auto-cleanup settings
  autoCleanupEnabled?: boolean;
  cleanupDay?: number;
  cleanupMonth?: number;
  lastCleanupYear?: number;
  infoPages?: CustomLegalPage[];
  registrationFormUrl?: string;
  registrationFormName?: string;
  adminPasswordLastChanged?: string; // ISO date
  passwordExpiryDays?: number; // 0 for disabled
  lastExportDate?: string; // ISO date
  headerInfoText?: string;
  headerInfoFontSize?: string;
  headerInfoFontWeight?: string;
  headerInfoFontStyle?: string;
  headerInfoColor?: string;
  headerInfoWidth?: number;

  // Email Templates
  emailTeacherTemplate?: string;
  emailTeacherSubject?: string;
  emailTeacherEnabled?: boolean;
  emailAnimatorTemplate?: string;
  emailAnimatorSubject?: string;
  emailAnimatorEnabled?: boolean;
  emailListTemplate?: string;
  emailListSubject?: string;
  emailListEnabled?: boolean;
  emailReminderTemplate?: string;
  emailReminderSubject?: string;
  emailReminderEnabled?: boolean;
  emailReminderDays?: number;
  emailReminderTargetTeachers?: boolean;
  emailReminderTargetAnimators?: boolean;

  // Statut des réservations (Mode hybride / Test)
  enableBookingStatus?: boolean;
  emailAnimatorOnValidationEnabled?: boolean;
}

export enum View {
  HOME,
  CALENDAR,
  ADMIN_LOGIN,
  ADMIN_PANEL,
  LEGAL_NOTICE,
  PRIVACY_POLICY,
  COOKIES_POLICY,
  INFO_PAGE,
}
