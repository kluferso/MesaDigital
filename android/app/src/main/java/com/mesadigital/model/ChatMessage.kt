package com.mesadigital.model

/**
 * Modelo que representa uma mensagem de chat
 */
data class ChatMessage(
    val id: String,
    val text: String,
    val sender: String,
    val senderName: String = "Desconhecido",
    val timestamp: Long = System.currentTimeMillis(),
    val isLocalUser: Boolean = false
)
