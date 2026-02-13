
import { Booking, Animator } from '../types';

/**
 * CONFIGURATION EMAILJS
 */
const SERVICE_ID = 'service_v0h6cyl'; 
const PUBLIC_KEY = 'EgZeMU9QYhE3keC0w'; 

const TEMPLATE_ID_RECOVERY = 'template_recovery';
const TEMPLATE_ID_CONFIRMATION_TEACHER = 'template_confirmation';
const TEMPLATE_ID_NOTIFICATION_ANIMATOR = 'template_notification';

declare global {
    interface Window {
        emailjs: any;
    }
}

/**
 * Formate une date YYYY-MM-DD en DD/MM/YYYY sans passer par l'objet Date
 * pour éviter les problèmes de fuseau horaire et d'encodage complexe.
 */
const formatDateFR = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export const emailService = {
    init: () => {
        if (window.emailjs) {
            window.emailjs.init(PUBLIC_KEY);
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
            password: adminPassword, // On envoie le mot de passe au template
            app_url: window.location.origin,
            app_name: "Gestion des Réservations",
            reply_to: targetEmail
        };

        try {
            await window.emailjs.send(SERVICE_ID, TEMPLATE_ID_RECOVERY, templateParams);
            console.log('EmailJS: E-mail de récupération (mot de passe) envoyé à', targetEmail);
        } catch (error) {
            console.error('EmailJS Error (Récupération):', error);
            throw error;
        }
    },

    sendBookingConfirmation: async (booking: Booking) => {
        if (!window.emailjs) return;
        
        if (!booking.email || booking.email.trim() === "") {
            console.warn("EmailJS: L'adresse e-mail de l'enseignant est vide. Envoi annulé.");
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

        console.log("EmailJS: Tentative d'envoi confirmation à", targetEmail);

        try {
            await window.emailjs.send(SERVICE_ID, TEMPLATE_ID_CONFIRMATION_TEACHER, templateParams);
            console.log('EmailJS: Confirmation envoyée avec succès à', targetEmail);
        } catch (error) {
            console.error('EmailJS Error (Confirmation Enseignant):', error);
        }
    },

    sendAnimatorNotification: async (booking: Booking, animator: Animator) => {
        if (!window.emailjs) return;
        
        if (!animator.email || animator.email.trim() === "") {
            console.warn(`EmailJS: L'animateur ${animator.name} n'a pas d'adresse e-mail configurée. Notification annulée.`);
            return;
        }

        const targetEmail = animator.email.trim();
        
        const busInfoLabel = booking.noBusRequired 
            ? "Aucune prise en charge bus demandée (l'école se déplace par ses propres moyens)." 
            : (booking.busInfo || "Prise en charge bus demandée (détails non renseignés).");

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
            await window.emailjs.send(SERVICE_ID, TEMPLATE_ID_NOTIFICATION_ANIMATOR, templateParams);
            console.log('EmailJS: Notification envoyée avec succès à l\'animateur', targetEmail);
        } catch (error) {
            console.error('EmailJS Error (Notification Animateur):', error);
        }
    }
};
