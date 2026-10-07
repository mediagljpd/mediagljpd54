import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../AppContext';
import { BdcTemplateConfig } from '../../types';
import { 
  DEFAULT_BDC_CONFIG, 
  generateBdcWordDocument, 
  downloadStarterDocxTemplate,
  formatBdcGenerationDate 
} from '../../services/bdcGenerator';
import saveAs from 'file-saver';
import { 
  ArrowUturnLeftIcon, 
  CheckIcon, 
  DownloadIcon, 
  SparklesIcon, 
  CogIcon,
  TrashIcon,
  DocumentTextIcon,
  WordIcon,
  InformationCircleIcon
} from '../Icons';

interface BdcTemplateEditorProps {
  onBack: () => void;
  showNotification: (message: string, type?: 'success' | 'error') => void;
}

interface TagItem {
  tag: string;
  aliases?: string[];
  name: string;
  description: string;
  example: string;
  isOfficial: boolean;
}

const TEMPLATE_TAGS: TagItem[] = [
  {
    tag: '{date_jour}',
    aliases: ['{date_du_jour}'],
    name: '[date du jour]',
    description: 'Date du jour où le bon de commande est généré',
    example: formatBdcGenerationDate(),
    isOfficial: true,
  },
  {
    tag: '{reference}',
    aliases: ['{ref}'],
    name: '[référence]',
    description: 'Année scolaire et commune sans code postal (ex. 26/27 LONGWY)',
    example: '26/27 LONGWY',
    isOfficial: true,
  },
  {
    tag: '{nombre_participants}',
    aliases: ['{nombre_enfants_adultes}', '{effectif}'],
    name: '[nombre enfants adultes]',
    description: 'Effectif total d\'enfants et d\'adultes accompagnateurs',
    example: '20 enfants et 6 adultes',
    isOfficial: true,
  },
  {
    tag: '{date_accueil}',
    aliases: ['{date}'],
    name: '[date accueil]',
    description: 'Jour de la semaine et date de la venue',
    example: 'Mardi 17 novembre',
    isOfficial: true,
  },
  {
    tag: '{nom_ecole}',
    aliases: ['{ecole}'],
    name: '[nom école]',
    description: 'Nom de l\'établissement scolaire',
    example: 'Ecole maternelle des 4 Vents',
    isOfficial: true,
  },
  {
    tag: '{prix_ht}',
    aliases: ['{prix_bus_remise}', '{prix_remise}'],
    name: '[prix bus remise]',
    description: 'Montant avec remise de 10 % (point pour les centimes)',
    example: '104.88 €',
    isOfficial: true,
  },
  {
    tag: '{prix_ttc}',
    aliases: ['{prix_bus}', '{prix}'],
    name: '[prix bus]',
    description: 'Montant sans la remise (point pour les centimes)',
    example: '115.37 €',
    isOfficial: true,
  },
  {
    tag: '{horaires}',
    aliases: ['{horaire}', '{heure_debut}'],
    name: '[horaires]',
    description: 'Horaire de début de l\'animation uniquement (ex. 9h, 14h)',
    example: '9h',
    isOfficial: true,
  },
  {
    tag: '{horaires_retour}',
    aliases: ['{horaire_retour}', '{heure_fin}'],
    name: '[horaires retour]',
    description: 'Horaire de fin de l\'animation (+1h automatique après le début)',
    example: '10h',
    isOfficial: true,
  },
  {
    tag: '{rendez_vous}',
    aliases: ['{rdv}', '{consignes_bus}'],
    name: '[rendez-vous]',
    description: 'Consigne de transport et lieu de rendez-vous (sans "Rendez-vous :")',
    example: 'devant l\'école, côté fleuriste à 13h45',
    isOfficial: true,
  },
  {
    tag: '{commune}',
    name: 'Commune',
    description: 'Commune de l\'établissement sans le code postal',
    example: 'LONGWY',
    isOfficial: false,
  },
  {
    tag: '{enseignant}',
    name: 'Enseignant',
    description: 'Nom de l\'enseignant référent',
    example: 'Mme Dupont',
    isOfficial: false,
  },
  {
    tag: '{animation}',
    name: 'Titre animation',
    description: 'Titre de l\'activité réservée',
    example: 'Voyage au pays des contes',
    isOfficial: false,
  },
];

