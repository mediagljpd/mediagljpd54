
import React, { useState, useContext, useEffect, useRef, useMemo } from 'react';
import { AppContext } from '../../AppContext';
import { AppSettings } from '../../types';
import { LEGAL_TEMPLATES } from '../../constants';
import { AdminSubComponentProps } from './types';
import { storageService } from '../../services/storageService';
import { backupService } from '../../services/backupService';
import ConfirmationModal from '../shared/ConfirmationModal';
import { PaintBrushIcon, PaletteIcon, CogIcon, BellIcon, ClockIcon, CalendarDaysIcon, PlusCircleIcon, PencilIcon, CheckIcon, XIcon, TrashIcon, DatabaseIcon, MapPinIcon, AcademicCapIcon, BuildingLibraryIcon, ListIcon, UserGroupIcon, ViewGridIcon, SortAscIcon, SortDescIcon, DownloadIcon, ShieldCheckIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, InformationCircleIcon, SendIcon, ArrowUturnLeftIcon } from '../Icons';
import * as XLSX from 'xlsx';
import { validatePassword } from '../../utils/validators';
import PasswordPolicy from './PasswordPolicy';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import ManageUsers from './ManageUsers';
import ManageStats from './ManageStats';

type SettingsTab = 'design' | 'rules' | 'data' | 'stats' | 'users' | 'footer' | 'security' | 'pages' | 'maintenance' | 'emails' | 'information';

const DEFAULT_EMAIL_TEACHER_SUBJECT = "✅ Confirmation : {{animation_title}} le {{booking_date_clean}}";
const DEFAULT_EMAIL_TEACHER_TEMPLATE = `<body style="margin: 0; padding: 0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; background-color: #f1f5f9;">
<table style="font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" border="0" width="100%" cellspacing="0" cellpadding="0">
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
</table>`;

const DEFAULT_EMAIL_REMINDER_SUBJECT = "⏰ Rappel : {{animation_title}} le {{booking_date_clean}}";
const DEFAULT_EMAIL_REMINDER_TEMPLATE = `<table style="font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;" border="0" width="100%" cellspacing="0" cellpadding="0">
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
</table>`;

const DEFAULT_EMAIL_ANIMATOR_SUBJECT = "🗓️ {{animation_title}} le {{booking_date_clean}} @ {{booking_time}}";
const DEFAULT_EMAIL_ANIMATOR_TEMPLATE = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
</html>`;

const DEFAULT_EMAIL_LIST_SUBJECT = "📋 Récapitulatif : {{bookings_count}} réservations sélectionnées";
const DEFAULT_EMAIL_LIST_TEMPLATE = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
                                    {{{bookings_rows}}}
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
</html>
`;

