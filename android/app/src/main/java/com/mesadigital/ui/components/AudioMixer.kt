package com.mesadigital.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.viewmodel.compose.viewModel
import com.mesadigital.audio.WebRTCManager
import com.mesadigital.ui.room.RoomViewModel

/**
 * Mixer de áudio moderno inspirado na versão web
 */
@Composable
fun AudioMixer(
    onClose: () -> Unit,
    viewModel: RoomViewModel = viewModel()
) {
    var selectedTab by remember { mutableStateOf(0) }
    val tabTitles = listOf("Mixer", "Equalizador", "Estatísticas")
    
    val users by viewModel.users.collectAsState()
    val userVolumes by viewModel.userVolumes.collectAsState()
    val localUser by viewModel.localUser.collectAsState()
    val masterVolume by viewModel.masterVolume.collectAsState()
    val audioEnabled by viewModel.audioEnabled.collectAsState()
    
    Dialog(
        onDismissRequest = onClose,
        properties = DialogProperties(
            dismissOnBackPress = true,
            dismissOnClickOutside = true,
            usePlatformDefaultWidth = false
        )
    ) {
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .padding(0.dp),
            color = MaterialTheme.colors.background,
            shape = RoundedCornerShape(0.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(0.dp)
            ) {
                // Cabeçalho
                TopAppBar(
                    title = { Text("Mesa Digital", color = Color.White) },
                    backgroundColor = MaterialTheme.colors.primary,
                    navigationIcon = {
                        IconButton(onClick = onClose) {
                            Icon(Icons.Default.Close, contentDescription = "Fechar", tint = Color.White)
                        }
                    },
                    actions = {
                        IconButton(onClick = { /* Ação de salvar configurações */ }) {
                            Icon(Icons.Default.Save, contentDescription = "Salvar", tint = Color.White)
                        }
                    }
                )
                
                // Tabs
                TabRow(
                    selectedTabIndex = selectedTab,
                    backgroundColor = MaterialTheme.colors.primaryVariant,
                    contentColor = Color.White
                ) {
                    tabTitles.forEachIndexed { index, title ->
                        Tab(
                            selected = selectedTab == index,
                            onClick = { selectedTab = index },
                            text = { Text(title, color = if (selectedTab == index) Color.White else Color.LightGray) }
                        )
                    }
                }
                
                // Conteúdo baseado na tab selecionada
                when (selectedTab) {
                    0 -> MixerTab(
                        users = users,
                        userVolumes = userVolumes,
                        localUserId = localUser?.id,
                        masterVolume = masterVolume,
                        audioEnabled = audioEnabled,
                        onVolumeChange = { userId, volume -> viewModel.setUserVolume(userId, volume) },
                        onMasterVolumeChange = { viewModel.setMasterVolume(it) },
                        onToggleAudio = { viewModel.toggleAudio() }
                    )
                    1 -> EqualizerTab()
                    2 -> StatisticsTab()
                }
            }
        }
    }
}

