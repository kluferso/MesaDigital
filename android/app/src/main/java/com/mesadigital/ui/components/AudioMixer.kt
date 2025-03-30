package com.mesadigital.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.mesadigital.model.Participant

@Composable
fun AudioMixer(
    participants: List<Participant>,
    onUpdateVolume: (String, Float) -> Unit,
    onClose: () -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) }
    val tabTitles = listOf("Básico", "Equalizador", "Espacial")
    
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
            color = Color(0xFF1E1E1E),
            shape = RoundedCornerShape(0.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(0.dp)
            ) {
                // Cabeçalho
                TopAppBar(
                    title = { Text("Mixer de Áudio", color = Color.White) },
                    backgroundColor = Color(0xFF121212),
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
                    backgroundColor = Color(0xFF121212),
                    contentColor = Color(0xFF2196F3)
                ) {
                    tabTitles.forEachIndexed { index, title ->
                        Tab(
                            selected = selectedTab == index,
                            onClick = { selectedTab = index },
                            text = { Text(title, color = if (selectedTab == index) Color(0xFF2196F3) else Color.White) }
                        )
                    }
                }
                
                // Conteúdo baseado na tab selecionada
                when (selectedTab) {
                    0 -> BasicMixerTab(participants, onUpdateVolume)
                    1 -> EqualizerTab()
                    2 -> SpatialTab()
                }
            }
        }
    }
}

@Composable
fun BasicMixerTab(
    participants: List<Participant>,
    onUpdateVolume: (String, Float) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(8.dp)
    ) {
        Text(
            text = "Canais de Áudio",
            fontWeight = FontWeight.Bold,
            color = Color.White,
            modifier = Modifier.padding(vertical = 8.dp)
        )
        
        // Grid de Participantes
        LazyVerticalGrid(
            columns = GridCells.Adaptive(minSize = 150.dp),
            contentPadding = PaddingValues(4.dp),
            modifier = Modifier.weight(1f)
        ) {
            items(participants) { participant ->
                ParticipantMixerCard(
                    participant = participant,
                    onVolumeChange = { volume -> onUpdateVolume(participant.id, volume) }
                )
            }
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Configurações Adicionais
        Card(
            modifier = Modifier.fillMaxWidth(),
            backgroundColor = Color(0xFF2A2A2A),
            shape = RoundedCornerShape(8.dp)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = "Configurações de Entrada",
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    fontSize = 16.sp
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Interface de Áudio:",
                        color = Color.White,
                        modifier = Modifier.weight(1f)
                    )
                    
                    // Dropdown simulado
                    OutlinedButton(
                        onClick = { /* Abrir seleção de interface */ },
                        colors = ButtonDefaults.outlinedButtonColors(
                            backgroundColor = Color(0xFF333333),
                            contentColor = Color.White
                        )
                    ) {
                        Text("Padrão do Sistema")
                    }
                }
            }
        }
    }
}

@Composable
fun EqualizerTab() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Equalizador",
            fontWeight = FontWeight.Bold,
            color = Color.White,
            modifier = Modifier.padding(bottom = 16.dp)
        )
        
        // Controles de Equalizador
        EqualizerControl(name = "Graves", value = 0.7f)
        EqualizerControl(name = "Médios", value = 0.5f)
        EqualizerControl(name = "Agudos", value = 0.6f)
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Presets
        Text(
            text = "Presets",
            fontWeight = FontWeight.Bold,
            color = Color.White,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            PresetButton(name = "Flat")
            PresetButton(name = "Rock")
            PresetButton(name = "Jazz")
            PresetButton(name = "Pop")
        }
    }
}

