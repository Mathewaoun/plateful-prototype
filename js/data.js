// Plateful prototype – static data (SEG 4505, Group 10)
// UI strings in English and French (charter H14).
const T={en:{tScan:"Scan meal",tToday:"Today",empty:"Take or upload a photo of your meal. No coin, hand or card needed.",photo:"Photo of meal",add:"Add to today",s0:"Sample: chicken & rice",s1:"Sample: garden salad",s2:"Sample: bean soup",inToday:"Energy in today",intake:"Intake",expend:"Expenditure (from Digital Health tracker, sample value)",clear:"Clear today",consent:"Let my corrected photos help improve the model (encrypted, can be withdrawn any time)",api:"API payload sent to Digital Health expenditure products",copy:"Copy JSON",copied:"Copied",
 start:"Pick a sample meal to see the full pipeline, or upload a real photo for live AI detection.",sampleNote:"Sample meal: detections pre-computed so the demo runs offline.",noAI:"Live AI detection isn't available in this view. Try a sample meal.",detecting:"Detecting ingredients and calibrating scale…",notFood:"That doesn't look like food. Try another photo.",none:"No ingredients found. Try a closer, top-down photo.",found:n=>`Found ${n} ingredients.`,rate:"Too many requests, wait a minute and try again.",declined:"AI access was declined. Try a sample meal.",fail:"Couldn't analyse that photo. Try again or use a sample.",offline:"You're offline: photo queued. It will be analysed when you reconnect (H13).",back:"Back online: analysing your queued photo…",
 added:"Added to today in 2 taps (target ≤ 3).",low:"Low confidence: please check this one",corr:"you corrected",sure:"sure",total:"g total",wide:w=>`photo ≈ ${w} cm wide*`,time:s=>`Analysed in ${s} s (target ≤ 5 s). `,tap:"Tap an ingredient to correct it. Not visible in a photo, so not counted:",hidden:"salt, oil, butter, dressing and seasoning",calib:c=>`*Real-world size auto-calibrated from the scene, no reference object, at ${c}% confidence.`,
 under:(d,o)=>`${d} kcal under today's expenditure of ${o}`,over:(d,o)=>`${d} kcal over today's expenditure of ${o}`,noMeals:"No meals logged yet. Scan one first.",fb:(n,c)=>`Training queue: ${n} correction${n==1?"":"s"} ready for the next incremental fine-tuning batch.`+(c?"":" Consent is off, so your corrections won't be used for training."),save:"Save",remove:"Remove",name:"Ingredient name",grams:"Grams",you:"you",table:"table",aiest:"AI est.",P:"Protein",C:"Carbs",F:"Fat",meal:"Your meal"},
 fr:{tScan:"Analyser un repas",tToday:"Aujourd'hui",empty:"Prenez ou téléversez une photo de votre repas. Aucune pièce, main ou carte requise.",photo:"Photo du repas",add:"Ajouter à aujourd'hui",s0:"Exemple : poulet et riz",s1:"Exemple : salade du jardin",s2:"Exemple : soupe aux haricots",inToday:"Apport énergétique du jour",intake:"Apport",expend:"Dépense (traqueur Digital Health, valeur d'exemple)",clear:"Effacer la journée",consent:"Permettre que mes photos corrigées améliorent le modèle (chiffrées, retrait possible en tout temps)",api:"Données API envoyées aux produits de dépense de Digital Health",copy:"Copier le JSON",copied:"Copié",
 start:"Choisissez un repas d'exemple pour voir toute la chaîne, ou téléversez une vraie photo pour la détection par IA en direct.",sampleNote:"Repas d'exemple : détections précalculées pour fonctionner hors ligne.",noAI:"La détection IA en direct n'est pas disponible ici. Essayez un exemple.",detecting:"Détection des ingrédients et étalonnage…",notFood:"Ce n'est pas de la nourriture. Essayez une autre photo.",none:"Aucun ingrédient trouvé. Essayez une photo plus proche, vue de dessus.",found:n=>`${n} ingrédients trouvés.`,rate:"Trop de requêtes, réessayez dans une minute.",declined:"Accès à l'IA refusé. Essayez un exemple.",fail:"Analyse impossible. Réessayez ou utilisez un exemple.",offline:"Hors ligne : photo mise en file d'attente. Elle sera analysée au retour de la connexion (H13).",back:"Connexion rétablie : analyse de la photo en attente…",
 added:"Ajouté en 2 touches (cible ≤ 3).",low:"Confiance faible : veuillez vérifier",corr:"corrigé par vous",sure:"de confiance",total:"g au total",wide:w=>`photo ≈ ${w} cm de large*`,time:s=>`Analysé en ${s} s (cible ≤ 5 s). `,tap:"Touchez un ingrédient pour le corriger. Invisibles sur une photo, donc non comptés :",hidden:"sel, huile, beurre, vinaigrette et assaisonnements",calib:c=>`*Taille réelle étalonnée automatiquement à partir de la scène, sans objet de référence, confiance ${c} %.`,
 under:(d,o)=>`${d} kcal sous la dépense du jour (${o})`,over:(d,o)=>`${d} kcal au-dessus de la dépense du jour (${o})`,noMeals:"Aucun repas consigné. Analysez-en un d'abord.",fb:(n,c)=>`File d'entraînement : ${n} correction${n>1?"s":""} prête${n>1?"s":""} pour le prochain lot d'entraînement incrémental.`+(c?"":" Consentement désactivé : vos corrections ne serviront pas à l'entraînement."),save:"Enregistrer",remove:"Retirer",name:"Nom de l'ingrédient",grams:"Grammes",you:"vous",table:"table",aiest:"est. IA",P:"Protéines",C:"Glucides",F:"Lipides",meal:"Votre repas"}};

