
import { Booking, Animator, AppSettings, Animation } from '../types';

/**
 * CONFIGURATION EMAILJS
 */
const MAIN_SERVICE_ID = 'service_2tqb6yh'; 
const MAIN_PUBLIC_KEY = 'f3k30dsN4n8aHPNzR'; 

const TEACHER_SERVICE_ID = 'service_4usv5u7'; 
const TEACHER_PUBLIC_KEY = 'zcDY1OLyk44t-qy2G'; 

const TEMPLATE_ID_RAPPEL = 'template_rappel';
const TEMPLATE_ID_CONFIRMATION_TEACHER = 'template_enseignant';
const TEMPLATE_ID_NOTIFICATION_ANIMATOR = 'template_animateur';
const TEMPLATE_ID_BOOKING_LIST = 'template_liste';

declare global {
    interface Window {
        emailjs: any;
    }
}

/**
 * Remplace les variables {{variable}} par leurs valeurs
 */
const renderTemplate = (template: string, params: Record<string, any>) => {
    let rendered = template;
    Object.entries(params).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, value !== undefined && value !== null ? String(value) : "");
    });
    return rendered;
};

/**
 * Formate une date YYYY-MM-DD en DD/MM/YYYY
 */
const formatDateFR = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

/**
 * Formate une date YYYY-MM-DD en Format Long FR (ex: Jeudi 4 juin 2026)
 */
const formatLongDateOnlyFR = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    
    const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    };
    
    let formatted = date.toLocaleDateString('fr-FR', options);
    // Capitalisation de la première lettre (jour de la semaine)
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

/**
 * Formate une date YYYY-MM-DD en Format Long FR avec horaire
 */
const formatLongDateFR = (dateStr: string, time: string) => {
    return `${formatLongDateOnlyFR(dateStr)} à ${time}h`;
};

