package com.mesadigital.audio

import android.content.Context
import android.media.AudioManager
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import org.webrtc.*
import org.webrtc.audio.JavaAudioDeviceModule
import java.util.concurrent.ConcurrentHashMap
import com.mesadigital.network.SocketManager

/**
 * Gerenciador de WebRTC para chamadas de áudio em tempo real
 * Otimizado para trabalhar com PythonAnywhere
 */
class WebRTCManager(private val context: Context) {
    private val tag = "WebRTCManager"
    
    // Estruturas de WebRTC
    private var peerConnectionFactory: PeerConnectionFactory? = null
    private var audioSource: AudioSource? = null
    private var localAudioTrack: AudioTrack? = null
    private var eglBase: EglBase? = null
    
    // Configurações de conexão - Lista expandida de servidores STUN/TURN para maior compatibilidade
    private val iceServers = listOf(
        PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer(),
        PeerConnection.IceServer.builder("stun:stun1.l.google.com:19302").createIceServer(),
        PeerConnection.IceServer.builder("stun:stun2.l.google.com:19302").createIceServer(),
        PeerConnection.IceServer.builder("stun:stun3.l.google.com:19302").createIceServer(),
        PeerConnection.IceServer.builder("stun:stun4.l.google.com:19302").createIceServer(),
        PeerConnection.IceServer.builder("stun:stun.stunprotocol.org:3478").createIceServer()
        // Adicione servidores TURN aqui quando disponíveis para ambientes mais restritivos
    )
    
    private val rtcConfig = PeerConnection.RTCConfiguration(iceServers).apply {
        sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
        continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY
        enableDtlsSrtp = true
        enableCpuOveruseDetection = true
        bundlePolicy = PeerConnection.BundlePolicy.MAXBUNDLE  // Ajudará com firewalls mais restritivos
        rtcpMuxPolicy = PeerConnection.RtcpMuxPolicy.REQUIRE  // Reduz portas necessárias
        tcpCandidatePolicy = PeerConnection.TcpCandidatePolicy.ENABLED  // Habilita candidatos TCP em firewalls restritos
        iceTransportsType = PeerConnection.IceTransportsType.ALL  // Usa todos os métodos de transporte
    }
    
    // Estado das conexões
    private val peerConnections = ConcurrentHashMap<String, PeerConnection>()
    private val userVolumes = ConcurrentHashMap<String, Float>()
    
    // Estado observável
    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState
    
    private val _audioEnabled = MutableStateFlow(true)
    val audioEnabled = _audioEnabled.asStateFlow()
    
    private val _users = MutableStateFlow<List<User>>(emptyList())
    val users = _users.asStateFlow()
    
    private val _localUser = MutableStateFlow<User?>(null)
    val localUser = _localUser.asStateFlow()
    
    private val _masterVolume = MutableStateFlow(1.0f)
    val masterVolume = _masterVolume.asStateFlow()
    
    private val _connectingUsers = MutableStateFlow<List<String>>(emptyList())
    val connectingUsers = _connectingUsers.asStateFlow()
    
    // Escopo de coroutines
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    
    // Modelo de dados
    data class User(
        val id: String,
        val name: String,
        val instrument: String
    )
    
    enum class ConnectionState {
        CONNECTED, CONNECTING, DISCONNECTED, ERROR
    }
    