const ManageSettings: React.FC<AdminSubComponentProps> = ({ 
    showNotification,
    setHasUnsavedChanges,
    registerSave,
    registerCancel
}) => {
    const { settings, updateSettings, currentUser } = useContext(AppContext);

    const [formState, setFormState] = useState<AppSettings>(() => ({ ...settings }));
    const [activeTab, setActiveTab] = useState<SettingsTab>('design');
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
    
    // States for password and identity change workflow
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityError, setSecurityError] = useState<string | null>(null);

    // States for image uploads
    const [uploadingField, setUploadingField] = useState<string | null>(null);

    // State for editing legal pages
    const [editingLegalPage, setEditingLegalPage] = useState<'legalNotice' | 'privacyPolicy' | 'cookiesPolicy' | null>(null);

    // State for info pages
    const [editingInfoPageId, setEditingInfoPageId] = useState<string | null>(null);
    const [isEditorMaximized, setIsEditorMaximized] = useState(false);

    // Temp state for new time slot input
    const [newSlotTime, setNewSlotTime] = useState<string>('');

    const isInitializedRef = useRef(false);
    const prevSettingsRef = useRef<AppSettings>(settings);

    const quillLegalRef = useRef<any>(null);
    const quillInfoRef = useRef<any>(null);

    useEffect(() => {
        // Migration/Defaults for new fields
        const migSettings = { ...settings };
        if (migSettings.bookingLeadTime === undefined) migSettings.bookingLeadTime = 14;
        if (!migSettings.allowedDays) migSettings.allowedDays = [2, 4];
        if (!migSettings.availableTimeSlots) migSettings.availableTimeSlots = [9, 10, 14, 15];
        
        if (!migSettings.classLevels) migSettings.classLevels = ['PS', 'GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'];
        if (!migSettings.communes) migSettings.communes = [];
        if (!migSettings.schools) migSettings.schools = [];
        
        // Ensure Monday (1) is removed if it was previously selected
        if (migSettings.allowedDays.includes(1)) {
            migSettings.allowedDays = migSettings.allowedDays.filter(d => d !== 1);
        }
        
        if (migSettings.autoCleanupEnabled === undefined) migSettings.autoCleanupEnabled = false;
        if (migSettings.cleanupDay === undefined) migSettings.cleanupDay = 1;
        if (migSettings.cleanupMonth === undefined) migSettings.cleanupMonth = 7; // August (0-indexed)
        if (!migSettings.infoPages) migSettings.infoPages = [];
        if (migSettings.emailReminderTargetTeachers === undefined) migSettings.emailReminderTargetTeachers = true;
        if (migSettings.emailReminderTargetAnimators === undefined) migSettings.emailReminderTargetAnimators = false;
        if (migSettings.enableBookingStatus === undefined) migSettings.enableBookingStatus = false;
        if (migSettings.emailAnimatorOnValidationEnabled === undefined) migSettings.emailAnimatorOnValidationEnabled = true;
        
        if (!isInitializedRef.current) {
            setFormState(migSettings);
            isInitializedRef.current = true;
        } else {
            // Update fields in formState only if they were NOT modified by the user
            setFormState(prev => {
                const updated = { ...prev };
                const prevSettings = prevSettingsRef.current;
                
                Object.keys(migSettings).forEach(k => {
                    const key = k as keyof AppSettings;
                    // Strict comparison to see if user has modified the field locally since the last settings update.
                    // If unchanged, we pull the freshest external value.
                    const isLocalUnchanged = JSON.stringify(prev[key]) === JSON.stringify(prevSettings[key]);
                    if (isLocalUnchanged || prev[key] === undefined) {
                        (updated as any)[key] = migSettings[key];
                    }
                });
                return updated;
            });
        }
        prevSettingsRef.current = settings;
    }, [settings]);

    const isDirty = useMemo(() => {
        // Run identical migrations to match formState default keys
        const migSettings = { ...settings };
        if (migSettings.bookingLeadTime === undefined) migSettings.bookingLeadTime = 14;
        if (!migSettings.allowedDays) migSettings.allowedDays = [2, 4];
        if (!migSettings.availableTimeSlots) migSettings.availableTimeSlots = [9, 10, 14, 15];
        if (!migSettings.classLevels) migSettings.classLevels = ['PS', 'GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'];
        if (!migSettings.communes) migSettings.communes = [];
        if (!migSettings.schools) migSettings.schools = [];
        if (migSettings.allowedDays.includes(1)) {
            migSettings.allowedDays = migSettings.allowedDays.filter(d => d !== 1);
        }
        if (migSettings.autoCleanupEnabled === undefined) migSettings.autoCleanupEnabled = false;
        if (migSettings.cleanupDay === undefined) migSettings.cleanupDay = 1;
        if (migSettings.cleanupMonth === undefined) migSettings.cleanupMonth = 7;
        if (!migSettings.infoPages) migSettings.infoPages = [];
        if (migSettings.emailReminderTargetTeachers === undefined) migSettings.emailReminderTargetTeachers = true;
        if (migSettings.emailReminderTargetAnimators === undefined) migSettings.emailReminderTargetAnimators = false;
        if (migSettings.enableBookingStatus === undefined) migSettings.enableBookingStatus = false;
        if (migSettings.emailAnimatorOnValidationEnabled === undefined) migSettings.emailAnimatorOnValidationEnabled = true;

        return JSON.stringify(formState) !== JSON.stringify(migSettings);
    }, [formState, settings]);

    useEffect(() => {
        if (setHasUnsavedChanges) {
            setHasUnsavedChanges(currentUser?.role === 'admin' && isDirty);
        }
        return () => {
            if (setHasUnsavedChanges) {
                setHasUnsavedChanges(false);
            }
        };
    }, [isDirty, setHasUnsavedChanges, currentUser]);

    const handleSaveRef = useRef<((e?: React.FormEvent) => void) | null>(null);
    handleSaveRef.current = (e) => {
        handleSave(e || { preventDefault: () => {} } as React.FormEvent);
    };

    const handleCancel = () => {
        // Rebuild clean migrated settings from current database/context settings
        const migSettings = { ...settings };
        if (migSettings.bookingLeadTime === undefined) migSettings.bookingLeadTime = 14;
        if (!migSettings.allowedDays) migSettings.allowedDays = [2, 4];
        if (!migSettings.availableTimeSlots) migSettings.availableTimeSlots = [9, 10, 14, 15];
        if (!migSettings.classLevels) migSettings.classLevels = ['PS', 'GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'];
        if (!migSettings.communes) migSettings.communes = [];
        if (!migSettings.schools) migSettings.schools = [];
        if (migSettings.allowedDays.includes(1)) {
            migSettings.allowedDays = migSettings.allowedDays.filter(d => d !== 1);
        }
        if (migSettings.autoCleanupEnabled === undefined) migSettings.autoCleanupEnabled = false;
        if (migSettings.cleanupDay === undefined) migSettings.cleanupDay = 1;
        if (migSettings.cleanupMonth === undefined) migSettings.cleanupMonth = 7;
        if (!migSettings.infoPages) migSettings.infoPages = [];
        if (migSettings.emailReminderTargetTeachers === undefined) migSettings.emailReminderTargetTeachers = true;
        if (migSettings.emailReminderTargetAnimators === undefined) migSettings.emailReminderTargetAnimators = false;
        if (migSettings.enableBookingStatus === undefined) migSettings.enableBookingStatus = false;
        if (migSettings.emailAnimatorOnValidationEnabled === undefined) migSettings.emailAnimatorOnValidationEnabled = true;

        setFormState(migSettings);
        prevSettingsRef.current = settings;

        // Reset temporary security inputs if any
        setIsChangingPassword(false);
        setNewPassword('');
        setConfirmPassword('');
        setSecurityError(null);

        showNotification("Modifications annulées. L'état précédent a été restauré.");
    };

    const handleCancelRef = useRef<(() => void) | null>(null);
    handleCancelRef.current = handleCancel;

    useEffect(() => {
        if (registerSave) {
            registerSave(() => {
                if (handleSaveRef.current) {
                    handleSaveRef.current();
                }
            });
        }
    }, [registerSave]);

    useEffect(() => {
        if (registerCancel) {
            registerCancel(() => {
                if (handleCancelRef.current) {
                    handleCancelRef.current();
                }
            });
        }
    }, [registerCancel]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState({ ...formState, [name]: value });
    };

    const handleToggleDay = (day: number) => {
        const currentDays = [...(formState.allowedDays || [])];
        if (currentDays.includes(day)) {
            setFormState({ ...formState, allowedDays: currentDays.filter(d => d !== day) });
        } else {
            setFormState({ ...formState, allowedDays: [...currentDays, day].sort() });
        }
    };

    const handleAddTimeSlot = () => {
        const time = parseInt(newSlotTime);
        if (isNaN(time) || time < 0 || time > 23) {
            alert("Veuillez entrer une heure valide (0-23).");
            return;
        }
        if (formState.availableTimeSlots.includes(time)) {
            alert("Ce créneau existe déjà.");
            return;
        }
        setFormState({
            ...formState,
            availableTimeSlots: [...formState.availableTimeSlots, time].sort((a, b) => a - b)
        });
        setNewSlotTime('');
    };

    const handleRemoveTimeSlot = (time: number) => {
        setFormState({
            ...formState,
            availableTimeSlots: formState.availableTimeSlots.filter(t => t !== time)
        });
    };

    const handleAddFooterLink = () => {
        const newLink = { id: Date.now().toString(), label: 'Nouveau lien', url: '' };
        setFormState({
            ...formState,
            footerLinks: [...(formState.footerLinks || []), newLink]
        });
    };

    const handleRemoveFooterLink = (id: string) => {
        setFormState({
            ...formState,
            footerLinks: (formState.footerLinks || []).filter(l => l.id !== id)
        });
    };

    const handleUpdateFooterLink = (id: string, field: 'label' | 'url' | 'content', value: string) => {
        setFormState({
            ...formState,
            footerLinks: (formState.footerLinks || []).map(l => l.id === id ? { ...l, [field]: value } : l)
        });
    };

    const handleUpdateEstablishmentInfo = (field: string, value: any) => {
        setFormState({
            ...formState,
            establishmentInfo: {
                ...(formState.establishmentInfo || { name: '', address: '', phone: '', email: '' }),
                [field]: value
            }
        });
    };

    // Class Levels Handlers
    const handleAddClassLevel = (level: string) => {
        if (!level || (formState.classLevels || []).includes(level)) return;
        setFormState({
            ...formState,
            classLevels: [...(formState.classLevels || []), level]
        });
    };

    const handleRemoveClassLevel = (level: string) => {
        setFormState({
            ...formState,
            classLevels: (formState.classLevels || []).filter(l => l !== level)
        });
    };

    // Communes Handlers
    const handleAddCommune = () => {
        const newCommune = { id: Date.now().toString(), name: 'Nouvelle Commune', postalCode: '' };
        setFormState({
            ...formState,
            communes: [...(formState.communes || []), newCommune]
        });
    };

    const handleUpdateCommune = (id: string, field: string, value: string) => {
        setFormState({
            ...formState,
            communes: (formState.communes || []).map(c => c.id === id ? { ...c, [field]: value } : c)
        });
    };

    const handleRemoveCommune = (id: string) => {
        setFormState({
            ...formState,
            communes: (formState.communes || []).filter(c => c.id !== id),
            schools: (formState.schools || []).filter(s => s.communeId !== id)
        });
    };

    // Schools Handlers
    const handleAddSchool = (communeId: string) => {
        const newSchool = { id: Date.now().toString(), name: 'Nouvelle École', address: '', communeId };
        setFormState({
            ...formState,
            schools: [...(formState.schools || []), newSchool]
        });
    };

    const handleUpdateSchool = (id: string, field: string, value: string) => {
        setFormState({
            ...formState,
            schools: (formState.schools || []).map(s => s.id === id ? { ...s, [field]: value } : s)
        });
    };

    const handleRemoveSchool = (id: string) => {
        setFormState({
            ...formState,
            schools: (formState.schools || []).filter(s => s.id !== id)
        });
    };

    // Info Pages Handlers
    const handleAddInfoPage = () => {
        const newPage = { id: Date.now().toString(), title: 'Nouvelle page', content: 'Contenu de la page...', slug: 'nouvelle-page' };
        setFormState({
            ...formState,
            infoPages: [...(formState.infoPages || []), newPage]
        });
        setEditingInfoPageId(newPage.id);
    };

    const handleUpdateInfoPage = (id: string, field: 'title' | 'content' | 'hideTitle', value: string | boolean) => {
        setFormState({
            ...formState,
            infoPages: (formState.infoPages || []).map(p => {
                if (p.id === id) {
                    const newTitle = field === 'title' ? (value as string) : p.title;
                    const slug = newTitle.toLowerCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                        .replace(/[^a-z0-9]/g, '-') // replace non-alphanumeric with -
                        .replace(/-+/g, '-') // remove double -
                        .replace(/^-|-$/g, ''); // remove leading/trailing -
                    return { ...p, [field]: value, slug };
                }
                return p;
            })
        });
    };

    const quillLegalModules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                [{ 'font': [] }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [
                    '#000000', '#444444', '#666666', '#999999', '#cccccc', '#eeeeee', '#f3f3f3', '#ffffff',
                    '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#9900ff', '#ff00ff',
                    '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc',
                    '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#9fc5e8', '#b4a7d6', '#d5a6bd',
                    '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6fa8dc', '#8e7cc3', '#c27ba0',
                    '#c00000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#674ea7', '#a64d79',
                    '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#0b5394', '#351c75', '#741b47',
                    '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#073763', '#20124d', '#4c1130'
                ] }, { 'background': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'align': [] }],
                ['link', 'image', 'video'],
                ['blockquote', 'code-block'],
                ['clean']
            ],
            handlers: {
                image: () => {
                    const input = document.createElement('input');
                    input.setAttribute('type', 'file');
                    input.setAttribute('accept', 'image/*');
                    input.click();

                    input.onchange = async () => {
                        const file = input.files?.[0];
                        if (file) {
                            try {
                                const url = await storageService.uploadFile(file, 'rich-text-images');
                                const quill = quillLegalRef.current?.getEditor();
                                if (quill) {
                                    const range = quill.getSelection();
                                    const index = range ? range.index : quill.getLength();
                                    quill.insertEmbed(index, 'image', url);
                                }
                            } catch (error) {
                                console.error("Erreur lors de l'upload de l'image Quill :", error);
                                alert("Erreur lors de l'upload de l'image.");
                            }
                        }
                    };
                }
            }
        }
    }), []);

    const quillInfoModules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                [{ 'font': [] }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [
                    '#000000', '#444444', '#666666', '#999999', '#cccccc', '#eeeeee', '#f3f3f3', '#ffffff',
                    '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#9900ff', '#ff00ff',
                    '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc',
                    '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#9fc5e8', '#b4a7d6', '#d5a6bd',
                    '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6fa8dc', '#8e7cc3', '#c27ba0',
                    '#c00000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#674ea7', '#a64d79',
                    '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#0b5394', '#351c75', '#741b47',
                    '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#073763', '#20124d', '#4c1130'
                ] }, { 'background': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'align': [] }],
                ['link', 'image', 'video'],
                ['blockquote', 'code-block'],
                ['clean']
            ],
            handlers: {
                image: () => {
                    const input = document.createElement('input');
                    input.setAttribute('type', 'file');
                    input.setAttribute('accept', 'image/*');
                    input.click();

                    input.onchange = async () => {
                        const file = input.files?.[0];
                        if (file) {
                            try {
                                const url = await storageService.uploadFile(file, 'rich-text-images');
                                const quill = quillInfoRef.current?.getEditor();
                                if (quill) {
                                    const range = quill.getSelection();
                                    const index = range ? range.index : quill.getLength();
                                    quill.insertEmbed(index, 'image', url);
                                }
                            } catch (error) {
                                console.error("Erreur lors de l'upload de l'image Quill :", error);
                                alert("Erreur lors de l'upload de l'image.");
                            }
                        }
                    };
                }
            }
        }
    }), []);

    const quillFormats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'list', 'indent',
        'align',
        'link', 'image', 'video',
        'blockquote', 'code-block'
    ];

    const toggleEditorMaximize = () => {
        setIsEditorMaximized(!isEditorMaximized);
        if (!isEditorMaximized) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    };

    const handleRemoveInfoPage = (id: string) => {
        setFormState({
            ...formState,
            infoPages: (formState.infoPages || []).filter(p => p.id !== id)
        });
        if (editingInfoPageId === id) {
            setEditingInfoPageId(null);
        }
    };

    const handleMoveInfoPage = (id: string, direction: 'up' | 'down') => {
        const pages = [...(formState.infoPages || [])];
        const index = pages.findIndex(p => p.id === id);
        if (index === -1) return;
        
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= pages.length) return;
        
        const [removed] = pages.splice(index, 1);
        pages.splice(newIndex, 0, removed);
        
        setFormState({ ...formState, infoPages: pages });
    };

    // Excel Import Handlers
    const handleImportCommunes = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const dataBuffer = evt.target?.result;
                const wb = XLSX.read(dataBuffer, { type: 'array' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                const findValue = (row: any, keys: string[]) => {
                    const rowKeys = Object.keys(row);
                    for (const key of keys) {
                        const foundKey = rowKeys.find(rk => rk.trim().toLowerCase() === key.toLowerCase());
                        if (foundKey) return row[foundKey];
                    }
                    return '';
                };

                const importedCommunes = data.map((row, index) => {
                    const rawValue = findValue(row, ['Communes', 'Commune', 'Nom', 'name', 'Ville']);
                    let name = String(rawValue || '').trim();
                    let postalCode = '';

                    // Try to parse "City (PostalCode)"
                    const match = name.match(/^(.*?)\s*\((.*?)\)$/);
                    if (match) {
                        name = match[1].trim();
                        postalCode = match[2].trim();
                    }

                    return {
                        id: `imported-commune-${Date.now()}-${index}`,
                        name: name,
                        postalCode: postalCode
                    };
                }).filter(c => c.name);

                if (importedCommunes.length === 0 && data.length > 0) {
                    console.log("Data sample:", data[0]);
                    showNotification("Aucune donnée valide trouvée. Vérifiez que la colonne s'appelle bien 'Communes'.", "error");
                } else if (data.length === 0) {
                    showNotification("Le fichier semble vide.", "error");
                } else {
                    setFormState(prev => ({
                        ...prev,
                        communes: [...(prev.communes || []), ...importedCommunes]
                    }));
                    showNotification(`${importedCommunes.length} communes importées.`);
                }
            } catch (error) {
                console.error("Erreur import communes:", error);
                showNotification("Erreur lors de la lecture du fichier Excel.", "error");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImportSchools = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const dataBuffer = evt.target?.result;
                const wb = XLSX.read(dataBuffer, { type: 'array' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                const findValue = (row: any, keys: string[]) => {
                    const rowKeys = Object.keys(row);
                    for (const key of keys) {
                        const foundKey = rowKeys.find(rk => rk.trim().toLowerCase() === key.toLowerCase());
                        if (foundKey) return row[foundKey];
                    }
                    return '';
                };

                const importedSchools = data.map((row, index) => {
                    const schoolName = String(findValue(row, ['Ecoles', 'Ecole', 'Nom', 'name']) || '').trim();
                    const communeName = String(findValue(row, ['Communes', 'Commune', 'commune', 'Ville']) || '').trim();
                    const address = String(findValue(row, ['Adresses', 'Adresse', 'address']) || '').trim();
                    
                    const commune = (formState.communes || []).find(c => 
                        c.name.trim().toLowerCase() === communeName.toLowerCase() || 
                        `${c.name.trim()} (${c.postalCode.trim()})`.toLowerCase() === communeName.toLowerCase()
                    );
                    
                    return {
                        id: `imported-school-${Date.now()}-${index}`,
                        name: schoolName,
                        address: address,
                        communeId: commune?.id || ''
                    };
                }).filter(s => s.name);

                if (importedSchools.length === 0 && data.length > 0) {
                    console.log("Data sample:", data[0]);
                    showNotification("Aucune donnée valide trouvée. Vérifiez que les colonnes s'appellent 'Ecoles', 'Communes' et 'Adresses'.", "error");
                } else if (data.length === 0) {
                    showNotification("Le fichier semble vide.", "error");
                } else {
                    setFormState(prev => ({
                        ...prev,
                        schools: [...(prev.schools || []), ...importedSchools]
                    }));
                    showNotification(`${importedSchools.length} écoles importées.`);
                }
            } catch (error) {
                console.error("Erreur import écoles:", error);
                showNotification("Erreur lors de la lecture du fichier Excel.", "error");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSecurityError(null);

        // We only update the fields that are actually managed by this form tab-system
        // This ensures that we don't accidentally roll back animatorSettings or holidays
        // if they were updated in another tab since this form was loaded.
        
        const managedFields: (keyof AppSettings)[] = [
            'homepageTitle', 'homepageSubtitle', 'homepageBgColor', 'headerBgColor',
            'titleFontSize', 'titleFontWeight', 'titleFontStyle', 'titleColor',
            'subtitleFontSize', 'subtitleFontWeight', 'subtitleFontStyle', 'subtitleColor',
            'activeYear', 'adminEmail', 'adminUsername', 'adminPassword',
            'footerContent', 'bookingLeadTime', 'allowedDays', 'availableTimeSlots',
            'classLevels', 'communes', 'schools', 'footerLinks', 'establishmentInfo',
            'legalNoticeTitle', 'privacyPolicyTitle', 'cookiesPolicyTitle',
            'contactPhone', 'contactEmail', 'users', 'autoCleanupEnabled',
            'cleanupDay', 'cleanupMonth', 'infoPages', 'adminPasswordLastChanged',
            'registrationFormUrl', 'registrationFormName',
            'passwordExpiryDays', 'headerInfoText', 'headerInfoFontSize', 
            'headerInfoFontWeight', 'headerInfoFontStyle', 'headerInfoColor', 'headerInfoWidth',
            'emailTeacherTemplate', 'emailTeacherSubject', 'emailTeacherEnabled',
            'emailAnimatorTemplate', 'emailAnimatorSubject', 'emailAnimatorEnabled',
            'emailListTemplate', 'emailListSubject', 'emailListEnabled',
            'emailReminderTemplate', 'emailReminderSubject', 'emailReminderEnabled', 'emailReminderDays',
            'emailReminderTargetTeachers', 'emailReminderTargetAnimators',
            'enableBookingStatus', 'emailAnimatorOnValidationEnabled'
        ];

        const settingsToUpdate: Partial<AppSettings> = {};
        managedFields.forEach(field => {
            if (formState[field] !== undefined) {
                (settingsToUpdate as any)[field] = formState[field];
            }
        });

        // Special case: legal templates
        if (formState.legalNoticeTitle) settingsToUpdate.legalNoticeTitle = formState.legalNoticeTitle;
        if (formState.legalNotice) settingsToUpdate.legalNotice = formState.legalNotice;
        if (formState.privacyPolicyTitle) settingsToUpdate.privacyPolicyTitle = formState.privacyPolicyTitle;
        if (formState.privacyPolicy) settingsToUpdate.privacyPolicy = formState.privacyPolicy;
        if (formState.cookiesPolicyTitle) settingsToUpdate.cookiesPolicyTitle = formState.cookiesPolicyTitle;
        if (formState.cookiesPolicy) settingsToUpdate.cookiesPolicy = formState.cookiesPolicy;

        updateSettings(settingsToUpdate);
        
        // Reset security fields
        setIsChangingPassword(false);
        setNewPassword('');
        setConfirmPassword('');
        setSecurityError(null);
        showNotification("Paramètres sauvegardés avec succès !");
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof AppSettings) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploadingField(fieldName as string);
            
            try {
                const url = await storageService.uploadFile(file, 'app_assets');
                setFormState(prev => ({ ...prev, [fieldName]: url }));
                showNotification("Image mise à jour !");
            } catch (error) {
                console.error(error);
                alert("Erreur lors de l'upload vers Cloudinary.");
            } finally {
                setUploadingField(null);
            }
        }
    };

    const handleRemovePdf = () => {
        setFormState(prev => ({
            ...prev,
            registrationFormUrl: null as any,
            registrationFormName: null as any
        }));
        showNotification("Fiche d'inscription supprimée ! N'oubliez pas d'enregistrer.");
    };

    const fontSizes = [
        { label: 'Petit', value: 'text-xs' },
        { label: 'Compact', value: 'text-sm' },
        { label: 'Normal', value: 'text-base' },
        { label: 'Grand', value: 'text-lg' },
        { label: 'Très grand', value: 'text-xl' },
        { label: 'Titre (2XL)', value: 'text-2xl' },
        { label: 'Titre (3XL)', value: 'text-3xl' },
    ];

    const ImageUploader: React.FC<{ label: string, fieldName: keyof AppSettings, currentUrl?: string }> = ({ label, fieldName, currentUrl }) => (
        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{label}</span>
            <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden border border-gray-200 shadow-inner">
                {currentUrl ? (
                    <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 italic text-[10px]">Standard</div>
                )}
                {uploadingField === fieldName && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
            <label className={`mt-3 cursor-pointer text-xs font-bold px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm text-blue-600 hover:bg-blue-50 transition-all ${uploadingField ? 'opacity-50 pointer-events-none' : ''}`}>
                Changer l'image
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleImageUpload(e, fieldName)} 
                    disabled={uploadingField !== null}
                />
            </label>
        </div>
    );

    const NavButton: React.FC<{ id: SettingsTab, label: string, icon: React.ReactNode }> = ({ id, label, icon }) => (
        <button
            type="button"
            onClick={() => {
                setActiveTab(id);
                setEditingLegalPage(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-200 text-sm font-bold ${
                activeTab === id 
                ? 'bg-blue-600 text-white shadow-sm scale-[1.01]' 
                : 'text-gray-600 bg-white border border-gray-200/50 hover:bg-gray-50'
            }`}
        >
            <span className={activeTab === id ? 'text-white' : 'text-gray-400'}>{icon}</span>
            <span className="whitespace-nowrap">{label}</span>
        </button>
    );

    const WeekDay: React.FC<{ day: number, label: string }> = ({ day, label }) => {
        const isSelected = formState.allowedDays?.includes(day);
        return (
            <button
                type="button"
                onClick={() => handleToggleDay(day)}
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                    isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'
                }`}
            >
                {label}
            </button>
        );
    };

    const isIdentityChanged = formState.adminUsername !== settings.adminUsername || formState.adminEmail !== settings.adminEmail;

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <div className="flex flex-col gap-6">
                
                {/* Sticky Horizontal Navigation */}
                <div className="sticky top-[-16px] sm:top-[-24px] lg:top-[-32px] z-30 bg-gray-100 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 -mt-4 sm:-mt-6 lg:-mt-8 pt-4 sm:pt-6 lg:pt-8 pb-3 border-b border-gray-200/80">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4">
                        {/* Left Block: Configuration Label */}
                        <div className="flex items-center justify-center md:pr-4 md:border-r md:border-gray-200/60 h-full py-1">
                            <span className="text-sm font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Configuration</span>
                        </div>
                        
                        {/* Right Block: Two rows of buttons */}
                        <div className="flex flex-col gap-2 items-center justify-center">
                            {/* Row 1: Apparence, Pages d'info, Pied de page, Calendrier, Données, E-mails */}
                            <div className="flex flex-wrap gap-2 justify-center">
                                <NavButton id="design" label="Apparence" icon={<PaintBrushIcon className="w-5 h-5" />} />
                                <NavButton id="pages" label="Pages d'info" icon={<ViewGridIcon className="w-5 h-5" />} />
                                <NavButton id="footer" label="Pied de page" icon={<PencilIcon className="w-5 h-5" />} />
                                <NavButton id="rules" label="Calendrier" icon={<CalendarDaysIcon className="w-5 h-5" />} />
                                <NavButton id="data" label="Données" icon={<DatabaseIcon className="w-5 h-5" />} />
                                <NavButton id="emails" label="E-mails" icon={<BellIcon className="w-5 h-5" />} />
                            </div>
                            {/* Row 2: Statistiques, Sécurité, Utilisateurs, Maintenance, Informations */}
                            <div className="flex flex-wrap gap-2 justify-center">
                                <NavButton id="stats" label="Statistiques" icon={<ListIcon className="w-5 h-5" />} />
                                <NavButton id="security" label="Sécurité" icon={<CogIcon className="w-5 h-5" />} />
                                <NavButton id="users" label="Utilisateurs" icon={<UserGroupIcon className="w-5 h-5" />} />
                                <NavButton id="maintenance" label="Maintenance" icon={<ShieldCheckIcon className="w-5 h-5" />} />
                                <NavButton id="information" label="Informations" icon={<InformationCircleIcon className="w-5 h-5" />} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Pane */}
                <div className="flex-grow w-full">
                    <form onSubmit={handleSave} className="space-y-6">
                        <fieldset disabled={currentUser?.role === 'user' && activeTab !== 'stats'} className="contents">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
                            
                            {/* Header Panel */}
                            <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between flex-wrap gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="text-xl font-bold text-gray-800">
                                            {activeTab === 'design' && "Apparence"}
                                            {activeTab === 'rules' && "Calendrier"}
                                            {activeTab === 'data' && "Données"}
                                            {activeTab === 'stats' && "Statistiques"}
                                            {activeTab === 'pages' && "Pages d'information"}
                                            {activeTab === 'users' && "Gestion des Utilisateurs"}
                                            {activeTab === 'emails' && "Modèles d'e-mails"}
                                            {activeTab === 'footer' && "Pied de page"}
                                            {activeTab === 'security' && "Sécurité"}
                                            {activeTab === 'maintenance' && "Maintenance"}
                                            {activeTab === 'information' && "Informations techniques"}
                                        </h3>
                                        {currentUser?.role === 'user' && activeTab !== 'stats' && (
                                            <span className="shrink-0 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                ⚠️ Lecture seule
                                            </span>
                                        )}
                                        {currentUser?.role === 'admin' && isDirty && (
                                            <span className="shrink-0 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                                Modifications non enregistrées
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {activeTab === 'design' && "Personnalisez les textes, les couleurs et le style de votre accueil"}
                                        {activeTab === 'rules' && "Définissez les contraintes de réservation : délais, jours et créneaux"}
                                        {activeTab === 'data' && "Gérez les niveaux de classe, les communes et les écoles"}
                                        {activeTab === 'stats' && "Visualisez l'activité et l'impact de vos animations pédagogiques"}
                                        {activeTab === 'pages' && "Créez et modifiez des pages de contenu personnalisées pour vos utilisateurs"}
                                        {activeTab === 'users' && "Gérez les comptes d'accès à l'administration et leurs permissions"}
                                        {activeTab === 'emails' && "Personnalisez le contenu et le sujet des e-mails envoyés aux enseignants et animateurs"}
                                        {activeTab === 'footer' && "Gérez les liens du pied de page, les mentions légales et les infos de l'établissement"}
                                        {activeTab === 'security' && "Gérez vos identifiants de connexion et l'e-mail de secours"}
                                        {activeTab === 'maintenance' && "Gérez la sauvegarde et la restauration de vos données"}
                                        {activeTab === 'information' && "Consultez les détails techniques, les services utilisés et le diagnostic de sécurité"}
                                    </p>
                                </div>

                                {currentUser?.role === 'admin' && isDirty && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                                            title="Annuler les modifications et rétablir les données de la base"
                                        >
                                            <ArrowUturnLeftIcon className="w-3.5 h-3.5 text-gray-500" />
                                            <span>Annuler</span>
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-green-600 hover:bg-green-700 transition-all flex items-center gap-1.5 shadow-md shadow-green-100 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                        >
                                            💾 <span>Enregistrer</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Content Body */}
                            <div className="p-8 flex-grow">
                                {activeTab === 'design' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Titre Style */}
                                            <div className="space-y-4 p-5 bg-blue-50/30 rounded-2xl border border-blue-100">
                                                <h4 className="font-bold text-blue-800 flex items-center gap-2">Titre de l'accueil</h4>
                                                <input type="text" name="homepageTitle" value={formState.homepageTitle} onChange={handleChange} className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Titre principal..."/>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Taille</label>
                                                        <select name="titleFontSize" value={formState.titleFontSize} onChange={handleChange} className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white">
                                                            {fontSizes.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Couleur</label>
                                                        <div className="flex gap-2">
                                                            <input type="color" name="titleColor" value={formState.titleColor} onChange={handleChange} className="h-9 w-12 border border-blue-200 rounded-lg cursor-pointer bg-white p-1"/>
                                                            <input type="text" name="titleColor" value={formState.titleColor} onChange={handleChange} className="flex-grow px-2 py-1 border border-blue-200 rounded-lg text-[10px] font-mono bg-white uppercase"/>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-6 pt-2">
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="checkbox" checked={formState.titleFontWeight === 'font-bold'} onChange={(e) => setFormState({...formState, titleFontWeight: e.target.checked ? 'font-bold' : 'font-normal'})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-blue-300"/>
                                                        <span className="text-sm font-bold text-blue-900 group-hover:text-blue-700">Gras</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="checkbox" checked={formState.titleFontStyle === 'italic'} onChange={(e) => setFormState({...formState, titleFontStyle: e.target.checked ? 'italic' : 'not-italic'})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-blue-300"/>
                                                        <span className="text-sm italic text-blue-900 group-hover:text-blue-700">Italique</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Sous-titre Style */}
                                            <div className="space-y-4 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100">
                                                <h4 className="font-bold text-indigo-800 flex items-center gap-2">Sous-titre</h4>
                                                <input type="text" name="homepageSubtitle" value={formState.homepageSubtitle || ''} onChange={handleChange} className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Sous-titre informatif..."/>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Taille</label>
                                                        <select name="subtitleFontSize" value={formState.subtitleFontSize} onChange={handleChange} className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white">
                                                            {fontSizes.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Couleur</label>
                                                        <div className="flex gap-2">
                                                            <input type="color" name="subtitleColor" value={formState.subtitleColor} onChange={handleChange} className="h-9 w-12 border border-indigo-200 rounded-lg cursor-pointer bg-white p-1"/>
                                                            <input type="text" name="subtitleColor" value={formState.subtitleColor} onChange={handleChange} className="flex-grow px-2 py-1 border border-indigo-200 rounded-lg text-[10px] font-mono bg-white uppercase"/>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-6 pt-2">
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="checkbox" checked={formState.subtitleFontWeight === 'font-bold'} onChange={(e) => setFormState({...formState, subtitleFontWeight: e.target.checked ? 'font-bold' : 'font-normal'})} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-indigo-300"/>
                                                        <span className="text-sm font-bold text-indigo-900 group-hover:text-indigo-700">Gras</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="checkbox" checked={formState.subtitleFontStyle === 'italic'} onChange={(e) => setFormState({...formState, subtitleFontStyle: e.target.checked ? 'italic' : 'not-italic'})} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-indigo-300"/>
                                                        <span className="text-sm italic text-indigo-900 group-hover:text-indigo-700">Italique</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-8">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-3">Couleur de l'en-tête (Sticky Header)</label>
                                                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                    <input type="color" name="headerBgColor" value={formState.headerBgColor} onChange={handleChange} className="h-12 w-16 border rounded-lg cursor-pointer bg-white p-1 shadow-sm"/>
                                                    <input type="text" name="headerBgColor" value={formState.headerBgColor} onChange={handleChange} className="w-full max-w-[150px] px-3 py-2 border rounded-lg font-mono text-xs uppercase"/>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-3">Couleur de fond globale (Accueil)</label>
                                                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                    <input type="color" name="homepageBgColor" value={formState.homepageBgColor} onChange={handleChange} className="h-12 w-16 border rounded-lg cursor-pointer bg-white p-1 shadow-sm"/>
                                                    <input type="text" name="homepageBgColor" value={formState.homepageBgColor} onChange={handleChange} className="w-full max-w-[150px] px-3 py-2 border rounded-lg font-mono text-xs uppercase"/>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Informations de Contact (Moved from General) */}
                                        <div className="max-w-2xl space-y-6 border-t pt-8">
                                            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                    <BellIcon className="w-5 h-5 text-blue-600" />
                                                    Informations de Contact
                                                </h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Téléphone de contact</label>
                                                        <input type="text" name="contactPhone" value={formState.contactPhone || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold" placeholder="ex: 03 82 26 03 00"/>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">E-mail de contact</label>
                                                        <input type="email" name="contactEmail" value={formState.contactEmail || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold" placeholder="ex: contact@grandlongwy.fr"/>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Texte informatif sous le bouton Contact</label>
                                                        <input type="text" name="headerInfoText" value={formState.headerInfoText || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold" placeholder="Petit texte d'aide ou d'information..."/>
                                                    </div>
                                                    <div className="space-y-4 pt-2 border-t border-gray-100">
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Formatage du texte informatif</label>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Taille</label>
                                                                <select name="headerInfoFontSize" value={formState.headerInfoFontSize} onChange={handleChange} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white">
                                                                    {fontSizes.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Couleur</label>
                                                                <div className="flex gap-2">
                                                                    <input type="color" name="headerInfoColor" value={formState.headerInfoColor} onChange={handleChange} className="h-7 w-10 border border-gray-200 rounded cursor-pointer bg-white p-0.5"/>
                                                                    <input type="text" name="headerInfoColor" value={formState.headerInfoColor} onChange={handleChange} className="flex-grow px-2 py-1 border border-gray-200 rounded text-[9px] font-mono bg-white uppercase"/>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Largeur de la zone (px)</label>
                                                            <div className="flex items-center gap-3">
                                                                <input 
                                                                    type="range" 
                                                                    min="50" max="500" step="10"
                                                                    value={formState.headerInfoWidth || 200}
                                                                    onChange={(e) => setFormState({...formState, headerInfoWidth: parseInt(e.target.value)})}
                                                                    className="flex-grow h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                                />
                                                                <span className="text-[10px] font-bold text-gray-600 min-w-[40px]">{formState.headerInfoWidth || 200}px</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-6">
                                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                                <input type="checkbox" checked={formState.headerInfoFontWeight === 'font-bold'} onChange={(e) => setFormState({...formState, headerInfoFontWeight: e.target.checked ? 'font-bold' : 'font-normal'})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"/>
                                                                <span className="text-xs font-bold text-gray-700 group-hover:text-blue-600">Gras</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                                <input type="checkbox" checked={formState.headerInfoFontStyle === 'italic'} onChange={(e) => setFormState({...formState, headerInfoFontStyle: e.target.checked ? 'italic' : 'normal'})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"/>
                                                                <span className="text-xs italic text-gray-700 group-hover:text-blue-600">Italique</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'rules' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                {/* Préavis */}
                                                <div className="p-5 bg-blue-50/40 rounded-2xl border border-blue-100">
                                                    <h4 className="font-bold text-blue-900 mb-2">Préavis de réservation</h4>
                                                    <p className="text-xs text-blue-600/80 mb-4">Délai minimum (en jours) requis avant la date de l'atelier pour pouvoir réserver.</p>
                                                    <div className="flex items-center gap-4">
                                                        <input 
                                                            type="range" 
                                                            min="0" max="60" step="1"
                                                            name="bookingLeadTime" 
                                                            value={formState.bookingLeadTime} 
                                                            onChange={(e) => setFormState({...formState, bookingLeadTime: parseInt(e.target.value)})}
                                                            className="flex-grow h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                        />
                                                        <div className="bg-white px-4 py-2 rounded-lg border border-blue-200 font-bold text-blue-700 min-w-[100px] text-center">
                                                            {formState.bookingLeadTime} jours
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Jours autorisés */}
                                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <h4 className="font-bold text-gray-800 mb-2">Jours d'ouverture hebdomadaire</h4>
                                                    <p className="text-xs text-gray-500 mb-4">Sélectionnez les jours où les réservations sont possibles.</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        <WeekDay day={2} label="Mardi" />
                                                        <WeekDay day={3} label="Mercredi" />
                                                        <WeekDay day={4} label="Jeudi" />
                                                        <WeekDay day={5} label="Vendredi" />
                                                        <WeekDay day={6} label="Samedi" />
                                                    </div>
                                                </div>

                                                {/* Créneaux Horaires */}
                                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <h4 className="font-bold text-gray-800 mb-2">Créneaux horaires standards</h4>
                                                    <p className="text-xs text-gray-500 mb-4">Heures de début des ateliers proposées aux enseignants.</p>
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {(formState.availableTimeSlots || []).map(time => (
                                                            <div key={time} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
                                                                <span className="font-bold text-gray-700">{time}h00</span>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => handleRemoveTimeSlot(time)}
                                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                                >
                                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="number" 
                                                            value={newSlotTime}
                                                            onChange={(e) => setNewSlotTime(e.target.value)}
                                                            placeholder="Ex: 11"
                                                            className="flex-grow px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        <button 
                                                            type="button" 
                                                            onClick={handleAddTimeSlot}
                                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700"
                                                        >
                                                            Ajouter
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Vision d'ensemble */}
                                            <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl space-y-6">
                                                <h4 className="text-xl font-bold flex items-center gap-2">
                                                    <span className="text-indigo-300">★</span>
                                                    Vision d'ensemble
                                                </h4>
                                                <div className="space-y-4 text-sm opacity-90 leading-relaxed">
                                                    <p>Voici comment les réservations sont validées sur votre plateforme :</p>
                                                    <div className="space-y-3">
                                                        <div className="flex gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center shrink-0">1</div>
                                                            <p><strong>Délai :</strong> Un atelier n'est réservable que s'il se situe à plus de <span className="text-indigo-200 font-bold">{formState.bookingLeadTime} jours</span> d'aujourd'hui.</p>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center shrink-0">2</div>
                                                            <p><strong>Calendrier :</strong> Seuls les jours <span className="text-indigo-200 font-bold">{(formState.allowedDays || []).map(d => ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][d]).join(', ')}</span> et hors vacances/indisponibilités sont ouverts.</p>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center shrink-0">3</div>
                                                            <p><strong>Exclusivité du créneau :</strong> Lorsqu'un créneau (date + heure) est réservé pour une animation, ce créneau devient <span className="text-indigo-200 font-bold">indisponible pour tous les animateurs</span> et toutes les autres animations.</p>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center shrink-0">4</div>
                                                            <p><strong>Après-midi :</strong> Un seul atelier est autorisé par demi-journée d'après-midi. Si 14h ou 15h est pris, l'autre est bloqué pour tout le monde.</p>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center shrink-0">5</div>
                                                            <p><strong>Animateurs :</strong> Si un animateur est mobilisé par une animation le matin ou l'après-midi, il ne peut pas être sollicité pour une autre animation sur cette même journée.</p>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center shrink-0">6</div>
                                                            <p><strong>Reprise après vacances :</strong> Le tout premier créneau du matin (<span className="text-indigo-200 font-bold">9h</span>) suivant immédiatement le dernier jour d'une période de vacances scolaires est automatiquement bloqué et indisponible pour toutes les animations.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'data' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        {/* Nettoyage automatique */}
                                        <div className="p-6 bg-red-50/30 rounded-2xl border border-red-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-bold text-red-900 flex items-center gap-2">
                                                    <DatabaseIcon className="w-5 h-5" />
                                                    Nettoyage automatique des données personnelles (RGPD)
                                                </h4>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={formState.autoCleanupEnabled} 
                                                        onChange={(e) => setFormState({...formState, autoCleanupEnabled: e.target.checked})}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                                </label>
                                            </div>
                                            <p className="text-xs text-red-700 mb-4 leading-relaxed">
                                                Conformément au RGPD, il est recommandé de ne pas conserver les données personnelles plus longtemps que nécessaire. 
                                                Cette option permet d'anonymiser automatiquement le nom, le téléphone et l'email des enseignants pour l'année scolaire écoulée.
                                            </p>
                                            {formState.autoCleanupEnabled && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in zoom-in-95 duration-200">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Jour d'exécution chaque année</label>
                                                        <select 
                                                            value={formState.cleanupDay} 
                                                            onChange={(e) => setFormState({...formState, cleanupDay: parseInt(e.target.value)})}
                                                            className="w-full p-2.5 bg-white border border-red-200 rounded-xl font-bold text-red-900"
                                                        >
                                                            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                                                                <option key={d} value={d}>{d}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Mois d'exécution</label>
                                                        <select 
                                                            value={formState.cleanupMonth} 
                                                            onChange={(e) => setFormState({...formState, cleanupMonth: parseInt(e.target.value)})}
                                                            className="w-full p-2.5 bg-white border border-red-200 rounded-xl font-bold text-red-900"
                                                        >
                                                            <option value={6}>Juillet</option>
                                                            <option value={7}>Août</option>
                                                            <option value={8}>Septembre</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Niveaux de classe */}
                                        <div className="p-6 bg-blue-50/30 rounded-2xl border border-blue-100">
                                            <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                                                <AcademicCapIcon className="w-5 h-5" />
                                                Niveaux de classe
                                            </h4>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {(formState.classLevels || []).map(level => (
                                                    <div key={level} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 rounded-lg shadow-sm">
                                                        <span className="font-bold text-blue-700">{level}</span>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleRemoveClassLevel(level)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <TrashIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2 max-w-xs">
                                                <input 
                                                    type="text" 
                                                    id="newClassLevel"
                                                    placeholder="Nouveau niveau (ex: MS)"
                                                    className="flex-grow px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddClassLevel((e.target as HTMLInputElement).value);
                                                            (e.target as HTMLInputElement).value = '';
                                                        }
                                                    }}
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        const input = document.getElementById('newClassLevel') as HTMLInputElement;
                                                        handleAddClassLevel(input.value);
                                                        input.value = '';
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700"
                                                >
                                                    Ajouter
                                                </button>
                                            </div>
                                        </div>

                                        {/* Communes */}
                                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                                    <MapPinIcon className="w-5 h-5 text-red-500" />
                                                    Communes
                                                </h4>
                                                <div className="flex gap-3 items-center">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <label className="cursor-pointer px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs font-bold flex items-center gap-2">
                                                            <PlusCircleIcon className="w-4 h-4" />
                                                            Importer Excel
                                                            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportCommunes} />
                                                        </label>
                                                        <span className="text-[9px] text-gray-400 italic">Colonne attendue : "Communes"</span>
                                                    </div>
                                                    <button 
                                                        type="button" 
                                                        onClick={handleAddCommune}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-bold"
                                                    >
                                                        <PlusCircleIcon className="w-4 h-4" />
                                                        Ajouter manuellement
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-1">
                                                {(formState.communes || []).map(commune => (
                                                    <div key={commune.id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm relative group">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleRemoveCommune(commune.id)}
                                                            className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                        <div className="space-y-3">
                                                            <div>
                                                                <label className="text-[10px] font-bold text-gray-400 uppercase">Nom de la commune</label>
                                                                <input 
                                                                    type="text" 
                                                                    value={commune.name} 
                                                                    onChange={(e) => handleUpdateCommune(commune.id, 'name', e.target.value)}
                                                                    className="w-full px-2 py-1 border rounded text-sm font-semibold"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-gray-400 uppercase">Code Postal</label>
                                                                <input 
                                                                    type="text" 
                                                                    value={commune.postalCode} 
                                                                    onChange={(e) => handleUpdateCommune(commune.id, 'postalCode', e.target.value)}
                                                                    className="w-full px-2 py-1 border rounded text-sm font-mono"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Écoles */}
                                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                                    <BuildingLibraryIcon className="w-5 h-5 text-indigo-500" />
                                                    Écoles
                                                </h4>
                                                <div className="flex flex-col items-end gap-1">
                                                    <label className="cursor-pointer px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs font-bold flex items-center gap-2">
                                                        <PlusCircleIcon className="w-4 h-4" />
                                                        Importer Excel
                                                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportSchools} />
                                                    </label>
                                                    <span className="text-[9px] text-gray-400 italic">Colonnes attendues : "Ecoles", "Communes", "Adresses"</span>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                {(formState.communes || []).map(commune => (
                                                    <div key={commune.id} className="space-y-3">
                                                        <div className="flex items-center justify-between border-b pb-2">
                                                            <h5 className="font-bold text-gray-700">{commune.name} ({commune.postalCode})</h5>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => handleAddSchool(commune.id)}
                                                                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                            >
                                                                <PlusCircleIcon className="w-3 h-3" />
                                                                Ajouter une école
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {(formState.schools || []).filter(s => s.communeId === commune.id).map(school => (
                                                                <div key={school.id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm relative group">
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => handleRemoveSchool(school.id)}
                                                                        className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                    >
                                                                        <TrashIcon className="w-4 h-4" />
                                                                    </button>
                                                                    <div className="space-y-3">
                                                                        <div>
                                                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Nom de l'école</label>
                                                                            <input 
                                                                                type="text" 
                                                                                value={school.name} 
                                                                                onChange={(e) => handleUpdateSchool(school.id, 'name', e.target.value)}
                                                                                className="w-full px-2 py-1 border rounded text-sm font-semibold"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Adresse</label>
                                                                            <textarea 
                                                                                value={school.address} 
                                                                                onChange={(e) => handleUpdateSchool(school.id, 'address', e.target.value)}
                                                                                className="w-full px-2 py-1 border rounded text-sm h-16"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'stats' && (
                                    <ManageStats />
                                )}

                                {activeTab === 'users' && (
                                    <ManageUsers 
                                        showNotification={showNotification} 
                                        users={formState.users || []}
                                        setUsers={(newUsers) => {
                                            setFormState(prev => ({ ...prev, users: newUsers }));
                                        }}
                                    />
                                )}

                                {activeTab === 'footer' && (
                                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                                        {editingLegalPage ? (
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-lg font-bold text-gray-800">
                                                        Édition : {
                                                            editingLegalPage === 'legalNotice' ? 'Mentions Légales' : 
                                                            editingLegalPage === 'privacyPolicy' ? 'Politique de Confidentialité' : 
                                                            'Gestion des Cookies'
                                                        }
                                                    </h4>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setEditingLegalPage(null)}
                                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                                                    >
                                                        Retour
                                                    </button>
                                                </div>

                                                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                                                    <div>
                                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                                                            Titre de la page
                                                        </label>
                                                        <input 
                                                            type="text"
                                                            className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-colors font-bold text-gray-700"
                                                            value={formState[`${editingLegalPage}Title`] || ''}
                                                            onChange={(e) => setFormState({ ...formState, [`${editingLegalPage}Title`]: e.target.value })}
                                                            placeholder="Titre de la page..."
                                                        />
                                                    </div>
                                                </div>

                                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden relative">
                                                    <div className="absolute top-2 right-2 z-20">
                                                        <button 
                                                            type="button"
                                                            onClick={toggleEditorMaximize}
                                                            className="p-2 bg-white/80 backdrop-blur rounded-lg border border-gray-200 shadow-sm hover:bg-white transition-all text-gray-500 hover:text-blue-600"
                                                            title={isEditorMaximized ? "Réduire" : "Agrandir"}
                                                        >
                                                            {isEditorMaximized ? <ArrowsPointingInIcon className="w-5 h-5" /> : <ArrowsPointingOutIcon className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                    <div className={isEditorMaximized ? 'quill-maximized' : ''}>
                                                        {isEditorMaximized && (
                                                            <div className="flex justify-between items-center mb-4">
                                                                <h4 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                                                                    Édition : {
                                                                        editingLegalPage === 'legalNotice' ? 'Mentions Légales' : 
                                                                        editingLegalPage === 'privacyPolicy' ? 'Politique de Confidentialité' : 
                                                                        'Gestion des Cookies'
                                                                    }
                                                                </h4>
                                                                <button 
                                                                    type="button"
                                                                    onClick={toggleEditorMaximize}
                                                                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-black uppercase tracking-widest text-xs"
                                                                >
                                                                    Fermer
                                                                </button>
                                                            </div>
                                                        )}
                                                        <ReactQuill 
                                                            ref={quillLegalRef}
                                                            theme="snow"
                                                            value={formState[editingLegalPage] || ''}
                                                            onChange={(content) => setFormState({ ...formState, [editingLegalPage]: content })}
                                                            modules={quillLegalModules}
                                                            formats={quillFormats}
                                                            className={isEditorMaximized ? '' : 'min-h-[400px]'}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Legal Pages Selection */}
                                                <div className="space-y-6">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-bold text-gray-800">Pages légales</h4>
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                setFormState({
                                                                    ...formState,
                                                                    ...LEGAL_TEMPLATES
                                                                });
                                                                showNotification("Modèles légaux restaurés ! N'oubliez pas d'enregistrer.");
                                                            }}
                                                            className="text-xs font-bold text-blue-600 hover:underline"
                                                        >
                                                            Restaurer les modèles par défaut
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div className="p-6 bg-white rounded-2xl border border-gray-200 flex flex-col items-center text-center gap-4 shadow-sm">
                                                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                                                <PencilIcon className="w-6 h-6" />
                                                            </div>
                                                            <h4 className="font-bold text-gray-800">Mentions Légales</h4>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setEditingLegalPage('legalNotice')}
                                                                className="mt-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-sm text-sm"
                                                            >
                                                                Modifier
                                                            </button>
                                                        </div>

                                                        <div className="p-6 bg-white rounded-2xl border border-gray-200 flex flex-col items-center text-center gap-4 shadow-sm">
                                                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                                                <PencilIcon className="w-6 h-6" />
                                                            </div>
                                                            <h4 className="font-bold text-gray-800">Confidentialité</h4>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setEditingLegalPage('privacyPolicy')}
                                                                className="mt-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-sm text-sm"
                                                            >
                                                                Modifier
                                                            </button>
                                                        </div>

                                                        <div className="p-6 bg-white rounded-2xl border border-gray-200 flex flex-col items-center text-center gap-4 shadow-sm">
                                                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                                                <PencilIcon className="w-6 h-6" />
                                                            </div>
                                                            <h4 className="font-bold text-gray-800">Cookies</h4>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setEditingLegalPage('cookiesPolicy')}
                                                                className="mt-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-sm text-sm"
                                                            >
                                                                Modifier
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer Content */}
                                                <div className="space-y-4 border-t pt-8">
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Contenu textuel du pied de page (Bas de page)</label>
                                                    <textarea 
                                                        name="footerContent" 
                                                        value={formState.footerContent} 
                                                        onChange={handleChange} 
                                                        rows={4} 
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" 
                                                        placeholder="Coordonnées simplifiées, copyright, etc."
                                                    />
                                                </div>

                                                {/* Dynamic Links */}
                                                <div className="space-y-4 border-t pt-8">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-bold text-gray-800">Liens supplémentaires du pied de page</h4>
                                                        <button 
                                                            type="button" 
                                                            onClick={handleAddFooterLink}
                                                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-bold"
                                                        >
                                                            <PlusCircleIcon className="w-4 h-4" />
                                                            Ajouter un lien
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {(formState.footerLinks || []).map((link) => (
                                                            <div key={link.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 items-start sm:items-center">
                                                                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                                                    <input 
                                                                        type="text" 
                                                                        value={link.label} 
                                                                        onChange={(e) => handleUpdateFooterLink(link.id, 'label', e.target.value)}
                                                                        placeholder="Label du lien"
                                                                        className="px-3 py-2 border rounded-lg text-sm bg-white"
                                                                    />
                                                                    <input 
                                                                        type="text" 
                                                                        value={link.url || ''} 
                                                                        onChange={(e) => handleUpdateFooterLink(link.id, 'url', e.target.value)}
                                                                        placeholder="URL (ex: https://...)"
                                                                        className="px-3 py-2 border rounded-lg text-sm bg-white"
                                                                    />
                                                                </div>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => handleRemoveFooterLink(link.id)}
                                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                >
                                                                    <TrashIcon className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {(formState.footerLinks || []).length === 0 && (
                                                            <p className="text-sm text-gray-400 italic text-center py-4">Aucun lien supplémentaire configuré.</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Establishment Info */}
                                                <div className="space-y-6 border-t pt-8">
                                                    <h4 className="font-bold text-gray-800">Informations sur l'établissement</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nom de l'établissement</label>
                                                                <input 
                                                                    type="text" 
                                                                    value={formState.establishmentInfo?.name || ''} 
                                                                    onChange={(e) => handleUpdateEstablishmentInfo('name', e.target.value)}
                                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
                                                                    placeholder="ex: Médiathèque de Longwy"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Adresse</label>
                                                                <input 
                                                                    type="text" 
                                                                    value={formState.establishmentInfo?.address || ''} 
                                                                    onChange={(e) => handleUpdateEstablishmentInfo('address', e.target.value)}
                                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
                                                                    placeholder="ex: 1 Avenue de la Paix, 54400 Longwy"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Téléphone</label>
                                                                    <input 
                                                                        type="text" 
                                                                        value={formState.establishmentInfo?.phone || ''} 
                                                                        onChange={(e) => handleUpdateEstablishmentInfo('phone', e.target.value)}
                                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
                                                                        placeholder="ex: 03 82 26 03 00"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">E-mail</label>
                                                                    <input 
                                                                        type="email" 
                                                                        value={formState.establishmentInfo?.email || ''} 
                                                                        onChange={(e) => handleUpdateEstablishmentInfo('email', e.target.value)}
                                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
                                                                        placeholder="ex: contact@longwy.fr"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 w-full">
                                                            {/* Logo gauche */}
                                                            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Logo Grand Longwy</span>
                                                                <div className="relative w-40 h-40 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center mb-4">
                                                                    {formState.establishmentInfo?.logoLeftUrl ? (
                                                                        <>
                                                                            <img src={formState.establishmentInfo.logoLeftUrl} alt="Logo Grand Longwy" className="max-w-full max-h-full object-contain p-2" />
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    handleUpdateEstablishmentInfo('logoLeftUrl', '');
                                                                                    showNotification("Logo Grand Longwy supprimé.");
                                                                                }}
                                                                                className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                                                                                title="Supprimer le logo"
                                                                            >
                                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <div className="text-gray-300 text-xs italic text-center px-4">Aucun logo Grand Longwy importé</div>
                                                                    )}
                                                                    {uploadingField === 'establishmentLogoLeft' && (
                                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <label className={`cursor-pointer px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-bold text-blue-600 hover:bg-blue-50 transition-all ${uploadingField ? 'opacity-50 pointer-events-none' : ''}`}>
                                                                    Importer le logo Grand Longwy
                                                                    <input 
                                                                        type="file" 
                                                                        accept="image/*" 
                                                                        className="hidden" 
                                                                        onChange={async (e) => {
                                                                            if (e.target.files && e.target.files[0]) {
                                                                                const file = e.target.files[0];
                                                                                setUploadingField('establishmentLogoLeft');
                                                                                try {
                                                                                    const url = await storageService.uploadFile(file, 'logos');
                                                                                    handleUpdateEstablishmentInfo('logoLeftUrl', url);
                                                                                    showNotification("Logo Grand Longwy mis à jour !");
                                                                                } catch (error) {
                                                                                    console.error(error);
                                                                                    alert("Erreur lors de l'upload.");
                                                                                } finally {
                                                                                    setUploadingField(null);
                                                                                }
                                                                            }
                                                                        }} 
                                                                        disabled={uploadingField !== null}
                                                                    />
                                                                </label>
                                                                <div className="mt-4 w-full px-4">
                                                                    <label className="block text-xs font-semibold text-gray-500 mb-1 text-center">
                                                                        Largeur du logo Grand Longwy (px) :
                                                                    </label>
                                                                    <input 
                                                                        type="number"
                                                                        min="10"
                                                                        max="1000"
                                                                        placeholder="Par défaut (auto / max-h)"
                                                                        value={formState.establishmentInfo?.logoLeftWidth || ''}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value ? parseInt(e.target.value) : '';
                                                                            handleUpdateEstablishmentInfo('logoLeftWidth', val);
                                                                        }}
                                                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-center outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Logo principal */}
                                                            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Logo Médiathèque</span>
                                                                <div className="relative w-40 h-40 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center mb-4">
                                                                    {formState.establishmentInfo?.logoUrl ? (
                                                                        <>
                                                                            <img src={formState.establishmentInfo.logoUrl} alt="Logo Médiathèque" className="max-w-full max-h-full object-contain p-2" />
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    handleUpdateEstablishmentInfo('logoUrl', '');
                                                                                    showNotification("Logo Médiathèque supprimé.");
                                                                                }}
                                                                                className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                                                                                title="Supprimer le logo"
                                                                            >
                                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <div className="text-gray-300 text-xs italic text-center px-4">Aucun logo Médiathèque importé</div>
                                                                    )}
                                                                    {uploadingField === 'establishmentLogo' && (
                                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <label className={`cursor-pointer px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-bold text-blue-600 hover:bg-blue-50 transition-all ${uploadingField ? 'opacity-50 pointer-events-none' : ''}`}>
                                                                    Importer le logo Médiathèque
                                                                    <input 
                                                                        type="file" 
                                                                        accept="image/*" 
                                                                        className="hidden" 
                                                                        onChange={async (e) => {
                                                                            if (e.target.files && e.target.files[0]) {
                                                                                const file = e.target.files[0];
                                                                                setUploadingField('establishmentLogo');
                                                                                try {
                                                                                    const url = await storageService.uploadFile(file, 'logos');
                                                                                    handleUpdateEstablishmentInfo('logoUrl', url);
                                                                                    showNotification("Logo Médiathèque mis à jour !");
                                                                                } catch (error) {
                                                                                    console.error(error);
                                                                                    alert("Erreur lors de l'upload.");
                                                                                } finally {
                                                                                    setUploadingField(null);
                                                                                }
                                                                            }
                                                                        }} 
                                                                        disabled={uploadingField !== null}
                                                                    />
                                                                </label>
                                                                <div className="mt-4 w-full px-4">
                                                                    <label className="block text-xs font-semibold text-gray-500 mb-1 text-center">
                                                                        Largeur du logo Médiathèque (px) :
                                                                    </label>
                                                                    <input 
                                                                        type="number"
                                                                        min="10"
                                                                        max="1000"
                                                                        placeholder="Par défaut (auto / max-h)"
                                                                        value={formState.establishmentInfo?.logoWidth || ''}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value ? parseInt(e.target.value) : '';
                                                                            handleUpdateEstablishmentInfo('logoWidth', val);
                                                                        }}
                                                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-center outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'pages' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
                                            <div>
                                                <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Pages d'information</h3>
                                                <p className="text-xs text-gray-400 font-medium">Créez des pages de contenu personnalisées pour vos utilisateurs.</p>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={handleAddInfoPage}
                                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                            >
                                                <PlusCircleIcon className="w-4 h-4" />
                                                Ajouter une page
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Liste des pages */}
                                            <div className="lg:col-span-1 space-y-3">
                                                {(formState.infoPages || []).length === 0 ? (
                                                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                        <ViewGridIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                                        <p className="text-xs text-gray-400 italic">Aucune page créée</p>
                                                    </div>
                                                ) : (
                                                    (formState.infoPages || []).map(page => (
                                                        <div 
                                                            key={page.id}
                                                            className={`p-4 rounded-2xl border transition-all cursor-pointer group ${editingInfoPageId === page.id ? 'bg-indigo-50 border-indigo-200 shadow-md translate-x-1' : 'bg-white border-gray-100 hover:border-indigo-100 shadow-sm'}`}
                                                            onClick={() => setEditingInfoPageId(page.id)}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-grow">
                                                                    <h4 className={`text-sm font-bold ${editingInfoPageId === page.id ? 'text-indigo-900' : 'text-gray-700'}`}>{page.title}</h4>
                                                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">slug: /{page.slug}</p>
                                                                </div>
                                                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <div className="flex gap-1">
                                                                        <button 
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); handleMoveInfoPage(page.id, 'up'); }}
                                                                            disabled={(formState.infoPages || []).indexOf(page) === 0}
                                                                            className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30"
                                                                            title="Monter"
                                                                        >
                                                                            <SortAscIcon className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button 
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); handleMoveInfoPage(page.id, 'down'); }}
                                                                            disabled={(formState.infoPages || []).indexOf(page) === (formState.infoPages || []).length - 1}
                                                                            className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30"
                                                                            title="Descendre"
                                                                        >
                                                                            <SortDescIcon className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button 
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); handleRemoveInfoPage(page.id); }}
                                                                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                            title="Supprimer"
                                                                        >
                                                                            <TrashIcon className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            {/* Zone d'édition */}
                                            <div className="lg:col-span-2">
                                                {editingInfoPageId ? (
                                                    <div className="bg-white rounded-3xl border border-indigo-100 shadow-xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Titre de la page</label>
                                                            <div className="relative">
                                                                <PencilIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                <input 
                                                                    type="text"
                                                                    value={(formState.infoPages || []).find(p => p.id === editingInfoPageId)?.title || ''}
                                                                    onChange={(e) => handleUpdateInfoPage(editingInfoPageId, 'title', e.target.value)}
                                                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-gray-800 focus:border-indigo-500 outline-none transition-all"
                                                                    placeholder="ex: Informations pratiques"
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between mt-2 px-1">
                                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                                    <input 
                                                                        type="checkbox"
                                                                        checked={(formState.infoPages || []).find(p => p.id === editingInfoPageId)?.hideTitle || false}
                                                                        onChange={(e) => handleUpdateInfoPage(editingInfoPageId, 'hideTitle', e.target.checked)}
                                                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                    />
                                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-gray-600 transition-colors">Masquer le titre sur le site</span>
                                                                </label>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="flex justify-between items-end mb-2">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contenu de la page</label>
                                                                <button 
                                                                    type="button"
                                                                    onClick={toggleEditorMaximize}
                                                                    className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                                                                >
                                                                    {isEditorMaximized ? (
                                                                        <><ArrowsPointingInIcon className="w-3.5 h-3.5" /> Réduire</>
                                                                    ) : (
                                                                        <><ArrowsPointingOutIcon className="w-3.5 h-3.5" /> Agrandir l'éditeur</>
                                                                    )}
                                                                </button>
                                                            </div>
                                                            <div className={`bg-white rounded-2xl border-2 border-gray-100 overflow-visible focus-within:border-indigo-500 transition-all relative ${isEditorMaximized ? 'quill-maximized' : ''}`}>
                                                                {isEditorMaximized && (
                                                                    <div className="flex justify-between items-center mb-4">
                                                                        <h4 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                                                                            Édition : {(formState.infoPages || []).find(p => p.id === editingInfoPageId)?.title}
                                                                        </h4>
                                                                        <button 
                                                                            type="button"
                                                                            onClick={toggleEditorMaximize}
                                                                            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-black uppercase tracking-widest text-xs"
                                                                        >
                                                                            Fermer
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                <ReactQuill 
                                                                    ref={quillInfoRef}
                                                                    theme={currentUser?.role === 'user' ? 'bubble' : 'snow'}
                                                                    value={(formState.infoPages || []).find(p => p.id === editingInfoPageId)?.content || ''}
                                                                    onChange={(content) => handleUpdateInfoPage(editingInfoPageId, 'content', content)}
                                                                    modules={currentUser?.role === 'user' ? { toolbar: false } : quillInfoModules}
                                                                    formats={quillFormats}
                                                                    readOnly={currentUser?.role === 'user'}
                                                                    className={isEditorMaximized ? '' : 'min-h-[400px]'}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                                                            <button 
                                                                onClick={() => setEditingInfoPageId(null)}
                                                                className="px-6 py-3 bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                                                            >
                                                                Fermer l'éditeur
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center p-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center">
                                                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-4 rotate-3">
                                                            <PencilIcon className="w-12 h-12 text-indigo-100" />
                                                        </div>
                                                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Éditeur de page</h4>
                                                        <p className="text-xs text-gray-400 mt-2">Sélectionnez une page pour commencer à modifier son contenu ou créez-en une nouvelle.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Section Fiche d'inscription */}
                                        <hr className="border-gray-100 my-8" />
                                        
                                        <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 p-8 rounded-3xl border border-blue-100/70 shadow-sm space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-md shadow-blue-100">
                                                    <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Fiche d'inscription externe</h3>
                                                    <p className="text-xs text-slate-500 font-medium">Configurez l'adresse URL de votre fiche d'inscription hébergée sur Google Drive, Dropbox ou autre. Elle sera accessible en téléchargement direct par les enseignants depuis le bandeau supérieur de la plateforme.</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                                                {/* État actuel du document */}
                                                <div className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col justify-between shadow-xs">
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Document actif</h4>
                                                        {formState.registrationFormUrl ? (
                                                            <div className="space-y-4">
                                                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                        </svg>
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-xs font-bold text-slate-700 truncate">{formState.registrationFormName || "fiche_inscription.pdf"}</p>
                                                                        <a 
                                                                            href={formState.registrationFormUrl} 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-tight mt-1"
                                                                        >
                                                                            ouvrir dans un nouvel onglet
                                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                            </svg>
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                                <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                                                </svg>
                                                                <p className="text-xs text-slate-400 italic">Aucune fiche d'inscription configurée pour l'instant</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {formState.registrationFormUrl && (
                                                        <div className="pt-4 mt-4 border-t border-slate-50 flex justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={handleRemovePdf}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                                            >
                                                                <TrashIcon className="w-3.5 h-3.5" />
                                                                Supprimer
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Configuration du lien */}
                                                <div className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col justify-between shadow-xs">
                                                    <div className="space-y-4">
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-50">Configuration du document</h4>
                                                        
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.55">
                                                                Lien URL du document (Google Drive, Dropbox, OneDrive...)
                                                            </label>
                                                            <input 
                                                                type="text"
                                                                placeholder="https://drive.google.com/file/d/... ou https://dropbox.com/..."
                                                                value={formState.registrationFormUrl || ''}
                                                                onChange={(e) => {
                                                                    const url = e.target.value;
                                                                    let name = formState.registrationFormName;
                                                                    if (!name && url) {
                                                                        name = "Fiche_inscription_2026.pdf";
                                                                    }
                                                                    setFormState(prev => ({
                                                                        ...prev,
                                                                        registrationFormUrl: url,
                                                                        registrationFormName: name || "Fiche d'inscription"
                                                                    }));
                                                                }}
                                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                                                            />
                                                            <p className="text-[10px] text-slate-400 mt-1 font-medium italic">
                                                                Important : Sur Google Drive, configurez le partage en mode "Tous les utilisateurs disposant du lien peuvent voir".
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                                                Nom d'affichage du document
                                                            </label>
                                                            <input 
                                                                type="text"
                                                                placeholder="Ex: Fiche d'inscription 2026.pdf"
                                                                value={formState.registrationFormName || ''}
                                                                onChange={(e) => setFormState(prev => ({
                                                                    ...prev,
                                                                    registrationFormName: e.target.value
                                                                }))}
                                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'security' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* Column 1: Security Google OAuth */}
                                            <div className="p-8 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col justify-between gap-4">
                                                <div className="bg-white p-3 rounded-xl shadow-sm w-fit">
                                                    <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-blue-900 uppercase tracking-tight">Sécurité Google OAuth</h4>
                                                    <p className="text-sm text-blue-700 mt-2 leading-relaxed">
                                                        L'administration est désormais sécurisée par <strong>Google Authentication</strong>. 
                                                        Les anciens mots de passe ont été supprimés pour garantir une sécurité maximale.
                                                     </p>
                                                </div>
                                            </div>

                                            {/* Column 2: Gestion des accès */}
                                            <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between gap-4">
                                                <div className="space-y-4">
                                                    <div className="bg-indigo-50/50 p-3 rounded-xl shadow-sm w-fit">
                                                        <UserGroupIcon className="w-8 h-8 text-indigo-500" />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-gray-800 text-lg">
                                                            Gestion des accès
                                                        </h5>
                                                        <p className="text-xs text-gray-500 leading-relaxed mt-2">
                                                            Pour autoriser un nouvel administrateur, vous devez ajouter son <strong>E-mail Google</strong> et son <strong>UID unique</strong> dans l'onglet "Utilisateurs".
                                                        </p>
                                                    </div>
                                                </div>
                                                <div 
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => setActiveTab('users')}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setActiveTab('users'); } }}
                                                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer text-left self-start mt-4 outline-none"
                                                >
                                                    Aller à la gestion des utilisateurs →
                                                </div>
                                            </div>

                                            {/* Column 3: Plus de mots de passe */}
                                            <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between gap-4">
                                                <div className="space-y-4">
                                                    <div className="bg-indigo-50/50 p-3 rounded-xl shadow-sm w-fit">
                                                        <CogIcon className="w-8 h-8 text-indigo-500" />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-gray-800 text-lg">
                                                            Plus de mots de passe
                                                        </h5>
                                                        <p className="text-xs text-gray-500 leading-relaxed mt-2">
                                                            Il n'est plus nécessaire de changer de mot de passe régulièrement. Google gère la sécurité de votre compte et la double authentification si activée.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-400 italic font-medium mt-4">
                                                    Sécurisé par Google Auth
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'emails' && (
                                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300 pb-20">
                                        {/* 1. CONFIGURATION ET CRITÈRES D'ENVOI (Options d'activation et paramètres généraux) */}
                                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                                    <CogIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold text-gray-800">Options d'envoi & Activation</h4>
                                                    <p className="text-xs text-gray-400">Activez ou désactivez les différents types d'e-mails et configurez leurs critères de déclenchement</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                {/* Conf Enseignant */}
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                            <AcademicCapIcon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-bold text-gray-800">E-mail de confirmation</h5>
                                                            <p className="text-[10px] text-gray-400">Envoi automatique à l'enseignant après réservation</p>
                                                        </div>
                                                    </div>
                                                    {/* Switch */}
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[10px] font-bold ${formState.emailTeacherEnabled !== false ? 'text-green-600' : 'text-red-500'}`}>
                                                            {formState.emailTeacherEnabled !== false ? 'Activé' : 'Désactivé'}
                                                        </span>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={formState.emailTeacherEnabled !== false}
                                                                disabled={currentUser?.role !== 'admin'}
                                                                onChange={(e) => {
                                                                    if (currentUser?.role === 'admin') {
                                                                        setFormState({ ...formState, emailTeacherEnabled: e.target.checked });
                                                                    }
                                                                }}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Notif Animateur */}
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                                            <BellIcon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-bold text-gray-800">E-mail de notification</h5>
                                                            <p className="text-[10px] text-gray-400">Envoi automatique à l'animateur concerné</p>
                                                        </div>
                                                    </div>
                                                    {/* Switch */}
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[10px] font-bold ${formState.emailAnimatorEnabled !== false ? 'text-green-600' : 'text-red-500'}`}>
                                                            {formState.emailAnimatorEnabled !== false ? 'Activé' : 'Désactivé'}
                                                        </span>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={formState.emailAnimatorEnabled !== false}
                                                                disabled={currentUser?.role !== 'admin'}
                                                                onChange={(e) => {
                                                                    if (currentUser?.role === 'admin') {
                                                                        setFormState({ ...formState, emailAnimatorEnabled: e.target.checked });
                                                                    }
                                                                }}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Notif Liste */}
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                                            <ListIcon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-bold text-gray-800">E-mail récapitulatif</h5>
                                                            <p className="text-[10px] text-gray-400">Envoi manuel lors d'un export de liste</p>
                                                        </div>
                                                    </div>
                                                    {/* Switch */}
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[10px] font-bold ${formState.emailListEnabled !== false ? 'text-green-600' : 'text-red-500'}`}>
                                                            {formState.emailListEnabled !== false ? 'Activé' : 'Désactivé'}
                                                        </span>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={formState.emailListEnabled !== false}
                                                                disabled={currentUser?.role !== 'admin'}
                                                                onChange={(e) => {
                                                                    if (currentUser?.role === 'admin') {
                                                                        setFormState({ ...formState, emailListEnabled: e.target.checked });
                                                                    }
                                                                }}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Rappel Automatique */}
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                                            <ClockIcon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-bold text-gray-800">Rappels de réservation</h5>
                                                            <p className="text-[10px] text-gray-400">Envoi de rappels automatique / manuel</p>
                                                        </div>
                                                    </div>
                                                    {/* Switch */}
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[10px] font-bold ${formState.emailReminderEnabled !== false ? 'text-green-600' : 'text-red-500'}`}>
                                                            {formState.emailReminderEnabled !== false ? 'Activé' : 'Désactivé'}
                                                        </span>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={formState.emailReminderEnabled !== false}
                                                                disabled={currentUser?.role !== 'admin'}
                                                                onChange={(e) => {
                                                                    if (currentUser?.role === 'admin') {
                                                                        setFormState({ ...formState, emailReminderEnabled: e.target.checked });
                                                                    }
                                                                }}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Options spécifiques pour l'e-mail de rappel automatique */}
                                            {formState.emailReminderEnabled !== false && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1.5">Délai du rappel automatique</label>
                                                        <select
                                                            value={formState.emailReminderDays || 2}
                                                            onChange={(e) => setFormState({ ...formState, emailReminderDays: parseInt(e.target.value) })}
                                                            className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-semibold text-sm text-gray-700"
                                                        >
                                                            <option value={1}>1 jour avant</option>
                                                            <option value={2}>2 jours avant</option>
                                                            <option value={3}>3 jours avant</option>
                                                            <option value={4}>4 jours avant</option>
                                                            <option value={5}>5 jours avant</option>
                                                            <option value={7}>7 jours avant</option>
                                                        </select>
                                                        <p className="text-[10px] text-amber-700/70 mt-1">Nombre de jours avant l'animation pour le déclenchement automatique</p>
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <label className="block text-[10px] font-black text-amber-800 uppercase tracking-widest">Destinataires des rappels :</label>
                                                        <div className="flex flex-wrap gap-6 pt-1">
                                                            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                                                                <input 
                                                                    type="checkbox"
                                                                    checked={formState.emailReminderTargetTeachers !== false}
                                                                    onChange={(e) => setFormState({ ...formState, emailReminderTargetTeachers: e.target.checked })}
                                                                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                                                />
                                                                Enseignants
                                                            </label>
                                                            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                                                                <input 
                                                                    type="checkbox"
                                                                    checked={!!formState.emailReminderTargetAnimators}
                                                                    onChange={(e) => setFormState({ ...formState, emailReminderTargetAnimators: e.target.checked })}
                                                                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                                                />
                                                                Animateurs
                                                            </label>
                                                        </div>
                                                        <p className="text-[10px] text-amber-700/70 mt-1">Détermine qui recevra l'e-mail de rappel (automatique ou manuel)</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* GESTION DU STATUT DES RÉSERVATIONS (Mode hybride / Test) */}
                                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                                        <CheckIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-gray-800">Gestion du statut des réservations</h4>
                                                        <p className="text-xs text-gray-400">Activer le suivi par statut (« À confirmer » / « Validé ») avec filtres et validation individuelle ou groupée</p>
                                                    </div>
                                                </div>
                                                {/* Switch */}
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[10px] font-bold ${formState.enableBookingStatus ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                        {formState.enableBookingStatus ? 'Activé' : 'Désactivé'}
                                                    </span>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!formState.enableBookingStatus}
                                                            disabled={currentUser?.role !== 'admin'}
                                                            onChange={(e) => {
                                                                if (currentUser?.role === 'admin') {
                                                                    setFormState({ ...formState, enableBookingStatus: e.target.checked });
                                                                }
                                                            }}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs text-gray-600 leading-relaxed space-y-1.5">
                                                <p className="font-semibold text-gray-700">📌 Fonctionnement en mode test / hybride (1ère année) :</p>
                                                <ul className="list-disc list-inside space-y-1 text-gray-500 pl-1 text-[11px]">
                                                    <li>Toute nouvelle inscription sur la plateforme est positionnée par défaut sur le statut <span className="font-bold text-amber-700">« À confirmer »</span>.</li>
                                                    <li>Le statut est visible dans la liste des réservations avec un badge clair et dynamique.</li>
                                                    <li>Vous disposez d'un filtre dédié pour trier les réservations par statut (À confirmer / Validé).</li>
                                                    <li>Vous pouvez valider des réservations individuellement d'un clic ou en masse en cochant plusieurs réservations.</li>
                                                </ul>
                                            </div>

                                            {/* Option d'envoi d'e-mail de notification à l'animateur lors de la validation */}
                                            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                                                        <SendIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h5 className="text-sm font-bold text-gray-800">Notification par e-mail à l'animateur lors de la validation</h5>
                                                        <p className="text-[11px] text-gray-500">Envoyer automatiquement l'e-mail de notification à l'animateur concerné lorsque le statut passe en « Validé » (fonctionnement indépendant de l'envoi lors de la réservation calendrier).</p>
                                                    </div>
                                                </div>
                                                {/* Switch */}
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    <span className={`text-[10px] font-bold ${formState.emailAnimatorOnValidationEnabled !== false ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {formState.emailAnimatorOnValidationEnabled !== false ? 'Activé' : 'Désactivé'}
                                                    </span>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={formState.emailAnimatorOnValidationEnabled !== false}
                                                            disabled={currentUser?.role !== 'admin'}
                                                            onChange={(e) => {
                                                                if (currentUser?.role === 'admin') {
                                                                    setFormState({ ...formState, emailAnimatorOnValidationEnabled: e.target.checked });
                                                                }
                                                            }}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-dashed border-gray-200 my-6"></div>

                                        {/* 2. GUIDE DES VARIABLES (Second element) */}
                                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex gap-4 items-start shadow-inner">
                                            <div className="bg-white p-2 rounded-lg shadow-sm">
                                               <CogIcon className="w-6 h-6 text-gray-600" />
                                            </div>
                                            <div>
                                                <h5 className="font-black text-gray-900 text-sm uppercase">Guide des variables</h5>
                                                <p className="text-xs text-gray-800 mt-2 leading-relaxed opacity-80">
                                                    Vous pouvez utiliser les variables suivantes dans votre code HTML ou sujet : <code>{`{{variable}}`}</code>
                                                </p>
                                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-2 mt-4 text-[10px] font-bold text-gray-600">
                                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div><code>{`{{animation_title}}`}</code></div>
                                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div><code>{`{{booking_date}}`}</code></div>
                                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div><code>{`{{booking_date_clean}}`}</code></div>
                                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div><code>{`{{booking_time}}`}</code></div>
                                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div><code>{`{{to_name}}`}</code></div>
                                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div><code>{`{{teacher_name}}`}</code></div>
                                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div><code>{`{{school_name}}`}</code></div>
                                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div><code>{`{{commune}}`}</code></div>
                                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div><code>{`{{student_count}}`}</code></div>
                                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div><code>{`{{adult_count}}`}</code></div>
                                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div><code>{`{{class_level}}`}</code></div>
                                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div><code>{`{{bus_info}}`}</code></div>
                                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div><code>{`{{teacher_phone}}`}</code></div>
                                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div><code>{`{{teacher_email}}`}</code></div>
                                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div><code>{`{{establishment_name}}`}</code></div>
                                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div><code>{`{{header_bg_color}}`}</code></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-dashed border-gray-200 my-6"></div>

                                        {/* 3. MODÈLES D'E-MAILS (TEMPLATES) (Third element) */}
                                        <div className="space-y-12">
                                            {/* Template 1: Confirmation Enseignant */}
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-600 rounded-lg text-white">
                                                            <AcademicCapIcon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-lg font-bold text-gray-800">E-mail de confirmation (Enseignant)</h4>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${formState.emailTeacherEnabled !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {formState.emailTeacherEnabled !== false ? 'Actif' : 'Inactif'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-400">Envoyé automatiquement à l'enseignant lors de sa réservation</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Sujet de l'e-mail</label>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if(window.confirm("Rétablir le sujet par défaut ?")) {
                                                                            setFormState({ ...formState, emailTeacherSubject: DEFAULT_EMAIL_TEACHER_SUBJECT });
                                                                        }
                                                                    }}
                                                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tight flex items-center gap-1"
                                                                >
                                                                    Rétablir
                                                                </button>
                                                            </div>
                                                            <input 
                                                                type="text" 
                                                                name="emailTeacherSubject" 
                                                                value={formState.emailTeacherSubject || ''} 
                                                                onChange={handleChange} 
                                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold" 
                                                                placeholder="Sujet de l'e-mail..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Code HTML (à copier dans EmailJS)</label>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if(window.confirm("Voulez-vous vraiment restaurer le modèle par défaut pour l'enseignant ? Vos modifications actuelles seront perdues.")) {
                                                                            setFormState({ ...formState, emailTeacherTemplate: DEFAULT_EMAIL_TEACHER_TEMPLATE });
                                                                            showNotification("Modèle Enseignant réinitialisé ! N'oubliez pas d'enregistrer.");
                                                                        }
                                                                    }}
                                                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tight flex items-center gap-1"
                                                                >
                                                                    <ArrowsPointingInIcon className="w-3 h-3" />
                                                                    Rétablir le défaut
                                                                </button>
                                                            </div>
                                                            <textarea 
                                                                value={formState.emailTeacherTemplate || ''}
                                                                onChange={(e) => setFormState({ ...formState, emailTeacherTemplate: e.target.value })}
                                                                className="w-full h-[500px] p-4 font-mono text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-900 text-blue-100 resize-none leading-relaxed"
                                                                spellCheck={false}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col">
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Aperçu du rendu</label>
                                                        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                                                            <div className="bg-gray-50 border-b border-gray-100 p-3 text-[10px] font-bold text-gray-400 flex items-center justify-between uppercase tracking-widest">
                                                                <span>Visualisation Temps Réel</span>
                                                                <div className="flex gap-1">
                                                                    <div className="w-2 h-2 rounded-full bg-red-300"></div>
                                                                    <div className="w-2 h-2 rounded-full bg-yellow-300"></div>
                                                                    <div className="w-2 h-2 rounded-full bg-green-300"></div>
                                                                </div>
                                                            </div>
                                                            <iframe 
                                                                title="Teacher Preview"
                                                                className="w-full flex-1 border-none"
                                                                srcDoc={((html) => {
                                                                    if (!html) return "<body style='display:flex;align-items:center;justify-center;height:100vh;color:#94a3b8;font-family:sans-serif;'>Aucun code HTML détecté</body>";
                                                                    const mockData = {
                                                                        animation_title: "Escape Game Numérique",
                                                                        booking_date: "Mercredi 15 Mai 2024",
                                                                        booking_date_clean: "15.05.2024",
                                                                        booking_time: "10:00 - 12:00",
                                                                        to_name: "Mme Martin",
                                                                        teacher_name: "Sophie Martin",
                                                                        school_name: "École Pasteur",
                                                                        commune: "Longwy",
                                                                        student_count: 24,
                                                                        adult_count: 3,
                                                                        class_level: "CM1/CM2",
                                                                        bus_info: "Non",
                                                                        teacher_phone: "06 00 00 00 00",
                                                                        teacher_email: "martin@ecole.fr",
                                                                        establishment_name: "MÉDIATHÈQUE DU GRAND LONGWY",
                                                                        header_bg_color: "#0f172a"
                                                                    };
                                                                    let rendered = html;
                                                                    Object.entries(mockData).forEach(([key, value]) => {
                                                                        rendered = rendered.replaceAll(`{{${key}}}`, String(value));
                                                                    });
                                                                    return rendered;
                                                                })(formState.emailTeacherTemplate || '')}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-dashed border-gray-200"></div>

                                            {/* Template 2: Notification Animateur */}
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-indigo-600 rounded-lg text-white">
                                                            <BellIcon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-lg font-bold text-gray-800">E-mail de notification (Animateur)</h4>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${formState.emailAnimatorEnabled !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {formState.emailAnimatorEnabled !== false ? 'Actif' : 'Inactif'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-400">Envoyé automatiquement à l'animateur concerné lors d'une réservation</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Sujet de l'e-mail</label>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if(window.confirm("Rétablir le sujet par défaut ?")) {
                                                                            setFormState({ ...formState, emailAnimatorSubject: DEFAULT_EMAIL_ANIMATOR_SUBJECT });
                                                                        }
                                                                    }}
                                                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tight flex items-center gap-1"
                                                                >
                                                                    Rétablir
                                                                </button>
                                                            </div>
                                                            <input 
                                                                type="text" 
                                                                name="emailAnimatorSubject" 
                                                                value={formState.emailAnimatorSubject || ''} 
                                                                onChange={handleChange} 
                                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-semibold" 
                                                                placeholder="Sujet de l'e-mail..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Code HTML (à copier dans EmailJS)</label>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if(window.confirm("Voulez-vous vraiment restaurer le modèle par défaut pour l'animateur ? Vos modifications actuelles seront perdues.")) {
                                                                            setFormState({ ...formState, emailAnimatorTemplate: DEFAULT_EMAIL_ANIMATOR_TEMPLATE });
                                                                            showNotification("Modèle Animateur réinitialisé ! N'oubliez pas d'enregistrer.");
                                                                        }
                                                                    }}
                                                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tight flex items-center gap-1"
                                                                >
                                                                    <ArrowsPointingInIcon className="w-3 h-3" />
                                                                    Rétablir le défaut
                                                                </button>
                                                            </div>
                                                            <textarea 
                                                                value={formState.emailAnimatorTemplate || ''}
                                                                onChange={(e) => setFormState({ ...formState, emailAnimatorTemplate: e.target.value })}
                                                                className="w-full h-[500px] p-4 font-mono text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-900 text-blue-100 resize-none leading-relaxed"
                                                                spellCheck={false}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col">
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Aperçu du rendu</label>
                                                        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                                                            <div className="bg-gray-50 border-b border-gray-100 p-3 text-[10px] font-bold text-gray-400 flex items-center justify-between uppercase tracking-widest">
                                                                <span>Visualisation Temps Réel</span>
                                                                <div className="flex gap-1">
                                                                    <div className="w-2 h-2 rounded-full bg-red-300"></div>
                                                                    <div className="w-2 h-2 rounded-full bg-yellow-300"></div>
                                                                    <div className="w-2 h-2 rounded-full bg-green-300"></div>
                                                                </div>
                                                            </div>
                                                            <iframe 
                                                                title="Animator Preview"
                                                                className="w-full flex-1 border-none"
                                                                srcDoc={((html) => {
                                                                    if (!html) return "<body style='display:flex;align-items:center;justify-center;height:100vh;color:#94a3b8;font-family:sans-serif;'>Aucun code HTML détecté</body>";
                                                                    const mockData = {
                                                                        animation_title: "Atelier Robotique",
                                                                        booking_date: "Samedi 18 Mai 2024",
                                                                        booking_date_clean: "18.05.2024",
                                                                        booking_time: "14:00 - 16:00",
                                                                        to_name: "Jean Dupont",
                                                                        animator_name: "Jean Dupont",
                                                                        teacher_name: "Lucie Bernard",
                                                                        school_name: "Collège Daudet",
                                                                        commune: "Longlaville",
                                                                        student_count: 15,
                                                                        adult_count: 2,
                                                                        class_level: "3ème A",
                                                                        bus_info: "Oui (Dépose minute souhaitée)",
                                                                        teacher_phone: "07 11 22 33 44",
                                                                        teacher_email: "bernard@college.fr",
                                                                        establishment_name: "MÉDIATHÈQUE DU GRAND LONGWY",
                                                                        header_bg_color: "#0f172a"
                                                                    };
                                                                    let rendered = html;
                                                                    Object.entries(mockData).forEach(([key, value]) => {
                                                                        rendered = rendered.replaceAll(`{{${key}}}`, String(value));
                                                                    });
                                                                    return rendered;
                                                                })(formState.emailAnimatorTemplate || '')}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-dashed border-gray-200"></div>

                                            {/* Template 3: Recapitualtif Liste */}
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-green-600 rounded-lg text-white">
                                                            <ListIcon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-lg font-bold text-gray-800">E-mail récapitulatif (Liste de réservations)</h4>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${formState.emailListEnabled !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {formState.emailListEnabled !== false ? 'Actif' : 'Inactif'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-400">Envoyé lors de l'exportation manuelle d'une liste de réservations</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Sujet de l'e-mail</label>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if(window.confirm("Rétablir le sujet par défaut ?")) {
                                                                            setFormState({ ...formState, emailListSubject: DEFAULT_EMAIL_LIST_SUBJECT });
                                                                        }
                                                                    }}
                                                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tight flex items-center gap-1"
                                                                >
                                                                    Rétablir
                                                                </button>
                                                            </div>
                                                            <input 
                                                                type="text" 
                                                                name="emailListSubject" 
                                                                value={formState.emailListSubject || ''} 
                                                                onChange={handleChange} 
                                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white font-semibold" 
                                                                placeholder="Sujet de l'e-mail..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Code HTML (à copier dans EmailJS)</label>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if(window.confirm("Voulez-vous vraiment restaurer le modèle par défaut pour la liste des réservations ? Vos modifications actuelles seront perdues.")) {
                                                                            setFormState({ ...formState, emailListTemplate: DEFAULT_EMAIL_LIST_TEMPLATE });
                                                                            showNotification("Modèle Liste réinitialisé ! N'oubliez pas d'enregistrer.");
                                                                        }
                                                                    }}
                                                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tight flex items-center gap-1"
                                                                >
                                                                    <ArrowsPointingInIcon className="w-3 h-3" />
                                                                    Rétablir le défaut
                                                                </button>
                                                            </div>
                                                            <textarea 
                                                                value={formState.emailListTemplate || ''}
                                                                onChange={(e) => setFormState({ ...formState, emailListTemplate: e.target.value })}
                                                                className="w-full h-[500px] p-4 font-mono text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-gray-900 text-green-100 resize-none leading-relaxed"
                                                                spellCheck={false}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col">
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Aperçu du rendu</label>
                                                        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                                                            <div className="bg-gray-50 border-b border-gray-100 p-3 text-[10px] font-bold text-gray-400 flex items-center justify-between uppercase tracking-widest">
                                                                <span>Visualisation Temps Réel</span>
                                                                <div className="flex gap-1">
                                                                    <div className="w-2 h-2 rounded-full bg-red-300"></div>
                                                                    <div className="w-2 h-2 rounded-full bg-yellow-300"></div>
                                                                    <div className="w-2 h-2 rounded-full bg-green-300"></div>
                                                                </div>
                                                            </div>
                                                            <iframe 
                                                                title="List Preview"
                                                                className="w-full flex-1 border-none"
                                                                srcDoc={((html) => {
                                                                    if (!html) return "<body style='display:flex;align-items:center;justify-center;height:100vh;color:#94a3b8;font-family:sans-serif;'>Aucun code HTML détecté</body>";
                                                                    const mockData = {
                                                                        bookings_count: 2,
                                                                        bookings_rows: `
                                                                            <tr>
                                                                                <td style="padding: 12px; font-size: 14px; border-right: 1px solid #edf2f7; border-bottom: 1px solid #edf2f7; line-height: 1.4;">
                                                                                    <div style="font-weight: bold; color: #0f172a;">Escape Game Numérique</div>
                                                                                    <div style="font-weight: bold; color: #2563eb; font-size: 12px;">Jeudi 15 mai 2024 à 09h</div>
                                                                                </td>
                                                                                <td style="padding: 12px; font-size: 14px; border-right: 1px solid #edf2f7; color: #1e293b; border-bottom: 1px solid #edf2f7;">M. Jean</td>
                                                                                <td style="padding: 12px; font-size: 14px; border-right: 1px solid #edf2f7; color: #1e293b; border-bottom: 1px solid #edf2f7;">Moulin (GORCY)</td>
                                                                                <td style="padding: 12px; font-size: 14px; border-right: 1px solid #edf2f7; color: #1e293b; border-bottom: 1px solid #edf2f7;">CE1</td>
                                                                                <td style="padding: 12px; font-size: 14px; color: #1e293b; line-height: 1.4; border-bottom: 1px solid #edf2f7;">
                                                                                    <div>25 élèves</div>
                                                                                    <div style="color: #64748b; font-size: 12px;">4 adultes</div>
                                                                                </td>
                                                                            </tr>
                                                                            <tr>
                                                                                <td style="padding: 12px; font-size: 14px; border-right: 1px solid #edf2f7; border-bottom: 1px solid #edf2f7; line-height: 1.4;">
                                                                                    <div style="font-weight: bold; color: #0f172a;">Atelier Robotique</div>
                                                                                    <div style="font-weight: bold; color: #2563eb; font-size: 12px;">Vendredi 16 mai 2024 à 14h</div>
                                                                                </td>
                                                                                <td style="padding: 12px; font-size: 14px; border-right: 1px solid #edf2f7; color: #1e293b; border-bottom: 1px solid #edf2f7;">Mme. Marie</td>
                                                                                <td style="padding: 12px; font-size: 14px; border-right: 1px solid #edf2f7; color: #1e293b; border-bottom: 1px solid #edf2f7;">Hugo (LONGWY)</td>
                                                                                <td style="padding: 12px; font-size: 14px; border-right: 1px solid #edf2f7; color: #1e293b; border-bottom: 1px solid #edf2f7;">CM2</td>
                                                                                <td style="padding: 12px; font-size: 14px; color: #1e293b; line-height: 1.4; border-bottom: 1px solid #edf2f7;">
                                                                                    <div>22 élèves</div>
                                                                                    <div style="color: #64748b; font-size: 12px;">2 adultes</div>
                                                                                </td>
                                                                            </tr>
                                                                        `,
                                                                        establishment_name: "MÉDIATHÈQUE DU GRAND LONGWY",
                                                                        header_bg_color: "#059669"
                                                                    };
                                                                    let rendered = html;
                                                                    Object.entries(mockData).forEach(([key, value]) => {
                                                                        rendered = rendered.replaceAll(`{{${key}}}`, String(value));
                                                                    });
                                                                    return rendered;
                                                                })(formState.emailListTemplate || '')}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-dashed border-gray-200"></div>

                                            {/* Template 4: Rappel Automatique */}
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-amber-600 rounded-lg text-white">
                                                            <ClockIcon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-lg font-bold text-gray-800">E-mail de rappel automatique</h4>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${formState.emailReminderEnabled !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {formState.emailReminderEnabled !== false ? 'Actif' : 'Inactif'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-400">Modèle de l'e-mail de rappel envoyé aux destinataires avant leur animation</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Sujet de l'e-mail</label>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if(window.confirm("Rétablir le sujet par défaut ?")) {
                                                                            setFormState({ ...formState, emailReminderSubject: DEFAULT_EMAIL_REMINDER_SUBJECT });
                                                                        }
                                                                    }}
                                                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tight flex items-center gap-1"
                                                                >
                                                                    Rétablir
                                                                </button>
                                                            </div>
                                                            <input 
                                                                type="text" 
                                                                name="emailReminderSubject" 
                                                                value={formState.emailReminderSubject || ''} 
                                                                onChange={handleChange} 
                                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-semibold" 
                                                                placeholder="Sujet de l'e-mail de rappel..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Code HTML (template_rappel)</label>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if(window.confirm("Voulez-vous vraiment restaurer le modèle par défaut pour le rappel ? Vos modifications actuelles seront perdues.")) {
                                                                            setFormState({ ...formState, emailReminderTemplate: DEFAULT_EMAIL_REMINDER_TEMPLATE });
                                                                            showNotification("Modèle Rappel réinitialisé ! N'oubliez pas d'enregistrer.");
                                                                        }
                                                                    }}
                                                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tight flex items-center gap-1"
                                                                >
                                                                    <ArrowsPointingInIcon className="w-3 h-3" />
                                                                    Rétablir le défaut
                                                                </button>
                                                            </div>
                                                            <textarea 
                                                                value={formState.emailReminderTemplate || ''}
                                                                onChange={(e) => setFormState({ ...formState, emailReminderTemplate: e.target.value })}
                                                                className="w-full h-[500px] p-4 font-mono text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-gray-900 text-blue-100 resize-none leading-relaxed"
                                                                spellCheck={false}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col">
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Aperçu du rendu</label>
                                                        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                                                            <div className="bg-gray-50 border-b border-gray-100 p-3 text-[10px] font-bold text-gray-400 flex items-center justify-between uppercase tracking-widest">
                                                                <span>Visualisation Temps Réel</span>
                                                                <div className="flex gap-1">
                                                                    <div className="w-2 h-2 rounded-full bg-red-300"></div>
                                                                    <div className="w-2 h-2 rounded-full bg-yellow-300"></div>
                                                                    <div className="w-2 h-2 rounded-full bg-green-300"></div>
                                                                </div>
                                                            </div>
                                                            <iframe 
                                                                title="Reminder Preview"
                                                                className="w-full flex-1 border-none"
                                                                srcDoc={((html) => {
                                                                    if (!html) return "<body style='display:flex;align-items:center;justify-center;height:100vh;color:#94a3b8;font-family:sans-serif;'>Aucun code HTML détecté</body>";
                                                                    const mockData = {
                                                                        animation_title: "Escape Game Numérique",
                                                                        booking_date: "Mercredi 15 Mai 2024",
                                                                        booking_date_clean: "15.05.2024",
                                                                        booking_time: "10:00 - 12:00",
                                                                        to_name: "Mme Martin",
                                                                        teacher_name: "Sophie Martin",
                                                                        school_name: "École Pasteur",
                                                                        commune: "Longwy",
                                                                        student_count: 24,
                                                                        adult_count: 3,
                                                                        class_level: "CM1/CM2",
                                                                        bus_info: "Non",
                                                                        teacher_phone: "06 00 00 00 00",
                                                                        teacher_email: "martin@ecole.fr",
                                                                        establishment_name: "MÉDIATHÈQUE DU GRAND LONGWY",
                                                                        header_bg_color: "#b45309"
                                                                    };
                                                                    let rendered = html;
                                                                    Object.entries(mockData).forEach(([key, value]) => {
                                                                        rendered = rendered.replaceAll(`{{${key}}}`, String(value));
                                                                    });
                                                                    return rendered;
                                                                })(formState.emailReminderTemplate || '')}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'maintenance' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            
                                            {/* Export Panel */}
                                            <div className="p-8 bg-blue-50/50 rounded-3xl border border-blue-100 flex flex-col items-center text-center">
                                                <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                                                    <DownloadIcon className="w-10 h-10 text-blue-500" />
                                                </div>
                                                <h4 className="text-lg font-black text-blue-900 uppercase tracking-tight">Sauvegarde Complète</h4>
                                                <p className="text-sm text-blue-700 mt-2 mb-2 opacity-80">
                                                    Téléchargez l'intégralité de vos réservations, paramètres et animateurs dans un seul fichier JSON.
                                                </p>
                                                <div className="mb-6">
                                                    {settings.lastExportDate ? (
                                                        <span className="text-[11px] font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                                                            Dernier export : {new Date(settings.lastExportDate).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase">
                                                            Aucun export enregistré
                                                        </span>
                                                    )}
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={async () => {
                                                        try {
                                                            showNotification("Préparation de la sauvegarde...", "success");
                                                            
                                                            const now = new Date().toISOString();
                                                            // 1. Sauvegarder d'abord la nouvelle date d'export pour qu'elle soit incluse dans le fichier téléchargé
                                                            await updateSettings({ lastExportDate: now });
                                                            setFormState(prev => ({ ...prev, lastExportDate: now }));
                                                            
                                                            // 2. Récupérer l'ensemble des données (maintenant à jour avec la nouvelle date)
                                                            const backup = await backupService.exportData();
                                                            if (backup) {
                                                                backupService.downloadBackup(backup);
                                                                showNotification("Sauvegarde téléchargée !");
                                                            } else {
                                                                showNotification("Erreur lors de l'export des données", "error");
                                                            }
                                                        } catch (e) {
                                                            showNotification("Erreur lors de l'export.", "error");
                                                        }
                                                    }}
                                                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3"
                                                >
                                                    Exporter les données
                                                </button>
                                            </div>

                                            {/* Import Panel */}
                                            <div className="p-8 bg-red-50/50 rounded-3xl border border-red-100 flex flex-col items-center text-center">
                                                <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                                                    <PlusCircleIcon className="w-10 h-10 text-red-500" />
                                                </div>
                                                <h4 className="text-lg font-black text-red-900 uppercase tracking-tight">Restauration</h4>
                                                <p className="text-sm text-red-700 mt-2 mb-6 opacity-80 font-medium">
                                                    <span className="text-red-600 font-bold underline">Attention :</span> La restauration écrasera vos paramètres et ajoutera les données manquantes.
                                                </p>
                                                
                                                <label className="w-full cursor-pointer">
                                                    <div className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-100 transition-all flex items-center justify-center gap-3">
                                                        Restaurer (Importer JSON)
                                                        <input 
                                                            type="file" 
                                                            accept=".json" 
                                                            className="hidden" 
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                setPendingRestoreFile(file);
                                                                setShowRestoreConfirm(true);
                                                                e.target.value = ''; // Reset for next selection
                                                            }} 
                                                        />
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-100 flex gap-4 items-start shadow-inner">
                                            <div className="bg-white p-2 rounded-lg shadow-sm">
                                               <CogIcon className="w-6 h-6 text-yellow-600" />
                                            </div>
                                            <div>
                                                <h5 className="font-black text-yellow-900 text-sm uppercase">Conseils de Maintenance</h5>
                                                <p className="text-xs text-yellow-800 mt-1 leading-relaxed opacity-80">
                                                    Il est fortement recommandé d'effectuer une sauvegarde avant chaque changement d'année scolaire ou avant de modifier des paramètres critiques. Conservez vos fichiers JSON dans un endroit sûr et organisé par date.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'information' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                            
                                            {/* Stack technique */}
                                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                                        <ViewGridIcon className="w-5 h-5" />
                                                    </div>
                                                    <h4 className="text-lg font-black text-gray-800 uppercase tracking-tight">Architecture et technologies</h4>
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                                                        <div className="bg-white p-2 rounded-xl shadow-sm text-indigo-600 font-black text-xs h-fit">Web</div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-800">Interface utilisateur (frontend)</div>
                                                            <p className="text-xs text-gray-500 mt-1">Développé avec <strong>React 18</strong> et <strong>TypeScript</strong>. Le design est propulsé par <strong>Tailwind CSS</strong> pour une interface moderne, rapide et responsive sur tous les supports (mobiles, tablettes, ordinateurs).</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                                                        <div className="bg-white p-2 rounded-xl shadow-sm text-orange-600 font-black text-xs h-fit">DB</div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-800">Base de données et stockage</div>
                                                            <p className="text-xs text-gray-500 mt-1">Utilise <strong>Google Firebase Firestore</strong> pour une persistance des données en temps réel. Les images et logos sont hébergés de manière sécurisée via <strong>Cloudinary</strong>.</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                                                        <div className="bg-white p-2 rounded-xl shadow-sm text-green-600 font-black text-xs h-fit">API</div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-800">Services connectés</div>
                                                            <p className="text-xs text-gray-500 mt-1"><strong>EmailJS</strong> assure l'envoi fiable des confirmations de réservation par e-mail sans serveur mail complexe à maintenir. <strong>SheetJS</strong> permet l'import/export de listes complexes via Excel.</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                                                        <div className="bg-white p-2 rounded-xl shadow-sm text-blue-600 font-black text-xs h-fit">Héb.</div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-800">Hébergement et code source</div>
                                                            <p className="text-xs text-gray-500 mt-1">L'application est déployée et hébergée sur la plateforme cloud <strong>Netlify</strong>, garantissant des temps de chargement ultra-courts et une sécurité maximale. Le code source du site est stocké et versionné de manière sécurisée sur <strong>GitHub</strong>, facilitant les mises à jour et la maintenance.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sécurité et diagnostic */}
                                            <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white/10 rounded-lg text-indigo-200">
                                                        <ShieldCheckIcon className="w-5 h-5" />
                                                    </div>
                                                    <h4 className="text-lg font-black uppercase tracking-tight">Sécurité et diagnostic</h4>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="text-sm font-bold text-indigo-200">Protection des données</div>
                                                            <div className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-black rounded-full border border-green-500/30 uppercase">Optimal</div>
                                                        </div>
                                                        <p className="text-xs text-white/70 leading-relaxed">
                                                            Les données sont stockées sur les serveurs de Google Cloud, bénéficiant d'un chiffrement automatique au repos. Les règles de sécurité Firestore empêchent tout accès non autorisé à la source.
                                                        </p>
                                                    </div>

                                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="text-sm font-bold text-indigo-200">Authentification</div>
                                                            <div className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-black rounded-full border border-green-500/30 uppercase">Actif</div>
                                                        </div>
                                                        <p className="text-xs text-white/70 leading-relaxed">
                                                            L'accès à cette administration est protégé par une authentification robuste (Firebase Auth). Le mot de passe administrateur est haché et jamais stocké en clair.
                                                        </p>
                                                    </div>

                                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="text-sm font-bold text-indigo-200">Conformité RGPD</div>
                                                            <div className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-black rounded-full border border-blue-500/30 uppercase">En place</div>
                                                        </div>
                                                        <p className="text-xs text-white/70 leading-relaxed">
                                                            Un système de nettoyage automatique peut être activé (onglet Données) pour anonymiser les réservations passées chaque année, garantissant le respect de la vie privée.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="pt-2 p-4 bg-indigo-800/50 rounded-2xl border border-indigo-700/50">
                                                    <h5 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 text-center">Diagnostic de stabilité</h5>
                                                    <div className="flex justify-between items-center px-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className="text-lg font-black text-white">99.9%</div>
                                                            <div className="text-[8px] text-indigo-300 font-bold uppercase">Disponibilité cloud</div>
                                                        </div>
                                                        <div className="h-8 w-px bg-indigo-700/50 line-clamp-1"></div>
                                                        <div className="flex flex-col items-center">
                                                            <div className="text-lg font-black text-white">&lt; 2s</div>
                                                            <div className="text-[8px] text-indigo-300 font-bold uppercase">Temps de chargement</div>
                                                        </div>
                                                        <div className="h-8 w-px bg-indigo-700/50"></div>
                                                        <div className="flex flex-col items-center">
                                                            <div className="text-lg font-black text-white">OK</div>
                                                            <div className="text-[8px] text-indigo-300 font-bold uppercase">Intégrité base de données</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Performance & Stabilité */}
                                        <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-center text-center">
                                            <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                                                <CogIcon className="w-10 h-10 text-gray-400" />
                                            </div>
                                            <h4 className="text-lg font-black text-gray-800 uppercase tracking-tight">Systèmes de stabilité et de rapidité</h4>
                                            <div className="max-w-3xl mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <div className="text-blue-600 font-black text-xs uppercase tracking-widest">Temps de chargement</div>
                                                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">L'application est servie via un CDN mondial, garantissant que les fichiers sont livrés par le serveur le plus de proche de l'utilisateur.</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="text-purple-600 font-black text-xs uppercase tracking-widest">Optimisation des images</div>
                                                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">Cloudinary redimensionne et optimise automatiquement les images pour réduire leur poids sans sacrifier la qualité visuelle.</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="text-green-600 font-black text-xs uppercase tracking-widest">Infrastructure de pointe (Edge)</div>
                                                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">Le code frontend est compilé de manière optimale (Vite), éliminant le code inutile pour une exécution ultra-fluide sur mobile.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Panel spacer */}
                            <div className="h-4 bg-gray-50/10 border-t border-gray-50"></div>
                        </div>
                        </fieldset>
                    </form>
                </div>
            </div>
            
            <ConfirmationModal 
                isOpen={showRestoreConfirm}
                title="Confirmer la restauration"
                message="CRITIQUE : Vous allez restaurer des données. Cela écrasera vos paramètres actuels et fusionnera les données. Cette action est irréversible. Voulez-vous continuer ?"
                confirmLabel="Restaurer maintenant"
                isDanger={true}
                onConfirm={async () => {
                    if (!pendingRestoreFile) return;
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        try {
                            const backupStr = event.target?.result as string;
                            const backup = JSON.parse(backupStr);
                            
                            if (!backup.data || !backup.version) {
                                throw new Error("Format de sauvegarde invalide.");
                            }
                            
                            showNotification("Restauration en cours...", "success");
                            await backupService.restoreData(backup, (msg) => {
                                console.log(msg);
                            });
                            showNotification("Restauration terminée ! Rechargez la page.");
                            setTimeout(() => window.location.reload(), 2000);
                        } catch (err) {
                            showNotification("Erreur lors de l'import : " + (err instanceof Error ? err.message : "Inconnu"), "error");
                        } finally {
                            setPendingRestoreFile(null);
                            setShowRestoreConfirm(false);
                        }
                    };
                    reader.readAsText(pendingRestoreFile);
                }}
                onCancel={() => {
                    setShowRestoreConfirm(false);
                    setPendingRestoreFile(null);
                }}
            />
        </div>
    );
};

export default ManageSettings;