export const emailService = {
    init: () => {
        if (window.emailjs) {
            window.emailjs.init(MAIN_PUBLIC_KEY);
        }
    },

    sendBookingReminder: async (booking: Booking, settings: AppSettings, animations?: Animation[]) => {
        if (!window.emailjs) return;
        
        if (settings.emailReminderEnabled === false) {
            console.log("EmailJS: Envoi de l'e-mail de rappel automatique désactivé dans les paramètres.");
            return;
        }

        const info = settings.establishmentInfo || { name: "Médiathèque du Grand Longwy", email: "", phone: "", address: "" };

        // 1. Send to Teacher if enabled (default is true)
        const sendToTeacher = settings.emailReminderTargetTeachers !== false;
        if (sendToTeacher && booking.email && booking.email.trim() !== "") {
            const targetEmail = booking.email.trim();
            const params = {
                to_email: targetEmail,
                to_name: booking.teacherName,
                teacher_name: booking.teacherName,
                animation_title: booking.animationTitle,
                booking_date: formatLongDateOnlyFR(booking.date),
                booking_date_short: formatDateFR(booking.date),
                booking_date_clean: formatDateFR(booking.date).replace(/\//g, '.'),
                booking_time: `${booking.time}h00`,
                school_name: booking.schoolName,
                commune: booking.commune,
                student_count: booking.studentCount,
                adult_count: booking.adultCount,
                class_level: booking.classLevel || "",
                bus_info: booking.noBusRequired ? "Non" : `Oui ${booking.busInfo ? `(${booking.busInfo})` : ""}`,
                teacher_phone: booking.phoneNumber,
                teacher_email: booking.email,
                establishment_name: info.name,
                logo_url: info.logoUrl || "",
                header_bg_color: settings.headerBgColor || "#0f172a",
                reply_to: 'mediatheque@grandlongwy.fr',
                from_name: info.name,
                from_email: 'mediatheque@grandlongwy.fr'
            };

            let dynamicParams: any = { ...params };
            if (settings.emailReminderTemplate) {
                dynamicParams.message_html = renderTemplate(settings.emailReminderTemplate, params);
            }
            if (settings.emailReminderSubject) {
                dynamicParams.subject = renderTemplate(settings.emailReminderSubject, params);
            }

            try {
                await window.emailjs.send(MAIN_SERVICE_ID, TEMPLATE_ID_RAPPEL, dynamicParams, MAIN_PUBLIC_KEY);
                console.log('EmailJS: Rappel automatique enseignant envoyé.');
            } catch (error) {
                console.error('EmailJS Error (Rappel Enseignant):', error);
            }
        }

        // 2. Send to Animator if enabled (default is false)
        const sendToAnimator = settings.emailReminderTargetAnimators === true;
        if (sendToAnimator && animations) {
            const animObj = animations.find(a => a.id === booking.animationId || a.title === booking.animationTitle);
            const animatorName = animObj?.animator;
            if (animatorName) {
                const animator = (settings.animators || []).find(
                    a => a.name.trim().toLowerCase() === animatorName.trim().toLowerCase()
                );
                if (animator && animator.email && animator.email.trim() !== "") {
                    const animatorEmail = animator.email.trim();
                    const params = {
                        to_email: animatorEmail,
                        to_name: animator.name,
                        teacher_name: booking.teacherName,
                        animation_title: booking.animationTitle,
                        booking_date: formatLongDateOnlyFR(booking.date),
                        booking_date_short: formatDateFR(booking.date),
                        booking_date_clean: formatDateFR(booking.date).replace(/\//g, '.'),
                        booking_time: `${booking.time}h00`,
                        school_name: booking.schoolName,
                        commune: booking.commune,
                        student_count: booking.studentCount,
                        adult_count: booking.adultCount,
                        class_level: booking.classLevel || "",
                        bus_info: booking.noBusRequired ? "Non" : `Oui ${booking.busInfo ? `(${booking.busInfo})` : ""}`,
                        teacher_phone: booking.phoneNumber,
                        teacher_email: booking.email,
                        establishment_name: info.name,
                        logo_url: info.logoUrl || "",
                        header_bg_color: settings.headerBgColor || "#0f172a",
                        reply_to: 'mediatheque@grandlongwy.fr',
                        from_name: info.name,
                        from_email: 'mediatheque@grandlongwy.fr'
                    };

                    let dynamicParams: any = { ...params };
                    if (settings.emailReminderTemplate) {
                        dynamicParams.message_html = renderTemplate(settings.emailReminderTemplate, params);
                    }
                    if (settings.emailReminderSubject) {
                        dynamicParams.subject = renderTemplate(settings.emailReminderSubject, params);
                    }

                    try {
                        await window.emailjs.send(MAIN_SERVICE_ID, TEMPLATE_ID_RAPPEL, dynamicParams, MAIN_PUBLIC_KEY);
                        console.log('EmailJS: Rappel automatique animateur envoyé.');
                    } catch (error) {
                        console.error('EmailJS Error (Rappel Animateur):', error);
                    }
                }
            }
        }
    },

    sendBookingConfirmation: async (booking: Booking, settings: AppSettings) => {
        if (!window.emailjs) return;
        
        if (settings.emailTeacherEnabled === false) {
            console.log("EmailJS: Envoi de l'e-mail de confirmation (Enseignant) désactivé dans les paramètres.");
            return;
        }
        
        if (!booking.email || booking.email.trim() === "") {
            return;
        }

        const targetEmail = booking.email.trim();
        const info = settings.establishmentInfo || { name: "Cité des Paysages", email: "", phone: "", address: "" };
        
        const params = {
            to_email: targetEmail,
            to_name: booking.teacherName,
            teacher_name: booking.teacherName, // Synchronized
            animation_title: booking.animationTitle,
            booking_date: formatLongDateOnlyFR(booking.date),
            booking_date_short: formatDateFR(booking.date), // Kept for flexible templates
            booking_date_clean: formatDateFR(booking.date).replace(/\//g, '.'), // Added to avoid escaping in subjects
            booking_time: `${booking.time}h00`, // Standardized
            school_name: booking.schoolName,
            commune: booking.commune,
            student_count: booking.studentCount,
            adult_count: booking.adultCount,
            class_level: booking.classLevel || "", // Added
            bus_info: booking.noBusRequired ? "Non" : `Oui ${booking.busInfo ? `(${booking.busInfo})` : ""}`, // Added
            teacher_phone: booking.phoneNumber,
            teacher_email: booking.email, // Added
            establishment_name: info.name,
            logo_url: info.logoUrl || "",
            header_bg_color: settings.headerBgColor || "#0f172a",
            reply_to: 'mediatheque@grandlongwy.fr', // No-reply strategy
            from_name: info.name,
            from_email: 'mediatheque@grandlongwy.fr'
        };

        // Si un template personnalisé existe, on pré-remplit le message
        // On envoie à la fois les paramètres classiques ET le message_html
        // L'utilisateur peut ainsi choisir d'utiliser l'un ou l'autre dans EmailJS
        let dynamicParams: any = { ...params };
        if (settings.emailTeacherTemplate) {
            dynamicParams.message_html = renderTemplate(settings.emailTeacherTemplate, params);
        }
        if (settings.emailTeacherSubject) {
            dynamicParams.subject = renderTemplate(settings.emailTeacherSubject, params);
        }

        try {
            await window.emailjs.send(TEACHER_SERVICE_ID, TEMPLATE_ID_CONFIRMATION_TEACHER, dynamicParams, TEACHER_PUBLIC_KEY);
            console.log('EmailJS: Confirmation enseignant envoyée.');
        } catch (error) {
            console.error('EmailJS Error (Confirmation):', error);
        }
    },

    sendAnimatorNotification: async (booking: Booking, animator: Animator, settings: AppSettings) => {
        if (!window.emailjs) return;
        
        if (settings.emailAnimatorEnabled === false) {
            console.log("EmailJS: Envoi de l'e-mail de notification (Animateur) désactivé dans les paramètres.");
            return;
        }
        
        if (!animator.email || animator.email.trim() === "") {
            return;
        }

        const targetEmail = animator.email.trim();
        const busInfoLabel = booking.noBusRequired 
            ? "Non" 
            : `Oui ${booking.busInfo ? `(${booking.busInfo})` : ""}`;
            
        const info = settings.establishmentInfo || { name: "Cité des Paysages", email: "", phone: "", address: "" };

        const params = {
            to_email: targetEmail,
            to_name: animator.name, // Added for compatibility
            animator_name: animator.name,
            animation_title: booking.animationTitle,
            teacher_name: booking.teacherName,
            class_level: booking.classLevel,
            school_name: booking.schoolName,
            commune: booking.commune,
            booking_date: formatLongDateOnlyFR(booking.date),
            booking_date_short: formatDateFR(booking.date),
            booking_date_clean: formatDateFR(booking.date).replace(/\//g, '.'),
            booking_time: `${booking.time}h00`,
            student_count: booking.studentCount,
            adult_count: booking.adultCount,
            bus_info: busInfoLabel,
            teacher_phone: booking.phoneNumber,
            teacher_email: booking.email,
            establishment_name: info.name,
            logo_url: info.logoUrl || "",
            header_bg_color: settings.headerBgColor || "#0f172a",
            reply_to: 'mediatheque@grandlongwy.fr',
            from_name: info.name,
            from_email: 'mediatheque@grandlongwy.fr'
        };

        let dynamicParams: any = { ...params };
        if (settings.emailAnimatorTemplate) {
            dynamicParams.message_html = renderTemplate(settings.emailAnimatorTemplate, params);
        }
        if (settings.emailAnimatorSubject) {
            dynamicParams.subject = renderTemplate(settings.emailAnimatorSubject, params);
        }

        try {
            await window.emailjs.send(MAIN_SERVICE_ID, TEMPLATE_ID_NOTIFICATION_ANIMATOR, dynamicParams, MAIN_PUBLIC_KEY);
            console.log('EmailJS: Notification animateur envoyée.');
        } catch (error) {
            console.error('EmailJS Error (Notification Animateur):', error);
        }
    },

    sendBookingList: async (recipientEmail: string, bookings: Booking[], settings: AppSettings) => {
        if (!window.emailjs || !recipientEmail) return;

        if (settings.emailListEnabled === false) {
            console.log("EmailJS: Envoi de l'e-mail récapitulatif (Liste de réservations) désactivé dans les paramètres.");
            return;
        }

        const info = settings.establishmentInfo || { name: "Médiathèque du Grand Longwy", logoUrl: "" };
        
        // Generate table rows with 5 columns as expected by the template
        const tableRows = bookings.map(b => `
            <tr>
                <td style="padding: 12px; font-size: 14px; color: #1e293b; border-bottom: 1px solid #edf2f7;">
                    <div style="font-weight: bold; color: #0f172a;">${b.animationTitle}</div>
                    <div style="font-weight: bold; color: #2563eb; font-size: 12px;">${formatLongDateFR(b.date, String(b.time))}</div>
                </td>
                <td style="padding: 12px; font-size: 14px; color: #1e293b; border-bottom: 1px solid #edf2f7;">${b.teacherName}</td>
                <td style="padding: 12px; font-size: 14px; color: #1e293b; border-bottom: 1px solid #edf2f7;">${b.schoolName} (${b.commune})</td>
                <td style="padding: 12px; font-size: 14px; color: #1e293b; border-bottom: 1px solid #edf2f7;">${b.classLevel}</td>
                <td style="padding: 12px; font-size: 14px; color: #1e293b; line-height: 1.4; border-bottom: 1px solid #edf2f7;">
                    <div>${b.studentCount} élèves</div>
                    <div style="color: #64748b; font-size: 12px;">${b.adultCount} adultes</div>
                </td>
            </tr>
        `).join('');

        const params: any = {
            to_email: recipientEmail,
            bookings_count: bookings.length,
            bookings_rows: tableRows, 
            establishment_name: info.name,
            logo_url: info.logoUrl || "",
            header_bg_color: settings.headerBgColor || "#059669",
            reply_to: 'mediatheque@grandlongwy.fr',
            from_name: info.name,
            from_email: 'mediatheque@grandlongwy.fr'
        };

        // Prepare the final payload for EmailJS
        let dynamicParams: any = { ...params };
        
        // If a template is defined, we render it locally
        if (settings.emailListTemplate) {
            dynamicParams.message_html = renderTemplate(settings.emailListTemplate, params);
            // CRITICAL: once message_html is generated, we can remove the large bookings_rows 
            // from the root of dynamicParams to avoid doubling the payload size if the EmailJS
            // dashboard template only uses {{message_html}}.
            // However, to keep compatibility with templates directly using {{bookings_rows}},
            // we'll keep it but we know we've already optimized its size above.
        }
        
        if (settings.emailListSubject) {
            dynamicParams.subject = renderTemplate(settings.emailListSubject, params);
        }

        try {
            await window.emailjs.send(TEACHER_SERVICE_ID, TEMPLATE_ID_BOOKING_LIST, dynamicParams, TEACHER_PUBLIC_KEY);
            console.log('EmailJS: Liste des réservations envoyée.');
        } catch (error) {
            console.error('EmailJS Error (Liste):', error);
            throw error;
        }
    }
};
