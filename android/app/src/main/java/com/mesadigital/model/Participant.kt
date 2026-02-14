package com.mesadigital.model

/**
 * Modelo que representa um participante na sala
 */
data class Participant(
    val id: String,
    val name: String,
    val instrument: String = "Vocal",
    val isLocal: Boolean = false,
    val audioEnabled: Boolean = true,
    val videoEnabled: Boolean = true
)