// Reference table: [name, density g/cm3, kcal, protein g, carbs g, fat g] per 100 g.
// Typical reference values for the prototype; production uses the Canadian Nutrient File (charter H4).
const TABLE=[["white rice",.80,130,2.7,28,.3],["rice",.80,130,2.7,28,.3],["pasta",.60,158,5.8,31,.9],["noodle",.60,138,4.5,25,2],["bread",.25,265,9,49,3.2],["fries",.45,312,3.4,41,15],["potato",1.05,87,1.9,20,.1],["chicken",1.05,165,31,0,3.6],["steak",1.05,250,26,0,17],["beef",1.05,250,26,0,17],["salmon",1.05,208,20,0,13],["fish",1.05,150,22,0,5],["egg",1.0,155,13,1.1,11],["lettuce",.15,15,1.4,2.9,.2],["spinach",.20,23,2.9,3.6,.4],["cherry tomato",.95,18,.9,3.9,.2],["tomato sauce",1.03,29,1.3,5,.2],["tomato",.95,18,.9,3.9,.2],["carrot",.55,41,.9,9.6,.2],["cucumber",.95,15,.7,3.6,.1],["broccoli",.35,34,2.8,7,.4],["corn",.72,96,3.4,21,1.5],["kidney bean",.80,127,8.7,23,.5],["bean",.80,127,8.7,23,.5],["pea",.70,81,5.4,14,.4],["onion",.60,40,1.1,9.3,.1],["pepper",.45,31,1,6,.3],["avocado",.95,160,2,8.5,15],["cheese",.90,402,25,1.3,33],["apple",.85,52,.3,14,.2],["banana",.95,89,1.1,23,.3],["orange",.95,47,.9,12,.1],["strawberr",.60,32,.7,7.7,.3],["grape",.70,69,.7,18,.2],["broth",1.0,15,.6,1.5,.5],["soup",1.0,40,2,6,1.5],["sausage",1.0,301,12,2,27],["bacon",.70,541,37,1.4,42],["mushroom",.40,22,3.1,3.3,.3],["tofu",1.0,76,8,1.9,4.8],["pancake",.50,227,6.4,28,9.7],["yogurt",1.05,61,3.5,4.7,3.3],["oatmeal",.85,71,2.5,12,1.5],["pizza",.70,266,11,33,10],["hummus",1.05,166,7.9,14,9.6],["salad dressing",1.0,450,1,10,45]];

