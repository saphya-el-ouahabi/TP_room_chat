# TP_room_chat

mini projet en INFO834

base : https://blog.bini.io/developper-une-application-avec-socket-io/

##Installation
Si vous n'avez pas bower d'installé sur votre machine, installez-le au préalable de la façon suivante :
```npm install -g bower```

Pour installer l'application, téléchargez les sources (zip ou git clone) et exécutez la commande suivante depuis la racine du projet.
```npm install```

```bower install```

Pour utiliser le mini-chat, il suffit de lancer le fichier server.js et de rentrer son username.

## Fonctionnalités du mini-chat :

- Stocker l'ensemble des messages dans MongoDB
- Utiliser le ReplicaSet pour permettre une meilleure tolérance aux pannes
- Pouvoir afficher une conversation précédente entre deux utilisateurs

#### Création du replicaset :

tuto : https://openclassrooms.com/fr/courses/4462426-maitrisez-les-bases-de-donnees-nosql/4474611-protegez-vous-des-pannes-avec-les-replicaset

1 - Créer répertoire dédier à chaque réplicaset
*Dans 3 invit de commandes*
```mkdir /data/r0s1```
```mkdir /data/r0s2```
```mkdir /data/r0s3```

2 - Associer à chaque serveur un port d'écoute
*Dans 3 invit de commandes*
```mongod --replSet rs0 --port 27018 --dbpath ./data/R0S1```
```mongod --replSet rs0 --port 27019 --dbpath ./data/R0S2```
```mongod --replSet rs0 --port 27020 --dbpath ./data/R0S3```
Les 3 serveurs tournent mais pas encore de réplicacet, il faut connecter les serveurs ensemble.

3 - Se connecter à notre serveur principale
*4e invit de commandes*
```mongo --port 27018```

4 - Initialiser le replicaset
*4e invit de commandes* 
```rs.initiate ()```

5 - Connecter les replicacets
*4e invit de commandes*
```rs.add("localhost:27019");```
```rs.add("localhost:27020");```

6 - Voir la configuration de notre replicaset
*4e invit de commandes*
```rs.conf()```
3 membres qui vont chacun être des réplicats

7 - Voir qui est serveur primaire et secondaire
*4e invit de commandes*
```rs.status()```

8 - Créer un arbitre
*5e invit de commandes*
```mkdir /data/arb```
```mongod --port 30000 --dbpath ./data/arb --replSet rs0```

9 - Ajouter l'arbitre
*4e invit de commandes*
Se connecter au serveur primary :
```mongo --port 27018```
Ajout de l'arbitre :
```rs.addArb("localhost:30000")```



Travail en binôme avec Camille Krüsi.