    /**
     * Inicializa o WebRTC e configura a fábrica de conexões
     */
    fun initialize() {
        Log.d(tag, "Inicializando WebRTC")
        
        _connectionState.value = ConnectionState.CONNECTING
        
        try {
            // Inicializar EGL
            eglBase = EglBase.create()
            
            // Inicializar PeerConnectionFactory
            val options = PeerConnectionFactory.InitializationOptions.builder(context)
                .setEnableInternalTracer(true)
                .setFieldTrials("WebRTC-H264HighProfile/Enabled/")  // Melhora a qualidade em conexões ruins
                .createInitializationOptions()
            
            PeerConnectionFactory.initialize(options)
            
            // Configurar módulo de áudio com configurações otimizadas para música
            val audioDeviceModule = JavaAudioDeviceModule.builder(context)
                .setUseHardwareAcousticEchoCanceler(true)
                .setUseHardwareNoiseSuppressor(true)
                .setUseLowLatency(true)  // Importante para instrumentos musicais
                .createAudioDeviceModule()
            
            // Criar fábrica de conexões
            val encoderFactory = SoftwareVideoEncoderFactory()
            val decoderFactory = SoftwareVideoDecoderFactory()
            
            val factoryOptions = PeerConnectionFactory.Options().apply {
                disableNetworkMonitor = false
                disableEncryption = false
            }
            
            peerConnectionFactory = PeerConnectionFactory.builder()
                .setOptions(factoryOptions)
                .setVideoEncoderFactory(encoderFactory)
                .setVideoDecoderFactory(decoderFactory)
                .setAudioDeviceModule(audioDeviceModule)
                .createPeerConnectionFactory()
            
            // Criar fonte de áudio local com configurações para melhor qualidade musical
            val audioConstraints = MediaConstraints()
            audioConstraints.mandatory.add(MediaConstraints.KeyValuePair("googEchoCancellation", "true"))
            audioConstraints.mandatory.add(MediaConstraints.KeyValuePair("googNoiseSuppression", "true"))
            audioConstraints.mandatory.add(MediaConstraints.KeyValuePair("googHighpassFilter", "true"))
            audioConstraints.mandatory.add(MediaConstraints.KeyValuePair("googAutoGainControl", "true"))
            audioConstraints.mandatory.add(MediaConstraints.KeyValuePair("googAudioMirroring", "false"))  // Evita eco
            
            audioSource = peerConnectionFactory?.createAudioSource(audioConstraints)
            localAudioTrack = peerConnectionFactory?.createAudioTrack("audio0", audioSource)
            
            // Otimizar para transmissão de áudio musical
            localAudioTrack?.setEnabled(true)
            
            // Configurar estado inicial
            _connectionState.value = ConnectionState.CONNECTED
            _audioEnabled.value = true
            
            // Configurar gerenciador de áudio no nível do sistema
            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
            
            setupSocketListeners()
            
            Log.d(tag, "WebRTC inicializado com sucesso")
        } catch (e: Exception) {
            Log.e(tag, "Erro ao inicializar WebRTC: ${e.message}")
            _connectionState.value = ConnectionState.ERROR
        }
    }
    
