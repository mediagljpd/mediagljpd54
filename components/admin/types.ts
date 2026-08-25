export type AdminView = 'animations' | 'calendar' | 'bookings' | 'settings' | 'users';

export type AdminSubComponentProps = {
    showNotification: (message: string, type?: 'success' | 'error') => void;
    setHasUnsavedChanges?: (hasChanges: boolean) => void;
    registerSave?: (saveFn: () => void) => void;
    registerCancel?: (cancelFn: () => void) => void;
};
