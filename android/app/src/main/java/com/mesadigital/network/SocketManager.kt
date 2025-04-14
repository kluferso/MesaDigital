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
 * Atualizado para suportar WebRTC e sincronização de áudio
 */
object SocketManager {
    private const val TAG = "SocketManager"
    private var socket: Socket? = null
    
    // URL padrão do servidor no PythonAnywhere
    private var serverUrl: String = "https://kluferso.pythonanywhere.com"
    
    // Estado da conexão observável
    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState
    
    // Estado da qualidade da conexão
    private val _connectionQuality = MutableStateFlow<Map<String, ConnectionQuality>>(emptyMap())
    val connectionQuality: StateFlow<Map<String, ConnectionQuality>> = _connectionQuality
    
    // Estados possíveis da conexão
    enum class ConnectionState {
        CONNECTED, CONNECTING, DISCONNECTED, ERROR
    }
    
    // Qualidade da conexão
    data class ConnectionQuality(
        val userId: String,
        val category: String, // "excellent", "good", "fair", "poor", "critical"
        val score: Float,     // 0.0 - 1.0
        val latency: Int,     // ms
        val jitter: Float     // ms
    )
    
    /**
     * Inicializa o socket com a URL do servidor
     * Se não for fornecida, usa a URL padrão do PythonAnywhere
     */
    fun init(url: String = serverUrl) {
        serverUrl = url
        Log.d(TAG, "Servidor inicializado com URL: $serverUrl")
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
                reconnectionAttempts = 10    // Aumentado para melhor resiliência
                reconnectionDelay = 3000     // Reduzido para reconexão mais rápida
                timeout = 15000              // Aumentado para dar mais tempo para WebRTC
                
                // Headers extras para identificar cliente Android
                extraHeaders = mapOf(
                    "User-Agent" to listOf("MesaDigitalAndroid/1.0"),
                    "Platform" to listOf("Android")
                )
            }
            
            Log.d(TAG, "Tentando conectar a: $serverUrl")
            socket = IO.socket(serverUrl, options)
            
            // Configurar listeners básicos
            socket?.on(Socket.EVENT_CONNECT) {
                Log.d(TAG, "Socket conectado com sucesso")
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
            
            // Listener para qualidade de conexão
            socket?.on("connection_quality") { args ->
                if (args.isNotEmpty()) {
                    try {
                        val data = args[0] as JSONObject
                        updateConnectionQuality(data)
                    } catch (e: Exception) {
                        Log.e(TAG, "Erro ao processar qualidade de conexão: ${e.message}")
                    }
                }
            }
            
            // Conectar ao servidor
            socket?.connect()
        } catch (e: URISyntaxException) {
            Log.e(TAG, "Erro ao inicializar socket: ${e.message}")
            _connectionState.value = ConnectionState.ERROR
        } catch (e: Exception) {
            Log.e(TAG, "Erro geral ao conectar: ${e.message}")
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
        if (socket?.connected() == true) {
            socket?.emit(event, data)
            Log.d(TAG, "Evento emitido: $event com dados: $data")
        } else {
            Log.w(TAG, "Tentativa de emitir evento $event com socket desconectado. Tentando reconectar...")
            connect()
            // Tentamos emitir novamente após uma breve pausa para dar tempo de reconectar
            android.os.Handler().postDelayed({
                if (socket?.connected() == true) {
                    socket?.emit(event, data)
                    Log.d(TAG, "Evento emitido após reconexão: $event")
                } else {
                    Log.e(TAG, "Falha ao emitir evento $event: socket ainda desconectado")
                }
            }, 1000)
        }
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
    fun joinRoom(roomId: String, userName: String, instrument: String) {
        val data = JSONObject().apply {
            put("roomId", roomId)
            put("name", userName)
            put("instrument", instrument)
            put("hasMedia", true)
            put("webrtcEnabled", true)
            put("platform", "android") // Identificar plataforma
        }
        emit("join_room", data)
        Log.i(TAG, "Entrando na sala $roomId como $userName com instrumento $instrument")
    }
    
    /**
     * Sai de uma sala
     */
    fun leaveRoom(roomId: String) {
        val data = JSONObject().apply {
            put("roomId", roomId)
        }
        emit("leave_room", data)
        Log.i(TAG, "Saindo da sala $roomId")
    }
    
    /**
     * Envia uma mensagem de chat
     */
    fun sendChatMessage(text: String) {
        val data = JSONObject().apply {
            put("text", text)
            put("type", "text")
        }
        
        emit("send_message", data)
    }
    
    /**
     * Atualiza o estado do áudio
     */
    fun toggleAudio(enabled: Boolean) {
        val data = JSONObject().apply {
            put("enabled", enabled)
        }
        emit("toggle_audio", data)
    }
    
    /**
     * Envia sinal WebRTC
     */
    fun sendWebRTCSignal(
        to: String, 
        signal: JSONObject, 
        type: String,
        roomId: String
    ) {
        val data = JSONObject().apply {
            put("to", to)
            put("signal", signal)
            put("type", type)
            put("roomId", roomId)
        }
        emit("webrtc_signal", data)
    }
    
    /**
     * Altera o volume de um usuário específico
     */
    fun setUserVolume(userId: String, volume: Float) {
        val data = JSONObject().apply {
            put("userId", userId)
            put("volume", volume)
        }
        emit("set_user_volume", data)
    }
    
    /**
     * Altera o volume master
     */
    fun setMasterVolume(volume: Float) {
        val data = JSONObject().apply {
            put("volume", volume)
        }
        emit("set_master_volume", data)
    }
    
    /**
     * Atualiza o mapa de qualidade de conexão
     */
    private fun updateConnectionQuality(data: JSONObject) {
        try {
            val userId = data.getString("userId")
            val category = data.getString("category")
            val score = data.getDouble("score").toFloat()
            val latency = data.getInt("latency")
            val jitter = data.getDouble("jitter").toFloat()
            
            val quality = ConnectionQuality(
                userId = userId,
                category = category,
                score = score,
                latency = latency,
                jitter = jitter
            )
            
            val updatedQualities = _connectionQuality.value.toMutableMap()
            updatedQualities[userId] = quality
            _connectionQuality.value = updatedQualities
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao processar dados de qualidade: ${e.message}")
        }
    }
}
