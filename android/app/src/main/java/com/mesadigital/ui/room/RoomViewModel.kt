package com.mesadigital.ui.room

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import com.mesadigital.model.ChatMessage
import com.mesadigital.model.Participant
import com.mesadigital.network.SocketManager
import com.mesadigital.audio.WebRTCManager
import org.json.JSONObject
import java.util.*

/**
 * ViewModel para a tela de sala com integração WebRTC
 */
class RoomViewModel(
    application: Application,
    private val roomId: String,
    private val userName: String,
    private val instrument: String
) : AndroidViewModel(application) {
    
    // WebRTC Manager
    private val webRTCManager = WebRTCManager(application.applicationContext)
    
    // Estado da sala
    private val _roomState = MutableStateFlow(RoomState.CONNECTING)
    val roomState: StateFlow<RoomState> = _roomState
    
    // Lista de participantes
    private val _participants = MutableStateFlow<List<Participant>>(emptyList())
    val participants: StateFlow<List<Participant>> = _participants
    
    // Mensagens de chat
    private val _chatMessages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val chatMessages: StateFlow<List<ChatMessage>> = _chatMessages
    
    // Estado da conexão
    val connectionState = SocketManager.connectionState
    
    // Estado do áudio
    val audioEnabled = webRTCManager.audioEnabled
    
    // Estado do master volume
    val masterVolume = webRTCManager.masterVolume
    
    // Usuários se conectando
    val connectingUsers = webRTCManager.connectingUsers
    
    // Usuários
    val users = webRTCManager.users
    
    // Usuário local
    val localUser = webRTCManager.localUser
    
    // Qualidade de conexão
    val connectionQualities = SocketManager.connectionQuality
    
    // Volumes por usuário
    private val _userVolumes = MutableStateFlow<Map<String, Float>>(emptyMap())
    val userVolumes: StateFlow<Map<String, Float>> = _userVolumes
    
    enum class RoomState {
        CONNECTING, CONNECTED, ERROR
    }
    
    init {
        // Inicializar WebRTC
        webRTCManager.initialize()
        
        // Configurar listeners do socket
        setupSocketListeners()
        
        // Entrar na sala
        joinRoom()
    }
    
    /**
     * Configura listeners do socket
     */
    private fun setupSocketListeners() {
        SocketManager.on("chat_message") { args ->
            if (args.isNotEmpty()) {
                try {
                    val data = args[0] as JSONObject
                    val message = ChatMessage(
                        id = data.optString("id", UUID.randomUUID().toString()),
                        userId = data.optString("userId", ""),
                        userName = data.optString("userName", "Sistema"),
                        text = data.getString("text"),
                        timestamp = data.optLong("timestamp", System.currentTimeMillis()),
                        isSystem = data.optBoolean("isSystem", false)
                    )
                    
                    addChatMessage(message)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
        
        // Converter usuários do WebRTC para participantes
        viewModelScope.launch {
            webRTCManager.users.collect { webrtcUsers ->
                val updatedParticipants = webrtcUsers.map { user ->
                    Participant(
                        id = user.id,
                        name = user.name,
                        instrument = user.instrument,
                        isLocal = user.id == webRTCManager.localUser.value?.id,
                        hasAudio = true,
                        hasVideo = false,
                        isAdmin = false
                    )
                }
                _participants.value = updatedParticipants
            }
        }
    }
    
    /**
     * Adiciona mensagem ao chat
     */
    private fun addChatMessage(message: ChatMessage) {
        val currentMessages = _chatMessages.value.toMutableList()
        currentMessages.add(message)
        _chatMessages.value = currentMessages
    }
    
    /**
     * Entrar na sala
     */
    fun joinRoom() {
        webRTCManager.joinRoom(roomId, userName, instrument)
        
        // Adicionar mensagem de boas-vindas
        addChatMessage(
            ChatMessage(
                id = UUID.randomUUID().toString(),
                userId = "system",
                userName = "Sistema",
                text = "Bem-vindo à sala $roomId!",
                timestamp = System.currentTimeMillis(),
                isSystem = true
            )
        )
        
        _roomState.value = RoomState.CONNECTED
    }
    
    /**
     * Sair da sala
     */
    fun leaveRoom() {
        webRTCManager.leaveRoom(roomId)
    }
    
    /**
     * Enviar mensagem de chat
     */
    fun sendChatMessage(text: String) {
        if (text.isBlank()) return
        
        SocketManager.sendChatMessage(text)
        
        // Adicionar mensagem local (feedback imediato)
        val localUser = webRTCManager.localUser.value
        if (localUser != null) {
            addChatMessage(
                ChatMessage(
                    id = UUID.randomUUID().toString(),
                    userId = localUser.id,
                    userName = localUser.name,
                    text = text,
                    timestamp = System.currentTimeMillis(),
                    isSystem = false
                )
            )
        }
    }
    
    /**
     * Ativar/desativar áudio
     */
    fun toggleAudio() {
        webRTCManager.toggleAudio(!audioEnabled.value)
    }
    
    /**
     * Definir volume para um usuário
     */
    fun setUserVolume(userId: String, volume: Float) {
        webRTCManager.setUserVolume(userId, volume)
        
        // Atualizar estado local
        val currentVolumes = _userVolumes.value.toMutableMap()
        currentVolumes[userId] = volume
        _userVolumes.value = currentVolumes
    }
    
    /**
     * Definir volume master
     */
    fun setMasterVolume(volume: Float) {
        webRTCManager.setMasterVolume(volume)
    }
    
    override fun onCleared() {
        super.onCleared()
        leaveRoom()
        webRTCManager.release()
    }
}

/**
 * Factory para criar o RoomViewModel com parâmetros
 */
class RoomViewModelFactory(
    private val roomId: String,
    private val userName: String,
    private val instrument: String = "Vocal"
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(RoomViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return RoomViewModel(
                Application(),
                roomId,
                userName,
                instrument
            ) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