    /**
     * Configura listeners do socket para troca de mensagens WebRTC
     */
    private fun setupSocketListeners() {
        // Implementar listeners para sinais WebRTC
        SocketManager.on("webrtc_signal") { args ->
            if (args.isNotEmpty()) {
                try {
                    val data = args[0] as JSONObject
                    val from = data.getString("from")
                    val type = data.getString("type")
                    val signal = data.getJSONObject("signal")
                    
                    scope.launch {
                        handleWebRTCSignal(from, type, signal)
                    }
                } catch (e: Exception) {
                    Log.e(tag, "Erro ao processar sinal WebRTC: ${e.message}")
                }
            }
        }
        
        // Listener para novo usuário
        SocketManager.on("user_joined") { args ->
            if (args.isNotEmpty()) {
                try {
                    val data = args[0] as JSONObject
                    val userId = data.getString("userId")
                    val userName = data.getString("userName")
                    val instrument = data.optString("instrument", "Membro")
                    
                    Log.d(tag, "Novo usuário: $userName ($userId) com instrumento $instrument")
                    
                    // Adicionar usuário à lista
                    addUser(userId, userName, instrument)
                    
                    // Iniciar conexão com o novo usuário
                    scope.launch {
                        // Pequeno atraso para evitar tempestade de ofertas
                        delay(500)
                        createPeerConnection(userId, true)
                    }
                } catch (e: Exception) {
                    Log.e(tag, "Erro ao processar novo usuário: ${e.message}")
                }
            }
        }
        
        // Listener para usuário que saiu
        SocketManager.on("user_left") { args ->
            if (args.isNotEmpty()) {
                try {
                    val data = args[0] as JSONObject
                    val userId = data.getString("userId")
                    
                    Log.d(tag, "Usuário saiu: $userId")
                    
                    // Remover usuário da lista
                    removeUser(userId)
                    
                    // Fechar conexão com o usuário
                    closePeerConnection(userId)
                } catch (e: Exception) {
                    Log.e(tag, "Erro ao processar saída de usuário: ${e.message}")
                }
            }
        }
        
        // Listener para lista de usuários na sala
        SocketManager.on("room_users") { args ->
            if (args.isNotEmpty()) {
                try {
                    val data = args[0] as JSONObject
                    val users = data.getJSONArray("users")
                    val userList = mutableListOf<User>()
                    
                    Log.d(tag, "Recebida lista de ${users.length()} usuários na sala")
                    
                    for (i in 0 until users.length()) {
                        val user = users.getJSONObject(i)
                        val userId = user.getString("id")
                        val userName = user.getString("name")
                        val instrument = user.optString("instrument", "Membro")
                        
                        userList.add(User(userId, userName, instrument))
                        
                        // Iniciar conexão com usuário existente
                        if (userId != _localUser.value?.id) {
                            scope.launch {
                                // Pequeno atraso escalonado para evitar tempestade de ofertas
                                delay(500L * i)
                                createPeerConnection(userId, false)
                            }
                        }
                    }
                    
                    _users.value = userList
                } catch (e: Exception) {
                    Log.e(tag, "Erro ao processar lista de usuários: ${e.message}")
                }
            }
        }
        
        // Listener para reconexão de socket
        SocketManager.on(Socket.EVENT_RECONNECT) { _ ->
            Log.d(tag, "Socket reconectado. Reconfigurando conexões WebRTC")
            
            // Se estávamos em uma sala antes, reconectar
            _localUser.value?.let { user ->
                joinRoom(_roomId, user.name, user.instrument)
            }
        }
    }
    
    // Manter referência ao ID da sala atual
    private var _roomId: String = ""
    
    /**
     * Trata sinais WebRTC recebidos
     */
    private suspend fun handleWebRTCSignal(from: String, type: String, signal: JSONObject) {
        withContext(Dispatchers.Main) {
            try {
                // Obter conexão ou criar uma nova
                val peerConnection = peerConnections[from] ?: createPeerConnection(from, false)
                
                when (type) {
                    "offer" -> {
                        Log.d(tag, "Recebido offer de $from")
                        val sdp = SessionDescription(
                            SessionDescription.Type.OFFER,
                            signal.getString("sdp")
                        )
                        
                        peerConnection.setRemoteDescription(
                            SdpObserver("setRemoteDescription", from),
                            sdp
                        )
                        
                        // Criar resposta
                        val constraints = MediaConstraints()
                        constraints.mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
                        
                        peerConnection.createAnswer(
                            SdpObserver("createAnswer", from),
                            constraints
                        )
                    }
                    "answer" -> {
                        Log.d(tag, "Recebido answer de $from")
                        val sdp = SessionDescription(
                            SessionDescription.Type.ANSWER,
                            signal.getString("sdp")
                        )
                        
                        peerConnection.setRemoteDescription(
                            SdpObserver("setRemoteDescription", from),
                            sdp
                        )
                    }
                    "candidate" -> {
                        Log.d(tag, "Recebido candidate de $from")
                        val candidate = IceCandidate(
                            signal.getString("sdpMid"),
                            signal.getInt("sdpMLineIndex"),
                            signal.getString("candidate")
                        )
                        
                        peerConnection.addIceCandidate(candidate)
                    }
                }
            } catch (e: Exception) {
                Log.e(tag, "Erro ao processar sinal WebRTC: ${e.message}")
            }
        }
    }
    
