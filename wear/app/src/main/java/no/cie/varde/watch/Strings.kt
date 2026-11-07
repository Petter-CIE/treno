package no.cie.varde.watch

/** The few labels the watch shows itself; workout and exercise names come from the phone already translated. */
class L(lang: String) {
    private val m: Map<String, String> = T[lang] ?: T.getValue("en")
    private val en = T.getValue("en")
    operator fun get(k: String): String = m[k] ?: en[k] ?: k

    companion object {
        private val keys = listOf("empty", "reps", "weight", "done", "skip", "pause", "resume", "end", "endQ", "save", "discard", "cont", "hard", "saved", "waiting", "workouts", "go", "nextUp")
        private fun d(vararg v: String) = keys.zip(v).toMap()
        val T: Map<String, Map<String, String>> = mapOf(
            "en" to d("Open Varde on your phone to send workouts here", "Reps", "Weight", "Done", "Skip", "Pause", "Resume", "End", "End workout?", "Save", "Discard", "Continue", "How hard was it?", "Saved – syncing to phone", "%d waiting for phone", "Workouts", "Go!", "Next"),
            "cs" to d("Otevři Varde v telefonu a tréninky se sem pošlou", "Opakování", "Váha", "Hotovo", "Přeskočit", "Pauza", "Pokračovat", "Konec", "Ukončit trénink?", "Uložit", "Zahodit", "Pokračovat", "Jak to bylo těžké?", "Uloženo – posílám do telefonu", "%d čeká na telefon", "Tréninky", "Start!", "Další"),
            "nb" to d("Åpne Varde på telefonen for å sende økter hit", "Reps", "Vekt", "Ferdig", "Hopp over", "Pause", "Fortsett", "Avslutt", "Avslutte økten?", "Lagre", "Forkast", "Fortsett", "Hvor tungt var det?", "Lagret – synkroniseres til telefonen", "%d venter på telefonen", "Økter", "Kjør!", "Neste"),
            "de" to d("Öffne Varde auf dem Handy, um Workouts hierher zu senden", "Wdh.", "Gewicht", "Fertig", "Überspringen", "Pause", "Weiter", "Beenden", "Workout beenden?", "Speichern", "Verwerfen", "Weiter", "Wie schwer war es?", "Gespeichert – wird synchronisiert", "%d warten aufs Handy", "Workouts", "Los!", "Nächste"),
            "es" to d("Abre Varde en el móvil para enviar entrenamientos aquí", "Reps", "Peso", "Hecho", "Saltar", "Pausa", "Seguir", "Terminar", "¿Terminar entrenamiento?", "Guardar", "Descartar", "Seguir", "¿Qué tan duro fue?", "Guardado – sincronizando", "%d esperan al móvil", "Entrenos", "¡Ya!", "Siguiente"),
            "fr" to d("Ouvre Varde sur ton téléphone pour envoyer des séances ici", "Reps", "Poids", "Fait", "Passer", "Pause", "Reprendre", "Fin", "Terminer la séance ?", "Enregistrer", "Annuler", "Continuer", "C'était dur ?", "Enregistré – synchro en cours", "%d en attente du téléphone", "Séances", "Go !", "Suivant"),
            "pt" to d("Abre o Varde no telemóvel para enviar treinos para aqui", "Reps", "Peso", "Feito", "Saltar", "Pausa", "Retomar", "Terminar", "Terminar treino?", "Guardar", "Descartar", "Continuar", "Quão difícil foi?", "Guardado – a sincronizar", "%d à espera do telemóvel", "Treinos", "Vai!", "Seguinte"),
            "it" to d("Apri Varde sul telefono per inviare gli allenamenti qui", "Ripetizioni", "Peso", "Fatto", "Salta", "Pausa", "Riprendi", "Fine", "Terminare l'allenamento?", "Salva", "Scarta", "Continua", "Quanto è stato duro?", "Salvato – sincronizzazione", "%d in attesa del telefono", "Allenamenti", "Via!", "Prossimo"),
            "pl" to d("Otwórz Varde w telefonie, aby wysłać tu treningi", "Powt.", "Ciężar", "Gotowe", "Pomiń", "Pauza", "Wznów", "Koniec", "Zakończyć trening?", "Zapisz", "Odrzuć", "Kontynuuj", "Jak ciężko było?", "Zapisano – synchronizacja", "%d czeka na telefon", "Treningi", "Start!", "Dalej"),
            "sv" to d("Öppna Varde i telefonen för att skicka pass hit", "Reps", "Vikt", "Klar", "Hoppa över", "Paus", "Fortsätt", "Avsluta", "Avsluta passet?", "Spara", "Släng", "Fortsätt", "Hur tungt var det?", "Sparat – synkas till telefonen", "%d väntar på telefonen", "Pass", "Kör!", "Nästa"),
            "da" to d("Åbn Varde på telefonen for at sende træninger hertil", "Reps", "Vægt", "Færdig", "Spring over", "Pause", "Fortsæt", "Afslut", "Afslut træningen?", "Gem", "Kassér", "Fortsæt", "Hvor hårdt var det?", "Gemt – synkroniseres", "%d venter på telefonen", "Træninger", "Kør!", "Næste"),
            "fi" to d("Avaa Varde puhelimessa lähettääksesi treenit tänne", "Toistot", "Paino", "Valmis", "Ohita", "Tauko", "Jatka", "Lopeta", "Lopetetaanko treeni?", "Tallenna", "Hylkää", "Jatka", "Kuinka raskasta oli?", "Tallennettu – synkronoidaan", "%d odottaa puhelinta", "Treenit", "Nyt!", "Seuraava"),
        )
    }
}