// French display names for the sample meals.
const FRN={"white rice":"riz blanc","grilled chicken breast":"poitrine de poulet grillée","broccoli":"brocoli","lettuce":"laitue","cherry tomato":"tomate cerise","shredded carrot":"carotte râpée","cucumber":"concombre","vegetable broth":"bouillon de légumes","kidney beans":"haricots rouges","carrot":"carotte"};

// Sample meals with pre-computed detections, so the demo works offline.
// bbox = [x, y, w, h] normalised 0-1; coverage = share of the box the food fills.
const S=[
 {dish:["Grilled chicken, rice and broccoli","Poulet grillé, riz et brocoli"],w:34,cc:.86,plate:"plate",items:[
  {name:"white rice",bbox:[.22,.27,.29,.32],coverage:.78,thickness_cm:3,confidence:.93,draw:"mound",col:"#f7f4ea"},
  {name:"grilled chicken breast",bbox:[.52,.25,.27,.21],coverage:.88,thickness_cm:2.2,confidence:.9,draw:"slab",col:"#d9a35c"},
  {name:"broccoli",bbox:[.47,.52,.26,.28],coverage:.68,thickness_cm:3.5,confidence:.88,draw:"florets",col:"#3f8f3a"}]},
 {dish:["Garden salad","Salade du jardin"],w:30,cc:.82,plate:"bowl",items:[
  {name:"lettuce",bbox:[.2,.17,.6,.64],coverage:.62,thickness_cm:4,confidence:.94,draw:"leaves",col:"#7cbf4a"},
  {name:"cherry tomato",bbox:[.3,.25,.42,.45],coverage:.2,thickness_cm:2.5,confidence:.91,draw:"dots",col:"#e2452b"},
  {name:"shredded carrot",bbox:[.27,.42,.44,.3],coverage:.18,thickness_cm:1,confidence:.86,draw:"shreds",col:"#f08a24"},
  {name:"cucumber",bbox:[.48,.2,.26,.26],coverage:.3,thickness_cm:.6,confidence:.84,draw:"slices",col:"#cfe8a8"}]},
 {dish:["Kidney bean soup","Soupe aux haricots rouges"],w:28,cc:.8,plate:"bowl",items:[
  {name:"vegetable broth",bbox:[.22,.18,.56,.64],coverage:.58,thickness_cm:4.5,confidence:.9,draw:"liquid",col:"#b5652e"},
  {name:"kidney beans",bbox:[.27,.25,.46,.5],coverage:.24,thickness_cm:4.5,confidence:.87,draw:"beans",col:"#7a1f1f"},
  {name:"carrot",bbox:[.33,.35,.32,.3],coverage:.1,thickness_cm:4.5,confidence:.71,draw:"cubes",col:"#f08a24"}]}
];

