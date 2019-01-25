# Minecraft Map Generator

Génère une map format web avec mapcrafter, en la telechargeant avant via l'API de minecraft.

## Prerequis

- Dupliquer configuration/configuration.example.json vers configuration/configuration.json et completer
- Avoir mapcrafter (avec la version adapté à la version de mc) ([site de mapcrafter](https://docs.mapcrafter.org/builds/stable/installation.html))
- Adapter au besoin le fichier de render de mapcrafter configuration/render.conf ([documentation supplementaire de mapcrafter](https://docs.mapcrafter.org/builds/stable/configuration.html))
- un petit "yarn" ou "npm i" pour installer le projet, quand même

## TODO
- Appelle de mapcrafter dans le fichier de config
- une petite doc, parce que c'est toujours mieux

## Evolution possible
- Changer le process de DL pour en avoir la progression
- Compression de la map final, pour pouvoir la push plus facilement
- Options au lancement de l'app pour activer ou non des fonctionalité 
- Option pour push automatiquement les fichier avec scp a la fin