    /**
     * Cria uma conexão peer para um usuário
     */
    private fun createPeerConnection(userId: String, isInitiator: Boolean): PeerConnection {
        Log.d(tag, "Criando conexão para $userId, iniciador: $isInitiator")
        
        // Adicionar à lista de usuários em conexão
        val currentConnecting = _connectingUsers.value.toMutableList()
        if (!currentConnecting.contains(userId)) {
            currentConnecting.add(userId)
            _connectingUsers.value = currentConnecting
        }
        
        // Criar conexão
        val observer = PeerConnectionObserver(userId)
        val peerConnection = peerConnectionFactory?.createPeerConnection(rtcConfig, observer)
            ?: throw IllegalStateException("Erro ao criar conexão peer")
        
        // Adicionar track de áudio
        localAudioTrack?.let { track ->
            peerConnection.addTrack(track, listOf("stream-$userId"))
        }
        
        peerConnections[userId] = peerConnection
        
        // Se for o iniciador, criar e enviar oferta
        if (isInitiator) {
            val constraints = MediaConstraints().apply {
                mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
            }
            
            peerConnection.createOffer(object : SdpObserver("createOffer", userId) {
                override fun onCreateSuccess(sessionDescription: SessionDescription) {
                    peerConnection.setLocalDescription(this, sessionDescription)
                    
                    // Enviar oferta
                    val offer = JSONObject().apply {
                        put("type", "offer")
                        put("sdp", sessionDescription.description)
                    }
                    
                    SocketManager.sendWebRTCSignal(
                        to = userId,
                        signal = offer,
                        type = "offer",
                        roomId = _roomId
                    )
                }
            }, constraints)
        }
        
        return peerConnection
    }
    
    /**
     * Fecha uma conexão peer
     */
    private fun closePeerConnection(userId: String) {
        Log.d(tag, "Fechando conexão com $userId")
        
        try {
            peerConnections[userId]?.let { conn ->
                conn.close()
                peerConnections.remove(userId)
            }
            
            // Remover da lista de usuários em conexão
            val currentConnecting = _connectingUsers.value.toMutableList()
            currentConnecting.remove(userId)
            _connectingUsers.value = currentConnecting
        } catch (e: Exception) {
            Log.e(tag, "Erro ao fechar conexão: ${e.message}")
        }
    }
    
    /**
     * Adiciona um usuário à lista
     */
    private fun addUser(userId: String, userName: String, instrument: String) {
        val currentUsers = _users.value.toMutableList()
        val newUser = User(userId, userName, instrument)
        
        // Verificar se o usuário já existe
        if (currentUsers.none { it.id == userId }) {
            currentUsers.add(newUser)
            _users.value = currentUsers
        }
    }
    
    /**
     * Remove um usuário da lista
     */
    private fun removeUser(userId: String) {
        val currentUsers = _users.value.toMutableList()
        currentUsers.removeAll { it.id == userId }
        _users.value = currentUsers
    }
    
    /**
     * Define o usuário local
     */
    fun setLocalUser(id: String, name: String, instrument: String) {
        _localUser.value = User(id, name, instrument)
    }
    
    /**
     * Ativa/desativa o áudio local
     */
    fun toggleAudio(enabled: Boolean) {
        localAudioTrack?.setEnabled(enabled)
        _audioEnabled.value = enabled
        SocketManager.toggleAudio(enabled)
    }
    
    /**
     * Define o volume para um usuário específico
     */
    fun setUserVolume(userId: String, volume: Float) {
        userVolumes[userId] = volume
        SocketManager.setUserVolume(userId, volume)
    }
    
