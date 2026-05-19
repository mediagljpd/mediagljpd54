
export const LEGAL_TEMPLATES = {
    legalNoticeTitle: "Mentions Légales",
    legalNotice: `
      <h2>1. Présentation du site</h2>
      <p>En vertu de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, il est précisé aux utilisateurs du site l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi :</p>
      <p><strong>Propriétaire</strong> : Médiathèque du Grand Longwy – 1 Avenue de l'Aviation, 54400 Longwy</p>
      <p><strong>Responsable de la publication</strong> : Médiathèque du Grand Longwy</p>
      <p><strong>Hébergeur</strong> : Google Cloud Platform – 8 rue de Londres, 75009 Paris, France</p>

      <h2>2. Conditions générales d’utilisation du site et des services proposés</h2>
      <p>L’utilisation du site implique l’acceptation pleine et entière des conditions générales d’utilisation ci-après décrites. Ces conditions d’utilisation sont susceptibles d’être modifiées ou complétées à tout moment.</p>

      <h2>3. Description des services fournis</h2>
      <p>Le site a pour objet de fournir un outil de planification et de réservation des animations pédagogiques proposées par la Médiathèque du Grand Longwy à destination des établissements scolaires.</p>

      <h2>4. Propriété intellectuelle et contrefaçons</h2>
      <p>La Médiathèque du Grand Longwy est propriétaire des droits de propriété intellectuelle sur tous les éléments accessibles sur le site, notamment les textes, images, graphismes, logo, icônes.</p>

      <h2>5. Limitations de responsabilité</h2>
      <p>La Médiathèque ne pourra être tenue responsable des dommages directs et indirects causés au matériel de l’utilisateur, lors de l’accès au site. Le site utilise des technologies JavaScript et Firebase pour assurer les services en temps réel.</p>
    `,
    privacyPolicyTitle: "Confidentialité",
    privacyPolicy: `
      <h2>1. Gestion des données personnelles</h2>
      <p>En France, les données personnelles sont notamment protégées par la loi n° 78-87 du 6 janvier 1978, la loi n° 2004-801 du 6 août 2004, l'article L. 226-13 du Code pénal et le Règlement Général sur la Protection des Données (RGPD : n° 2016-679).</p>

      <h2>2. Données collectées et finalités</h2>
      <p>Lors de l'utilisation du service de réservation, les informations suivantes sont collectées :</p>
      <ul>
        <li><strong>Données de l'enseignant</strong> : Nom, Prénom, adresse e-mail, numéro de téléphone.</li>
        <li><strong>Données scolaires</strong> : Nom de l'école, commune, niveau de la classe, effectifs (élèves et adultes), mode de transport.</li>
      </ul>
      <p>Ces données sont exclusivement utilisées pour la gestion administrative et logistique des réservations, l'envoi de confirmations automatiques et l'établissement de statistiques anonymes de fréquentation.</p>

      <h2>3. Base légale du traitement</h2>
      <p>Le traitement des données est fondé sur l'exécution d'une mission de service public (organisation des animations culturelles et pédagogiques).</p>

      <h2>4. Durée de conservation et Anonymisation</h2>
      <p>Les données nominatives sont conservées uniquement pour la durée de l'année scolaire en cours. À l'issue de chaque année scolaire (période estivale), un processus d'anonymisation automatique remplace les noms, e-mails et téléphones par la mention "[Anonymisé]", ne conservant que les données statistiques liées aux écoles et aux effectifs.</p>

      <h2>5. Droits des utilisateurs</h2>
      <p>Conformément au RGPD, les utilisateurs disposent d'un droit d'accès, de rectification, de limitation et de suppression de leurs données. Pour exercer ces droits, vous pouvez contacter la Médiathèque via les coordonnées fournies dans les mentions légales.</p>

      <h2>6. Sécurité des données</h2>
      <p>Les données sont stockées de manière sécurisée via l'infrastructure Google Cloud (Firebase Firestore) avec des contrôles d'accès stricts réservés aux administrateurs authentifiés.</p>
    `,
    cookiesPolicyTitle: "Gestion des Cookies",
    cookiesPolicy: `
      <h2>1. Gestion des traceurs et cookies</h2>
      <p>Un cookie est un fichier stocké par votre navigateur lors de votre visite sur un site.</p>
      
      <h2>2. Cookies techniques strictement nécessaires</h2>
      <p>Ce site utilise exclusivement des cookies techniques nécessaires à son bon fonctionnement :</p>
      <ul>
        <li><strong>Firebase Auth</strong> : Permet de maintenir la session sécurisée des administrateurs. Sans ce cookie, l'accès au panneau d'administration est impossible.</li>
        <li><strong>Session LocalStorage</strong> : Permet de conserver l'état de votre réservation en cours pour éviter la perte de données en cas de rafraîchissement accidentel de la page.</li>
      </ul>

      <h2>3. Cookies tiers et Consentement</h2>
      <p>Ce site <strong>n'utilise aucun tracker publicitaire</strong>, ni cookie de réseaux sociaux, ni outil d'analyse d'audience tiers nécessitant un consentement préalable. Conformément aux recommandations de la CNIL, les cookies strictement nécessaires au service sont exemptés de consentement.</p>

      <h2>4. Suppression des cookies</h2>
      <p>Vous pouvez supprimer les cookies de votre navigateur à tout moment via ses paramètres de confidentialité. Cependant, cela pourra entraîner une déconnexion automatique de la zone administration.</p>
    `,
};
