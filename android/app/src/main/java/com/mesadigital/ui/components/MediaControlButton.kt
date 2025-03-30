package com.mesadigital.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun MediaControlButton(
    icon: ImageVector,
    title: String,
    isActive: Boolean = false,
    onClick: () -> Unit,
    badgeCount: Int = 0
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(4.dp)
    ) {
        Box {
            IconButton(
                onClick = onClick,
                modifier = Modifier
                    .size(44.dp)
                    .background(
                        color = if (isActive) MaterialTheme.colors.primary else Color(0xFF424242),
                        shape = CircleShape
                    )
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = Color.White,
                    modifier = Modifier.size(22.dp)
                )
            }
            
            // Badge de contagem (para notificações)
            if (badgeCount > 0) {
                Badge(
                    backgroundColor = MaterialTheme.colors.error,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .offset(x = 2.dp, y = (-2).dp)
                ) {
                    Text(
                        text = if (badgeCount > 99) "99+" else badgeCount.toString(),
                        color = Color.White,
                        fontSize = 10.sp
                    )
                }
            }
        }
        
        Text(
            text = title,
            style = MaterialTheme.typography.caption,
            color = if (isActive) MaterialTheme.colors.primary else Color.White,
            fontSize = 12.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.width(56.dp)
        )
    }
}
