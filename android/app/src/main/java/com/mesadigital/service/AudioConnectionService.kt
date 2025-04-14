package com.mesadigital.service

import android.app.*
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.mesadigital.MainActivity
import com.mesadigital.R
import com.mesadigital.audio.WebRTCManager
import com.mesadigital.network.SocketManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

/**
 * Serviço que mantém a conexão de áudio WebRTC em segundo plano
 * Permite que o usuário continue ouvindo e transmitindo áudio mesmo com o app em segundo plano
 */
class AudioConnectionService : Service() {
    private val TAG = "AudioConnectionService"
    private val NOTIFICATION_ID = 1001
    private val CHANNEL_ID = "MesaDigitalChannel"
    
    private val binder = LocalBinder()
    private var roomId: String? = null
    private var userName: String? = null
    private var instrument: String? = null
    
    // Gerenciador WebRTC
    private lateinit var webRTCManager: WebRTCManager
    
    // AudioManager para controle de foco de áudio
    private lateinit var audioManager: AudioManager
    private var audioFocusRequest: AudioFocusRequest? = null
    private var hasFocus = false
    
    // Escopo de coroutine para operações assíncronas com tratamento de erros
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    
    inner class LocalBinder : Binder() {
        fun getService(): AudioConnectionService = this@AudioConnectionService
    }
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Serviço de áudio WebRTC criado")
        
        // Criar canal de notificação
        createNotificationChannel()
        
        // Inicializar AudioManager
        audioManager = getSystemService(AUDIO_SERVICE) as AudioManager
        
        // Inicializar WebRTCManager
        webRTCManager = WebRTCManager(applicationContext)
        
        // Solicitar foco de áudio
        requestAudioFocus()
        
