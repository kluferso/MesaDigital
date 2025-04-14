package com.mesadigital.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Botão de controle de mídia com design moderno
 * Usado na barra inferior da sala e em outros controles
 */
@Composable
fun MediaControlButton(
    icon: ImageVector,
    contentDescription: String,
    enabled: Boolean = true,
    onClick: () -> Unit,
    badgeCount: Int = 0
) {
    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier.padding(4.dp)
    ) {
        IconButton(
            onClick = onClick,
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(
                    color = when {
                        enabled -> MaterialTheme.colors.primary.copy(alpha = 0.1f)
                        else -> Color.Gray.copy(alpha = 0.1f)
                    }
                )
        ) {
            Icon(
                imageVector = icon,
                contentDescription = contentDescription,
                tint = when {
                    enabled -> MaterialTheme.colors.primary
                    else -> Color.Gray
                },
                modifier = Modifier.size(24.dp)
            )
        }
        
        // Badge para notificações
        if (badgeCount > 0) {
            Badge(
                backgroundColor = MaterialTheme.colors.secondary,
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .offset(x = 4.dp, y = (-4).dp)
                    .size(16.dp)
            ) {
                Text(
                    text = if (badgeCount > 9) "9+" else badgeCount.toString(),
                    color = Color.White,
                    fontSize = 8.sp,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}