@Composable
fun MixerTab(
    users: List<WebRTCManager.User>,
    userVolumes: Map<String, Float>,
    localUserId: String?,
    masterVolume: Float,
    audioEnabled: Boolean,
    onVolumeChange: (String, Float) -> Unit,
    onMasterVolumeChange: (Float) -> Unit,
    onToggleAudio: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Seção de volume master
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            elevation = 4.dp,
            backgroundColor = MaterialTheme.colors.surface
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Volume Master",
                    style = MaterialTheme.typography.h6,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = { onMasterVolumeChange(if (masterVolume > 0f) 0f else 1f) }
                    ) {
                        Icon(
                            imageVector = if (masterVolume > 0f) Icons.Default.VolumeUp else Icons.Default.VolumeMute,
                            contentDescription = "Toggle Mute",
                            tint = if (masterVolume > 0f) MaterialTheme.colors.primary else Color.Red
                        )
                    }
                    
                    Slider(
                        value = masterVolume,
                        onValueChange = { onMasterVolumeChange(it) },
                        modifier = Modifier
                            .weight(1f)
                            .padding(horizontal = 8.dp),
                        colors = SliderDefaults.colors(
                            thumbColor = MaterialTheme.colors.primary,
                            activeTrackColor = MaterialTheme.colors.primary
                        )
                    )
                    
                    Text(
                        text = "${(masterVolume * 100).toInt()}%",
                        style = MaterialTheme.typography.body2,
                        modifier = Modifier.width(48.dp),
                        textAlign = TextAlign.End
                    )
                }
            }
        }
        
        // Lista de usuários
        Text(
            text = "Canais",
            style = MaterialTheme.typography.h6,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        
        LazyColumn(
            modifier = Modifier.weight(1f)
        ) {
            items(users.sortedWith(compareBy { it.id != localUserId })) { user ->
                val isLocal = user.id == localUserId
                val userVolume = userVolumes[user.id] ?: 1f
                
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    elevation = 2.dp,
                    backgroundColor = if (isLocal) MaterialTheme.colors.primary.copy(alpha = 0.1f) else MaterialTheme.colors.surface
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            // Avatar do usuário
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(if (isLocal) MaterialTheme.colors.primary else MaterialTheme.colors.secondary),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = user.name.first().toString().uppercase(),
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            
                            Spacer(modifier = Modifier.width(12.dp))
                            
                            // Detalhes do usuário
                            Column(
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(
                                    text = user.name + (if (isLocal) " (Você)" else ""),
                                    style = MaterialTheme.typography.subtitle1,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                
                                Text(
                                    text = user.instrument,
                                    style = MaterialTheme.typography.caption,
                                    color = MaterialTheme.colors.onSurface.copy(alpha = 0.6f)
                                )
                            }
                            
                            // Indicador de qualidade
                            ConnectionQualityIndicator(
                                userId = user.id,
                                size = ConnectionIndicatorSize.SMALL
                            )
                        }
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        // Controles específicos baseados no tipo de usuário
                        if (isLocal) {
                            // Para o usuário local, mostrar controle de microfone
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.Center
                            ) {
                                Button(
                                    onClick = onToggleAudio,
                                    colors = ButtonDefaults.buttonColors(
                                        backgroundColor = if (audioEnabled) MaterialTheme.colors.primary else Color.Red
                                    )
                                ) {
                                    Icon(
                                        imageVector = if (audioEnabled) Icons.Default.Mic else Icons.Default.MicOff,
                                        contentDescription = "Toggle Microphone",
                                        tint = Color.White
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = if (audioEnabled) "Microfone Ativo" else "Microfone Desativado",
                                        color = Color.White
                                    )
                                }
                            }
                        } else {
                            // Para outros usuários, mostrar controle de volume
                            Row(
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                IconButton(
                                    onClick = { onVolumeChange(user.id, if (userVolume > 0f) 0f else 1f) }
                                ) {
                                    Icon(
                                        imageVector = if (userVolume > 0f) Icons.Default.VolumeUp else Icons.Default.VolumeMute,
                                        contentDescription = "Toggle Mute",
                                        tint = if (userVolume > 0f) MaterialTheme.colors.primary else Color.Red
                                    )
                                }
                                
                                Slider(
                                    value = userVolume,
                                    onValueChange = { onVolumeChange(user.id, it) },
                                    modifier = Modifier
                                        .weight(1f)
                                        .padding(horizontal = 8.dp),
                                    colors = SliderDefaults.colors(
                                        thumbColor = MaterialTheme.colors.primary,
                                        activeTrackColor = MaterialTheme.colors.primary
                                    )
                                )
                                
                                Text(
                                    text = "${(userVolume * 100).toInt()}%",
                                    style = MaterialTheme.typography.body2,
                                    modifier = Modifier.width(48.dp),
                                    textAlign = TextAlign.End
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun EqualizerTab() {
    // Lista de bandas de equalização simuladas
    val bands = listOf(
        "60Hz", "150Hz", "400Hz", "1kHz", "2.5kHz", "6kHz", "12kHz"
    )
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Equalizador",
            style = MaterialTheme.typography.h6,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 16.dp)
        )
        
        Card(
            modifier = Modifier.fillMaxWidth(),
            elevation = 4.dp,
            backgroundColor = MaterialTheme.colors.surface
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                bands.forEach { band ->
                    var value by remember { mutableStateOf(0f) }
                    
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp)
                    ) {
                        Text(
                            text = band,
                            style = MaterialTheme.typography.body2,
                            modifier = Modifier.width(50.dp)
                        )
                        
                        Slider(
                            value = value,
                            onValueChange = { value = it },
                            valueRange = -12f..12f,
                            steps = 24,
                            modifier = Modifier
                                .weight(1f)
                                .padding(horizontal = 8.dp),
                            colors = SliderDefaults.colors(
                                thumbColor = MaterialTheme.colors.primary,
                                activeTrackColor = MaterialTheme.colors.primary
                            )
                        )
                        
                        Text(
                            text = if (value > 0) "+${value.toInt()} dB" else "${value.toInt()} dB",
                            style = MaterialTheme.typography.body2,
                            modifier = Modifier.width(56.dp),
                            textAlign = TextAlign.End
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Button(
                        onClick = { /* Redefinir equalização */ },
                        colors = ButtonDefaults.buttonColors(
                            backgroundColor = MaterialTheme.colors.primary.copy(alpha = 0.7f)
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Reset",
                            tint = Color.White
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Redefinir", color = Color.White)
                    }
                    
                    Spacer(modifier = Modifier.width(16.dp))
                    
                    Button(
                        onClick = { /* Aplicar equalização */ },
                        colors = ButtonDefaults.buttonColors(
                            backgroundColor = MaterialTheme.colors.primary
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Save,
                            contentDescription = "Apply",
                            tint = Color.White
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Aplicar", color = Color.White)
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = "Predefinições",
            style = MaterialTheme.typography.subtitle1,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            PresetButton(name = "Flat")
            PresetButton(name = "Vocal")
            PresetButton(name = "Bass Boost")
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            PresetButton(name = "Rock")
            PresetButton(name = "Jazz")
            PresetButton(name = "Dance")
        }
    }
}

@Composable
fun StatisticsTab() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Estatísticas",
            style = MaterialTheme.typography.h6,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 16.dp)
        )
        
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            elevation = 4.dp,
            backgroundColor = MaterialTheme.colors.surface
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Rede",
                    style = MaterialTheme.typography.subtitle1,
                    fontWeight = FontWeight.Bold
                )
                
                Divider(modifier = Modifier.padding(vertical = 8.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    StatItem(title = "Latência", value = "45 ms", modifier = Modifier.weight(1f))
                    StatItem(title = "Jitter", value = "3.2 ms", modifier = Modifier.weight(1f))
                }
                
                Row(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    StatItem(title = "Pacotes Perdidos", value = "0.2%", modifier = Modifier.weight(1f))
                    StatItem(title = "Largura de Banda", value = "96 kbps", modifier = Modifier.weight(1f))
                }
            }
        }
        
        Card(
            modifier = Modifier.fillMaxWidth(),
            elevation = 4.dp,
            backgroundColor = MaterialTheme.colors.surface
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Áudio",
                    style = MaterialTheme.typography.subtitle1,
                    fontWeight = FontWeight.Bold
                )
                
                Divider(modifier = Modifier.padding(vertical = 8.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    StatItem(title = "Taxa de Amostragem", value = "48 kHz", modifier = Modifier.weight(1f))
                    StatItem(title = "Tamanho do Buffer", value = "256 amostras", modifier = Modifier.weight(1f))
                }
                
                Row(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    StatItem(title = "Latência de Áudio", value = "13.4 ms", modifier = Modifier.weight(1f))
                    StatItem(title = "Codec", value = "Opus", modifier = Modifier.weight(1f))
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = "Estatísticas em tempo real",
            style = MaterialTheme.typography.caption,
            color = MaterialTheme.colors.onSurface.copy(alpha = 0.6f),
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
fun StatItem(title: String, value: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.padding(vertical = 4.dp)
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.caption,
            color = MaterialTheme.colors.onSurface.copy(alpha = 0.6f)
        )
        
        Text(
            text = value,
            style = MaterialTheme.typography.body1,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
fun PresetButton(name: String) {
    Button(
        onClick = { /* Aplicar preset */ },
        colors = ButtonDefaults.buttonColors(
            backgroundColor = MaterialTheme.colors.surface,
            contentColor = MaterialTheme.colors.primary
        ),
        elevation = ButtonDefaults.elevation(
            defaultElevation = 2.dp,
            pressedElevation = 4.dp
        ),
        shape = RoundedCornerShape(4.dp),
        modifier = Modifier.width(100.dp)
    ) {
        Text(name, fontSize = 12.sp)
    }
}
