package com.mesadigital.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.Icon
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.mesadigital.network.SocketManager
import com.mesadigital.ui.room.RoomViewModel

/**
 * Indicador de qualidade de conexão com animação
 */
@Composable
fun ConnectionQualityIndicator(
    userId: String,
    showText: Boolean = false,
    size: ConnectionIndicatorSize = ConnectionIndicatorSize.MEDIUM,
    viewModel: RoomViewModel = viewModel()
) {
    val connectionQualities by viewModel.connectionQualities.collectAsState()
    val connectingUsers by viewModel.connectingUsers.collectAsState()
    
    // Verificar se o usuário está se conectando
    val isConnecting = connectingUsers.contains(userId)
    
    // Obter qualidade de conexão
    val quality = connectionQualities[userId]
    val category = quality?.category ?: "unknown"
    val score = quality?.score ?: 0f
    
    // Animação de pulsação para estado "conectando"
    val infiniteTransition = rememberInfiniteTransition()
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        )
    )
    
    // Ajustar tamanho de acordo com o parâmetro
    val iconSize = when (size) {
        ConnectionIndicatorSize.SMALL -> 16.dp
        ConnectionIndicatorSize.MEDIUM -> 24.dp
        ConnectionIndicatorSize.LARGE -> 32.dp
    }
    
    val textSize = when (size) {
        ConnectionIndicatorSize.SMALL -> 10.sp
        ConnectionIndicatorSize.MEDIUM -> 12.sp
        ConnectionIndicatorSize.LARGE -> 14.sp
    }
    
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
        modifier = Modifier.padding(2.dp)
    ) {
        // Ícone indicador
        Icon(
            imageVector = getConnectionIcon(category),
            contentDescription = "Connection Quality: $category",
            tint = getConnectionColor(category, isConnecting),
            modifier = Modifier
                .size(iconSize)
                .alpha(if (isConnecting) alpha else 1f)
        )
        
        // Texto opcional
        if (showText) {
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = getConnectionText(category, isConnecting),
                color = getConnectionColor(category, isConnecting),
                fontSize = textSize,
                modifier = Modifier.alpha(if (isConnecting) alpha else 1f)
            )
        }
    }
}

/**
 * Retorna o ícone apropriado para a categoria de conexão
 */
@Composable
private fun getConnectionIcon(category: String) = when (category) {
    "excellent" -> Icons.Default.SignalCellular4Bar
    "good" -> Icons.Default.SignalCellular3Bar
    "fair" -> Icons.Default.SignalCellular2Bar
    "poor" -> Icons.Default.SignalCellular1Bar
    "critical" -> Icons.Default.SignalCellularNull
    else -> Icons.Default.SignalCellularAlt // Para "unknown" ou "connecting"
}

/**
 * Retorna a cor apropriada para a categoria de conexão
 */
@Composable
private fun getConnectionColor(category: String, isConnecting: Boolean): Color {
    if (isConnecting) return Color.Gray
    
    return when (category) {
        "excellent" -> MaterialTheme.colors.primary
        "good" -> Color(0xFF4CAF50) // Verde
        "fair" -> Color(0xFFFFC107) // Amarelo
        "poor" -> Color(0xFFFF9800) // Laranja
        "critical" -> Color(0xFFF44336) // Vermelho
        else -> Color.Gray // Para "unknown"
    }
}

/**
 * Retorna o texto descritivo para a categoria de conexão
 */
private fun getConnectionText(category: String, isConnecting: Boolean): String {
    if (isConnecting) return "Conectando..."
    
    return when (category) {
        "excellent" -> "Excelente"
        "good" -> "Boa"
        "fair" -> "Razoável"
        "poor" -> "Fraca"
        "critical" -> "Crítica"
        else -> "Desconhecida"
    }
}

/**
 * Definição dos tamanhos disponíveis para o indicador
 */
enum class ConnectionIndicatorSize {
    SMALL, MEDIUM, LARGE
}
