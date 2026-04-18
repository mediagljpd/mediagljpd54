export type AdminView = 'animations' | 'calendar' | 'bookings' | 'settings' | 'journal' | 'users';

export type AdminSubComponentProps = {
    showNotification: (message: string, type?: 'success' | 'error') => void;
};
