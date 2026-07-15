
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Animation, Booking, AppSettings, AdminUser, CustomLegalPage } from './types';
import { LEGAL_TEMPLATES } from './constants';
import { AppContext } from './AppContext';
import { dataService } from './services/dataService';
import { db, auth } from './services/firebase';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, writeBatch, doc, getDocs, where, limit, updateDoc } from 'firebase/firestore';
import { emailService } from './services/emailService';
import BookingSystem from './components/BookingSystem';
import AdminPanel from './components/AdminPanel';

export function App() {
  const [view, setView] = useState<View>(View.HOME);
  const [selectedAnimation, setSelectedAnimation] = useState<Animation | null>(null);
  const [selectedInfoPage, setSelectedInfoPage] = useState<CustomLegalPage | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  
  const [animations, setAnimations] = useState<Animation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    homepageTitle: "Réservez votre animation de classe",
    homepageSubtitle: "Choisissez une animation pour voir les créneaux disponibles",
    homepageBgColor: "#f8fafc",
    headerBgColor: "#ffffff",
    titleFontSize: "text-2xl",
    activeYear: "2025-2026",
    holidays: [],
    adminEmail: "",
    footerContent: "",
    headerInfoText: "",
    headerInfoFontSize: "text-[10px]",
    headerInfoFontWeight: "font-normal",
    headerInfoFontStyle: "normal",
    headerInfoColor: "#6b7280",
    headerInfoWidth: 200,
    animators: [],
    emailTeacherSubject: "✅ Confirmation : {{animation_title}} le {{booking_date_clean}}",
    emailTeacherTemplate: `<table style="font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="padding: 20px 0 30px 0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
<table style="border: 1px solid #e2e8f0; border-collapse: collapse; background-color: #ffffff; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" border="0" width="600" cellspacing="0" cellpadding="0" align="center">
<tbody>
<tr>
<td style="padding: 40px 0 30px 0; color: #000000; font-size: 26px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" align="center" bgcolor="{{header_bg_color}}">M&Eacute;DIATH&Egrave;QUE DU GRAND LONGWY</td>
</tr>
<tr>
<td style="padding: 40px 30px 20px 30px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
<table style="font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="color: #0f172a; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; font-size: 28px; font-weight: bold; text-transform: uppercase;">{{animation_title}}</td>
</tr>
<tr>
<td style="padding: 15px 0 25px 0; color: #64748b; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; font-size: 20px;">Bonjour {{to_name}}, votre r&eacute;servation a bien &eacute;t&eacute; enregistr&eacute;e.</td>
</tr>
<tr>
<td style="padding: 30px; color: #ffffff; text-align: center; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" bgcolor="#f8fafc">
<table style="font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="padding: 10px; border-right: 1px solid #e2e8f0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" width="50%">
<div style="font-size: 20px; font-weight: bold; color: #64748b; text-transform: uppercase; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">Date</div>
<div style="font-size: 20px; font-weight: bold; color: #0f172a; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">{{booking_date}}</div>
</td>
<td style="padding: 10px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" width="50%">
<div style="font-size: 20px; font-weight: bold; color: #64748b; text-transform: uppercase; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">Horaire</div>
<div style="font-size: 20px; font-weight: bold; color: #0f172a; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">{{booking_time}}</div>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td style="padding: 40px 0 10px 0; font-size: 20px; font-weight: bold; color: #4338ca; text-transform: uppercase; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">Votre classe</td>
</tr>
<tr>
<td style="padding: 15px 0 0 0; font-size: 20px; border-top: 1px solid #eef2ff; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; line-height: 1.5;"><strong>&Eacute;cole :</strong> {{school_name}} ({{commune}})<br><strong>Niveau :</strong> {{class_level}}<br><strong>Effectif :</strong> {{student_count}} &eacute;l&egrave;ves / {{adult_count}} adultes<br><strong>Transport :</strong> {{bus_info}}</td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td style="padding: 0 30px 40px 30px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
<table style="border: 1px solid #fef3c7; border-radius: 8px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" border="0" width="100%" cellspacing="0" cellpadding="0" bgcolor="#fffbeb">
<tbody>
<tr>
<td style="padding: 20px; font-size: 18px; color: #92400e; line-height: 24px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;"><strong>Note :</strong> pour toute demande de renseignement, modification ou annulation de rendez-vous, merci de nous contacter directement par t&eacute;l&eacute;phone au 03.82.23.15.76 ou par mail &agrave; l'adresse mediatheque@grandlongwy.fr</td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td style="padding: 40px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; font-size: 16px; color: #334155; text-align: center; line-height: 1.5;" align="center">Conform&eacute;ment au RGPD, vous disposez d'un droit d'acc&egrave;s et de rectification de vos donn&eacute;es. Ces informations sont utilis&eacute;es exclusivement pour la gestion de votre r&eacute;servation.</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>`,
    emailAnimatorSubject: "🗓️ {{animation_title}} le {{booking_date_clean}} @ {{booking_time}}",
    emailAnimatorTemplate: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Notification Réservation</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; background-color: #f1f5f9;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
        <tr>
            <td style="padding: 20px 0 30px 0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border: 1px solid #e2e8f0; border-collapse: collapse; background-color: #ffffff; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                    <tr>
                        <td align="center" bgcolor="{{header_bg_color}}" style="padding: 40px 0 30px 0; color: #000000; font-size: 26px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                            MÉDIATHÈQUE DU GRAND LONGWY
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px 40px 30px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                                <tr>
                                    <td style="color: #0f172a; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; font-size: 28px; font-weight: bold;">
                                        {{animation_title}}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 20px 0 30px 0; color: #1e293b; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; font-size: 22px; line-height: 24px;">
                                        Nouvelle réservation enregistrée pour cette séance.
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 2px solid #e2e8f0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                                            <tr>
                                                <td width="50%" style="padding: 20px; border-right: 1px solid #e2e8f0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                                                    <div style="font-size: 22px; font-weight: bold; color: #64748b; text-transform: uppercase; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">Date</div>
                                                    <div style="font-size: 22px; font-weight: bold; color: #0f172a; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">{{booking_date}}</div>
                                                </td>
                                                <td width="50%" style="padding: 20px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                                                    <div style="font-size: 22px; font-weight: bold; color: #64748b; text-transform: uppercase; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">Horaire</div>
                                                    <div style="font-size: 22px; font-weight: bold; color: #0f172a; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">{{booking_time}}</div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 35px 0 10px 0; font-size: 22px; font-weight: bold; color: #4338ca; text-transform: uppercase; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                                        Détails de la classe
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 0; font-size: 22px; border-top: 1px solid #eef2ff; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; line-height: 28px;">
                                        <b>Enseignant :</b> {{teacher_name}}<br/>
                                        <b>École :</b> {{school_name}} ({{commune}})<br/>
                                        <b>Effectif :</b> {{student_count}} élèves / {{adult_count}} adultes<br/>
                                        <b>Niveau :</b> {{class_level}}<br/>
                                        <b>Transport :</b> {{bus_info}}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 0 20px 0; font-size: 22px; font-weight: bold; color: #059669; text-transform: uppercase; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                                        Contact enseignant
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 0; font-size: 22px; border-top: 1px solid #ecfdf5; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; line-height: 28px;">
                                        <b>Téléphone :</b> {{teacher_phone}}<br/>
                                        <b>E-mail :</b> {{teacher_email}}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
    emailListSubject: "📋 Récapitulatif : {{bookings_count}} réservations sélectionnées",
    emailListTemplate: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Liste des Réservations</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style type="text/css">
        /* Disable automatic underlining and coloring of address/location links added by Outlook */
        a, a:hover, a:active, a:focus, span.MsoHyperlink, span.MsoHyperlinkFollowed {
            color: inherit !important;
            text-decoration: none !important;
            border-bottom: none !important;
        }
        /* Specific elements for detected data */
        [x-apple-data-detectors], .x-gmail-data-detectors, .x-gmail-data-detectors *, .aBn {
            border-bottom: none !important;
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; background-color: #f1f5f9;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
        <tr>
            <td style="padding: 20px 0 30px 0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="800" style="border: 1px solid #e2e8f0; border-collapse: collapse; background-color: #ffffff; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                    <tr>
                        <td align="center" bgcolor="{{header_bg_color}}" style="padding: 40px 0 30px 0; color: #000000; font-size: 26px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                            MÉDIATHÈQUE DU GRAND LONGWY
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px 10px 30px;">
                            <h1 style="margin: 0; color: #0f172a; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; font-size: 28px; font-weight: bold; text-transform: uppercase; line-height: 1.2;">
                                Liste des réservations
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 30px 30px;">
                            <p style="margin: 0; color: #64748b; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; font-size: 20px; line-height: 1.5;">
                                Voici le récapitulatif de vos accueils de classes.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 20px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #e2e8f0; font-family: sans-serif;">
                                <thead>
                                    <tr style="background-color: #f8fafc; text-align: left;">
                                        <th width="25%" style="padding: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; border-right: 1px solid #e2e8f0; border-bottom: 2px solid #e2e8f0;">Animation / Date</th>
                                        <th width="20%" style="padding: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; border-right: 1px solid #e2e8f0; border-bottom: 2px solid #e2e8f0;">Enseignant</th>
                                        <th width="25%" style="padding: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; border-right: 1px solid #e2e8f0; border-bottom: 2px solid #e2e8f0;">École / Commune</th>
                                        <th width="15%" style="padding: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; border-right: 1px solid #e2e8f0; border-bottom: 2px solid #e2e8f0;">Niveau</th>
                                        <th width="15%" style="padding: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">Effectifs</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {{bookings_rows}}
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 40px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#fffbeb" style="border: 1px solid #fef3c7; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 20px; font-size: 18px; color: #92400e; line-height: 24px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                                        <b>Note :</b> pour toute demande de renseignement, modification ou annulation de rendez-vous, merci de nous contacter directement par téléphone au 03.82.23.15.76 ou par mail à l'adresse mediatheque@grandlongwy.fr
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 40px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; font-size: 16px; color: #334155; text-align: center; line-height: 1.5;">
                                                                                    Conformément au RGPD, vous disposez d'un droit d'accès et de rectification de vos données. 
                             Ces informations sont utilisées exclusivement pour la gestion de vos réservations.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
    emailReminderEnabled: true,
    emailReminderDays: 2,
    emailReminderSubject: "⏰ Rappel : {{animation_title}} le {{booking_date_clean}}",
    emailReminderTargetTeachers: true,
    emailReminderTargetAnimators: false,
    emailReminderTemplate: `<table style="font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="padding: 20px 0 30px 0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
<table style="border: 1px solid #e2e8f0; border-collapse: collapse; background-color: #ffffff; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" border="0" width="600" cellspacing="0" cellpadding="0" align="center">
<tbody>
<tr>
<td style="padding: 40px 0 30px 0; color: #000000; font-size: 26px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" align="center" bgcolor="{{header_bg_color}}">M&Eacute;DIATH&Egrave;QUE DU GRAND LONGWY</td>
</tr>
<tr>
<td style="padding: 40px 30px 20px 30px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
<table style="font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="color: #0f172a; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; font-size: 28px; font-weight: bold; text-transform: uppercase;">⏰ RAPPEL : {{animation_title}}</td>
</tr>
<tr>
<td style="padding: 15px 0 25px 0; color: #64748b; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; font-size: 20px;">Bonjour {{to_name}}, ceci est un rappel pour votre accueil de classe programmé très prochainement.</td>
</tr>
<tr>
<td style="padding: 30px; color: #ffffff; text-align: center; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" bgcolor="#f8fafc">
<table style="font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="padding: 10px; border-right: 1px solid #e2e8f0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" width="50%">
<div style="font-size: 20px; font-weight: bold; color: #64748b; text-transform: uppercase; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">Date</div>
<div style="font-size: 20px; font-weight: bold; color: #0f172a; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">{{booking_date}}</div>
</td>
<td style="padding: 10px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" width="50%">
<div style="font-size: 20px; font-weight: bold; color: #64748b; text-transform: uppercase; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">Horaire</div>
<div style="font-size: 20px; font-weight: bold; color: #0f172a; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">{{booking_time}}</div>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td style="padding: 40px 0 10px 0; font-size: 20px; font-weight: bold; color: #4338ca; text-transform: uppercase; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">Votre classe</td>
</tr>
<tr>
<td style="padding: 15px 0 0 0; font-size: 20px; border-top: 1px solid #eef2ff; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; line-height: 1.5;"><strong>&Eacute;cole :</strong> {{school_name}} ({{commune}})<br><strong>Niveau :</strong> {{class_level}}<br><strong>Effectif :</strong> {{student_count}} &eacute;l&egrave;ves / {{adult_count}} adultes<br><strong>Transport :</strong> {{bus_info}}</td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td style="padding: 0 30px 40px 30px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
<table style="border: 1px solid #fef3c7; border-radius: 8px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" border="0" width="100%" cellspacing="0" cellpadding="0" bgcolor="#fffbeb">
<tbody>
<tr>
<td style="padding: 20px; font-size: 18px; color: #92400e; line-height: 24px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;"><strong>Note :</strong> pour toute demande de renseignement, modification ou annulation de rendez-vous, merci de nous contacter directement par t&eacute;l&eacute;phone au 03.82.23.15.76 ou par mail &agrave; l'adresse mediatheque@grandlongwy.fr</td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td style="padding: 40px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; font-size: 16px; color: #334155; text-align: center; line-height: 1.5;" align="center">Conform&eacute;ment au RGPD, vous disposez d'un droit d'acc&egrave;s et de rectification de vos donn&eacute;es. Ces informations sont utilis&eacute;es exclusivement pour la gestion de votre r&eacute;servation.</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>`,
    ...LEGAL_TEMPLATES
  } as AppSettings);

  // 1. Chargement des paramètres (toujours actif)
  useEffect(() => {
    if (!db) {
        setSettingsLoaded(true);
        return;
    }

    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as AppSettings;
        
        // Ensure legal templates have defaults if missing in DB
        const mergedData = { ...data };
        if (!mergedData.legalNoticeTitle) mergedData.legalNoticeTitle = settings.legalNoticeTitle;
        if (!mergedData.legalNotice) mergedData.legalNotice = settings.legalNotice;
        if (!mergedData.privacyPolicyTitle) mergedData.privacyPolicyTitle = settings.privacyPolicyTitle;
        if (!mergedData.privacyPolicy) mergedData.privacyPolicy = settings.privacyPolicy;
        if (!mergedData.cookiesPolicyTitle) mergedData.cookiesPolicyTitle = settings.cookiesPolicyTitle;
        if (!mergedData.cookiesPolicy) mergedData.cookiesPolicy = settings.cookiesPolicy;
        if (!mergedData.emailListSubject) mergedData.emailListSubject = settings.emailListSubject;
        if (!mergedData.emailListTemplate) mergedData.emailListTemplate = settings.emailListTemplate;
        if (mergedData.emailReminderEnabled === undefined) mergedData.emailReminderEnabled = true;
        if (mergedData.emailReminderDays === undefined) mergedData.emailReminderDays = 2;
        if (mergedData.emailReminderTargetTeachers === undefined) mergedData.emailReminderTargetTeachers = true;
        if (mergedData.emailReminderTargetAnimators === undefined) mergedData.emailReminderTargetAnimators = false;
        if (!mergedData.emailReminderSubject) mergedData.emailReminderSubject = settings.emailReminderSubject;
        if (!mergedData.emailReminderTemplate) mergedData.emailReminderTemplate = settings.emailReminderTemplate;

        // Auto-migration to align existing DB templates with the new styling requirements
        let needsMigration = false;

        // 1. Teacher Email Template
        if (mergedData.emailTeacherTemplate && mergedData.emailTeacherTemplate.includes('font-size: 14px; color: #94a3b8;')) {
          mergedData.emailTeacherTemplate = mergedData.emailTeacherTemplate.replace(
            'font-size: 14px; color: #94a3b8;',
            'font-size: 16px; color: #334155;'
          );
          needsMigration = true;
        }

        // 2. Animator Email Template (removing auto email notification footer)
        if (mergedData.emailAnimatorTemplate) {
          let updatedAnimatorTemplate = mergedData.emailAnimatorTemplate;
          const searchTxts = [
            "Cet e-mail est envoyé automatiquement, merci de ne pas y répondre directement.",
            "E-mail automatique - Plateforme de réservation"
          ];
          searchTxts.forEach(txt => {
            if (updatedAnimatorTemplate.includes(txt)) {
              // Try replacing whole <tr> if matches standard pattern
              const regex = new RegExp(`\\s*<tr>\\s*<td[^>]*>\\s*${txt}\\s*</td>\\s*</tr>`, 'g');
              if (regex.test(updatedAnimatorTemplate)) {
                updatedAnimatorTemplate = updatedAnimatorTemplate.replace(regex, '');
              } else {
                updatedAnimatorTemplate = updatedAnimatorTemplate.replace(txt, '');
              }
              needsMigration = true;
            }
          });
          if (needsMigration) {
            mergedData.emailAnimatorTemplate = updatedAnimatorTemplate;
          }
        }

        // 3. Recap/List Email Template
        if (mergedData.emailListTemplate) {
          if (mergedData.emailListTemplate.includes('font-size: 14px; color: #94a3b8;')) {
            mergedData.emailListTemplate = mergedData.emailListTemplate.replace(
              'font-size: 14px; color: #94a3b8;',
              'font-size: 16px; color: #334155;'
            );
            needsMigration = true;
          }
          const oldListFooter = `                    <tr>\n                        <td align="center" style="padding: 40px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; font-size: 14px; color: #94a3b8; text-align: center; line-height: 1.5;">\n                            Ce récapitulatif a été généré depuis la plateforme d'administration.\n                        </td>\n                    </tr>`;
          if (mergedData.emailListTemplate.includes(oldListFooter)) {
            const newListFooter = `                    <tr>\n                        <td align="center" style="padding: 40px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; font-size: 16px; color: #334155; text-align: center; line-height: 1.5;">\n                            Cet e-mail est envoyé automatiquement, merci de ne pas y répondre directement.\n                            <br/><br/>\n                            Conformément au RGPD, vous disposez d'un droit d'accès et de rectification de vos données. \n                            Ces informations sont utilisées exclusivement pour la gestion de vos réservations.\n                        </td>\n                    </tr>`;
            mergedData.emailListTemplate = mergedData.emailListTemplate.replace(oldListFooter, newListFooter);
            needsMigration = true;
          }
          
          // Migrate header row borders to individual headers (for Outlook border-bottom bug on TR)
          if (mergedData.emailListTemplate.includes('tr style="background-color: #f8fafc; text-align: left; border-bottom: 2px solid #e2e8f0;"')) {
            mergedData.emailListTemplate = mergedData.emailListTemplate
              .replace(
                'tr style="background-color: #f8fafc; text-align: left; border-bottom: 2px solid #e2e8f0;"',
                'tr style="background-color: #f8fafc; text-align: left;"'
              )
              .replace(
                /style="padding: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; border-right: 1px solid #e2e8f0;"/g,
                'style="padding: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; border-right: 1px solid #e2e8f0; border-bottom: 2px solid #e2e8f0;"'
              )
              .replace(
                /style="padding: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b;"/g,
                'style="padding: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;"'
              );
            needsMigration = true;
          }

          // Inject Outlook data style override in <head> if missing
          if (!mergedData.emailListTemplate.includes('span.MsoHyperlink') && !mergedData.emailListTemplate.includes('span.MsoHyperlinkFollowed')) {
            const headTail = '</head>';
            const injection = `    <style type="text/css">
        /* Disable automatic underlining and coloring of address/location links added by Outlook */
        a, a:hover, a:active, a:focus, span.MsoHyperlink, span.MsoHyperlinkFollowed {
            color: inherit !important;
            text-decoration: none !important;
            border-bottom: none !important;
        }
        /* Specific elements for detected data */
        [x-apple-data-detectors], .x-gmail-data-detectors, .x-gmail-data-detectors *, .aBn {
            border-bottom: none !important;
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }
    </style>\n</head>`;
            mergedData.emailListTemplate = mergedData.emailListTemplate.replace(headTail, injection);
            needsMigration = true;
          }
        }

        if (needsMigration && !snapshot.metadata.fromCache) {
          console.log("Migrating email templates to match new style requirements...", mergedData);
          dataService.saveSettings(mergedData).catch(e => console.error("Auto-migration of settings failed:", e));
        }

        // The data from Firestore should be the source of truth for all fields it contains.
        // We use a functional update to ensure we have the latest defaults if needed,
        // but we prioritize Firestore data (mergedData).
        setSettings(prev => ({
            ...prev,
            ...mergedData,
            // Explicitly clear optional fields if they are omitted/deleted in Firestore
            registrationFormUrl: mergedData.registrationFormUrl !== undefined ? mergedData.registrationFormUrl : undefined,
            registrationFormName: mergedData.registrationFormName !== undefined ? mergedData.registrationFormName : undefined,
            // Explicitly handle fields that might be empty/deleted in Firestore
            // but we want to ensure stay objects/arrays
            animators: mergedData.animators || prev.animators || [],
            animatorSettings: mergedData.animatorSettings || {}, // If missing in DB, it's empty
            holidays: mergedData.holidays || prev.holidays || [],
            availableTimeSlots: mergedData.availableTimeSlots || prev.availableTimeSlots || [9, 10, 14, 15],
            infoPages: mergedData.infoPages || prev.infoPages || []
        }));
      }
      setSettingsLoaded(true);
    }, (err) => { 
      console.error("Erreur Snapshot Settings:", err); 
      setSettingsLoaded(true);
    });

    return () => unsubSettings();
  }, []);

  // 2. Chargement des données métier (filtré par année scolaire pour économiser les quotas)
  useEffect(() => {
    if (!db || !settingsLoaded) return;

    let animationsLoaded = false;
    let bookingsLoaded = false;

    const checkAllLoaded = () => {
        if (animationsLoaded && bookingsLoaded) {
            setIsDataLoading(false);
        }
    };

    // Chargement des animations (fixe)
    const qAnims = query(collection(db, "animations"), orderBy("order", "asc"));
    const unsubAnimations = onSnapshot(qAnims, (snapshot) => {
      setAnimations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Animation)));
      animationsLoaded = true;
      checkAllLoaded();
    }, (err) => { 
      console.error("Erreur Snapshot Animations:", err);
      animationsLoaded = true;
      checkAllLoaded();
    });

    // Filtre des réservations par année scolaire (OPTIMISATION CRITIQUE)
    // On ne récupère que les réservations de l'année scolaire active pour éviter de lire 
    // des milliers de vieux documents à chaque chargement.
    const [yearStart] = settings.activeYear.split('-').map(Number);
    const startDate = `${yearStart}-01-01`; // On prend large pour couvrir l'année
    const endDate = `${yearStart + 1}-12-31`;

    const qBookings = query(
        collection(db, "bookings"), 
        where("date", ">=", startDate), 
        where("date", "<=", endDate)
    );

    const unsubBookings = onSnapshot(qBookings, (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
      bookingsLoaded = true;
      checkAllLoaded();
    }, (err) => { 
      console.error("Erreur Snapshot Bookings filtré:", err); 
      // Si l'index n'est pas encore créé, on peut avoir une erreur, fallback sans filtre si nécessaire 
      // mais en production l'index sera là.
      bookingsLoaded = true;
      checkAllLoaded();
    });

    return () => {
      unsubAnimations(); unsubBookings();
    };
  }, [db, settingsLoaded, settings.activeYear]);

  // Automated email reminders check
  useEffect(() => {
    if (!db || bookings.length === 0 || !settings.emailReminderEnabled) return;

    // Trigger reminders only if a user is logged in (admin/animator) to avoid visitors' sessions initiating parallel triggers
    if (!currentUser) return;

    const runRemindersCheck = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const reminderDays = settings.emailReminderDays || 2;

      for (const booking of bookings) {
        if (booking.reminderSent) continue;

        const bookingDate = new Date(booking.date);
        bookingDate.setHours(0, 0, 0, 0);

        // Diff in days
        const diffTime = bookingDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // If booking is within the reminder threshold (between 1 and reminderDays)
        if (diffDays > 0 && diffDays <= reminderDays) {
          console.log(`Envoi du rappel pour la réservation ${booking.id} (${booking.teacherName}) - Prévue dans ${diffDays} jours`);
          
          try {
            // First, update the flag in Firestore to prevent duplicate triggers
            const bookingRef = doc(db, "bookings", booking.id);
            await updateDoc(bookingRef, { reminderSent: true });
            
            // Then send the email
            await emailService.sendBookingReminder(booking, settings, animations);
            console.log(`Rappel envoyé avec succès pour ${booking.id}`);
          } catch (e) {
            console.error(`Erreur lors de l'envoi du rappel pour ${booking.id}:`, e);
          }
        }
      }
    };

    const timer = setTimeout(() => {
      runRemindersCheck();
    }, 5000);

    return () => clearTimeout(timer);
  }, [db, bookings, settings, currentUser]);

  // Auto-cleanup logic
  useEffect(() => {
    if (!db || !settings.autoCleanupEnabled) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    const currentDay = now.getDate();

    const targetMonth = settings.cleanupMonth ?? 7; // August
    const targetDay = settings.cleanupDay ?? 1;

    // Check if we should run cleanup
    // We run it if:
    // 1. We haven't run it this year yet (lastCleanupYear < currentYear)
    // 2. Today is >= the target date
    const shouldRun = (settings.lastCleanupYear || 0) < currentYear && 
                      (currentMonth > targetMonth || (currentMonth === targetMonth && currentDay >= targetDay));

    if (shouldRun) {
      const runCleanup = async () => {
        try {
          // Determine the school year to clean up
          // If we are in August 2026, we clean up "2025-2026"
          const prevYear = currentYear - 1;
          const schoolYearToClean = `${prevYear}-${currentYear}`;
          
          console.log(`Running auto-cleanup for school year: ${schoolYearToClean}`);

          const bookingsRef = collection(db, "bookings");
          // We don't have a schoolYear field on bookings, but we can filter by date
          // School year usually starts in Sept (month 8) and ends in June (month 5)
          // Oct 2025 to June 2026
          const startDate = `${prevYear}-08-01`; // Start of cleanup range
          const endDate = `${currentYear}-07-31`;   // End of cleanup range

          const q = query(
            bookingsRef, 
            where("date", ">=", startDate),
            where("date", "<=", endDate)
          );

          const snapshot = await getDocs(q);
          if (snapshot.empty) {
            console.log("No bookings found for cleanup range.");
          } else {
            const batch = writeBatch(db);
            let count = 0;
            snapshot.docs.forEach((d) => {
              const data = d.data();
              // Only anonymize if not already anonymized
              if (data.teacherName !== "[Anonymisé]") {
                batch.update(d.ref, {
                  teacherName: "[Anonymisé]",
                  phoneNumber: "[Anonymisé]",
                  email: "[Anonymisé]"
                });
                count++;
              }
            });

            if (count > 0) {
              await batch.commit();
              console.log(`${count} bookings anonymized.`);
            }
          }

          // Update settings to mark cleanup as done for this year
          await dataService.saveSettings({
            ...settings,
            lastCleanupYear: currentYear
          });

        } catch (error) {
          console.error("Error during auto-cleanup:", error);
        }
      };

      runCleanup();
    }
  }, [db, settings]);

  const saveAnimation = useCallback(async (animation: Animation) => {
    await dataService.saveAnimation(animation);
  }, []);

  const removeAnimation = useCallback(async (animationId: string) => {
    await dataService.removeAnimation(animationId);
  }, []);

  const updateAnimationsOrder = useCallback((newAnimations: Animation[]) => {
    const orderedAnims = newAnimations.map((anim, index) => ({
        ...anim,
        order: index
    }));
    
    setAnimations(orderedAnims);
    
    // Sauvegarde persistante de l'ordre
    orderedAnims.forEach(anim => dataService.saveAnimation(anim));
  }, []);

  const saveBooking = useCallback(async (booking: Booking) => {
    await dataService.saveBooking(booking);
  }, []);

  const removeBooking = useCallback(async (bookingId: string) => {
    await dataService.removeBooking(bookingId);
  }, []);

  const updateBookings = useCallback((newBookings: Booking[]) => {
    setBookings(newBookings);
    if (db) dataService.saveBookings(newBookings);
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    try {
      // 1. Mise à jour de l'état local immédiatement pour la réactivité UI
      let mergedSettings: AppSettings | null = null;
      setSettings(prev => {
        mergedSettings = { ...prev, ...newSettings };
        return mergedSettings;
      });

      // 2. Persistance dans Firestore (en dehors du setter d'état)
      if (mergedSettings) {
        await dataService.saveSettings(mergedSettings);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des paramètres:", error);
      throw error;
    }
  }, []);
  
  const appContextValue = useMemo(() => ({
    animations,
    bookings,
    settings,
    currentUser,
    setCurrentUser,
    saveAnimation,
    removeAnimation,
    saveBooking,
    removeBooking,
    updateSettings,
    updateAnimationsOrder,
    updateBookings,
  }), [animations, bookings, settings, currentUser, saveAnimation, removeAnimation, saveBooking, removeBooking, updateSettings, updateAnimationsOrder, updateBookings]);

  const handleSelectAnimation = (animation: Animation) => {
    setSelectedAnimation(animation);
    setView(View.CALENDAR);
  };

  const handleBackToHome = () => {
    setSelectedAnimation(null);
    setSelectedInfoPage(null);
    setView(View.HOME);
    window.scrollTo(0, 0);
  };

  const handleNavigate = (newView: View) => {
    setView(newView);
    window.scrollTo(0, 0);
  };

  if (!settingsLoaded || isDataLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Initialisation des données...</p>
      </div>
    );
  }

  return (
    <AppContext.Provider value={appContextValue}>
      <div className="min-h-screen">
        {isAdmin ? (
          <AdminPanel onLogout={async () => { 
            setIsAdmin(false); 
            setCurrentUser(null); 
            handleBackToHome(); 
            if (auth) await signOut(auth);
          }} />
        ) : (
          <BookingSystem 
            view={view}
            selectedAnimation={selectedAnimation}
            onSelectAnimation={handleSelectAnimation}
            onBackToHome={handleBackToHome}
            onNavigate={handleNavigate}
            onNavigateToAdmin={() => setView(View.ADMIN_LOGIN)}
            onAdminLogin={() => setIsAdmin(true)}
            selectedInfoPage={selectedInfoPage}
            onSelectInfoPage={setSelectedInfoPage}
          />
        )}
      </div>
    </AppContext.Provider>
  );
}

