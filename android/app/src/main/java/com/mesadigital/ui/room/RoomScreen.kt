package com.mesadigital.ui.room

import android.content.Intent
import androidx.compose.animation.*
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.mesadigital.R
import com.mesadigital.network.SocketManager
import com.mesadigital.service.AudioConnectionService
import com.mesadigital.ui.components.AudioMixer
import com.mesadigital.ui.components.ChatPanel
import com.mesadigital.ui.components.ConnectionQualityIndicator
import com.mesadigital.ui.components.MediaControlButton

/**
 * Tela de sala com design moderno inspirado na versão web
 */
@Composable
fun RoomScreen(
    roomId: String,
    userName: String,
    instrument: String = "Vocal",
    onNavigateBack: () -> Unit,
    viewModel: RoomViewModel = viewModel(factory = RoomViewModelFactory(roomId, userName, instrument))
) {
    val context = LocalContext.current
    val scaffoldState = rememberScaffoldState()
    val coroutineScope = rememberCoroutineScope()
    
    val roomState by viewModel.roomState.collectAsState()
    val participants by viewModel.participants.collectAsState()
    val chatMessages by viewModel.chatMessages.collectAsState()
    val connectionState by viewModel.connectionState.collectAsState()
    val audioEnabled by viewModel.audioEnabled.collectAsState()
    val connectionQualities by viewModel.connectionQualities.collectAsState()
    
    // Estados da UI
    var showMixer by remember { mutableStateOf(false) }
    var showChat by remember { mutableStateOf(false) }
    var showMenu by remember { mutableStateOf(false) }
    var showStats by remember { mutableStateOf(false) }
    
    // Indicador de notificações
    var unreadMessages by remember { mutableStateOf(0) }
    
    // Resetar notificações quando o chat é aberto
    LaunchedEffect(showChat) {
        if (showChat) {
            unreadMessages = 0
        }
    }
    
    // Aumentar contador de mensagens não lidas quando novas mensagens chegam
    LaunchedEffect(chatMessages.size) {
        if (!showChat && chatMessages.isNotEmpty()) {
            unreadMessages++
        }
    }
    
    // Verificar estado de conexão
    LaunchedEffect(connectionState) {
        if (connectionState == SocketManager.ConnectionState.ERROR) {
            scaffoldState.snackbarHostState.showSnackbar(
                message = "Erro de conexão",
                actionLabel = "Reconectar",
                duration = SnackbarDuration.Long
            )
        }
    }
    
    // Inicialização
    LaunchedEffect(Unit) {
        // Iniciar serviço de conexão de áudio
        val serviceIntent = Intent(context, AudioConnectionService::class.java).apply {
            putExtra("ROOM_ID", roomId)
            putExtra("USER_NAME", userName)
            putExtra("INSTRUMENT", instrument)
        }
        context.startService(serviceIntent)
    }
    
    // Estrutura principal
    Scaffold(
        scaffoldState = scaffoldState,
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        // Avatar da sala
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colors.primary),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = roomId.first().uppercase(),
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        
                        Spacer(modifier = Modifier.width(12.dp))
                        
                        Column {
                            Text(
                                text = "Studio $roomId",
                                style = MaterialTheme.typography.h6
                            )
                            Text(
                                text = "WebRTC ativado",
                                style = MaterialTheme.typography.caption,
                                color = Color.White.copy(alpha = 0.7f)
                            )
                        }
                    }
                },
                actions = {
                    // Botão de chat
                    IconButton(onClick = { showChat = !showChat }) {
                        Badge(
                            modifier = Modifier
                                .size(16.dp)
                                .align(Alignment.TopEnd)
                                .offset(x = (-8).dp, y = 8.dp),
                            backgroundColor = MaterialTheme.colors.secondary
                        ) {
                            if (unreadMessages > 0) {
                                Text(
                                    text = if (unreadMessages > 9) "9+" else unreadMessages.toString(),
                                    fontSize = 8.sp,
                                    color = Color.White
                                )
                            }
                        }
                        Icon(
                            imageVector = Icons.Default.Chat,
                            contentDescription = "Chat",
                            tint = if (showChat) MaterialTheme.colors.secondary else Color.White
                        )
                    }
                    
                    // Botão de menu
                    IconButton(onClick = { showMenu = true }) {
                        Icon(Icons.Default.MoreVert, contentDescription = "Menu")
                    }
                    
                    // Menu de opções
                    DropdownMenu(
                        expanded = showMenu,
                        onDismissRequest = { showMenu = false }
                    ) {
                        DropdownMenuItem(onClick = {
                            showStats = true
                            showMenu = false
                        }) {
                            Icon(Icons.Default.BarChart, contentDescription = "Estatísticas")
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Estatísticas")
                        }
                        
                        DropdownMenuItem(onClick = {
                            // Compartilhar link da sala
                            val shareIntent = Intent().apply {
                                action = Intent.ACTION_SEND
                                putExtra(Intent.EXTRA_TEXT, "Entre na minha sala de áudio Mesa Digital: $roomId")
                                type = "text/plain"
                            }
                            context.startActivity(Intent.createChooser(shareIntent, "Compartilhar sala"))
                            showMenu = false
                        }) {
                            Icon(Icons.Default.Share, contentDescription = "Compartilhar")
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Compartilhar")
                        }
                        
                        DropdownMenuItem(onClick = {
                            viewModel.leaveRoom()
                            onNavigateBack()
                            showMenu = false
                        }) {
                            Icon(Icons.Default.ExitToApp, contentDescription = "Sair")
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Sair da sala")
                        }
                    }
                },
                backgroundColor = MaterialTheme.colors.primary,
                elevation = 8.dp
            )
        },
        bottomBar = {
            BottomAppBar(
                backgroundColor = MaterialTheme.colors.surface,
                elevation = 8.dp
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Controle de microfone
                    MediaControlButton(
                        icon = if (audioEnabled) Icons.Default.Mic else Icons.Default.MicOff,
                        contentDescription = "Microfone",
                        enabled = audioEnabled,
                        onClick = { viewModel.toggleAudio() }
                    )
                    
                    // Mixagem
                    MediaControlButton(
                        icon = Icons.Default.Equalizer,
                        contentDescription = "Mixer",
                        onClick = { showMixer = true }
                    )
                    
                    // Indicador de qualidade de conexão
                    val localUser = viewModel.localUser.collectAsState().value
                    if (localUser != null) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colors.primary.copy(alpha = 0.1f)),
                            contentAlignment = Alignment.Center
                        ) {
                            ConnectionQualityIndicator(
                                userId = localUser.id,
                                showText = false,
                                size = com.mesadigital.ui.components.ConnectionIndicatorSize.MEDIUM
                            )
                        }
                    }
                    
                    // Chat
                    MediaControlButton(
                        icon = Icons.Default.Chat,
                        contentDescription = "Chat",
                        onClick = { showChat = !showChat },
                        badgeCount = unreadMessages
                    )
                    
                    // Sair
                    MediaControlButton(
                        icon = Icons.Default.ExitToApp,
                        contentDescription = "Sair",
                        onClick = {
                            viewModel.leaveRoom()
                            onNavigateBack()
                        }
                    )
                }
            }
        }
    ) { paddingValues ->
        // Estado de inicialização
        when (roomState) {
            RoomViewModel.RoomState.CONNECTING -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator()
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Conectando à sala...")
                    }
                }
            }
            
            RoomViewModel.RoomState.ERROR -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Error,
                            contentDescription = null,
                            tint = MaterialTheme.colors.error,
                            modifier = Modifier.size(64.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Erro ao conectar à sala",
                            style = MaterialTheme.typography.h6,
                            color = MaterialTheme.colors.error
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(
                            onClick = { viewModel.joinRoom() },
                            colors = ButtonDefaults.buttonColors(
                                backgroundColor = MaterialTheme.colors.primary
                            )
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Tentar novamente")
                        }
                    }
                }
            }
            
            RoomViewModel.RoomState.CONNECTED -> {
                // Conteúdo principal
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                ) {
                    // Lista de participantes
                    ParticipantsList(
                        participants = participants,
                        connectionQualities = connectionQualities,
                        onParticipantClick = { /* Pode mostrar detalhes ou opções */ }
                    )
                    
                    // Painel de chat com animação
                    AnimatedVisibility(
                        visible = showChat,
                        enter = slideInHorizontally(initialOffsetX = { it }),
                        exit = slideOutHorizontally(targetOffsetX = { it }),
                        modifier = Modifier
                            .fillMaxSize()
                            .align(Alignment.CenterEnd)
                    ) {
                        ChatPanel(
                            messages = chatMessages,
                            onSendMessage = { viewModel.sendChatMessage(it) },
                            onClose = { showChat = false }
                        )
                    }
                    
                    // Dialog do mixer
                    if (showMixer) {
                        AudioMixer(
                            onClose = { showMixer = false }
                        )
                    }
                }
            }
        }
    }
}