        // Inicializar WebRTC
        initializeWebRTC()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "Serviço de áudio WebRTC iniciado")
        
        // Extrair dados da Intent
        intent?.let {
            roomId = it.getStringExtra("ROOM_ID")
            userName = it.getStringExtra("USER_NAME")
            instrument = it.getStringExtra("INSTRUMENT") ?: "Vocal"
            
            Log.d(TAG, "Conectando à sala: $roomId como $userName ($instrument)")
            
            // Iniciar o serviço em primeiro plano com a notificação apropriada
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                    NOTIFICATION_ID, 
                    createNotification("Conectando à sala $roomId..."),
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                )
            } else {
                startForeground(NOTIFICATION_ID, createNotification("Conectando à sala $roomId..."))
            }
            
            // Conectar ao servidor se ainda não estiver conectado
            if (SocketManager.connectionState.value != SocketManager.ConnectionState.CONNECTED) {
                SocketManager.connect()
            }
            
            // Juntar-se à sala após a conexão
            serviceScope.launch {
                SocketManager.connectionState.collectLatest { state ->
                    when (state) {
                        SocketManager.ConnectionState.CONNECTED -> {
                            updateNotification("Conectado à sala $roomId")
                            
                            // Juntar-se à sala WebRTC
                            roomId?.let { id ->
                                userName?.let { name ->
                                    webRTCManager.joinRoom(id, name, instrument ?: "Vocal")
                                }
                            }
                        }
                        SocketManager.ConnectionState.CONNECTING -> {
                            updateNotification("Conectando à sala $roomId...")
                        }
                        SocketManager.ConnectionState.DISCONNECTED -> {
                            updateNotification("Desconectado da sala $roomId")
                        }
                        SocketManager.ConnectionState.ERROR -> {
                            updateNotification("Erro de conexão com a sala $roomId")
                            // Tentar reconectar automaticamente após um erro
                            SocketManager.reconnect()
                        }
                    }
                }
            }
            
            // Monitorar estado da conexão WebRTC
            serviceScope.launch {
                webRTCManager.connectionState.collect { state ->
                    when (state) {
                        WebRTCManager.ConnectionState.CONNECTED -> {
                            updateNotification("Transmissão de áudio ativa na sala $roomId")
                        }
                        WebRTCManager.ConnectionState.CONNECTING -> {
                            updateNotification("Iniciando transmissão de áudio...")
                        }
                        WebRTCManager.ConnectionState.DISCONNECTED -> {
                            updateNotification("Transmissão de áudio pausada")
                        }
                        WebRTCManager.ConnectionState.ERROR -> {
                            updateNotification("Erro na transmissão de áudio")
                            // Tentar reinicializar o WebRTC em caso de erro
                            initializeWebRTC()
                        }
                    }
                }
            }
        }
        
        // Se o serviço for encerrado pelo sistema, reiniciá-lo
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder {
        return binder
    }
    
    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "Serviço de áudio WebRTC destruído")
        
        // Abandonar foco de áudio
        abandonAudioFocus()
        
        // Sair da sala e desconectar
        roomId?.let { id ->
            webRTCManager.leaveRoom(id)
            SocketManager.leaveRoom(id)
        }
        
        // Liberar recursos WebRTC
        webRTCManager.release()
        
        // Desconectar do socket
        SocketManager.disconnect()
    }
    
    /**
     * Inicializa o WebRTC
     */
    private fun initializeWebRTC() {
        serviceScope.launch {
            try {
                webRTCManager.initialize()
                
                // Configurar volume inicial padrão
                webRTCManager.setMasterVolume(1.0f)
                
                Log.d(TAG, "WebRTC inicializado com sucesso")
            } catch (e: Exception) {
                Log.e(TAG, "Erro ao inicializar WebRTC: ${e.message}")
                updateNotification("Erro ao inicializar sistema de áudio")
            }
        }
    }
    
    /**
     * Solicita foco de áudio para a aplicação
     */
    private fun requestAudioFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build()
                
            audioFocusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(audioAttributes)
                .setAcceptsDelayedFocusGain(true)
                .setWillPauseWhenDucked(false)
                .setOnAudioFocusChangeListener { focusChange ->
                    handleAudioFocusChange(focusChange)
                }
                .build()
                
            val result = audioManager.requestAudioFocus(audioFocusRequest!!)
            hasFocus = (result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED)
            Log.d(TAG, "Foco de áudio ${if (hasFocus) "concedido" else "negado"}")
        } else {
            val result = audioManager.requestAudioFocus(
                { focusChange -> handleAudioFocusChange(focusChange) },
                AudioManager.STREAM_VOICE_CALL,
                AudioManager.AUDIOFOCUS_GAIN
            )
            hasFocus = (result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED)
        }
    }
    
    /**
     * Abandona o foco de áudio
     */
    private fun abandonAudioFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest?.let {
                audioManager.abandonAudioFocusRequest(it)
            }
        } else {
            audioManager.abandonAudioFocus { _ -> }
        }
        hasFocus = false
    }
    
    /**
     * Manipula mudanças no foco de áudio
     */
    private fun handleAudioFocusChange(focusChange: Int) {
        when (focusChange) {
            AudioManager.AUDIOFOCUS_GAIN -> {
                // Recebemos foco de áudio - restaurar volume normal
                webRTCManager.setMasterVolume(1.0f)
                hasFocus = true
                Log.d(TAG, "Foco de áudio ganho")
            }
            AudioManager.AUDIOFOCUS_LOSS -> {
                // Perdemos foco permanentemente - silenciar áudio
                webRTCManager.setMasterVolume(0.0f)
                hasFocus = false
                Log.d(TAG, "Foco de áudio perdido")
            }
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
                // Perdemos foco temporariamente - reduzir volume
                webRTCManager.setMasterVolume(0.3f)
                hasFocus = false
                Log.d(TAG, "Foco de áudio perdido temporariamente")
            }
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                // Podemos continuar tocando com volume reduzido
                webRTCManager.setMasterVolume(0.5f)
                Log.d(TAG, "Foco de áudio reduzido")
            }
        }
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Mesa Digital Audio",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Canal para notificações de áudio do Mesa Digital"
                setShowBadge(false)
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(content: String): Notification {
        // Intent para abrir o app ao clicar na notificação
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("FROM_NOTIFICATION", true)
                putExtra("ROOM_ID", roomId)
            },
            PendingIntent.FLAG_IMMUTABLE
        )
        
        // Intent para desconectar
        val disconnectIntent = Intent(this, NotificationActionReceiver::class.java).apply {
            action = "ACTION_DISCONNECT"
            putExtra("ROOM_ID", roomId)
        }
        val disconnectPendingIntent = PendingIntent.getBroadcast(
            this,
            1,
            disconnectIntent,
            PendingIntent.FLAG_IMMUTABLE
        )
        
        // Ícone do status de microfone
        val micIcon = if (webRTCManager.audioEnabled.value) {
            R.drawable.ic_mic_on
        } else {
            R.drawable.ic_mic_off
        }
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Mesa Digital")
            .setContentText(content)
            .setSmallIcon(micIcon)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(R.drawable.ic_disconnect, "Desconectar", disconnectPendingIntent)
            .setOngoing(true)
            .build()
    }
    
    private fun updateNotification(content: String) {
        val notification = createNotification(content)
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, notification)
    }
    
    /**
     * Habilita ou desabilita o áudio local
     */
    fun toggleAudio(enabled: Boolean) {
        webRTCManager.toggleAudio(enabled)
        // Atualizar notificação para refletir o estado do microfone
        updateNotification(
            if (enabled) "Transmissão de áudio ativa na sala $roomId" 
            else "Microfone desativado na sala $roomId"
        )
    }
}
