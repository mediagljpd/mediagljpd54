
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../AppContext';
import { AppSettings } from '../../types';
import { LEGAL_TEMPLATES } from '../../constants';
import { AdminSubComponentProps } from './types';
import { storageService } from '../../services/storageService';
import { backupService } from '../../services/backupService';
import ConfirmationModal from '../shared/ConfirmationModal';
import { PaintBrushIcon, CogIcon, BellIcon, CalendarDaysIcon, PlusCircleIcon, PencilIcon, CheckIcon, XIcon, TrashIcon, DatabaseIcon, MapPinIcon, AcademicCapIcon, BuildingLibraryIcon, ListIcon, UserGroupIcon, ViewGridIcon, SortAscIcon, SortDescIcon, DownloadIcon, ShieldCheckIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, InformationCircleIcon } from '../Icons';
import * as XLSX from 'xlsx';
import { validatePassword } from '../../utils/validators';
import PasswordPolicy from './PasswordPolicy';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import ManageUsers from './ManageUsers';
import ManageStats from './ManageStats';

type SettingsTab = 'design' | 'rules' | 'data' | 'stats' | 'users' | 'footer' | 'security' | 'pages' | 'maintenance' | 'emails' | 'information';

const DEFAULT_EMAIL_TEACHER_SUBJECT = "✅ Confirmation : {{animation_title}} le {{booking_date_clean}}";
const DEFAULT_EMAIL_TEACHER_TEMPLATE = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Confirmation Réservation</title>
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
                        <td style="padding: 40px 30px 20px 30px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                                <tr>
                                    <td style="color: #0f172a; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; font-size: 28px; font-weight: bold; text-transform: uppercase;">
                                        {{animation_title}}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 0 25px 0; color: #64748b; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; font-size: 20px;">
                                        Bonjour {{to_name}}, votre réservation a bien été enregistrée.
                                    </td>
                                </tr>
                                <tr>
                                    <td bgcolor="#f8fafc" style="padding: 30px; color: #ffffff; text-align: center; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                                            <tr>
                                                <td width="50%" style="padding: 10px; border-right: 1px solid #e2e8f0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                                                    <div style="font-size: 20px; font-weight: bold; color: #64748b; text-transform: uppercase; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">Date</div>
                                                    <div style="font-size: 20px; font-weight: bold; color: #0f172a; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">{{booking_date}}</div>
                                                </td>
                                                <td width="50%" style="padding: 10px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                                                    <div style="font-size: 20px; font-weight: bold; color: #64748b; text-transform: uppercase; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">Horaire</div>
                                                    <div style="font-size: 20px; font-weight: bold; color: #0f172a; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">{{booking_time}}</div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 40px 0 10px 0; font-size: 20px; font-weight: bold; color: #4338ca; text-transform: uppercase; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                                        Votre classe
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 0 0 0; font-size: 20px; border-top: 1px solid #eef2ff; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; line-height: 1.5;">
                                        <b>École :</b> {{school_name}} ({{commune}})<br/>
                                        <b>Niveau :</b> {{class_level}}<br/>
                                        <b>Effectif :</b> {{student_count}} élèves / {{adult_count}} adultes<br/>
                                        <b>Transport :</b> {{bus_info}}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px 40px 30px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#fffbeb" style="border: 1px solid #fef3c7; border-radius: 8px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                                <tr>
                                    <td style="padding: 20px; font-size: 18px; color: #92400e; line-height: 24px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif;">
                                        <b>Note :</b> pour toute demande de renseignement, modification ou annulation de rendez-vous, merci de nous contacter directement par téléphone au 03.82.23.15.76 ou par mail à l'adresse mediatheque@grandlongwy.fr
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding: 40px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; font-size: 14px; color: #94a3b8; text-align: center; line-height: 1.5;">
                            Cet e-mail est envoyé automatiquement, merci de ne pas y répondre directement.
                            <br/><br/>
                            Conformément au RGPD, vous disposez d'un droit d'accès et de rectification de vos données. 
                            Ces informations sont utilisées exclusivement pour la gestion de votre réservation.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

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
                    <tr>
                        <td align="center" style="padding: 40px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; font-size: 14px; color: #94a3b8; text-align: center; line-height: 1.5;">
                            Cet e-mail est envoyé automatiquement, merci de ne pas y répondre directement.
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
                                    <tr style="background-color: #f8fafc; text-align: left; border-bottom: 2px solid #e2e8f0;">
                                        <th width="25%" style="padding: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; border-right: 1px solid #e2e8f0;">Animation / Date</th>
                                        <th width="20%" style="padding: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; border-right: 1px solid #e2e8f0;">Enseignant</th>
                                        <th width="25%" style="padding: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; border-right: 1px solid #e2e8f0;">École / Commune</th>
                                        <th width="15%" style="padding: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; border-right: 1px solid #e2e8f0;">Niveau</th>
                                        <th width="15%" style="padding: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b;">Effectifs</th>
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
                        <td align="center" style="padding: 40px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; font-size: 14px; color: #94a3b8; text-align: center; line-height: 1.5;">
                            Cet e-mail est envoyé automatiquement, merci de ne pas y répondre directement.
                            <br/><br/>
                            Conformément au RGPD, vous disposez d'un droit d'accès et de rectification de vos données. 
                            Ces informations sont utilisées exclusivement pour la gestion de vos réservations.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const ManageSettings: React.FC<AdminSubComponentProps> = ({ showNotification }) => {
    const { settings, updateSettings } = useContext(AppContext);

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
        
        setFormState(migSettings);
    }, [settings]);

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

    const handleUpdateEstablishmentInfo = (field: string, value: string) => {
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

    const quillModules = {
        toolbar: [
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
    };

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
            'passwordExpiryDays', 'headerInfoText', 'headerInfoFontSize', 
            'headerInfoFontWeight', 'headerInfoFontStyle', 'headerInfoColor', 'headerInfoWidth',
            'emailTeacherTemplate', 'emailTeacherSubject', 'emailAnimatorTemplate', 'emailAnimatorSubject',
            'emailListTemplate', 'emailListSubject'
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
            onClick={() => {
                setActiveTab(id);
                setEditingLegalPage(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                activeTab === id 
                ? 'bg-blue-600 text-white shadow-md transform scale-[1.02]' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Sidebar Navigation */}
                <aside className="w-full lg:w-64 flex-shrink-0 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto custom-scrollbar">
                    <div className="hidden lg:block px-4 py-3 mb-2 border-b border-gray-50">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Configuration</h2>
                    </div>
                    <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                        <NavButton id="design" label="Apparence" icon={<PaintBrushIcon className="w-5 h-5" />} />
                        <NavButton id="pages" label="Pages d'info" icon={<ViewGridIcon className="w-5 h-5" />} />
                        <NavButton id="footer" label="Pied de page" icon={<PencilIcon className="w-5 h-5" />} />
                        <NavButton id="rules" label="Calendrier" icon={<CalendarDaysIcon className="w-5 h-5" />} />
                        <NavButton id="data" label="Données" icon={<DatabaseIcon className="w-5 h-5" />} />
                        <NavButton id="stats" label="Statistiques" icon={<ListIcon className="w-5 h-5" />} />
                        <NavButton id="security" label="Sécurité" icon={<CogIcon className="w-5 h-5" />} />
                        <NavButton id="users" label="Utilisateurs" icon={<UserGroupIcon className="w-5 h-5" />} />
                        <NavButton id="emails" label="E-mails" icon={<BellIcon className="w-5 h-5" />} />
                        <NavButton id="maintenance" label="Maintenance" icon={<ShieldCheckIcon className="w-5 h-5" />} />
                        <NavButton id="information" label="Informations" icon={<InformationCircleIcon className="w-5 h-5" />} />
                    </nav>
                </aside>

                {/* Main Content Pane */}
                <div className="flex-grow w-full">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
                            
                            {/* Header Panel */}
                            <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
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
                                    {activeTab === 'information' && "Informations Techniques"}
                                </h3>
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
                                    <ManageUsers showNotification={showNotification} />
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
                                                            theme="snow"
                                                            value={formState[editingLegalPage] || ''}
                                                            onChange={(content) => setFormState({ ...formState, [editingLegalPage]: content })}
                                                            modules={quillModules}
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
                                                        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Logo de l'établissement</span>
                                                            <div className="relative w-40 h-40 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center mb-4">
                                                                {formState.establishmentInfo?.logoUrl ? (
                                                                    <img src={formState.establishmentInfo.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
                                                                ) : (
                                                                    <div className="text-gray-300 text-xs italic text-center px-4">Aucun logo importé</div>
                                                                )}
                                                                {uploadingField === 'establishmentLogo' && (
                                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <label className={`cursor-pointer px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-bold text-blue-600 hover:bg-blue-50 transition-all ${uploadingField ? 'opacity-50 pointer-events-none' : ''}`}>
                                                                Importer un logo
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
                                                                                showNotification("Logo mis à jour !");
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
                                                                    theme="snow"
                                                                    value={(formState.infoPages || []).find(p => p.id === editingInfoPageId)?.content || ''}
                                                                    onChange={(content) => handleUpdateInfoPage(editingInfoPageId, 'content', content)}
                                                                    modules={quillModules}
                                                                    formats={quillFormats}
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
                                    </div>
                                )}

                                {activeTab === 'security' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="max-w-2xl space-y-6">
                                            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                                                <div className="bg-white p-3 rounded-xl shadow-sm">
                                                    <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-blue-900 uppercase tracking-tight">Sécurité Google OAuth</h4>
                                                    <p className="text-sm text-blue-700 mt-2">
                                                        L'administration est désormais sécurisée par <strong>Google Authentication</strong>. 
                                                        Les anciens mots de passe ont été supprimés pour garantir une sécurité maximale.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                                    <h5 className="font-bold text-gray-800 flex items-center gap-2">
                                                        <UserGroupIcon className="w-4 h-4 text-indigo-500" />
                                                        Gestion des accès
                                                    </h5>
                                                    <p className="text-xs text-gray-500 leading-relaxed">
                                                        Pour autoriser un nouvel administrateur, vous devez ajouter son <strong>E-mail Google</strong> et son <strong>UID unique</strong> dans l'onglet "Utilisateurs".
                                                    </p>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setActiveTab('users')}
                                                        className="text-xs font-bold text-indigo-600 hover:underline"
                                                    >
                                                        Aller à la gestion des utilisateurs →
                                                    </button>
                                                </div>

                                                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                                    <h5 className="font-bold text-gray-800 flex items-center gap-2">
                                                        <CogIcon className="w-4 h-4 text-indigo-500" />
                                                        Plus de mots de passe
                                                    </h5>
                                                    <p className="text-xs text-gray-500 leading-relaxed">
                                                        Il n'est plus nécessaire de changer de mot de passe régulièrement. Google gère la sécurité de votre compte et la double authentification si activée.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'emails' && (
                                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300 pb-20">
                                        {/* Teacher Email Template */}
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-600 rounded-lg text-white">
                                                        <AcademicCapIcon className="w-5 h-5" />
                                                    </div>
                                                    <h4 className="text-lg font-bold text-gray-800">E-mail de confirmation (Enseignant)</h4>
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

                                        {/* Animator Email Template */}
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-600 rounded-lg text-white">
                                                        <BellIcon className="w-5 h-5" />
                                                    </div>
                                                    <h4 className="text-lg font-bold text-gray-800">E-mail de notification (Animateur)</h4>
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

                                        {/* Booking List Email Template */}
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-green-600 rounded-lg text-white">
                                                        <ListIcon className="w-5 h-5" />
                                                    </div>
                                                    <h4 className="text-lg font-bold text-gray-800">E-mail récapitulatif (Liste de réservations)</h4>
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
                                                                        <tr style="border-bottom: 1px solid #edf2f7;">
                                                                            <td style="padding: 12px; font-size: 14px; border-right: 1px solid #edf2f7; line-height: 1.4;">
                                                                                <div style="font-weight: bold; color: #0f172a;">Escape Game Numérique</div>
                                                                                <div style="font-weight: bold; color: #2563eb; font-size: 12px;">Jeudi 15 mai 2024 à 09h</div>
                                                                            </td>
                                                                            <td style="padding: 12px; font-size: 14px; border-right: 1px solid #edf2f7; color: #1e293b;">M. Jean</td>
                                                                            <td style="padding: 12px; font-size: 14px; border-right: 1px solid #edf2f7; color: #1e293b;">Moulin (GORCY)</td>
                                                                            <td style="padding: 12px; font-size: 14px; border-right: 1px solid #edf2f7; color: #1e293b;">CE1</td>
                                                                            <td style="padding: 12px; font-size: 14px; color: #1e293b; line-height: 1.4;">
                                                                                <div>25 élèves</div>
                                                                                <div style="color: #64748b; font-size: 12px;">4 adultes</div>
                                                                            </td>
                                                                        </tr>
                                                                        <tr style="border-bottom: 1px solid #edf2f7;">
                                                                            <td style="padding: 12px; font-size: 14px; border-right: 1px solid #edf2f7; line-height: 1.4;">
                                                                                <div style="font-weight: bold; color: #0f172a;">Atelier Robotique</div>
                                                                                <div style="font-weight: bold; color: #2563eb; font-size: 12px;">Vendredi 16 mai 2024 à 14h</div>
                                                                            </td>
                                                                            <td style="padding: 12px; font-size: 14px; border-right: 1px solid #edf2f7; color: #1e293b;">Mme. Marie</td>
                                                                            <td style="padding: 12px; font-size: 14px; border-right: 1px solid #edf2f7; color: #1e293b;">Hugo (LONGWY)</td>
                                                                            <td style="padding: 12px; font-size: 14px; border-right: 1px solid #edf2f7; color: #1e293b;">CM2</td>
                                                                            <td style="padding: 12px; font-size: 14px; color: #1e293b; line-height: 1.4;">
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

                                        {/* Variables Guide */}
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
                                                            const backup = await backupService.exportData();
                                                            if (backup) {
                                                                const now = new Date().toISOString();
                                                                backupService.downloadBackup(backup);
                                                                await updateSettings({ ...settings, lastExportDate: now });
                                                                setFormState(prev => ({ ...prev, lastExportDate: now }));
                                                                showNotification("Sauvegarde téléchargée !");
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
                                            
                                            {/* Stack Technique */}
                                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                                        <ViewGridIcon className="w-5 h-5" />
                                                    </div>
                                                    <h4 className="text-lg font-black text-gray-800 uppercase tracking-tight">Architecture & Technologies</h4>
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                                                        <div className="bg-white p-2 rounded-xl shadow-sm text-indigo-600 font-black text-xs h-fit">Web</div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-800">Interface Utilisateur (Frontend)</div>
                                                            <p className="text-xs text-gray-500 mt-1">Développé avec <strong>React 18</strong> et <strong>TypeScript</strong>. Le design est propulsé par <strong>Tailwind CSS</strong> pour une interface moderne, rapide et responsive sur tous les supports (mobiles, tablettes, ordinateurs).</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                                                        <div className="bg-white p-2 rounded-xl shadow-sm text-orange-600 font-black text-xs h-fit">DB</div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-800">Base de Données & Stockage</div>
                                                            <p className="text-xs text-gray-500 mt-1">Utilise <strong>Google Firebase Firestore</strong> pour une persistence des données en temps réel. Les images et logos sont hébergés de manière sécurisée via <strong>Cloudinary</strong>.</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                                                        <div className="bg-white p-2 rounded-xl shadow-sm text-green-600 font-black text-xs h-fit">API</div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-800">Services Connectés</div>
                                                            <p className="text-xs text-gray-500 mt-1"><strong>EmailJS</strong> assure l'envoi fiable des confirmations de réservation par e-mail sans serveur mail complexe à maintenir. <strong>SheetJS</strong> permet l'import/export de listes complexes via Excel.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sécurité & Diagnostic */}
                                            <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white/10 rounded-lg text-indigo-200">
                                                        <ShieldCheckIcon className="w-5 h-5" />
                                                    </div>
                                                    <h4 className="text-lg font-black uppercase tracking-tight">Sécurité & Diagnostic</h4>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="text-sm font-bold text-indigo-200">Protection des Données</div>
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
                                                            <div className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-black rounded-full border border-blue-500/30 uppercase">En Place</div>
                                                        </div>
                                                        <p className="text-xs text-white/70 leading-relaxed">
                                                            Un système de nettoyage automatique peut être activé (onglet Données) pour anonymiser les réservations passées chaque année, garantissant le respect de la vie privée.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="pt-2 p-4 bg-indigo-800/50 rounded-2xl border border-indigo-700/50">
                                                    <h5 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 text-center">Diagnostic de Stabilité</h5>
                                                    <div className="flex justify-between items-center px-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className="text-lg font-black text-white">99.9%</div>
                                                            <div className="text-[8px] text-indigo-300 font-bold uppercase">Disponibilité Cloud</div>
                                                        </div>
                                                        <div className="h-8 w-px bg-indigo-700/50 line-clamp-1"></div>
                                                        <div className="flex flex-col items-center">
                                                            <div className="text-lg font-black text-white">&lt; 2s</div>
                                                            <div className="text-[8px] text-indigo-300 font-bold uppercase">Temps de chargement</div>
                                                        </div>
                                                        <div className="h-8 w-px bg-indigo-700/50"></div>
                                                        <div className="flex flex-col items-center">
                                                            <div className="text-lg font-black text-white">OK</div>
                                                            <div className="text-[8px] text-indigo-300 font-bold uppercase">Intégrité DB</div>
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
                                            <h4 className="text-lg font-black text-gray-800 uppercase tracking-tight">Systèmes de Stabilité & Rapidité</h4>
                                            <div className="max-w-3xl mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <div className="text-blue-600 font-black text-xs uppercase tracking-widest">Temps de chargement</div>
                                                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">L'application est servie via un CDN mondial, garantissant que les fichiers sont livrés par le serveur le plus proche de l'utilisateur.</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="text-purple-600 font-black text-xs uppercase tracking-widest">Optimisation Assets</div>
                                                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">Cloudinary redimensionne et optimise automatiquement les images pour réduire leur poids sans sacrifier la qualité visuelle.</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="text-green-600 font-black text-xs uppercase tracking-widest">Infrastructure Edge</div>
                                                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">Le code frontend est compilé de manière optimale (Vite), éliminant le code inutile pour une exécution ultra-fluide sur mobile.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Panel with Save Button */}
                            <div className="px-8 py-6 bg-white border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <p className="text-xs text-gray-400 font-medium italic">
                                    N'oubliez pas d'enregistrer vos modifications avant de quitter cet onglet.
                                </p>
                                <div className="flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            if (window.confirm("Voulez-vous vraiment annuler toutes vos modifications non enregistrées ?")) {
                                                const baseSettings = { ...settings };
                                                // Ensure defaults are populated if missing in Firestore to avoid empty templates on reset
                                                if (!baseSettings.emailTeacherTemplate) baseSettings.emailTeacherTemplate = DEFAULT_EMAIL_TEACHER_TEMPLATE;
                                                if (!baseSettings.emailTeacherSubject) baseSettings.emailTeacherSubject = DEFAULT_EMAIL_TEACHER_SUBJECT;
                                                if (!baseSettings.emailAnimatorTemplate) baseSettings.emailAnimatorTemplate = DEFAULT_EMAIL_ANIMATOR_TEMPLATE;
                                                if (!baseSettings.emailAnimatorSubject) baseSettings.emailAnimatorSubject = DEFAULT_EMAIL_ANIMATOR_SUBJECT;
                                                if (!baseSettings.emailListTemplate) baseSettings.emailListTemplate = DEFAULT_EMAIL_LIST_TEMPLATE;
                                                if (!baseSettings.emailListSubject) baseSettings.emailListSubject = DEFAULT_EMAIL_LIST_SUBJECT;
                                                
                                                setFormState(baseSettings);
                                                setIsChangingPassword(false);
                                                setSecurityError(null);
                                                setNewPassword('');
                                                setConfirmPassword('');
                                            }
                                        }} 
                                        className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                                    >
                                        Réinitialiser
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Enregistrer
                                    </button>
                                </div>
                            </div>
                        </div>
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
