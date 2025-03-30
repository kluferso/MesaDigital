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
import androidx.compose.ui.tooling.preview.Preview
import androidx.core.view.WindowCompat
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberPermissionState
import com.mesadigital.service.AudioConnectionService
import com.mesadigital.ui.room.RoomScreen
import com.mesadigital.ui.login.LoginScreen
import com.mesadigital.ui.theme.MesaDigitalTheme

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
                    MesaDigitalApp()
                }
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        // Desconectar socket ao sair
        stopService(Intent(this, AudioConnectionService::class.java))
    }
}

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun MesaDigitalApp() {
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
                onNavigateToRoom = { roomId, userName ->
                    navController.navigate("room/$roomId/$userName") {
                        // Limpa o backstack para que o usuário não volte à tela de login
                        // ao pressionar o botão de voltar na sala
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }
        
        composable("room/{roomId}/{userName}") { backStackEntry ->
            val roomId = backStackEntry.arguments?.getString("roomId") ?: ""
            val userName = backStackEntry.arguments?.getString("userName") ?: ""
            
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
}

@Preview(showBackground = true)
@Composable
fun LoginScreenPreview() {
    MesaDigitalTheme {
        LoginScreen(onNavigateToRoom = { _, _ -> })
    }
}