/**
 * Lista de participantes da sala
 */
@Composable
fun ParticipantsList(
    participants: List<Participant>,
    connectionQualities: Map<String, SocketManager.ConnectionQuality>,
    onParticipantClick: (Participant) -> Unit
) {
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        item {
            Text(
                text = "Participantes (${participants.size})",
                style = MaterialTheme.typography.h6,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 8.dp)
            )
        }
        
        items(participants) { participant ->
            ParticipantCard(
                participant = participant,
                connectionQuality = connectionQualities[participant.id],
                onClick = { onParticipantClick(participant) }
            )
        }
        
        // Espaço extra no final para evitar que o último item fique atrás da barra inferior
        item {
            Spacer(modifier = Modifier.height(80.dp))
        }
    }
}

/**
 * Cartão de participante individual
 */
@Composable
fun ParticipantCard(
    participant: Participant,
    connectionQuality: SocketManager.ConnectionQuality?,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        elevation = 2.dp,
        backgroundColor = if (participant.isLocal) 
            MaterialTheme.colors.primary.copy(alpha = 0.1f) 
        else 
            MaterialTheme.colors.surface,
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .clip(CircleShape)
                    .background(
                        if (participant.isLocal)
                            MaterialTheme.colors.primary
                        else
                            MaterialTheme.colors.secondary
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = participant.name.first().uppercase(),
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // Informações
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = participant.name + if (participant.isLocal) " (Você)" else "",
                    style = MaterialTheme.typography.subtitle1,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                
                Text(
                    text = participant.instrument ?: "Sem instrumento",
                    style = MaterialTheme.typography.caption,
                    color = MaterialTheme.colors.onSurface.copy(alpha = 0.6f)
                )
            }
            
            // Indicador de estado
            ConnectionQualityIndicator(
                userId = participant.id,
                showText = false,
                size = com.mesadigital.ui.components.ConnectionIndicatorSize.SMALL
            )
            
            // Indicador de áudio
            Icon(
                imageVector = if (participant.hasAudio) Icons.Default.Mic else Icons.Default.MicOff,
                contentDescription = null,
                tint = if (participant.hasAudio) MaterialTheme.colors.primary else Color.Red,
                modifier = Modifier.padding(start = 8.dp)
            )
        }
    }
}
