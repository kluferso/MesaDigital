package com.mesadigital.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material.icons.filled.VideocamOff
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.mesadigital.model.Participant

/**
 * Componente que representa um card de participante na sala
 */
@Composable
fun ParticipantCard(
    participant: Participant,
    isLocalUser: Boolean = false,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .height(80.dp),
        elevation = 2.dp,
        shape = RoundedCornerShape(8.dp),
        backgroundColor = if (isLocalUser) 
            MaterialTheme.colors.primary.copy(alpha = 0.1f) 
        else 
            MaterialTheme.colors.surface
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar/indicador do usuário
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(
                        if (isLocalUser) MaterialTheme.colors.primary else MaterialTheme.colors.secondary
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    tint = Color.White
                )
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            // Informações do participante
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = participant.name + if (isLocalUser) " (Você)" else "",
                    style = MaterialTheme.typography.subtitle1,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                
                Text(
                    text = participant.instrument,
                    style = MaterialTheme.typography.body2,
                    color = MaterialTheme.colors.onSurface.copy(alpha = 0.7f)
                )
            }
            
            // Indicadores de status
            Row(
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Status de áudio
                Icon(
                    imageVector = if (participant.audioEnabled) Icons.Default.Mic else Icons.Default.MicOff,
                    contentDescription = "Audio status",
                    tint = if (participant.audioEnabled) MaterialTheme.colors.primary else Color.Red,
                    modifier = Modifier.size(20.dp)
                )
                
                Spacer(modifier = Modifier.width(8.dp))
                
                // Status de vídeo
                Icon(
                    imageVector = if (participant.videoEnabled) Icons.Default.Videocam else Icons.Default.VideocamOff,
                    contentDescription = "Video status",
                    tint = if (participant.videoEnabled) MaterialTheme.colors.primary else Color.Red,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}