// App-shell strings (onboarding, Today, Week, Profile). French uses Québec meal names.
Object.assign(T.en,{
 greet:h=>h<12?"Good morning":h<18?"Good afternoon":"Good evening",left:"kcal left",overL:"kcal over",goal:"Goal",eaten:"Eaten",burned:"Burned",burnedNote:"from your tracker (sample)",net:"Net",
 meals:"Today's meals",scanCta:"Scan a meal",noMealsToday:"Nothing logged yet today. Tap Scan and snap your first meal.",
 slot:["Breakfast","Lunch","Snack","Dinner"],logBtn:s=>`Log as ${s}`,logged:s=>`Added to ${s}`,
 tabToday:"Today",tabScan:"Scan",tabWeek:"Week",week:"This week",avg:"Daily average",onTarget:"Days on target",streak:"Logging streak",daysU:"days",demoNote:"Earlier days are sample data so the chart has something to show.",goalLine:"Goal",
 profile:"Profile",dailyGoal:"Daily calorie goal",privacy:"Privacy and model training",replay:"Replay intro",reset:"Reset all data",resetDone:"All data cleared.",saved:"Saved",
 o1t:"Snap your plate",o1b:"One photo is all it takes. No coin, hand or card needed: Plateful works out the real size by itself.",
 o2t:"Every ingredient, weighed",o2b:"Rice, chicken and broccoli are measured separately: area, depth, weight, then calories and macros.",
 o3t:"Eat for your day",o3b:"Your meals meet the calories your Digital Health tracker says you burned. Set a daily goal to start.",
 next:"Next",skip:"Skip",start:"Start",scanning:"Scanning…",kcalU:"kcal",back:"Back"});
Object.assign(T.fr,{
 greet:h=>h<12?"Bonjour":h<18?"Bon après-midi":"Bonsoir",left:"kcal restantes",overL:"kcal de trop",goal:"Objectif",eaten:"Consommé",burned:"Dépensé",burnedNote:"selon votre traqueur (exemple)",net:"Net",
 meals:"Repas du jour",scanCta:"Analyser un repas",noMealsToday:"Rien de consigné aujourd'hui. Touchez Analyser et photographiez votre premier repas.",
 slot:["Déjeuner","Dîner","Collation","Souper"],logBtn:s=>`Consigner : ${s}`,logged:s=>`Ajouté : ${s}`,
 tabToday:"Aujourd'hui",tabScan:"Analyser",tabWeek:"Semaine",week:"Cette semaine",avg:"Moyenne quotidienne",onTarget:"Jours dans la cible",streak:"Série de suivi",daysU:"jours",demoNote:"Les jours précédents sont des données d'exemple pour que le graphique ne soit pas vide.",goalLine:"Objectif",
 profile:"Profil",dailyGoal:"Objectif calorique quotidien",privacy:"Confidentialité et entraînement du modèle",replay:"Revoir l'introduction",reset:"Effacer toutes les données",resetDone:"Données effacées.",saved:"Enregistré",
 o1t:"Photographiez votre assiette",o1b:"Une seule photo suffit. Aucune pièce, main ou carte : Plateful calcule la taille réelle par lui-même.",
 o2t:"Chaque ingrédient, pesé",o2b:"Riz, poulet et brocoli sont mesurés séparément : surface, profondeur, poids, puis calories et macros.",
 o3t:"Mangez selon votre journée",o3b:"Vos repas sont comparés aux calories dépensées selon votre traqueur Digital Health. Fixez un objectif pour commencer.",
 next:"Suivant",skip:"Passer",start:"Commencer",scanning:"Analyse…",kcalU:"kcal",back:"Retour"});

// Sample history for the past 6 days (Week chart). [English, French, kcal, protein, carbs, fat, sample-drawing index or -1]
const DEMO_MEALS=[
 ["Oatmeal with banana","Gruau et banane",380,12,68,7,-1],["Greek yogurt and berries","Yogourt grec et petits fruits",220,15,25,6,-1],
 ["Turkey sandwich","Sandwich à la dinde",430,28,45,14,-1],["Grilled chicken, rice and broccoli","Poulet grillé, riz et brocoli",379,37,46,4,0],
 ["Kidney bean soup","Soupe aux haricots rouges",237,14,36,3,2],["Apple and cheese","Pomme et fromage",250,9,20,14,-1],
 ["Salmon and potatoes","Saumon et pommes de terre",560,38,40,24,-1],["Pasta with tomato sauce","Pâtes sauce tomate",610,20,105,10,-1],
 ["Garden salad with chicken","Salade du jardin au poulet",340,30,14,17,1]];

