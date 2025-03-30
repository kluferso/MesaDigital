package com.mesadigital.network

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.emitter.Emitter
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.json.JSONObject
import java.net.URISyntaxException

/**
 * Gerenciador de Socket.IO para comunicação em tempo real com o servidor
 */
object SocketManager {
    private const val TAG = "SocketManager"
    private var socket: Socket? = null
    private var serverUrl: String = ""
    
    // Estado da conexão observável
    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState
    
    // Estados possíveis da conexão
    enum class ConnectionState {
        CONNECTED, CONNECTING, DISCONNECTED, ERROR
    }
    
    /**
     * Inicializa o socket com a URL do servidor
     */
    fun init(url: String) {
        serverUrl = url
    }
    
    /**
     * Conecta ao servidor de Socket.IO
     */
    fun connect() {
        if (socket != null && socket?.connected() == true) {
            Log.d(TAG, "Socket já está conectado")
            return
        }
        
        _connectionState.value = ConnectionState.CONNECTING
        
        try {
            // Configurar opções do Socket.IO
            val options = IO.Options().apply {
                forceNew = true
                reconnection = true
                reconnectionAttempts = 5
                reconnectionDelay = 5000
            }
            
            socket = IO.socket(serverUrl, options)
            
            // Configurar listeners básicos
            socket?.on(Socket.EVENT_CONNECT) {
                Log.d(TAG, "Socket conectado")
                _connectionState.value = ConnectionState.CONNECTED
            }
            
            socket?.on(Socket.EVENT_DISCONNECT) {
                Log.d(TAG, "Socket desconectado")
                _connectionState.value = ConnectionState.DISCONNECTED
            }
            
            socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                val error = if (args.isNotEmpty()) args[0].toString() else "Erro desconhecido"
                Log.e(TAG, "Erro de conexão: $error")
                _connectionState.value = ConnectionState.ERROR
            }
            
            // Conectar ao servidor
            socket?.connect()
        } catch (e: URISyntaxException) {
            Log.e(TAG, "Erro ao inicializar socket: ${e.message}")
            _connectionState.value = ConnectionState.ERROR
        }
    }
    
    /**
     * Desconecta do servidor
     */
    fun disconnect() {
        socket?.disconnect()
        socket = null
        _connectionState.value = ConnectionState.DISCONNECTED
    }
    
    /**
     * Envia um evento para o servidor
     */
    fun emit(event: String, data: JSONObject) {
        socket?.emit(event, data)
    }
    
    /**
     * Adiciona um listener para um evento específico
     */
    fun on(event: String, listener: Emitter.Listener): Socket? {
        return socket?.on(event, listener)
    }
    
    /**
     * Remove um listener para um evento específico
     */
    fun off(event: String): Socket? {
        return socket?.off(event)
    }
    
    /**
     * Junta-se a uma sala específica
     */
    fun joinRoom(roomId: String, userName: String) {
        val data = JSONObject().apply {
            put("roomId", roomId)
            put("name", userName)
            put("instrument", "Vocal") // Fixo como "Vocal" na versão mobile
            put("hasMedia", true)
        }
        emit("join_room", data)
    }
    
    /**
     * Sai de uma sala
     */
    fun leaveRoom(roomId: String) {
        val data = JSONObject().apply {
            put("roomId", roomId)
        }
        emit("leave_room", data)
    }
    
    /**
     * Envia uma mensagem de chat
     */
    fun sendChatMessage(roomId: String, text: String) {
        val message = JSONObject().apply {
            put("id", System.currentTimeMillis().toString())
            put("text", text)
            put("timestamp", System.currentTimeMillis())
        }
        
        val data = JSONObject().apply {
            put("roomId", roomId)
            put("message", message)
        }
        
        emit("chat_message", data)
    }
    
    /**
     * Atualiza o estado do áudio
     */
    fun toggleAudio(enabled: Boolean) {
        val data = JSONObject().apply {
            put("type", "audio")
            put("enabled", enabled)
        }
        emit("track_toggle", data)
    }
    
    /**
     * Atualiza o estado do vídeo
     */
    fun toggleVideo(enabled: Boolean) {
        val data = JSONObject().apply {
            put("type", "video")
            put("enabled", enabled)
        }
        emit("track_toggle", data)
    }
}
