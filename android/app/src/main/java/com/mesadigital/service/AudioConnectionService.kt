package com.mesadigital.service

import android.app.*
import android.content.Intent
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.mesadigital.MainActivity
import com.mesadigital.R
import com.mesadigital.network.SocketManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.collect

/**
 * Serviço que mantém a conexão de áudio em segundo plano
 */
class AudioConnectionService : Service() {
    private val TAG = "AudioConnectionService"
    private val NOTIFICATION_ID = 1001
    private val CHANNEL_ID = "MesaDigitalChannel"
    
    private val binder = LocalBinder()
    private var roomId: String? = null
    private var userName: String? = null
    
    // Escopo de coroutine para operações assíncronas
    private val serviceScope = CoroutineScope(Dispatchers.IO)
    
    inner class LocalBinder : Binder() {
        fun getService(): AudioConnectionService = this@AudioConnectionService
    }
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Serviço de áudio criado")
        createNotificationChannel()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "Serviço de áudio iniciado")
        
        // Extrair dados da Intent
        intent?.let {
            roomId = it.getStringExtra("ROOM_ID")
            userName = it.getStringExtra("USER_NAME")
            
            Log.d(TAG, "Conectando à sala: $roomId como $userName")
            
            // Monitorar estado da conexão
            serviceScope.launch {
                SocketManager.connectionState.collect { state ->
                    when (state) {
                        SocketManager.ConnectionState.CONNECTED -> {
                            updateNotification("Conectado à sala $roomId")
                        }
                        SocketManager.ConnectionState.CONNECTING -> {
                            updateNotification("Conectando à sala $roomId...")
                        }
                        SocketManager.ConnectionState.DISCONNECTED -> {
                            updateNotification("Desconectado da sala $roomId")
                        }
                        SocketManager.ConnectionState.ERROR -> {
                            updateNotification("Erro de conexão com a sala $roomId")
                        }
                    }
                }
            }
            
            // Iniciar o serviço em primeiro plano
            startForeground(NOTIFICATION_ID, createNotification("Conectando à sala $roomId..."))
            
            // Conectar ao servidor
            if (SocketManager.connectionState.value != SocketManager.ConnectionState.CONNECTED) {
                SocketManager.connect()
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
        Log.d(TAG, "Serviço de áudio destruído")
        
        // Desconectar do socket
        if (roomId != null) {
            SocketManager.leaveRoom(roomId!!)
        }
        SocketManager.disconnect()
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "MesaDigital",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Canal para notificações do MesaDigital"
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
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("MesaDigital")
            .setContentText(content)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
    
    private fun updateNotification(content: String) {
        val notification = createNotification(content)
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, notification)
    }
}