// Accounts and database strings
Object.assign(T.en,{
 suTitle:"Create your account",suSub:"Your meals and goals are saved to your account, so they're there on any device.",liTitle:"Welcome back",liSub:"Log in to see your meals and progress.",
 npTitle:"Choose a new password",npSub:"Enter a new password for your account.",fgTitle:"Reset your password",fgSub:"We'll email you a link to choose a new password.",
 suBtn:"Create account",liBtn:"Log in",npBtn:"Save password",fgBtn:"Send reset link",haveAcc:"Already have an account? Log in",noAcc:"New here? Create an account",
 nameL:"Your name",emailL:"Email",passL:"Password (6+ characters)",forgotL:"Forgot password?",
 eName:"Please enter your name.",eEmail:"Please enter a valid email address.",ePass:"Password must be at least 6 characters.",eBadLogin:"Wrong email or password.",
 eExists:"An account with this email already exists. Log in instead.",eConfirm:"Please confirm your email first (check your inbox).",eRate:"Too many attempts. Wait a minute and try again.",eNet:"Can't reach the server. Check your connection.",
 checkEmail:"Account created. Check your email to confirm it, then log in.",resetSent:"If that email has an account, a reset link is on its way.",passSet:"Password updated.",
 dbErr:"Couldn't save. Please try again.",modeCloud:"Connected to the cloud database",modeLocal:"Demo mode: saved in this browser only",
 account:"Account",logout:"Log out",queued:n=>`${n} item${n==1?"":"s"} waiting to sync.`,offlineSaved:"Saved offline. It will sync when you're back online.",synced:n=>`Synced ${n} item${n==1?"":"s"}.`,
 noAI:"Live photo analysis isn't available on this page. Try one of the sample meals below."});
Object.assign(T.fr,{
 suTitle:"Créez votre compte",suSub:"Vos repas et objectifs sont enregistrés dans votre compte, accessibles sur tous vos appareils.",liTitle:"Bon retour",liSub:"Connectez-vous pour voir vos repas et vos progrès.",
 npTitle:"Choisissez un nouveau mot de passe",npSub:"Entrez un nouveau mot de passe pour votre compte.",fgTitle:"Réinitialiser le mot de passe",fgSub:"Nous vous enverrons un lien par courriel.",
 suBtn:"Créer le compte",liBtn:"Se connecter",npBtn:"Enregistrer",fgBtn:"Envoyer le lien",haveAcc:"Déjà un compte? Connectez-vous",noAcc:"Nouveau? Créez un compte",
 nameL:"Votre nom",emailL:"Courriel",passL:"Mot de passe (6 caractères ou plus)",forgotL:"Mot de passe oublié?",
 eName:"Veuillez entrer votre nom.",eEmail:"Veuillez entrer une adresse courriel valide.",ePass:"Le mot de passe doit contenir au moins 6 caractères.",eBadLogin:"Courriel ou mot de passe incorrect.",
 eExists:"Un compte existe déjà avec ce courriel. Connectez-vous.",eConfirm:"Veuillez d'abord confirmer votre courriel.",eRate:"Trop de tentatives. Réessayez dans une minute.",eNet:"Serveur injoignable. Vérifiez votre connexion.",
 checkEmail:"Compte créé. Confirmez votre courriel, puis connectez-vous.",resetSent:"Si ce courriel a un compte, un lien est en route.",passSet:"Mot de passe mis à jour.",
 dbErr:"Enregistrement impossible. Réessayez.",modeCloud:"Connecté à la base de données infonuagique",modeLocal:"Mode démo : enregistré dans ce navigateur seulement",
 account:"Compte",logout:"Se déconnecter",queued:n=>`${n} élément${n>1?"s":""} en attente de synchronisation.`,offlineSaved:"Enregistré hors ligne. Synchronisation au retour de la connexion.",synced:n=>`${n} élément${n>1?"s":""} synchronisé${n>1?"s":""}.`,
 noAI:"L'analyse de photo en direct n'est pas offerte sur cette page. Essayez un repas d'exemple ci-dessous."});
