# Taleway — Guide de design (Front-end)

Style : **"light academia", papier / livre / bibliothèque**, épuré, couleurs claires.
Ce document est la source de vérité partagée entre les maquettes Penpot et le code.
Les décisions y sont consignées au fur et à mesure — rien n'est gravé, on itère.

---

## 1. Brief

- **Ambiance** : bibliothèque ancienne, fiches de catalogue, carnets manuscrits.
- **Signature visuelle** : le signup/login = remplir une **fiche d'inscription de bibliothèque**.
- **Tonalité** : chaleureux, calme, lisible. Pas de néon, pas de dark mode prioritaire.
- **Références mentales** : fiches de bibliothèque (cartes manuscrites, tampons, bordures à double filet), papier ligné, estampilles.

## 2. Palette de couleurs (proposition v1)

| Rôle              | Nom               | Hex       | Usage                               |
| ----------------- | ----------------- | --------- | ----------------------------------- |
| Fond principal    | Papier crème      | `#FAF6EF` | Fond des pages                      |
| Fond alternatif   | Papier ancien     | `#F1EAD8` | Cartes, fiches, encarts             |
| Texte             | Encre noire       | `#1C1A17` | Titres, corps                       |
| Texte secondaire  | Encre estompée    | `#6B6257` | Métadonnées, labels                 |
| Accent principal  | Rouge tampon      | `#B0493A` | CTA, liens actifs, tampon "Nouveau" |
| Accent secondaire | Vert bibliothèque | `#4A6B4D` | Succès, statut "Publié"             |
| Bordures          | Sépia             | `#D8CFBB` | Bordures de fiches, séparateurs     |

À valider dans Penpot : contraste, rendu à l'écran, déclinaisons hover/disabled.

## 3. Typographie (proposition v1)

| Usage                       | Police candidate                                    | Remarques                                           |
| --------------------------- | --------------------------------------------------- | :-------------------------------------------------- |
| Titres                      | `Crimson Text` / `Playfair Display` / `EB Garamond` | Serif élégant, ambiance livre                       |
| Corps                       | Même serif que les titres                           | Bascule sans-serif si densité de lecture nécessaire |
| Détails "tampon/annotation" | `Caveat` (ou similaire manuscrit)                   | À doser très légèrement                             |

À trancher dans Penpot : une seule serif (titres + corps) ou deux niveaux.

## 4. Textures & détails

- Grain papier subtil (noise) sur les fonds.
- Bordures de fiches à **double filet** (comme les vraies fiches de catalogue).
- Champs de formulaire sur **ligne horizontale** (style formulaire papier), pas de boîtes lourdes.
- Tampons estampillés (légèrement tournés, encre irrégulière) pour les statuts.

## 5. Composants à maquetter (checklist Penpot)

- [ ] Page connexion/inscription — **fiche de bibliothèque**
- [ ] Champ email / champ OTP (6 cases ?) / champ username — style "ligne de fiche"
- [ ] Boutons — style tampon ou bordure encre
- [ ] Carte d'histoire (couverture + titre + catégorie tamponnée)
- [ ] Header/nav — minimaliste, "estampille"
- [ ] Page d'accueil — hero (CTA) + grille de romans
- [ ] Studio xyflow — le plus complexe : fond papier à carreaux ? canvas contrasté ?

## 6. Pages prioritaires (ordre du TODO)

1. Connexion/inscription (fiche de bibliothèque) — synchro multi-appareils, bookmarks permanents
2. Accueil — CTA + romans
3. Profil & paramètres
4. Studio (xyflow + panneau)
5. Lecteur de romans + mode debug