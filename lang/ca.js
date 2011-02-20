var LANG_STR = [
	  "Fitxers Torrent||*.torrent||Tots els fitxers (*.*)||*.*||"
	, "OK"
	, "Cancela"
	, "Aplicar"
	, "Sí"
	, "No"
	, "Tancar"
	, "Preferències"
	, "Idioma"
	, "Idioma:"
	, "Privacitat"
	, "Cerca automatica d'actuualitzacions"
	, "Actualitza a versions beta"
	, "Envia informacio anonima quan busquis actualitzacions"
	, "Quan descarrega"
	, "Afegir .!ut als arxius incomplets"
	, "Pre-ubicar tots els arxius"
	, "Evitar standby si hi ha torrents actius"
	, "Mostrar Opcions"
	, "Confirma quan esborris torrents"
	, "Confirma quan esborris trackers"
	, "mostra diàleg de confirmació al sortir"
	, "Color de fons alternatiu per la llista"
	, "Mostra la velocitat actual a la barra del titol"
	, "Mostrar els límits de velocitat a la barra d'estat"
	, "Quan afegeixis torrents"
	, "No comencis la descarrega automaticament"
	, "Activar la finestra del programa"
	, "Mostrar una finestra que exhibeixi els arxius que hi ha dins el torrent"
	, "Accions al fer Doble Clic"
	, "Per compartir torrents:"
	, "Per descarregar torrents:"
	, "Localització del arxius descarregats:"
	, "Posa les noves descarregues a:"
	, "Mostrar sempre diàleg al afegir manualment "
	, "Mou les descarregues finalitzades a:"
	, "Afegeix l'etiqueta dels torrents"
	, "Mou nomes des del directori de descarrega per defecte"
	, "Localitzacio dels torrents"
	, "Enmagatxema els torrents a:"
	, "Mou els torrents acabats a:"
	, "Carreca automaticament els torrents des de:"
	, "Esborra els torrents carregats"
	, "Port d'escolta"
	, "Port utilitzat per les conexions entrants:"
	, "Port aleatori"
	, "Tria el port de manera aleatoria cada cop que arrenca"
	, "Activa elmapejat de ports UPnP"
	, "Activa el mapejat de ports NAT-PMP"
	, "Servidor Proxy"
	, "Mena:"
	, "Proxy:"
	, "Port:"
	, "Autentificacio:"
	, "Nom d'usuari:"
	, "Contrasenya:"
	, "Resoldre els noms de host a través de proxi"
	, "Usar el servidor proxy per conexions peer-to-peer"
	, "Afegeix a les excepcions del Firewall de Windows"
	, "Proxy Privacy"
	, "Disable all local DNS lookups"
	, "Disable features that leak identifying information"
	, "Disable connections unsupported by the proxy"
	, "Limitació global de la velocitat de pujada"
	, "Velocitat maxima de pujada (kB/s): [0: ilimitada]"
	, "Automatic"
	, "Velocitat de pujada alternativa quan no es descarrega (kB/s):"
	, "Limitació global de la velocitat de baixada"
	, "Velocitat maxima de baixada (kB/s): [0: ilimitat]"
	, "Nombre de conexions:"
	, "Nombre global maxim de conexions:"
	, "Nombre maxim de clients conectats per torrent"
	, "<nombre d'espais de pujada per torrent"
	, "Usa espais adicionals de pujada si la velocitat de pujada < 90%"
	, "Global Rate Limit Options"
	, "Aplica límit de taxa al sobreeiximent de transport"
	, "Aplica el límit de velocitat a les connexions uTP"
	, "Caracteristiques basiques del BitTorrent"
	, "Activa la xarxa DHT"
	, "Demana al tracker la informacio de raspat"
	, "Activa el DHT pels torrents nous"
	, "Activa Intrecanvi de clients"
	, "Activa Cerca local de clients"
	, "Limit d'ample de banda per clients locals"
	, "IP/Hostname a informar al tracker:"
	, "Protocol d'encriptacio"
	, "Sortints:"
	, "Permet concexions entrants heretades"
	, "Permet la configuració de banda [uTP]"
	, "Permet suport de tracker UDP"
	, "Enable Transfer Cap"
	, "Cap Settings"
	, "Limit Type:"
	, "Bandwidth Cap:"
	, "Time Period (days):"
	, "Història d'ús per un període seleccionat:"
	, "Pujat:"
	, "Baixat:"
	, "Pujat + Baixat"
	, "Període de temps:"
	, "Darrers %d dies"
	, "Resseteja la Història"
	, "Ajustaments de la cua"
	, "Nombre maxcim de torrents actius (pujada o descarrega)"
	, "Nombre maxim de descarregues actives:"
	, "Compatrteix mentre [Valors per defecte]"
	, "Minimum ratio (%):"
	, "Minimum seeding time (minutes):"
	, "les tasques de comparticio tenen prioritat devant de les de baixada"
	, "Quan l' µTorrent arriba a l'objetiu de comparticio"
	, "Limitar la velocitat de pujada a (kB/s): [0: aturar]"
	, "Activar el planificador"
	, "Taula del planificador"
	, "Ajustaments del planificador"
	, "Velocitat de pujada limitada (kB/s):"
	, "Limit de velocitad de descarrega (kB/s):"
	, "Desactiva el DHT quan apaguis"
	, "Activa el Web UI"
	, "Autetintificació"
	, "Nom d'usuari"
	, "Paraula clau:"
	, "Activa  el no d'usuari d'una conta de Convidat"
	, "Connectivitat"
	, "Port alternatiu d'escolta (per defecte el port de conexio)"
	, "Restringir l'acces a les seguents IPs (separeu cadascubna de les entrades amb una coma):"
	, "Opcions Avançades [COMPTE: No les modifiqueu!]"
	, "Valor: "
	, "Veritat"
	, "Fals"
	, "Ajustar"
	, "Llista de velocitat emergent [Separeu els múltiples valors amb una coma]"
	, "Anul·la la llista automàtica de velocitat emergent"
	, "Llista de velocitat de carrega:"
	, "Llista de velocitat de descarrega:"
	, "Etiquetes persistents [separeu cadascuna d'elles amb el caracter |]"
	, "Motors de cerca [Format: nom|URL]"
	, "Ajustaments basics de la Cache"
	, "La cahce del disc s'utilitza per mantenir les dades a les que s'accedeix de forma frequent en memoria a fi i efecte de reduir el nombre de lectures i escriptures del disc dur. Utorrent normalment gestiona la cache automaticament, pero pots camviar el seu comportament modificant aquests ajustaments"
	, "Anular la mida automatica de la cache i especificarla manualment (MB):"
	, "Reduir l'us de memoria quan no cal usar la cache"
	, "Ajustaments avançats de la cache"
	, "Activar la captura de les escriptures del disc"
	, "Escriure els blocs sense tocar cada 2 minuts"
	, "Escriure les peces acabades inmediatament"
	, "Activar la captura de les lecutres del disc"
	, "Apagar la captura de lectura si la velocitat de pujada es lenta"
	, "Eswborrar els blocs vells de la cache"
	, "Incrementar la mida automatica de la cache quan es llençen coses"
	, "Desactivar la captura del Windows de l'escriptura del disc"
	, "Desactivar la captura del Windows de les lecutres del disc"
	, "Run Program"
	, "Run this program when a torrent finishes:"
	, "Run this program when a torrent changes state:"
	, "You can use these commands:\r\n%F - Name of downloaded file (for single file torrents)\r\n%D - Directory where files are saved\r\n%N - Title of torrent\r\n%S - State of torrent\r\n%L - Label\r\n%T - Tracker\r\n%M - Status message string (same as status column)\r\n%I - hex encoded info-hash\r\n\r\nState is a combination of:\r\nstarted = 1, checking = 2, start-after-check = 4,\r\nchecked = 8, error = 16, paused = 32, auto = 64, loaded = 128"
	, "Propietats del torrent"
	, "Trackers (separeu-los amb una linia en blanc)"
	, "Ajustaments de l'ample de banda"
	, "Velocitat maxima de pujada (kB/s): [0: per defecte]"
	, "Nombre de espais de descarrega: [0: per defecte]"
	, "Nombre de espais de carrega: [0: per defecte]"
	, "Comparteix mentre"
	, "Anula els ajustaments per defecte"
	, "Minimum ratio (%):"
	, "Minimum seeding time (minutes):"
	, "Altres ajustaments"
	, "Compartició inicial"
	, "Activa DHT"
	, "Intercambi de clients"
	, "Font"
	, "Font URL:"
	, "Alies Personalitzat"
	, "Subscripció"
	, "No baixis automàticament tots els ítems"
	, "Automàticament baixa tots els ítems publicats al feed"
	, "Utilitzar el filtre intel·ligent d'episodis"
	, "Feeds||Favorits||Historial||"
	, "All Feeds"
	, "Ajustaments del filtre:"
	, "Nom:"
	, "Filtre:"
	, "No:"
	, "Guardar a:"
	, "Font:"
	, "Qualitat:"
	, "Nombre d'episodis: [ex. 1x12-14]"
	, "El filtre coincideix amb el nom original enlloc de amb el nom descodificat"
	, "No començar les descàrregues automàticament"
	, "Filtre intel·ligent d'ep."
	, "Donar la màxima prioritat a la descàrrega"
	, "Interval mínim:"
	, "Etiqueta per als torrents nous:"
	, "Afegeix font RSS"
	, "Editar l'Alimentació"
	, "Desactiva les fonts"
	, "Activar l'Alimentacío"
	, "Actualitzar l'alimentació"
	, "Esborra les fonts"
	, "Descarrega"
	, "Obre l'URL a l'explorador"
	, "Afegeix als Favorits"
	, "Afegir"
	, "Esborrar"
	, "TOT"
	, "(Tots)"
	, "(coincid. sempre)||(coinc. una vegada)||12 hores||1 dia||2 dies||3 dies||4 dies||1 setmana||2 setmanes||3 setmanes||1 mes||"
	, "Afegir una font RSS"
	, "Edita les fonts RSS"
	, "Remove RSS Feed(s)"
	, "Really delete the %d selected RSS Feeds?"
	, "Esteu segur que voleu suprimir la font d'RSS \"%s\"?"
	, "Nom complet"
	, "Nom"
	, "Episodi"
	, "Format"
	, "Codec"
	, "Date"
	, "Font"
	, "Recursos URL"
	, "IP"
	, "Port"
	, "Client"
	, "Opcions"
	, "%"
	, "Rellevància"
	, "Velocitat descarrega"
	, "Velocitat Carega"
	, "Peticions"
	, "Esperat"
	, "Carregat"
	, "Descarregat"
	, "Err. 'hash'"
	, "Des. Clients"
	, "Màx. càrr."
	, "Màx. desc."
	, "A la cua"
	, "Inactiu"
	, "Fet"
	, "Nom"
	, "%"
	, "Prioritat"
	, "Mida"
	, "omet"
	, "baixa"
	, "normal"
	, "alta"
	, "Descarregat:"
	, "Carregat:"
	, "Llavors:"
	, "Restant:"
	, "Vel. descàrrega:"
	, "Vel. càrrega:"
	, "Clients:"
	, "Relació comp.:"
	, "Desa com:"
	, "'Hash':"
	, "General"
	, "Transferint"
	, "%d de %d connectats (%d a l'eixam)"
	, "D:%s C:%s - %s"
	, "Copia"
	, "Reinicialitzar"
	, "Il·limitat"
	, "Resol les IPs"
	, "Get File(s)"
	, "No descarreguis"
	, "Prioritat alta"
	, "Prioritat baixa"
	, "Prioritat normal"
	, "Copia URI Imant"
	, "Suprimeix les dades"
	, "Suprimeix el .torrent"
	, "Suprimeix el .torrent i les dades"
	, "Forçar Recomprobació"
	, "Força l'inici"
	, "Etiqueta"
	, "Pausa"
	, "Propietats"
	, "Mou Baixa la cua "
	, "Mou Puja la cua"
	, "Elimina"
	, "Eliminar i"
	, "Inicia"
	, "Atura"
	, "Actius"
	, "Tots"
	, "Completats"
	, "Descarregant"
	, "Inactius"
	, "Sense etiqueta"
	, "||Disp.||Disponibilitat"
	, "Afegit el"
	, "Completat el"
	, "Fet"
	, "Descarregat"
	, "Vel. descarrega"
	, "Temps estimat"
	, "Etiqueta"
	, "Nom"
	, "N."
	, "Clients"
	, "Restant"
	, "Llavors"
	, "LLavors/Clients"
	, "Relació"
	, "Mida"
	, "Recursos URL"
	, "Estat"
	, "Carregat"
	, "Vel. Carrega"
	, "Estas segur que vols esborrar aquests %d torrents i totes les seves dades?"
	, "Estas segur que vols esborrar aquest torrent i totes les seves dades?"
	, "Estas segur que vols esborrar els %d torrents seleccionat?"
	, "Estas segur que vols esborrar el torrent seleccionat?"
	, "Esteu segur que voleu suprimir el filtre d'RSS \"%s\"?"
	, "Comprovat %:.1d%%"
	, "Descarregant"
	, "Error: %s"
	, "Finalitzat"
	, "Pausat"
	, "A la cua"
	, "A la cua de sembrat"
	, "Sembrant"
	, "Aturat"
	, "Introduïu l'etiqueta"
	, "Introduïu la nova etiqueta per als torrents seleccionats:"
	, "Nova etiqueta..."
	, "Suprimeix l'etiqueta"
	, "General||Trackers||Pars||Peces||Fitxers||Velocitat||Registre||"
	, "Afegeix un torrent"
	, "Afegeix un torrent des d'una URL"
	, "Pausa"
	, "Preferències"
	, "Mou la cua cap avall "
	, "Mou la cua cap amunt "
	, "Suprimeix"
	, "Descarregador d'RSS"
	, "Inicia"
	, "Atura"
	, "Fitxer"
	, "Afegeix un torrent..."
	, "Afegeix un torrent des d'una URL..."
	, "Opcions"
	, "Preferències "
	, "Mostra la llista de categories"
	, "Mostra informació detallada"
	, "Mostra la barra d'estat"
	, "Mostra la barra d'eines"
	, "Icones a les pestanyes"
	, "Ajuda"
	, "Pàgina web del µTorrent"
	, "Fòrums µTorrent"
	, "Send WebUI Feedback"
	, "About µTorrent WebUI"
	, "Torrents"
	, "Pausa tots els torrents"
	, "Continua tots els torrents"
	, "D: %s%z/s"
	, " L: %z/s"
	, " O: %z/s"
	, " T: %Z"
	, "U: %s%z/s"
	, "B"
	, "EB"
	, "GB"
	, "kB"
	, "MB"
	, "PB"
	, "TB"
	, "Avançat"
	, "Ample de banda"
	, "Connexió"
	, "Memòria cau del disc"
	, "Directoris"
	, "General"
	, "Planificador"
	, "Cua"
	, "Extres UI"
	, "Ajustaments UI"
	, "BitTorrent"
	, "IU web"
	, "Límit de Transferència"
	, "Run Program"
	, "Mostra les propietats||Inicia/atura||Obre la carpeta||Mostra la barra de descàrrega||"
	, "Desactivat||Activat||Forçat||"
	, "(cap)||Socks4||Socks5||HTTPS||HTTP||"
	, "Uploads||Downloads||Uploads + Downloads||"
	, "MB||GB||"
	, "1||2||5||7||10||14||15||20||21||28||30||31||"
	, "Nom"
	, "Valor"
	, "Dl||Dt||Dc||Dj||Dv||Ds||Dg||"
	, "Dilluns||Dimarts||Dimecres||Dijous||Divendres||Dissabte||Diumenge||"
	, "Vel. màxima"
	, "Velocitat maxima - utilitza els limits normals globals limits de l'ample de banda "
	, "Limitat"
	, "Limitat - Utilitza el planificador especificat limits de l'ample de banda"
	, "Només compartir "
	, "Nomes compartir - Nomes puja dades (fins i tot les incompletes) "
	, "Desact."
	, "Apagar - Atura tots els torrents que no estiguin forçats"
	, "<= %d hores"
	, "(Ignora)"
	, "<= %d minuts"
	, "%dd %dh"
	, "%dh %dm"
	, "%dm %ds"
	, "%ds"
	, "%dw %dd"
	, "%dy %dw"
];