    /**
     * Define o volume master
     */
    fun setMasterVolume(volume: Float) {
        _masterVolume.value = volume
        SocketManager.setMasterVolume(volume)
        
        // Ajustar volume do sistema
        try {
            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            val maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
            val targetVolume = (maxVolume * volume).toInt()
            audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, targetVolume, 0)
        } catch (e: Exception) {
            Log.e(tag, "Erro ao ajustar volume: ${e.message}")
        }
    }
    
    /**
     * Junta-se a uma sala
     */
    fun joinRoom(roomId: String, userName: String, instrument: String) {
        _roomId = roomId
        setLocalUser("local-${System.currentTimeMillis()}", userName, instrument)
        SocketManager.joinRoom(roomId, userName, instrument)
    }
    
    /**
     * Sai de uma sala
     */
    fun leaveRoom(roomId: String) {
        SocketManager.leaveRoom(roomId)
        
        // Fechar todas as conexões
        peerConnections.keys.forEach { userId ->
            closePeerConnection(userId)
        }
        
        // Limpar estado
        _users.value = emptyList()
        _localUser.value = null
        _connectingUsers.value = emptyList()
    }
    
    /**
     * Libera recursos
     */
    fun release() {
        // Fechar todas as conexões
        peerConnections.forEach { (_, connection) ->
            connection.close()
        }
        peerConnections.clear()
        
        // Liberar recursos de áudio
        localAudioTrack?.dispose()
        audioSource?.dispose()
        
        // Liberar fábrica
        peerConnectionFactory?.dispose()
        eglBase?.release()
        
        // Limpar estado
        _connectionState.value = ConnectionState.DISCONNECTED
    }
    
    /**
     * Classe para observar eventos da conexão peer
     */
    private inner class PeerConnectionObserver(private val userId: String) : PeerConnection.Observer {
        override fun onSignalingChange(state: PeerConnection.SignalingState?) {
            Log.d(tag, "onSignalingChange: $state para $userId")
        }
        
        override fun onIceConnectionChange(state: PeerConnection.IceConnectionState?) {
            Log.d(tag, "onIceConnectionChange: $state para $userId")
            
            if (state == PeerConnection.IceConnectionState.CONNECTED) {
                val currentConnecting = _connectingUsers.value.toMutableList()
                currentConnecting.remove(userId)
                _connectingUsers.value = currentConnecting
            }
        }
        
        override fun onIceConnectionReceivingChange(receiving: Boolean) {
            Log.d(tag, "onIceConnectionReceivingChange: $receiving para $userId")
        }
        
        override fun onIceGatheringChange(state: PeerConnection.IceGatheringState?) {
            Log.d(tag, "onIceGatheringChange: $state para $userId")
        }
        
        override fun onIceCandidate(candidate: IceCandidate?) {
            Log.d(tag, "onIceCandidate para $userId")
            candidate?.let {
                val candidateJson = JSONObject().apply {
                    put("sdpMid", it.sdpMid)
                    put("sdpMLineIndex", it.sdpMLineIndex)
                    put("candidate", it.sdp)
                }
                
                SocketManager.sendWebRTCSignal(
                    to = userId,
                    signal = candidateJson,
                    type = "candidate",
                    roomId = _roomId
                )
            }
        }
        
        override fun onIceCandidatesRemoved(candidates: Array<out IceCandidate>?) {
            Log.d(tag, "onIceCandidatesRemoved para $userId")
        }
        
        override fun onAddStream(stream: MediaStream?) {
            Log.d(tag, "onAddStream: ${stream?.id} para $userId")
        }
        
        override fun onRemoveStream(stream: MediaStream?) {
            Log.d(tag, "onRemoveStream: ${stream?.id} para $userId")
        }
        
        override fun onDataChannel(channel: DataChannel?) {
            Log.d(tag, "onDataChannel: ${channel?.label()} para $userId")
        }
        
        override fun onRenegotiationNeeded() {
            Log.d(tag, "onRenegotiationNeeded para $userId")
        }
        
        override fun onAddTrack(receiver: RtpReceiver?, streams: Array<out MediaStream>?) {
            Log.d(tag, "onAddTrack para $userId")
        }
    }
    
    /**
     * Classe adaptadora para SDP
     */
    private open inner class SdpObserver(private val tag: String, private val userId: String) : SdpAdapter(tag) {
        override fun onCreateSuccess(sessionDescription: SessionDescription?) {
            Log.d(this.tag, "onCreateSuccess: $tag para $userId")
        }
        
        override fun onSetSuccess() {
            Log.d(this.tag, "onSetSuccess: $tag para $userId")
        }
        
        override fun onCreateFailure(error: String?) {
            Log.e(this.tag, "onCreateFailure: $tag para $userId, erro: $error")
        }
        
        override fun onSetFailure(error: String?) {
            Log.e(this.tag, "onSetFailure: $tag para $userId, erro: $error")
        }
    }
}
