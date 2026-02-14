package com.mesadigital

import android.Manifest
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.core.view.WindowCompat
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberPermissionState
import com.mesadigital.service.AudioConnectionService
import com.mesadigital.ui.room.RoomScreen
import com.mesadigital.ui.login.LoginScreen
import com.mesadigital.ui.theme.MesaDigitalTheme

/**
 * Atividade principal do Mesa Digital para Android
 */
class MainActivity : ComponentActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Configurar para edge-to-edge display
        WindowCompat.setDecorFitsSystemWindows(window, false)
        
        setContent {
            MesaDigitalTheme {
                // Container de superfície com cor de fundo do tema
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colors.background
                ) {
                    MesaDigitalApp(
                        fromNotification = intent?.getBooleanExtra("FROM_NOTIFICATION", false) ?: false,
                        roomIdFromNotification = intent?.getStringExtra("ROOM_ID")
                    )
                }
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        // Desconectar e parar o serviço ao sair
        stopService(Intent(this, AudioConnectionService::class.java))
    }
}

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun MesaDigitalApp(
    fromNotification: Boolean = false,
    roomIdFromNotification: String? = null
) {
    val navController = rememberNavController()
    val micPermissionState = rememberPermissionState(Manifest.permission.RECORD_AUDIO)
    
    // Verificar permissão ao iniciar
    LaunchedEffect(key1 = Unit) {
        if (!micPermissionState.hasPermission) {
            micPermissionState.launchPermissionRequest()
        }
    }
    
    NavHost(navController = navController, startDestination = "login") {
        composable("login") {
            LoginScreen(
                onNavigateToRoom = { roomId, userName, instrument ->
                    navController.navigate("room/$roomId/$userName/$instrument") {
                        // Limpa o backstack para que o usuário não volte à tela de login
                        // ao pressionar o botão de voltar na sala
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }
        
        composable(
            "room/{roomId}/{userName}/{instrument}",
            arguments = listOf(
                navArgument("roomId") { type = NavType.StringType },
                navArgument("userName") { type = NavType.StringType },
                navArgument("instrument") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val roomId = backStackEntry.arguments?.getString("roomId") ?: ""
            val userName = backStackEntry.arguments?.getString("userName") ?: ""
            val instrument = backStackEntry.arguments?.getString("instrument") ?: "Vocal"
            
            RoomScreen(
                roomId = roomId,
                userName = userName,
                onNavigateBack = {
                    navController.navigate("login") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }
    }
    
    // Navegar diretamente para a sala se veio da notificação
    LaunchedEffect(key1 = fromNotification) {
        if (fromNotification && !roomIdFromNotification.isNullOrEmpty()) {
            // Quando vem da notificação, vamos direto para a sala
            // usando parâmetros padrão (isso serve apenas para retornar à sala ativa)
            navController.navigate("room/$roomIdFromNotification/Usuário/Vocal") {
                popUpTo("login") { inclusive = true }
            }
        }
    }
}
