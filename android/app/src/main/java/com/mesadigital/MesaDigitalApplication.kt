package com.mesadigital

import android.app.Application
import android.content.Context
import com.mesadigital.network.SocketManager

class MesaDigitalApplication : Application() {
    
    companion object {
        lateinit var appContext: Context
            private set
        
        // URL do servidor
        const val SERVER_URL = "http://mesadigital.pythonanywhere.com" // URL de produção
        // const val SERVER_URL = "http://10.0.2.2:5000" // Para teste local no emulador
    }
    
    override fun onCreate() {
        super.onCreate()
        appContext = applicationContext
        
        // Inicializa o gerenciador de sockets
        SocketManager.init(SERVER_URL)
    }
}
