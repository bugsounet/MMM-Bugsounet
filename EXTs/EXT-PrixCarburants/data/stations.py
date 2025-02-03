# Ecrit par Christian Quest le 10/3/2017
# Modification et adaptation par DuchkPy
# ce code est sous licence GNU-AGPL
# La version d'origine disponible sur https://github.com/openeventdatabase/datasources

# recuperation des nom/marque des stations services et sortie en stream json

from bs4 import BeautifulSoup
import requests
import json
import re
import unidecode
import argparse
import datetime
import os

# recuperation du token pour la recherche
session = requests.session()
html = session.get('https://www.prix-carburants.gouv.fr/').text
html_tree = BeautifulSoup(html,'lxml').find(id="rechercher__token")
token=html_tree['value']

# Creation de la serialisation
def serialiseur_perso(obj):
    if isinstance(obj, Departement):
        return {"numero": obj.numero,
                "stations": obj.stations}
                
    if isinstance(obj, Station):
       return {"id": obj.id,
                "commune": obj.commune,
                "cp": obj.cp,
                "adresse": obj.adresse,
                "nom": obj.nom,
                "marque": obj.marque}
    
    raise TypeError(repr(obj) + " n'est pas serialisable !")

class Departement:
    def __init__(self, numero):
        self.numero = numero
        self.stations = []

class Station:
    def __init__(self, id, commune, cp, adresse, nom, marque):
        self.id = id
        self.commune = commune
        self.cp = cp
        self.adresse = adresse
        self.nom = nom
        self.marque = marque

def main():
    # Arguments disponible
    parser = argparse.ArgumentParser()
    parser.add_argument("-d", "--departement", type=str, choices=['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '2A', '2B', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '91', '92', '93', '94', '95'], help="Department to get gaz station list")
    parser.add_argument("-l", "--log", help="Write a log file listing department parsed and the quantity of gaz station registered", action="store_true")
    args = parser.parse_args()

    # preparation de la liste des departements
    if args.departement:
        depts = [str(args.departement[0]) + str(args.departement[1])]
    else:
        depts = ['01']
        for dep in range(2, 20):
            d = '0'+str(dep)
            depts.append(d[-2:])
        depts.extend(['2A', '2B'])
        for dep in range(21, 96):
            depts.append(str(dep))

    # Création du dossier de stockage des fichiers
    if not os.path.isdir('listestations'):
        os.mkdir('listestations')

    # Boucle les departements
    for d in depts:
        Increment = 0
        # Creation du fichier, en retirant le 0 au debut
        try:
            nomfichier = "listestations/stations"+str(int(d))+".json"
        except:
            nomfichier = "listestations/stations"+d+".json"
        ListeStation = Departement(d)
        
        # execution de la recherche 
        html = session.post('https://www.prix-carburants.gouv.fr/',
            {'rechercher[departement]':d,
            'rechercher[_token]':token}).text
        page=1

        # Boucle les pages
        while True:
            # reception des resultats
            html = session.get('https://www.prix-carburants.gouv.fr/recherche/?page=%s&limit=100' % page).text
            html_tree = BeautifulSoup(html,'lxml')
            try:
                # recherche nombre de pages
                pages = len(html_tree.find_all(class_=re.compile('pagination__link')))-4
            except:
                pages=1

            if page==1:
                try:
                    Listeh2 = html_tree.find_all('h2')
                    nbstationdep = Listeh2[0].string.split(' ')[0]
                except:
                    break
            
            # Boucle les donnees des stations
            for retour in html_tree.find_all(class_='data'):
                #dv = retour.find(class_='pdv-description')
                dv = retour.find(class_='title')
                #td = dv.find_all(re.compile('span'))
                row = retour.find(class_='fr-grid-row')
                td = row.find_all(re.compile('span'))
                NomMarque = dv.find('strong').string.split(' | ')
                Adresse = td[len(td)-1].string.split(' ', 1)
                # Met en forme en retirant tous les accents et caracteres particuliers
                StCommune = unidecode.unidecode(Adresse[1], "utf-8").upper()
                StCP = Adresse[0]
                StAdresse = unidecode.unidecode(td[len(td)-2].string, "utf-8")
                StNom = unidecode.unidecode(NomMarque[0], "utf-8")
                StMarque = unidecode.unidecode(NomMarque[1], "utf-8")
                # id, Commune, Code Postal, Adresse, Nom, Marque                
                ListeStation.stations.append(Station(retour['id'], StCommune, StCP, StAdresse, StNom, StMarque))
                
                Increment = Increment + 1

            if page==pages:
                break
            else:
                page = page + 1
        
        # Ecriture du fichier
        with open(nomfichier, "w") as file:
            json.dump(ListeStation, file, sort_keys=False, separators=(',', ':'), default=serialiseur_perso)
        # Affichage du departement fait
        print("Departement : "+d+", nombre de stations relevees : "+str(Increment)+"/"+nbstationdep)
        # Ecriture dans un fichier pour le controle
        if args.log:
            
            with open("listestations/log.txt", "a") as fichier:
                fichier.write(str(datetime.datetime.now())+" Department "+d+" : "+str(Increment)+" gaz station registered over "+nbstationdep+"\n")

if __name__ == "__main__":
    main()