@Composable
fun SpatialTab() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Configurações Espaciais",
            fontWeight = FontWeight.Bold,
            color = Color.White,
            modifier = Modifier.padding(bottom = 16.dp)
        )
        
        // Controles espaciais
        EqualizerControl(name = "Reverberação", value = 0.3f)
        EqualizerControl(name = "Eco", value = 0.2f)
        EqualizerControl(name = "Delay", value = 0.1f)
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Configurações adicionais
        Card(
            modifier = Modifier.fillMaxWidth(),
            backgroundColor = Color(0xFF2A2A2A),
            shape = RoundedCornerShape(8.dp)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = "Ambiente Virtual",
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    fontSize = 16.sp
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Tipo:",
                        color = Color.White,
                        modifier = Modifier.weight(1f)
                    )
                    
                    // Dropdown simulado
                    OutlinedButton(
                        onClick = { /* Abrir seleção de ambiente */ },
                        colors = ButtonDefaults.outlinedButtonColors(
                            backgroundColor = Color(0xFF333333),
                            contentColor = Color.White
                        )
                    ) {
                        Text("Sala de Ensaio")
                    }
                }
            }
        }
    }
}

@Composable
fun ParticipantMixerCard(
    participant: Participant,
    onVolumeChange: (Float) -> Unit
) {
    var volume by remember { mutableStateOf(0.8f) }
    
    Card(
        modifier = Modifier
            .padding(4.dp)
            .fillMaxWidth(),
        backgroundColor = Color(0xFF2A2A2A),
        shape = RoundedCornerShape(8.dp)
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(8.dp)
        ) {
            // Nome do Participante
            Text(
                text = participant.name,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                maxLines = 1,
                modifier = Modifier.fillMaxWidth()
            )
            
            Spacer(modifier = Modifier.height(4.dp))
            
            // Instrumento
            Text(
                text = participant.instrument ?: "Instrumento desconhecido",
                color = Color.LightGray,
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
                maxLines = 1,
                modifier = Modifier.fillMaxWidth()
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Slider de Volume
            Slider(
                value = volume,
                onValueChange = { 
                    volume = it
                    onVolumeChange(it)
                },
                colors = SliderDefaults.colors(
                    thumbColor = Color(0xFF2196F3),
                    activeTrackColor = Color(0xFF2196F3),
                    inactiveTrackColor = Color(0xFF555555)
                )
            )
            
            // Valor do volume
            Text(
                text = "${(volume * 100).toInt()}%",
                color = Color.White,
                fontSize = 12.sp
            )
            
            Spacer(modifier = Modifier.height(4.dp))
            
            // Botões de mutação e solo
            Row(
                horizontalArrangement = Arrangement.SpaceEvenly,
                modifier = Modifier.fillMaxWidth()
            ) {
                IconButton(
                    onClick = { /* Toggle mute */ },
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.VolumeOff,
                        contentDescription = "Mute",
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                }
                
                IconButton(
                    onClick = { /* Toggle solo */ },
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.RecordVoiceOver,
                        contentDescription = "Solo",
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                }
                
                IconButton(
                    onClick = { /* Open settings */ },
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Settings,
                        contentDescription = "Configurações",
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun EqualizerControl(
    name: String,
    value: Float
) {
    var sliderValue by remember { mutableStateOf(value) }
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = name,
                color = Color.White
            )
            
            Text(
                text = "${(sliderValue * 100).toInt()}%",
                color = Color.White,
                fontSize = 12.sp
            )
        }
        
        Slider(
            value = sliderValue,
            onValueChange = { sliderValue = it },
            colors = SliderDefaults.colors(
                thumbColor = Color(0xFF2196F3),
                activeTrackColor = Color(0xFF2196F3),
                inactiveTrackColor = Color(0xFF555555)
            )
        )
    }
}

@Composable
fun PresetButton(name: String) {
    OutlinedButton(
        onClick = { /* Aplicar preset */ },
        colors = ButtonDefaults.outlinedButtonColors(
            backgroundColor = Color(0xFF333333),
            contentColor = Color.White
        ),
        modifier = Modifier.padding(horizontal = 4.dp)
    ) {
        Text(name, fontSize = 12.sp)
    }
}