const BdcTemplateEditor: React.FC<BdcTemplateEditorProps> = ({ onBack, showNotification }) => {
  const { settings, updateSettings, bookings } = useContext(AppContext);

  // Configuration locale avec fusion des valeurs par défaut
  const [config, setConfig] = useState<Required<BdcTemplateConfig>>(() => ({
    ...DEFAULT_BDC_CONFIG,
    ...(settings?.bdcTemplate || {}),
  }));

  const [hasChanges, setHasChanges] = useState(false);
  const [isDownloadingSample, setIsDownloadingSample] = useState(false);
  const [isDownloadingStarter, setIsDownloadingStarter] = useState(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Exemple de réservation pour le test du spécimen
  const sampleBooking = useMemo(() => {
    const validBusBooking = bookings.find(b => !b.noBusRequired && Number(b.busCost) > 0);
    if (validBusBooking) return validBusBooking;
    
    return {
      id: 'specimen-1',
      date: '2026-11-17',
      time: 9,
      schoolName: 'Ecole maternelle des 4 Vents',
      commune: 'LONGWY (54400)',
      studentCount: 20,
      adultCount: 6,
      busCost: 115.37,
      busInfo: "devant l'école, côté fleuriste à 13h45",
      teacherName: 'Mme Dupont',
      email: 'ecole.4vents@ac-nancy-metz.fr',
      phoneNumber: '03.82.00.00.00',
      cycle: 'Cycle 1',
      classLevel: 'Grande Section',
      animationId: 'anim-1',
      animationTitle: 'Voyage au pays des contes',
      animator: 'Aude',
      createdAt: '2026-10-06T10:00:00Z',
      noBusRequired: false,
      busStatus: 'validated' as const,
    };
  }, [bookings]);

  const handleChange = (field: keyof BdcTemplateConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleDocxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.docx')) {
      showNotification("Veuillez sélectionner un fichier Word valide au format .docx.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setConfig(prev => ({
        ...prev,
        customDocxTemplateBase64: base64,
        customDocxTemplateFileName: file.name,
        customDocxTemplateUpdatedAt: new Date().toISOString(),
      }));
      setHasChanges(true);
      showNotification(`Modèle Word "${file.name}" chargé avec succès ! Pensez à enregistrer.`);
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadCurrentTemplate = () => {
    if (!config.customDocxTemplateBase64) return;
    try {
      const rawData = config.customDocxTemplateBase64.includes(',') 
        ? config.customDocxTemplateBase64.split(',')[1] 
        : config.customDocxTemplateBase64;
      const binaryStr = atob(rawData);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      saveAs(blob, config.customDocxTemplateFileName || 'Modele_bon_de_commande_bus.docx');
      showNotification("Téléchargement de votre modèle Word en cours...");
    } catch (err) {
      showNotification("Erreur lors de l'extraction du modèle.", "error");
    }
  };

  const handleRemoveCustomTemplate = () => {
    if (window.confirm("Êtes-vous sûr de vouloir retirer votre modèle personnalisé et rétablir le modèle standard ?")) {
      setConfig(prev => ({
        ...prev,
        customDocxTemplateBase64: '',
        customDocxTemplateFileName: '',
        customDocxTemplateUpdatedAt: '',
      }));
      setHasChanges(true);
      showNotification("Modèle Word personnalisé retiré. Cliquez sur 'Enregistrer' pour valider.");
    }
  };

  const handleDownloadStarter = async () => {
    setIsDownloadingStarter(true);
    try {
      await downloadStarterDocxTemplate(config);
      showNotification("Modèle Word de départ (.docx) téléchargé avec succès !");
    } catch (err) {
      showNotification("Erreur lors de la création du modèle de départ.", "error");
    } finally {
      setIsDownloadingStarter(false);
    }
  };

  const handleDownloadSpecimen = async () => {
    setIsDownloadingSample(true);
    try {
      const result = await generateBdcWordDocument([sampleBooking as any], config, settings?.activeYear);
      if (result.success) {
        showNotification("Spécimen Word (.docx) généré et téléchargé avec succès !");
      } else {
        showNotification(result.error || "Erreur lors de la génération.", "error");
      }
    } catch (err: any) {
      showNotification("Erreur lors de la création du fichier Word.", "error");
    } finally {
      setIsDownloadingSample(false);
    }
  };

  const handleSave = () => {
    updateSettings({ bdcTemplate: config });
    setHasChanges(false);
    showNotification("Configuration du modèle de bon de commande enregistrée avec succès !");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTag(text);
    showNotification(`Balise ${text} copiée !`);
    setTimeout(() => setCopiedTag(null), 2500);
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      {/* Header avec retour et boutons d'action principaux */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Retour à la gestion des transports"
          >
            <ArrowUturnLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Éditeur de bon de commande (BDC)</h1>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider rounded-full border border-indigo-200 flex items-center gap-1.5">
                <WordIcon className="w-3.5 h-3.5" />
                <span>Moteur Word (.docx)</span>
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              Utilisez votre propre fichier Word pour une mise en page 100 % fidèle et automatique
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadSpecimen}
            disabled={isDownloadingSample}
            className="px-4 py-2.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl text-xs font-bold transition-all border border-sky-200 flex items-center gap-2 cursor-pointer disabled:opacity-60 shadow-2xs"
            title="Générer un fichier Word de test avec les balises remplacées"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>{isDownloadingSample ? 'Génération...' : 'Tester un spécimen Word (.docx)'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
              hasChanges 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 shadow-md ring-2 ring-emerald-400' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <CheckIcon className="w-4 h-4" />
            <span>{hasChanges ? 'Enregistrer les modifications' : 'Modèle à jour'}</span>
          </button>
        </div>
      </div>

      {/* BLOC 1 : STATUT DU MODÈLE ET ZONE DE TÉLÉVERSEMENT */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <DocumentTextIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">Votre fichier modèle Word (.docx)</h2>
              <p className="text-xs text-gray-500">
                Téléversez votre modèle Word original pour qu'il soit utilisé à chaque génération de BDC
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadStarter}
            disabled={isDownloadingStarter}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors border border-indigo-200 flex items-center gap-1.5 cursor-pointer"
            title="Télécharger un modèle Word pré-rempli avec toutes les balises comme point de départ"
          >
            <WordIcon className="w-4 h-4" />
            <span>{isDownloadingStarter ? 'Création...' : 'Télécharger le modèle de départ (.docx)'}</span>
          </button>
        </div>

        {/* État actuel du modèle */}
        {config.customDocxTemplateBase64 ? (
          <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                <WordIcon className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md text-[10px] font-black uppercase tracking-wider">
                    Modèle personnalisé actif
                  </span>
                  <span className="text-xs text-emerald-700 font-medium">Prêt pour la production</span>
                </div>
                <h3 className="text-base font-black text-emerald-950 mt-1">
                  {config.customDocxTemplateFileName || 'Modele_bon_de_commande.docx'}
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Toutes les générations de BDC depuis la liste des réservations utiliseront fidèlement ce modèle Word.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadCurrentTemplate}
                className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Télécharger le fichier Word actuellement configuré"
              >
                <DownloadIcon className="w-3.5 h-3.5 text-gray-500" />
                <span>Télécharger</span>
              </button>

              <label className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm">
                <WordIcon className="w-3.5 h-3.5" />
                <span>Remplacer</span>
                <input 
                  type="file" 
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                  onChange={handleDocxUpload} 
                  className="hidden" 
                />
              </label>

              <button
                type="button"
                onClick={handleRemoveCustomTemplate}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Supprimer ce modèle et revenir au modèle par défaut"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                <span>Retirer</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/70 rounded-2xl p-8 text-center transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <WordIcon className="w-9 h-9" />
            </div>
            <h3 className="text-base font-black text-gray-900 mb-1">
              Glissez ou sélectionnez votre modèle Word (.docx) ici
            </h3>
            <p className="text-xs text-gray-500 max-w-xl mx-auto mb-4 leading-relaxed">
              Créez votre mise en page dans Microsoft Word avec vos tableaux, marges et polices, insérez les balises ci-dessous, puis téléversez votre fichier.
            </p>

            <label className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md shadow-indigo-600/20 transition-all hover:scale-102">
              <DownloadIcon className="w-4 h-4" />
              <span>Choisir mon fichier Word (.docx)</span>
              <input 
                type="file" 
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                onChange={handleDocxUpload} 
                className="hidden" 
              />
            </label>
            <p className="text-[11px] text-gray-400 mt-2">Format accepté : uniquement .docx</p>
          </div>
        )}
      </div>

      {/* BLOC 2 : TABLEAU DES BALISES DISPONIBLES */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                Balises à insérer dans votre document Word
              </h2>
              <p className="text-xs text-gray-500">
                Cliquez sur une balise pour la copier, puis collez-la à l'emplacement souhaité dans Word.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-gray-400">
            {TEMPLATE_TAGS.length} balises prêtes à l'emploi
          </span>
        </div>

        {/* Variables officielles */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[11px] font-black uppercase tracking-wider rounded-md">
              Variables officielles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {TEMPLATE_TAGS.filter(t => t.isOfficial).map(item => (
              <div 
                key={item.tag} 
                onClick={() => copyToClipboard(item.tag)}
                className="p-3.5 bg-gray-50 hover:bg-indigo-50/60 border border-gray-200 hover:border-indigo-300 rounded-2xl transition-all cursor-pointer group relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">
                      {item.name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${
                      copiedTag === item.tag ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600 group-hover:bg-indigo-600 group-hover:text-white'
                    }`}>
                      {copiedTag === item.tag ? 'Copié !' : 'Copier'}
                    </span>
                  </div>

                  <div className="font-mono text-sm font-black text-indigo-700 bg-white border border-gray-200 px-2 py-1 rounded-lg inline-block">
                    {item.tag}
                  </div>

                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-gray-200/70 text-[11px] text-gray-400 flex items-center justify-between">
                  <span>Exemple :</span>
                  <span className="font-semibold text-gray-700">{item.example}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Balises complémentaires utiles */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-[11px] font-black uppercase tracking-wider rounded-md">
              Balises complémentaires optionnelles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {TEMPLATE_TAGS.filter(t => !t.isOfficial).map(item => (
              <div 
                key={item.tag} 
                onClick={() => copyToClipboard(item.tag)}
                className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">{item.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      copiedTag === item.tag ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600 group-hover:bg-gray-700 group-hover:text-white'
                    }`}>
                      {copiedTag === item.tag ? 'Copié !' : 'Copier'}
                    </span>
                  </div>
                  <div className="font-mono text-xs font-bold text-gray-800 bg-white border border-gray-200 px-2 py-0.5 rounded-lg inline-block">
                    {item.tag}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">{item.description}</p>
                </div>
                <div className="mt-2 pt-1.5 border-t border-gray-200/60 text-[10px] text-gray-400 flex justify-between">
                  <span>Exemple :</span>
                  <span className="font-medium text-gray-600">{item.example}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BLOC 3 : GUIDE PRATIQUE ET CONSEILS DE MISE EN PAGE WORD */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <InformationCircleIcon className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight text-white">
              Conseils pour une mise en page Word sans faille
            </h3>
            <p className="text-xs text-indigo-200">
              Comment obtenir exactement le rendu attendu dans Microsoft Word ou LibreOffice
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <h4 className="font-black text-xs uppercase tracking-wider text-amber-300 mb-1">
              1. Formatage des polices & couleurs
            </h4>
            <p className="text-xs text-indigo-100 leading-relaxed">
              Appliquez directement la police, la taille, le <strong>gras</strong> ou la couleur sur la balise dans Word. La valeur de remplacement héritera exactement de ce style visuel.
            </p>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <h4 className="font-black text-xs uppercase tracking-wider text-amber-300 mb-1">
              2. Règle d'une page par réservation
            </h4>
            <p className="text-xs text-indigo-100 leading-relaxed">
              Veillez à ce que votre modèle tienne sur <strong>1 seule page A4</strong>. Si vous sélectionnez 3 réservations, l'outil créera automatiquement un fichier Word de 3 pages bien séparées.
            </p>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <h4 className="font-black text-xs uppercase tracking-wider text-amber-300 mb-1">
              3. Balises entre accolades strictes
            </h4>
            <p className="text-xs text-indigo-100 leading-relaxed">
              Conservez bien les accolades <code className="bg-white/20 px-1 py-0.5 rounded text-amber-200">{"{...}"}</code> sans espace à l'intérieur. Ne mettez pas de crochets <code className="bg-white/20 px-1 py-0.5 rounded text-amber-200">[...]</code>.
            </p>
          </div>
        </div>
      </div>

      {/* BLOC 4 : OPTIONS AVANCÉES & VALEURS PAR DÉFAUT DU MODÈLE STANDARD (Repliable) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4">
        <button
          type="button"
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
              <CogIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-sm">
                Paramètres de calcul (taux de remise TVA)
              </h3>
              <p className="text-xs text-gray-400">
                Ajustement du pourcentage appliqué pour calculer automatiquement la balise &#123;prix_ht&#125;
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
            {showAdvancedSettings ? 'Masquer ▲' : 'Afficher ▼'}
          </span>
        </button>

        {showAdvancedSettings && (
          <div className="pt-4 border-t border-gray-100 space-y-4 animate-in fade-in duration-150">
            <div className="max-w-md">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Taux de remise appliqué pour calculer la balise &#123;prix_ht&#125; (%)
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={config.vatRatePercent}
                  onChange={e => handleChange('vatRatePercent', parseFloat(e.target.value) || 10)}
                  className="w-24 p-2 border border-gray-300 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="text-xs text-gray-500">
                  % (10 % par défaut)
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Les mentions comme le nom du transporteur, l'adresse ou l'imputation budgétaire sont écrites directement dans votre document Word (.docx) et n'ont pas besoin d'être paramétrées ici.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BdcTemplateEditor;
