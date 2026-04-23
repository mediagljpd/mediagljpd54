
import { Booking, Animator } from '../types';

/**
 * CONFIGURATION EMAILJS
 * 
 * Compte 1 (Principal - mediagljpd54@gmail.com)
 * Gère : Notifications Animateurs et Récupération de mot de passe
 */
const MAIN_SERVICE_ID = 'service_o5lbm0b'; 
const MAIN_PUBLIC_KEY = 'f3k30dsN4n8aHPNzR'; 

/**
 * Compte 2 (Enseignants - microfolie54@gmail.com)
 * Gère : Confirmations de réservation aux enseignants
 */
const TEACHER_SERVICE_ID = 'service_pqptrua'; 
const TEACHER_PUBLIC_KEY = 'zcDY1OLyk44t-qy2G'; 

const TEMPLATE_ID_RECOVERY = 'template_recovery';
const TEMPLATE_ID_CONFIRMATION_TEACHER = 'template_enseignant';
const TEMPLATE_ID_NOTIFICATION_ANIMATOR = 'template_animateur';

declare global {
    interface Window {
        emailjs: any;
    }
}

/**
 * Formate une date YYYY-MM-DD en DD/MM/YYYY
 */
const formatDateFR = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export const emailService = {
    init: () => {
        if (window.emailjs) {
            // On initialise avec la clé principale par défaut
            window.emailjs.init(MAIN_PUBLIC_KEY);
        }
    },

    sendRecoveryEmail: async (adminEmail: string, adminUsername: string, adminPassword: string) => {
        if (!window.emailjs || !adminEmail) {
            console.error("EmailJS: Email d'administration manquant.");
            return;
        }
        
        const targetEmail = adminEmail.trim();
        const templateParams = {
            to_email: targetEmail,
            username: adminUsername,
            password: adminPassword,
            app_url: window.location.origin,
            app_name: "Gestion des Réservations",
            reply_to: targetEmail
        };

        try {
            // Utilise le compte Principal
            await window.emailjs.send(MAIN_SERVICE_ID, TEMPLATE_ID_RECOVERY, templateParams, MAIN_PUBLIC_KEY);
            console.log('EmailJS: E-mail de récupération envoyé.');
        } catch (error) {
            console.error('EmailJS Error (Récupération):', error);
            throw error;
        }
    },

    sendBookingConfirmation: async (booking: Booking) => {
        if (!window.emailjs) return;
        
        if (!booking.email || booking.email.trim() === "") {
            return;
        }

        const targetEmail = booking.email.trim();
        const templateParams = {
            to_email: targetEmail,
            to_name: booking.teacherName,
            animation_title: booking.animationTitle,
            booking_date: formatDateFR(booking.date),
            booking_time: `${booking.time}h`,
            school_name: booking.schoolName,
            commune: booking.commune
        };

        try {
            // Utilise le compte Enseignants (microfolie54@gmail.com)
            await window.emailjs.send(TEACHER_SERVICE_ID, TEMPLATE_ID_CONFIRMATION_TEACHER, templateParams, TEACHER_PUBLIC_KEY);
            console.log('EmailJS: Confirmation enseignant envoyée.');
        } catch (error) {
            console.error('EmailJS Error (Confirmation):', error);
        }
    },

    sendAnimatorNotification: async (booking: Booking, animator: Animator) => {
        if (!window.emailjs) return;
        
        if (!animator.email || animator.email.trim() === "") {
            return;
        }

        const targetEmail = animator.email.trim();
        const busInfoLabel = booking.noBusRequired 
            ? "Aucune prise en charge bus demandée." 
            : (booking.busInfo || "Prise en charge bus demandée.");

        const templateParams = {
            to_email: targetEmail,
            animator_name: animator.name,
            animation_title: booking.animationTitle,
            teacher_name: booking.teacherName,
            class_level: booking.classLevel,
            school_name: booking.schoolName,
            commune: booking.commune,
            booking_date: formatDateFR(booking.date),
            booking_time: `${booking.time}h00`,
            student_count: booking.studentCount,
            adult_count: booking.adultCount,
            bus_info: busInfoLabel,
            teacher_phone: booking.phoneNumber,
            teacher_email: booking.email
        };

        try {
            // Utilise le compte Principal
            await window.emailjs.send(MAIN_SERVICE_ID, TEMPLATE_ID_NOTIFICATION_ANIMATOR, templateParams, MAIN_PUBLIC_KEY);
            console.log('EmailJS: Notification animateur envoyée.');
        } catch (error) {
            console.error('EmailJS Error (Notification Animateur):', error);
        }
    }
};
