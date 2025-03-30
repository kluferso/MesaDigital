package com.mesadigital.ui.room

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.mesadigital.R
import com.mesadigital.network.SocketManager
import com.mesadigital.service.AudioConnectionService
import com.mesadigital.ui.components.ChatPanel
import com.mesadigital.ui.components.ParticipantCard
import com.mesadigital.ui.components.AudioMixer
import com.mesadigital.ui.components.MediaControlButton
import kotlinx.coroutines.launch

@Composable
fun RoomScreen(
    roomId: String,
    userName: String,
    onNavigateBack: () -> Unit,
    viewModel: RoomViewModel = viewModel(factory = RoomViewModelFactory(roomId, userName))
) {
    val context = LocalContext.current
    val scaffoldState = rememberScaffoldState()
    val coroutineScope = rememberCoroutineScope()
    
    val roomState by viewModel.roomState.collectAsState()
    val participants by viewModel.participants.collectAsState()
    val chatMessages by viewModel.chatMessages.collectAsState()
    val connectionState by viewModel.connectionState.collectAsState()
    val audioEnabled by viewModel.audioEnabled.collectAsState()
    val videoEnabled by viewModel.videoEnabled.collectAsState()
    
    val isChatOpen = remember { mutableStateOf(false) }
    
    // Verificar estado de conexão e mostrar mensagem de erro se necessário
    LaunchedEffect(connectionState) {
        if (connectionState == SocketManager.ConnectionState.ERROR) {
            coroutineScope.launch {
                scaffoldState.snackbarHostState.showSnackbar(
                    message = context.getString(R.string.error_connection),
                    actionLabel = context.getString(R.string.retry),
                    duration = SnackbarDuration.Long
                )
            }
        }
    }
    
    // Iniciar serviço de conexão de áudio quando entrar na sala
    LaunchedEffect(Unit) {
        val serviceIntent = Intent(context, AudioConnectionService::class.java).apply {
            putExtra("ROOM_ID", roomId)
            putExtra("USER_NAME", userName)
        }
        context.startService(serviceIntent)
    }
    
    // Tela principal
    Scaffold(
        scaffoldState = scaffoldState,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = stringResource(R.string.room_title, roomId),
                        style = MaterialTheme.typography.h6
                    )
                },
                actions = {
                    // Botão para ativar/desativar áudio
                    IconButton(onClick = { viewModel.toggleAudio() }) {
                        Icon(
                            imageVector = if (audioEnabled) Icons.Default.Mic else Icons.Default.MicOff,
                            contentDescription = "Toggle Audio",
                            tint = if (audioEnabled) Color.White else Color.Red
                        )
                    }
                    
                    // Botão para ativar/desativar vídeo
                    IconButton(onClick = { viewModel.toggleVideo() }) {
                        Icon(
                            imageVector = if (videoEnabled) Icons.Default.Videocam else Icons.Default.VideocamOff,
                            contentDescription = "Toggle Video",
                            tint = if (videoEnabled) Color.White else Color.Red
                        )
                    }
                    
                    // Botão para abrir/fechar chat
                    IconButton(onClick = { isChatOpen.value = !isChatOpen.value }) {
                        Badge(
                            modifier = Modifier.padding(4.dp),
                            backgroundColor = MaterialTheme.colors.error,
                            content = {
                                if (viewModel.unreadMessageCount.value > 0) {
                                    Text(
                                        text = viewModel.unreadMessageCount.value.toString(),
                                        color = Color.White,
                                        fontSize = MaterialTheme.typography.caption.fontSize
                                    )
                                }
                            }
                        ) {
                            Icon(
                                imageVector = Icons.Default.Chat,
                                contentDescription = "Chat",
                                tint = Color.White
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = {
                        viewModel.leaveRoom()
                        onNavigateBack()
                    }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                backgroundColor = MaterialTheme.colors.primary
            )
        }
    ) { paddingValues ->
        
        // Estado de carregamento
        if (roomState == RoomState.CONNECTING) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    CircularProgressIndicator()
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Conectando à sala...",
                        style = MaterialTheme.typography.subtitle1
                    )
                }
            }
        }
        
        // Estado de erro
        else if (roomState == RoomState.ERROR) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier.padding(24.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Error,
                        contentDescription = null,
                        tint = MaterialTheme.colors.error,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Erro ao entrar na sala",
                        style = MaterialTheme.typography.h6,
                        color = MaterialTheme.colors.error,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = viewModel.errorMessage.value,
                        style = MaterialTheme.typography.body1,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    Button(
                        onClick = onNavigateBack,
                        colors = ButtonDefaults.buttonColors(
                            backgroundColor = MaterialTheme.colors.primary
                        )
                    ) {
                        Text(stringResource(R.string.back_to_home))
                    }
                }
            }
        }
        
        // Sala conectada - mostrar conteúdo principal
        else if (roomState == RoomState.CONNECTED) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                // Conteúdo principal da sala (layout em duas colunas para modo paisagem)
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp)
                ) {
                    // Área de vídeo / participantes
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth(),
                        elevation = 4.dp
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp)
                        ) {
                            // Título da seção
                            Text(
                                text = "Participantes (${participants.size})",
                                style = MaterialTheme.typography.h6,
                                fontWeight = FontWeight.Medium
                            )
                            
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            // Lista de participantes
                            LazyColumn(
                                modifier = Modifier.fillMaxWidth(),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(participants) { participant ->
                                    ParticipantCard(
                                        participant = participant,
                                        isLocalUser = participant.id == viewModel.getLocalUserId()
                                    )
                                }
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Barra de controles
                    Card(
                        modifier = Modifier
                            .fillMaxWidth(),
                        elevation = 4.dp,
                        backgroundColor = MaterialTheme.colors.primary
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(8.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            // Botão de áudio
                            MediaControlButton(
                                icon = if (audioEnabled) Icons.Default.Mic else Icons.Default.MicOff,
                                title = "Áudio",
                                isActive = audioEnabled,
                                onClick = { viewModel.toggleAudio() }
                            )
                            
                            // Botão de vídeo
                            MediaControlButton(
                                icon = if (videoEnabled) Icons.Default.Videocam else Icons.Default.VideocamOff,
                                title = "Vídeo",
                                isActive = videoEnabled,
                                onClick = { viewModel.toggleVideo() }
                            )
                            
                            // Botão de chat
                            MediaControlButton(
                                icon = Icons.Default.Chat,
                                title = "Chat",
                                isActive = isChatOpen.value,
                                onClick = { isChatOpen.value = !isChatOpen.value },
                                badgeCount = viewModel.unreadMessageCount.value
                            )
                            
                            // Botão do mixer de áudio
                            val isMixerOpen = remember { mutableStateOf(false) }
                            MediaControlButton(
                                icon = Icons.Default.GraphicEq,
                                title = "Mixer",
                                isActive = isMixerOpen.value,
                                onClick = { isMixerOpen.value = !isMixerOpen.value }
                            )
                        }
                    }
                }
                
                // Chat panel
                if (isChatOpen.value) {
                    ChatPanel(
                        messages = chatMessages,
                        onSendMessage = { message ->
                            viewModel.sendChatMessage(message)
                        },
                        onClose = { isChatOpen.value = false },
                        modifier = Modifier
                            .fillMaxWidth()
                            .fillMaxHeight(0.75f)
                            .align(Alignment.BottomCenter)
                    )
                }
                
                // Audio Mixer
                if (isMixerOpen.value) {
                    AudioMixer(
                        participants = participants,
                        onUpdateVolume = { participantId, volume ->
                            viewModel.updateParticipantVolume(participantId, volume)
                        },
                        onClose = { isMixerOpen.value = false }
                    )
                }
            }
        }
    }
}
