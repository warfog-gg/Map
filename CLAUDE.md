# Project Context

## Inspiration : Oskar Stålberg (Townscaper)

Le projet s'inspire du travail d'Oskar Stålberg, développeur suédois connu pour la génération procédurale par contraintes.

### Principes clés de Townscaper
- **Grille irrégulière** : subdivision Voronoi relaxée (pas de grille carrée) pour un aspect organique
- **Modules + règles d'adjacence** : chaque cellule contient un module (mur, toit, arche, vide...) avec des règles de voisinage
- **Propagation de contraintes** : placement → propagation locale aux voisins (CSP - Constraint Satisfaction Problem), pas de backtracking global
- **Bits comme état** : chaque sommet a un état binaire (plein/vide), modules sélectionnés par lookup table selon la configuration des voisins
- **Pas du WFC pur** : plus simple qu'un Wave Function Collapse complet — système de lookup + contraintes locales sans aspect probabiliste/entropie

### Jeux de Stålberg
- **Bad North (2018)** : WFC pour générer des îles procédurales
- **Townscaper (2021)** : construction libre avec génération automatique de ville cohérente (toits, arches, escaliers, fenêtres)

### Application au projet Map
- Contraintes d'adjacence entre types de terrain (ex: forêt → pas d'eau directe → ajouter plage)
- Modules architecturaux pour bâtiments générés depuis OSM
- Propagation locale pour cohérence visuelle des transitions de terrain

## Technical Notes
- L'utilisateur n'a pas d'ordinateur, uniquement un téléphone
- Le projet est déployable via GitHub Pages (dossier docs/)
- Build configuré avec base: './' pour chemins relatifs
