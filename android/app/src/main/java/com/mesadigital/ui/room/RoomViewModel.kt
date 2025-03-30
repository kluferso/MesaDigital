package com.mesadigital.ui.room

import android.util.Log
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.mesadigital.model.ChatMessage
import com.mesadigital.model.Participant
import com.mesadigital.network.SocketManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

enum class RoomState {
    CONNECTING, CONNECTED, ERROR
}

class RoomViewModel(
    private val roomId: String,
    private val userName: String
) : ViewModel() {
    private val TAG = "RoomViewModel"
    
    // Estado da sala
    private val _roomState = MutableStateFlow(RoomState.CONNECTING)
    val roomState: StateFlow<RoomState> = _roomState.asStateFlow()
    
    // Lista de participantes
    private val _participants = MutableStateFlow<List<Participant>>(emptyList())
    val participants: StateFlow<List<Participant>> = _participants.asStateFlow()
    
    // Mensagens de chat
    private val _chatMessages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val chatMessages: StateFlow<List<ChatMessage>> = _chatMessages.asStateFlow()
    
    // Estado da conexão
    private val _connectionState = MutableStateFlow(SocketManager.ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<SocketManager.ConnectionState> = _connectionState.asStateFlow()
    
    // Estados de mídia
    private val _audioEnabled = MutableStateFlow(true)
    val audioEnabled: StateFlow<Boolean> = _audioEnabled.asStateFlow()
    
    private val _videoEnabled = MutableStateFlow(true)
    val videoEnabled: StateFlow<Boolean> = _videoEnabled.asStateFlow()
    
    // Contagem de mensagens não lidas
    val unreadMessageCount = mutableStateOf(0)
    
    // Mensagem de erro
    val errorMessage = mutableStateOf("")
    
    // ID do usuário local
    private var localUserId: String? = null
    
    // Mapa para armazenar os volumes dos participantes
    private val participantVolumes = mutableMapOf<String, Float>()
    
    init {
        setupSocketListeners()
        connectToRoom()
    }
    
    private fun setupSocketListeners() {
        // Monitorar mudanças no estado da conexão
        viewModelScope.launch {
            SocketManager.connectionState.collect { state ->
                _connectionState.value = state
                
                if (state == SocketManager.ConnectionState.CONNECTED && _roomState.value == RoomState.CONNECTING) {
                    // Quando conectado, entrar na sala
                    SocketManager.joinRoom(roomId, userName)
                } else if (state == SocketManager.ConnectionState.ERROR) {
                    _roomState.value = RoomState.ERROR
                    errorMessage.value = "Erro ao conectar ao servidor"
                }
            }
        }
        
        // Configurar listeners para eventos do socket
        SocketManager.on("join_room_success") { args ->
            val data = args[0] as JSONObject
            handleJoinRoomSuccess(data)
        }
        
        SocketManager.on("join_room_error") { args ->
            val data = args[0] as JSONObject
            handleJoinRoomError(data)
        }
        
        SocketManager.on("user_joined") { args ->
            val data = args[0] as JSONObject
            handleUserJoined(data)
        }
        
        SocketManager.on("user_left") { args ->
            val data = args[0] as JSONObject
            handleUserLeft(data)
        }
        
        SocketManager.on("user_updated") { args ->
            val data = args[0] as JSONObject
            handleUserUpdated(data)
        }
        
        SocketManager.on("chat_message") { args ->
            val data = args[0] as JSONObject
            handleChatMessage(data)
        }
    }
    
    private fun connectToRoom() {
        // Iniciar conexão
        SocketManager.connect()
    }
    
    fun leaveRoom() {
        SocketManager.leaveRoom(roomId)
        SocketManager.disconnect()
    }
    
    fun toggleAudio() {
        val newState = !_audioEnabled.value
        _audioEnabled.value = newState
        SocketManager.toggleAudio(newState)
    }
    
    fun toggleVideo() {
        val newState = !_videoEnabled.value
        _videoEnabled.value = newState
        SocketManager.toggleVideo(newState)
    }
    
    fun sendChatMessage(text: String) {
        if (text.isBlank()) return
        SocketManager.sendChatMessage(roomId, text)
    }
    
    fun getLocalUserId(): String? {
        return localUserId
    }
    
    fun updateParticipantVolume(participantId: String, volume: Float) {
        participantVolumes[participantId] = volume
        viewModelScope.launch {
            SocketManager.updateParticipantVolume(participantId, volume)
        }
    }
    
    private fun handleJoinRoomSuccess(data: JSONObject) {
        try {
            // Atualizar estado da sala
            _roomState.value = RoomState.CONNECTED
            
            // Guardar ID do usuário local
            localUserId = SocketManager.socket?.id()
            
            // Processar informações da sala
            val room = data.getJSONObject("room")
            val users = data.getJSONArray("users")
            
            // Atualizar participantes
            updateParticipantList(users)
            
            // Resetar contagem de mensagens não lidas
            unreadMessageCount.value = 0
            
            Log.d(TAG, "Entrou na sala com sucesso: $roomId")
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao processar join_room_success: ${e.message}")
            _roomState.value = RoomState.ERROR
            errorMessage.value = "Erro ao processar dados da sala"
        }
    }
    
    private fun handleJoinRoomError(data: JSONObject) {
        val message = data.optString("message", "Erro desconhecido")
        Log.e(TAG, "Erro ao entrar na sala: $message")
        _roomState.value = RoomState.ERROR
        errorMessage.value = message
    }
    
    private fun handleUserJoined(data: JSONObject) {
        try {
            val user = data.getJSONObject("user")
            val currentList = _participants.value.toMutableList()
            
            // Converter JSONObject para Participant
            val newParticipant = Participant(
                id = user.getString("id"),
                name = user.getString("name"),
                instrument = user.optString("instrument", "Vocal"),
                isLocal = user.getString("id") == localUserId,
                audioEnabled = user.optBoolean("audioEnabled", true),
                videoEnabled = user.optBoolean("videoEnabled", true)
            )
            
            // Adicionar apenas se não existir
            if (currentList.none { it.id == newParticipant.id }) {
                currentList.add(newParticipant)
                _participants.value = currentList
            }
            
            Log.d(TAG, "Usuário entrou: ${newParticipant.name}")
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao processar user_joined: ${e.message}")
        }
    }
    
    private fun handleUserLeft(data: JSONObject) {
        try {
            val userId = data.getString("userId")
            val currentList = _participants.value.toMutableList()
            
            // Remover participante
            currentList.removeAll { it.id == userId }
            _participants.value = currentList
            
            Log.d(TAG, "Usuário saiu: $userId")
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao processar user_left: ${e.message}")
        }
    }
    
    private fun handleUserUpdated(data: JSONObject) {
        try {
            val user = data.getJSONObject("user")
            val userId = user.getString("id")
            val currentList = _participants.value.toMutableList()
            
            // Atualizar participante existente
            val index = currentList.indexOfFirst { it.id == userId }
            if (index >= 0) {
                val updated = currentList[index].copy(
                    audioEnabled = user.optBoolean("audioEnabled", currentList[index].audioEnabled),
                    videoEnabled = user.optBoolean("videoEnabled", currentList[index].videoEnabled)
                )
                currentList[index] = updated
                _participants.value = currentList
            }
            
            Log.d(TAG, "Usuário atualizado: $userId")
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao processar user_updated: ${e.message}")
        }
    }
    
    private fun handleChatMessage(data: JSONObject) {
        try {
            val senderId = data.getString("sender")
            val text = data.getString("text")
            val timestamp = data.optLong("timestamp", System.currentTimeMillis())
            val id = data.optString("id", System.currentTimeMillis().toString())
            
            // Encontrar o nome do remetente
            val sender = _participants.value.find { it.id == senderId }
            val senderName = sender?.name ?: "Desconhecido"
            
            // Criar mensagem
            val message = ChatMessage(
                id = id,
                text = text,
                sender = senderId,
                senderName = senderName,
                timestamp = timestamp,
                isLocalUser = senderId == localUserId
            )
            
            // Adicionar à lista
            val currentMessages = _chatMessages.value.toMutableList()
            currentMessages.add(message)
            _chatMessages.value = currentMessages
            
            // Incrementar contador de mensagens não lidas
            unreadMessageCount.value = unreadMessageCount.value + 1
            
            Log.d(TAG, "Mensagem recebida de $senderName: $text")
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao processar chat_message: ${e.message}")
        }
    }
    
    private fun updateParticipantList(usersArray: JSONArray) {
        try {
            val participants = mutableListOf<Participant>()
            
            for (i in 0 until usersArray.length()) {
                val user = usersArray.getJSONObject(i)
                participants.add(
                    Participant(
                        id = user.getString("id"),
                        name = user.getString("name"),
                        instrument = user.optString("instrument", "Vocal"),
                        isLocal = user.getString("id") == localUserId,
                        audioEnabled = user.optBoolean("audioEnabled", true),
                        videoEnabled = user.optBoolean("videoEnabled", true)
                    )
                )
            }
            
            _participants.value = participants
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao processar lista de participantes: ${e.message}")
        }
    }
    
    override fun onCleared() {
        super.onCleared()
        // Limpar listeners para evitar vazamento de memória
        SocketManager.off("join_room_success")
        SocketManager.off("join_room_error")
        SocketManager.off("user_joined")
        SocketManager.off("user_left")
        SocketManager.off("user_updated")
        SocketManager.off("chat_message")
        
        // Desconectar da sala
        leaveRoom()
    }
}

class RoomViewModelFactory(
    private val roomId: String,
    private val userName: String
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(RoomViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return RoomViewModel(roomId, userName) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
