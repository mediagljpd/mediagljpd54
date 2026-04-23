export type AdminView = 'animations' | 'calendar' | 'bookings' | 'settings' | 'users';

export type AdminSubComponentProps = {
    showNotification: (message: string, type?: 'success' | 'error') => void;
};
