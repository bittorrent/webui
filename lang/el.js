/*
Copyright (c) 2011 BitTorrent, Inc. All rights reserved.

Use of this source code is governed by a BSD-style that can be
found in the LICENSE file.
*/

var LANG_STR =
{
   "CT_MASK1":"Αρχεία Torrent||*.torrent||Όλα τα αρχεία (*.*)||*.*||",
   "DLG_BTN_OK":"OK",
   "DLG_BTN_CANCEL":"Άκυρο",
   "DLG_BTN_APPLY":"Εφαρμογή",
   "DLG_BTN_YES":"Ναι",
   "DLG_BTN_NO":"Όχι",
   "DLG_BTN_CLOSE":"Κλείσιμο",
   "DLG_SETTINGS_00":"Επιλογές",
   "DLG_SETTINGS_1_GENERAL_01":"Γλώσσα",
   "DLG_SETTINGS_1_GENERAL_02":"Γλώσσα:",
   "DLG_SETTINGS_1_GENERAL_10":"Ιδιωτικό απόρρητο",
   "DLG_SETTINGS_1_GENERAL_11":"Έλεγχος για νέες εκδόσεις αυτόματα",
   "DLG_SETTINGS_1_GENERAL_12":"Δοκιμαστικές εκδόσεις",
   "DLG_SETTINGS_1_GENERAL_13":"Αποστολή ανώνυμων πληροφοριών κατά τον έλεγχο για αναβάθμιση",
   "DLG_SETTINGS_1_GENERAL_17":"Κατα τη λήψη",
   "DLG_SETTINGS_1_GENERAL_18":"Κατάληξη .!ut σε μη ολοκληρωμένα",
   "DLG_SETTINGS_1_GENERAL_19":"Δέσμευση χώρου για τα αρχεία",
   "DLG_SETTINGS_1_GENERAL_20":"Αποτροπή αδρανοποίησης με torrents ενεργά",
   "DLG_SETTINGS_2_UI_01":"Επιλογές προβολής",
   "DLG_SETTINGS_2_UI_02":"Επιβεβαίωση διαγραφής torrents",
   "DLG_SETTINGS_2_UI_03":"Επιβεβαίωση διαγραφής trackers",
   "DLG_SETTINGS_2_UI_04":"Ερώτημα επιβεβαίωσης για έξοδο",
   "DLG_SETTINGS_2_UI_05":"Αλλαγή χρώματος φόντου λίστας",
   "DLG_SETTINGS_2_UI_06":"Τρέχουσα ταχύτητα σε γρ. τίτλου",
   "DLG_SETTINGS_2_UI_07":"Όρια ταχύτητας σε γρ. κατάστασης",
   "DLG_SETTINGS_2_UI_15":"Όταν προστίθενται Torrents",
   "DLG_SETTINGS_2_UI_16":"Μη αυτόματη έναρξη της λήψης",
   "DLG_SETTINGS_2_UI_17":"Ανάδυση παραθύρου προγράμματος",
   "DLG_SETTINGS_2_UI_18":"Προβολή παραθύρου που δείχνει τα αρχεία μέσα στο torrent",
   "DLG_SETTINGS_2_UI_19":"Ενέργεια διπλού κλικ",
   "DLG_SETTINGS_2_UI_20":"Για torrents που τροφοδοτούν:",
   "DLG_SETTINGS_2_UI_22":"Για torrents που λαμβάνονται:",
   "DLG_SETTINGS_3_PATHS_01":"Τοποθεσία ολοκληρωμένων αρχείων",
   "DLG_SETTINGS_3_PATHS_02":"Αποθήκευση νέων λήψεων:",
   "DLG_SETTINGS_3_PATHS_03":"Παράθυρο διαλόγου για ορισμό",
   "DLG_SETTINGS_3_PATHS_06":"Μεταφορά των ολοκληρωμένων στο:",
   "DLG_SETTINGS_3_PATHS_07":"Επισύναψη ετικέτας του torrent",
   "DLG_SETTINGS_3_PATHS_10":"Μεταφορά μόνο απο τον προκαθορισμένο φάκελο λήψεων",
   "DLG_SETTINGS_3_PATHS_11":"Τοποθεσία των .torrents",
   "DLG_SETTINGS_3_PATHS_12":"Αποθήκευση νέων .torrents στο:",
   "DLG_SETTINGS_3_PATHS_15":"Μεταφορά ολοκληρωμένων .torrents στο:",
   "DLG_SETTINGS_3_PATHS_18":"Αυτόματη φόρτωση .torrents από:",
   "DLG_SETTINGS_3_PATHS_19":"Διαγραφή ενεργών .torrents",
   "DLG_SETTINGS_4_CONN_01":"Θύρα επικοινωνίας",
   "DLG_SETTINGS_4_CONN_02":"Θύρα για τις εισερχόμενες συνδέσεις:",
   "DLG_SETTINGS_4_CONN_04":"Τυχαία θύρα",
   "DLG_SETTINGS_4_CONN_05":"Τυχαία θύρα σε κάθε εκκίνηση",
   "DLG_SETTINGS_4_CONN_06":"Ενεργοποίηση του UPnP",
   "DLG_SETTINGS_4_CONN_07":"Ενεργοποίηση του NAT-PMP",
   "DLG_SETTINGS_4_CONN_08":"Διακομιστής μεσολάβησης",
   "DLG_SETTINGS_4_CONN_09":"Τύπος",
   "DLG_SETTINGS_4_CONN_11":"Διεύθυν.",
   "DLG_SETTINGS_4_CONN_13":"Θύρα",
   "DLG_SETTINGS_4_CONN_15":"Ταυτοποίηση",
   "DLG_SETTINGS_4_CONN_16":"Όνομα χρήστη:",
   "DLG_SETTINGS_4_CONN_18":"Κωδικός πρόσβασης:",
   "DLG_SETTINGS_4_CONN_19":"Να γίνονται Resolve τα hostnames μέσω του διαμεσολαβητή",
   "DLG_SETTINGS_4_CONN_20":"Χρήση του διαμεσολαβητή για συνδέσεις peer-to-peer",
   "DLG_SETTINGS_4_CONN_21":"Εξαίρεση από το Windows Firewall",
   "DLG_SETTINGS_4_CONN_22":"Ιδιωτικότητα διαμεσολαβητή",
   "DLG_SETTINGS_4_CONN_23":"Απενεργοποίηση όλων των τοπικών DNS lookups",
   "DLG_SETTINGS_4_CONN_24":"Απενεργοποίηση δυνατοτήτων που ενδέχεται να παρέχουν πληροφορίες αναγνώρισης",
   "DLG_SETTINGS_4_CONN_25":"Απενεργοποίηση συνδέσεων που δεν υποστηρίζονται απ τον διαμεσολαβητή",
   "DLG_SETTINGS_5_BANDWIDTH_01":"Γενικό όριο ταχύτητας αποστολής",
   "DLG_SETTINGS_5_BANDWIDTH_02":"Μέγιστη ταχύτητα αποστολής (kB/s): [0: απεριόριστο]",
   "DLG_SETTINGS_5_BANDWIDTH_03":"Αυτόματα",
   "DLG_SETTINGS_5_BANDWIDTH_05":"Μέγιστο όριο αποστολής όταν δεν γίνεται λήψη (kB/s):",
   "DLG_SETTINGS_5_BANDWIDTH_07":"Γενικό όριο ταχύτητας λήψεων",
   "DLG_SETTINGS_5_BANDWIDTH_08":"Μέγιστη ταχύτητα λήψης (kB/s):",
   "DLG_SETTINGS_5_BANDWIDTH_10":"Αριθμός συνδέσεων",
   "DLG_SETTINGS_5_BANDWIDTH_11":"Γενικό όριο αριθμού συνδέσεων:",
   "DLG_SETTINGS_5_BANDWIDTH_14":"Μέγιστος αριθμός συνδεδεμένων αποδεκτών ανά torrent:",
   "DLG_SETTINGS_5_BANDWIDTH_15":"Μέγιστος αριθμός θέσεων αποστολής ανα torrent:",
   "DLG_SETTINGS_5_BANDWIDTH_17":"Χρήση επιπλέον θέσεων αποστολής αν η ταχύτητα αποστολής είναι < 90%",
   "DLG_SETTINGS_5_BANDWIDTH_18":"Global Rate Limit Options",
   "DLG_SETTINGS_5_BANDWIDTH_19":"Εφαρμογή ορίου ρυθμού στο transport overhead",
   "DLG_SETTINGS_5_BANDWIDTH_20":"Εφαρμογή ορίου ρυθμού στις συνδέσεις uTP",
   "DLG_SETTINGS_6_BITTORRENT_01":"Βασικές λειτουργίες του BitTorrent",
   "DLG_SETTINGS_6_BITTORRENT_02":"Ενεργοποίηση του δικτύου DHT",
   "DLG_SETTINGS_6_BITTORRENT_03":"Πληροφορίες από tracker για scrape",
   "DLG_SETTINGS_6_BITTORRENT_04":"Ενεργοποίηση DHT για νέα torrents",
   "DLG_SETTINGS_6_BITTORRENT_05":"Ενεργοπ. ανταλλαγής αποδεκτών",
   "DLG_SETTINGS_6_BITTORRENT_06":"Αποκάλυψη τοπικών αποδεκτών",
   "DLG_SETTINGS_6_BITTORRENT_07":"Όριο εύρους ζώνης τοπικών αποδεκ.",
   "DLG_SETTINGS_6_BITTORRENT_08":"Αναφερόμενο IP/Hostname σε tracker:",
   "DLG_SETTINGS_6_BITTORRENT_10":"Κρυπτογράφηση προτοκόλλου",
   "DLG_SETTINGS_6_BITTORRENT_11":"Εξερχόμενες:",
   "DLG_SETTINGS_6_BITTORRENT_13":"Αποδοχή απλών εισερχ. συνδέσεων",
   "DLG_SETTINGS_6_BITTORRENT_14":"Ενεργοποίηση διαχείρισης bandwidth [uTP]",
   "DLG_SETTINGS_6_BITTORRENT_15":"Ενεργοποίηση υποστήριξης UDP tracker",
   "DLG_SETTINGS_7_TRANSFERCAP_01":"Ενεργοποίηση ορίου μεταφόρας",
   "DLG_SETTINGS_7_TRANSFERCAP_02":"Ρυθμήσεις όριων",
   "DLG_SETTINGS_7_TRANSFERCAP_03":"Τύπος ορίου:",
   "DLG_SETTINGS_7_TRANSFERCAP_04":"Όριο εύρους:",
   "DLG_SETTINGS_7_TRANSFERCAP_05":"Χρονική περίοδος (μέρες):",
   "DLG_SETTINGS_7_TRANSFERCAP_06":"Ιστορικό χρήσης της επιλεγμένης περιόδου:",
   "DLG_SETTINGS_7_TRANSFERCAP_07":"Uploaded:",
   "DLG_SETTINGS_7_TRANSFERCAP_08":"Downloaded:",
   "DLG_SETTINGS_7_TRANSFERCAP_09":"Uploaded + Downloaded:",
   "DLG_SETTINGS_7_TRANSFERCAP_10":"Περίοδος:",
   "DLG_SETTINGS_7_TRANSFERCAP_11":"Τελευταίες %d μέρες",
   "DLG_SETTINGS_7_TRANSFERCAP_12":"Καθαρισμός ιστορικού",
   "DLG_SETTINGS_8_QUEUEING_01":"Ρυθμίσεις προτεραιότητας",
   "DLG_SETTINGS_8_QUEUEING_02":"Μέγιστος αριθμός ενεργών torrents: (αποστολή ή λήψη):",
   "DLG_SETTINGS_8_QUEUEING_04":"Μέγιστος αριθμός ενεργών λήψεων:",
   "DLG_SETTINGS_8_QUEUEING_06":"Να γίνεται τροφοδοσία όταν [εξ'ορισμού]",
   "DLG_SETTINGS_8_QUEUEING_07":"Ελάχιστο ratio (%):",
   "DLG_SETTINGS_8_QUEUEING_09":"Ελάχιστος χρόνος διαμοιρασμού (λεπτά):",
   "DLG_SETTINGS_8_QUEUEING_11":"Οι εργασίες αποστολής έχουν μεγαλύτερη προτεραιότητα απο τη λήψη",
   "DLG_SETTINGS_8_QUEUEING_12":"Όταν το µTorrent πετυχαίνει το στόχο τροφοδοσίας",
   "DLG_SETTINGS_8_QUEUEING_13":"Περιορισμός της ταχύτητας αποστολής σε (kB/s):",
   "DLG_SETTINGS_9_SCHEDULER_01":"Ενεργοποίηση χρονοπρογραμματιστή",
   "DLG_SETTINGS_9_SCHEDULER_02":"Πεδίο χρονοπρογραμματισμού",
   "DLG_SETTINGS_9_SCHEDULER_04":"Ρυθμίσεις χρονοπρογραμματισμού",
   "DLG_SETTINGS_9_SCHEDULER_05":"Περιορισμένη ταχύτητα αποστ. (kB/s):",
   "DLG_SETTINGS_9_SCHEDULER_07":"Περιορισμένη ταχύτητα λήψης (kB/s):",
   "DLG_SETTINGS_9_SCHEDULER_09":"Απενεργοποήση DHT σε διακοπή",
   "DLG_SETTINGS_9_WEBUI_01":"Ενέργοποίηση του Web UI",
   "DLG_SETTINGS_9_WEBUI_02":"Ταυτοποίηση",
   "DLG_SETTINGS_9_WEBUI_03":"Όνομα χρ:",
   "DLG_SETTINGS_9_WEBUI_05":"Κωδικός Πρ:",
   "DLG_SETTINGS_9_WEBUI_07":"Ενεργοποίηση του λογαριασμού Guest με όνομα:",
   "DLG_SETTINGS_9_WEBUI_09":"Συνδεσιμότητα",
   "DLG_SETTINGS_9_WEBUI_10":"Εναλλακτική θύρα σύνδεσης (της θύρας επικοινωνίας):",
   "DLG_SETTINGS_9_WEBUI_12":"Περιορισμός πρόσβασης στις ακόλουθες IPs (Διαχωρίστε τις εισαγωγές με κόμμα):",
   "DLG_SETTINGS_A_ADVANCED_01":"Προχωριμένες ρυθμίσεις (ΠΡΟΣΟΧΗ: Μην τις αλλάξετε!)",
   "DLG_SETTINGS_A_ADVANCED_02":"Τιμή:",
   "DLG_SETTINGS_A_ADVANCED_03":"Αληθής",
   "DLG_SETTINGS_A_ADVANCED_04":"Ψευδής",
   "DLG_SETTINGS_A_ADVANCED_05":"Ορισμός",
   "DLG_SETTINGS_B_ADV_UI_01":"Αναδυόμενη λίστα ταχυτήτων (Διαχωρισμός τιμών με κόμμα)",
   "DLG_SETTINGS_B_ADV_UI_02":"Παράβλεψη αναδυόμενης λίστας ταχυτήτων",
   "DLG_SETTINGS_B_ADV_UI_03":"Λίστα ταχυτ. αποστ.:",
   "DLG_SETTINGS_B_ADV_UI_05":"Λίστα ταχυτ. λήψης:",
   "DLG_SETTINGS_B_ADV_UI_07":"Μόνιμες ετικέτες (Διαχωρισμός ετικετών με το χαρακτήρα | )",
   "DLG_SETTINGS_B_ADV_UI_08":"Μηχανές αναζήτησης (Μορφή: όνομα|URL)",
   "DLG_SETTINGS_C_ADV_CACHE_01":"Βασικές ρυθμίσεις της Cache",
   "DLG_SETTINGS_C_ADV_CACHE_02":"Η cache δίσκων χρησιμοποιείται για να κρατήσει τα συχνά χρησιμοποιούμενα στοιχεία στη μνήμη για να μειώσει τον αριθμό αναγνώσεων/εγγραφών στο σκληρό δίσκο. Το µTorrent κανονικά διαχειρίζεται την cache αυτόματα, αλλά μπορείτε να αλλάξετε τη συμπεριφορά της με την τροποποίηση αυτών των ρυθμίσεων.",
   "DLG_SETTINGS_C_ADV_CACHE_03":"Χρήση του παρακάτω μεγέθους cache (ΜΒ):",
   "DLG_SETTINGS_C_ADV_CACHE_05":"Χρήση λιγότερης μνήμης όταν η cache δεν χρειάζεται",
   "DLG_SETTINGS_C_ADV_CACHE_06":"Προχωρημένες ρυθμίσεις της Cache",
   "DLG_SETTINGS_C_ADV_CACHE_07":"Ενεργοποίηση της cache για τις εγγραφές στο σκληρό δίσκο",
   "DLG_SETTINGS_C_ADV_CACHE_08":"Εγγραφή απείραχτων κομματιών κάθε 2 λεπτά",
   "DLG_SETTINGS_C_ADV_CACHE_09":"Άμεση εγγραφή των ολοκληρωμένων κομματιών",
   "DLG_SETTINGS_C_ADV_CACHE_10":"Ενεργοποίηση της cache για τις αναγνώσεις",
   "DLG_SETTINGS_C_ADV_CACHE_11":"Κλείσιμο της cache ανάγνωσης όταν η ταχύτητα αποστολής είναι χαμηλή",
   "DLG_SETTINGS_C_ADV_CACHE_12":"Αφαίρεση παλαιών κομματιών απ την cache",
   "DLG_SETTINGS_C_ADV_CACHE_13":"Αυτόματη αύξηση μεγέθους της cache όταν χρειάζεται",
   "DLG_SETTINGS_C_ADV_CACHE_14":"Απενεργοποίηση λειτουργίας cache των Windows για τις εγγραφές στο δίσκο",
   "DLG_SETTINGS_C_ADV_CACHE_15":"Απενεργοποίηση λειτουργίας cache των Windows για τις αναγνώσεις στο δίσκο",
   "DLG_SETTINGS_C_ADV_RUN_01":"Εκτέλεση προγράμματος",
   "DLG_SETTINGS_C_ADV_RUN_02":"Εκτέλεση αυτού του προγράμματος όταν ένα torrent ολοκληρωθεί:",
   "DLG_SETTINGS_C_ADV_RUN_04":"Εκτέλεση αυτού του προγράμματος όταν ένα torrent αλλάζει κατάσταση:",
   "DLG_SETTINGS_C_ADV_RUN_06":"Μπορείτε να κάνετε χρήση των εντολών:\r\n%F - Όνομα κατεβασμένου αρχείου (για μεμομονένα torrents)\r\n%D - Φάκελος αποθήκευσης αρχείων\r\n%N - Τίτλος του torrent\r\n%S - Κατάσταση του torrent\r\n%L - Ετικέτα\r\n%T - Tracker\r\n%M - String μηνύματος κατάστασης (ίδιο με την στήλη κατάστασης)\r\n%I - δεκαδεξαδική κωδικοποίηση info-hash\r\n\r\nΗ κατάσταση είναι συνδυασμός από:\r\nΞεκίνησε = 1, έλεγχος = 2, έναρξη-από-έλεγχο = 4,\r\nελέγχθηκε = 8, σφάλμα = 16, παύθηκε = 32, αυτόματο = 64, φορτώθηκε = 128",
   "DLG_TORRENTPROP_00":"Ιδιότητες Torrent",
   "DLG_TORRENTPROP_1_GEN_01":"Trackers (Διαχωρισμός με μια κενή γραμμή)",
   "DLG_TORRENTPROP_1_GEN_03":"Ρυθμήσεις εύρους ζώνης",
   "DLG_TORRENTPROP_1_GEN_04":"Μέγιστη ταχύτητα αποστολής (kB/s): [0: προεπιλογή]",
   "DLG_TORRENTPROP_1_GEN_06":"Μέγιστη ταχύτητα λήψης (kB/s): [0: προεπιλογή]",
   "DLG_TORRENTPROP_1_GEN_08":"Αριθμός θέσεων αποστολής: [0: προεπιλογή]",
   "DLG_TORRENTPROP_1_GEN_10":"Τροφοδοσία ενώ",
   "DLG_TORRENTPROP_1_GEN_11":"Αγνόηση των προεπιλεγμένων ρυθμίσεων",
   "DLG_TORRENTPROP_1_GEN_12":"Ελάχιστο ratio (%):",
   "DLG_TORRENTPROP_1_GEN_14":"Ελάχιστος χρόνος διαμοιρασμού (λεπτά):",
   "DLG_TORRENTPROP_1_GEN_16":"Άλλες ρυθμίσεις",
   "DLG_TORRENTPROP_1_GEN_17":"Αρχική τροφοδοσία",
   "DLG_TORRENTPROP_1_GEN_18":"Ενεργοποίηση DHT",
   "DLG_TORRENTPROP_1_GEN_19":"Ανταλλαγή αποδεκτών",
   "DLG_ADDEDITRSSFEED_03":"Τροφοδοσία",
   "DLG_ADDEDITRSSFEED_04":"URL Τροφοδοσίας",
   "DLG_ADDEDITRSSFEED_05":"Προσαρμοσμένο Alias:",
   "DLG_ADDEDITRSSFEED_06":"Συνδρομή",
   "DLG_ADDEDITRSSFEED_07":"Να μη κατεβαίνουν αυτόματα όλα τα αντικείμενα",
   "DLG_ADDEDITRSSFEED_08":"Αυτόματο κατέβασμα όλων των αντικειμένων στο FEED.",
   "DLG_ADDEDITRSSFEED_09":"Χρήση έξυπνου φίλτρου επεισοδίων",
   "DLG_RSSDOWNLOADER_02":"Τροφοδοσίες||Αγαπημένα||Ιστορικό||",
   "DLG_RSSDOWNLOADER_03":"All Feeds",
   "DLG_RSSDOWNLOADER_04":"Ρυθμίσεις φίλτρων",
   "DLG_RSSDOWNLOADER_05":"Όνομα:",
   "DLG_RSSDOWNLOADER_06":"Φίλτρο:",
   "DLG_RSSDOWNLOADER_07":"Όχι:",
   "DLG_RSSDOWNLOADER_08":"Αποθήκ:",
   "DLG_RSSDOWNLOADER_09":"Τροφ:",
   "DLG_RSSDOWNLOADER_10":"Ποιότητα:",
   "DLG_RSSDOWNLOADER_11":"Αριθμός Επεισοδίου: [πχ.1x12-14]",
   "DLG_RSSDOWNLOADER_12":"Tαίριασμα φίλτρου στο κανονικό όνομα αντί του αποκωδ.",
   "DLG_RSSDOWNLOADER_13":"Μη αυτόματη έναρξη των λήψεων",
   "DLG_RSSDOWNLOADER_14":"Έξυπνο φίλτρο επ.",
   "DLG_RSSDOWNLOADER_15":"Μέγιστη προτεραιότητα στην λήψη",
   "DLG_RSSDOWNLOADER_16":"Ελάχιστο διάστημα:",
   "DLG_RSSDOWNLOADER_17":"Ετικέτα νέων torrents:",
   "DLG_RSSDOWNLOADER_18":"Προσθήκη τροφοδοσίας RSS...",
   "DLG_RSSDOWNLOADER_19":"Επεξεργασία Τροφοδοσίας...",
   "DLG_RSSDOWNLOADER_20":"Απενεργοποίηση Τροφοδοσίας",
   "DLG_RSSDOWNLOADER_21":"Ενεργοποίηση Τροφοδοσίας",
   "DLG_RSSDOWNLOADER_22":"Ανανέωση Τροφοδοσίας",
   "DLG_RSSDOWNLOADER_23":"Διαγραφή Τροφοδοσίας",
   "DLG_RSSDOWNLOADER_24":"Λήψη",
   "DLG_RSSDOWNLOADER_25":"Άνοιγμα URL στο πρόγραμμα περιήγησης",
   "DLG_RSSDOWNLOADER_26":"Προσθήκη στα αγαπημένα",
   "DLG_RSSDOWNLOADER_27":"Προσθήκη",
   "DLG_RSSDOWNLOADER_28":"Διαγραφή",
   "DLG_RSSDOWNLOADER_29":"ΟΛΑ",
   "DLG_RSSDOWNLOADER_30":"(Όλα)",
   "DLG_RSSDOWNLOADER_31":"(πάντα ταίριασμα)||(ταίριασμα μια μόνο φορά)||12 ώρες||1 μέρα||2 μέρες||3 μέρες||4 μέρες||1 εβδομάδα||2 εβδομάσες||3 εβδομάδες||1 μήνας||",
   "DLG_RSSDOWNLOADER_32":"Προσθήκη RSS Feed",
   "DLG_RSSDOWNLOADER_33":"Επεξεργασία Τροφοδοσίας RSS",
   "DLG_RSSDOWNLOADER_34":"Remove RSS Feed(s)",
   "DLG_RSSDOWNLOADER_35":"Really delete the %d selected RSS Feeds?",
   "DLG_RSSDOWNLOADER_36":"Σίγουρα να διαγραφεί το RSS Feed \"%s\"?",
   "FEED_COL_FULLNAME":"Πλήρες Όνομα",
   "FEED_COL_NAME":"Όνομα",
   "FEED_COL_EPISODE":"Επεισόδιο",
   "FEED_COL_FORMAT":"Μορφή",
   "FEED_COL_CODEC":"Κωδικοποιητής",
   "FEED_COL_DATE":"Date",
   "FEED_COL_FEED":"Feed",
   "FEED_COL_URL":"URL πηγής",
   "PRS_COL_IP":"IP",
   "PRS_COL_PORT":"Θύρα",
   "PRS_COL_CLIENT":"Πρόγραμμα",
   "PRS_COL_FLAGS":"Σημαίες",
   "PRS_COL_PCNT":"%",
   "PRS_COL_RELEVANCE":"Σχετικότητα",
   "PRS_COL_DOWNSPEED":"Ταχ. Λήψης",
   "PRS_COL_UPSPEED":"Ταχ. Αποστολής",
   "PRS_COL_REQS":"Αιτ.",
   "PRS_COL_WAITED":"Αναμονή",
   "PRS_COL_UPLOADED":"Απεσταλμένα",
   "PRS_COL_DOWNLOADED":"Ελήφθησαν",
   "PRS_COL_HASHERR":"Hasherr",
   "PRS_COL_PEERDL":"Ρυθμός Λ.",
   "PRS_COL_MAXUP":"Μεγ.Ταχ.Αποστολής",
   "PRS_COL_MAXDOWN":"Μεγ.Ταχ.Λήψης",
   "PRS_COL_QUEUED":"Αναμονή",
   "PRS_COL_INACTIVE":"Ανενεργό",
   "FI_COL_DONE":"Ολοκληρώθηκε",
   "FI_COL_FIRSTPC":"Πρώτο Κομμάτι",
   "FI_COL_NAME":"Όνομα",
   "FI_COL_NUMPCS":"# Κομμάτια",
   "FI_COL_PCNT":"%",
   "FI_COL_PRIO":"Προτεραιότητα",
   "FI_COL_SIZE":"Μέγεθος",
   "FI_PRI0":"παράβλεψη",
   "FI_PRI1":"χαμηλό",
   "FI_PRI2":"κανονικό",
   "FI_PRI3":"υψηλό",
   "GN_TP_01":"Λήφθηκαν:",
   "GN_TP_02":"Αποστάλθηκαν:",
   "GN_TP_03":"Seeds:",
   "GN_TP_04":"Απομένουν:",
   "GN_TP_05":"Ταχύτητα λήψης:",
   "GN_TP_06":"Ταχ. αποστολής:",
   "GN_TP_07":"Αποδέκτες:",
   "GN_TP_08":"Αναλογία Α/Λ:",
   "GN_TP_09":"Αποθήκευση ως:",
   "GN_TP_10":"Hash:",
   "GN_GENERAL":"Γενικά",
   "GN_TRANSFER":"Μεταφορά",
   "GN_XCONN":"%d of %d συνδέθηκαν (%d in swarm)",
   "MAIN_TITLEBAR_SPEED":"Λ:%s Α:%s - %s",
   "MENU_COPY":"Αντιγραφή",
   "MENU_RESET":"Επαναφορά",
   "MENU_UNLIMITED":"Απεριόριστο",
   "MP_RESOLVE_IPS":"Ανάλυση των IP",
   "MF_GETFILE":"Get File(s)",
   "MF_DONT":"Μην κατεβάσεις",
   "MF_HIGH":"Υψηλή Προτεραιότητα",
   "MF_LOW":"Χαμηλή Προτεραιότητα",
   "MF_NORMAL":"Κανονική Προτεραιότητα",
   "ML_COPY_MAGNETURI":"Αντιγραφή Magnet URI",
   "ML_DELETE_DATA":"Διαγραφή Δεδομένων",
   "ML_DELETE_TORRENT":"Διαγραφή .torrent",
   "ML_DELETE_DATATORRENT":"Διαγραφή .torrent + Δεδομένων",
   "ML_FORCE_RECHECK":"Εξαναγκασμένος Επανέλεγχος",
   "ML_FORCE_START":"Εξαναγκασμένη Εκκίνηση",
   "ML_LABEL":"Ετικέτα",
   "ML_PAUSE":"Παύση",
   "ML_PROPERTIES":"Επιλογές",
   "ML_QUEUEDOWN":"Μετακίνηση κάτω στη σειρά",
   "ML_QUEUEUP":"Μετακίνηση πάνω στη σειρά",
   "ML_REMOVE":"Διαγραφή",
   "ML_REMOVE_AND":"Αφαίρεση και",
   "ML_START":"Εκκίνηση",
   "ML_STOP":"Διακοπή",
   "OV_CAT_ACTIVE":"Ενεργό",
   "OV_CAT_ALL":"Όλα",
   "OV_CAT_COMPL":"Ολοκληρώθηκε",
   "OV_CAT_DL":"Γίνεται λήψη",
   "OV_CAT_INACTIVE":"Ανενεργό",
   "OV_CAT_NOLABEL":"Χωρίς ετικέτα",
   "OV_COL_AVAIL":"||Υγεία||Διαθεσιμότητα",
   "OV_COL_DATE_ADDED":"Προστέθηκε στις",
   "OV_COL_DATE_COMPLETED":"Ολοκληρώθηκε στις",
   "OV_COL_DONE":"Ολοκληρώθηκε",
   "OV_COL_DOWNLOADED":"Ελήφθησαν",
   "OV_COL_DOWNSPD":"Ταχ. Λήψης",
   "OV_COL_ETA":"Περαίωση σε",
   "OV_COL_LABEL":"Ετικέτα",
   "OV_COL_NAME":"Όνομα",
   "OV_COL_ORDER":"#",
   "OV_COL_PEERS":"Αποδέκτες",
   "OV_COL_REMAINING":"Απομένουν",
   "OV_COL_SEEDS":"Τροφοδότες",
   "OV_COL_SEEDS_PEERS":"Τροφοδότες/Αποδέκτες",
   "OV_COL_SHARED":"Αναλογία Α/Λ",
   "OV_COL_SIZE":"Μέγεθος",
   "OV_COL_SOURCE_URL":"URL πηγής",
   "OV_COL_STATUS":"Κατάσταση",
   "OV_COL_UPPED":"Εστάλησαν",
   "OV_COL_UPSPD":"Ταχ. Αποστολής",
   "OV_CONFIRM_DELETEDATA_MULTIPLE":"Είστε βέβαιοι οτι θέλετε να αφαιρέσετε τα %d επιλεγμένα torrents και όλα τα σχετικά με αυτά στοιχεία;",
   "OV_CONFIRM_DELETEDATA_ONE":"Είστε βέβαιοι οτι θέλετε να αφαιρέσετε το επιλεγμένο torrent και όλα τα σχετικά με αυτό στοιχεία;",
   "OV_CONFIRM_DELETE_MULTIPLE":"Είστε βέβαιοι οτι θέλετε να αφαιρέσετε τα %d επιλεγμένα torrents?",
   "OV_CONFIRM_DELETE_ONE":"Είστε βέβαιοι οτι θέλετε να αφαιρέσετε το επιλεγμένο torrent?",
   "OV_CONFIRM_DELETE_RSSFILTER":"Σίγουρα να διαγραφεί το Φίλτρο RSS \"%s\";",
   "OV_FL_CHECKED":"Ελέγχθηκε %:.1d%",
   "OV_FL_DOWNLOADING":"Γίνεται λήψη",
   "OV_FL_ERROR":"Σφάλμα: %s",
   "OV_FL_FINISHED":"Ολοκληρώθηκε",
   "OV_FL_PAUSED":"Παύση",
   "OV_FL_QUEUED":"Αναμονή",
   "OV_FL_QUEUED_SEED":"Αναμονή Τροφοδοσίας",
   "OV_FL_SEEDING":"Τροφοδοσία",
   "OV_FL_STOPPED":"Σταματημένο",
   "OV_NEWLABEL_CAPTION":"Εισαγωγή ετικέτας",
   "OV_NEWLABEL_TEXT":"Εισαγωγή νέας ετικέτας για τα επιλεγμένα torrents:",
   "OV_NEW_LABEL":"Νέα Ετικέτα...",
   "OV_REMOVE_LABEL":"Αφαίρεση Ετικέτας",
   "OV_TABS":"Γενικά||Trackers||Αποδέκτες||Κομμάτια||Αρχεία||Ταχύτητα||Καταγραφέας||",
   "OV_TB_ADDTORR":"Πρόσθήκη Torrent",
   "OV_TB_ADDURL":"Προσθήκη Torrent από URL",
   "OV_TB_PAUSE":"Παύση",
   "OV_TB_PREF":"Ρυθμίσεις",
   "OV_TB_QUEUEDOWN":"Μετακίνηση Κάτω στη σειρά",
   "OV_TB_QUEUEUP":"Μετακίνηση Πάνω στη σειρά",
   "OV_TB_REMOVE":"Διαγραφή",
   "OV_TB_RSSDOWNLDR":"Λήψεις RSS",
   "OV_TB_START":"Εκκίνηση",
   "OV_TB_STOP":"Διακοπή",
   "MM_FILE":"Αρχείο",
   "MM_FILE_ADD_TORRENT":"Προσθήκη Torrent...",
   "MM_FILE_ADD_URL":"Προσθήκη torrent από URL...",
   "MM_OPTIONS":"Επιλογές",
   "MM_OPTIONS_PREFERENCES":"Επιλογές",
   "MM_OPTIONS_SHOW_CATEGORY":"Εμφάνιση Λίστας Κατηγοριών",
   "MM_OPTIONS_SHOW_DETAIL":"Εμφάνιση λεπτομερών πληροφοριών",
   "MM_OPTIONS_SHOW_STATUS":"Εμφάνιση γραμμή κατάστασης",
   "MM_OPTIONS_SHOW_TOOLBAR":"Εμφάνιση γραμμής εργαλείων",
   "MM_OPTIONS_TAB_ICONS":"Εικονίδια στις καρτέλες",
   "MM_HELP":"Βοήθεια",
   "MM_HELP_UT_WEBPAGE":"Ιστοσελίδα µTorrent",
   "MM_HELP_UT_FORUMS":"Κοινότητα του µTorrent",
   "MM_HELP_WEBUI_FEEDBACK":"Send WebUI Feedback",
   "MM_HELP_ABOUT_WEBUI":"About µTorrent WebUI",
   "STM_TORRENTS":"Torrents",
   "STM_TORRENTS_PAUSEALL":"Παύση όλων των torrents.",
   "STM_TORRENTS_RESUMEALL":"Συνέχιση όλων των torrents",
   "SB_DOWNLOAD":"D: %s%z/s",
   "SB_LOCAL":" L: %z/s",
   "SB_OVERHEAD":" O: %z/s",
   "SB_TOTAL":" T: %Z",
   "SB_UPLOAD":"U: %s%z/s",
   "SIZE_B":"B",
   "SIZE_EB":"EB",
   "SIZE_GB":"GB",
   "SIZE_KB":"kB",
   "SIZE_MB":"MB",
   "SIZE_PB":"PB",
   "SIZE_TB":"TB",
   "ST_CAPT_ADVANCED":"Προχωρημένες",
   "ST_CAPT_BANDWIDTH":"Εύρος ζώνης",
   "ST_CAPT_CONNECTION":"Σύνδεση",
   "ST_CAPT_DISK_CACHE":"Cache Δίσκου",
   "ST_CAPT_FOLDER":"Φάκελοι",
   "ST_CAPT_GENERAL":"Γενικά",
   "ST_CAPT_SCHEDULER":"Χρονοδιακόπτης",
   "ST_CAPT_QUEUEING":"Προτεραιότητα",
   "ST_CAPT_UI_EXTRAS":"UI Έξτρα",
   "ST_CAPT_UI_SETTINGS":"Ρυθμίσεις UI",
   "ST_CAPT_BITTORRENT":"BitTorrent",
   "ST_CAPT_WEBUI":"Web UI",
   "ST_CAPT_TRANSFER_CAP":"Όριο μεταφοράς",
   "ST_CAPT_RUN_PROGRAM":"Εκτέλεση προγράμματος",
   "ST_CBO_UI_DBLCLK_TOR":"Εμφάνιση Ιδιοτήτων||Έναρξη/Διακοπή||Άνοιγμα Φακέλου||Εμφάνιση μπάρας Λήψης||",
   "ST_CBO_ENCRYPTIONS":"Απενεργοποιημένο||Ενεργοποιημένο||Εξαναγκασμένο||",
   "ST_CBO_PROXY":"(κανένα)||Socks4||Socks5||HTTPS||HTTP||",
   "ST_CBO_TCAP_MODES":"Uploads||Downloads||Uploads + Downloads||",
   "ST_CBO_TCAP_UNITS":"MB||GB||",
   "ST_CBO_TCAP_PERIODS":"1||2||5||7||10||14||15||20||21||28||30||31||",
   "ST_COL_NAME":"Όνομα",
   "ST_COL_VALUE":"Τιμή",
   "ST_SCH_DAYCODES":"Δευ||Τρι||Τετ||Πεμ||Παρ||Σαβ||Κυρ||",
   "ST_SCH_DAYNAMES":"Δευτέρα||Τρίτη||Τετάρτη||Πέμπτη||Παρασκευή||Σάββατο||Κυριακή||",
   "ST_SCH_LGND_FULL":"Πλήρες",
   "ST_SCH_LGND_FULLEX":"Μέγιστη ταχύτητα - Χρήση κανονικού γενικού όρια bandwidth",
   "ST_SCH_LGND_LIMITED":"Ορισμένο",
   "ST_SCH_LGND_LIMITEDEX":"Περιορισμένη - Χρήση ρυθμίσεων προγραμματιστή Όρια bandwidth",
   "ST_SCH_LGND_SEEDING":"Μόνο τροφοδοσία",
   "ST_SCH_LGND_SEEDINGEX":"Μόνο διαμοιρασμός - Μόνο ανέβασμα δεδομένων (τα ατελή αρχεία συμπεριλαμβάνονται)",
   "ST_SCH_LGND_OFF":"Κλειστό",
   "ST_SCH_LGND_OFFEX":"Διακοπή - Σταματάει όλα τα torrents που δεν είναι εξαναγκασμένα",
   "ST_SEEDTIMES_HOURS":"<= %d ώρες",
   "ST_SEEDTIMES_IGNORE":"(αγνόησε)",
   "ST_SEEDTIMES_MINUTES":"<= %d λεπτά",
   "TIME_DAYS_HOURS":"%dd %dh",
   "TIME_HOURS_MINS":"%dh %dm",
   "TIME_MINS_SECS":"%dm %ds",
   "TIME_SECS":"%ds",
   "TIME_WEEKS_DAYS":"%dw %dd",
   "TIME_YEARS_WEEKS":"%dy %dw",
   "ML_MORE_ACTIONS":null,
   "Torrents":null,
   "Feeds":null,
   "App":null,
   "country":null,
   "ETA":null,
   "of":null,
   "/s":null,
   "Paste a torrent or feed URL":null,
   "Home":null,
   "Logout":null,
   "Seeding":null,
   "All Feeds":null,
   "bitrate":null,
   "resolution":null,
   "length":null,
   "streamable":null,
   "type":null,
   "remote":null,
   "about":null,
   "sessions":null,
   "share":null,
   "Share this torrent":null,
   "Share link":null,
   "add":null,
   "logout":null,
   "log in":null,
   "anywhere access":null,
   "stay signed in":null,
   "download":null,
   "Your client is currently not available. Verify that it is connected to the internet.":null,
   "Unable to communicate with your &micro;Torrent client. This message will disappear automatically when a connection is re-established.":null,
   "Open file":null,
   "Download to your computer":null,
   "Open with VLC Media Player":null,
   "Actions":null,
   "season":null,
   "DLG_ABOUT_VERSION_LEGEND":null,
   "DLG_ABOUT_VERSION_VERSION":null,
   "DLG_ABOUT_VERSION_REVISION":null,
   "DLG_ABOUT_VERSION_BUILD_DATE":null,
   "DLG_ABOUT_VERSION_PEER_ID":null,
   "DLG_ABOUT_VERSION_USER_AGENT":null,
   "DLG_ABOUT_UPNP_EXTERNAL_ADDRESS":null,
   "DLG_ABOUT_UI_REVISION":null,
   "DLG_SETTINGS_SAVE":null,
   "DLG_SETTINGS_MENU_TITLE":null,
   "DLG_SETTINGS_D_REMOTE_01":"Απομακρυσμένο BitTorrent",
   "DLG_SETTINGS_D_REMOTE_02":"Το µTorrent Remote παρέχει έναν εύκολο και πολύ ασφαλή τρόπο για την πρόσβαση στο πρόγραμμα μέσω προγράμματος περιήγησης.",
   "DLG_SETTINGS_D_REMOTE_03":"Απλώς ενεργοποιείστε τη σύνδεση παρακάτω, επιλέξτε ένα όνομα υπολογιστή, ένα κωδικό και θυμηθείτε να αφήσετε τον υπολογιστή ενεργό.",
   "DLG_SETTINGS_D_REMOTE_04":"Μάθετε περισσότερα",
   "DLG_SETTINGS_D_REMOTE_05":"Ενεργοποίηση της απομακρυσμένης πρόσβασης",
   "DLG_SETTINGS_D_REMOTE_06":"Ταυτοποίηση",
   "DLG_SETTINGS_D_REMOTE_07":"Όνομα υπολογιστή:",
   "DLG_SETTINGS_D_REMOTE_08":"Κωδικός:",
   "DLG_SETTINGS_D_REMOTE_09":"Αποστολή",
   "ST_CAPT_REMOTE":"Απομακρυσμένο BitTorrent"
}