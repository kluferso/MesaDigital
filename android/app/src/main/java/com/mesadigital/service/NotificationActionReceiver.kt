package com.mesadigital.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.mesadigital.network.SocketManager

/**
 * Receptor de broadcast para ações da notificação
 */
class NotificationActionReceiver : BroadcastReceiver() {
    
    companion object {
        private const val TAG = "NotificationReceiver"
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Ação recebida: ${intent.action}")
        
        when (intent.action) {
            "ACTION_DISCONNECT" -> {
                // Obter o ID da sala
                val roomId = intent.getStringExtra("ROOM_ID")
                if (roomId != null) {
                    Log.d(TAG, "Desconectando da sala: $roomId")
                    
                    // Sair da sala
                    SocketManager.leaveRoom(roomId)
                    
                    // Parar o serviço de áudio
                    val serviceIntent = Intent(context, AudioConnectionService::class.java)
                    context.stopService(serviceIntent)
                    
                    // Voltar para a tela inicial
                    val mainIntent = Intent(context, com.mesadigital.MainActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                        putExtra("FROM_NOTIFICATION_DISCONNECT", true)
                    }
                    context.startActivity(mainIntent)
                }
            }
        }
    }
}
