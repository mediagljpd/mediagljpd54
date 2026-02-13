export type AdminView = 'animations' | 'calendar' | 'bookings' | 'settings' | 'journal' | 'recre';

export type AdminSubComponentProps = {
    showNotification: (message: string) => void;
};
