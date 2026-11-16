# -*- coding: utf-8 -*-
"""« Le coin du maître d'œuvre » : une question ouverte par atelier, sans réponse chiffrée unique.

Affichée dans le carnet de l'atelier (sous Défi express, À retenir, Pour aller plus loin).
Modifier ici puis relancer apply_lab_v2.py.
"""

DEBATS = {
    "r1-1": {
        "refs": "Un collègue préfère recopier le prix unitaire dans chaque ligne « pour que ce soit plus clair ». Quels risques prend-il le jour où le fournisseur change son tarif en cours de chantier, et comment le convaincre sans le vexer ?",
        "unites": "Le métré arrive en millimètres, le devis en mètres et la facture en kilo-euros. Faut-il imposer une seule unité à toute l’équipe, ou accepter plusieurs unités à condition de les afficher partout ?",
        "logique": "La règle de majoration change l’an prochain. Vaut-il mieux l’écrire en dur dans la formule SI, ou dans une cellule de paramètres que n’importe qui peut modifier ?",
        "tva": "Sur un chantier mixte, certains postes relèvent d’un taux réduit et d’autres du taux normal. Comment organiser le classeur pour que l’erreur de taux soit impossible plutôt que simplement peu probable ?",
        "synthese": "Le maître d’ouvrage veut le total par poste, le conducteur de travaux le total par semaine. Un seul tableau croisé suffit-il, ou faut-il deux vues distinctes du même registre ?",
        "graphiques": "Pour obtenir un budget complémentaire, un chef de service vous demande de « faire ressortir » une hausse de 3 %. Jusqu’où peut-on mettre en valeur un écart sans tromper le lecteur ?",
        "qualite": "Un classeur verrouillé protège les formules, mais bloque aussi le collègue qui doit corriger une erreur urgente un vendredi soir. Qui doit détenir le mot de passe, et comment tracer les modifications ?",
    },
    "r1-10": {
        "debit": "Un diamètre plus grand réduit la vitesse et les pertes, mais l’eau stagne davantage dans le réseau et le coût de la conduite augmente. Comment arbitrer entre confort hydraulique, qualité sanitaire et budget ?",
        "fluide": "La viscosité de l’eau double presque entre 30 °C et 5 °C. Faut-il dimensionner un réseau pour l’hiver, pour l’été, ou pour la saison où il est le plus sollicité ?",
        "hydro": "Le hameau perché manque de pression. Faut-il remonter le réservoir, ajouter un surpresseur local ou accepter une pression réduite chez quelques abonnés ? Qui paie chaque option ?",
        "bernoulli": "La charge de vitesse est souvent négligeable devant la pression. Dans quelles situations de chantier devient-elle au contraire décisive, et que risque-t-on à l’oublier par habitude ?",
        "lineaire": "Une conduite en fonte dure plus longtemps qu’une conduite en PVC, mais sa rugosité augmente avec les années. Sur quelle durée de vie faut-il calculer les pertes de charge d’un réseau neuf ?",
        "singulier": "Le tracé le plus court traverse une rue commerçante, le plus long contourne le quartier avec moins de coudes. Au-delà des pertes de charge, quels critères de chantier et de maintenance font pencher la balance ?",
        "pompe": "Un surpresseur règle le problème de pression mais consomme de l’électricité pendant des décennies. À partir de quel coût de fonctionnement vaut-il mieux surdimensionner les conduites dès le départ ?",
    },
    "r1-13": {
        "ab": "Le laboratoire peut acheter un pied à coulisse plus précis ou former les opérateurs à une meilleure prise de mesure. Avec un budget limité, comment savoir laquelle des deux dépenses réduit vraiment l’incertitude ?",
        "compose": "Additionner les incertitudes au lieu de les composer donne un résultat plus « prudent ». Cette prudence a-t-elle un coût pour l’entreprise ou pour le client, et lequel ?",
        "prop": "Le diamètre compte double dans l’incertitude sur la contrainte. Faut-il mesurer plus soigneusement chaque éprouvette, ou fabriquer des moules plus réguliers en amont ?",
        "conform": "Un résultat tombe dans la zone de doute. Le chantier attend la décision pour couler la dalle suivante. Qui prend la responsabilité de conclure, et sur quelles bases ?",
        "lot": "Trois éprouvettes coûtent moins cher que six, mais l’incertitude sur la moyenne est plus grande. Comment fixer le nombre d’éprouvettes d’un lot sans gaspiller ni prendre de risque ?",
        "budget": "Le poste dominant du budget d’incertitude est l’étalonnage de la presse. Changer de prestataire d’étalonnage est-il toujours plus rentable que d’améliorer le reste de la chaîne de mesure ?",
    },
    "r2-9": {
        "cond": "Doubler l’épaisseur d’isolant divise presque par deux les pertes de la paroi, mais réduit la surface habitable. Dans un logement petit et cher au mètre carré, où placer le curseur ?",
        "surf": "Un mur peut être conforme aux exigences thermiques et rester froid au toucher dans un angle. Comment expliquer à un occupant qui se plaint que « le mur est pourtant isolé » ?",
        "bilan": "Traiter les ponts thermiques demande souvent plus de soin que de matériau. Sur un chantier pressé, comment s’assurer que ce soin est réellement apporté et vérifié ?",
        "glaser": "Un pare-vapeur mal posé peut faire plus de dégâts que pas de pare-vapeur du tout. Faut-il privilégier des parois « perspirantes » qui tolèrent l’erreur, même un peu moins performantes ?",
        "dyn": "Un mur lourd déphase bien la chaleur, mais il demande plus de matière et plus de carbone à la fabrication. Comment comparer le confort d’été gagné et l’empreinte carbone ajoutée ?",
        "rehab": "En ITE, la performance thermique est excellente. Mais comment traite-t-on l’aspect architectural d’un bâtiment historique ou d’une façade de centre-ville protégée ?",
    },
    "r3-10": {
        "trans": "Isoler un mur donnant sur un garage non chauffé rapporte moins qu’isoler un mur sur l’extérieur. Faut-il pour autant le laisser de côté si les travaux sont faits en une seule fois ?",
        "vent": "Mieux ventiler améliore la qualité de l’air mais augmente les déperditions. Jusqu’où peut-on réduire le débit d’air sans mettre en danger la santé des occupants ?",
        "dju": "Les DJU de référence sont calculés sur des hivers passés. Avec le réchauffement climatique, sur quelles données faut-il estimer les besoins d’un bâtiment qui durera cinquante ans ?",
        "dpe": "Passer de l’électricité au gaz peut améliorer la lettre énergie et dégrader la lettre climat, ou l’inverse. Quelle énergie conseiller à un propriétaire, et comment lui expliquer ce paradoxe ?",
        "reno": "Isoler par l’intérieur coûte moins cher mais réduit la surface, isoler par l’extérieur coûte plus mais préserve l’inertie. Comment présenter ce choix à une famille qui reste dans le logement pendant les travaux ?",
        "sys": "Une VMC double flux récupère les calories, mais quel est son coût de maintenance et son bilan carbone induit sur 20 ans, comparé à une extraction simple flux hygroréglable ?",
        "tri": "Un temps de retour de 12 ans paraît long pour un particulier, mais court pour un bailleur social. Le TRI est-il le bon critère pour décider d’une rénovation, ou faut-il en regarder d’autres ?",
    },
    "r4-8": {
        "ete": "Des brise-soleil fixes réduisent les apports solaires l’été, mais aussi la lumière naturelle toute l’année. Comment concilier confort d’été, éclairage et vue sur l’extérieur dans une salle d’attente ?",
        "inertie": "Une maison de santé est occupée le jour et vide la nuit. Cet usage favorise-t-il une structure lourde ou légère, et quel rôle donner à la ventilation nocturne ?",
        "bepos": "Couvrir le toit de panneaux photovoltaïques rend le bâtiment « positif » sur l’année, mais pas forcément au moment où il consomme. Faut-il investir aussi dans le stockage, ou accepter l’échange avec le réseau ?",
        "aera": "Des gaines plus grosses réduisent les pertes de charge et le bruit, mais elles prennent de la hauteur sous plafond. Où placer le compromis dans un bâtiment où chaque centimètre de faux plafond compte ?",
        "acou": "La confidentialité d’un cabinet médical exige un bon isolement, mais un local trop absorbant paraît « étouffé ». Comment régler à la fois l’isolement entre pièces et l’ambiance sonore de chacune ?",
    },
}
