## Modèles compatibles OUTLOOK (Windows Desktop)

Si vos destinataires utilisent Outlook sur PC, utilisez ces modèles fondés sur des tableaux HTML. Le design est légèrement plus classique pour garantir que rien ne "casse" (colonnes, alignements).

### Note sur le sujet des e-mails
Pour éviter les problèmes de caractères spéciaux (comme les slashs `/` transformés en `&#x2F;`), il est recommandé d'utiliser la variable `{{booking_date_clean}}` dans le sujet. Elle affiche la date avec des points (ex: 18.06.2026).

Exemple de sujet : `✅ Confirmation : {{animation_title}} le {{booking_date_clean}}`

### A. Version Animateur (Outlook Safe)

```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
                        <td bgcolor="#f8fafc" style="padding: 30px; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 16px; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; line-height: 1.5;">
                            E-mail automatique - Plateforme de réservation
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

### B. Version Enseignant (Outlook Safe)

```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
                        <td align="center" style="padding: 40px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-family: 'Calibri', 'Trebuchet MS', Arial, sans-serif; font-size: 16px; color: #334155; text-align: center; line-height: 1.5;">
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
</html>
```

### Guide Configuration EmailJS (No-Reply)

Pour assurer que les enseignants ne répondent pas à cette adresse automatique :
1. Connectez-vous à votre compte **EmailJS**.
2. Allez dans **Email Templates**.
3. Dans l'onglet **Settings** de votre modèle, trouvez le champ **Reply-To**.
4. Inscrivez une adresse du type `no-reply@votre-domaine.fr` ou laissez-le vide si vous préférez qu'aucune adresse de réponse ne soit suggérée par les clients mail.
5. Dans l'onglet **Content**, assurez-vous d'avoir bien copié le code HTML ci-dessus.
